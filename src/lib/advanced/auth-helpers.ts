import { NextResponse } from 'next/server'
import { getSession } from '@/app/api/auth/login/route'
import { can, type Permission } from './rbac'

export interface RequestUser {
  userId: string
  email: string
  name: string
  role: string
  companyId: string | null
}

/**
 * Récupère l'utilisateur depuis le cookie de session.
 * Retourne null si non authentifié (mode démo ou accès public).
 */
export function getUserFromRequest(request: Request): RequestUser | null {
  const token = request.cookies.get('dsrh-session')?.value
  if (!token) return null
  const session = getSession(token)
  if (!session) return null
  return {
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    companyId: session.companyId,
  }
}

/**
 * Vérifie une permission pour une requête.
 * En mode démo (user null), autorise tout.
 * Sinon, vérifie via RBAC.
 *
 * Retourne null si autorisé, sinon une NextResponse d'erreur 403.
 */
export function checkPermission(request: Request, permission: Permission): NextResponse | null {
  const user = getUserFromRequest(request)
  if (!user) return null // mode démo
  if (can(user.role, permission)) return null
  return NextResponse.json(
    { error: 'Permission refusée', required: permission, role: user.role },
    { status: 403 }
  )
}
