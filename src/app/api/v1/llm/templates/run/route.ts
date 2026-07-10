import { NextResponse } from 'next/server'
import { chat } from '@/lib/llm/router'
import { getDefaultProvider } from '@/lib/llm/settings'
import { getTemplateById, fillTemplate } from '@/lib/llm/templates'
import { saveGeneration } from '@/lib/llm/generations'
import { verifyApiKey, hasScope, type ApiScope } from '@/lib/llm/api-keys'
export async function POST(request: Request) {
  const auth = await verifyApiKey(request)
  if (!auth) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  if (!hasScope(auth.scopes, 'templates:run' as ApiScope)) return NextResponse.json({ error: 'Scope insuffisant' }, { status: 403 })
  const { templateId, variables } = await request.json()
  if (!templateId) return NextResponse.json({ error: 'templateId requis' }, { status: 400 })
  const template = getTemplateById(templateId)
  if (!template) return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
  const { provider, model } = await getDefaultProvider(auth.companyId)
  const result = await chat(provider.id, model, [{ role: 'system', content: fillTemplate(template.systemPrompt, variables || {}) }, { role: 'user', content: fillTemplate(template.userPrompt, variables || {}) }], { temperature: template.recommendedTemperature, maxTokens: template.recommendedMaxTokens, tracking: { companyId: auth.companyId, endpoint: 'api_v1_template', feature: `api_key:${auth.keyName}` } })
  const saved = await saveGeneration({ companyId: auth.companyId, type: `template:${templateId}`, title: `${template.title} (API v1)`, content: result.content, providerId: provider.id, modelId: result.model, promptTokens: result.usage?.promptTokens, completionTokens: result.usage?.completionTokens, totalTokens: result.usage?.totalTokens, durationMs: result.durationMs, metadata: { templateId, variables, source: 'api_v1' } }).catch(() => null)
  return NextResponse.json({ success: true, content: result.content, template: { id: template.id, title: template.title, category: template.category }, provider: provider.id, model: result.model, usage: result.usage, durationMs: result.durationMs, generationId: saved?.id })
}
