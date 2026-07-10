import { db } from '@/lib/db'

/**
 * Embeddings vectoriels — approche hybride sans dépendance externe.
 *
 * Implémentation :
 *  1. Si OPENAI_API_KEY ou GEMINI_API_KEY est configurée → utilise l'API embeddings
 *  2. Sinon → fallback TF-IDF local (vectorisation par hashing)
 *
 * En production avec Postgres + pgvector :
 *   - Stocker les embeddings dans une colonne `vector(1536)`
 *   - Créer un index `ivfflat` pour similarité cosinus rapide
 *   - Remplacer `cosineSimilarity` par `<=>` operator de pgvector
 */

// ━━━ Embeddings via API externe ━━━

const EMBEDDING_DIM = 1536 // OpenAI text-embedding-3-small

/**
 * Génère un embedding via OpenAI (si clé configurée).
 */
async function embedWithOpenAI(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000), // max 8191 tokens
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0]?.embedding || null
  } catch {
    return null
  }
}

/**
 * Génère un embedding via ZAI (si SDK configuré).
 * ZAI/GLM supporte aussi les embeddings via /api/paas/v4/embeddings
 */
async function embedWithZai(text: string): Promise<number[] | null> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    // @ts-ignore — la méthode embeddings existe dans le SDK
    const result = await zai.embeddings.create({
      model: 'embedding-3',
      input: text.slice(0, 8000),
    })
    return result.data?.[0]?.embedding || null
  } catch {
    return null
  }
}

// ━━━ Fallback TF-IDF local (hashing) ━━━

/**
 * Vectorise un texte en TF-IDF via hashing (sans vocabulaire pré-construit).
 * Dimension fixe : 256 (compromis précision/mémoire).
 *
 * Principe : chaque token est hashé → index dans le vecteur.
 * Le poids TF-IDF approximatif = TF normalisé.
 */
const LOCAL_DIM = 256

function hashToken(token: string): number {
  let hash = 0
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) - hash) + token.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % LOCAL_DIM
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s,.;:!?()«»"'+\-_/]+/)
    .filter(w => w.length >= 3)
}

function embedLocal(text: string): number[] {
  const tokens = tokenize(text)
  const vec = new Array(LOCAL_DIM).fill(0)

  for (const token of tokens) {
    const idx = hashToken(token)
    vec[idx] += 1
  }

  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0))
  if (norm > 0) {
    for (let i = 0; i < LOCAL_DIM; i++) vec[i] /= norm
  }

  return vec
}

/**
 * Génère un embedding (API si dispo, sinon local).
 */
export async function generateEmbedding(text: string): Promise<{ vector: number[]; model: string; dim: number }> {
  // Essaie OpenAI d'abord
  const openaiVec = await embedWithOpenAI(text)
  if (openaiVec) {
    return { vector: openaiVec, model: 'text-embedding-3-small', dim: EMBEDDING_DIM }
  }

  // Essaie ZAI
  const zaiVec = await embedWithZai(text)
  if (zaiVec) {
    return { vector: zaiVec, model: 'embedding-3', dim: zaiVec.length }
  }

  // Fallback local
  return { vector: embedLocal(text), model: 'tfidf-local-256', dim: LOCAL_DIM }
}

// ━━━ Similarité cosinus ━━━

/**
 * Calcule la similarité cosinus entre 2 vecteurs.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  // Si dimensions différentes, on tronque au minimum
  const dim = Math.min(a.length, b.length)
  let dot = 0, normA = 0, normB = 0

  for (let i = 0; i < dim; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// ━━━ Indexation avec embeddings ━━━

/**
 * Indexe un chunk avec embedding vectoriel.
 * Stocke l'embedding comme string JSON dans DocumentChunk.embedding.
 */
export async function indexWithEmbeddings(
  companyId: string,
  chunkId: string,
  content: string
): Promise<{ embeddingModel: string; dim: number }> {
  const { vector, model, dim } = await generateEmbedding(content)

  await db.documentChunk.update({
    where: { id: chunkId },
    data: {
      embedding: JSON.stringify(vector),
      embeddingModel: model,
    },
  })

  return { embeddingModel: model, dim }
}

/**
 * Recherche sémantique par similarité cosinus sur les embeddings.
 * Plus précise que searchByKeywords pour les requêtes conceptuelles.
 *
 * @example
 * // "comment puis-je travailler de chez moi" trouve "politique de télétravail"
 * // même sans mots-clés communs
 */
export async function searchByEmbeddings(
  companyId: string,
  query: string,
  options: { limit?: number; source?: string; minScore?: number } = {}
): Promise<Array<{
  id: string
  title: string
  source: string
  content: string
  score: number
  chunkIndex: number
  embeddingModel?: string
}>> {
  const limit = options.limit || 5
  const minScore = options.minScore || 0.1

  // Génère l'embedding de la requête
  const { vector: queryVec } = await generateEmbedding(query)

  // Récupère tous les chunks avec embeddings
  const where: any = { companyId, embedding: { not: null } }
  if (options.source) where.source = options.source

  const chunks = await db.documentChunk.findMany({ where, take: 500 })

  // Calcule la similarité cosinus
  const scored = chunks.map(chunk => {
    let embedding: number[] = []
    try {
      embedding = JSON.parse(chunk.embedding || '[]')
    } catch {}

    if (embedding.length === 0) return null

    const score = cosineSimilarity(queryVec, embedding)
    return {
      id: chunk.id,
      title: chunk.title,
      source: chunk.source,
      content: chunk.content,
      score: Math.round(score * 1000) / 1000,
      chunkIndex: chunk.chunkIndex,
      embeddingModel: chunk.embeddingModel || undefined,
    }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  return scored
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Re-indexe tous les chunks d'une société avec embeddings.
 * À appeler après activation des embeddings ou changement de modèle.
 */
export async function reindexAllEmbeddings(companyId: string): Promise<{
  total: number
  indexed: number
  failed: number
  model: string
}> {
  const chunks = await db.documentChunk.findMany({
    where: { companyId },
    select: { id: true, content: true },
  })

  let indexed = 0, failed = 0
  let model = 'unknown'

  for (const chunk of chunks) {
    try {
      const result = await indexWithEmbeddings(companyId, chunk.id, chunk.content)
      model = result.embeddingModel
      indexed++
    } catch {
      failed++
    }
  }

  return { total: chunks.length, indexed, failed, model }
}
