import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({})

    // Données agrégées pour analytics
    const employees = await db.employee.findMany({
      include: {
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
        leaveRequests: true,
        timeEntries: true,
      },
    })

    const candidates = await db.candidate.findMany({ where: { companyId: company.id } })
    const trainings = await db.training.findMany({
      where: { companyId: company.id },
      include: { enrollments: true },
    })
    const documents = await db.document.findMany({ where: { companyId: company.id } })

    // 1. Évolution effectif (12 mois - simulé)
    const headcountEvolution = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mois = d.toLocaleString('fr-FR', { month: 'short' })
      // Simuler croissance
      const base = Math.max(3, employees.length - Math.floor(i * 0.5))
      headcountEvolution.push({
        mois: mois.charAt(0).toUpperCase() + mois.slice(1),
        effectif: base,
        recrutements: i % 3 === 0 ? 1 : 0,
        departs: i % 4 === 0 ? 1 : 0,
      })
    }

    // 2. Répartition par tranche d'âge
    const ageGroups = { '<25': 0, '25-35': 0, '36-45': 0, '46-55': 0, '>55': 0 }
    employees.forEach(e => {
      if (!e.dateNaissance) { ageGroups['36-45']++; return }
      const age = Math.floor((Date.now() - new Date(e.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 25) ageGroups['<25']++
      else if (age < 36) ageGroups['25-35']++
      else if (age < 46) ageGroups['36-45']++
      else if (age < 56) ageGroups['46-55']++
      else ageGroups['>55']++
    })

    // 3. Répartition par genre
    const genderDist = {
      M: employees.filter(e => e.sexe === 'M').length,
      F: employees.filter(e => e.sexe === 'F').length,
    }

    // 4. Taux d'absentéisme (basé sur timeEntries)
    const totalEntries = employees.reduce((s, e) => s + e.timeEntries.length, 0)
    const absentEntries = employees.reduce((s, e) => s + e.timeEntries.filter(te => te.status === 'ABSENT').length, 0)
    const absenteeRate = totalEntries > 0 ? (absentEntries / totalEntries) * 100 : 0

    // 5. Performance globale (basée sur objectifs)
    const objectives = await db.objective.findMany()
    const achievedObjectives = objectives.filter(o => o.status === 'ATTEINT').length
    const performanceRate = objectives.length > 0 ? (achievedObjectives / objectives.length) * 100 : 0

    // 6. Turn-over (simulé)
    const turnoverRate = 3.2

    // 7. Coût par employé
    const totalPayroll = employees.reduce((s, e) => s + (e.contracts[0]?.salaireBase || 0), 0)
    const avgCostPerEmployee = employees.length > 0 ? (totalPayroll * 1.18) / employees.length : 0

    // 8. Formation : taux de completion
    const totalEnrollments = trainings.reduce((s, t) => s + t.enrollments.length, 0)
    const completedEnrollments = trainings.reduce((s, t) => s + t.enrollments.filter(e => e.status === 'COMPLETE').length, 0)
    const trainingCompletionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0

    // 9. Recrutement : time-to-hire (simulé)
    const avgTimeToHire = 18 // jours

    // 10. Top départements par effectif
    const deptStats: Record<string, number> = {}
    employees.forEach(e => {
      const poste = e.poste || 'Autre'
      const dept = poste.includes('Directeur') ? 'Direction' :
                   poste.includes('RH') ? 'RH' :
                   poste.includes('Compt') ? 'Finance' :
                   poste.includes('Développeur') ? 'IT' :
                   poste.includes('Commercial') ? 'Commercial' :
                   poste.includes('Infirm') ? 'Santé' : 'Autre'
      deptStats[dept] = (deptStats[dept] || 0) + 1
    })

    return NextResponse.json({
      kpis: {
        totalEmployees: employees.length,
        avgCostPerEmployee,
        absenteeRate,
        performanceRate,
        turnoverRate,
        trainingCompletionRate,
        avgTimeToHire,
        totalCandidates: candidates.length,
        totalTrainings: trainings.length,
        totalDocuments: documents.length,
      },
      headcountEvolution,
      ageGroups,
      genderDist,
      deptStats,
    })
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
