import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// POST /api/webhooks/retries/[id]/retry — retry manuel immédiat d'un webhook en queue
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const companyId = ctx.companyId

    const retry = await db.webhookRetry.findFirst({ where: { id, companyId } })
    if (!retry) return NextResponse.json({ error: 'Retry introuvable' }, { status: 404 })
    if (retry.status === 'SUCCESS') return NextResponse.json({ error: 'Déjà livré avec succès' }, { status: 400 })

    // Récupère la config du webhook
    const config = await db.webhookConfig.findUnique({ where: { id: retry.webhookId } })
    if (!config || !config.isActive) {
      await db.webhookRetry.update({
        where: { id },
        data: { status: 'EXHAUSTED', errorMsg: 'Webhook désactivé ou supprimé', lastAttemptAt: new Date() },
      })
      return NextResponse.json({ error: 'Webhook désactivé ou supprimé' }, { status: 400 })
    }

    // Effectue la livraison
    const start = Date.now()
    let httpStatus: number | null = null
    let ok = false
    let errorMsg: string | null = null

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.secret ? { 'X-Webhook-Secret': config.secret } : {}),
        },
        body: retry.payload,
        signal: controller.signal,
      })
      clearTimeout(timeout)
      httpStatus = res.status
      ok = res.ok
      if (!ok) errorMsg = `HTTP ${res.status}`
    } catch (e: any) {
      errorMsg = e?.name === 'AbortError' ? 'Timeout (5s)' : (e?.message || 'Erreur réseau')
    }

    const durationMs = Date.now() - start
    const newAttemptCount = retry.attemptCount + 1

    // Persiste la livraison
    try {
      await db.webhookDelivery.create({
        data: {
          companyId,
          webhookId: retry.webhookId,
          webhookName: retry.webhookName,
          event: retry.event + '.manual-retry',
          payload: retry.payload,
          httpStatus,
          ok,
          errorMsg,
          durationMs,
        },
      })
    } catch {}

    // Met à jour le retry
    if (ok) {
      await db.webhookRetry.update({
        where: { id },
        data: {
          status: 'SUCCESS',
          httpStatus,
          errorMsg: null,
          attemptCount: newAttemptCount,
          lastAttemptAt: new Date(),
        },
      })
    } else if (newAttemptCount >= retry.maxAttempts) {
      await db.webhookRetry.update({
        where: { id },
        data: {
          status: 'EXHAUSTED',
          httpStatus,
          errorMsg,
          attemptCount: newAttemptCount,
          lastAttemptAt: new Date(),
        },
      })
    } else {
      // Recalcule le nextAttemptAt (1min pour retry manuel)
      await db.webhookRetry.update({
        where: { id },
        data: {
          status: 'RETRYING',
          httpStatus,
          errorMsg,
          attemptCount: newAttemptCount,
          nextAttemptAt: new Date(Date.now() + 60_000),
          lastAttemptAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: ok,
      httpStatus,
      errorMsg,
      durationMs,
      attemptCount: newAttemptCount,
      status: ok ? 'SUCCESS' : newAttemptCount >= retry.maxAttempts ? 'EXHAUSTED' : 'RETRYING',
    })
  } catch (error) {
    console.error('POST /api/webhooks/retries/[id]/retry error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/webhooks/retries/[id] — abandonne un retry (le marque EXHAUSTED)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error
    const companyId = ctx.companyId

    const retry = await db.webhookRetry.findFirst({ where: { id, companyId } })
    if (!retry) return NextResponse.json({ error: 'Retry introuvable' }, { status: 404 })

    await db.webhookRetry.update({
      where: { id },
      data: { status: 'EXHAUSTED', errorMsg: 'Abandonné manuellement', lastAttemptAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/webhooks/retries/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
