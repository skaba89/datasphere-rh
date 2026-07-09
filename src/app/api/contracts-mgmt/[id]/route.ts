import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/contracts-mgmt/[id] — détail d'un contrat + timeline complète
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const contract = await db.contractSupplier.findUnique({ where: { id } })
    if (!contract) return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })

    // Audit trail filtré sur ce contrat
    const auditLogs = await db.advancedAuditLog.findMany({
      where: { targetType: 'ContractSupplier', targetId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Notifications liées (recherche par metadata.contractId)
    const allNotifs = await db.notification.findMany({
      where: { channel: 'IN_APP', type: 'CONTRAT' },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const linkedNotifs = allNotifs.filter(n => {
      try {
        const meta = JSON.parse(n.metadata || '{}')
        return meta.contractId === id
      } catch { return false }
    })

    // Webhook deliveries liées (recherche par payload.data.contractId)
    const allDeliveries = await db.webhookDelivery.findMany({
      where: { event: { in: ['contract.renewed', 'contract.expiring'] } },
      orderBy: { deliveredAt: 'desc' },
      take: 200,
    })
    const linkedDeliveries = allDeliveries.filter(d => {
      try {
        const p = JSON.parse(d.payload || '{}')
        return p?.data?.contractId === id
      } catch { return false }
    })

    // Construction de la timeline combinée
    const timeline: Array<{
      id: string; type: 'AUDIT' | 'NOTIF' | 'WEBHOOK' | 'CREATION'
      action: string; label: string; date: string; details?: any; severity?: string;
    }> = []

    timeline.push({
      id: `creation-${contract.id}`,
      type: 'CREATION',
      action: 'CRÉATION',
      label: `Contrat créé avec ${contract.supplier}`,
      date: contract.createdAt.toISOString(),
      details: { amount: contract.amount, currency: contract.currency, type: contract.type, startDate: contract.startDate, endDate: contract.endDate },
    })

    for (const l of auditLogs) {
      let details: any = {}
      try { details = JSON.parse(l.details || '{}') } catch {}
      timeline.push({
        id: l.id,
        type: 'AUDIT',
        action: l.action,
        label: l.targetLabel || l.action,
        date: l.createdAt.toISOString(),
        details,
        severity: details.severity,
      })
    }

    for (const n of linkedNotifs) {
      let meta: any = {}
      try { meta = JSON.parse(n.metadata || '{}') } catch {}
      timeline.push({
        id: n.id,
        type: 'NOTIF',
        action: 'NOTIFICATION',
        label: n.subject || 'Notification contrat',
        date: n.createdAt.toISOString(),
        details: { message: n.message, severity: meta.severity, daysLeft: meta.daysLeft },
        severity: meta.severity,
      })
    }

    for (const d of linkedDeliveries) {
      let p: any = {}
      try { p = JSON.parse(d.payload || '{}') } catch {}
      timeline.push({
        id: d.id,
        type: 'WEBHOOK',
        action: 'WEBHOOK',
        label: `Webhook ${d.ok ? '✓' : '✗'} ${d.event}`,
        date: d.deliveredAt.toISOString(),
        details: { httpStatus: d.httpStatus, durationMs: d.durationMs, errorMsg: d.errorMsg, webhookName: d.webhookName },
      })
    }

    // Tri par date décroissante
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Calcul des jours restants
    const today = new Date()
    const endDate = new Date(contract.endDate)
    const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

    return NextResponse.json({
      contract: {
        ...contract,
        daysLeft,
      },
      timeline,
      stats: {
        auditEvents: auditLogs.length,
        notifications: linkedNotifs.length,
        webhooks: linkedDeliveries.length,
        renewals: auditLogs.filter(l => l.action === 'RENEW').length,
        alerts: auditLogs.filter(l => l.action === 'ALERT').length,
      },
    })
  } catch (error) {
    console.error('GET /api/contracts-mgmt/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
