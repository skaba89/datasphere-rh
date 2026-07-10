import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { createApiKey, listApiKeys, ALL_SCOPES, SCOPE_LABELS } from '@/lib/llm/api-keys'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ keys: await listApiKeys(ctx.companyId), total: 0, availableScopes: ALL_SCOPES.map(s => ({ id: s, label: SCOPE_LABELS[s] })) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { name, scopes, rateLimitPerHour } = await request.json()
  if (!name || !Array.isArray(scopes)) return NextResponse.json({ error: 'name et scopes[] requis' }, { status: 400 })
  const { apiKey, plainKey } = await createApiKey(ctx.companyId, { name, scopes, rateLimitPerHour })
  return NextResponse.json({ success: true, apiKey: { id: apiKey.id, name: apiKey.name, keyPrefix: apiKey.keyPrefix, scopes }, plainKey, warning: 'Copiez cette clé maintenant.' })
}
