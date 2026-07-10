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
