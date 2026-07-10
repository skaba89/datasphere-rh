import { NextResponse } from 'next/server'
import { chat, type ChatMessage } from '@/lib/llm/router'
import { getProviderById } from '@/lib/llm/providers'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider: providerId, model, messages, temperature, maxTokens } = body
    if (!providerId || !model || !Array.isArray(messages)) return NextResponse.json({ error: 'provider, model, messages requis' }, { status: 400 })
    const provider = getProviderById(providerId)
    if (!provider) return NextResponse.json({ error: `Provider inconnu: ${providerId}` }, { status: 400 })
    const ctx = await getCompanyContext(request)
    const tracking = 'error' in ctx ? undefined : { companyId: ctx.companyId, endpoint: 'llm_chat' as const, feature: 'api_call', userId: ctx.user?.userId }
    const result = await chat(providerId, model, messages.map((m: any) => ({ role: m.role, content: m.content, images: m.images })), { temperature, maxTokens, tracking })
    return NextResponse.json({ success: true, content: result.content, model: result.model, provider: result.provider, usage: result.usage, durationMs: result.durationMs })
  } catch (e: any) { console.error('POST /api/llm/chat error:', e); return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 }) }
}
