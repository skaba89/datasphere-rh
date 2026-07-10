import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) return NextResponse.json({ error: 'endpoint + keys requis' }, { status: 400 })
  const existing = await db.pushSubscription.findUnique({ where: { endpoint } })
  if (existing) return NextResponse.json({ success: true, subscriptionId: existing.id })
  return NextResponse.json({ success: true, subscriptionId: (await db.pushSubscription.create({ data: { companyId: ctx.companyId, userId: ctx.user?.userId || null, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: request.headers.get('user-agent') || null, isActive: true } })).id })
}
