import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { checkRateLimit, DEFAULT_RATE_LIMITS } from '@/lib/llm/rate-limit'
export async function GET(request: Request) {
  const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
  const rl = await checkRateLimit(ctx.companyId, DEFAULT_RATE_LIMITS)
  return NextResponse.json({ current: rl.current, limits: rl.limits, allowed: rl.allowed, reason: rl.reason })
}
