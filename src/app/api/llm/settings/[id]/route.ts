import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { isDefault } = await request.json()
  if (isDefault) await db.llmSettings.updateMany({ where: { companyId: ctx.companyId, isDefault: true, NOT: { id } }, data: { isDefault: false } })
  return NextResponse.json({ success: true, setting: await db.llmSettings.update({ where: { id }, data: { ...(typeof isDefault === 'boolean' ? { isDefault } : {}) } }) })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await db.llmSettings.deleteMany({ where: { id, companyId: ctx.companyId } }); return NextResponse.json({ success: true })
}
