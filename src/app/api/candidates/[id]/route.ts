import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const before = await db.candidate.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'Candidat introuvable' }, { status: 404 })

    const candidate = await db.candidate.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.rating !== undefined && { rating: Number(body.rating) }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.interviewDate && { interviewDate: new Date(body.interviewDate) }),
        ...(body.expectedSalary !== undefined && { expectedSalary: body.expectedSalary ? Number(body.expectedSalary) : null }),
      },
    })

    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'candidate',
        entityId: id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ before: { status: before.status }, after: { status: candidate.status } }),
      },
    })

    return NextResponse.json({ success: true, candidate })
  } catch (error) {
    console.error('PATCH /api/candidates/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.candidate.delete({ where: { id } })
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'candidate',
        entityId: id,
        userId: 'admin@demo.gn',
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/candidates/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
