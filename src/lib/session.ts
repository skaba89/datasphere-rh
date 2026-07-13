import { db } from '@/lib/db'
import crypto from 'crypto'

export const SESSION_COOKIE = 'dsrh-session'
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 heures

export interface SessionData {
  userId: string
  email: string
  name: string
  role: string
  companyId: string | null
}

/**
 * Crée une nouvelle session en base de données et retourne le token.
 * Utilisé par la route /api/auth/login après vérification du mot de passe.
 */
export async function createSession(
  user: { id: string; email: string; name: string; role: string; companyId: string | null },
  request?: Request
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS)

  // Extraire IP et User-Agent si request fournie
  let ipAddress: string | null = null
  let userAgent: string | null = null
  if (request) {
    const forwarded = request.headers.get('x-forwarded-for')
    ipAddress = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
    userAgent = request.headers.get('user-agent') || null
  }

  await db.session.create({
    data: {
      token,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      companyId: user.companyId,
      ipAddress,
      userAgent,
      expiresAt,
    },
  })

  return token
}

/**
 * Récupère une session valide depuis la base de données.
 * Retourne null si : token invalide, session expirée, ou session révoquée.
 * Nettoie automatiquement les sessions expirées.
 */
export async function getSession(token: string): Promise<SessionData | null> {
  if (!token) return null

  try {
    const session = await db.session.findUnique({
      where: { token },
    })

    if (!session) return null
    if (session.revokedAt) return null
    if (new Date() > session.expiresAt) {
      // Session expirée — la supprimer
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }

    return {
      userId: session.userId,
      email: session.userEmail,
      name: session.userName,
      role: session.userRole,
      companyId: session.companyId,
    }
  } catch (error) {
    console.error('getSession error:', error)
    return null
  }
}

/**
 * Révoque une session (déconnexion).
 * Marque la session comme révoquée plutôt que de la supprimer (pour audit).
 */
export async function revokeSession(token: string): Promise<void> {
  if (!token) return
  try {
    await db.session.update({
      where: { token },
      data: { revokedAt: new Date() },
    })
  } catch {
    // Session déjà supprimée ou inexistante — ignorer
  }
}

/**
 * Nettoie les sessions expirées (à appeler périodiquement via cron).
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await db.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
    return result.count
  } catch {
    return 0
  }
}

/**
 * Récupère le token de session depuis les cookies d'une requête.
 */
export function getTokenFromRequest(request: Request): string | null {
  // Parser manuellement les cookies (compatible tous environnements)
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce((acc, c) => {
    const [key, ...valParts] = c.trim().split('=')
    acc[key] = valParts.join('=')
    return acc
  }, {} as Record<string, string>)

  return cookies[SESSION_COOKIE] || null
}
