import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getWebhookDeliveries } from '@/lib/advanced/webhook'

// GET /api/webhooks/[id]/deliveries?limit=50 — historique des livraisons
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const deliveries = await getWebhookDeliveries(id, limit)

    // Stats agrégées
    const stats = {
      total: deliveries.length,
      success: deliveries.filter(d => d.ok).length,
      failed: deliveries.filter(d => !d.ok).length,
      avgDurationMs: deliveries.length > 0 ? Math.round(deliveries.reduce((s, d) => s + d.durationMs, 0) / deliveries.length) : 0,
      last24h: deliveries.filter(d => {
        const date = new Date(d.deliveredAt)
        return date.getTime() > Date.now() - 24 * 60 * 60 * 1000
      }).length,
    }

    return NextResponse.json({
      deliveries: deliveries.map(d => ({
        ...d,
        payload: (() => { try { return JSON.parse(d.payload) } catch { return {} } })(),
      })),
      stats,
    })
  } catch (error) {
    console.error('GET /api/webhooks/[id]/deliveries error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
