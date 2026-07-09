import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.healthRecord.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } } },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/health error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.healthRecord.create({
      data: { companyId: company.id, employeeId: body.employeeId, type: body.type, date: body.date, nextDate: body.nextDate || null, status: body.status || 'PLANIFIE', provider: body.provider || null, result: body.result || null, notes: body.notes || null },
    })
    await db.auditLog.create({ data: { action: 'CREATE', entityType: 'health_record', entityId: item.id, userId: 'admin@demo.gn', diff: JSON.stringify({ after: { type: body.type, employeeId: body.employeeId } }) } })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/health error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
