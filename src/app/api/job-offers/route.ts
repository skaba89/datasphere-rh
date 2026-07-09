import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const offers = await db.jobOffer.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(offers)
  } catch (error) {
    console.error('GET /api/job-offers error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    const offer = await db.jobOffer.create({
      data: {
        companyId: company.id,
        title: body.title,
        description: body.description || null,
        department: body.department || null,
        location: body.location || 'Conakry',
        contractType: body.contractType || 'CDI',
        salaryMin: body.salaryMin ? Number(body.salaryMin) : null,
        salaryMax: body.salaryMax ? Number(body.salaryMax) : null,
        requirements: body.requirements || null,
        benefits: body.benefits || null,
        status: body.status || 'PUBLIEE',
        publishedAt: body.status === 'PUBLIEE' ? new Date() : null,
        closingDate: body.closingDate || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'job_offer',
        entityId: offer.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { title: body.title, status: body.status || 'PUBLIEE' } }),
      },
    })

    return NextResponse.json({ success: true, offer }, { status: 201 })
  } catch (error) {
    console.error('POST /api/job-offers error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
