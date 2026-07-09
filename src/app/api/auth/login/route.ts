import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Simple session store (in-memory for dev; in production use Redis)
const sessions = new Map<string, { userId: string; email: string; name: string; role: string; companyId: string | null; createdAt: number }>()

// Export pour réutilisation
export function getSession(token: string) {
  const session = sessions.get(token)
  if (!session) return null
  // Expiration 24h
  if (Date.now() - session.createdAt > 24 * 60 * 60 * 1000) {
    sessions.delete(token)
    return null
  }
  return session
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { company: true },
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Utilisateur introuvable ou inactif' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'user',
        entityId: user.id,
        userId: user.email,
        diff: JSON.stringify({ after: { email: user.email, role: user.role } }),
      },
    })

    // Create session token
    const token = crypto.randomBytes(32).toString('hex')
    sessions.set(token, {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      createdAt: Date.now(),
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
      },
    })

    // Cookie HTTP-only
    response.cookies.set('dsrh-session', token, {
      httpOnly: true,
      secure: false, // dev only — true in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24h
      path: '/',
    })

    return response
  } catch (error) {
    console.error('POST /api/auth/login error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
