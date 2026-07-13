import { NextResponse } from 'next/server'
import { cleanupExpiredSessions } from '@/lib/session'
import { db } from '@/lib/db'

/**
 * GET /api/cron/session-cleanup
 * Nettoie les sessions expirées et les anciens logs d'audit (> 90 jours).
 * À appeler quotidiennement via un cron job (Netlify scheduled functions,
 * ou service externe comme cron-job.org, UptimeRobot, etc.)
 *
 * Sécurité : protégé par CRON_SECRET (header Authorization)
 */
export async function GET(request: Request) {
  // Vérifier le secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const results = {
    sessionsCleaned: 0,
    auditLogsCleaned: 0,
    timestamp: new Date().toISOString(),
  }

  try {
    // 1. Nettoyer les sessions expirées
    results.sessionsCleaned = await cleanupExpiredSessions()

    // 2. Nettoyer les sessions révoquées de plus de 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    const revokedResult = await db.session.deleteMany({
      where: {
        revokedAt: { lt: thirtyDaysAgo },
      },
    })
    results.sessionsCleaned += revokedResult.count

    // 3. Nettoyer les logs d'audit de plus de 90 jours (optionnel)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000)
    const auditResult = await db.auditLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    })
    results.auditLogsCleaned = auditResult.count

    console.log('[cron] Session cleanup:', results)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[cron] Session cleanup error:', error)
    return NextResponse.json(
      { error: 'Erreur lors du nettoyage', ...results },
      { status: 500 }
    )
  }
}
