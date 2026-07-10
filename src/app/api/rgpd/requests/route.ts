import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  return NextResponse.json({ requests: await db.dataRequest.findMany({ where: { companyId: ctx.companyId }, orderBy: { createdAt: 'desc' }, take: 100 }) })
}
export async function POST(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { employeeId, requestType, details } = await request.json()
  return NextResponse.json({ success: true, request: await db.dataRequest.create({ data: { companyId: ctx.companyId, employeeId: employeeId || null, requestType, details: details || null, status: 'PENDING' } }) })
}
