import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ models: [], insights: [] })

    const employees = await db.employee.findMany({
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 }, evaluations: true, objectives: true, leaveRequests: true, timeEntries: true }
    })

    // Predictive models
    const models = employees.map(e => {
      const contract = e.contracts[0]
      const salary = contract?.salaireBase || 0
      const yearsExp = Math.floor((Date.now() - new Date(e.dateEmbauche).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      const lastEval = e.evaluations[0]?.globalRating || 3
      const objAchieved = e.objectives.filter(o => o.status === 'ATTEINT').length
      const absences = e.timeEntries.filter(t => t.status === 'ABSENT').length
      const leaves = e.leaveRequests.length

      // Turnover risk score (0-100)
      let turnoverRisk = 30
      if (contract?.type === 'CDD') turnoverRisk += 25
      if (lastEval <= 2) turnoverRisk += 15
      if (absences > 5) turnoverRisk += 10
      if (yearsExp < 2) turnoverRisk += 10
      if (leaves > 3) turnoverRisk += 5
      turnoverRisk = Math.min(turnoverRisk, 95)

      // Performance prediction (0-100)
      let perfPrediction = 50
      perfPrediction += lastEval * 8
      perfPrediction += Math.min(objAchieved * 5, 20)
      if (yearsExp > 3) perfPrediction += 10
      if (absences < 3) perfPrediction += 5
      perfPrediction = Math.min(perfPrediction, 98)

      // Salary growth prediction
      const salaryGrowth = yearsExp > 5 ? 8 : yearsExp > 2 ? 5 : 3

      // Promotion probability
      let promotionProb = 15
      if (lastEval >= 4) promotionProb += 30
      if (yearsExp >= 3) promotionProb += 20
      if (objAchieved >= 3) promotionProb += 15
      promotionProb = Math.min(promotionProb, 90)

      return {
        employeeId: e.id, name: `${e.nom} ${e.prenoms}`, poste: e.poste, sexe: e.sexe,
        turnoverRisk, turnoverLabel: turnoverRisk >= 70 ? 'CRITIQUE' : turnoverRisk >= 50 ? 'ÉLEVÉ' : turnoverRisk >= 30 ? 'MODÉRÉ' : 'FAIBLE',
        perfPrediction, perfLabel: perfPrediction >= 80 ? 'EXCELLENT' : perfPrediction >= 60 ? 'BON' : perfPrediction >= 40 ? 'MOYEN' : 'À SURVEILLER',
        salaryGrowth, promotionProb,
        factors: {
          contractType: contract?.type || 'CDI', yearsExp, lastEval, absences, leaves, objAchieved
        }
      }
    }).sort((a, b) => b.turnoverRisk - a.turnoverRisk)

    const insights = [
      { type: 'TURNOVER', title: `${models.filter(m => m.turnoverRisk >= 50).length} employés à risque de départ`, severity: models.filter(m => m.turnoverRisk >= 70).length > 0 ? 'CRITICAL' : 'WARNING', confidence: 82 },
      { type: 'PROMOTION', title: `${models.filter(m => m.promotionProb >= 60).length} candidats promotion identifiés`, severity: 'INFO', confidence: 75 },
      { type: 'PERFORMANCE', title: `${models.filter(m => m.perfPrediction >= 80).length} top performers prévus`, severity: 'INFO', confidence: 78 },
    ]

    return NextResponse.json({ models, insights })
  } catch (error) { console.error('GET /api/predictive error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
