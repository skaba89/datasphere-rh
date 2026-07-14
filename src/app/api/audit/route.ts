import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    // AuditLog n'a pas de companyId direct, on filtre par les employés de la société
    // ou par entityId correspondant à la société
    const logs = await db.auditLog.findMany({
      where: {
        OR: [
          { entityId: ctx.companyId },
          { entityType: 'company', entityId: ctx.companyId },
          // Logs créés par les utilisateurs de cette société
          { userId: { in: await db.user.findMany({ where: { companyId: ctx.companyId }, select: { email: true } }).then(u => u.map(x => x.email)) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const result = logs.map(l => {
      let diff = null
      try {
        diff = l.diff ? JSON.parse(l.diff) : null
      } catch {
        diff = l.diff
      }
      return {
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        userId: l.userId,
        diff,
        createdAt: l.createdAt,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/audit error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
