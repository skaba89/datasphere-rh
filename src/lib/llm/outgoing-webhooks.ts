import { db } from '@/lib/db'

/**
 * Webhooks sortants — notifie des URLs externes quand des événements IA se produisent.
 *
 * Événements disponibles :
 *  - workflow.completed    : un workflow (prédéfini ou custom) a terminé
 *  - workflow.failed       : un workflow a échoué
 *  - generation.saved      : une génération IA a été sauvegardée
 *  - rag.document_indexed  : un document a été indexé dans le RAG
 *  - llm.budget_alert      : alerte de budget IA
 *  - llm.rate_limit_hit    : rate limit atteint
 */

export interface OutgoingWebhookPayload {
  event: string
  companyId: string
  timestamp: string
  data: Record<string, any>
}

/**
 * Déclenche tous les webhooks sortants écoutant un événement donné.
 */
export async function triggerOutgoingWebhooks(payload: OutgoingWebhookPayload): Promise<{
  triggered: number
  success: number
  failed: number
}> {
  try {
    const configs = await db.outgoingWebhook.findMany({
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

    await Promise.all(matching.map(async (config) => {
      const start = Date.now()
      let httpStatus: number | null = null
      let ok = false

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const res = await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-DataSphere-Event': payload.event,
            'X-DataSphere-Signature': config.secret || '',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeout)
        httpStatus = res.status
        ok = res.ok
      } catch {
        httpStatus = null
        ok = false
      }

      // Met à jour les statistiques
      await db.outgoingWebhook.update({
        where: { id: config.id },
        data: {
          lastTriggered: new Date(),
          lastStatus: httpStatus,
          triggerCount: { increment: 1 },
          ...(ok ? { successCount: { increment: 1 } } : { failCount: { increment: 1 } }),
        },
      })

      if (ok) success++
      else failed++
    }))

    return { triggered: matching.length, success, failed }
  } catch (error) {
    console.error('triggerOutgoingWebhooks error:', error)
    return { triggered: 0, success: 0, failed: 0 }
  }
}

// ━━━ Événements prédéfinis ━━━

export const OUTGOING_WEBHOOK_EVENTS = [
  { event: 'workflow.completed', label: 'Workflow terminé', description: 'Un workflow IA a terminé son exécution' },
  { event: 'workflow.failed', label: 'Workflow échoué', description: 'Un workflow IA a échoué' },
  { event: 'generation.saved', label: 'Génération sauvegardée', description: 'Une génération IA a été sauvegardée' },
  { event: 'rag.document_indexed', label: 'Document indexé RAG', description: 'Un document a été indexé dans la base RAG' },
  { event: 'llm.budget_alert', label: 'Alerte budget IA', description: 'Le budget IA a atteint un seuil critique' },
  { event: 'llm.rate_limit_hit', label: 'Rate limit atteint', description: 'Le rate limiting a bloqué un appel IA' },
  { event: 'employee.created', label: 'Employé créé', description: 'Un nouvel employé a été créé' },
  { event: 'expense.submitted', label: 'Note de frais soumise', description: 'Une note de frais a été soumise' },
  { event: '*', label: 'Tous les événements', description: 'Recevoir tous les événements (joker)' },
]
