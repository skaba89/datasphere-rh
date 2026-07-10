import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { getUsageStats } from '@/lib/llm/usage'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const { searchParams } = new URL(request.url); const sinceParam = searchParams.get('since') || '30d'
  let since: Date | undefined; if (sinceParam !== 'all') { since = new Date(Date.now() - (parseInt(sinceParam.replace('d','')) || 30) * 86400000) }
  return NextResponse.json(await getUsageStats(ctx.companyId, { since }))
}
