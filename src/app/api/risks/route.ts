import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const risks = [
      { id: 'r1', category: 'JURIDIQUE', title: 'Non-respect délai déclaration CNSS', probability: 'MOYENNE', impact: 'HAUT', score: 12, status: 'EN_COURS', owner: 'Comptable', mitigation: 'Automatisation déclaration via module Comptabilité', deadline: '2026-08-15' },
      { id: 'r2', category: 'TURNOVER', title: 'Départ clé développeur CDD', probability: 'HAUTE', impact: 'HAUT', score: 16, status: 'OUVERT', owner: 'RH', mitigation: 'Proposer CDI + augmentation 10%', deadline: '2026-08-31' },
      { id: 'r3', category: 'CONFORMITE', title: 'Audit sécurité incendie en retard', probability: 'CERTAIN', impact: 'MOYEN', score: 15, status: 'OUVERT', owner: 'Admin', mitigation: 'Reprogrammer audit urgemment', deadline: '2026-07-31' },
      { id: 'r4', category: 'FINANCIER', title: 'Dépassement budget formation', probability: 'MOYENNE', impact: 'MOYEN', score: 9, status: 'SURVEILLANCE', owner: 'DAF', mitigation: 'Prioriser formations obligatoires', deadline: '2026-12-31' },
      { id: 'r5', category: 'RH', title: 'Conflit équipe IT non résolu', probability: 'MOYENNE', impact: 'BAS', score: 6, status: 'EN_COURS', owner: 'Manager', mitigation: 'Médiation programmée', deadline: '2026-07-20' },
      { id: 'r6', category: 'SECURITE', title: 'Accès données sensibles non restreints', probability: 'BASSE', impact: 'TRES_HAUT', score: 10, status: 'OUVERT', owner: 'IT', mitigation: 'Mise en place RBAC strict', deadline: '2026-09-30' },
      { id: 'r7', category: 'JURIDIQUE', title: 'Registre du travail non à jour', probability: 'BASSE', impact: 'MOYEN', score: 4, status: 'RESOLU', owner: 'RH', mitigation: 'Mise à jour effectuée le 30/06', deadline: '2026-06-30' },
    ]
    return NextResponse.json(risks)
  } catch (error) { console.error('GET /api/risks error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
