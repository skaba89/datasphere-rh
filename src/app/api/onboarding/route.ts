import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const tasks = await db.onboardingTask.findMany({
      where: { companyId: company.id },
      include: {
        employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true, dateEmbauche: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('GET /api/onboarding error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    const task = await db.onboardingTask.create({
      data: {
        companyId: company.id,
        employeeId: body.employeeId,
        title: body.title,
        description: body.description || null,
        category: body.category || 'ADMIN',
        dueDate: body.dueDate || null,
        assignedTo: body.assignedTo || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'onboarding_task',
        entityId: task.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { title: body.title, employeeId: body.employeeId } }),
      },
    })

    return NextResponse.json({ success: true, task }, { status: 201 })
  } catch (error) {
    console.error('POST /api/onboarding error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
