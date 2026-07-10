import { NextResponse } from 'next/server'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { getRetryQueue } from '@/lib/advanced/webhook'

// GET /api/webhooks/retries — liste les webhooks en retry queue
export async function GET(request: Request) {
  try {
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const companyId = ctx.companyId

    const result = await getRetryQueue(companyId, 100)
    return NextResponse.json({
      retries: result.retries.map(r => ({
        ...r,
        payload: (() => { try { return JSON.parse(r.payload) } catch { return {} } })(),
      })),
      stats: result.stats,
    })
  } catch (error) {
    console.error('GET /api/webhooks/retries error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
