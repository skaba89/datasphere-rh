import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ImportRow {
  nom: string
  prenoms: string
  matricule?: string
  cnssNumero?: string
  sexe?: string
  telephone?: string
  email?: string
  poste: string
  dateEmbauche: string
  salaireBase: number
  contractType: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rows, dryRun, companyId } = body as { rows: ImportRow[]; dryRun: boolean; companyId: string }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne à importer' }, { status: 400 })
    }

    // Récupérer la company
    const company = companyId
      ? await db.company.findUnique({ where: { id: companyId } })
      : await db.company.findFirst()

    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    }

    // Validation
    const errors: Array<{ row: number; field: string; message: string }> = []
    const valid: Array<{ row: number; data: ImportRow; matricule: string }> = []

    const existingMatricules = new Set(
      (await db.employee.findMany({ select: { matricule: true } })).map(e => e.matricule)
    )

    rows.forEach((row, idx) => {
      const rowNum = idx + 2 // +1 for header, +1 for 0-indexed
      if (!row.nom) errors.push({ row: rowNum, field: 'nom', message: 'Nom requis' })
      if (!row.prenoms) errors.push({ row: rowNum, field: 'prenoms', message: 'Prénoms requis' })
      if (!row.poste) errors.push({ row: rowNum, field: 'poste', message: 'Poste requis' })
      if (!row.dateEmbauche) errors.push({ row: rowNum, field: 'dateEmbauche', message: 'Date d\'embauche requise' })
      if (!row.salaireBase || row.salaireBase <= 0) errors.push({ row: rowNum, field: 'salaireBase', message: 'Salaire de base invalide' })
      if (!row.contractType) errors.push({ row: rowNum, field: 'contractType', message: 'Type de contrat requis' })

      const matricule = row.matricule || `IMP-${String(idx + 1).padStart(3, '0')}`
      if (existingMatricules.has(matricule)) {
        errors.push({ row: rowNum, field: 'matricule', message: `Matricule ${matricule} déjà utilisé` })
      } else {
        existingMatricules.add(matricule)
      }

      if (row.nom && row.prenoms && row.poste && row.dateEmbauche && row.salaireBase > 0 && row.contractType) {
        valid.push({ row: rowNum, data: { ...row, matricule }, matricule })
      }
    })

    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        totalRows: rows.length,
        validCount: valid.length,
        errorCount: errors.length,
        errors: errors.slice(0, 20), // limit errors displayed
        preview: valid.slice(0, 5).map(v => ({
          matricule: v.matricule,
          nom: v.data.nom,
          prenoms: v.data.prenoms,
          poste: v.data.poste,
          salaireBase: v.data.salaireBase,
        })),
      })
    }

    // Commit transactionnel
    let created = 0
    for (const v of valid) {
      const employee = await db.employee.create({
        data: {
          companyId: company.id,
          matricule: v.matricule,
          nom: v.data.nom,
          prenoms: v.data.prenoms,
          cnssNumero: v.data.cnssNumero || null,
          sexe: v.data.sexe || null,
          telephone: v.data.telephone || null,
          email: v.data.email || null,
          poste: v.data.poste,
          dateEmbauche: v.data.dateEmbauche,
          statut: 'actif',
        },
      })

      await db.contract.create({
        data: {
          employeeId: employee.id,
          type: v.data.contractType,
          dateDebut: v.data.dateEmbauche,
          poste: v.data.poste,
          salaireBase: Number(v.data.salaireBase),
          devise: 'GNF',
          status: 'ACTIF',
        },
      })

      await db.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'employee',
          entityId: employee.id,
          userId: 'import@demo.gn',
          diff: JSON.stringify({ after: { nom: employee.nom, matricule: v.matricule } }),
        },
      })

      created++
    }

    return NextResponse.json({
      dryRun: false,
      totalRows: rows.length,
      created,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
    })
  } catch (error) {
    console.error('POST /api/employees/import error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
