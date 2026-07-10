import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { getLlmSettings, upsertLlmSetting } from '@/lib/llm/settings'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ settings: await getLlmSettings(ctx.companyId) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { providerId, modelId, isDefault, temperature, maxTokens } = await request.json()
  if (!providerId || !modelId) return NextResponse.json({ error: 'providerId et modelId requis' }, { status: 400 })
  return NextResponse.json({ success: true, setting: await upsertLlmSetting(ctx.companyId, { providerId, modelId, isDefault, temperature, maxTokens }) })
}
