import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            users: true,
            documents: true,
            notifications: true,
            reports: true,
            trainings: true,
            budgetItems: true,
            jobOffers: true,
            surveys: true,
            skills: true,
            complianceItems: true,
            expenseReports: true,
            interviews: true,
          },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('GET /api/companies/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await db.company.update({
      where: { id },
      data: {
        raisonSociale: body.raisonSociale,
        sigle: body.sigle,
        nif: body.nif,
        rc: body.rc,
        cnssNumero: body.cnssNumero,
        adresse: body.adresse,
        ville: body.ville,
        telephone: body.telephone,
        email: body.email,
        devise: body.devise,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/companies/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que la société existe
    const company = await db.company.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    })

    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    // Vérifier qu'il reste au moins une société après suppression
    const totalCompanies = await db.company.count()
    if (totalCompanies <= 1) {
      return NextResponse.json(
        { error: 'Impossible de supprimer la dernière société. Il doit en rester au moins une.' },
        { status: 400 }
      )
    }

    // La suppression en cascade est gérée par Prisma (onDelete: Cascade sur les relations)
    await db.company.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Société « ${company.raisonSociale} » supprimée avec ${company._count.employees} employé(s) associé(s)`,
    })
  } catch (error: any) {
    console.error('DELETE /api/companies/[id] error:', error)

    // Gérer les erreurs de contrainte d'intégrité
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Impossible de supprimer : des enregistrements liés existent. Supprimez d\'abord les dépendances.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
