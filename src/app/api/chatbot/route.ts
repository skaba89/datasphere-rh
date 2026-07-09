import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI, isZAIConfigured } from '@/lib/zai'

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

    let reply: string

    if (isZAIConfigured()) {
      try {
        const zai = await getZAI()
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.5,
          max_tokens: 500,
        })
        reply = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu traiter votre demande.'
      } catch (aiError) {
        console.error('Chatbot AI failed, using fallback:', aiError)
        reply = generateFallbackReply(message, { company: company?.raisonSociale, employees, leaves, expenses, overdue })
      }
    } else {
      reply = generateFallbackReply(message, { company: company?.raisonSociale, employees, leaves, expenses, overdue })
    }

    return NextResponse.json({ reply, timestamp: new Date().toISOString(), source: isZAIConfigured() ? 'ai' : 'fallback' })
  } catch (error) {
    console.error('POST /api/chatbot error:', error)
    return NextResponse.json({ error: 'Erreur chatbot' }, { status: 500 })
  }
}

/**
 * Réponse de secours quand l'IA n'est pas configurée.
 * Répond aux questions les plus fréquentes avec les données RH disponibles.
 */
function generateFallbackReply(message: string, ctx: { company?: string | null; employees: number; leaves: number; expenses: number; overdue: number }): string {
  const msg = message.toLowerCase()
  const companyName = ctx.company || 'DataSphere Demo SARL'

  if (/bonjour|salut|hello|coucou/.test(msg)) {
    return `Bonjour ! Je suis l'assistant RH de ${companyName}. Comment puis-je vous aider ? Vous pouvez me poser des questions sur les congés, la paie, les employés, etc.`
  }

  if (/combien.*employ|effectif|nombre.*employ/.test(msg)) {
    return `${companyName} compte actuellement ${ctx.employees} employé(s) actif(s).`
  }

  if (/cong|absence|vacance/.test(msg)) {
    return `Il y a actuellement ${ctx.leaves} demande(s) de congé en attente de validation. Pour soumettre une nouvelle demande, rendez-vous dans le module "Congés & absences".`
  }

  if (/frais|note.*frais|dépense/.test(msg)) {
    return `Il y a ${ctx.expenses} note(s) de frais en attente de validation.`
  }

  if (/conform|régular|cnss|legal/.test(msg)) {
    return `Il y a ${ctx.overdue} item(s) de conformité en retard. Pensez à régulariser les dossiers CNSS et les obligations légales.`
  }

  if (/paie|salaire|bulletin/.test(msg)) {
    return `La paie est traitée mensuellement, avec paiement au plus tard le 28 du mois. Les cotisations CNSS sont : 5% part salariale, 17% part patronale. Pour générer un bulletin, allez dans "Paie & CNSS".`
  }

  if (/contrat|cdi|cdd/.test(msg)) {
    return `Vous pouvez générer des contrats (CDI, CDD), lettres d'embauche, attestations d'employeur et attestations de salaire via le module "AI" ou "Contrats". Les documents sont conformes au Code du travail guinéen (Loi L/2014/072/AN).`
  }

  if (/aide|help|comment/.test(msg)) {
    return `Je peux vous renseigner sur : effectif, congés, notes de frais, paie, contrats, conformité CNSS. Pour les fonctionnalités avancées (génération de documents par IA, conversation naturelle), la clé API Z.ai doit être configurée.`
  }

  return `Je n'ai pas compris votre demande. Vous pouvez me demander des informations sur : les employés, les congés, la paie, les contrats, la conformité. Pour des réponses plus détaillées, la clé API Z.ai doit être configurée dans Netlify.`
}
