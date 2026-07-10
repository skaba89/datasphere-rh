import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { searchByEmbeddings } from '@/lib/llm/embeddings'

// GET /api/llm/rag/vector-search?q=XXX&limit=5
// Recherche sémantique par embeddings (plus précise que mots-clés)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '5')
    const source = searchParams.get('source') || undefined

    if (!query) return NextResponse.json({ error: 'q requis' }, { status: 400 })

    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const results = await searchByEmbeddings(ctx.companyId, query, {
      limit,
      ...(source ? { source } : {}),
    })

    return NextResponse.json({
      query,
      results,
      total: results.length,
      searchType: 'vector',
    })
  } catch (error) {
    console.error('GET /api/llm/rag/vector-search error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
