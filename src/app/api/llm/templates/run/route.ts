import { NextResponse } from 'next/server'
import { chat } from '@/lib/llm/router'
import { getDefaultProvider } from '@/lib/llm/settings'
import { getTemplateById, fillTemplate } from '@/lib/llm/templates'
import { saveGeneration } from '@/lib/llm/generations'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function POST(request: Request) {
  try {
    const { templateId, variables } = await request.json()
    if (!templateId) return NextResponse.json({ error: 'templateId requis' }, { status: 400 })
    const template = getTemplateById(templateId)
    if (!template) return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const { provider, model } = await getDefaultProvider(ctx.companyId)
    const result = await chat(provider.id, model, [{ role: 'system', content: fillTemplate(template.systemPrompt, variables || {}) }, { role: 'user', content: fillTemplate(template.userPrompt, variables || {}) }], { temperature: template.recommendedTemperature, maxTokens: template.recommendedMaxTokens, tracking: { companyId: ctx.companyId, endpoint: 'template_run', feature: `template:${templateId}`, userId: ctx.user?.userId } })
    const saved = await saveGeneration({ companyId: ctx.companyId, type: `template:${templateId}`, title: `${template.title} — ${new Date().toLocaleString('fr-FR')}`, content: result.content, providerId: provider.id, modelId: result.model, promptTokens: result.usage?.promptTokens, completionTokens: result.usage?.completionTokens, totalTokens: result.usage?.totalTokens, durationMs: result.durationMs, metadata: { templateId, variables }, tags: [template.category] }).catch(() => null)
    return NextResponse.json({ success: true, content: result.content, template: { id: template.id, title: template.title, category: template.category }, provider: provider.id, providerLabel: provider.label, model: result.model, usage: result.usage, durationMs: result.durationMs, generationId: saved?.id })
  } catch (e: any) { console.error('POST /api/llm/templates/run error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
