import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const documents = await db.document.findMany({
      where: { companyId: company.id },
      include: {
        employee: {
          select: { id: true, nom: true, prenoms: true, matricule: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(documents)
  } catch (error) {
    console.error('GET /api/documents error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    // Simulation stockage — en production: upload MinIO et récup fileKey
    const fileKey = `documents/${company.id}/${Date.now()}-${body.name}`

    const document = await db.document.create({
      data: {
        companyId: company.id,
        employeeId: body.employeeId || null,
        name: body.name,
        type: body.type || 'OTHER',
        fileKey,
        fileSize: body.fileSize || 0,
        mimeType: body.mimeType || 'application/octet-stream',
        category: body.category || 'RH',
        confidential: body.confidential || false,
        retentionYears: body.retentionYears || 10,
        uploadedBy: 'admin@demo.gn',
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'document',
        entityId: document.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { name: body.name, type: body.type } }),
      },
    })

    return NextResponse.json({ success: true, document }, { status: 201 })
  } catch (error) {
    console.error('POST /api/documents error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
