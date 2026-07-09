import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const projects = [
      { id: 'p1', name: 'Digitalisation paie CNSS', desc: 'Migration vers calcul paie automatisé conforme CNSS Guinée', status: 'EN_COURS', progress: 75, startDate: '2026-03-01', endDate: '2026-09-30', budget: 15000000, spent: 9500000, manager: 'Fatoumata Touré', team: 4, milestones: [{ name: 'Analyse requirements', done: true }, { name: 'Développement moteur', done: true }, { name: 'Tests conformité', done: true }, { name: 'Déploiement', done: false }, { name: 'Formation utilisateurs', done: false }] },
      { id: 'p2', name: 'Portail employé mobile', desc: 'Application mobile React Native pour portail employé', status: 'EN_COURS', progress: 40, startDate: '2026-05-15', endDate: '2026-12-15', budget: 25000000, spent: 8000000, manager: 'Ousmane Bah', team: 3, milestones: [{ name: 'Maquettes UX', done: true }, { name: 'Auth + sécurité', done: true }, { name: 'Portail self-service', done: false }, { name: 'Push notifications', done: false }, { name: 'Release stores', done: false }] },
      { id: 'p3', name: 'Audit conformité RGPD', desc: 'Mise en conformité RGPD + loi données Guinée', status: 'TERMINE', progress: 100, startDate: '2026-01-01', endDate: '2026-04-30', budget: 5000000, spent: 4800000, manager: 'Aïssatou Camara', team: 2, milestones: [{ name: 'Audit initial', done: true }, { name: 'Registre traitements', done: true }, { name: 'Politiques données', done: true }, { name: 'Formation équipe', done: true }] },
      { id: 'p4', name: 'Refonte organigramme', desc: 'Restructuration équipes suite croissance', status: 'PLANIFIE', progress: 10, startDate: '2026-08-01', endDate: '2026-11-30', budget: 8000000, spent: 500000, manager: 'Mamadou Diallo', team: 5, milestones: [{ name: 'Diagnostic', done: true }, { name: 'Proposition', done: false }, { name: 'Validation DG', done: false }, { name: 'Communication', done: false }] },
    ]
    return NextResponse.json(projects)
  } catch (error) { console.error('GET /api/rh-projects error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
