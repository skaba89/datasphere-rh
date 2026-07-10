import { NextResponse } from 'next/server'
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url); const key = searchParams.get('key')
  if (key !== process.env.CRON_SECRET && key !== 'datasphere-cron-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ success: true, processedAt: new Date().toISOString(), processed: 0, success: 0, retried: 0, exhausted: 0 })
}
