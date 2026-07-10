import { NextResponse } from 'next/server'
import { chat } from '@/lib/llm/router'
import { getProviderById } from '@/lib/llm/providers'
import { verifyApiKey, hasScope, type ApiScope } from '@/lib/llm/api-keys'
import { getDefaultProvider } from '@/lib/llm/settings'
export async function POST(request: Request) {
  const auth = await verifyApiKey(request)
  if (!auth) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  if (!hasScope(auth.scopes, 'llm:chat' as ApiScope)) return NextResponse.json({ error: 'Scope insuffisant' }, { status: 403 })
  const { provider: forcedProvider, model: forcedModel, messages, temperature, maxTokens } = await request.json()
  let providerId = forcedProvider, model = forcedModel
  if (!providerId) { const def = await getDefaultProvider(auth.companyId); providerId = def.provider.id; model = forcedModel || def.model }
  const result = await chat(providerId, model, messages.map((m: any) => ({ role: m.role, content: m.content, images: m.images })), { temperature, maxTokens, tracking: { companyId: auth.companyId, endpoint: 'api_v1_chat', feature: `api_key:${auth.keyName}` } })
  return NextResponse.json({ success: true, content: result.content, model: result.model, provider: result.provider, usage: result.usage, durationMs: result.durationMs })
}
