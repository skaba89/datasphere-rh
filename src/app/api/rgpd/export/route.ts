import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { searchParams } = new URL(request.url); const employeeId = searchParams.get('employeeId')
  if (!employeeId) return NextResponse.json({ error: 'employeeId requis' }, { status: 400 })
  const emp = await db.employee.findFirst({ where: { id: employeeId, companyId: ctx.companyId }, include: { contracts: true, evaluations: true, leaveRequests: true, documents: true } })
  if (!emp) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  return NextResponse.json({ exportInfo: { exportedAt: new Date().toISOString(), employeeId }, personalData: { matricule: emp.matricule, nom: emp.nom, prenoms: emp.prenoms, poste: emp.poste, email: emp.email, telephone: emp.telephone }, contracts: emp.contracts.length, evaluations: emp.evaluations.length, leaveRequests: emp.leaveRequests.length, documents: emp.documents.length })
}
