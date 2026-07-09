import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ items: [], summary: {} })

    const items = await db.budgetItem.findMany({
      where: { companyId: company.id },
      orderBy: { period: 'desc' },
    })

    // Calculer le résumé par catégorie pour l'année 2026
    const year2026 = items.filter(i => i.period.startsWith('2026'))
    const summary: Record<string, { prevu: number; realise: number }> = {}

    for (const item of year2026) {
      const cat = item.category
      if (!summary[cat]) summary[cat] = { prevu: 0, realise: 0 }
      if (item.type === 'PREVU') summary[cat].prevu += item.amount
      else summary[cat].realise += item.amount
    }

    const totalPrevu = Object.values(summary).reduce((s, v) => s + v.prevu, 0)
    const totalRealise = Object.values(summary).reduce((s, v) => s + v.realise, 0)

    // Évolution mensuelle (simulation à partir des données)
    const monthlyData = []
    for (let m = 1; m <= 7; m++) {
      const period = `2026-${String(m).padStart(2, '0')}`
      const monthItems = items.filter(i => i.period === period)
      const masseSalariale = monthItems
        .filter(i => i.category === 'MASSE_SALARIALE' && i.type === 'REALISE')
        .reduce((s, i) => s + i.amount, 0)
      const charges = monthItems
        .filter(i => i.category === 'CHARGES' && i.type === 'REALISE')
        .reduce((s, i) => s + i.amount, 0)
      monthlyData.push({
        mois: new Date(2026, m - 1).toLocaleString('fr-FR', { month: 'short' }),
        masseSalariale,
        charges,
        total: masseSalariale + charges,
      })
    }

    return NextResponse.json({
      items,
      summary,
      totals: { prevu: totalPrevu, realise: totalRealise, ecart: totalPrevu - totalRealise },
      monthlyData,
    })
  } catch (error) {
    console.error('GET /api/budget error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    const item = await db.budgetItem.create({
      data: {
        companyId: company.id,
        category: body.category,
        label: body.label,
        amount: Number(body.amount),
        period: body.period,
        type: body.type || 'PREVU',
        notes: body.notes || null,
      },
    })

    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'budget_item',
        entityId: item.id,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { label: body.label, amount: body.amount, category: body.category } }),
      },
    })

    return NextResponse.json({ success: true, item }, { status: 201 })
  } catch (error) {
    console.error('POST /api/budget error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
