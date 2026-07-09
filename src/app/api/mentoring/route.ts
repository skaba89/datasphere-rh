import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const employees = await db.employee.findMany({ select: { id: true, nom: true, prenoms: true, poste: true, sexe: true } })

    const mentorings = [
      { id: 'm1', mentor: employees[0], mentee: employees[4], topic: 'Leadership et vision stratégique', startDate: '2026-04-01', frequency: 'BI-MENSUEL', status: 'ACTIF', sessions: 6, nextSession: '2026-07-15', progress: 65 },
      { id: 'm2', mentor: employees[1], mentee: employees[7], topic: 'Gestion RH et processus paie', startDate: '2026-05-15', frequency: 'HEBDOMADAIRE', status: 'ACTIF', sessions: 8, nextSession: '2026-07-10', progress: 40 },
      { id: 'm3', mentor: employees[6], mentee: employees[5], topic: 'Techniques de vente B2B', startDate: '2026-06-01', frequency: 'BI-MENSUEL', status: 'ACTIF', sessions: 3, nextSession: '2026-07-18', progress: 25 },
      { id: 'm4', mentor: employees[0], mentee: employees[3], topic: 'Management d\'équipe et prise de parole', startDate: '2026-03-01', frequency: 'MENSUEL', status: 'TERMINE', sessions: 4, nextSession: null, progress: 100 },
      { id: 'm5', mentor: employees[2], mentee: employees[4], topic: 'Architecture logicielle et bonnes pratiques', startDate: '2026-06-15', frequency: 'HEBDOMADAIRE', status: 'ACTIF', sessions: 2, nextSession: '2026-07-12', progress: 15 },
    ]
    return NextResponse.json(mentorings)
  } catch (error) { console.error('GET /api/mentoring error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
