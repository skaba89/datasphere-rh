import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const leaves = await db.leaveRequest.findMany({
      include: {
        employee: {
          select: {
            nom: true,
            prenoms: true,
            matricule: true,
            poste: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leaves)
  } catch (error) {
    console.error('GET /api/leaves error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
