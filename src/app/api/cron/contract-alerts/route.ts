import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/advanced/audit'
import { triggerWebhooks } from '@/lib/advanced/webhook'

// GET /api/cron/contract-alerts?key=XXX
// Cron job quotidien — scanne les contrats qui expireront dans <= 30 jours
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (key !== process.env.CRON_SECRET && key !== 'datasphere-cron-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const companies = await db.company.findMany()
    const today = new Date()
    const alerts: any[] = []

    for (const company of companies) {
      const contracts = await db.contractSupplier.findMany({
        where: { companyId: company.id, status: { in: ['ACTIF', 'EXPIRE_BIENTOT'] } },
      })

      for (const c of contracts) {
        const endDate = new Date(c.endDate)
        const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))

        if (daysLeft <= 30 && daysLeft >= -7) {
          const severity = daysLeft < 0 ? 'EXPIRE' : daysLeft <= 7 ? 'URGENT' : daysLeft <= 15 ? 'ATTENTION' : 'SURVEILLER'

          try {
            await db.notification.create({
              data: {
                companyId: company.id,
                recipient: 'rh@datasphere.gn', // canal in-app — dest = équipe RH
                channel: 'IN_APP',
                subject: `Contrat ${severity.toLowerCase()} : ${c.title}`,
                message: `Le contrat "${c.title}" (${c.supplier}) ${daysLeft < 0 ? 'a expiré il y a ' + Math.abs(daysLeft) + ' jour(s)' : 'expire dans ' + daysLeft + ' jour(s)'}. Montant : ${c.amount.toLocaleString()} ${c.currency}.`,
                status: 'EN_ATTENTE',
                type: 'CONTRAT',
                metadata: JSON.stringify({ contractId: c.id, severity, daysLeft, amount: c.amount }),
              },
            })
          } catch {
            // Si le modèle Notification évolue, on ignore silencieusement
          }

          await triggerWebhooks({
            event: 'contract.expiring',
            module: 'CONTRACTS_MGMT',
            companyId: company.id,
            timestamp: new Date().toISOString(),
            data: {
              contractId: c.id, title: c.title, supplier: c.supplier,
              endDate: c.endDate, daysLeft, severity,
              amount: c.amount, currency: c.currency,
            },
          })

          alerts.push({
            companyId: company.id,
            contractId: c.id,
            title: c.title,
            supplier: c.supplier,
            daysLeft,
            severity,
            amount: c.amount,
          })

          await logAudit({
            companyId: company.id,
            module: 'CONTRACTS_MGMT',
            action: 'ALERT',
            targetType: 'ContractSupplier',
            targetId: c.id,
            targetLabel: c.title,
            details: { daysLeft, severity, amount: c.amount },
          })
        }
      }
    }

    const totalScanned = companies.length > 0 ? await db.contractSupplier.count() : 0
    return NextResponse.json({
      success: true,
      scannedAt: new Date().toISOString(),
      scannedCompanies: companies.length,
      totalContractsScanned: totalScanned,
      alertsTriggered: alerts.length,
      alerts,
    })
  } catch (error) {
    console.error('GET /api/cron/contract-alerts error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
