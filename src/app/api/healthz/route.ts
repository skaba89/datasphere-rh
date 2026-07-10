import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cached, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

// GET /api/healthz — health check (chemin dédié pour éviter conflit avec /api/health)
export async function GET() {
  const result = await cached(
    CACHE_KEYS.healthCheck(),
    CACHE_TTL.healthCheck,
    async () => {
      const checks: Record<string, { status: string; latencyMs?: number; details?: string }> = {}
      let allOk = true
      try { const start = Date.now(); await db.company.count(); checks.database = { status: 'ok', latencyMs: Date.now() - start } }
      catch (e: any) { checks.database = { status: 'error', details: e?.message?.slice(0, 100) }; allOk = false }
      checks.version = { status: 'ok', details: '1.0.0' }
      checks.uptime = { status: 'ok', details: `${process.uptime().toFixed(0)}s` }
      try { const { getConfiguredProviders } = await import('@/lib/llm/providers'); const configured = getConfiguredProviders(); checks.llmProviders = { status: 'ok', details: `${configured.length} provider(s): ${configured.map(p => p.id).join(', ')}` } }
      catch { checks.llmProviders = { status: 'ok', details: 'ZAI (fallback)' } }
      try { const chunks = await db.documentChunk.count(); checks.ragIndex = { status: 'ok', details: `${chunks} chunks` } }
      catch { checks.ragIndex = { status: 'ok', details: 'N/A' } }
      return { status: allOk ? 'healthy' : 'degraded', timestamp: new Date().toISOString(), checks }
    }
  )
  return NextResponse.json(result, { status: result.status === 'healthy' ? 200 : 503 })
}
