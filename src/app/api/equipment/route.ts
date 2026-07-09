import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.equipment.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/equipment error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.equipment.create({
      data: { companyId: company.id, name: body.name, category: body.category || 'IT', serialNumber: body.serialNumber || null, brand: body.brand || null, model: body.model || null, purchaseDate: body.purchaseDate || null, purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : null, condition: body.condition || 'NEUF', status: body.status || 'EN_STOCK', notes: body.notes || null },
    })
    await db.auditLog.create({ data: { action: 'CREATE', entityType: 'equipment', entityId: item.id, userId: 'admin@demo.gn', diff: JSON.stringify({ after: { name: body.name } }) } })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/equipment error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
