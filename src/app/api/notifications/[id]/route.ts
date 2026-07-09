import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/notifications/[id] — marque comme lu
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const status = body.status || 'LU'

    const updated = await db.notification.update({
      where: { id },
      data: { status, sentAt: status === 'LU' ? new Date() : undefined },
    })
    return NextResponse.json({ success: true, notification: updated })
  } catch (error) {
    console.error('PATCH /api/notifications/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/notifications/mark-all-read — marque toutes comme lues
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: action } = await params
    if (action !== 'mark-all-read') {
      return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
    }

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ success: true, updated: 0 })

    const result = await db.notification.updateMany({
      where: { companyId: company.id, channel: 'IN_APP', status: { not: 'LU' } },
      data: { status: 'LU', sentAt: new Date() },
    })

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('POST /api/notifications/mark-all-read error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
