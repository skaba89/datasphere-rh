import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'employees'
    const format = searchParams.get('format') || 'csv'

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    let data: any[] = []
    let filename = ''

    if (type === 'employees') {
      const employees = await db.employee.findMany({
        include: {
          contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
          company: true,
        },
        orderBy: { nom: 'asc' },
      })
      data = employees.map(e => ({
        Matricule: e.matricule,
        Nom: e.nom,
        Prénoms: e.prenoms,
        Sexe: e.sexe || '',
        CNSS: e.cnssNumero || '',
        Poste: e.poste,
        'Date embauche': e.dateEmbauche,
        Statut: e.statut,
        'Salaire base': e.contracts[0]?.salaireBase || 0,
        'Type contrat': e.contracts[0]?.type || '',
        Email: e.email || '',
        Téléphone: e.telephone || '',
        Société: e.company.raisonSociale,
      }))
      filename = `employes_${new Date().toISOString().slice(0, 10)}`
    } else if (type === 'candidates') {
      const candidates = await db.candidate.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
      })
      data = candidates.map(c => ({
        Prénom: c.firstName,
        Nom: c.lastName,
        'Poste visé': c.positionApplied,
        Source: c.source,
        Statut: c.status,
        Rating: c.rating,
        Email: c.email || '',
        Téléphone: c.phone || '',
        'Prétention salaire': c.expectedSalary || 0,
        Disponibilité: c.availability || '',
      }))
      filename = `candidats_${new Date().toISOString().slice(0, 10)}`
    } else if (type === 'documents') {
      const documents = await db.document.findMany({
        where: { companyId: company.id },
        include: { employee: true },
        orderBy: { createdAt: 'desc' },
      })
      data = documents.map(d => ({
        Nom: d.name,
        Type: d.type,
        Catégorie: d.category,
        Confidentiel: d.confidential ? 'Oui' : 'Non',
        Signé: d.signedAt ? 'Oui' : 'Non',
        Employé: d.employee ? `${d.employee.nom} ${d.employee.prenoms}` : '',
        'Taille (KB)': Math.round(d.fileSize / 1024),
        'Date ajout': d.createdAt.toISOString().slice(0, 10),
      }))
      filename = `documents_${new Date().toISOString().slice(0, 10)}`
    } else if (type === 'audit') {
      const logs = await db.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
      data = logs.map(l => ({
        ID: l.id,
        Action: l.action,
        'Type entité': l.entityType,
        'ID entité': l.entityId || '',
        Utilisateur: l.userId || '',
        Date: l.createdAt.toISOString(),
      }))
      filename = `audit_${new Date().toISOString().slice(0, 10)}`
    }

    if (format === 'csv') {
      // CSV
      const headers = data.length > 0 ? Object.keys(data[0]) : []
      const csv = [
        headers.join(';'),
        ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(';')),
      ].join('\n')

      return new NextResponse('\ufeff' + csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      })
    } else if (format === 'json') {
      return NextResponse.json({ type, count: data.length, data })
    }

    return NextResponse.json({ error: 'Format non supporté' }, { status: 400 })
  } catch (error) {
    console.error('GET /api/exports error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
