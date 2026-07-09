import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ contracts: [], stats: { total: 0, actifs: 0, montantTotal: 0, alertes: 0 } })

    const contractsRaw = await db.contractSupplier.findMany({
      where: { companyId: company.id },
      orderBy: { endDate: 'asc' },
    })

    const today = new Date()

    // Recalcul du statut basé sur la date d'échéance
    const contracts = contractsRaw.map(c => {
      const endDate = new Date(c.endDate)
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
      let status = c.status
      if (c.status === 'ACTIF' && daysLeft < 0) status = 'EXPIRE'
      else if (c.status === 'ACTIF' && daysLeft <= 30) status = 'EXPIRE_BIENTOT'

      return {
        id: c.id,
        supplier: c.supplier,
        type: c.type,
        title: c.title,
        amount: c.amount,
        currency: c.currency,
        startDate: c.startDate,
        endDate: c.endDate,
        status,
        renewalDate: c.renewalDate,
        owner: c.owner,
        clauses: c.clauses,
        alerts: c.alerts,
        desc: c.description || '',
        txHash: c.txHash,
      }
    })

    const stats = {
      total: contracts.length,
      actifs: contracts.filter(c => c.status === 'ACTIF').length,
      montantTotal: contracts.reduce((s, c) => s + c.amount, 0),
      alertes: contracts.reduce((s, c) => s + (c.alerts || 0), 0),
    }
    return NextResponse.json({ contracts, stats })
  } catch (error) {
    console.error('GET /api/contracts-mgmt error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
