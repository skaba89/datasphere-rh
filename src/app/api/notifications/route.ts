import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// GET /api/notifications?channel=IN_APP — liste les notifications de la société
export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel') || 'IN_APP'
    const limit = parseInt(searchParams.get('limit') || '50')

    const notifications = await db.notification.findMany({
      where: { companyId: ctx.companyId, channel },
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
