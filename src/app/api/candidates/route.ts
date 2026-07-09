import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const candidates = await db.candidate.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(candidates)
  } catch (error) {
    console.error('GET /api/candidates error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    const candidate = await db.candidate.create({
      data: {
        companyId: company.id,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        positionApplied: body.positionApplied,
        source: body.source || 'PORTAIL',
        expectedSalary: body.expectedSalary ? Number(body.expectedSalary) : null,
        availability: body.availability || null,
        notes: body.notes || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'candidate',
        entityId: candidate.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { name: `${body.firstName} ${body.lastName}`, position: body.positionApplied } }),
      },
    })

    return NextResponse.json({ success: true, candidate }, { status: 201 })
  } catch (error) {
    console.error('POST /api/candidates error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
