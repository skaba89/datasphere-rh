import { NextResponse } from 'next/server'
import { LLM_PROVIDERS, isProviderConfigured } from '@/lib/llm/providers'

export async function GET() {
  try {
    const providers = LLM_PROVIDERS.map(p => ({ id: p.id, label: p.label, description: p.description, color: p.color, apiStyle: p.apiStyle, docsUrl: p.docsUrl, envVar: p.envVar, defaultModel: p.defaultModel, configured: isProviderConfigured(p), models: p.models }))
    const configuredCount = providers.filter(p => p.configured).length
    return NextResponse.json({ providers, total: providers.length, configured: configuredCount, notConfigured: providers.length - configuredCount })
  } catch (error) { console.error('GET /api/llm/providers error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
