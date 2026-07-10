import { NextResponse } from 'next/server'
import { chatWithFallback } from '@/lib/llm/fallback'
import { getDefaultProvider } from '@/lib/llm/settings'
import { searchByKeywords, buildRagPrompt } from '@/lib/llm/rag'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function POST(request: Request) {
  try {
    const { question, source, limit } = await request.json()
    if (!question) return NextResponse.json({ error: 'question requise' }, { status: 400 })
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const results = await searchByKeywords(ctx.companyId, question, { limit: Math.min(limit || 5, 10), ...(source ? { source } : {}) })
    const { provider: defaultProvider, model, temperature, maxTokens } = await getDefaultProvider(ctx.companyId)
    if (results.length === 0) {
      const result = await chatWithFallback(defaultProvider.id, model, [{ role: 'system', content: 'Tu es un assistant RH. Aucun document interne.' }, { role: 'user', content: question }], { temperature, maxTokens: Math.min(maxTokens, 800), tracking: { companyId: ctx.companyId, endpoint: 'rag_ask', feature: 'rag_ask_no_context' } })
      return NextResponse.json({ answer: result.content, sources: [], provider: result.provider, usage: result.usage, contextFound: false })
    }
    const augmentedPrompt = buildRagPrompt(question, results)
    const result = await chatWithFallback(defaultProvider.id, model, [{ role: 'system', content: 'Tu es un assistant RH expert. Réponds en français en te basant sur le contexte. Cite les sources.' }, { role: 'user', content: augmentedPrompt }], { temperature: Math.min(temperature, 0.5), maxTokens: Math.min(maxTokens, 800), tracking: { companyId: ctx.companyId, endpoint: 'rag_ask', feature: 'rag_ask_with_context' } })
    return NextResponse.json({ answer: result.content, sources: results.map(r => ({ title: r.title, source: r.source, score: r.score })), provider: result.provider, usage: result.usage, contextFound: true, chunksRetrieved: results.length })
  } catch (e: any) { console.error('POST /api/llm/rag/ask error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
