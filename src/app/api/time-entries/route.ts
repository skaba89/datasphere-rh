import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const entries = await db.timeEntry.findMany({
      include: {
        employee: {
          select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error('GET /api/time-entries error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Calculer workedMinutes et overtimeMinutes
    let workedMinutes = 0
    let overtimeMinutes = 0
    if (body.checkIn && body.checkOut) {
      const [inH, inM] = body.checkIn.split(':').map(Number)
      const [outH, outM] = body.checkOut.split(':').map(Number)
      const totalMin = (outH * 60 + outM) - (inH * 60 + inM)
      workedMinutes = Math.max(0, totalMin - (body.breakMinutes || 60))
      overtimeMinutes = Math.max(0, workedMinutes - 480) // 8h = 480 min
    }

    const status = body.status || (workedMinutes > 0 ? 'PRESENT' : 'ABSENT')

    const entry = await db.timeEntry.create({
      data: {
        employeeId: body.employeeId,
        date: body.date,
        checkIn: body.checkIn || null,
        checkOut: body.checkOut || null,
        breakMinutes: Number(body.breakMinutes) || 60,
        workedMinutes,
        overtimeMinutes,
        status,
        location: body.location || null,
        notes: body.notes || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'time_entry',
        entityId: entry.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { date: body.date, checkIn: body.checkIn, workedMinutes } }),
      },
    })

    return NextResponse.json({ success: true, entry }, { status: 201 })
  } catch (error) {
    console.error('POST /api/time-entries error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
