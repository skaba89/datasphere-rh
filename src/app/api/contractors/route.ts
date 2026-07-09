import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.contractor.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('GET /api/contractors error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.contractor.create({
      data: {
        companyId: company.id, name: body.name,
        type: body.type || 'PRESTATAIRE', service: body.service,
        contractStart: body.contractStart, contractEnd: body.contractEnd || null,
        monthlyRate: body.monthlyRate ? Number(body.monthlyRate) : null,
        dailyRate: body.dailyRate ? Number(body.dailyRate) : null,
        contactName: body.contactName || null, contactEmail: body.contactEmail || null,
        contactPhone: body.contactPhone || null, notes: body.notes || null,
      },
    })
    await db.auditLog.create({ data: { action: 'CREATE', entityType: 'contractor', entityId: item.id, userId: 'admin@demo.gn', diff: JSON.stringify({ after: { name: body.name, service: body.service } }) } })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/contractors error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
