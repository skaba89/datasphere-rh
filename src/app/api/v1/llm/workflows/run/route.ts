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
