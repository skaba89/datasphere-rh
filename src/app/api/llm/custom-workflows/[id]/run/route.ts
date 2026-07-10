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
