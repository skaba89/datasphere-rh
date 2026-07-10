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
