import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const before = await db.onboardingTask.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })

    const task = await db.onboardingTask.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.status === 'TERMINE' && { completedAt: new Date() }),
        ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      },
    })

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'onboarding_task',
        entityId: id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ before: { status: before.status }, after: { status: task.status } }),
      },
    })

    return NextResponse.json({ success: true, task })
  } catch (error) {
    console.error('PATCH /api/onboarding/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
