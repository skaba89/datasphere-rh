/**
 * Exemple complet de formation + onboarding point par point
 *
 * Crée :
 * 1. Un programme de formation "Onboarding & Intégration DataSphere RH" (5 jours)
 * 2. Des tâches d'onboarding détaillées pour chaque nouvel employé
 * 3. Inscriptions des nouveaux employés à la formation
 * 4. Suivi de progression
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🎓 Création d\'un exemple complet formation + onboarding...\n')

  const company = await db.company.findFirst({ where: { sigle: 'DSD' } })
  if (!company) throw new Error('Société DSD introuvable')

  const employees = await db.employee.findMany({
    where: { companyId: company.id },
    orderBy: { dateEmbauche: 'desc' },
  })
  if (employees.length === 0) throw new Error('Aucun employé')

  // Les 2 employés les plus récents = "nouveaux" à onboarder
  const newEmployees = employees.slice(0, 2)
  console.log(`Nouveaux employés à onboarder : ${newEmployees.map(e => `${e.prenoms} ${e.nom}`).join(', ')}`)

  // ============================================================
  // 1. PROGRAMME DE FORMATION COMPLET (5 jours)
  // ============================================================
  console.log('\n📅 Création du programme de formation...')

  // Vérifier si la formation existe déjà
  const existingTraining = await db.training.findFirst({
    where: { companyId: company.id, title: { contains: 'Onboarding & Intégration' } },
  })

  let training: any
  if (existingTraining) {
    training = existingTraining
    console.log(`  ⊘ Formation existante trouvée (${training.id})`)
  } else {
    training = await db.training.create({
      data: {
        companyId: company.id,
        title: 'Onboarding & Intégration DataSphere RH — Programme complet 5 jours',
        description: `Programme d'intégration structuré pour tous les nouveaux employés.

OBJECTIFS PÉDAGOGIQUES :
- Comprendre la culture et les valeurs de DataSphere RH
- Maîtriser les outils internes (SIRH, messagerie, collaboratif)
- Connaître les processus RH (paie, congés, évaluations)
- Intégrer son équipe et son poste de manière autonome
- Disposer de tous les accès et équipements nécessaires

PROGRAMME DÉTAILLÉ :

Jour 1 — Accueil & Administration (7h)
- 09h00 : Accueil par le DRH, présentation de l'entreprise
- 10h00 : Visite des locaux et rencontre des équipes
- 11h00 : Remise du kit d'accueil (badge, ordinateur, manuel employé)
- 12h00 : Déjeuner de bienvenue avec l'équipe directe
- 14h00 : Signature du contrat et documents administratifs
- 15h00 : Configuration poste de travail (compte email, SIRH, VPN)
- 16h00 : Présentation de l'organigramme et des interlocuteurs clés
- 17h00 : Tour de table et questions

Jour 2 — Culture & Valeurs (7h)
- 09h00 : Histoire et vision de DataSphere RH
- 10h30 : Valeurs d'entreprise et charte éthique
- 11h30 : Politique RSE et développement durable
- 14h00 : Code du travail guinéen — droits et devoirs
- 15h30 : Politique de confidentialité et RGPD
- 16h30 : Quiz de validation Jour 2

Jour 3 — Outils & Processus RH (7h)
- 09h00 : Maîtrise du SIRH DataSphere RH (modules Paie, Congés, Documents)
- 10h30 : Messagerie professionnelle et calendrier partagé
- 11h30 : Outils collaboratifs (Teams, SharePoint, gestion de projet)
- 14h00 : Processus paie : échéances, bulletins, CNSS
- 15h30 : Processus congés : demande, validation, soldes
- 16h30 : Atelier pratique sur le SIRH

Jour 4 — Poste & Équipe (7h)
- 09h00 : Présentation détaillée du poste et des responsabilités
- 10h30 : Lecture du descriptif de poste et objectifs SMART
- 11h30 : Rencontre avec le manager direct et fixation des objectifs
- 14h00 : Shadowing : observation d'un collègue expérimenté
- 16h00 : Formation aux outils spécifiques au poste
- 17h00 : Feedback et questions

Jour 5 — Évaluation & Clôture (4h)
- 09h00 : Quiz final de validation des acquis
- 10h00 : Feedback du nouveau collaborateur sur l'onboarding
- 11h00 : Entretien avec le DRH et le manager
- 12h00 : Remise du certificat de fin de formation

MODALITÉS :
- Format : Présentiel + ateliers pratiques
- Durée : 35 heures (5 jours x 7h)
- Lieu : Salle de formation DataSphere RH, Kaloum, Conakry
- Formateur : Aïcha Diallo (DRH) + interventions experts
- Évaluation : Quiz quotidien + quiz final (score minimum 70%)
- Certification : Attestation de fin de formation remise le Jour 5`,
        category: 'RH',
        duration: 35,
        format: 'PRESENTIEL',
        startDate: '2026-08-03',
        endDate: '2026-08-07',
        trainer: 'Aïcha Diallo (DRH) + équipe DataSphere RH',
        location: 'Salle de formation — Kaloum, Conakry',
        maxParticipants: 10,
        status: 'PLANIFIEE',
      },
    })
    console.log(`  ✓ Formation créée : ${training.title}`)
  }

  // ============================================================
  // 2. INSCRIPTIONS DES NOUVEAUX EMPLOYÉS
  // ============================================================
  console.log('\n👥 Inscription des nouveaux employés...')

  for (const emp of newEmployees) {
    const existingEnrollment = await db.trainingEnrollment.findFirst({
      where: { trainingId: training.id, employeeId: emp.id },
    })
    if (existingEnrollment) {
      console.log(`  ⊘ ${emp.prenoms} ${emp.nom} déjà inscrit`)
      continue
    }
    await db.trainingEnrollment.create({
      data: {
        trainingId: training.id,
        employeeId: emp.id,
        status: 'CONFIRME',
        progress: 0,
      },
    })
    console.log(`  ✓ ${emp.prenoms} ${emp.nom} inscrit à la formation`)
  }

  // ============================================================
  // 3. TÂCHES D'ONBOARDING POINT PAR POINT
  // ============================================================
  console.log('\n📋 Création des tâches d\'onboarding point par point...')

  const onboardingTasks = [
    // === ADMINISTRATIF (Jour 1) ===
    {
      title: 'Signer le contrat de travail',
      description: 'Signature du contrat (CDI/CDD/Stage) en 2 exemplaires originaux. Vérifier les éléments : poste, salaire, période d\'essai, date d\'embauche, lieu de travail.',
      category: 'ADMIN',
      assignedTo: 'RH',
      dueOffset: 1, // J+1
    },
    {
      title: 'Remplir la fiche de renseignements employé',
      description: 'Compléter la fiche R4 avec : état civil complet, situation familiale, nombre d\'enfants, adresse personnelle, contact d\'urgence, personne à prévenir.',
      category: 'ADMIN',
      assignedTo: 'RH',
      dueOffset: 1,
    },
    {
      title: 'Fournir les pièces administratives',
      description: 'Remettre : copie CNI, 4 photos d\'identité, extrait de naissance, casier judiciaire (< 3 mois), numéro CNSS, RIB ou numéro Orange Money pour virement salaire.',
      category: 'ADMIN',
      assignedTo: 'RH',
      dueOffset: 3,
    },
    {
      title: 'Enregistrer auprès de la CNSS',
      description: 'Déclaration d\'embauche auprès de la CNSS Guinée dans les 8 jours. Récupérer le numéro d\'affiliation et le carnet CNSS. Taux : 5% salarié, 17% employeur.',
      category: 'ADMIN',
      assignedTo: 'RH',
      dueOffset: 8,
    },
    {
      title: 'Créer le dossier employé dans le SIRH',
      description: 'Saisir l\'employé dans DataSphere RH : matricule, informations personnelles, contrat, salaire, documents. Vérifier la cohérence des données.',
      category: 'ADMIN',
      assignedTo: 'RH',
      dueOffset: 2,
    },

    // === IT (Jour 1-2) ===
    {
      title: 'Créer le compte de messagerie professionnelle',
      description: 'Créer l\'adresse email @datasphere.gn. Configurer la signature, les redirections, l\'agenda partagé. Tester l\'envoi/réception.',
      category: 'IT',
      assignedTo: 'IT',
      dueOffset: 1,
    },
    {
      title: 'Configurer le poste de travail',
      description: 'Installation poste : ordinateur, écran, clavier, souris. Installation logiciels : Office 365, Teams, VPN, antivirus, navigateur, SIRH.',
      category: 'IT',
      assignedTo: 'IT',
      dueOffset: 1,
    },
    {
      title: 'Attribuer les accès SIRH DataSphere RH',
      description: 'Créer le compte utilisateur dans le SIRH avec le rôle approprié (EMPLOYE, MANAGER, RH, COMPTABLE). Configurer les permissions selon le poste.',
      category: 'IT',
      assignedTo: 'IT',
      dueOffset: 1,
    },
    {
      title: 'Configurer l\'accès VPN et sécurité',
      description: 'Installation client VPN, configuration double authentification (2FA), formation aux bonnes pratiques de cybersécurité (mots de passe, phishing).',
      category: 'IT',
      assignedTo: 'IT',
      dueOffset: 2,
    },
    {
      title: 'Inscription aux outils collaboratifs',
      description: 'Accès Teams (canaux d\'équipe), SharePoint (documents partagés), système de tickets helpdesk. Test de connexion sur chaque plateforme.',
      category: 'IT',
      assignedTo: 'IT',
      dueOffset: 2,
    },

    // === RH (Jour 1-5) ===
    {
      title: 'Remettre le manuel de l\'employé',
      description: 'Remise du manuel d\'accueil (version papier + numérique). Contenu : culture d\'entreprise, valeurs, charte, organigramme, processus RH, annuaires.',
      category: 'RH',
      assignedTo: 'RH',
      dueOffset: 1,
    },
    {
      title: 'Présenter les avantages sociaux',
      description: 'Expliquer : mutuelle santé, tickets restaurant, primes de performance, 13ème mois, congés payés (30j/an), congés spéciaux (mariage, décès, maternité 14 sem).',
      category: 'RH',
      assignedTo: 'RH',
      dueOffset: 2,
    },
    {
      title: 'Configurer la paie et les prélèvements',
      description: 'Vérifier la configuration salariale : salaire de base, primes, CNSS (5%), ITS (1,5%), versement forfaitaire (4%). Valider le bulletin du premier mois.',
      category: 'RH',
      assignedTo: 'RH',
      dueOffset: 3,
    },
    {
      title: 'Planifier l\'entretien d\'intégration J+15',
      description: 'Planifier un entretien de suivi à J+15 avec le RH pour faire le point : intégration, questions, difficultés, ajustements éventuels.',
      category: 'RH',
      assignedTo: 'RH',
      dueOffset: 15,
    },
    {
      title: 'Planifier l\'entretien de fin de période d\'essai',
      description: 'Planifier l\'entretien de fin de période d\'essai (3 mois pour CDI). Préparer le formulaire d\'évaluation et les critères de validation.',
      category: 'RH',
      assignedTo: 'RH',
      dueOffset: 90,
    },

    // === FORMATION (Jour 1-5) ===
    {
      title: 'Inscrire au programme d\'onboarding 5 jours',
      description: 'Inscription au programme "Onboarding & Intégration DataSphere RH" (35h, 5 jours). Sessions du 03/08/2026 au 07/08/2026, salle de formation Kaloum.',
      category: 'FORMATION',
      assignedTo: 'RH',
      dueOffset: 1,
    },
    {
      title: 'Distribuer les supports de formation',
      description: 'Remettre : livret d\'accueil, présentation entreprise, guide SIRH, fiches processus (paie, congés, contrats), quiz d\'évaluation.',
      category: 'FORMATION',
      assignedTo: 'RH',
      dueOffset: 1,
    },
    {
      title: 'Suivre la formation Jour 1 — Accueil & Admin',
      description: 'Participation obligatoire. Contenu : accueil DRH, visite locaux, kit d\'accueil, signature contrat, config poste, organigramme. Émargement obligatoire.',
      category: 'FORMATION',
      assignedTo: 'RH',
      dueOffset: 1,
    },
    {
      title: 'Suivre la formation Jour 2 — Culture & Valeurs',
      description: 'Participation obligatoire. Contenu : histoire entreprise, valeurs, charte éthique, RSE, Code du travail guinéen, RGPD. Quiz de validation.',
      category: 'FORMATION',
      assignedTo: 'RH',
      dueOffset: 2,
    },
    {
      title: 'Suivre la formation Jour 3 — Outils & Processus RH',
      description: 'Participation obligatoire. Contenu : SIRH, messagerie, Teams, processus paie, processus congés. Atelier pratique sur le SIRH.',
      category: 'FORMATION',
      assignedTo: 'RH',
      dueOffset: 3,
    },
    {
      title: 'Suivre la formation Jour 4 — Poste & Équipe',
      description: 'Participation obligatoire. Contenu : présentation poste, descriptif, objectifs SMART, rencontre manager, shadowing collègue, outils spécifiques.',
      category: 'FORMATION',
      assignedTo: 'RH',
      dueOffset: 4,
    },
    {
      title: 'Suivre la formation Jour 5 — Évaluation & Clôture',
      description: 'Participation obligatoire. Quiz final (score min 70%). Feedback onboarding. Entretien DRH + manager. Remise certificat de fin de formation.',
      category: 'FORMATION',
      assignedTo: 'RH',
      dueOffset: 5,
    },

    // === ÉQUIPEMENT (Jour 1-2) ===
    {
      title: 'Remettre le badge d\'accès',
      description: 'Attribution du badge d\'accès nominatif avec photo. Accès aux locaux (heures ouvrées), parking, salle de repos. Démarche en cas de perte.',
      category: 'EQUIPEMENT',
      assignedTo: 'RH',
      dueOffset: 1,
    },
    {
      title: 'Attribuer le matériel informatique',
      description: 'Remise : ordinateur portable, sacoche, chargeur, souris. Émargement sur le registre d\'attribution. Responsabilité de l\'employé sur le matériel.',
      category: 'EQUIPEMENT',
      assignedTo: 'IT',
      dueOffset: 1,
    },
    {
      title: 'Remettre le kit de bureau',
      description: 'Kit : carnet, stylo, gourde, tasse. Accès à l\'imprimante (code badge). Configuration scan vers email. Explication du système de gestion du papier.',
      category: 'EQUIPEMENT',
      assignedTo: 'RH',
      dueOffset: 1,
    },
    {
      title: 'Présenter les espaces communs',
      description: 'Visite : salle de pause, cuisine, toilettes, salle de réunion (réservation), salle de formation, infirmerie, parkings. Règles d\'utilisation.',
      category: 'EQUIPEMENT',
      assignedTo: 'RH',
      dueOffset: 1,
    },
  ]

  // Créer les tâches pour chaque nouvel employé
  for (const emp of newEmployees) {
    // Vérifier si des tâches existent déjà pour cet employé
    const existingTasks = await db.onboardingTask.count({
      where: { employeeId: emp.id },
    })
    if (existingTasks > 0) {
      console.log(`  ⊘ ${emp.prenoms} ${emp.nom} a déjà ${existingTasks} tâches d'onboarding`)
      continue
    }

    const today = new Date()
    let created = 0
    for (const task of onboardingTasks) {
      const dueDate = new Date(today)
      dueDate.setDate(dueDate.getDate() + task.dueOffset)

      // Simuler quelques tâches terminées (les premières)
      const isCompleted = created < 5
      const isInProgress = created >= 5 && created < 8

      await db.onboardingTask.create({
        data: {
          companyId: company.id,
          employeeId: emp.id,
          title: task.title,
          description: task.description,
          category: task.category,
          status: isCompleted ? 'TERMINE' : (isInProgress ? 'EN_COURS' : 'A_FAIRE'),
          dueDate: dueDate.toISOString().slice(0, 10),
          assignedTo: task.assignedTo,
          completedAt: isCompleted ? new Date(today.getTime() - (5 - created) * 86400000) : null,
        },
      })
      created++
    }
    console.log(`  ✓ ${created} tâches d'onboarding créées pour ${emp.prenoms} ${emp.nom}`)
  }

  // ============================================================
  // 4. STATISTIQUES FINALES
  // ============================================================
  console.log('\n📊 Statistiques finales :')

  const allTrainings = await db.training.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { enrollments: true } } },
  })
  console.log(`   Formations : ${allTrainings.length}`)
  for (const t of allTrainings) {
    console.log(`     • ${t.title} (${t._count.enrollments} inscrits, ${t.status})`)
  }

  const enrollments = await db.trainingEnrollment.count({
    where: { trainingId: training.id },
  })
  console.log(`   Inscriptions à l'onboarding : ${enrollments}`)

  for (const emp of newEmployees) {
    const tasks = await db.onboardingTask.findMany({
      where: { employeeId: emp.id },
      orderBy: { createdAt: 'asc' },
    })
    const done = tasks.filter(t => t.status === 'TERMINE').length
    const inProgress = tasks.filter(t => t.status === 'EN_COURS').length
    const todo = tasks.filter(t => t.status === 'A_FAIRE').length
    const progress = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0
    console.log(`\n   ${emp.prenoms} ${emp.nom} :`)
    console.log(`     ${tasks.length} tâches — ${done} terminées, ${inProgress} en cours, ${todo} à faire`)
    console.log(`     Progression onboarding : ${progress}%`)

    // Mettre à jour la progression de l'inscription formation
    await db.trainingEnrollment.updateMany({
      where: { trainingId: training.id, employeeId: emp.id },
      data: { progress: Math.round(progress * 0.8) }, // La formation représente 80% de l'onboarding
    })
  }

  // Résumé par catégorie
  console.log('\n📋 Répartition par catégorie :')
  const categories = ['ADMIN', 'IT', 'RH', 'FORMATION', 'EQUIPEMENT']
  for (const cat of categories) {
    const count = await db.onboardingTask.count({
      where: { companyId: company.id, category: cat },
    })
    console.log(`   ${cat} : ${count} tâches`)
  }

  console.log('\n✅ Exemple complet formation + onboarding créé !')
  console.log('   Connectez-vous en admin pour voir :')
  console.log('   - Module Formations : programme "Onboarding & Intégration"')
  console.log('   - Module Onboarding : checklist point par point (24 tâches)')
  console.log('   - Module Employés : progression dans la fiche détaillée')
}

main().catch(e => { console.error('Erreur:', e); process.exit(1) }).finally(() => db.$disconnect())
