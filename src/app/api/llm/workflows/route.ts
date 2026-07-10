import { NextResponse } from 'next/server'
import { executeWorkflow, PREDEFINED_WORKFLOWS } from '@/lib/llm/workflows'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function GET() { return NextResponse.json({ workflows: PREDEFINED_WORKFLOWS.map(w => ({ ...w, stepsCount: w.steps.length })), total: PREDEFINED_WORKFLOWS.length }) }

export async function POST(request: Request) {
  try {
    const { workflowId, input } = await request.json()
    if (!input) return NextResponse.json({ error: 'input requis' }, { status: 400 })
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const workflow = PREDEFINED_WORKFLOWS.find(w => w.id === workflowId)
    if (!workflow) return NextResponse.json({ error: `Workflow inconnu: ${workflowId}` }, { status: 400 })
    const result = await executeWorkflow(ctx.companyId, workflow, input, ctx.user?.userId)
    return NextResponse.json({ success: true, workflowName: workflow.name, steps: result.results.length, successCount: result.results.filter(r => r.success).length, finalOutput: result.finalOutput, results: result.results, totalDurationMs: result.totalDurationMs, totalTokens: result.totalTokens })
  } catch (e: any) { console.error('POST /api/llm/workflows error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
