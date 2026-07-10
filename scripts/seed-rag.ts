/**
 * Seed du RAG avec des documents RH de démo.
 * Indexe : politique de télétravail, politique congés, FAQ RH, code du travail guinéen (extraits).
 *
 * Usage : npx tsx scripts/seed-rag.ts
 */
import { PrismaClient } from '@prisma/client'
import { indexDocument } from '../src/lib/llm/rag'

const db = new PrismaClient()

const DOCUMENTS = [
  {
    source: 'policy' as const,
    title: 'Politique de télétravail',
    content: `# Politique de télétravail

## 1. Principe
Le télétravail est autorisé pour tous les employés en CDI ayant au moins 3 mois d'ancienneté. Il est limité à 2 jours par semaine en moyenne.

## 2. Éligibilité
- Employés en CDI avec au moins 3 mois d'ancienneté
- Postes compatibles (les postes de réception, logistique et maintenance ne sont pas éligibles)
- Performance satisfaisante (évaluation >= 3/5)

## 3. Demande
L'employé doit faire une demande écrite à son manager au moins 15 jours avant le début. Le manager répond sous 7 jours. En cas de refus, la décision doit être motivée.

## 4. Organisation
- Maximum 2 jours par semaine de télétravail
- Au moins 3 jours en présentiel obligatoires
- Les jours de télétravail doivent être fixes (même rythme hebdomadaire)
- Présence obligatoire lors des réunions d'équipe (même en visio)

## 5. Équipement
L'entreprise fournit :
- Un ordinateur portable
- Une connexion internet remboursée jusqu'à 200 000 GNF/mois sur justificatif
- Les logiciels nécessaires (Microsoft 365, VPN)

## 6. Responsabilités
L'employé en télétravail doit :
- Être joignable pendant les heures de travail (9h-17h)
- Respecter les délais et livrables
- Maintenir la confidentialité des données
- Assurer un environnement de travail sécurisé

## 7. Droit de retrait
L'employeur peut suspendre le télétravail en cas de :
- Baisse de performance constatée
- Besoin opérationnel (réunion importante, formation)
- Problème de sécurité

## 8. Révision
Cette politique est révisée annuellement en comité d'entreprise.`,
    metadata: { version: '2.0', date: '2026-01-15', auteur: 'DRH' },
  },
  {
    source: 'policy' as const,
    title: 'Politique de congés',
    content: `# Politique de congés

## Congés payés annuels
- 30 jours calendaires par an (2,5 jours par mois travaillé)
- Pris par période de 5 jours minimum en continu
- Pose au moins 30 jours à l'avance
- Solde consultable dans le portail employé

## Congés exceptionnels
- Mariage de l'employé : 5 jours
- Mariage d'un enfant : 2 jours
- Décès du conjoint : 5 jours
- Décès d'un parent/enfant : 3 jours
- Naissance : 3 jours (pour le père)
- Baptême : 1 jour

## Congé maternité
- 14 semaines (6 semaines avant, 8 semaines après)
- 100% du salaire payé par la CNSS
- Possibilité d'extension de 2 semaines en cas de complication

## Congé paternité
- 3 jours consécutifs à la naissance
- 11 jours consécutifs dans le mois suivant (au choix)

## Congé maladie
- Justificatif médical obligatoire sous 48h
- Plein salaire pendant 1 mois, demi-salaire le 2e mois
- Au-delà : assurance prévoyance si souscrite

## Congé sans solde
- Sur demande motivée
- Accord du manager + DRH
- Maximum 6 mois renouvelables

## Procédure de demande
1. Saisir la demande dans le portail employé
2. Validation manager sous 5 jours
3. Validation DRH pour les congés > 15 jours
4. Notification automatique à l'employé

## Périodes de fermeture
L'entreprise ferme du 24 décembre au 2 janvier inclus. Les congés de cette période sont obligatoires et déduits du solde annuel.`,
    metadata: { version: '1.5', date: '2025-11-01', auteur: 'DRH' },
  },
  {
    source: 'faq' as const,
    title: 'FAQ RH - Questions fréquentes',
    content: `# FAQ RH

## Paie
Q: Quand suis-je payé ?
R: Le 28 de chaque mois. Si le 28 tombe un week-end, le paiement est anticipé au vendredi précédent.

Q: Comment calculer mon salaire net ?
R: Salaire brut - 5% CNSS (plafonné à 1 000 000 GNF) - 1,5% ITS = salaire net imposable. Puis appliquer le barème IRPP progressif.

Q: Où trouver mon bulletin de paie ?
R: Dans le portail employé, rubrique "Mes documents" > "Bulletins de paie". Disponible le 1er du mois suivant.

## Congés
Q: Combien de congés me reste-t-il ?
R: Consultez votre solde dans le portail employé, rubrique "Mes congés". Le solde se met à jour sous 24h après validation.

Q: Puis-je reporter mes congés non pris ?
R: Oui, jusqu'au 31 mars de l'année suivante. Au-delà, les congés sont perdus (sauf accord exceptionnel DRH).

Q: Que faire si mon manager ne valide pas ma demande ?
R: Relancez par email. Sans réponse sous 7 jours, la demande est considérée comme acceptée (sauf refus motivé).

## CNSS
Q: Comment connaître mon numéro CNSS ?
R: Il figure sur votre contrat de travail et sur vos bulletins de paie. Vous pouvez aussi le demander au RH.

Q: Quelles sont les cotisations CNSS ?
R: Employé : 5% du salaire brut (plafonné à 1 000 000 GNF). Employeur : 17% du salaire brut (plafonné à 1 000 000 GNF).

## Documents
Q: Comment demander une attestation d'employeur ?
R: Faites la demande dans le portail employé ou par email au RH. Délai : 3 jours ouvrés.

Q: Comment obtenir mon certificat de travail ?
R: Sur demande écrite, délivré sous 8 jours après la fin du contrat.

## Formation
Q: Comment demander une formation ?
R: Remplissez le formulaire "Demande de formation" dans le portail, avec accord préalable de votre manager. Budget annuel : 500 000 GNF/employé.

## Télétravail
Q: Puis-je télétravailler ?
R: Oui, si vous êtes en CDI avec 3+ mois d'ancienneté et que votre poste est compatible. Maximum 2 jours/semaine. Voir la politique de télétravail.

## Discipline
Q: Que faire en cas de conflit avec mon manager ?
R: 1. Dialogue direct. 2. Si échec, saisir le DRH. 3. Médiation possible. 4. En dernier recours, inspection du travail.`,
    metadata: { version: '1.0', date: '2026-02-01', auteur: 'DRH' },
  },
  {
    source: 'law' as const,
    title: 'Code du travail guinéen - Extraits clés',
    content: `# Code du travail guinéen (Loi L/2014/072/AN) - Extraits

## Article L.42 - CDD
Le contrat à durée déterminée ne peut être conclu que pour : 
- Remplacement d'un salarié absent
- Surcroît accidentel d'activité  
- Emplois saisonniers
- Recrutement d'un cadre
Durée maximale : 24 mois, renouvelable 1 fois.

## Article L.55 - Période d'essai
- Ouvriers/employés : 1 mois
- Agents de maîtrise/techniciens : 2 mois  
- Cadres : 3 mois
Renouvelable une fois par accord écrit.

## Article L.83 - Congés payés
Tout travailleur a droit à 30 jours calendaires de congé payé par an (2,5 jours par mois).
Les jours fériés ne sont pas comptabilisés dans les congés.

## Article L.121 - Préavis
- Ouvriers/employés : 1 mois
- Agents de maîtrise/techniciens : 2 mois
- Cadres : 3 mois
Le préavis peut être remplacé par une indemnité équivalente.

## Article L.132 - Indemnité de licenciement
Sauf faute grave, l'employé licencié a droit à :
- 1/4 de mois par année d'ancienneté (de 1 à 5 ans)
- 1/3 de mois par année d'ancienneté (de 6 à 10 ans)
- 2/5 de mois par année d'ancienneté (au-delà de 10 ans)

## Article L.150 - Heures supplémentaires
Les 8 premières heures supplémentaires par semaine : majoration de 25%.
Au-delà de 8 heures : majoration de 50%.
Heures de nuit (21h-6h) : majoration de 50%.
Heures dimanche et jours fériés : majoration de 100%.

## Article L.211 - Durée du travail
Durée légale : 40 heures par semaine (8h/jour sur 5 jours).
Repos hebdomadaire : minimum 24h consécutives (en principe le dimanche).

## Article L.260 - Travail des femmes
Congé maternité : 14 semaines (6 avant, 8 après).
Interdiction de licenciement pendant la grossesse et les 14 semaines suivant l'accouchement.

## CNSS - Cotisations
- Taux salarié : 5% (plafonné à 1 000 000 GNF/mois)
- Taux employeur : 17% (plafonné à 1 000 000 GNF/mois)
- ITS (Impôt Travaux Salaires) : 1,5% à la charge de l'employé

## Inspection du travail
Litiges non résolus : saisir l'Inspection du travail de Conakry (Tribunal du travail compétent).`,
    metadata: { source: 'Loi L/2014/072/AN', date: '2014', version: 'officielle' },
  },
  {
    source: 'manual' as const,
    title: 'Manuel d\'onboarding - Nouvel employé',
    content: `# Manuel d'onboarding - Nouvel employé

## Jour 1
9h00 : Accueil par le RH (signature contrat, remise badge, visite des locaux)
10h00 : Rencontre avec le manager direct
11h00 : Configuration poste de travail (IT)
14h00 : Présentation de l'entreprise (histoire, valeurs, organigramme)
15h30 : Lecture politique interne (règlement, sécurité, confidentialité)
17h00 : Récapitulatif de la journée avec le RH

## Jour 2-3
- Formation aux outils internes (SIRH, email, Slack)
- Lecture documentation produit/service
- Rencontres individuelles avec les membres clés de l'équipe (30min chacun)
- Configuration accès logiciels métier

## Semaine 1
- Formation produit approfondie (2 jours)
- Shadowing avec un collègue expérimenté (1 jour)
- Première réunion d'équipe
- Bilan semaine 1 avec manager (vendredi)

## Semaine 2
- Prise en main progressive des premières tâches
- Formation sécurité (obligatoire)
- Formation RGPD/confidentialité
- Définition des objectifs 30/60/90 jours avec le manager

## Mois 1
- Auto-évaluation à 30 jours
- Évaluation manager
- Ajustement des objectifs si nécessaire

## Mois 3 (fin période d'essai)
- Évaluation finale période d'essai
- Décision de confirmation ou non
- Si confirmation : plan de développement personnel

## Documents à fournir
- Pièce d'identité (CNI ou passeport)
- Photo d'identité (4 exemplaires)
- Numéro CNSS
- Extrait de naissance
- Casier judiciaire (moins de 3 mois)
- CV signé
- Diplômes et certificats
- RIB ou RIP (banque guinéenne)

## Contacts utiles
- RH : rh@datasphere.gn / +224 XXX
- IT : it@datasphere.gn
- Manager direct : (à définir)
- Parrain/marraine : (à définir)

## Mentions légales
- Confidentialité : l'employé s'engage à ne pas divulguer d'informations sensibles
- Non-concurrence : clause de 1 an post-départ (voir contrat)
- Propriété intellectuelle : toutes les créations appartiennent à l'entreprise`,
    metadata: { version: '3.0', date: '2026-01-10', auteur: 'RH' },
  },
]

async function main() {
  console.log('🌱 Seed RAG — documents RH de démo…')

  const company = await db.company.findFirst()
  if (!company) {
    console.error('❌ Aucune société trouvée.')
    process.exit(1)
  }

  let total = 0
  for (const doc of DOCUMENTS) {
    const result = await indexDocument(company.id, doc)
    console.log(`  ✓ ${doc.title} : ${result.chunksCreated} chunks`)
    total += result.chunksCreated
  }

  console.log(`\n✅ Seed terminé : ${DOCUMENTS.length} documents, ${total} chunks indexés`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
