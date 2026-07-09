import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const before = await db.expenseReport.findUnique({ where: { id } })
    if (!before) return NextResponse.json({ error: 'Note de frais introuvable' }, { status: 404 })

    const expense = await db.expenseReport.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.status === 'APPROUVE' || body.status === 'REFUSE' || body.status === 'REMBOURSE' && {
          approvedBy: 'manager@demo.gn',
          approvedAt: new Date(),
        }),
      },
    })

    await db.auditLog.create({
      data: {
        action: 'VALIDATE',
        entityType: 'expense_report',
        entityId: id,
        userId: 'manager@demo.gn',
        diff: JSON.stringify({ before: { status: before.status }, after: { status: expense.status } }),
      },
    })

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('PATCH /api/expenses/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
