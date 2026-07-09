import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const logs = await db.auditLog.findMany({
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
        createdAt: l.createdAt.toISOString(),
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/audit error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
