import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const objectives = await db.objective.findMany({
      include: {
        employee: {
          select: { id: true, nom: true, prenoms: true, matricule: true, poste: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(objectives)
  } catch (error) {
    console.error('GET /api/objectives error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const objective = await db.objective.create({
      data: {
        employeeId: body.employeeId,
        title: body.title,
        description: body.description || null,
        type: body.type || 'INDIVIDUAL',
        weight: Number(body.weight) || 1,
        dueDate: body.dueDate || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'objective',
        entityId: objective.id,
        userId: 'manager@demo.gn',
        diff: JSON.stringify({ after: { title: body.title, employeeId: body.employeeId } }),
      },
    })

    return NextResponse.json({ success: true, objective }, { status: 201 })
  } catch (error) {
    console.error('POST /api/objectives error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
