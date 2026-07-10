import { NextResponse } from 'next/server'
import { searchByKeywords } from '@/lib/llm/rag'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '5')
  const source = searchParams.get('source') || undefined
  if (!query) return NextResponse.json({ error: 'q requis' }, { status: 400 })
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  const results = await searchByKeywords(ctx.companyId, query, { limit, ...(source ? { source } : {}) })
  return NextResponse.json({ query, results, total: results.length })
}
