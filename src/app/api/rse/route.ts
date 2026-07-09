import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      kpis: {
        carbonFootprint: 42.5,
        carbonPerEmployee: 4.7,
        recyclingRate: 68,
        greenEnergy: 35,
        socialActions: 8,
        localHiring: 87,
        genderPayGap: -2,
        trainingHours: 320,
      },
      pillars: [
        { id: 'env1', name: 'Bilan carbone', pillar: 'ENVIRONNEMENT', value: '42.5 tCO₂', target: '35 tCO₂', progress: 72, status: 'EN_COURS', desc: 'Émission annuelle estimée (énergie, transport, déchets)' },
        { id: 'env2', name: 'Énergie verte', pillar: 'ENVIRONNEMENT', value: '35%', target: '50%', progress: 70, status: 'EN_COURS', desc: 'Part d\'électricité issue de panneaux solaires' },
        { id: 'env3', name: 'Recyclage déchets', pillar: 'ENVIRONNEMENT', value: '68%', target: '80%', progress: 85, status: 'EN_COURS', desc: 'Taux de déchets recyclés (papier, plastique, électronique)' },
        { id: 'env4', name: 'Flotte verte', pillar: 'ENVIRONNEMENT', value: '1 véhicule', target: '3 véhicules', progress: 33, status: 'EN_COURS', desc: 'Véhicules hybrides/électriques dans la flotte' },
        { id: 'soc1', name: 'Recrutement local', pillar: 'SOCIAL', value: '87%', target: '90%', progress: 97, status: 'EN_COURS', desc: 'Pourcentage d\'employés recrutés localement en Guinée' },
        { id: 'soc2', name: 'Écart salarial H/F', pillar: 'SOCIAL', value: '-2%', target: '0%', progress: 95, status: 'EN_COURS', desc: 'Écart de rémunération hommes/femmes (négatif = femmes mieux payées à poste égal)' },
        { id: 'soc3', name: 'Heures de formation', pillar: 'SOCIAL', value: '320h', target: '400h', progress: 80, status: 'EN_COURS', desc: 'Heures de formation par an et par employé' },
        { id: 'soc4', name: 'Actions sociales', pillar: 'SOCIAL', value: '8 actions', target: '10 actions', progress: 80, status: 'EN_COURS', desc: 'Actions sociales organisées (CSE, mécénat, soutien local)' },
        { id: 'gov1', name: 'Éthique & conformité', pillar: 'GOUVERNANCE', value: '100%', target: '100%', progress: 100, status: 'ATTEINT', desc: 'Conformité Code du travail, CNSS, RGPD' },
        { id: 'gov2', name: 'Transparence reporting', pillar: 'GOUVERNANCE', value: 'Annuel', target: 'Semestriel', progress: 50, status: 'EN_COURS', desc: 'Fréquence publication rapport RSE' },
        { id: 'gov3', name: 'Fournisseurs éthiques', pillar: 'GOUVERNANCE', value: '72%', target: '90%', progress: 80, status: 'EN_COURS', desc: 'Fournisseurs signataires charte éthique' },
      ],
      actions: [
        { id: 'a1', name: 'Installation panneaux solaires bureau Conakry', pillar: 'ENVIRONNEMENT', date: '2026-03-15', impact: 'Réduction 30% facture électricité', budget: 15000000 },
        { id: 'a2', name: 'Partenariat ONG reforestation Boké', pillar: 'ENVIRONNEMENT', date: '2026-05-01', impact: '500 arbres plantés', budget: 3000000 },
        { id: 'a3', name: 'Programme bourses scolaires Guinée', pillar: 'SOCIAL', date: '2026-09-01', impact: '15 étudiants soutenus', budget: 7500000 },
        { id: 'a4', name: 'Don matériel informatique écoles', pillar: 'SOCIAL', date: '2026-06-01', impact: '5 ordinateurs à 3 écoles', budget: 2000000 },
        { id: 'a5', name: 'Audit éthique fournisseurs', pillar: 'GOUVERNANCE', date: '2026-04-01', impact: '18 fournisseurs audités', budget: 5000000 },
        { id: 'a6', name: 'Charte anti-corruption signée', pillar: 'GOUVERNANCE', date: '2026-01-15', impact: '100% employés formés', budget: 1000000 },
      ],
    }
    return NextResponse.json(data)
  } catch (error) { console.error('GET /api/rse error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
