import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.shift.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } } },
      orderBy: { date: 'asc' },
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/shifts error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.shift.create({
      data: { companyId: company.id, employeeId: body.employeeId, date: body.date, startTime: body.startTime, endTime: body.endTime, type: body.type || 'JOURNEE', location: body.location || null, notes: body.notes || null },
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/shifts error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
