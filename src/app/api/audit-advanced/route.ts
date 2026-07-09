import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/audit-advanced?module=XXX&limit=50
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleFilter = searchParams.get('module')
    const limit = parseInt(searchParams.get('limit') || '50')

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ logs: [], stats: { total: 0, byModule: {}, byAction: {} } })

    const logs = await db.advancedAuditLog.findMany({
      where: { companyId: company.id, ...(moduleFilter ? { module: moduleFilter } : {}) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    })

    // Stats agrégées
    const allLogs = await db.advancedAuditLog.findMany({ where: { companyId: company.id } })
    const byModule: Record<string, number> = {}
    const byAction: Record<string, number> = {}
    for (const l of allLogs) {
      byModule[l.module] = (byModule[l.module] || 0) + 1
      byAction[l.action] = (byAction[l.action] || 0) + 1
    }

    return NextResponse.json({
      logs: logs.map(l => ({
        ...l,
        details: (() => { try { return JSON.parse(l.details || '{}') } catch { return {} } })(),
      })),
      stats: { total: allLogs.length, byModule, byAction },
    })
  } catch (error) {
    console.error('GET /api/audit-advanced error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
