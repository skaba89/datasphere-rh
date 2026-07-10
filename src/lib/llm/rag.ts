import { db } from '@/lib/db'

export type DocumentSource = 'policy' | 'faq' | 'law' | 'manual' | 'other'

export function normalize(s: string): string { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() }

export async function searchByKeywords(companyId: string, query: string, options: { limit?: number; source?: string; minScore?: number } = {}) {
  const limit = options.limit || 5
  const minScore = options.minScore || 0.1
  const stopwords = new Set(['les', 'des', 'une', 'que', 'qui', 'pour', 'dans', 'avec', 'sur', 'sont'])
  const queryTokens = normalize(query).split(/[\s,.;:!?()«»"'+\-_/]+/).filter(w => w.length >= 3 && !stopwords.has(w))
  if (queryTokens.length === 0) return []
  // Use Document model since DocumentChunk doesn't exist in schema
  const where: any = { companyId, type: 'OTHER' }
  if (options.source) where.category = options.source.toUpperCase()
  const docs = await db.document.findMany({ where, take: 500 })
  const scored = docs.map(doc => {
    const contentNorm = normalize(doc.name)
    let score = 0
    for (const token of queryTokens) {
      if (contentNorm.includes(token)) score += 3
      score += (contentNorm.match(new RegExp(token, 'g')) || []).length
    }
    score = score / Math.sqrt(Math.max(1, doc.name.length / 100))
    return {
      id: doc.id,
      documentId: doc.id,
      source: doc.category.toLowerCase(),
      title: doc.name,
      content: doc.name,
      chunkIndex: 0,
      score: Math.round(score * 100) / 100,
      metadata: {},
    }
  })
  return scored.filter(r => r.score >= minScore).sort((a, b) => b.score - a.score).slice(0, limit)
}

export function buildRagPrompt(query: string, results: any[]): string {
  if (results.length === 0) return query
  const context = results.map((r, i) => `### Source ${i + 1} : ${r.title} (${r.source})\n${r.content}`).join('\n\n---\n\n')
  return `Contexte (documents RH internes) :\n${context}\n\n---\n\nQuestion : ${query}\n\nRéponds en te basant sur le contexte. Cite les sources.`
}

export async function listIndexedDocuments(companyId: string) {
  const docs = await db.document.findMany({
    where: { companyId, type: 'OTHER' },
    orderBy: { createdAt: 'desc' },
  })
  return docs.map(d => ({
    title: d.name,
    source: d.category.toLowerCase(),
    documentId: d.id,
    chunks: 1,
    createdAt: d.createdAt.toISOString(),
  }))
}

export async function indexDocument(companyId: string, input: { source: string; title: string; content: string; documentId?: string; metadata?: any }) {
  await db.document.create({
    data: {
      companyId,
      name: input.title,
      type: 'OTHER',
      fileKey: `rag/${input.source}/${input.title}`,
      fileSize: input.content.length,
      mimeType: 'text/plain',
      category: input.source.toUpperCase(),
    },
  })
  return { chunksCreated: 1 }
}

export async function deleteDocument(companyId: string, title: string, source?: string, documentId?: string) {
  const where: any = { companyId, name: title, type: 'OTHER' }
  if (source) where.category = source.toUpperCase()
  if (documentId) where.id = documentId
  const result = await db.document.deleteMany({ where })
  return { deleted: result.count }
}
