import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { checkRateLimit, recordLoginAttempt, getIpAddress } from '@/lib/security'

/**
 * POST /api/auth/forgot-password
 *
 * Demande de réinitialisation de mot de passe.
 * - Vérifie que l'email existe (sans révéler si oui ou non pour éviter l'énumération)
 * - Crée un token de reset (valide 1h)
 * - En mode démo (pas de service email), retourne le token dans la réponse
 * - En production, le token serait envoyé par email
 *
 * Body: { email }
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const ipAddress = getIpAddress(request)

    // Rate limiting (5 demandes / 15 min par email)
    const rateLimit = await checkRateLimit(email, ipAddress)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    // Chercher l'utilisateur
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, name: true, active: true },
    })

    // Pour des raisons de sécurité, on retourne toujours le même message
    // (évite l'énumération de comptes)
    const genericResponse = {
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    }

    if (!user || !user.active) {
      // Enregistrer la tentative (pour rate limiting)
      await recordLoginAttempt(email, ipAddress, false, request.headers.get('user-agent'))
      return NextResponse.json(genericResponse)
    }

    // Créer le token de reset
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 heure

    await db.passwordReset.create({
      data: {
        email: email.toLowerCase(),
        token,
        userId: user.id,
        expiresAt,
        ipAddress,
      },
    })

    // Invalider les anciens tokens non utilisés pour cet email
    await db.passwordReset.updateMany({
      where: {
        email: email.toLowerCase(),
        usedAt: null,
        token: { not: token },
      },
      data: { usedAt: new Date() },
    })

    // Enregistrer le succès
    await recordLoginAttempt(email, ipAddress, true, request.headers.get('user-agent'))

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'user',
        entityId: user.id,
        userId: user.email,
        diff: JSON.stringify({ after: { requestedAt: new Date().toISOString() } }),
      },
    })

    // En mode démo (pas d'email configuré), retourner le token
    // En production, envoyer l'email avec le lien de reset
    const emailEnabled = !!process.env.EMAIL_FROM
    if (!emailEnabled) {
      return NextResponse.json({
        ...genericResponse,
        // En démo, on retourne le token pour tester
        _demoToken: token,
        _demoResetUrl: `/auth/reset-password?token=${token}`,
      })
    }

    // TODO: Envoyer l'email avec le service (Resend, SendGrid, etc.)
    // await sendEmail(user.email, 'Réinitialisation mot de passe', resetUrl)

    return NextResponse.json(genericResponse)
  } catch (error: any) {
    console.error('POST /api/auth/forgot-password error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la demande' },
      { status: 500 }
    )
  }
}
