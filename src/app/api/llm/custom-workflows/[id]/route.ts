import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const w = await db.customWorkflow.findFirst({ where: { id, companyId: ctx.companyId } })
  if (!w) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ workflow: { ...w, steps: (() => { try { return JSON.parse(w.steps) } catch { return [] } })(), triggerConfig: (() => { try { return JSON.parse(w.triggerConfig || '{}') } catch { return {} } })() } })
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const body = await request.json(); const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.steps !== undefined) data.steps = JSON.stringify(body.steps)
  if (body.isActive !== undefined) data.isActive = body.isActive
  await db.customWorkflow.updateMany({ where: { id, companyId: ctx.companyId }, data })
  return NextResponse.json({ success: true })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await db.customWorkflow.deleteMany({ where: { id, companyId: ctx.companyId } }); return NextResponse.json({ success: true })
}
