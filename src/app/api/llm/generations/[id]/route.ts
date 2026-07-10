import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { getGeneration, toggleFavorite, archiveGeneration, deleteGeneration } from '@/lib/llm/generations'
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const g = await getGeneration(ctx.companyId, id); if (!g) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ ...g, metadata: (() => { try { return JSON.parse(g.metadata || '{}') } catch { return {} } })(), tags: (() => { try { return JSON.parse(g.tags || '[]') } catch { return [] } })() })
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { action } = await request.json()
  if (action === 'favorite') { const u = await toggleFavorite(ctx.companyId, id); if (!u) return NextResponse.json({ error: 'Introuvable' }, { status: 404 }); return NextResponse.json({ success: true, generation: u }) }
  if (action === 'archive') { await archiveGeneration(ctx.companyId, id); return NextResponse.json({ success: true }) }
  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await deleteGeneration(ctx.companyId, id); return NextResponse.json({ success: true })
}
