import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: Request) {
  try {
    const { message, context } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

    // Gather context data
    const company = await db.company.findFirst()
    const employees = await db.employee.count()
    const leaves = await db.leaveRequest.count({ where: { statut: 'EN_ATTENTE' } })
    const expenses = await db.expenseReport.count({ where: { status: 'EN_ATTENTE' } })
    const compliance = await db.complianceItem.findMany({ where: { companyId: company?.id } })
    const overdue = compliance.filter(c => c.status === 'EN_RETARD').length

    const systemPrompt = `Tu es l'assistant RH DataSphere RH Guinée, un chatbot intégré au SIRH. 
Tu aides les employés et managers sur des questions RH.
Contexte entreprise: ${company?.raisonSociale || 'Demo SARL'}, ${employees} employés.
${leaves} demandes de congé en attente, ${expenses} notes de frais en attente, ${overdue} items de conformité en retard.
Réponds en français, de manière concise et professionnelle. Si on te demande des données spécifiques d'un employé, demande qui.`

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.5,
      max_tokens: 500,
    })

    const reply = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.'

    return NextResponse.json({ reply, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('POST /api/chatbot error:', error)
    return NextResponse.json({ error: 'Erreur chatbot' }, { status: 500 })
  }
}
