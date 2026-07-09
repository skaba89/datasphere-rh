import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ templates: [], data: {} })

    const [employees, payslips, leaves, expenses, candidates, trainings] = await Promise.all([
      db.employee.findMany({ include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 } } }),
      db.payslip.findMany(),
      db.leaveRequest.findMany(),
      db.expenseReport.findMany({ where: { companyId: company.id } }),
      db.candidate.findMany({ where: { companyId: company.id } }),
      db.training.findMany({ where: { companyId: company.id } }),
    ])

    const templates = [
      { id: 't1', name: 'Rapport effectif mensuel', desc: 'Évolution effectif par département', category: 'EFFECTIF', columns: ['Mois', 'Effectif', 'Recrutements', 'Départs', 'Turnover %'], icon: 'Users' },
      { id: 't2', name: 'Rapport masse salariale', desc: 'Évolution masse salariale et charges', category: 'PAIE', columns: ['Mois', 'Brut', 'Charges', 'Total', 'Variation %'], icon: 'Wallet' },
      { id: 't3', name: 'Rapport congés', desc: 'Synthèse congés par employé', category: 'CONGES', columns: ['Employé', 'Acquis', 'Pris', 'Disponible', 'En attente'], icon: 'Calendar' },
      { id: 't4', name: 'Rapport formation', desc: 'Suivi inscriptions et completion', category: 'FORMATION', columns: ['Formation', 'Inscrits', 'Complétés', 'Taux %', 'Coût'], icon: 'GraduationCap' },
      { id: 't5', name: 'Rapport absentéisme', desc: 'Analyse des absences par service', category: 'PRESENCE', columns: ['Employé', 'Jours présence', 'Jours absence', 'Taux %'], icon: 'Clock' },
      { id: 't6', name: 'Rapport recrutement', desc: 'Pipeline candidats et time-to-hire', category: 'RECRUTEMENT', columns: ['Poste', 'Candidats', 'Entretiens', 'Offres', 'Pourvue'], icon: 'Briefcase' },
    ]

    const data = {
      employeeCount: employees.length,
      payrollTotal: employees.reduce((s, e) => s + (e.contracts[0]?.salaireBase || 0), 0),
      leaveCount: leaves.length,
      expenseTotal: expenses.reduce((s, e) => s + e.amount, 0),
      candidateCount: candidates.length,
      trainingCount: trainings.length,
    }

    return NextResponse.json({ templates, data })
  } catch (error) { console.error('GET /api/custom-reports error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
