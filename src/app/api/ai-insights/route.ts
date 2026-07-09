import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    // Generate AI insights dynamically based on data
    const employees = await db.employee.findMany({
      include: {
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
        evaluations: { orderBy: { createdAt: 'desc' }, take: 1 },
        leaveRequests: true,
        timeEntries: true,
      },
    })
    const objectives = await db.objective.findMany()
    const compliance = await db.complianceItem.findMany({ where: { companyId: company.id } })
    const surveys = await db.survey.findMany({
      where: { companyId: company.id },
      include: { responses: true },
    })

    const insights: Array<{
      category: string; title: string; description: string; severity: string;
      confidence: number; recommendation: string; affectedEmployeeId?: string | null
    }> = []

    // 1. Turnover risk - CDD ending soon
    employees.forEach(e => {
      const c = e.contracts[0]
      if (c?.type === 'CDD' && c.dateFin) {
        const daysLeft = Math.ceil((new Date(c.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        if (daysLeft > 0 && daysLeft <= 90) {
          insights.push({
            category: 'TURNOVER_RISK',
            title: `CDD de ${e.nom} ${e.prenoms} se termine dans ${daysLeft} jours`,
            description: `Contrat CDD arrivant à échéance le ${c.dateFin}. Risque de perte de compétences et coût de remplacement.`,
            severity: daysLeft <= 30 ? 'CRITICAL' : 'WARNING',
            confidence: 95,
            recommendation: daysLeft <= 30
              ? 'URGENT : Proposer un CDI ou planifier le remplacement immédiatement.'
              : 'Anticiper : Discuter des perspectives de renouvellement ou conversion en CDI.',
            affectedEmployeeId: e.id,
          })
        }
      }
    })

    // 2. Promotion candidates - high performance
    employees.forEach(e => {
      const lastEval = e.evaluations[0]
      if (lastEval && lastEval.globalRating >= 4) {
        const yearsExp = Math.floor((Date.now() - new Date(e.dateEmbauche).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (yearsExp >= 2) {
          insights.push({
            category: 'PROMOTION',
            title: `${e.nom} ${e.prenoms} : candidat à promotion`,
            description: `Évaluation ${lastEval.globalRating}/5, ${yearsExp} ans d'ancienneté. Performance au-dessus de la moyenne.`,
            severity: 'INFO',
            confidence: 80,
            recommendation: `Envisager une promotion ou une évolution vers un poste à responsabilités. Discuter lors du prochain entretien professionnel.`,
            affectedEmployeeId: e.id,
          })
        }
      }
    })

    // 3. Training needs - gaps in objectives
    const partialObjectives = objectives.filter(o => o.status === 'PARTIEL' || o.status === 'NON_ATTEINT')
    if (partialObjectives.length > 0) {
      insights.push({
        category: 'TRAINING_NEED',
        title: `${partialObjectives.length} objectif(s) non atteints`,
        description: `${partialObjectives.length} objectifs en statut PARTIEL ou NON_ATTEINT sur ${objectives.length} total. Formation recommandée.`,
        severity: 'WARNING',
        confidence: 85,
        recommendation: 'Planifier des formations ciblées pour les employés concernés. Vérifier les gaps de compétences dans le module Compétences.',
      })
    }

    // 4. Compliance risks
    const overdueCompliance = compliance.filter(c => c.status === 'EN_RETARD')
    overdueCompliance.forEach(c => {
      insights.push({
        category: 'COMPLIANCE_RISK',
        title: `Conformité en retard : ${c.title}`,
        description: `Cet item de conformité est en retard. Risque juridique et financier pour l'entreprise.`,
        severity: 'CRITICAL',
        confidence: 100,
        recommendation: `Régulariser immédiatement. Responsable : ${c.responsible || 'non assigné'}.`,
      })
    })

    // 5. Budget optimization
    const totalPayroll = employees.reduce((s, e) => s + (e.contracts[0]?.salaireBase || 0), 0)
    const charges = totalPayroll * 0.18
    if (charges > 4000000) {
      insights.push({
        category: 'BUDGET_OPTIMIZATION',
        title: 'Optimisation des charges patronales',
        description: `Charges patronales mensuelles estimées à ${new Intl.NumberFormat('fr-FR').format(Math.round(charges))} GNF (18% de la masse salariale).`,
        severity: 'INFO',
        confidence: 70,
        recommendation: 'Vérifier l éligibilité aux dispositifs d\'allègement de charges. Optimiser la structure salariale (primes exonérées vs imposables).',
      })
    }

    // 6. Absenteeism alert
    const totalEntries = employees.reduce((s, e) => s + e.timeEntries.length, 0)
    const absentEntries = employees.reduce((s, e) => s + e.timeEntries.filter(te => te.status === 'ABSENT').length, 0)
    const absenteeRate = totalEntries > 0 ? (absentEntries / totalEntries) * 100 : 0
    if (absenteeRate > 15) {
      insights.push({
        category: 'COMPLIANCE_RISK',
        title: `Taux d'absentéisme élevé : ${absenteeRate.toFixed(1)}%`,
        description: `Le taux d'absentéisme dépasse 15%, seuil d'alerte. ${absentEntries} absences sur ${totalEntries} pointages.`,
        severity: 'WARNING',
        confidence: 90,
        recommendation: 'Analyser les causes (santé, motivation, conditions de travail). Mettre en place des entretiens de recadrage.',
      })
    }

    // 7. NPS low
    const npsSurveys = surveys.filter(s => s.type === 'NPS')
    npsSurveys.forEach(s => {
      const scores = s.responses.map(r => r.score)
      if (scores.length > 0) {
        const nps = Math.round(((scores.filter(x => x >= 9).length - scores.filter(x => x <= 6).length) / scores.length) * 100)
        if (nps < 0) {
          insights.push({
            category: 'TURNOVER_RISK',
            title: `NPS employé négatif : ${nps}`,
            description: `L'enquête "${s.title}" montre un NPS de ${nps}. Plus de détracteurs que de promoteurs.`,
            severity: 'CRITICAL',
            confidence: 88,
            recommendation: 'Mener des entretiens individuels pour identifier les causes d insatisfaction. Prioriser les actions d amélioration.',
          })
        }
      }
    })

    return NextResponse.json(insights)
  } catch (error) {
    console.error('GET /api/ai-insights error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
