import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// GET /api/plugins — liste les plugins installés
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  const plugins = await db.plugin.findMany({
    where: { companyId: ctx.companyId },
    orderBy: { installedAt: 'desc' },
  })
  return NextResponse.json({
    plugins: plugins.map(p => ({
      ...p,
      manifest: (() => { try { return JSON.parse(p.manifest) } catch { return {} } })(),
      config: (() => { try { return JSON.parse(p.config || '{}') } catch { return {} } })(),
    })),
  })
}

// POST /api/plugins — installe un plugin
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  const body = await request.json()
  if (!body.name || !body.category) {
    return NextResponse.json({ error: 'name et category requis' }, { status: 400 })
  }
  const plugin = await db.plugin.create({
    data: {
      companyId: ctx.companyId,
      name: body.name,
      description: body.description || null,
      category: body.category,
      version: body.version || '1.0.0',
      manifest: JSON.stringify(body.manifest || {}),
      config: body.config ? JSON.stringify(body.config) : null,
      isActive: true,
      isInstalled: true,
    },
  })
  return NextResponse.json({ success: true, plugin })
}
