import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const trainings = await db.training.findMany({
      where: { companyId: company.id },
      include: {
        enrollments: {
          include: {
            employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = trainings.map(t => ({
      ...t,
      enrolledCount: t.enrollments.length,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/trainings error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    const training = await db.training.create({
      data: {
        companyId: company.id,
        title: body.title,
        description: body.description || null,
        category: body.category || 'RH',
        duration: Number(body.duration) || 8,
        format: body.format || 'PRESENTIEL',
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        trainer: body.trainer || null,
        location: body.location || null,
        maxParticipants: body.maxParticipants ? Number(body.maxParticipants) : null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'training',
        entityId: training.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { title: body.title } }),
      },
    })

    return NextResponse.json({ success: true, training }, { status: 201 })
  } catch (error) {
    console.error('POST /api/trainings error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
