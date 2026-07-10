import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// PATCH /api/plugins/[id] — active/désactive
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  const body = await request.json()
  await db.plugin.updateMany({
    where: { id, companyId: ctx.companyId },
    data: { isActive: body.isActive ?? true },
  })
  return NextResponse.json({ success: true })
}

// DELETE /api/plugins/[id] — désinstalle
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  await db.plugin.deleteMany({ where: { id, companyId: ctx.companyId } })
  return NextResponse.json({ success: true })
}
