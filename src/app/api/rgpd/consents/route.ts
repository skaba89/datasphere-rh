import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ consents: await db.dataConsent.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' } }) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { employeeId, consentType, granted } = await request.json()
  return NextResponse.json({ success: true, consent: await db.dataConsent.create({ data: { companyId: ctx.companyId, employeeId: employeeId || null, consentType, granted, withdrawnAt: granted ? null : new Date() } }) })
}
