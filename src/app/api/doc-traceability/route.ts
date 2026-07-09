import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ documents: [], workflows: [] })

    const docs = await db.document.findMany({
      where: { companyId: company.id },
      include: { employee: { select: { nom: true, prenoms: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const documents = docs.map(d => ({
      id: d.id,
      name: d.name,
      type: d.type,
      category: d.category,
      status: d.signedAt ? 'SIGNE' : 'EN_ATTENTE',
      version: '1.0',
      versions: [{ version: '1.0', date: d.createdAt.toISOString().slice(0, 10), author: d.uploadedBy || 'RH', changes: 'Création initiale' }],
      employee: d.employee ? `${d.employee.nom} ${d.employee.prenoms}` : null,
      createdAt: d.createdAt.toISOString().slice(0, 10),
      signedAt: d.signedAt?.toISOString().slice(0, 10) || null,
    }))

    const workflows = [
      { id: 'w1', name: 'Approbation contrat CDI', steps: ['RH prépare', 'Manager valide', 'Employé signe', 'Archivage'], currentStep: 3, status: 'EN_COURS', docCount: 2 },
      { id: 'w2', name: 'Validation attestation', steps: ['RH génère', 'Direction valide', 'Signature e-', 'Remise employé'], currentStep: 2, status: 'EN_COURS', docCount: 1 },
      { id: 'w3', name: 'Mise à jour bulletin paie', steps: ['Compta prépare', 'Contrôle RH', 'Validation DG', 'Distribution'], currentStep: 4, status: 'TERMINE', docCount: 9 },
      { id: 'w4', name: 'Archivage fin contrat', steps: ['RH compile', 'Vérification légale', 'Signature DG', 'Coffre-fort'], currentStep: 1, status: 'EN_ATTENTE', docCount: 0 },
    ]

    return NextResponse.json({ documents, workflows })
  } catch (error) { console.error('GET /api/doc-traceability error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
