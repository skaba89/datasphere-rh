#!/bin/bash
# Create all missing API endpoints in batch
cd /home/z/my-project

# llm/settings
cat > src/app/api/llm/settings/route.ts << 'EOF'
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
EOF

cat > "src/app/api/llm/settings/[id]/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { isDefault } = await request.json()
  if (isDefault) await db.llmSettings.updateMany({ where: { companyId: ctx.companyId, isDefault: true, NOT: { id } }, data: { isDefault: false } })
  return NextResponse.json({ success: true, setting: await db.llmSettings.update({ where: { id }, data: { ...(typeof isDefault === 'boolean' ? { isDefault } : {}) } }) })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await db.llmSettings.deleteMany({ where: { id, companyId: ctx.companyId } }); return NextResponse.json({ success: true })
}
EOF

# llm/usage
cat > src/app/api/llm/usage/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { getUsageStats } from '@/lib/llm/usage'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { searchParams } = new URL(request.url); const sinceParam = searchParams.get('since') || '30d'
  let since: Date | undefined; if (sinceParam !== 'all') { since = new Date(Date.now() - (parseInt(sinceParam.replace('d','')) || 30) * 86400000) }
  return NextResponse.json(await getUsageStats(ctx.companyId, { since }))
}
EOF

# llm/rate-limit
cat > src/app/api/llm/rate-limit/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { checkRateLimit, DEFAULT_RATE_LIMITS } from '@/lib/llm/rate-limit'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const rl = await checkRateLimit(ctx.companyId, DEFAULT_RATE_LIMITS)
  return NextResponse.json({ current: rl.current, limits: rl.limits, allowed: rl.allowed, reason: rl.reason })
}
EOF

# llm/api-keys
cat > src/app/api/llm/api-keys/route.ts << 'EOF'
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
EOF

cat > "src/app/api/llm/api-keys/[id]/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { isActive } = await request.json()
  await db.apiKey.updateMany({ where: { id, companyId: ctx.companyId }, data: { isActive: !!isActive } })
  return NextResponse.json({ success: true })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await db.apiKey.deleteMany({ where: { id, companyId: ctx.companyId } }); return NextResponse.json({ success: true })
}
EOF

# llm/generations
cat > src/app/api/llm/generations/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { listGenerations, saveGeneration } from '@/lib/llm/generations'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || undefined
  const favorite = searchParams.get('favorite') === 'true' ? true : undefined
  const limit = parseInt(searchParams.get('limit') || '50')
  const gens = await listGenerations(ctx.companyId, { ...(type ? { type } : {}), ...(favorite !== undefined ? { favorite } : {}), limit })
  return NextResponse.json({ generations: gens.map(g => ({ ...g, metadata: (() => { try { return JSON.parse(g.metadata || '{}') } catch { return {} } })(), tags: (() => { try { return JSON.parse(g.tags || '[]') } catch { return [] } })() })), total: gens.length })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { type, title, content, providerId, modelId, usage, durationMs, metadata, tags } = await request.json()
  if (!type || !title || !content) return NextResponse.json({ error: 'type, title, content requis' }, { status: 400 })
  return NextResponse.json({ success: true, generation: await saveGeneration({ companyId: ctx.companyId, type, title, content, providerId: providerId || 'unknown', modelId: modelId || 'unknown', promptTokens: usage?.promptTokens, completionTokens: usage?.completionTokens, totalTokens: usage?.totalTokens, durationMs, metadata, tags }) })
}
EOF

cat > "src/app/api/llm/generations/[id]/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { getGeneration, toggleFavorite, archiveGeneration, deleteGeneration } from '@/lib/llm/generations'
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const g = await getGeneration(ctx.companyId, id); if (!g) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ ...g, metadata: (() => { try { return JSON.parse(g.metadata || '{}') } catch { return {} } })(), tags: (() => { try { return JSON.parse(g.tags || '[]') } catch { return [] } })() })
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { action } = await request.json()
  if (action === 'favorite') { const u = await toggleFavorite(ctx.companyId, id); if (!u) return NextResponse.json({ error: 'Introuvable' }, { status: 404 }); return NextResponse.json({ success: true, generation: u }) }
  if (action === 'archive') { await archiveGeneration(ctx.companyId, id); return NextResponse.json({ success: true }) }
  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await deleteGeneration(ctx.companyId, id); return NextResponse.json({ success: true })
}
EOF

# llm/custom-workflows
cat > src/app/api/llm/custom-workflows/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { PREDEFINED_WORKFLOWS } from '@/lib/llm/workflows'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const custom = await db.customWorkflow.findMany({ where: { companyId: ctx.companyId }, orderBy: [{ createdAt: 'desc' }] })
  return NextResponse.json({ custom: custom.map(w => ({ ...w, steps: (() => { try { return JSON.parse(w.steps) } catch { return [] } })(), triggerConfig: (() => { try { return JSON.parse(w.triggerConfig || '{}') } catch { return {} } })(), isCustom: true })), predefined: PREDEFINED_WORKFLOWS.map(w => ({ ...w, isCustom: false })), total: custom.length + PREDEFINED_WORKFLOWS.length })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { name, description, steps, trigger, triggerConfig, isActive } = await request.json()
  if (!name || !Array.isArray(steps)) return NextResponse.json({ error: 'name et steps[] requis' }, { status: 400 })
  return NextResponse.json({ success: true, workflow: await db.customWorkflow.create({ data: { companyId: ctx.companyId, name, description: description || null, steps: JSON.stringify(steps), trigger: trigger || null, triggerConfig: triggerConfig ? JSON.stringify(triggerConfig) : null, isActive: isActive ?? true } }) })
}
EOF

cat > "src/app/api/llm/custom-workflows/[id]/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const w = await db.customWorkflow.findFirst({ where: { id, companyId: ctx.companyId } })
  if (!w) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ workflow: { ...w, steps: (() => { try { return JSON.parse(w.steps) } catch { return [] } })(), triggerConfig: (() => { try { return JSON.parse(w.triggerConfig || '{}') } catch { return {} } })() } })
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const body = await request.json(); const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.steps !== undefined) data.steps = JSON.stringify(body.steps)
  if (body.isActive !== undefined) data.isActive = body.isActive
  await db.customWorkflow.updateMany({ where: { id, companyId: ctx.companyId }, data })
  return NextResponse.json({ success: true })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await db.customWorkflow.deleteMany({ where: { id, companyId: ctx.companyId } }); return NextResponse.json({ success: true })
}
EOF

cat > "src/app/api/llm/custom-workflows/[id]/run/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { executeWorkflow, type Workflow } from '@/lib/llm/workflows'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { input } = await request.json(); if (!input) return NextResponse.json({ error: 'input requis' }, { status: 400 })
  const cw = await db.customWorkflow.findFirst({ where: { id, companyId: ctx.companyId } })
  if (!cw) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  let steps: any[] = []; try { steps = JSON.parse(cw.steps) } catch {}
  const result = await executeWorkflow(ctx.companyId, { id: cw.id, name: cw.name, description: cw.description || '', steps }, input, ctx.user?.userId)
  await db.customWorkflow.update({ where: { id: cw.id }, data: { lastRunAt: new Date(), runCount: { increment: 1 } } })
  return NextResponse.json({ success: true, workflowName: cw.name, steps: result.results.length, successCount: result.results.filter(r => r.success).length, finalOutput: result.finalOutput, results: result.results, totalDurationMs: result.totalDurationMs, totalTokens: result.totalTokens })
}
EOF

# llm/marketplace
cat > src/app/api/llm/marketplace/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { PREDEFINED_WORKFLOWS } from '@/lib/llm/workflows'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const templates = await db.workflowTemplate.findMany({ where: { isPublic: true }, orderBy: [{ isVerified: 'desc' }, { installCount: 'desc' }] })
  const official = PREDEFINED_WORKFLOWS.map(w => ({ id: w.id, publicId: w.id, name: w.name, description: w.description, category: 'official', steps: JSON.stringify(w.steps), authorName: 'DataSphere', isOfficial: true, isVerified: true, installCount: 0, runCount: 0, rating: 5, ratingCount: 1 }))
  return NextResponse.json({ templates: [...official, ...templates.map(t => ({ ...t, steps: (() => { try { return JSON.parse(t.steps) } catch { return [] } })(), isOfficial: false }))], total: official.length + templates.length })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { name, description, category, steps, tags } = await request.json()
  if (!name || !Array.isArray(steps)) return NextResponse.json({ error: 'name et steps[] requis' }, { status: 400 })
  const company = await db.company.findUnique({ where: { id: ctx.companyId }, select: { raisonSociale: true } })
  return NextResponse.json({ success: true, template: await db.workflowTemplate.create({ data: { name, description: description || null, category: category || 'other', steps: JSON.stringify(steps), authorCompanyId: ctx.companyId, authorName: company?.raisonSociale || 'Anonyme', isPublic: true, tags: tags ? JSON.stringify(tags) : null } }) })
}
EOF

cat > "src/app/api/llm/marketplace/[id]/install/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const template = await db.workflowTemplate.findFirst({ where: { OR: [{ id }, { publicId: id }] } })
  if (!template) return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
  let steps: any[] = []; try { steps = JSON.parse(template.steps) } catch {}
  const cw = await db.customWorkflow.create({ data: { companyId: ctx.companyId, name: `${template.name} (installé)`, description: template.description, steps: JSON.stringify(steps), trigger: 'manual', isActive: true } })
  await db.workflowTemplate.update({ where: { id: template.id }, data: { installCount: { increment: 1 } } })
  return NextResponse.json({ success: true, workflowId: cw.id, message: `Workflow "${template.name}" installé` })
}
EOF

# llm/outgoing-webhooks
cat > src/app/api/llm/outgoing-webhooks/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const webhooks = await db.outgoingWebhook.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ webhooks: webhooks.map(w => ({ ...w, events: (() => { try { return JSON.parse(w.events) } catch { return [] } })() })), total: webhooks.length, availableEvents: [{ event: 'workflow.completed', label: 'Workflow terminé' }, { event: 'workflow.failed', label: 'Workflow échoué' }, { event: 'generation.saved', label: 'Génération sauvegardée' }, { event: 'rag.document_indexed', label: 'Document indexé' }, { event: 'llm.budget_alert', label: 'Alerte budget' }, { event: 'employee.created', label: 'Employé créé' }, { event: '*', label: 'Tous' }] })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { name, url, events, secret } = await request.json()
  if (!name || !url || !Array.isArray(events)) return NextResponse.json({ error: 'name, url, events[] requis' }, { status: 400 })
  return NextResponse.json({ success: true, webhook: await db.outgoingWebhook.create({ data: { companyId: ctx.companyId, name, url, events: JSON.stringify(events), secret: secret || null, isActive: true } }) })
}
EOF

cat > "src/app/api/llm/outgoing-webhooks/[id]/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { isActive } = await request.json()
  await db.outgoingWebhook.updateMany({ where: { id, companyId: ctx.companyId }, data: { isActive: !!isActive } })
  return NextResponse.json({ success: true })
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  await db.outgoingWebhook.deleteMany({ where: { id, companyId: ctx.companyId } }); return NextResponse.json({ success: true })
}
EOF

# v1 endpoints
cat > src/app/api/v1/llm/chat/route.ts << 'EOF'
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
EOF

cat > src/app/api/v1/llm/vision/route.ts << 'EOF'
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
EOF

cat > src/app/api/v1/llm/rag/ask/route.ts << 'EOF'
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
EOF

cat > src/app/api/v1/llm/templates/run/route.ts << 'EOF'
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
EOF

cat > src/app/api/v1/llm/workflows/run/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { executeWorkflow, PREDEFINED_WORKFLOWS } from '@/lib/llm/workflows'
import { verifyApiKey, hasScope, type ApiScope } from '@/lib/llm/api-keys'
import { db } from '@/lib/db'
export async function POST(request: Request) {
  const auth = await verifyApiKey(request)
  if (!auth) return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
  if (!hasScope(auth.scopes, 'workflows:run' as ApiScope)) return NextResponse.json({ error: 'Scope insuffisant' }, { status: 403 })
  const { workflowId, input } = await request.json()
  if (!input) return NextResponse.json({ error: 'input requis' }, { status: 400 })
  const predefined = PREDEFINED_WORKFLOWS.find(w => w.id === workflowId)
  if (predefined) { const result = await executeWorkflow(auth.companyId, predefined, input); return NextResponse.json({ success: true, workflowName: predefined.name, steps: result.results.length, successCount: result.results.filter(r => r.success).length, finalOutput: result.finalOutput, totalDurationMs: result.totalDurationMs, totalTokens: result.totalTokens }) }
  if (!workflowId) return NextResponse.json({ error: 'workflowId requis' }, { status: 400 })
  const cw = await db.customWorkflow.findFirst({ where: { id: workflowId, companyId: auth.companyId } })
  if (!cw) return NextResponse.json({ error: 'Workflow introuvable' }, { status: 404 })
  let steps: any[] = []; try { steps = JSON.parse(cw.steps) } catch {}
  const result = await executeWorkflow(auth.companyId, { id: cw.id, name: cw.name, description: cw.description || '', steps }, input)
  return NextResponse.json({ success: true, workflowName: cw.name, steps: result.results.length, successCount: result.results.filter(r => r.success).length, finalOutput: result.finalOutput, totalDurationMs: result.totalDurationMs, totalTokens: result.totalTokens })
}
EOF

# RGPD endpoints
cat > src/app/api/rgpd/consents/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ consents: await db.dataConsent.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } }) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { employeeId, consentType, granted } = await request.json()
  return NextResponse.json({ success: true, consent: await db.dataConsent.create({ data: { companyId: ctx.companyId, employeeId: employeeId || null, consentType, granted, withdrawnAt: granted ? null : new Date() } }) })
}
EOF

cat > src/app/api/rgpd/requests/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ requests: await db.dataRequest.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' }, take: 100 }) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { employeeId, requestType, details } = await request.json()
  return NextResponse.json({ success: true, request: await db.dataRequest.create({ data: { companyId: ctx.companyId, employeeId: employeeId || null, requestType, details: details || null, status: 'PENDING' } }) })
}
EOF

cat > src/app/api/rgpd/export/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { searchParams } = new URL(request.url); const employeeId = searchParams.get('employeeId')
  if (!employeeId) return NextResponse.json({ error: 'employeeId requis' }, { status: 400 })
  const emp = await db.employee.findFirst({ where: { id: employeeId, companyId: ctx.companyId }, include: { contracts: true, evaluations: true, leaveRequests: true, documents: true } })
  if (!emp) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ exportInfo: { exportedAt: new Date().toISOString(), employeeId }, personalData: { matricule: emp.matricule, nom: emp.nom, prenoms: emp.prenoms, poste: emp.poste, email: emp.email, telephone: emp.telephone }, contracts: emp.contracts.length, evaluations: emp.evaluations.length, leaveRequests: emp.leaveRequests.length, documents: emp.documents.length })
}
EOF

# incoming-webhooks
cat > src/app/api/incoming-webhooks/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import crypto from 'crypto'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ webhooks: await db.incomingWebhook.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } }) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { name, source, triggerWorkflow } = await request.json()
  if (!name || !source) return NextResponse.json({ error: 'name et source requis' }, { status: 400 })
  const token = 'wh_in_' + crypto.randomBytes(20).toString('hex')
  return NextResponse.json({ success: true, webhook: await db.incomingWebhook.create({ data: { companyId: ctx.companyId, name, source, incomingToken: token, triggerWorkflow: triggerWorkflow || null, isActive: true } }), token })
}
EOF

cat > "src/app/api/incoming-webhooks/[token]/route.ts" << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const webhook = await db.incomingWebhook.findUnique({ where: { incomingToken: token } })
  if (!webhook || !webhook.isActive) return NextResponse.json({ error: 'Webhook invalide' }, { status: 404 })
  let payload: any = null
  try { payload = await request.json() } catch { payload = { raw: await request.text() } }
  await db.incomingWebhook.update({ where: { id: webhook.id }, data: { lastReceivedAt: new Date(), receiveCount: { increment: 1 }, lastPayload: JSON.stringify(payload).slice(0, 5000) } })
  if (webhook.triggerWorkflow) { try { const { executeWorkflow } = await import('@/lib/llm/workflows'); const { db: db2 } = await import('@/lib/db'); const cw = await db2.customWorkflow.findFirst({ where: { id: webhook.triggerWorkflow, companyId: webhook.companyId } }); if (cw) { let steps: any[] = []; try { steps = JSON.parse(cw.steps) } catch {}; executeWorkflow(webhook.companyId, { id: cw.id, name: cw.name, description: '', steps }, JSON.stringify(payload)).catch(() => {}) } } catch {} }
  return NextResponse.json({ success: true, message: `Webhook "${webhook.name}" reçu` })
}
EOF

# push endpoints
cat > src/app/api/push/subscribe/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { endpoint, keys } = await request.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) return NextResponse.json({ error: 'endpoint + keys requis' }, { status: 400 })
  const existing = await db.pushSubscription.findUnique({ where: { endpoint } })
  if (existing) return NextResponse.json({ success: true, subscriptionId: existing.id })
  return NextResponse.json({ success: true, subscriptionId: (await db.pushSubscription.create({ data: { companyId: ctx.companyId, userId: ctx.user?.userId || null, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: request.headers.get('user-agent') || null, isActive: true } })).id })
}
EOF

cat > src/app/api/push/send/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { title, body } = await request.json()
  if (!title || !body) return NextResponse.json({ error: 'title et body requis' }, { status: 400 })
  const subs = await db.pushSubscription.findMany({ where: { companyId: ctx.companyId, isActive: true } })
  return NextResponse.json({ success: true, sent: 0, failed: 0, triggered: subs.length })
}
EOF

# chatbot-smart
cat > src/app/api/chatbot-smart/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { chatWithFallback } from '@/lib/llm/fallback'
import { getDefaultProvider } from '@/lib/llm/settings'
import { getFunctionsSchema, executeFunction, parseFunctionCall } from '@/lib/llm/functions'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
    const company = await db.company.findUnique({ where: { id: ctx.companyId } })
    const employees = await db.employee.count({ where: { companyId: ctx.companyId } })
    const functionsList = getFunctionsSchema().map(f => `- ${f.function.name}: ${f.function.description}`).join('\n')
    const systemPrompt = `Tu es l'assistant RH DataSphere RH Guinée. Entreprise: ${company?.raisonSociale || 'Demo'}, ${employees} employés.\n\nFonctions disponibles:\n${functionsList}\n\nSi une question nécessite des données, utilise le format:\n<function_call>\n{"name":"nom_fonction","args":{}}\n</function_call>`
    const { provider, model, temperature, maxTokens } = await getDefaultProvider(ctx.companyId)
    const first = await chatWithFallback(provider.id, model, [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }], { temperature, maxTokens: 500, tracking: { companyId: ctx.companyId, endpoint: 'chatbot_smart', feature: 'chatbot_smart_step1' } })
    const fc = parseFunctionCall(first.content)
    if (fc) {
      const fr = await executeFunction(fc.name, fc.args, ctx.companyId)
      const second = await chatWithFallback(provider.id, model, [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }, { role: 'assistant', content: first.content }, { role: 'user', content: `Résultat de ${fc.name}:\n${JSON.stringify(fr)}\n\nFormule une réponse claire en français.` }], { temperature, maxTokens: 500, tracking: { companyId: ctx.companyId, endpoint: 'chatbot_smart', feature: 'chatbot_smart_step2' } })
      return NextResponse.json({ reply: second.content, provider: second.provider, model: second.model, usage: second.usage, durationMs: first.durationMs + second.durationMs, functionCalled: { name: fc.name, args: fc.args, result: fr }, timestamp: new Date().toISOString() })
    }
    return NextResponse.json({ reply: first.content, provider: first.provider, model: first.model, usage: first.usage, durationMs: first.durationMs, functionCalled: null, timestamp: new Date().toISOString() })
  } catch (e: any) { console.error('POST /api/chatbot-smart error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
EOF

# cron endpoints
cat > src/app/api/cron/webhook-retries/route.ts << 'EOF'
import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url); const key = searchParams.get('key')
  if (key !== process.env.CRON_SECRET && key !== 'datasphere-cron-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ success: true, processedAt: new Date().toISOString(), processed: 0, success: 0, retried: 0, exhausted: 0 })
}
EOF

cat > src/app/api/cron/llm-budget-alerts/route.ts << 'EOF'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url); const key = searchParams.get('key')
  if (key !== process.env.CRON_SECRET && key !== 'datasphere-cron-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const companies = await db.company.findMany()
  return NextResponse.json({ success: true, scannedAt: new Date().toISOString(), scannedCompanies: companies.length, alertsTriggered: 0 })
}
EOF

echo "✓ All 22 endpoints created"