import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, SESSION_COOKIE, SESSION_DURATION_MS } from '@/lib/session'

// Re-export getSession pour rétrocompatibilité (autres fichiers l'importent depuis ici)
export { getSession } from '@/lib/session'

export async function POST(request: Request) {
  // Diagnostic step 1: Parse body
  let email: string, password: string
  try {
    const body = await request.json()
    email = body.email
    password = body.password
  } catch (parseError: any) {
    return NextResponse.json(
      { error: 'Body parse error', step: 'parse', detail: parseError?.message },
      { status: 400 }
    )
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
  }

  // Diagnostic step 2: DB connection
  let user: any
  try {
    user = await db.user.findUnique({
      where: { email },
      include: { company: true },
    })
  } catch (dbError: any) {
    console.error('DB error in login:', dbError)
    return NextResponse.json(
      {
        error: 'Erreur base de données',
        step: 'db_query',
        code: dbError?.code,
        message: dbError?.message,
      },
      { status: 500 }
    )
  }

  if (!user || !user.active) {
    return NextResponse.json({ error: 'Utilisateur introuvable ou inactif' }, { status: 401 })
  }

  // Diagnostic step 3: bcrypt
  let isValid: boolean
  try {
    isValid = await bcrypt.compare(password, user.passwordHash)
  } catch (bcryptError: any) {
    console.error('Bcrypt error:', bcryptError)
    return NextResponse.json(
      { error: 'Erreur vérification mot de passe', step: 'bcrypt', detail: bcryptError?.message },
      { status: 500 }
    )
  }

  if (!isValid) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  // Diagnostic step 4: Update last login
  try {
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
  } catch (updateError: any) {
    console.error('Update lastLogin error:', updateError)
    // Non-blocking, continue
  }

  // Diagnostic step 5: Audit log
  try {
    await db.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'user',
        entityId: user.id,
        userId: user.email,
        diff: JSON.stringify({ after: { email: user.email, role: user.role } }),
      },
    })
  } catch (auditError: any) {
    console.error('Audit log error:', auditError)
    // Non-blocking, continue
  }

  // Diagnostic step 6: Create session
  let token: string
  try {
    token = await createSession(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      request
    )
  } catch (sessionError: any) {
    console.error('Session creation error:', sessionError)
    return NextResponse.json(
      {
        error: 'Erreur création session',
        step: 'create_session',
        code: sessionError?.code,
        message: sessionError?.message,
      },
      { status: 500 }
    )
  }

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
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  })

  return response
}
