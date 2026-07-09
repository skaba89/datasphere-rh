import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const signature = await db.signature.findUnique({
      where: { qrToken: token },
      include: {
        employee: { select: { nom: true, prenoms: true, matricule: true, poste: true } },
      },
    })

    if (!signature) {
      return NextResponse.json({
        valid: false,
        error: 'Signature introuvable ou token invalide',
      }, { status: 404 })
    }

    return NextResponse.json({
      valid: true,
      signature: {
        documentTitle: signature.documentTitle,
        documentType: signature.documentType,
        signerName: signature.signerName,
        signerRole: signature.signerRole,
        signedAt: signature.signedAt.toISOString(),
        documentHash: signature.documentHash,
        hashPreview: signature.documentHash.slice(0, 32) + '...',
        employee: signature.employee,
      },
    })
  } catch (error) {
    console.error('GET /api/verify/[token] error:', error)
    return NextResponse.json({ valid: false, error: 'Erreur serveur' }, { status: 500 })
  }
}
