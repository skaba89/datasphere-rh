import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function GET() {
  try {
    const signatures = await db.signature.findMany({
      include: {
        employee: { select: { id: true, nom: true, prenoms: true, matricule: true } },
      },
      orderBy: { signedAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(signatures)
  } catch (error) {
    console.error('GET /api/signatures error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Calculer le hash du document
    const documentContent = body.documentContent || JSON.stringify({
      type: body.documentType,
      title: body.documentTitle,
      signer: body.signerName,
      date: new Date().toISOString(),
    })
    const documentHash = crypto.createHash('sha256').update(documentContent).digest('hex')

    // Générer un token QR unique
    const qrToken = crypto.randomBytes(16).toString('hex')

    const signature = await db.signature.create({
      data: {
        employeeId: body.employeeId || null,
        signerName: body.signerName,
        signerRole: body.signerRole || 'EMPLOYE',
        documentType: body.documentType,
        documentTitle: body.documentTitle,
        documentHash,
        qrToken,
        ipAddress: body.ipAddress || null,
        userAgent: body.userAgent || null,
        metadata: JSON.stringify({
          contentLength: documentContent.length,
          contentPreview: documentContent.slice(0, 200),
        }),
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'signature',
        entityId: signature.id,
        userId: body.signerName,
        diff: JSON.stringify({ after: { documentTitle: body.documentTitle, qrToken } }),
      },
    })

    return NextResponse.json({
      success: true,
      signature,
      documentHash,
      qrToken,
      verificationUrl: `/api/verify/${qrToken}`,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/signatures error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
