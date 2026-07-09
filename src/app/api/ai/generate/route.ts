import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getZAI, isZAIConfigured } from '@/lib/zai'
import { generateDocumentTemplate } from '@/lib/document-templates'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, context } = body as {
      type: 'contrat_cdi' | 'contrat_cdd' | 'lettre_embauche' | 'attestation_employeur' | 'attestation_salaire' | 'lettre_fin_contrat'
      context: {
        employeeName?: string
        position?: string
        salary?: number
        startDate?: string
        endDate?: string
        companyName?: string
        companyAddress?: string
        companyNIF?: string
        companyRC?: string
        companyCNSS?: string
        reason?: string
        motifCdd?: string
      }
    }

    if (!type || !context) {
      return NextResponse.json({ error: 'Type et contexte requis' }, { status: 400 })
    }

    // Récupérer company si pas fournie
    let company = null
    if (!context.companyName) {
      company = await db.company.findFirst()
      if (company) {
        context.companyName = company.raisonSociale
        context.companyAddress = company.adresse
        context.companyNIF = company.nif || undefined
        context.companyRC = company.rc || undefined
        context.companyCNSS = company.cnssNumero || undefined
      }
    }

    // Construire le prompt selon le type
    const prompts: Record<string, string> = {
      contrat_cdi: `Génère un contrat de travail à durée indéterminée (CDI) conforme au Code du travail guinéen (Loi L/2014/072/AN) pour les éléments suivants :

EMPLOYEUR : ${context.companyName || '[Nom société]'}, sise à ${context.companyAddress || '[Adresse]'}, NIF : ${context.companyNIF || '[NIF]'}, RC : ${context.companyRC || '[RC]'}, Numéro CNSS : ${context.companyCNSS || '[CNSS]'}

SALARIÉ : ${context.employeeName || '[Nom salarié]'}
POSTE : ${context.position || '[Poste]'}
SALAIRE BRUT MENSUEL : ${context.salary ? new Intl.NumberFormat('fr-FR').format(context.salary) + ' GNF' : '[Salaire]'}
DATE D'EMBÂUCHE : ${context.startDate || '[Date]'}

Génère un contrat CDI complet avec les articles suivants :
1. Engagement et désignation
2. Lieu de travail
3. Fonctions et responsabilités
4. Durée du contrat (indéterminée)
5. Période d'essai (3 mois)
6. Rémunération (salaire de base + primes éventuelles)
7. Durée du travail (40h/semaine)
8. Congés payés (30 jours calendaires/an)
9. Cotisations sociales (CNSS, RTS)
10. Obligations du salarié
11. Obligations de l'employeur
12. Discipline
13. Confidentialité
14. Préavis (3 mois pour cadres, 1 mois pour autres)
15. Litiges et juridiction compétente (Tribunal du travail de Conakry)

Format : document juridique formel en français, avec numérotation des articles. Pas de préambule, juste le contenu du contrat. Termine par les signatures (Employeur / Salarié) avec espaces pour cachet et date.`,

      contrat_cdd: `Génère un contrat de travail à durée déterminée (CDD) conforme au Code du travail guinéen pour :

EMPLOYEUR : ${context.companyName}, NIF : ${context.companyNIF}, RC : ${context.companyRC}, CNSS : ${context.companyCNSS}
SALARIÉ : ${context.employeeName}
POSTE : ${context.position}
SALAIRE BRUT MENSUEL : ${context.salary ? new Intl.NumberFormat('fr-FR').format(context.salary) + ' GNF' : '[Salaire]'}
DATE DE DÉBUT : ${context.startDate}
DATE DE FIN : ${context.endDate}
MOTIF DU CDD : ${context.motifCdd || "[Motif — ex: remplacement congé maternité, surcroît dactivité]"}

Articles obligatoires CDD :
1. Identification des parties
2. Motif du recours au CDD (article L.42 du Code du travail)
3. Poste et qualifications
4. Période d'essai
5. Rémunération
6. Durée (préciser début et fin, max 24 mois renouvelable 1 fois)
7. Conditions de travail
8. Renouvellement éventuel
9. Indemnité de fin de contrat (6% du salaire brut total)
10. Cotisations CNSS
11. Préavis (spécifique CDD)
12. Litiges

Format juridique français avec articles numérotés. Termine par signatures.`,

      lettre_embauche: `Rédige une lettre d'embauche formelle de ${context.companyName} à ${context.employeeName} pour le poste de ${context.position}, avec un salaire brut mensuel de ${context.salary ? new Intl.NumberFormat('fr-FR').format(context.salary) + ' GNF' : '[Salaire]'}, à compter du ${context.startDate || '[Date]'}.

La lettre doit :
- Être datée et signée par le DRH
- Confirmer l'embauche et la bienvenue dans l'entreprise
- Récapituler les conditions (poste, salaire, date, lieu de travail)
- Mentionner la période d'essai de 3 mois
- Indiquer les documents à fournir pour le dossier (pièce d'identité, photo, numéro CNSS, extrait de naissance, casier judiciaire, CV)
- Préciser le lieu et l'heure de prise de poste
- Être chaleureuse mais professionnelle

Format lettre officielle, en français, sur papier à en-tête de ${context.companyName}.`,

      attestation_employeur: `Génère une attestation d'employeur pour ${context.employeeName}, employé(e) chez ${context.companyName} depuis le ${context.startDate} au poste de ${context.position}.

L'attestation doit :
- Être sur papier à en-tête
- Mentionner la raison de l'attestation (à la demande de l'intéressé)
- Confirmer l'emploi actuel
- Mentionner la nature du contrat (CDI)
- Inclure date et signature DRH
- Prévoir un emplacement pour cachet

Format court, formel, en français.`,

      attestation_salaire: `Génère une attestation de salaire pour ${context.employeeName}, employé(e) chez ${context.companyName}, au poste de ${context.position}, avec un salaire brut mensuel de ${context.salary ? new Intl.NumberFormat('fr-FR').format(context.salary) + ' GNF' : '[Salaire]'}.

L'attestation doit :
- Confirmer le salaire brut mensuel
- Mentionner l'ancienneté (depuis le ${context.startDate})
- Être destinée à l'organisme demandeur (banque, bailleur, etc.)
- Mentionner la périodicité de paiement (mensuel)
- Inclure date, signature et cachet

Format formel, en français.`,

      lettre_fin_contrat: `Rédige une lettre de fin de contrat de ${context.companyName} à ${context.employeeName} pour le poste de ${context.position}, avec effet au ${context.endDate}.

Motif : ${context.reason || 'fin de période d\'essai'}

La lettre doit :
- Annoncer formellement la fin du contrat
- Citer le motif légal
- Mentionner les obligations finales (restitution matériel, solde de tout compte)
- Indiquer la date du dernier jour travaillé
- Mentionner la remise des documents fin de contrat (certificat de travail, attestation Pôle Emploi, reçu pour solde de tout compte)
- Être ferme mais courtoise
- Inclure date et signature

Format lettre recommandée avec accusé de réception, en français.`,
    }

    const prompt = prompts[type]
    if (!prompt) {
      return NextResponse.json({ error: 'Type de document non supporté' }, { status: 400 })
    }

    // Appel au LLM via z-ai-web-dev-sdk
    // Si la clé API n'est pas configurée, on génère un template basique à la place
    let generatedContent: string
    let generatedBy: 'ai' | 'template'

    if (isZAIConfigured()) {
      try {
        const zai = await getZAI()
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: 'Tu es un assistant juridique RH spécialisé en droit du travail guinéen. Tu génères des documents RH professionnels, conformes à la législation guinéenne (Code du travail Loi L/2014/072/AN, CNSS Guinée). Réponds uniquement avec le document demandé, sans commentaire additionnel.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 3000,
        })
        generatedContent = completion.choices[0]?.message?.content || ''
        generatedBy = 'ai'
      } catch (aiError) {
        console.error('AI generation failed, falling back to template:', aiError)
        generatedContent = generateDocumentTemplate(type, context)
        generatedBy = 'template'
      }
    } else {
      generatedContent = generateDocumentTemplate(type, context)
      generatedBy = 'template'
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'ai_document',
        entityId: type,
        userId: 'admin@demo.gn',
        diff: JSON.stringify({ after: { type, employee: context.employeeName, length: generatedContent.length } }),
      },
    })

    return NextResponse.json({
      success: true,
      content: generatedContent,
      type,
      context,
      generatedBy,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('POST /api/ai/generate error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération IA' }, { status: 500 })
  }
}
