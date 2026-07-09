import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/webhooks — liste tous les webhooks
export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ webhooks: [] })

    const webhooks = await db.webhookConfig.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      webhooks: webhooks.map(w => ({
        ...w,
        events: (() => { try { return JSON.parse(w.events) } catch { return [] } })(),
      })),
    })
  } catch (error) {
    console.error('GET /api/webhooks error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/webhooks — crée un nouveau webhook
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, url, events, secret } = body

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'name, url, events[] requis' }, { status: 400 })
    }

    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })

    const webhook = await db.webhookConfig.create({
      data: {
        companyId: company.id,
        name,
        url,
        events: JSON.stringify(events),
        secret: secret || null,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, webhook })
  } catch (error) {
    console.error('POST /api/webhooks error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
