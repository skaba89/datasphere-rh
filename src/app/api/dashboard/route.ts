import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const companyId = ctx.companyId

    const employees = await db.employee.findMany({
      where: { companyId },
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        leaveRequests: {
          where: {
            statut: 'APPROUVE',
            OR: [
              { dateDebut: { contains: '2026-07' } },
              { dateFin: { contains: '2026-07' } },
            ],
          },
        },
      },
    })

    const totalEmployees = employees.length
    const activeEmployees = employees.filter(e => e.statut === 'actif').length
    const onLeaveToday = employees.filter(e => e.leaveRequests.length > 0).length

    const pendingLeaves = await db.leaveRequest.count({
      where: {
        statut: 'EN_ATTENTE',
        employee: { companyId },
      },
    })

    // Calcul masse salariale mensuelle
    const monthlyPayroll = employees.reduce((sum, e) => {
      const contract = e.contracts && e.contracts.length > 0 ? e.contracts[0] : null
      return sum + (contract?.salaireBase || 0)
    }, 0)

    // Charges patronales approximatives (17% CNSS + 4% VF + 1% apprent + 3% form + 2% AT = 27%)
    const monthlyCharges = monthlyPayroll * 0.27

    const cdiCount = employees.filter(e =>
      e.contracts && e.contracts.length > 0 && e.contracts[0].type === 'CDI'
    ).length
    const cddCount = employees.filter(e =>
      e.contracts && e.contracts.length > 0 && e.contracts[0].type === 'CDD'
    ).length
    const stageCount = employees.filter(e =>
      e.contracts && e.contracts.length > 0 && e.contracts[0].type === 'STAGE'
    ).length

    // Alertes
    const alerts: Array<{ id: string; type: string; message: string; severity: 'info' | 'warning' | 'critical' }> = []
    if (pendingLeaves > 0) {
      alerts.push({
        id: '1',
        type: 'leaves',
        message: `${pendingLeaves} demande(s) de congé en attente de validation`,
        severity: 'warning',
      })
    }

    // CDD finissant dans 60 jours
    const cddEnding = employees.filter(e => {
      if (!e.contracts || e.contracts.length === 0) return false
      const c = e.contracts[0]
      if (c.type !== 'CDD' || !c.dateFin) return false
      const daysLeft = Math.ceil((new Date(c.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysLeft > 0 && daysLeft <= 60
    })
    cddEnding.forEach(e => {
      const c = e.contracts![0]
      alerts.push({
        id: `cdd-${e.id}`,
        type: 'contracts',
        message: `CDD de ${e.nom} ${e.prenoms} se termine le ${new Date(c.dateFin!).toLocaleDateString('fr-FR')}`,
        severity: 'warning',
      })
    })

    if (monthlyPayroll > 0) {
      alerts.push({
        id: 'payroll',
        type: 'payroll',
        message: `Masse salariale du mois : ${new Intl.NumberFormat('fr-FR').format(monthlyPayroll)} GNF`,
        severity: 'info',
      })
    }

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      pendingLeaves,
      monthlyPayroll,
      monthlyCharges,
      cdiCount,
      cddCount,
      stageCount,
      alerts,
      companyId,
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
