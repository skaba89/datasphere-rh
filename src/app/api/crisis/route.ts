import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      plans: [
        { id: 'p1', name: 'Pandémie / Épidémie', type: 'SANTE', severity: 'CRITIQUE', status: 'A_JOUR', lastUpdate: '2026-06-01', owner: 'DG', steps: 8, completedSteps: 8, desc: 'Plan de continuité en cas d\'épidémie (type COVID-19, Ebola). Télétravail généralisé, mesures sanitaires, communication.' },
        { id: 'p2', name: 'Coupure électrique prolongée', type: 'INFRASTRUCTURE', severity: 'HAUTE', status: 'A_JOUR', lastUpdate: '2026-05-15', owner: 'IT', steps: 5, completedSteps: 5, desc: 'Générateurs de secours, bascule cloud, procédure sauvegarde manuelle.' },
        { id: 'p3', name: 'Cyberattaque / Ransomware', type: 'CYBER', severity: 'CRITIQUE', status: 'A_JOUR', lastUpdate: '2026-06-10', owner: 'IT', steps: 10, completedSteps: 9, desc: 'Isolation systèmes, restauration backups, notification autorités, communication employés et clients.' },
        { id: 'p4', name: 'Incendie locaux Conakry', type: 'PHYSIQUE', severity: 'HAUTE', status: 'A_VERIFIER', lastUpdate: '2026-03-01', owner: 'Admin', steps: 6, completedSteps: 4, desc: 'Évacuation, sauvegarde documents critiques, relocalisation temporaire, assurance.' },
        { id: 'p5', name: 'Instabilité politique', type: 'SECURITE', severity: 'MOYENNE', status: 'A_JOUR', lastUpdate: '2026-06-15', owner: 'DG', steps: 7, completedSteps: 7, desc: 'Sécurisation employés, télétravail, communication ambassades, plan rapatriement expatriés.' },
        { id: 'p6', name: 'Défaillance fournisseur critique', type: 'OPERATIONS', severity: 'MOYENNE', status: 'A_VERIFIER', lastUpdate: '2026-02-01', owner: 'DAF', steps: 4, completedSteps: 2, desc: 'Identification fournisseurs alternatifs, stocks tampon, procédure bascule.' },
      ],
      contacts: [
        { id: 'c1', name: 'Cellule crise', role: 'Coordination générale', phone: '+224 622 000 000', email: 'crise@demo.gn', available: '24/7' },
        { id: 'c2', name: 'Mamadou Diallo', role: 'Responsable DG', phone: '+224 622 000 001', email: 'dg@demo.gn', available: '24/7' },
        { id: 'c3', name: 'Aïssatou Camara', role: 'RH / Communication', phone: '+224 622 000 002', email: 'rh@demo.gn', available: 'Heures ouvrées' },
        { id: 'c4', name: 'Pompiers Conakry', role: 'Urgence externe', phone: '117', email: null, available: '24/7' },
        { id: 'c5', name: 'Hôpital Ignace Deen', role: 'Urgence médicale', phone: '+224 664 000 000', email: null, available: '24/7' },
      ],
      drills: [
        { id: 'd1', name: 'Exercice évacuation incendie', date: '2026-06-20', participants: 9, result: 'REUSSI', duration: '4 min', notes: 'Tous les employés évacués en moins de 5 minutes' },
        { id: 'd2', name: 'Simulation cyberattaque', date: '2026-05-10', participants: 4, result: 'REUSSI', duration: '2h', notes: 'Restauration backups testée, temps de récupération 45 min' },
        { id: 'd3', name: 'Test télétravail généralisé', date: '2026-04-15', participants: 9, result: 'PARTIEL', duration: '1 jour', notes: '2 employés sans connexion stable, solution 4G déployée' },
      ],
    }
    return NextResponse.json(data)
  } catch (error) { console.error('GET /api/crisis error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
