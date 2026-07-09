import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ kpis: {}, initiatives: [], stats: {} })
    const employees = await db.employee.findMany()

    const genderCount = { M: employees.filter(e => e.sexe === 'M').length, F: employees.filter(e => e.sexe === 'F').length }
    const ageGroups = { '<25': 0, '25-35': 0, '36-45': 0, '46-55': 0, '>55': 0 }
    employees.forEach(e => {
      if (!e.dateNaissance) { ageGroups['36-45']++; return }
      const age = Math.floor((Date.now() - new Date(e.dateNaissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 25) ageGroups['<25']++; else if (age < 36) ageGroups['25-35']++; else if (age < 46) ageGroups['36-45']++; else if (age < 56) ageGroups['46-55']++; else ageGroups['>55']++
    })

    const initiatives = [
      { id: 'i1', title: 'Charte diversité et inclusion', desc: 'Signature officielle charte D&I avec engagements mesurables', category: 'POLITIQUE', status: 'DEPLOYE', progress: 100, owner: 'DG', date: '2026-01-15' },
      { id: 'i2', title: 'Programme recrutement handicap', desc: 'Objectif 6% de collaborateurs en situation de handicap d\'ici 2028', category: 'HANDICAP', status: 'EN_COURS', progress: 45, owner: 'RH', date: '2026-03-01' },
      { id: 'i3', title: 'Formation sensibilité biais inconscients', desc: 'Tous les managers formés sur les biais de recrutement et promotion', category: 'FORMATION', status: 'EN_COURS', progress: 70, owner: 'RH', date: '2026-05-01' },
      { id: 'i4', title: 'Mentorat femmes leaders', desc: 'Programme d\'accompagnement des femmes vers des postes de direction', category: 'GENRE', status: 'EN_COURS', progress: 60, owner: 'Aïssatou Camara', date: '2026-04-01' },
      { id: 'i5', title: 'Aménagement poste de travail', desc: 'Audit ergonomique et aménagements spécifiques pour 2 employés', category: 'HANDICAP', status: 'DEPLOYE', progress: 100, owner: 'RH', date: '2026-02-15' },
      { id: 'i6', title: 'Célébrations culturelles', desc: 'Reconnaissance des fêtes religieuses et culturelles de tous les employés', category: 'CULTURE', status: 'DEPLOYE', progress: 100, owner: 'CSE', date: '2026-01-01' },
    ]

    const kpis = {
      genderRatio: genderCount.F > 0 ? Math.round((genderCount.F / (genderCount.M + genderCount.F)) * 100) : 0,
      womenInManagement: 40,
      handicapRate: 2,
      diversityIndex: 72,
      inclusionScore: 4.1,
    }

    const stats = { totalEmployees: employees.length, ...genderCount, ageGroups }

    return NextResponse.json({ kpis, initiatives, stats })
  } catch (error) { console.error('GET /api/diversity error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
