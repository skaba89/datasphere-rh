import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])
    const items = await db.announcement.findMany({
      where: { companyId: company.id },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
    })
    return NextResponse.json(items)
  } catch (error) { console.error('GET /api/announcements error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })
    const item = await db.announcement.create({
      data: { companyId: company.id, title: body.title, content: body.content, category: body.category || 'INFO', priority: body.priority || 'NORMAL', pinned: body.pinned || false, authorName: body.authorName || 'RH', expiresAt: body.expiresAt || null },
    })
    await db.auditLog.create({ data: { action: 'CREATE', entityType: 'announcement', entityId: item.id, userId: 'admin@demo.gn', diff: JSON.stringify({ after: { title: body.title } }) } })
    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) { console.error('POST /api/announcements error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
