import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'
import { checkNextAuthSecret } from '@/lib/security'

/**
 * GET /api/security-dashboard
 *
 * Tableau de bord de sécurité pour les administrateurs.
 * Retourne :
 * - Statut des variables d'environnement
 * - Statistiques de connexion (24h, 7j)
 * - Tentatives échouées récentes
 * - Sessions actives
 * - Utilisateurs (actifs, inactifs, sans société)
 * - Audits récents
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(user.role)) {
      return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 })
    }

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // 1. Vérifications de configuration
    const checks: Array<{ name: string; status: 'ok' | 'warning' | 'error'; message: string }> = []

    const secretCheck = checkNextAuthSecret()
    checks.push({
      name: 'NEXTAUTH_SECRET',
      status: secretCheck.valid ? 'ok' : 'error',
      message: secretCheck.message,
    })

    checks.push({
      name: 'DATABASE_URL',
      status: process.env.DATABASE_URL ? 'ok' : 'error',
      message: process.env.DATABASE_URL ? 'Configuré' : 'Non configuré',
    })

    try {
      await db.$queryRaw`SELECT 1`
      checks.push({ name: 'Connexion BDD', status: 'ok', message: 'Base accessible' })
    } catch {
      checks.push({ name: 'Connexion BDD', status: 'error', message: 'Erreur connexion' })
    }

    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    checks.push({
      name: 'HTTPS',
      status: protocol === 'https' ? 'ok' : 'warning',
      message: protocol === 'https' ? 'Connexion sécurisée' : 'HTTPS non détecté',
    })

    // 2. Statistiques de connexion
    const [
      totalUsers,
      activeUsers,
      usersWithoutCompany,
      activeSessions,
      logins24h,
      failedAttempts24h,
      lockedAccounts,
      recentFailedAttempts,
      recentAudits,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { active: true } }),
      db.user.count({ where: { companyId: null } }),
      db.session.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
      db.loginAttempt.count({ where: { success: true, createdAt: { gt: last24h } } }),
      db.loginAttempt.count({ where: { success: false, createdAt: { gt: last24h } } }),
      // Comptes verrouillés (5+ échecs dans les 15 dernières minutes)
      db.loginAttempt.groupBy({
        by: ['email'],
        where: { success: false, createdAt: { gt: new Date(now.getTime() - 15 * 60 * 1000) } },
        _count: { _all: true },
        having: { _count: { _all: { gte: 5 } } },
      }),
      db.loginAttempt.findMany({
        where: { success: false, createdAt: { gt: last24h } },
        select: { email: true, ipAddress: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.auditLog.findMany({
        where: { createdAt: { gt: last24h } },
        select: { action: true, userId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    // 3. Résumé
    const summary = {
      ok: checks.filter(c => c.status === 'ok').length,
      warnings: checks.filter(c => c.status === 'warning').length,
      errors: checks.filter(c => c.status === 'error').length,
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      summary,
      checks,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          withoutCompany: usersWithoutCompany,
        },
        sessions: {
          active: activeSessions,
        },
        logins: {
          successful24h: logins24h,
          failed24h: failedAttempts24h,
          lockedAccounts: lockedAccounts.length,
          lockedEmails: lockedAccounts.map(l => ({ email: l.email, attempts: l._count._all })),
        },
        recentFailedAttempts,
        recentAudits: recentAudits.map(a => ({
          action: a.action,
          user: a.userId,
          time: a.createdAt,
        })),
      },
    })
  } catch (error: any) {
    console.error('GET /api/security-dashboard error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération', detail: error?.message },
      { status: 500 }
    )
  }
}
