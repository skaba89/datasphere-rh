import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'
import { validatePassword } from '@/lib/security'
import bcrypt from 'bcryptjs'

/**
 * GET /api/users
 * Liste les utilisateurs de la société de l'utilisateur connecté.
 * Réservé aux SUPER_ADMIN et ADMIN_ENTREPRISE.
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(user.role)) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const users = await db.user.findMany({
      where: user.companyId ? { companyId: user.companyId } : {},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        lastLoginAt: true,
        createdAt: true,
        company: { select: { id: true, raisonSociale: true, sigle: true } },
        _count: { select: { sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * POST /api/users
 * Crée un nouvel utilisateur (admin seulement).
 */
export async function POST(request: Request) {
  try {
    const currentUser = await getUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, role, password, companyId, active } = body

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'Email, nom et mot de passe requis' }, { status: 400 })
    }

    // Valider le mot de passe
    const validation = validatePassword(password)
    if (!validation.valid) {
      return NextResponse.json({ error: 'Mot de passe non conforme', details: validation.errors }, { status: 400 })
    }

    // Vérifier l'unicité de l'email
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 })
    }

    // Valider le rôle
    const validRoles = ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH', 'MANAGER', 'COMPTABLE', 'EMPLOYE']
    const userRole = validRoles.includes(role) ? role : 'EMPLOYE'

    // Déterminer la société
    const targetCompanyId = companyId || currentUser.companyId
    if (!targetCompanyId) {
      return NextResponse.json({ error: 'Aucune société cible' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        role: userRole,
        passwordHash,
        companyId: targetCompanyId,
        active: active !== false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE_USER',
        entityType: 'user',
        entityId: newUser.id,
        userId: currentUser.email,
        diff: JSON.stringify({ after: { email: newUser.email, name: newUser.name, role: newUser.role } }),
      },
    })

    return NextResponse.json({ success: true, user: newUser }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
