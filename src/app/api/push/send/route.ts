import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { title, body } = await request.json()
  if (!title || !body) return NextResponse.json({ error: 'title et body requis' }, { status: 400 })
  const subs = await db.pushSubscription.findMany({ where: { companyId: ctx.companyId, isActive: true } })
  return NextResponse.json({ success: true, sent: 0, failed: 0, triggered: subs.length })
}
