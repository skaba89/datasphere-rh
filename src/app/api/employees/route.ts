import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const employees = await db.employee.findMany({
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { nom: 'asc' },
    })

    const result = employees.map(e => ({
      id: e.id,
      matricule: e.matricule,
      nom: e.nom,
      prenoms: e.prenoms,
      cnssNumero: e.cnssNumero,
      poste: e.poste,
      dateEmbauche: e.dateEmbauche,
      statut: e.statut,
      sexe: e.sexe,
      contract: e.contracts && e.contracts.length > 0 ? {
        type: e.contracts[0].type,
        salaireBase: e.contracts[0].salaireBase,
      } : null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/employees error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.nom || !body.prenoms || !body.poste || !body.dateEmbauche || !body.salaireBase || !body.contractType) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      )
    }

    const company = await db.company.findFirst()
    if (!company) {
      return NextResponse.json({ error: 'Aucune société configurée' }, { status: 400 })
    }

    const count = await db.employee.count()
    const matricule = body.matricule || `DS-${String(count + 1).padStart(3, '0')}`

    const existing = await db.employee.findUnique({ where: { matricule } })
    if (existing) {
      return NextResponse.json({ error: 'Matricule déjà utilisé' }, { status: 400 })
    }

    const employee = await db.employee.create({
      data: {
        companyId: company.id,
        matricule,
        nom: body.nom,
        prenoms: body.prenoms,
        cnssNumero: body.cnssNumero || null,
        dateNaissance: body.dateNaissance || null,
        sexe: body.sexe || null,
        telephone: body.telephone || null,
        email: body.email || null,
        poste: body.poste,
        dateEmbauche: body.dateEmbauche,
        statut: 'actif',
        situationFamiliale: body.situationFamiliale || null,
        nombreEnfants: body.nombreEnfants || 0,
      },
    })

    await db.contract.create({
      data: {
        employeeId: employee.id,
        type: body.contractType,
        dateDebut: body.dateEmbauche,
        dateFin: body.dateFin || null,
        poste: body.poste,
        salaireBase: Number(body.salaireBase),
        devise: 'GNF',
        motifCdd: body.contractType === 'CDD' ? (body.motifCdd || 'Renouvellement') : null,
        status: 'ACTIF',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'employee',
        entityId: employee.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { nom: employee.nom, prenoms: employee.prenoms, matricule } }),
      },
    })

    return NextResponse.json({ success: true, employee }, { status: 201 })
  } catch (error) {
    console.error('POST /api/employees error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
