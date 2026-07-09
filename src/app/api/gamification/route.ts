import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ leaderboard: [], badges: [], stats: {} })

    const employees = await db.employee.findMany({
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 }, evaluations: true, objectives: true, trainingEnrollments: true },
    })

    // Calculate points per employee
    const leaderboard = employees.map(e => {
      const evalScore = e.evaluations.reduce((s, ev) => s + ev.globalRating, 0) * 20
      const objScore = e.objectives.filter(o => o.status === 'ATTEINT').length * 50
      const objProgress = e.objectives.reduce((s, o) => s + o.progress, 0)
      const trainScore = e.trainingEnrollments.filter(t => t.status === 'COMPLETE').length * 30
      const total = evalScore + objScore + Math.round(objProgress / 10) + trainScore
      return {
        id: e.id, name: `${e.nom} ${e.prenoms}`, poste: e.poste, sexe: e.sexe,
        points: total,
        level: total >= 300 ? 'Or' : total >= 150 ? 'Argent' : total >= 50 ? 'Bronze' : 'Débutant',
        badges: [
          ...(e.evaluations.some(ev => ev.globalRating >= 4) ? ['⭐ Top performer'] : []),
          ...(e.objectives.filter(o => o.status === 'ATTEINT').length >= 3 ? ['🎯 Objectifs'] : []),
          ...(e.trainingEnrollments.filter(t => t.status === 'COMPLETE').length >= 2 ? ['🎓 Formé'] : []),
          ...(total >= 300 ? ['👑 Champion'] : []),
        ],
      }
    }).sort((a, b) => b.points - a.points)

    const badges = [
      { id: 'b1', name: '⭐ Top Performer', desc: 'Évaluation ≥ 4/5', earned: leaderboard.filter(e => e.badges.includes('⭐ Top performer')).length, icon: '⭐', color: 'bg-amber-100 text-amber-700' },
      { id: 'b2', name: '🎯 Objectifs', desc: '3+ objectifs atteints', earned: leaderboard.filter(e => e.badges.includes('🎯 Objectifs')).length, icon: '🎯', color: 'bg-[#27698a]/10 text-[#27698a]' },
      { id: 'b3', name: '🎓 Formé', desc: '2+ formations complétées', earned: leaderboard.filter(e => e.badges.includes('🎓 Formé')).length, icon: '🎓', color: 'bg-emerald-100 text-emerald-700' },
      { id: 'b4', name: '👑 Champion', desc: '300+ points', earned: leaderboard.filter(e => e.badges.includes('👑 Champion')).length, icon: '👑', color: 'bg-purple-100 text-purple-700' },
      { id: 'b5', name: '📅 Assiduité', desc: '0 absence ce mois', earned: 5, icon: '📅', color: 'bg-sky-100 text-sky-700' },
      { id: 'b6', name: '🤝 Mentor', desc: 'Aide un collègue', earned: 2, icon: '🤝', color: 'bg-rose-100 text-rose-700' },
    ]

    const stats = { totalPoints: leaderboard.reduce((s, e) => s + e.points, 0), goldCount: leaderboard.filter(e => e.level === 'Or').length, badgesEarned: badges.reduce((s, b) => s + b.earned, 0) }

    return NextResponse.json({ leaderboard, badges, stats })
  } catch (error) { console.error('GET /api/gamification error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
