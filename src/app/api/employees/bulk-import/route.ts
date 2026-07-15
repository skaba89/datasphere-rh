import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

/**
 * POST /api/employees/bulk-import
 *
 * Import en masse d'employés via CSV.
 *
 * Body: { employees: Array<{ matricule, nom, prenoms, poste, ... }> }
 * ou { csv: "matricule,nom,prenoms,poste,..." }
 *
 * Retourne un rapport : created, errors, skipped
 */
export async function POST(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    const body = await request.json()
    let employees: any[] = []

    // Format 1 : tableau d'objets
    if (Array.isArray(body.employees)) {
      employees = body.employees
    }
    // Format 2 : CSV string
    else if (body.csv) {
      employees = parseCSV(body.csv)
    } else {
      return NextResponse.json(
        { error: 'Format invalide. Envoyez { employees: [...] } ou { csv: "..." }' },
        { status: 400 }
      )
    }

    if (employees.length === 0) {
      return NextResponse.json({ error: 'Aucun employé à importer' }, { status: 400 })
    }

    if (employees.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 employés par import. Divisez votre fichier.' },
        { status: 400 }
      )
    }

    const results = {
      total: employees.length,
      created: 0,
      skipped: 0,
      errors: [] as Array<{ row: number; error: string; data?: any }>,
    }

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i]
      const row = i + 2 // +2 car ligne 1 = en-tête, i commence à 0

      try {
        // Validation des champs obligatoires
        if (!emp.nom || !emp.prenoms || !emp.poste || !emp.dateEmbauche) {
          results.errors.push({
            row,
            error: 'Champs obligatoires manquants (nom, prenoms, poste, dateEmbauche)',
            data: emp,
          })
          continue
        }

        // Générer matricule si non fourni
        let matricule = emp.matricule
        if (!matricule) {
          const count = await db.employee.count({ where: { companyId: ctx.companyId } })
          matricule = `EMP-${String(count + 1).padStart(4, '0')}`
        }

        // Vérifier unicité matricule
        const existing = await db.employee.findUnique({ where: { matricule } })
        if (existing) {
          results.skipped++
          results.errors.push({
            row,
            error: `Matricule ${matricule} déjà utilisé`,
            data: emp,
          })
          continue
        }

        // Créer l'employé
        const employee = await db.employee.create({
          data: {
            companyId: ctx.companyId,
            matricule,
            nom: emp.nom.toUpperCase(),
            prenoms: emp.prenoms,
            cnssNumero: emp.cnssNumero || null,
            dateNaissance: emp.dateNaissance || null,
            sexe: emp.sexe || null,
            telephone: emp.telephone || null,
            email: emp.email || null,
            poste: emp.poste,
            dateEmbauche: emp.dateEmbauche,
            statut: 'actif',
            situationFamiliale: emp.situationFamiliale || null,
            nombreEnfants: parseInt(emp.nombreEnfants) || 0,
          },
        })

        // Créer le contrat si salaire fourni
        if (emp.salaireBase || emp.salaire) {
          const salaire = parseFloat(emp.salaireBase || emp.salaire)
          await db.contract.create({
            data: {
              employeeId: employee.id,
              type: emp.typeContrat || 'CDI',
              dateDebut: emp.dateEmbauche,
              dateFin: emp.dateFin || null,
              poste: emp.poste,
              salaireBase: salaire,
              devise: 'GNF',
              status: 'ACTIF',
            },
          })
        }

        results.created++
      } catch (err: any) {
        results.errors.push({
          row,
          error: err?.message || 'Erreur lors de la création',
          data: emp,
        })
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'BULK_IMPORT_EMPLOYEES',
        entityType: 'employee',
        entityId: ctx.companyId,
        userId: ctx.user?.email || 'system',
        diff: JSON.stringify({
          after: {
            total: results.total,
            created: results.created,
            skipped: results.skipped,
            errors: results.errors.length,
          },
        }),
      },
    })

    return NextResponse.json({
      success: true,
      results,
      message: `${results.created} employé(s) importé(s), ${results.skipped} ignoré(s), ${results.errors.length} erreur(s)`,
    })
  } catch (error: any) {
    console.error('POST /api/employees/bulk-import error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', detail: error?.message },
      { status: 500 }
    )
  }
}

/**
 * Parse un CSV simple en tableau d'objets.
 * En-tête attendue : matricule,nom,prenoms,poste,dateEmbauche,salaireBase,typeContrat,...
 */
function parseCSV(csv: string): any[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const employees: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const emp: any = {}
    headers.forEach((header, index) => {
      if (values[index]) emp[header] = values[index]
    })
    employees.push(emp)
  }

  return employees
}

/**
 * GET /api/employees/bulk-import/template
 * Retourne un modèle CSV vide pour l'import.
 */
export async function GET() {
  const template = `matricule,nom,prenoms,sexe,poste,dateEmbauche,salaireBase,typeContrat,email,telephone,cnssNumero,situationFamiliale,nombreEnfants
EMP-001,CAMARA,Mamadou,M,Directeur Général,2020-01-15,5000000,CDI,mamadou.camara@exemple.gn,+224620000001,CNSS-001,Marié,2
EMP-002,DIALLO,Aïcha,F,DRH,2020-03-01,3500000,CDI,aicha.diallo@exemple.gn,+224620000002,CNSS-002,Célibataire,0
EMP-003,TOURE,Fatoumata,F,Comptable,2021-09-01,2500000,CDI,fatoumata.toure@exemple.gn,+224620000003,CNSS-003,Marié,1`

  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="modele-import-employes.csv"',
    },
  })
}
