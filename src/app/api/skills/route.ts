import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ skills: [], matrix: {} })

    const skills = await db.skill.findMany({
      where: { companyId: company.id },
      include: {
        assessments: {
          include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } } },
        },
      },
      orderBy: { category: 'asc' },
    })

    // Build matrix: { skillId: { employeeId: { level, targetLevel } } }
    const matrix: Record<string, Record<string, { level: number; target: number }>> = {}
    skills.forEach(s => {
      matrix[s.id] = {}
      s.assessments.forEach(a => {
        matrix[s.id][a.employeeId] = { level: a.level, target: a.targetLevel }
      })
    })

    return NextResponse.json({ skills, matrix })
  } catch (error) {
    console.error('GET /api/skills error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    if (body.skillId && body.employeeId) {
      // Create/update assessment
      const existing = await db.skillAssessment.findFirst({
        where: { skillId: body.skillId, employeeId: body.employeeId },
      })
      if (existing) {
        const updated = await db.skillAssessment.update({
          where: { id: existing.id },
          data: { level: Number(body.level), targetLevel: Number(body.targetLevel) || existing.targetLevel },
        })
        return NextResponse.json({ success: true, assessment: updated })
      }
      const assessment = await db.skillAssessment.create({
        data: {
          skillId: body.skillId,
          employeeId: body.employeeId,
          level: Number(body.level) || 1,
          targetLevel: Number(body.targetLevel) || 3,
        },
      })
      return NextResponse.json({ success: true, assessment }, { status: 201 })
    }

    // Create skill
    const skill = await db.skill.create({
      data: {
        companyId: company.id,
        name: body.name,
        category: body.category || 'TECHNIQUE',
        description: body.description || null,
      },
    })

    return NextResponse.json({ success: true, skill }, { status: 201 })
  } catch (error) {
    console.error('POST /api/skills error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
