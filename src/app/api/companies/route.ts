import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const companies = await db.company.findMany({
      select: {
        id: true,
        raisonSociale: true,
        sigle: true,
        ville: true,
        _count: { select: { employees: true } },
      },
      orderBy: { raisonSociale: 'asc' },
    })
    return NextResponse.json(companies)
  } catch (error) {
    console.error('GET /api/companies error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
