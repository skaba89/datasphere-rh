import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const evaluations = await db.evaluation.findMany({
      include: {
        employee: {
          select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('GET /api/evaluations error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const evaluation = await db.evaluation.create({
      data: {
        employeeId: body.employeeId,
        period: body.period || '2026-annual',
        type: body.type || 'ANNUELLE',
        globalRating: Number(body.globalRating) || 0,
        strengths: body.strengths || null,
        improvements: body.improvements || null,
        goals: body.goals || null,
        managerNotes: body.managerNotes || null,
        evaluatorId: 'manager@demo.gn',
        status: 'TERMINE',
        evaluatedAt: new Date(),
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'evaluation',
        entityId: evaluation.id,
        userId: 'manager@demo.gn',
        diff: JSON.stringify({ after: { employeeId: body.employeeId, rating: body.globalRating } }),
      },
    })

    return NextResponse.json({ success: true, evaluation }, { status: 201 })
  } catch (error) {
    console.error('POST /api/evaluations error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
