import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'
import bcrypt from 'bcryptjs'

/**
 * PATCH /api/users/[id]
 * Modifie un utilisateur (role, active, name).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const body = await request.json()
    const { name, role, active, resetPassword } = body

    // Vérifier que l'utilisateur existe
    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (active !== undefined) updateData.active = active

    // Valider et mettre à jour le rôle
    if (role !== undefined) {
      const validRoles = ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH', 'MANAGER', 'COMPTABLE', 'EMPLOYE']
      if (validRoles.includes(role)) {
        updateData.role = role
      }
    }

    // Reset mot de passe si demandé
    if (resetPassword) {
      const tempPassword = generateTempPassword()
      updateData.passwordHash = await bcrypt.hash(tempPassword, 10)
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, active: true },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        entityType: 'user',
        entityId: id,
        userId: currentUser.email,
        diff: JSON.stringify({ after: updateData, resetPassword: !!resetPassword }),
      },
    })

    // Si reset mot de passe, révoquer toutes les sessions
    if (resetPassword) {
      await db.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }

    return NextResponse.json({
      success: true,
      user: updated,
      ...(resetPassword ? { tempPassword } : {}),
    })
  } catch (error: any) {
    console.error('PATCH /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la modification' }, { status: 500 })
  }
}

/**
 * DELETE /api/users/[id]
 * Désactive un utilisateur (soft delete — on ne supprime jamais pour préserver l'audit).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    // Empêcher l'auto-suppression
    if (id === currentUser.userId) {
      return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    // Désactiver au lieu de supprimer (préserve l'audit)
    await db.user.update({
      where: { id },
      data: { active: false },
    })

    // Révoquer toutes les sessions
    await db.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DEACTIVATE_USER',
        entityType: 'user',
        entityId: id,
        userId: currentUser.email,
        diff: JSON.stringify({ after: { active: false } }),
      },
    })

    return NextResponse.json({ success: true, message: 'Utilisateur désactivé' })
  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error)
    return NextResponse.json({ error: 'Erreur lors de la désactivation' }, { status: 500 })
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pwd = ''
  for (let i = 0; i < 12; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}
