import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const companies = await db.company.findMany({
      select: {
        id: true,
        raisonSociale: true,
        sigle: true,
        nif: true,
        rc: true,
        cnssNumero: true,
        adresse: true,
        ville: true,
        telephone: true,
        email: true,
        devise: true,
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

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.raisonSociale || !body.raisonSociale.trim()) {
      return NextResponse.json({ error: 'La raison sociale est obligatoire' }, { status: 400 })
    }

    // Vérifier l'unicité du NIF si fourni
    if (body.nif) {
      const existing = await db.company.findFirst({ where: { nif: body.nif } })
      if (existing) {
        return NextResponse.json({ error: 'Une société avec ce NIF existe déjà' }, { status: 400 })
      }
    }

    // Vérifier l'unicité du RC si fourni
    if (body.rc) {
      const existing = await db.company.findFirst({ where: { rc: body.rc } })
      if (existing) {
        return NextResponse.json({ error: 'Une société avec ce RC existe déjà' }, { status: 400 })
      }
    }

    const company = await db.company.create({
      data: {
        raisonSociale: body.raisonSociale.trim(),
        sigle: body.sigle?.trim() || null,
        nif: body.nif?.trim() || null,
        rc: body.rc?.trim() || null,
        cnssNumero: body.cnssNumero?.trim() || null,
        adresse: body.adresse?.trim() || null,
        ville: body.ville?.trim() || null,
        telephone: body.telephone?.trim() || null,
        email: body.email?.trim() || null,
        devise: body.devise || 'GNF',
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error('POST /api/companies error:', error)
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
  }
}
