import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const expenses = await db.expenseReport.findMany({
      where: { companyId: company.id },
      include: {
        employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } },
      },
      orderBy: { submittedAt: 'desc' },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    console.error('GET /api/expenses error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    const expense = await db.expenseReport.create({
      data: {
        companyId: company.id,
        employeeId: body.employeeId,
        title: body.title,
        category: body.category || 'AUTRE',
        amount: Number(body.amount),
        date: body.date,
        description: body.description || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'expense_report',
        entityId: expense.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { title: body.title, amount: body.amount } }),
      },
    })

    return NextResponse.json({ success: true, expense }, { status: 201 })
  } catch (error) {
    console.error('POST /api/expenses error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
