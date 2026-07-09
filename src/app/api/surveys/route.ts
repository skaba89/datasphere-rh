import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json([])

    const surveys = await db.survey.findMany({
      where: { companyId: company.id },
      include: { responses: { include: { employee: { select: { nom: true, prenoms: true } } } } },
      orderBy: { createdAt: 'desc' },
    })

    const result = surveys.map(s => {
      const scores = s.responses.map(r => r.score)
      const nps = s.type === 'NPS' && scores.length > 0
        ? Math.round(((scores.filter(x => x >= 9).length - scores.filter(x => x <= 6).length) / scores.length) * 100)
        : null
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
      return { ...s, responseCount: s.responses.length, avgScore: avg, nps }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/surveys error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    if (body.score !== undefined) {
      // Submit a response
      const response = await db.surveyResponse.create({
        data: {
          surveyId: body.surveyId,
          employeeId: body.employeeId,
          score: Number(body.score),
          comment: body.comment || null,
        },
      })
      return NextResponse.json({ success: true, response }, { status: 201 })
    }

    // Create a survey
    const survey = await db.survey.create({
      data: {
        companyId: company.id,
        title: body.title,
        description: body.description || null,
        type: body.type || 'NPS',
        status: body.status || 'OUVERTE',
        startDate: body.startDate || new Date().toISOString().slice(0, 10),
        endDate: body.endDate || null,
      },
    })

    return NextResponse.json({ success: true, survey }, { status: 201 })
  } catch (error) {
    console.error('POST /api/surveys error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
