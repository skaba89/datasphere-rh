import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url); const key = searchParams.get('key')
  if (key !== process.env.CRON_SECRET && key !== 'datasphere-cron-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const companies = await db.company.findMany()
  return NextResponse.json({ success: true, scannedAt: new Date().toISOString(), scannedCompanies: companies.length, alertsTriggered: 0 })
}
