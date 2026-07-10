import { NextResponse } from 'next/server'
import { chatWithFallback } from '@/lib/llm/fallback'
import { getDefaultProvider } from '@/lib/llm/settings'
import { searchByKeywords, buildRagPrompt } from '@/lib/llm/rag'
import { verifyApiKey, hasScope, type ApiScope } from '@/lib/llm/api-keys'
export async function POST(request: Request) {
  const auth = await verifyApiKey(request)
  if (!auth) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  if (!hasScope(auth.scopes, 'rag:ask' as ApiScope)) return NextResponse.json({ error: 'Scope insuffisant' }, { status: 403 })
  const { question, source, limit } = await request.json()
  if (!question) return NextResponse.json({ error: 'question requise' }, { status: 400 })
  const results = await searchByKeywords(auth.companyId, question, { limit: Math.min(limit || 5, 10), ...(source ? { source } : {}) })
  const { provider, model, temperature, maxTokens } = await getDefaultProvider(auth.companyId)
  if (results.length === 0) {
    const r = await chatWithFallback(provider.id, model, [{ role: 'system', content: 'Tu es un assistant RH.' }, { role: 'user', content: question }], { temperature, maxTokens: 800, tracking: { companyId: auth.companyId, endpoint: 'api_v1_rag', feature: `api_key:${auth.keyName}` } })
    return NextResponse.json({ answer: r.content, sources: [], contextFound: false })
  }
  const r = await chatWithFallback(provider.id, model, [{ role: 'system', content: 'Tu es un assistant RH expert. Cite les sources.' }, { role: 'user', content: buildRagPrompt(question, results) }], { temperature: 0.5, maxTokens: 800, tracking: { companyId: auth.companyId, endpoint: 'api_v1_rag', feature: `api_key:${auth.keyName}` } })
  return NextResponse.json({ answer: r.content, sources: results.map(r => ({ title: r.title, source: r.source, score: r.score })), contextFound: true, chunksRetrieved: results.length })
}
