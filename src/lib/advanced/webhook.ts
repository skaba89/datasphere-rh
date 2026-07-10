import { db } from '@/lib/db'

export interface WebhookPayload {
  event: string // contract.renewed | certificate.revoked | model.trained | ...
  module: 'CONTRACTS_MGMT' | 'BLOCKCHAIN' | 'PREDICTIVE' | 'DATA_GOVERNANCE'
  data: Record<string, any>
  timestamp: string
  companyId: string
}

/**
 * Déclenche tous les webhooks actifs écoutant un événement donné.
 * Persiste chaque livraison (succès/échec) dans WebhookDelivery.
 * Ne lève jamais d'erreur (fail-silent) — les webhooks sont best-effort.
 */
export async function triggerWebhooks(payload: WebhookPayload) {
  try {
    const configs = await db.webhookConfig.findMany({
      where: { companyId: payload.companyId, isActive: true },
    })

    if (configs.length === 0) return { triggered: 0, success: 0, failed: 0 }

    const matching = configs.filter(c => {
      try {
        const events = JSON.parse(c.events) as string[]
        return events.includes(payload.event) || events.includes('*')
      } catch {
        return false
      }
    })

    let success = 0, failed = 0
    const payloadStr = JSON.stringify(payload)

    await Promise.all(matching.map(async (config) => {
      const start = Date.now()
      let httpStatus: number | null = null
      let ok = false
      let errorMsg: string | null = null

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.secret ? { 'X-Webhook-Secret': config.secret } : {}),
          },
          body: payloadStr,
          signal: controller.signal,
        })
        clearTimeout(timeout)
        httpStatus = res.status
        ok = res.ok
        if (!ok) errorMsg = `HTTP ${res.status}`
      } catch (e: any) {
        errorMsg = e?.name === 'AbortError' ? 'Timeout (5s)' : (e?.message || 'Erreur réseau')
      }

      const durationMs = Date.now() - start

      // Persistance de la livraison
      try {
        await db.webhookDelivery.create({
          data: {
            companyId: payload.companyId,
            webhookId: config.id,
            webhookName: config.name,
            event: payload.event,
            payload: payloadStr,
            httpStatus,
            ok,
            errorMsg,
            durationMs,
          },
        })
      } catch (e) {
        console.error('WebhookDelivery create error:', e)
      }

      // Mise à jour lastTriggered
      try {
        await db.webhookConfig.update({ where: { id: config.id }, data: { lastTriggered: new Date() } })
      } catch {}

      if (ok) success++
      else failed++
    }))

    return { triggered: matching.length, success, failed }
  } catch (error) {
    console.error('triggerWebhooks error:', error)
    return { triggered: 0, success: 0, failed: 0 }
  }
}

/**
 * Récupère l'historique des livraisons d'un webhook.
 */
export async function getWebhookDeliveries(webhookId: string, limit = 50) {
  return db.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { deliveredAt: 'desc' },
    take: Math.min(limit, 200),
  })
}

/**
 * Récupère la file d'attente des retries (livraisons échouées) pour une société.
 * Retourne les livraisons échouées (ok = false) les plus récentes,
 * triées par date décroissante, limitées à `limit` entrées.
 */
export async function getRetryQueue(companyId: string, limit = 100) {
  return db.webhookDelivery.findMany({
    where: {
      companyId,
      ok: false,
    },
    orderBy: { deliveredAt: 'desc' },
    take: Math.min(limit, 500),
    select: {
      id: true,
      webhookId: true,
      webhookName: true,
      event: true,
      httpStatus: true,
      errorMsg: true,
      durationMs: true,
      deliveredAt: true,
    },
  })
}
