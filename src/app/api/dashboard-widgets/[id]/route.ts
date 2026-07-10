import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// PATCH /api/dashboard-widgets/[id] — update position/config
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  const body = await request.json()
  const data: any = {}
  if (body.position !== undefined) data.position = body.position
  if (body.config !== undefined) data.config = JSON.stringify(body.config)
  if (body.title !== undefined) data.title = body.title
  if (body.isActive !== undefined) data.isActive = body.isActive
  await db.dashboardWidget.updateMany({ where: { id, companyId: ctx.companyId }, data })
  return NextResponse.json({ success: true })
}

// DELETE /api/dashboard-widgets/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  await db.dashboardWidget.deleteMany({ where: { id, companyId: ctx.companyId } })
  return NextResponse.json({ success: true })
}
