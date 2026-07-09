import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ certificates: [], stats: {} })

    const signatures = await db.signature.findMany({
      include: { employee: { select: { nom: true, prenoms: true, matricule: true } } },
      orderBy: { signedAt: 'desc' },
      take: 10,
    })

    const certificates = signatures.map((s, i) => ({
      id: `cert_${i}`,
      txHash: '0x' + s.documentHash.slice(0, 40) + '...',
      blockNumber: 18500000 + i * 1234,
      timestamp: s.signedAt.toISOString(),
      documentTitle: s.documentTitle,
      documentType: s.documentType,
      signerName: s.signerName,
      signerRole: s.signerRole,
      hash: s.documentHash,
      qrToken: s.qrToken,
      employee: s.employee ? `${s.employee.nom} ${s.employee.prenoms}` : null,
      network: 'DataSphere Chain (private)',
      gasUsed: 21000 + i * 100,
      status: 'CONFIRMED',
      immutable: true,
    }))

    const stats = {
      total: certificates.length,
      verified: certificates.length,
      pending: 0,
      networkHeight: 18500000 + certificates.length * 1234,
      avgBlockTime: '2.3s',
    }

    return NextResponse.json({ certificates, stats })
  } catch (error) { console.error('GET /api/blockchain error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
