import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.feedback360.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } }, responses: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/feedback360 error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    if (body.feedbackId && body.evaluatorName) {
      // Submit a response
      const resp = await db.feedbackResponse.create({
        data: { feedbackId: body.feedbackId, evaluatorId: body.evaluatorId || null, evaluatorName: body.evaluatorName, evaluatorRole: body.evaluatorRole || 'PAIR', rating: Number(body.rating) || 0, strengths: body.strengths || null, improvements: body.improvements || null },
      })
      return NextResponse.json({ success: true, resp }, { status: 201 })
    }

    // Create feedback360
    const item = await db.feedback360.create({
      data: { companyId: company.id, employeeId: body.employeeId, period: body.period || '2026-S2', status: 'OUVERT' },
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/feedback360 error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
