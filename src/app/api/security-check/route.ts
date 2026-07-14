import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'
import { checkNextAuthSecret } from '@/lib/security'

/**
 * GET /api/security-check
 * Retourne l'état de sécurité de l'application (admin seulement).
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Réservé au super administrateur' }, { status: 403 })
    }

    const checks: Array<{ name: string; status: 'ok' | 'warning' | 'error'; message: string }> = []

    // 1. NEXTAUTH_SECRET
    const secretCheck = checkNextAuthSecret()
    checks.push({
      name: 'NEXTAUTH_SECRET',
      status: secretCheck.valid ? 'ok' : 'error',
      message: secretCheck.message,
    })

    // 2. DATABASE_URL
    const dbUrl = process.env.DATABASE_URL
    checks.push({
      name: 'DATABASE_URL',
      status: dbUrl ? 'ok' : 'error',
      message: dbUrl ? 'Configuré' : 'Non configuré',
    })

    // 3. Connexion base de données
    try {
      await db.$queryRaw`SELECT 1`
      checks.push({
        name: 'Connexion BDD',
        status: 'ok',
        message: 'Base de données accessible',
      })
    } catch {
      checks.push({
        name: 'Connexion BDD',
        status: 'error',
        message: 'Impossible de se connecter à la base de données',
      })
    }

    // 4. HTTPS
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    checks.push({
      name: 'HTTPS',
      status: protocol === 'https' ? 'ok' : 'warning',
      message: protocol === 'https' ? 'Connexion sécurisée' : 'HTTPS non détecté',
    })

    // 5. Sessions en base
    try {
      const activeSessions = await db.session.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      })
      checks.push({
        name: 'Sessions',
        status: 'ok',
        message: `${activeSessions} session(s) active(s)`,
      })
    } catch {
      checks.push({
        name: 'Sessions',
        status: 'warning',
        message: 'Impossible de vérifier les sessions',
      })
    }

    // 6. Utilisateurs sans société
    try {
      const orphanUsers = await db.user.count({
        where: { companyId: null },
      })
      checks.push({
        name: 'Utilisateurs',
        status: orphanUsers > 0 ? 'warning' : 'ok',
        message: orphanUsers > 0
          ? `${orphanUsers} utilisateur(s) sans société rattachée`
          : 'Tous les utilisateurs ont une société',
      })
    } catch {
      // ignore
    }

    // 7. Audit log récent
    try {
      const recentLogs = await db.auditLog.count({
        where: {
          createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      })
      checks.push({
        name: 'Audit',
        status: recentLogs > 0 ? 'ok' : 'warning',
        message: `${recentLogs} action(s) journalisée(s) dans les dernières 24h`,
      })
    } catch {
      // ignore
    }

    const summary = {
      ok: checks.filter(c => c.status === 'ok').length,
      warnings: checks.filter(c => c.status === 'warning').length,
      errors: checks.filter(c => c.status === 'error').length,
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary,
      checks,
    })
  } catch (error: any) {
    console.error('GET /api/security-check error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification', detail: error?.message },
      { status: 500 }
    )
  }
}
