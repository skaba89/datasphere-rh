import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession, SESSION_COOKIE, SESSION_DURATION_MS } from '@/lib/session'
import {
  checkRateLimit,
  recordLoginAttempt,
  getIpAddress,
} from '@/lib/security'

// Re-export getSession pour rétrocompatibilité (autres fichiers l'importent depuis ici)
export { getSession } from '@/lib/session'

export async function POST(request: Request) {
  // Étape 1 : Parser le body
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

  // Étape 2 : Extraire IP et User-Agent
  const ipAddress = getIpAddress(request)
  const userAgent = request.headers.get('user-agent') || null

  // Étape 3 : Vérifier le rate limiting AVANT toute vérification de mot de passe
  try {
    const rateLimit = await checkRateLimit(email, ipAddress)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.reason || 'Trop de tentatives. Réessayez plus tard.',
          remainingAttempts: 0,
          lockoutExpiresAt: rateLimit.lockoutExpiresAt,
        },
        { status: 429 }
      )
    }
  } catch (rlError: any) {
    console.error('Rate limit check error:', rlError)
    // En cas d'erreur du rate limiter, on continue (fail-open pour ne pas bloquer)
  }

  // Étape 4 : Vérifier l'utilisateur en base
  let user: any
  try {
    user = await db.user.findUnique({
      where: { email },
      include: { company: true },
    })
  } catch (dbError: any) {
    console.error('DB error in login:', dbError)
    return NextResponse.json(
      { error: 'Erreur base de données', step: 'db_query', code: dbError?.code, message: dbError?.message },
      { status: 500 }
    )
  }

  if (!user || !user.active) {
    // Enregistrer l'échec
    await recordLoginAttempt(email, ipAddress, false, userAgent)
    return NextResponse.json({ error: 'Utilisateur introuvable ou inactif' }, { status: 401 })
  }

  // Étape 5 : Vérifier le mot de passe
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
    // Enregistrer l'échec
    await recordLoginAttempt(email, ipAddress, false, userAgent)
    // Recalculer les tentatives restantes
    const rateLimit = await checkRateLimit(email, ipAddress)
    return NextResponse.json(
      {
        error: 'Mot de passe incorrect',
        remainingAttempts: rateLimit.remainingAttempts,
      },
      { status: 401 }
    )
  }

  // Étape 6 : Enregistrer le succès
  await recordLoginAttempt(email, ipAddress, true, userAgent)

  // Étape 7 : Mettre à jour lastLogin
  try {
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
  } catch (updateError: any) {
    console.error('Update lastLogin error:', updateError)
  }

  // Étape 8 : Audit log
  try {
    await db.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'user',
        entityId: user.id,
        userId: user.email,
        diff: JSON.stringify({ after: { email: user.email, role: user.role, ip: ipAddress } }),
      },
    })
  } catch (auditError: any) {
    console.error('Audit log error:', auditError)
  }

  // Étape 9 : Créer la session
  let token: string
  try {
    token = await createSession(
      { id: user.id, email: user.email, name: user.name, role: user.role, companyId: user.companyId },
      request
    )
  } catch (sessionError: any) {
    console.error('Session creation error:', sessionError)
    return NextResponse.json(
      { error: 'Erreur création session', step: 'create_session', code: sessionError?.code, message: sessionError?.message },
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
