import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// GET /api/dashboard-widgets — liste les widgets du dashboard personnalisé
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  const widgets = await db.dashboardWidget.findMany({
    where: { companyId: ctx.companyId, isActive: true },
    orderBy: { position: 'asc' },
  })
  return NextResponse.json({
    widgets: widgets.map(w => ({
      ...w,
      config: (() => { try { return JSON.parse(w.config) } catch { return {} } })(),
    })),
  })
}

// POST /api/dashboard-widgets — crée un widget
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request)
  if ('error' in ctx) return ctx.error
  const body = await request.json()
  if (!body.title || !body.widgetType || !body.dataSource) {
    return NextResponse.json({ error: 'title, widgetType, dataSource requis' }, { status: 400 })
  }
  const widget = await db.dashboardWidget.create({
    data: {
      companyId: ctx.companyId,
      userId: ctx.user?.userId || null,
      widgetType: body.widgetType,
      title: body.title,
      dataSource: body.dataSource,
      config: JSON.stringify(body.config || {}),
      position: body.position || 0,
      isActive: true,
    },
  })
  return NextResponse.json({ success: true, widget })
}
