import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.benefit.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/benefits error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.benefit.create({
      data: { companyId: company.id, employeeId: body.employeeId, type: body.type, label: body.label, provider: body.provider || null, employeeContribution: Number(body.employeeContribution) || 0, employerContribution: Number(body.employerContribution) || 0, startDate: body.startDate, endDate: body.endDate || null, notes: body.notes || null },
    })
    await db.auditLog.create({ data: { action: 'CREATE', entityType: 'benefit', entityId: item.id, userId: 'admin@demo.gn', diff: JSON.stringify({ after: { type: body.type, label: body.label } }) } })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/benefits error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
