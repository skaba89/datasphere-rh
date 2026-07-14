import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const leaves = await db.leaveRequest.findMany({
      where: {
        employee: { companyId: ctx.companyId },
      },
      include: {
        employee: {
          select: {
            nom: true,
            prenoms: true,
            matricule: true,
            poste: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leaves)
  } catch (error) {
    console.error('GET /api/leaves error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
