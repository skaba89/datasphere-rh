import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.helpdeskTicket.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/helpdesk error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    if (body.ticketId && body.response !== undefined) {
      // Respond to ticket
      const ticket = await db.helpdeskTicket.update({
        where: { id: body.ticketId },
        data: { response: body.response, status: body.status || 'RESOLU', assignedTo: body.assignedTo || 'RH' },
      })
      await db.auditLog.create({ data: { action: 'UPDATE', entityType: 'helpdesk_ticket', entityId: body.ticketId, userId: 'admin@demo.gn', diff: JSON.stringify({ after: { status: ticket.status } }) } })
      return NextResponse.json({ success: true, ticket })
    }

    // Create ticket
    const item = await db.helpdeskTicket.create({
      data: { companyId: company.id, employeeId: body.employeeId || null, employeeName: body.employeeName, subject: body.subject, description: body.description, category: body.category || 'AUTRE', priority: body.priority || 'NORMAL' },
    })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/helpdesk error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
