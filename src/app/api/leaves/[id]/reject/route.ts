import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const leave = await db.leaveRequest.update({
      where: { id },
      data: {
        statut: 'REFUSE',
        approvedBy: 'manager@demo.gn',
        motif: body.motif || 'Refusé par le manager',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'VALIDATE',
        entityType: 'leave_request',
        entityId: id,
        userId: 'manager@demo.gn',
        diff: JSON.stringify({
          before: { statut: 'EN_ATTENTE' },
          after: { statut: 'REFUSE', motif: body.motif || 'Refusé' },
        }),
      },
    })

    return NextResponse.json({ success: true, leave })
  } catch (error) {
    console.error('POST /api/leaves/[id]/reject error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
