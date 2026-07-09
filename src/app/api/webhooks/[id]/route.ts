import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE /api/webhooks?id=xxx
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    await db.webhookConfig.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/webhooks error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/webhooks — active/désactive
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, isActive } = body
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const updated = await db.webhookConfig.update({
      where: { id },
      data: { isActive: !!isActive },
    })
    return NextResponse.json({ success: true, webhook: updated })
  } catch (error) {
    console.error('PATCH /api/webhooks error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
