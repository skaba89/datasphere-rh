import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.interview.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/interviews error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.interview.create({
      data: {
        companyId: company.id, employeeId: body.employeeId,
        type: body.type || 'ANNUEL',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        location: body.location || null, conductedBy: body.conductedBy || null,
        agenda: body.agenda || null, minutes: body.minutes || null, rating: Number(body.rating) || 0,
      },
    })
    await db.auditLog.create({ data: { action: 'CREATE', entityType: 'interview', entityId: item.id, userId: 'admin@demo.gn', diff: JSON.stringify({ after: { employeeId: body.employeeId, type: body.type } }) } })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/interviews error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
