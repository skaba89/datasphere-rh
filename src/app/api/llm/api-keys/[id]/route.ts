import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { isActive } = await request.json()
  await db.apiKey.updateMany({ where: { id, companyId: ctx.companyId }, data: { isActive: !!isActive } })
  return NextResponse.json({ success: true })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await db.apiKey.deleteMany({ where: { id, companyId: ctx.companyId } }); return NextResponse.json({ success: true })
}
