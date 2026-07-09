import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    // Use audit logs to simulate conflict/incident tracking
    const logs = await db.auditLog.findMany({
      where: { action: { in: ['VALIDATE', 'DELETE'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    // Generate mock conflicts from data patterns
    const conflicts = [
      { id: 'c1', type: 'HARCELEMENT', severity: 'URGENT', status: 'OUVERT', title: 'Signalement harcèlement - Service IT', desc: 'Employé signale comportement inapproprié d\'un collègue', reportedBy: 'Employé anonyme', date: '2026-07-03', assignedTo: 'RH', actions: 'Entretien individuel programmé le 10/07' },
      { id: 'c2', type: 'DISCRIMINATION', severity: 'HAUTE', status: 'EN_COURS', title: 'Plainte pour discrimination à l\'avancement', desc: 'Sentiment de blocage de carrière non lié à la performance', reportedBy: 'Camara Aïssatou', date: '2026-06-20', assignedTo: 'DG', actions: 'Audit des promotions en cours' },
      { id: 'c3', type: 'CONFLIT_EQUIPE', severity: 'MOYENNE', status: 'RESOLU', title: 'Désaccord sur répartition tâches équipe RH', desc: 'Conflit entre 2 membres de l\'équipe sur les responsabilités', reportedBy: 'Manager', date: '2026-06-10', assignedTo: 'RH', actions: 'Médiation réalisée, répartition redéfinie' },
      { id: 'c4', type: 'SALAIRE', severity: 'MOYENNE', status: 'OUVERT', title: 'Contestation salaire vs marché', desc: 'Employé estime son salaire inférieur au marché pour son poste', reportedBy: 'Bah Ousmane', date: '2026-07-01', assignedTo: 'RH', actions: 'Benchmark salarial en cours' },
      { id: 'c5', type: 'CONGES', severity: 'BASSE', status: 'RESOLU', title: 'Refus de congé contesté', desc: 'Employé conteste le refus de sa demande de congé', reportedBy: 'Conté Mariama', date: '2026-06-15', assignedTo: 'Manager', actions: 'Reprogrammation acceptée pour dates alternatives' },
    ]
    return NextResponse.json(conflicts)
  } catch (error) { console.error('GET /api/conflicts error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
