import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '2026-07'

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    // Données brutes
    const employees = await db.employee.findMany({
      where: { statut: 'actif' },
      include: {
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
        leaveRequests: true,
        payslips: true,
      },
    })

    const candidates = await db.candidate.findMany({ where: { companyId: company.id } })
    const documents = await db.document.findMany({ where: { companyId: company.id } })
    const leaves = await db.leaveRequest.findMany()

    // KPIs Direction Générale
    const totalEmployees = employees.length
    const totalPayroll = employees.reduce((sum, e) => {
      const c = e.contracts[0]
      return sum + (c?.salaireBase || 0)
    }, 0)
    const totalCharges = totalPayroll * 0.18 // approximation
    const totalCost = totalPayroll + totalCharges

    // Répartition par type de contrat
    const contractTypes = employees.reduce((acc, e) => {
      const t = e.contracts[0]?.type || 'CDI'
      acc[t] = (acc[t] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Répartition par service/poste
    const byDepartment = employees.reduce((acc, e) => {
      const poste = e.poste || 'Autre'
      const dept = poste.includes('Directeur') ? 'Direction' :
                   poste.includes('RH') || poste.includes('Ressources') ? 'RH' :
                   poste.includes('Compt') ? 'Finance' :
                   poste.includes('Développeur') || poste.includes('Dev') ? 'IT' :
                   poste.includes('Commercial') || poste.includes('Vente') ? 'Commercial' :
                   poste.includes('Infirm') || poste.includes('Médecin') ? 'Santé' :
                   'Autre'
      acc[dept] = acc[dept] || { count: 0, payroll: 0 }
      acc[dept].count++
      acc[dept].payroll += e.contracts[0]?.salaireBase || 0
      return acc
    }, {} as Record<string, { count: number; payroll: number }>)

    // Évolution masse salariale (6 derniers mois - simulé à partir du salaire actuel)
    const monthlyEvolution = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mois = d.toLocaleString('fr-FR', { month: 'short' })
      // Variation simulée -5% à +5%
      const variation = 1 - (i * 0.015)
      monthlyEvolution.push({
        mois: mois.charAt(0).toUpperCase() + mois.slice(1),
        masseSalariale: Math.round(totalPayroll * variation),
        charges: Math.round(totalCharges * variation),
        cout: Math.round(totalCost * variation),
      })
    }

    // Top 5 des employés par coût
    const topEmployees = employees
      .map(e => ({
        nom: `${e.nom} ${e.prenoms}`,
        poste: e.poste,
        salaire: e.contracts[0]?.salaireBase || 0,
        cout: (e.contracts[0]?.salaireBase || 0) * 1.18,
      }))
      .sort((a, b) => b.cout - a.cout)
      .slice(0, 5)

    // Turn-over (simulé)
    const turnover = 3.2 // % annuel

    // Provision congés payés (30 jours × salaire journalier × effectif)
    const dailyAvg = totalPayroll / 30 / totalEmployees
    const provisionConges = dailyAvg * 30 * totalEmployees * 0.5 // 50% non pris

    // Recrutement
    const recruitmentStats = {
      total: candidates.length,
      nouveau: candidates.filter(c => c.status === 'NOUVEAU').length,
      entretien: candidates.filter(c => c.status === 'EN_ENTRETIEN').length,
      offre: candidates.filter(c => c.status === 'OFFRE').length,
      accepte: candidates.filter(c => c.status === 'ACCEPTE').length,
      refuse: candidates.filter(c => c.status === 'REFUSE').length,
    }

    // Documents coffre-fort
    const documentsStats = {
      total: documents.length,
      confidentiels: documents.filter(d => d.confidential).length,
      signs: documents.filter(d => d.signedAt).length,
      parCategorie: documents.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    // Alertes DG
    const alerts: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }> = []
    if (turnover > 5) alerts.push({ severity: 'warning', message: `Turn-over élevé: ${turnover}%` })
    if (recruitmentStats.nouveau > 0) alerts.push({ severity: 'info', message: `${recruitmentStats.nouveau} candidature(s) à traiter` })
    const cddCount = contractTypes['CDD'] || 0
    if (cddCount > 0) alerts.push({ severity: 'info', message: `${cddCount} CDD en cours — anticiper les renouvellements` })

    return NextResponse.json({
      period,
      company: { name: company.raisonSociale, ville: company.ville },
      kpis: {
        totalEmployees,
        totalPayroll,
        totalCharges,
        totalCost,
        turnover,
        provisionConges,
        avgSalary: totalEmployees > 0 ? totalPayroll / totalEmployees : 0,
      },
      contractTypes,
      byDepartment,
      monthlyEvolution,
      topEmployees,
      recruitmentStats,
      documentsStats,
      alerts,
    })
  } catch (error) {
    console.error('GET /api/reports error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
