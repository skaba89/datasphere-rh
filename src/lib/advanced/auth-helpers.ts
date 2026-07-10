import { NextResponse } from 'next/server'
import { getSession } from '@/app/api/auth/login/route'
import { can, type Permission } from './rbac'
import { db } from '@/lib/db'

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

/**
 * Récupère le contexte d'entreprise depuis la session utilisateur.
 * En mode démo (non authentifié), utilise la première société disponible.
 *
 * Retourne soit { companyId, user } en cas de succès,
 * soit { error: NextResponse } en cas d'échec (401 ou 404).
 */
export async function getCompanyContext(request: Request): Promise<
  | { companyId: string; user: RequestUser | null; error?: undefined }
  | { error: NextResponse; companyId?: undefined; user?: undefined }
> {
  const user = getUserFromRequest(request)

  // Si l'utilisateur est authentifié et a une société, l'utiliser
  if (user?.companyId) {
    return { companyId: user.companyId, user }
  }

  // Mode démo : récupérer la première société disponible
  try {
    const company = await db.company.findFirst({ orderBy: { createdAt: 'asc' } })
    if (!company) {
      return {
        error: NextResponse.json(
          { error: 'Aucune société configurée. Initialisez la base avec les données de démo.' },
          { status: 404 }
        ),
      }
    }
    return { companyId: company.id, user }
  } catch (err) {
    console.error('getCompanyContext error:', err)
    return {
      error: NextResponse.json(
        { error: 'Erreur de base de données' },
        { status: 500 }
      ),
    }
  }
}
