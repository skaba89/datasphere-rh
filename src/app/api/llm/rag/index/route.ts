import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { indexDocument, listIndexedDocuments, deleteDocument, type DocumentSource } from '@/lib/llm/rag'

// GET /api/llm/rag/index — liste les documents indexés
export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const docs = await listIndexedDocuments(ctx.companyId)
    return NextResponse.json({ documents: docs, total: docs.length })
  } catch (error) {
    console.error('GET /api/llm/rag/index error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/llm/rag/index — indexe un nouveau document
export async function POST(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const body = await request.json()
    const { source, title, content, documentId, metadata } = body

    if (!source || !title || !content) {
      return NextResponse.json({ error: 'source, title, content requis' }, { status: 400 })
    }

    const validSources = ['policy', 'contract_template', 'faq', 'manual', 'law', 'other']
    if (!validSources.includes(source)) {
      return NextResponse.json({ error: `source doit être parmi: ${validSources.join(', ')}` }, { status: 400 })
    }

    const result = await indexDocument(ctx.companyId, {
      documentId,
      source: source as DocumentSource,
      title,
      content,
      metadata,
    })

    // Audit log
    await db.advancedAuditLog.create({
      data: {
        companyId: ctx.companyId,
        module: 'DATA_GOVERNANCE',
        action: 'CREATE',
        targetType: 'DocumentChunk',
        targetLabel: title,
        details: JSON.stringify({ source, chunksCreated: result.chunksCreated }),
      },
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('POST /api/llm/rag/index error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/llm/rag/index?title=XXX&source=YYY — supprime un document
export async function DELETE(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')
    const source = searchParams.get('source')
    const documentId = searchParams.get('documentId') || undefined

    if (!title || !source) {
      return NextResponse.json({ error: 'title et source requis' }, { status: 400 })
    }

    const result = await deleteDocument(ctx.companyId, title, source, documentId)
    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('DELETE /api/llm/rag/index error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
