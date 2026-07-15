import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'
import { getTokenFromRequest } from '@/lib/session'
import { validatePassword, checkRateLimit, recordLoginAttempt, getIpAddress } from '@/lib/security'

/**
 * POST /api/auth/change-password
 *
 * Permet à l'utilisateur connecté de changer son mot de passe.
 * - Vérifie l'ancien mot de passe
 * - Valide le nouveau mot de passe (politique de sécurité)
 * - Empêche la réutilisation de l'ancien mot de passe
 * - Applique le rate limiting (5 tentatives / 15 min)
 * - Révoque toutes les sessions après changement (sécurité)
 *
 * Body: { currentPassword, newPassword }
 */
export async function POST(request: Request) {
  try {
    // 1. Authentification requise
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    // 2. Parser le body
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Ancien et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    // 3. Rate limiting (5 tentatives / 15 min)
    const ipAddress = getIpAddress(request)
    const rateLimit = await checkRateLimit(user.email, ipAddress)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: rateLimit.reason || 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    // 4. Récupérer l'utilisateur avec son hash
    const dbUser = await db.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, passwordHash: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // 5. Vérifier l'ancien mot de passe
    const isCurrentValid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!isCurrentValid) {
      await recordLoginAttempt(user.email, ipAddress, false, request.headers.get('user-agent'))
      return NextResponse.json(
        { error: 'Ancien mot de passe incorrect', remainingAttempts: rateLimit.remainingAttempts - 1 },
        { status: 401 }
      )
    }

    // 6. Valider le nouveau mot de passe
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Nouveau mot de passe non conforme', details: validation.errors },
        { status: 400 }
      )
    }

    // 7. Empêcher la réutilisation de l'ancien mot de passe
    const isSameAsOld = await bcrypt.compare(newPassword, dbUser.passwordHash)
    if (isSameAsOld) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit être différent de l\'ancien' },
        { status: 400 }
      )
    }

    // 8. Hacher et sauvegarder le nouveau mot de passe
    const newHash = await bcrypt.hash(newPassword, 10)
    await db.user.update({
      where: { id: dbUser.id },
      data: { passwordHash: newHash },
    })

    // 9. Enregistrer le succès
    await recordLoginAttempt(user.email, ipAddress, true, request.headers.get('user-agent'))

    // 10. Audit log
    await db.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGE',
        entityType: 'user',
        entityId: dbUser.id,
        userId: user.email,
        diff: JSON.stringify({ after: { changedAt: new Date().toISOString() } }),
      },
    })

    // 11. Révoquer toutes les sessions existantes (forcer reconnexion)
    // Garde seulement la session actuelle pour que l'utilisateur reste connecté
    const currentToken = getTokenFromRequest(request)
    if (currentToken) {
      await db.session.updateMany({
        where: {
          userId: dbUser.id,
          revokedAt: null,
          token: { not: currentToken },
        },
        data: { revokedAt: new Date() },
      })
    } else {
      // Si pas de token (ne devrait pas arriver), révoquer tout
      await db.session.updateMany({
        where: { userId: dbUser.id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès. Les autres sessions ont été déconnectées.',
    })
  } catch (error: any) {
    console.error('POST /api/auth/change-password error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe', detail: error?.message },
      { status: 500 }
    )
  }
}
