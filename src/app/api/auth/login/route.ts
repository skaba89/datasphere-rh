import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, SESSION_COOKIE, SESSION_DURATION_MS } from '@/lib/session'

// Re-export getSession pour rétrocompatibilité (autres fichiers l'importent depuis ici)
export { getSession } from '@/lib/session'

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

    // Créer la session en base de données
    const token = await createSession(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      request
    )

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

    // Cookie HTTP-only — secure en production
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000, // 24h (en secondes)
      path: '/',
    })

    return response
  } catch (error) {
    console.error('POST /api/auth/login error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
