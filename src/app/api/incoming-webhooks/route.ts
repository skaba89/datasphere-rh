import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import crypto from 'crypto'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ webhooks: await db.incomingWebhook.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } }) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { name, source, triggerWorkflow } = await request.json()
  if (!name || !source) return NextResponse.json({ error: 'name et source requis' }, { status: 400 })
  const token = 'wh_in_' + crypto.randomBytes(20).toString('hex')
  return NextResponse.json({ success: true, webhook: await db.incomingWebhook.create({ data: { companyId: ctx.companyId, name, source, incomingToken: token, triggerWorkflow: triggerWorkflow || null, isActive: true } }), token })
}
