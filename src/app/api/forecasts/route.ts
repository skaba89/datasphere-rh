import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const employees = await db.employee.findMany({
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 }, evaluations: true, leaveRequests: true, timeEntries: true },
    })
    const candidates = await db.candidate.findMany({ where: { companyId: company.id } })
    const budgets = await db.budgetItem.findMany({ where: { companyId: company.id } })

    const currentPayroll = employees.reduce((s, e) => s + (e.contracts[0]?.salaireBase || 0), 0)
    const currentCharges = currentPayroll * 0.18
    const turnoverRate = 3.2
    const absenteeRate = employees.reduce((s, e) => s + e.timeEntries.length, 0) > 0
      ? (employees.reduce((s, e) => s + e.timeEntries.filter(te => te.status === 'ABSENT').length, 0) / employees.reduce((s, e) => s + e.timeEntries.length, 0)) * 100
      : 0

    const forecasts = [
      {
        category: 'HEADCOUNT', period: '2026-Q4', predicted: employees.length + 2, confidence: 82, trend: 'UP',
        current: employees.length,
        factors: JSON.stringify(['Croissance activité', 'Ouverture new site Boké', '2 recrutements en cours']),
        label: 'Effectif prévisionnel Q4 2026', unit: 'employés',
      },
      {
        category: 'HEADCOUNT', period: '2027', predicted: employees.length + 6, confidence: 70, trend: 'UP',
        current: employees.length,
        factors: JSON.stringify(['Plan stratégique 2027', 'Expansion régionale', 'Turnover 3.2%']),
        label: 'Effectif prévisionnel 2027', unit: 'employés',
      },
      {
        category: 'PAYROLL', period: '2026-Q4', predicted: Math.round((currentPayroll + 5000000) * 1.02), confidence: 85, trend: 'UP',
        current: currentPayroll,
        factors: JSON.stringify(['Augmentation annuelle 2%', '2 nouvelles embauches', 'Prime fin année']),
        label: 'Masse salariale Q4 2026', unit: 'GNF',
      },
      {
        category: 'PAYROLL', period: '2027', predicted: Math.round(currentPayroll * 1.15), confidence: 72, trend: 'UP',
        current: currentPayroll,
        factors: JSON.stringify(['Croissance effectif +6', 'Augmentations prévues', 'Inflation 5%']),
        label: 'Masse salariale 2027', unit: 'GNF',
      },
      {
        category: 'TURNOVER', period: '2027', predicted: 4.5, confidence: 68, trend: 'UP',
        current: turnoverRate,
        factors: JSON.stringify(['CDD se terminant', 'Marché concurrentiel IT', 'Satisfaction NPS à surveiller']),
        label: 'Taux de turnover 2027', unit: '%',
      },
      {
        category: 'RECRUITMENT', period: '2026-Q4', predicted: 3, confidence: 80, trend: 'UP',
        current: candidates.length,
        factors: JSON.stringify(['2 postes ouverts', 'Cabinet recrutement actif', 'Pipeline candidats 7']),
        label: 'Recrutements prévus Q4 2026', unit: 'personnes',
      },
      {
        category: 'ABSENTEEISM', period: '2026-Q3', predicted: Math.max(absenteeRate - 2, 5), confidence: 65, trend: 'DOWN',
        current: absenteeRate,
        factors: JSON.stringify(['Plan santé entreprise', 'Vaccination grippe', 'Amélioration conditions']),
        label: 'Taux absentéisme Q3 2026', unit: '%',
      },
    ]

    return NextResponse.json(forecasts)
  } catch (error) { console.error('GET /api/forecasts error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
