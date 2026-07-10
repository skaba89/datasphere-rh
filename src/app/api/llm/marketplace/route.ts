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
