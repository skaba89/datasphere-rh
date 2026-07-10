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
