import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const evaluations = await db.evaluation.findMany({
      where: {
        employee: { companyId: ctx.companyId },
      },
      include: {
        employee: {
          select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(evaluations)
  } catch (error) {
    console.error('GET /api/evaluations error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
