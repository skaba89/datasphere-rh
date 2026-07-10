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
