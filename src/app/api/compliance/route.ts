import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const items = await db.complianceItem.findMany({
      where: { companyId: company.id },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/compliance error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    const item = await db.complianceItem.create({
      data: {
        companyId: company.id,
        title: body.title,
        description: body.description || null,
        category: body.category || 'TRAVAIL',
        status: body.status || 'A_JOUR',
        dueDate: body.dueDate || null,
        lastCheck: body.lastCheck || new Date().toISOString().slice(0, 10),
        frequency: body.frequency || 'ANNUEL',
        responsible: body.responsible || null,
        notes: body.notes || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'compliance_item',
        entityId: item.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { title: body.title, status: body.status } }),
      },
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/compliance error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
