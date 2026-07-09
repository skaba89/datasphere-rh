import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ positions: [], grades: [], scales: [] })

    const employees = await db.employee.findMany({
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })

    // Build positions from employees
    const positionMap: Record<string, { count: number; minSalary: number; maxSalary: number; department: string }> = {}
    employees.forEach(e => {
      const poste = e.poste || 'Non défini'
      const dept = poste.includes('Directeur') ? 'Direction' : poste.includes('RH') ? 'RH' : poste.includes('Compt') ? 'Finance' : poste.includes('Développeur') ? 'IT' : poste.includes('Commercial') ? 'Commercial' : poste.includes('Infirm') ? 'Santé' : 'Autre'
      const salary = e.contracts[0]?.salaireBase || 0
      if (!positionMap[poste]) positionMap[poste] = { count: 0, minSalary: salary, maxSalary: salary, department: dept }
      positionMap[poste].count++
      positionMap[poste].minSalary = Math.min(positionMap[poste].minSalary, salary)
      positionMap[poste].maxSalary = Math.max(positionMap[poste].maxSalary, salary)
    })

    const positions = Object.entries(positionMap).map(([name, info]) => ({ name, ...info }))

    const grades = [
      { level: 1, name: 'A1 - Stagiaire', minSalary: 300000, maxSalary: 500000, count: employees.filter(e => e.contracts[0]?.salaireBase && e.contracts[0].salaireBase < 600000).length },
      { level: 2, name: 'A2 - Junior', minSalary: 600000, maxSalary: 1500000, count: employees.filter(e => { const s = e.contracts[0]?.salaireBase || 0; return s >= 600000 && s < 2000000 }).length },
      { level: 3, name: 'B1 - Confirmé', minSalary: 2000000, maxSalary: 3500000, count: employees.filter(e => { const s = e.contracts[0]?.salaireBase || 0; return s >= 2000000 && s < 4000000 }).length },
      { level: 4, name: 'B2 - Senior', minSalary: 4000000, maxSalary: 5500000, count: employees.filter(e => { const s = e.contracts[0]?.salaireBase || 0; return s >= 4000000 && s < 6000000 }).length },
      { level: 5, name: 'C1 - Expert/Manager', minSalary: 6000000, maxSalary: 8000000, count: employees.filter(e => { const s = e.contracts[0]?.salaireBase || 0; return s >= 6000000 }).length },
      { level: 6, name: 'C2 - Direction', minSalary: 8000000, maxSalary: 15000000, count: 0 },
    ]

    const scales = [
      { category: 'IT', entry: 1500000, mid: 3500000, senior: 6000000, market: 5500000 },
      { category: 'RH', entry: 1200000, mid: 3000000, senior: 5000000, market: 4800000 },
      { category: 'Finance', entry: 1500000, mid: 3200000, senior: 5500000, market: 5200000 },
      { category: 'Commercial', entry: 1200000, mid: 2800000, senior: 4500000, market: 4200000 },
      { category: 'Santé', entry: 1000000, mid: 2500000, senior: 4000000, market: 3800000 },
      { category: 'Direction', entry: 5000000, mid: 8000000, senior: 15000000, market: 12000000 },
    ]

    return NextResponse.json({ positions, grades, scales })
  } catch (error) { console.error('GET /api/referential error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
