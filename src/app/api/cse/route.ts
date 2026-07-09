import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      representatives: [
        { id: 'rep1', name: 'Mamadou Bah', role: 'Titulaire CSE', department: 'IT', mandate: '2025-2028', votes: 45 },
        { id: 'rep2', name: 'Aïssatou Diallo', role: 'Titulaire CSE', department: 'RH', mandate: '2025-2028', votes: 42 },
        { id: 'rep3', name: 'Ousmane Camara', role: 'Suppléant CSE', department: 'Commercial', mandate: '2025-2028', votes: 38 },
        { id: 'rep4', name: 'Fatou Bérété', role: 'Titulaire IRP', department: 'Finance', mandate: '2025-2028', votes: 40 },
        { id: 'rep5', name: 'Lamine Sow', role: 'Suppléant IRP', department: 'Production', mandate: '2025-2028', votes: 35 },
      ],
      meetings: [
        { id: 'mt1', date: '2026-07-10', type: 'CSE', title: 'Réunion trimestrielle Q3 2026', status: 'PLANIFIE', agenda: 'Budget social, formations, conditions de travail', attendees: 5 },
        { id: 'mt2', date: '2026-06-05', type: 'IRP', title: 'Réunion mensuelle juin', status: 'TERMINE', agenda: 'Sécurité travail,plaintes, suggestions', attendees: 5 },
        { id: 'mt3', date: '2026-05-10', type: 'CSE', title: 'Réunion trimestrielle Q2 2026', status: 'TERMINE', agenda: 'Œuvres sociales, cantine, transport', attendees: 5 },
      ],
      suggestions: [
        { id: 's1', title: 'Améliorer cantine entreprise', desc: 'Proposer plus de plats locaux et végétariens', author: 'Anonyme', votes: 12, status: 'EN_COURS', category: 'SOCIAL' },
        { id: 's2', title: 'Navette entreprise Boké', desc: 'Mettre en place navette pour employés site Boké', author: 'Ousmane Camara', votes: 8, status: 'EN_ATTENTE', category: 'TRANSPORT' },
        { id: 's3', title: 'Salle de sport bureau', desc: 'Aménager une salle de sport dans les locaux', author: 'Anonyme', votes: 15, status: 'EN_ATTENTE', category: 'WELLNESS' },
        { id: 's4', title: 'Télétravail 3 jours', desc: 'Étendre télétravail à 3 jours/semaine', author: 'Mamadou Bah', votes: 22, status: 'EN_COURS', category: 'ORGANISATION' },
        { id: 's5', title: 'Formation premiers secours', desc: 'Organiser formation SST pour tous', author: 'Fatou Bérété', votes: 18, status: 'RESOLU', category: 'SECURITE' },
      ],
      socialActions: [
        { id: 'sa1', name: 'Arbre de Noël 2026', budget: 3000000, beneficiaries: 25, status: 'PLANIFIE', date: '2026-12-20' },
        { id: 'sa2', name: 'Sortie équipe Q3', budget: 2500000, beneficiaries: 9, status: 'PLANIFIE', date: '2026-09-15' },
        { id: 'sa3', name: 'Aide scolaire rentrée', budget: 1500000, beneficiaries: 12, status: 'TERMINE', date: '2026-09-01' },
        { id: 'sa4', name: 'Colis Ramadan 2026', budget: 2000000, beneficiaries: 8, status: 'TERMINE', date: '2026-03-10' },
      ],
    }
    return NextResponse.json(data)
  } catch (error) { console.error('GET /api/cse error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
