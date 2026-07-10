import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// GET /api/analytics-live — flux SSE (Server-Sent Events) pour analytics temps réel
// Le navigateur peut s'abonner avec `new EventSource('/api/analytics-live')`.
// Émet un événement toutes les 5 secondes avec les KPIs live.
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const companyId = ctx.companyId

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // En-tête initial
      controller.enqueue(encoder.encode(': connected\n\n'))

      const sendEvent = async () => {
        try {
          const data = await computeLiveMetrics(companyId)
          const payload = `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        } catch (e) {
          // Si la connexion est fermée, le controller va throw — on ignore
        }
      }

      // Envoie immédiatement
      await sendEvent()

      // Puis toutes les 5 secondes
      const interval = setInterval(sendEvent, 5000)

      // Quand le client ferme la connexion
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // désactive buffering nginx
    },
  })
}

/**
 * Calcule les métriques temps réel à partir de la base.
 */
async function computeLiveMetrics(companyId: string) {
  const now = new Date()
  const last5min = new Date(now.getTime() - 5 * 60 * 1000)
  const last1h = new Date(now.getTime() - 60 * 60 * 1000)
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Comptages parallèles
  const [
    auditLast5min, auditLast1h, auditLast24h,
    webhooksLast5min, webhooksLast1h, webhooksLast24h,
    retriesPending,
    notifsUnread,
    contractsActifs, contractsExpiringSoon,
    certsActifs,
    trainingsLast24h,
  ] = await Promise.all([
    db.advancedAuditLog.count({ where: { companyId, createdAt: { gte: last5min } } }),
    db.advancedAuditLog.count({ where: { companyId, createdAt: { gte: last1h } } }),
    db.advancedAuditLog.count({ where: { companyId, createdAt: { gte: last24h } } }),
    db.webhookDelivery.count({ where: { companyId, deliveredAt: { gte: last5min } } }),
    db.webhookDelivery.count({ where: { companyId, deliveredAt: { gte: last1h } } }),
    db.webhookDelivery.count({ where: { companyId, deliveredAt: { gte: last24h } } }),
    db.webhookRetry.count({ where: { companyId, status: { in: ['PENDING', 'RETRYING'] } } }),
    db.notification.count({ where: { companyId, channel: 'IN_APP', status: { not: 'LU' } } }),
    db.contractSupplier.count({ where: { companyId, status: 'ACTIF' } }),
    db.contractSupplier.count({ where: { companyId, status: 'EXPIRE_BIENTOT' } }),
    db.certificate.count({ where: { companyId, status: 'ACTIVE' } }),
    db.modelTraining.count({ where: { companyId, createdAt: { gte: last24h } } }),
  ])

  // Activité par minute (10 dernières minutes)
  const last10min = new Date(now.getTime() - 10 * 60 * 1000)
  const recentAuditLogs = await db.advancedAuditLog.findMany({
    where: { companyId, createdAt: { gte: last10min } },
    select: { createdAt: true, module: true, action: true },
  })

  // Grouper par minute
  const activityByMinute: Array<{ minute: string; count: number }> = []
  for (let i = 9; i >= 0; i--) {
    const start = new Date(now.getTime() - i * 60 * 1000)
    const end = new Date(now.getTime() - (i - 1) * 60 * 1000)
    const count = recentAuditLogs.filter(l => l.createdAt >= start && l.createdAt < end).length
    activityByMinute.push({
      minute: start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      count,
    })
  }

  return {
    timestamp: now.toISOString(),
    companyId,
    activity: {
      audit: { last5min: auditLast5min, last1h: auditLast1h, last24h: auditLast24h },
      webhooks: { last5min: webhooksLast5min, last1h: webhooksLast1h, last24h: webhooksLast24h },
      retriesPending,
      notifsUnread,
    },
    inventory: {
      contracts: { actifs: contractsActifs, expiringSoon: contractsExpiringSoon },
      certificates: { actifs: certsActifs },
      trainings: { last24h: trainingsLast24h },
    },
    activityByMinute,
  }
}
