import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { validatePassword } from '@/lib/security'

/**
 * POST /api/auth/reset-password
 *
 * Réinitialise le mot de passe avec un token valide.
 * - Vérifie le token (existe, non expiré, non utilisé)
 * - Valide le nouveau mot de passe
 * - Met à jour le mot de passe
 * - Invalide le token
 * - Révoque toutes les sessions existantes
 *
 * Body: { token, newPassword }
 */
export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    // Valider le nouveau mot de passe
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Mot de passe non conforme', details: validation.errors },
        { status: 400 }
      )
    }

    // Vérifier le token
    const resetRequest = await db.passwordReset.findUnique({
      where: { token },
    })

    if (!resetRequest) {
      return NextResponse.json(
        { error: 'Token invalide' },
        { status: 400 }
      )
    }

    if (resetRequest.usedAt) {
      return NextResponse.json(
        { error: 'Ce lien a déjà été utilisé. Veuillez faire une nouvelle demande.' },
        { status: 400 }
      )
    }

    if (new Date() > resetRequest.expiresAt) {
      return NextResponse.json(
        { error: 'Ce lien a expiré. Veuillez faire une nouvelle demande.' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await db.user.findUnique({
      where: { id: resetRequest.userId || '' },
      select: { id: true, email: true, active: true },
    })

    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'Compte introuvable ou inactif' },
        { status: 400 }
      )
    }

    // Hacher et sauvegarder le nouveau mot de passe
    const newHash = await bcrypt.hash(newPassword, 10)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    })

    // Marquer le token comme utilisé
    await db.passwordReset.update({
      where: { id: resetRequest.id },
      data: { usedAt: new Date() },
    })

    // Révoquer toutes les sessions existantes (sécurité)
    await db.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'PASSWORD_RESET',
        entityType: 'user',
        entityId: user.id,
        userId: user.email,
        diff: JSON.stringify({ after: { resetAt: new Date().toISOString() } }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.',
    })
  } catch (error: any) {
    console.error('POST /api/auth/reset-password error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation' },
      { status: 500 }
    )
  }
}
