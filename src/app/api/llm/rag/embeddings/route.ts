import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { reindexAllEmbeddings, generateEmbedding } from '@/lib/llm/embeddings'

// GET /api/llm/rag/embeddings — statut des embeddings
export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const { db } = await import('@/lib/db')
    const chunks = await db.documentChunk.findMany({
      where: { companyId: ctx.companyId },
      select: { id: true, embedding: true, embeddingModel: true },
    })

    const withEmbeddings = chunks.filter(c => c.embedding).length
    const models = new Set(chunks.filter(c => c.embeddingModel).map(c => c.embeddingModel))

    return NextResponse.json({
      total: chunks.length,
      withEmbeddings,
      withoutEmbeddings: chunks.length - withEmbeddings,
      models: Array.from(models),
      coverage: chunks.length > 0 ? Math.round((withEmbeddings / chunks.length) * 100) : 0,
    })
  } catch (error) {
    console.error('GET /api/llm/rag/embeddings error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/llm/rag/embeddings — re-indexe tous les chunks avec embeddings
export async function POST(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const result = await reindexAllEmbeddings(ctx.companyId)

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.indexed}/${result.total} chunks indexés avec embeddings (modèle: ${result.model})`,
    })
  } catch (error: any) {
    console.error('POST /api/llm/rag/embeddings error:', error)
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}
