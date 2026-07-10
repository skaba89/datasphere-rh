import { NextResponse } from 'next/server'
import { chat } from '@/lib/llm/router'
import { getProviderById } from '@/lib/llm/providers'
import { getDefaultProvider } from '@/lib/llm/settings'
import { verifyApiKey, hasScope, type ApiScope } from '@/lib/llm/api-keys'
export async function POST(request: Request) {
  const auth = await verifyApiKey(request)
  if (!auth) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  if (!hasScope(auth.scopes, 'llm:vision' as ApiScope)) return NextResponse.json({ error: 'Scope insuffisant' }, { status: 403 })
  const { provider: forcedProvider, model: forcedModel, images, prompt } = await request.json()
  if (!images?.length || !prompt) return NextResponse.json({ error: 'images[] et prompt requis' }, { status: 400 })
  let providerId = forcedProvider, model = forcedModel
  if (!providerId) { const def = await getDefaultProvider(auth.companyId); providerId = def.provider.id; model = def.model }
  const provider = getProviderById(providerId)!
  const visionModels = provider.models.filter(m => m.tags?.includes('vision'))
  if (visionModels.length > 0 && !provider.models.find(m => m.id === model)?.tags?.includes('vision')) model = visionModels[0].id
  const result = await chat(providerId, model, [{ role: 'user', content: prompt, images: images.map((img: any) => ({ base64: img.base64, mimeType: img.mimeType || 'image/jpeg' })) }], { temperature: 0.5, maxTokens: 1000, tracking: { companyId: auth.companyId, endpoint: 'api_v1_vision', feature: `api_key:${auth.keyName}` } })
  return NextResponse.json({ success: true, content: result.content, model: result.model, provider: result.provider, usage: result.usage, durationMs: result.durationMs })
}
