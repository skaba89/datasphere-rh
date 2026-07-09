import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ expats: [], visas: [], kpis: {} })

    const employees = await db.employee.findMany()
    const expats = [
      { id: 'e1', name: 'Jean-Pierre Martin', nationality: '🇫🇷 France', role: 'Conseiller technique', arrivalDate: '2024-09-01', contractType: 'Expatrié', visaStatus: 'VALIDE', visaExpiry: '2027-09-01', workPermit: 'VALIDE', permitExpiry: '2027-09-01', housing: 'Logement de fonction Kipé', familyRelocation: true, insurance: 'CFE + mutuelle internationale' },
      { id: 'e2', name: 'Sarah Johnson', nationality: '🇺🇸 USA', role: 'Consultante finance', arrivalDate: '2025-01-15', contractType: 'Expatrié', visaStatus: 'VALIDE', visaExpiry: '2026-12-31', workPermit: 'VALIDE', permitExpiry: '2026-12-31', housing: 'Indemnité 1 500 000 GNF/mois', familyRelocation: false, insurance: 'Cigna Global' },
      { id: 'e3', name: 'Ahmed Benali', nationality: '🇲🇦 Maroc', role: 'Expert minier', arrivalDate: '2025-06-01', contractType: 'Expatrié', visaStatus: 'EN_RENOUVELLEMENT', visaExpiry: '2026-07-31', workPermit: 'VALIDE', permitExpiry: '2027-06-01', housing: 'Logement de fonction Boké', familyRelocation: true, insurance: 'AXA International' },
    ]

    const visas = [
      { id: 'v1', employee: 'Ahmed Benali', type: 'Visa de travail', number: 'VT-GN-2025-0042', issueDate: '2025-06-01', expiryDate: '2026-07-31', status: 'EN_RENOUVELLEMENT', daysLeft: 26, notes: 'Renouvellement en cours auprès de la DGI' },
      { id: 'v2', employee: 'Jean-Pierre Martin', type: 'Carte de séjour', number: 'CS-GN-2024-0017', issueDate: '2024-09-15', expiryDate: '2027-09-01', status: 'VALIDE', daysLeft: 423, notes: '' },
      { id: 'v3', employee: 'Sarah Johnson', type: 'Visa de travail', number: 'VT-GN-2025-0089', issueDate: '2025-01-20', expiryDate: '2026-12-31', status: 'VALIDE', daysLeft: 179, notes: '' },
      { id: 'v4', employee: 'Ousmane Bah', type: 'Autorisation travail frontalier', number: 'AT-GN-2024-0034', issueDate: '2024-01-15', expiryDate: '2026-12-31', status: 'VALIDE', daysLeft: 179, notes: 'Employé local, document de référence' },
    ]

    const kpis = { totalExpats: expats.length, validVisas: visas.filter(v => v.status === 'VALIDE').length, expiringSoon: visas.filter(v => v.daysLeft < 60 && v.status !== 'EN_RENOUVELLEMENT').length, renewalInProgress: visas.filter(v => v.status === 'EN_RENOUVELLEMENT').length }

    return NextResponse.json({ expats, visas, kpis })
  } catch (error) { console.error('GET /api/international error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
