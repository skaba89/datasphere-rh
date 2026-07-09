import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const leave = await db.leaveRequest.update({
      where: { id },
      data: {
        statut: 'APPROUVE',
        approvedBy: 'manager@demo.gn',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'VALIDATE',
        entityType: 'leave_request',
        entityId: id,
        userId: 'manager@demo.gn',
        diff: JSON.stringify({ before: { statut: 'EN_ATTENTE' }, after: { statut: 'APPROUVE' } }),
      },
    })

    return NextResponse.json({ success: true, leave })
  } catch (error) {
    console.error('POST /api/leaves/[id]/approve error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
