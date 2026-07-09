import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ exports: [], integrations: [] })

    const payslips = await db.payslip.findMany({ take: 12, orderBy: { createdAt: 'desc' } })
    const employees = await db.employee.findMany({
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })

    // Generate FEC-compatible export data (simplified)
    const fecLines = employees.flatMap(e => {
      const c = e.contracts[0]
      if (!c) return []
      return [{
        journal: 'PAI',
        date: '20260731',
        compte: '641100',
        tiers: e.matricule,
        libelle: `Salaire ${e.nom} ${e.prenoms} Juillet 2026`,
        debit: String(c.salaireBase),
        credit: '0',
      }, {
        journal: 'PAI',
        date: '20260731',
        compte: '645100',
        tiers: e.matricule,
        libelle: `CNSS employeur ${e.nom}`,
        debit: String(Math.round(c.salaireBase * 0.08)),
        credit: '0',
      }, {
        journal: 'PAI',
        date: '20260731',
        compte: '431000',
        tiers: e.matricule,
        libelle: `CNSS salarié ${e.nom}`,
        debit: '0',
        credit: String(Math.round(c.salaireBase * 0.05)),
      }]
    })

    const integrations = [
      { name: 'Sage Paie & RH', version: 'v8.2', status: 'configured', lastSync: '2026-07-05', format: 'SAGE_EXPORT', desc: 'Export comptable Sage avec mapping des comptes' },
      { name: 'Cegid HR', version: 'v2024', status: 'available', lastSync: null, format: 'CEGID_CSV', desc: 'Export CSV compatible Cegid' },
      { name: 'FEC (Fichier des Écritures Comptables)', version: 'standard', status: 'configured', lastSync: '2026-07-05', format: 'FEC_TXT', desc: 'Format standard FEC pour contrôle fiscal' },
      { name: 'Comptabilité Guinée (DGI)', version: 'v1.0', status: 'configured', lastSync: '2026-07-01', format: 'DGI_GN', desc: 'Export conforme aux exigences DGI Guinée' },
      { name: 'QuickBooks', version: 'Online', status: 'available', lastSync: null, format: 'QBO_CSV', desc: 'Export CSV pour QuickBooks Online' },
    ]

    return NextResponse.json({
      fecLines: fecLines.slice(0, 20),
      totalLines: fecLines.length,
      integrations,
      monthlyTotals: {
        brut: employees.reduce((s, e) => s + (e.contracts[0]?.salaireBase || 0), 0),
        cnssEmployeur: employees.reduce((s, e) => s + Math.round((e.contracts[0]?.salaireBase || 0) * 0.08), 0),
        cnssSalarie: employees.reduce((s, e) => s + Math.round((e.contracts[0]?.salaireBase || 0) * 0.05), 0),
      },
    })
  } catch (error) {
    console.error('GET /api/accounting-exports error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
