import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        contracts: { orderBy: { createdAt: 'desc' } },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
        payslips: { orderBy: { createdAt: 'desc' }, take: 12 },
        company: { select: { id: true, raisonSociale: true, sigle: true } },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employé introuvable' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('GET /api/employees/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
