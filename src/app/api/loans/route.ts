import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.loan.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/loans error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    if (body.loanId && body.status) {
      // Approve/refuse loan
      const loan = await db.loan.update({
        where: { id: body.loanId },
        data: { status: body.status, approvedBy: 'manager@demo.gn', approvalDate: new Date().toISOString().slice(0, 10), remainingAmount: body.status === 'APPROUVE' ? Number(body.amount) : null },
      })
      await db.auditLog.create({ data: { action: 'VALIDATE', entityType: 'loan', entityId: body.loanId, userId: 'manager@demo.gn', diff: JSON.stringify({ after: { status: body.status } }) } })
      return NextResponse.json({ success: true, loan })
    }

    const item = await db.loan.create({
      data: { companyId: company.id, employeeId: body.employeeId, type: body.type || 'AVANCE', amount: Number(body.amount), reason: body.reason || null, requestDate: body.requestDate, monthlyDeduction: body.monthlyDeduction ? Number(body.monthlyDeduction) : null, totalMonths: body.totalMonths ? Number(body.totalMonths) : null },
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/loans error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
