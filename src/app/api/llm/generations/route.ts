import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { listGenerations, saveGeneration } from '@/lib/llm/generations'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || undefined
  const favorite = searchParams.get('favorite') === 'true' ? true : undefined
  const limit = parseInt(searchParams.get('limit') || '50')
  const gens = await listGenerations(ctx.companyId, { ...(type ? { type } : {}), ...(favorite !== undefined ? { favorite } : {}), limit })
  return NextResponse.json({ generations: gens.map(g => ({ ...g, metadata: (() => { try { return JSON.parse(g.metadata || '{}') } catch { return {} } })(), tags: (() => { try { return JSON.parse(g.tags || '[]') } catch { return [] } })() })), total: gens.length })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { type, title, content, providerId, modelId, usage, durationMs, metadata, tags } = await request.json()
  if (!type || !title || !content) return NextResponse.json({ error: 'type, title, content requis' }, { status: 400 })
  return NextResponse.json({ success: true, generation: await saveGeneration({ companyId: ctx.companyId, type, title, content, providerId: providerId || 'unknown', modelId: modelId || 'unknown', promptTokens: usage?.promptTokens, completionTokens: usage?.completionTokens, totalTokens: usage?.totalTokens, durationMs, metadata, tags }) })
}
