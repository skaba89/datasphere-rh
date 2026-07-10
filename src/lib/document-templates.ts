/**
 * Templates de documents RH (fallback quand l'IA n'est pas disponible)
 * Ces templates génèrent des documents juridiques conformes au Code du travail guinéen.
 */

type DocumentType = 'contrat_cdi' | 'contrat_cdd' | 'lettre_embauche' | 'attestation_employeur' | 'attestation_salaire' | 'lettre_fin_contrat'

interface DocumentContext {
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

function formatGNF(amount?: number): string {
  if (!amount) return '[MONTANT] GNF'
  return new Intl.NumberFormat('fr-FR').format(amount) + ' GNF'
}

function formatDate(date?: string): string {
  if (!date) return '[DATE]'
  try {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return date
  }
}

export function generateDocumentTemplate(type: DocumentType, ctx: DocumentContext): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  switch (type) {
    case 'contrat_cdi':
      return `CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)

Entre les soussignés :

EMPLOYEUR : ${ctx.companyName || '[Nom société]'}
Adresse : ${ctx.companyAddress || '[Adresse]'}
NIF : ${ctx.companyNIF || '[NIF]'}
RC : ${ctx.companyRC || '[RC]'}
Numéro CNSS : ${ctx.companyCNSS || '[CNSS]'}

Ci-après désigné « l'Employeur »,

ET

SALARIÉ(E) : ${ctx.employeeName || '[Nom salarié]'}
Poste : ${ctx.position || '[Poste]'}
Date d'embauche : ${formatDate(ctx.startDate)}

Ci-après désigné(e) « le Salarié »,

IL A ÉTÉ CONVENU CE QUI SUIT :

Article 1 — Engagement
L'Employeur engage le Salarié, qui accepte, à compter du ${formatDate(ctx.startDate)}.

Article 2 — Fonctions
Le Salarié est engagé en qualité de ${ctx.position || '[Poste]'}. Il/Elle exercera ses fonctions sous l'autorité de la Direction.

Article 3 — Lieu de travail
Le lieu de travail habituel est fixé à ${ctx.companyAddress || '[Adresse]'}.

Article 4 — Durée du contrat
Le présent contrat est conclu pour une durée indéterminée, conformément à l'article L.38 du Code du travail guinéen (Loi L/2014/072/AN).

Article 5 — Période d'essai
Le Salarié est soumis à une période d'essai de trois (3) mois, renouvelable une fois.

Article 6 — Rémunération
Le Salarié percevra un salaire brut mensuel de ${formatGNF(ctx.salary)}, payable mensuellement au plus tard le 28 du mois.

Article 7 — Durée du travail
La durée de travail est fixée à 40 heures par semaine, soit 173 heures par mois.

Article 8 — Congés payés
Le Salarié bénéficie de 30 jours calendaires de congés payés par an (article L.167 du Code du travail).

Article 9 — Cotisations sociales
L'Employeur et le Salarié s'engagent à respecter les obligations de cotisation à la CNSS :
- Part salariale : 5%
- Part patronale : 17%

Article 10 — Obligations du salarié
Le Salarié s'engage à exécuter ses fonctions avec loyauté, diligence et professionnalisme.

Article 11 — Discipline
Le Salarié est soumis au règlement intérieur de l'entreprise.

Article 12 — Confidentialité
Le Salarié s'engage à garder le secret professionnel et à ne pas divulguer d'informations confidentielles.

Article 13 — Préavis
En cas de rupture, le préavis est de :
- 3 mois pour les cadres
- 1 mois pour les autres catégories

Article 14 — Litiges
Tout litige relève de la compétence du Tribunal du travail de Conakry.

Fait à Conakry, le ${today}

Pour l'Employeur :                                          Pour le Salarié :
(Signature, cachet)                                         (Signature)

Document généré automatiquement — DataSphere RH Guinée`

    case 'contrat_cdd':
      return `CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE (CDD)

Entre les soussignés :

EMPLOYEUR : ${ctx.companyName || '[Nom société]'}
NIF : ${ctx.companyNIF || '[NIF]'}
RC : ${ctx.companyRC || '[RC]'}
CNSS : ${ctx.companyCNSS || '[CNSS]'}

ET

SALARIÉ(E) : ${ctx.employeeName || '[Nom]'}
Poste : ${ctx.position || '[Poste]'}

IL A ÉTÉ CONVENU CE QUI SUIT :

Article 1 — Motif du recours au CDD
Conformément à l'article L.42 du Code du travail guinéen, le présent contrat est conclu pour : ${ctx.motifCdd || '[Motif — ex: remplacement, surcroît d\'activité]'}

Article 2 — Poste et qualifications
Le Salarié est engagé en qualité de ${ctx.position || '[Poste]'}.

Article 3 — Période d'essai
Une période d'essai de un (1) mois est convenue.

Article 4 — Rémunération
Salaire brut mensuel : ${formatGNF(ctx.salary)}

Article 5 — Durée
Date de début : ${formatDate(ctx.startDate)}
Date de fin : ${formatDate(ctx.endDate)}

Article 6 — Indemnité de fin de contrat
À l'issue du contrat, le Salarié percevra une indemnité de précarité égale à 6% du salaire brut total.

Article 7 — Cotisations CNSS
Cotisations sociales selon la législation en vigueur.

Fait à Conakry, le ${today}

Pour l'Employeur :                                          Pour le Salarié :
(Signature, cachet)                                         (Signature)

Document généré automatiquement — DataSphere RH Guinée`

    case 'lettre_embauche':
      return `${ctx.companyName || '[Nom société]'}
${ctx.companyAddress || '[Adresse]'}

Conakry, le ${today}

Lettre d'embauche

À l'attention de : ${ctx.employeeName || '[Nom]'}
Objet : Confirmation d'embauche

Madame, Monsieur,

Nous avons le plaisir de vous confirmer votre embauche au sein de ${ctx.companyName || 'notre société'} en qualité de ${ctx.position || '[Poste]'}.

Vos conditions d'embauche sont les suivantes :
- Date de prise de fonction : ${formatDate(ctx.startDate)}
- Poste : ${ctx.position || '[Poste]'}
- Salaire brut mensuel : ${formatGNF(ctx.salary)}
- Lieu de travail : ${ctx.companyAddress || '[Adresse]'}
- Période d'essai : 3 mois

Documents à fournir pour constitution de votre dossier :
1. Copie de la pièce d'identité nationale
2. Deux photos d'identité récentes
3. Numéro d'affiliation CNSS
4. Extrait de naissance
5. Casier judiciaire (moins de 3 mois)
6. Curriculum vitae

Nous vous prions de bien vouloir vous présenter le ${formatDate(ctx.startDate)} à 8h00 à l'accueil de notre siège situé à ${ctx.companyAddress || '[Adresse]'}.

Nous vous souhaitons la bienvenue dans notre équipe et restons à votre disposition pour toute information complémentaire.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

Pour la Direction des Ressources Humaines,
(Signature)

Document généré automatiquement — DataSphere RH Guinée`

    case 'attestation_employeur':
      return `${ctx.companyName || '[Nom société]'}
${ctx.companyAddress || '[Adresse]'}
NIF : ${ctx.companyNIF || '[NIF]'} · RC : ${ctx.companyRC || '[RC]'} · CNSS : ${ctx.companyCNSS || '[CNSS]'}

ATTESTATION D'EMPLOYEUR

Je soussigné(e), Directeur(trice) des Ressources Humaines de ${ctx.companyName || '[Nom société]'}, atteste que :

${ctx.employeeName || '[Nom]'} est employé(e) au sein de notre société depuis le ${formatDate(ctx.startDate)} en qualité de ${ctx.position || '[Poste]'}.

Le contrat de travail est de type CDI (Contrat à Durée Indéterminée).

La présente attestation est délivrée à l'intéressé(e) à sa demande, pour servir et valoir ce que de droit.

Fait à Conakry, le ${today}

Pour la Direction des Ressources Humaines,
(Signature et cachet)

Document généré automatiquement — DataSphere RH Guinée`

    case 'attestation_salaire':
      return `${ctx.companyName || '[Nom société]'}
${ctx.companyAddress || '[Adresse]'}

ATTESTATION DE SALAIRE

Je soussigné(e), Directeur(trice) des Ressources Humaines de ${ctx.companyName || '[Nom société]'}, atteste que :

${ctx.employeeName || '[Nom]'} est employé(e) au sein de notre société depuis le ${formatDate(ctx.startDate)} en qualité de ${ctx.position || '[Poste]'}.

Le salaire brut mensuel s'élève à : ${formatGNF(ctx.salary)}
Salaire net mensuel approximatif : ${formatGNF(ctx.salary ? Math.round(ctx.salary * 0.78) : undefined)}

Paiement effectué mensuellement, au plus tard le 28 du mois.

La présente attestation est délivrée à l'intéressé(e) à sa demande, pour faire valoir auprès de l'organisme demandeur.

Fait à Conakry, le ${today}

Pour la Direction des Ressources Humaines,
(Signature et cachet)

Document généré automatiquement — DataSphere RH Guinée`

    case 'lettre_fin_contrat':
      return `${ctx.companyName || '[Nom société]'}
${ctx.companyAddress || '[Adresse]'}

Conakry, le ${today}

Lettre recommandée avec accusé de réception

À l'attention de : ${ctx.employeeName || '[Nom]'}
Objet : Fin de contrat

Madame, Monsieur,

Nous vous informons par la présente que votre contrat de travail en qualité de ${ctx.position || '[Poste]'} prendra fin le ${formatDate(ctx.endDate)}.

Motif : ${ctx.reason || 'Fin de période d\'essai'}

Nous vous prions de bien vouloir :
1. Restituer l'ensemble du matériel mis à votre disposition (ordinateur, badge, clés, etc.)
2. Effectuer votre remise de poste auprès de votre responsable
3. Vous présenter au service RH pour le solde de tout compte

Votre dernier jour travaillé sera le ${formatDate(ctx.endDate)}.

Les documents suivants vous seront remis à cette date :
- Certificat de travail
- Reçu pour solde de tout compte
- Attestation Pôle Emploi (le cas échéant)

Nous vous remercions pour votre collaboration et vous souhaitons une pleine réussite dans vos futurs projets professionnels.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

Pour la Direction,
(Signature)

Document généré automatiquement — DataSphere RH Guinée`

    default:
      return 'Type de document non supporté'
  }
}
