import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const data = {
      kpis: {
        dataQuality: 87, completeness: 94, accuracy: 91, consistency: 85, freshness: 89, uniqueness: 96,
      },
      entities: [
        { name: 'employees', records: 9, quality: 94, issues: 0, lastAudit: '2026-07-01', owner: 'RH' },
        { name: 'contracts', records: 9, quality: 100, issues: 0, lastAudit: '2026-07-01', owner: 'RH' },
        { name: 'payslips', records: 27, quality: 100, issues: 0, lastAudit: '2026-07-01', owner: 'Comptable' },
        { name: 'leave_requests', records: 3, quality: 67, issues: 1, lastAudit: '2026-06-15', owner: 'RH' },
        { name: 'candidates', records: 7, quality: 86, issues: 1, lastAudit: '2026-06-20', owner: 'RH' },
        { name: 'documents', records: 5, quality: 80, issues: 1, lastAudit: '2026-06-10', owner: 'RH' },
        { name: 'time_entries', records: 30, quality: 90, issues: 0, lastAudit: '2026-07-01', owner: 'Manager' },
        { name: 'audit_logs', records: 9, quality: 100, issues: 0, lastAudit: '2026-07-01', owner: 'Super Admin' },
      ],
      lineage: [
        { source: 'employees', target: 'payslips', transform: 'calcul_cnss', frequency: 'MENSUEL', status: 'OK' },
        { source: 'contracts', target: 'payslips', transform: 'salaire_base', frequency: 'MENSUEL', status: 'OK' },
        { source: 'time_entries', target: 'payslips', transform: 'heures_supp', frequency: 'MENSUEL', status: 'OK' },
        { source: 'employees', target: 'evaluations', transform: 'auto_link', frequency: 'ON_CREATE', status: 'OK' },
        { source: 'leave_requests', target: 'payroll_deduction', transform: 'absence_calc', frequency: 'MENSUEL', status: 'WARNING' },
        { source: 'surveys', target: 'analytics', transform: 'nps_calc', frequency: 'TRIMESTRIEL', status: 'OK' },
      ],
      policies: [
        { name: 'Rétention données employés', desc: '10 ans après départ (Code travail GN)', status: 'ACTIVE', type: 'RETENTION' },
        { name: 'Rétention bulletins paie', desc: '10 ans (loi fiscale GN)', status: 'ACTIVE', type: 'RETENTION' },
        { name: 'Rétention logs audit', desc: '10 ans (RGPD + Code travail)', status: 'ACTIVE', type: 'RETENTION' },
        { name: 'Anonymisation candidats', desc: '2 ans après recrutement', status: 'ACTIVE', type: 'PRIVACY' },
        { name: 'Droit à l\'oubli', desc: 'Suppression sur demande employé', status: 'ACTIVE', type: 'PRIVACY' },
        { name: 'Export données', desc: 'JSON complet sur demande', status: 'ACTIVE', type: 'PORTABILITY' },
      ],
    }
    return NextResponse.json(data)
  } catch (error) { console.error('GET /api/data-governance error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
