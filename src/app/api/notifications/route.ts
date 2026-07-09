import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notifications?channel=IN_APP — liste les notifications
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') || 'IN_APP'
    const limit = parseInt(searchParams.get('limit') || '50')

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ notifications: [], unread: 0 })

    const notifications = await db.notification.findMany({
      where: { companyId: company.id, channel },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    })

    const unread = notifications.filter(n => n.status !== 'LU').length

    return NextResponse.json({
      notifications: notifications.map(n => ({
        ...n,
        metadata: (() => { try { return JSON.parse(n.metadata || '{}') } catch { return {} } })(),
      })),
      unread,
    })
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
