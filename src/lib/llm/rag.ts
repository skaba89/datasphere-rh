import { db } from '@/lib/db'

export function normalize(s: string): string { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() }

export async function searchByKeywords(companyId: string, query: string, options: { limit?: number; source?: string; minScore?: number } = {}) {
  const limit = options.limit || 5
  const minScore = options.minScore || 0.1
  const stopwords = new Set(['les', 'des', 'une', 'que', 'qui', 'pour', 'dans', 'avec', 'sur', 'sont'])
  const queryTokens = normalize(query).split(/[\s,.;:!?()«»"'+\-_/]+/).filter(w => w.length >= 3 && !stopwords.has(w))
  if (queryTokens.length === 0) return []
  const where: any = { companyId }
  if (options.source) where.source = options.source
  const chunks = await db.documentChunk.findMany({ where, take: 500 })
  const scored = chunks.map(chunk => {
    const contentNorm = normalize(chunk.content)
    const titleNorm = normalize(chunk.title)
    let score = 0
    for (const token of queryTokens) { if (titleNorm.includes(token)) score += 3; score += (contentNorm.match(new RegExp(token, 'g')) || []).length }
    score = score / Math.sqrt(chunk.content.length / 1000)
    return { id: chunk.id, documentId: chunk.documentId, source: chunk.source, title: chunk.title, content: chunk.content, chunkIndex: chunk.chunkIndex, score: Math.round(score * 100) / 100, metadata: {} }
  })
  return scored.filter(r => r.score >= minScore).sort((a, b) => b.score - a.score).slice(0, limit)
}

export function buildRagPrompt(query: string, results: any[]): string {
  if (results.length === 0) return query
  const context = results.map((r, i) => `### Source ${i + 1} : ${r.title} (${r.source})\n${r.content}`).join('\n\n---\n\n')
  return `Contexte (documents RH internes) :\n${context}\n\n---\n\nQuestion : ${query}\n\nRéponds en te basant sur le contexte. Cite les sources.`
}

export async function listIndexedDocuments(companyId: string) {
  const chunks = await db.documentChunk.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })
  const docsMap = new Map<string, any>()
  for (const c of chunks) { const key = `${c.title}|${c.source}|${c.documentId || ''}`; if (!docsMap.has(key)) docsMap.set(key, { title: c.title, source: c.source, documentId: c.documentId, chunks: 0, createdAt: c.createdAt.toISOString() }); docsMap.get(key).chunks++ }
  return Array.from(docsMap.values())
}

export async function indexDocument(companyId: string, input: { source: string; title: string; content: string; documentId?: string; metadata?: any }) {
  const chunks = input.content.length <= 2000 ? [input.content] : input.content.split(/\n\n+/).reduce((acc: string[], para) => { const last = acc[acc.length - 1]; if (last && (last + '\n\n' + para).length <= 2000) acc[acc.length - 1] = last + '\n\n' + para; else acc.push(para); return acc }, [])
  for (let i = 0; i < chunks.length; i++) { await db.documentChunk.create({ data: { companyId, documentId: input.documentId || null, source: input.source, title: input.title, content: chunks[i], chunkIndex: i, metadata: input.metadata ? JSON.stringify(input.metadata) : null } }) }
  return { chunksCreated: chunks.length }
}
