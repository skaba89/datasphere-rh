import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.careerPath.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/career-paths error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.careerPath.create({
      data: {
        companyId: company.id, employeeId: body.employeeId,
        currentRole: body.currentRole, targetRole: body.targetRole,
        timeline: body.timeline || '12 mois', readiness: Number(body.readiness) || 3,
        gaps: body.gaps || null, actions: body.actions || null, mentor: body.mentor || null,
      },
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/career-paths error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
