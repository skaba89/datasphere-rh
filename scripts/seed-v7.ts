import { db } from '@/lib/db'

async function seedV7() {
  const company = await db.company.findFirst()
  if (!company) { console.error('Company not found'); process.exit(1) }

  const employees = await db.employee.findMany({ take: 5 })

  // Budget items - prévisionnel 2026
  const budgetItems = [
    // Masse salariale mensuelle
    { category: 'MASSE_SALARIALE', label: 'Masse salariale Janvier 2026', amount: 22000000, period: '2026-01', type: 'REALISE' },
    { category: 'MASSE_SALARIALE', label: 'Masse salariale Février 2026', amount: 22500000, period: '2026-02', type: 'REALISE' },
    { category: 'MASSE_SALARIALE', label: 'Masse salariale Mars 2026', amount: 23000000, period: '2026-03', type: 'REALISE' },
    { category: 'MASSE_SALARIALE', label: 'Masse salariale Avril 2026', amount: 23500000, period: '2026-04', type: 'REALISE' },
    { category: 'MASSE_SALARIALE', label: 'Masse salariale Mai 2026', amount: 24000000, period: '2026-05', type: 'REALISE' },
    { category: 'MASSE_SALARIALE', label: 'Masse salariale Juin 2026', amount: 24500000, period: '2026-06', type: 'REALISE' },
    { category: 'MASSE_SALARIALE', label: 'Masse salariale Juillet 2026', amount: 25000000, period: '2026-07', type: 'PREVU' },
    // Charges patronales (~18%)
    { category: 'CHARGES', label: 'Charges patronales Janvier 2026', amount: 3960000, period: '2026-01', type: 'REALISE' },
    { category: 'CHARGES', label: 'Charges patronales Février 2026', amount: 4050000, period: '2026-02', type: 'REALISE' },
    { category: 'CHARGES', label: 'Charges patronales Mars 2026', amount: 4140000, period: '2026-03', type: 'REALISE' },
    { category: 'CHARGES', label: 'Charges patronales Avril 2026', amount: 4230000, period: '2026-04', type: 'REALISE' },
    { category: 'CHARGES', label: 'Charges patronales Mai 2026', amount: 4320000, period: '2026-05', type: 'REALISE' },
    { category: 'CHARGES', label: 'Charges patronales Juin 2026', amount: 4410000, period: '2026-06', type: 'REALISE' },
    { category: 'CHARGES', label: 'Charges patronales Juillet 2026', amount: 4500000, period: '2026-07', type: 'PREVU' },
    // Formation
    { category: 'FORMATION', label: 'Budget formation annuel 2026', amount: 15000000, period: '2026', type: 'PREVU' },
    { category: 'FORMATION', label: 'Formation paie CNSS Q1', amount: 2000000, period: '2026-Q1', type: 'REALISE' },
    { category: 'FORMATION', label: 'Formation sécurité Q2', amount: 1500000, period: '2026-Q2', type: 'REALISE' },
    // Recrutement
    { category: 'RECRUTEMENT', label: 'Frais recrutement annuel 2026', amount: 8000000, period: '2026', type: 'PREVU' },
    { category: 'RECRUTEMENT', label: 'Cabinet recrutement Développeur', amount: 2500000, period: '2026-Q1', type: 'REALISE' },
    { category: 'RECRUTEMENT', label: 'Annonces LinkedIn Q2', amount: 800000, period: '2026-Q2', type: 'REALISE' },
  ]

  for (const item of budgetItems) {
    const existing = await db.budgetItem.findFirst({
      where: { companyId: company.id, label: item.label, period: item.period },
    })
    if (existing) { console.log(`  ⏭️  Budget "${item.label}" existe déjà`); continue }
    await db.budgetItem.create({ data: { ...item, companyId: company.id } })
    console.log(`  💰 Budget "${item.label}" créé`)
  }

  // Onboarding tasks pour 2 employés récents
  const onboardingTemplates = [
    { title: 'Créer compte email professionnel', category: 'IT', assignedTo: 'IT' },
    { title: 'Remettre ordinateur portable', category: 'EQUIPEMENT', assignedTo: 'IT' },
    { title: 'Badge d\'accès bureau', category: 'EQUIPEMENT', assignedTo: 'ADMIN' },
    { title: 'Signer contrat de travail', category: 'ADMIN', assignedTo: 'RH' },
    { title: 'Inscription CNSS', category: 'ADMIN', assignedTo: 'RH' },
    { title: 'Présentation à l\'équipe', category: 'RH', assignedTo: 'MANAGER' },
    { title: 'Formation sécurité incendie', category: 'FORMATION', assignedTo: 'RH' },
    { title: 'Configuration accès logiciels RH', category: 'IT', assignedTo: 'IT' },
  ]

  // Assigner à l'employé le plus récent (DS-005 Sylla Ibrahima - stage)
  if (employees.length >= 5) {
    const recentEmp = employees[4] // Sylla Ibrahima
    for (const tmpl of onboardingTemplates) {
      const existing = await db.onboardingTask.findFirst({
        where: { employeeId: recentEmp.id, title: tmpl.title },
      })
      if (existing) { console.log(`  ⏭️  Onboarding "${tmpl.title}" existe déjà`); continue }

      // Marquer quelques tâches comme terminées
      const isCompleted = ['Créer compte email professionnel', 'Remettre ordinateur portable', 'Signer contrat de travail'].includes(tmpl.title)
      await db.onboardingTask.create({
        data: {
          companyId: company.id,
          employeeId: recentEmp.id,
          title: tmpl.title,
          category: tmpl.category,
          assignedTo: tmpl.assignedTo,
          status: isCompleted ? 'TERMINE' : 'A_FAIRE',
          completedAt: isCompleted ? new Date() : null,
          dueDate: '2026-07-15',
        },
      })
    }
    console.log(`  ✅ 8 tâches d'onboarding créées pour ${recentEmp.nom} ${recentEmp.prenoms}`)
  }

  // Job offers
  const jobOffers = [
    {
      title: 'Développeur Full-Stack Senior',
      description: 'Nous recherchons un développeur Full-Stack Senior pour rejoindre notre équipe IT. Vous participerez au développement de notre plateforme SIRH et serez impliqué dans toutes les phases du cycle de développement.',
      department: 'IT',
      location: 'Conakry',
      contractType: 'CDI',
      salaryMin: 4000000,
      salaryMax: 6000000,
      requirements: '- 5+ ans d\'expérience en développement Full-Stack\n- Maîtrise React/Next.js + Node.js/NestJS\n- PostgreSQL + Prisma\n- TypeScript strict\n- Expérience SaaS multi-tenant',
      benefits: '- Mutuelle d\'entreprise\n- Prime de transport\n- 13ème mois\n- Formation continue\n- Télétravail partiel',
      status: 'PUBLIEE',
      closingDate: '2026-08-15',
    },
    {
      title: 'Responsable Ressources Humaines',
      description: 'Le Responsable RH pilote la politique RH de l\'entreprise : recrutement, formation, paie, relations sociales. Il/elle encadre une équipe de 3 personnes.',
      department: 'RH',
      location: 'Conakry',
      contractType: 'CDI',
      salaryMin: 5000000,
      salaryMax: 7000000,
      requirements: '- Master RH ou droit social\n- 7+ ans d\'expérience RH\n- Connaissance Code du travail guinéen\n- Maîtrise CNSS et paie\n- Anglais professionnel',
      benefits: '- Voiture de fonction\n- Mutuelle famille\n- Prime annuelle\n- Formation management',
      status: 'PUBLIEE',
      closingDate: '2026-07-31',
    },
    {
      title: 'Comptable Senior',
      description: 'Le/la Comptable Senior supervise la comptabilité générale et analytique, prépare les clôtures mensuelles et annuelles, et participe aux audits.',
      department: 'Finance',
      location: 'Conakry',
      contractType: 'CDI',
      salaryMin: 3000000,
      salaryMax: 4500000,
      requirements: '- BTS/DUT Comptabilité ou équivalent\n- 5+ ans d\'expérience\n- Maîtrise Sage ou équivalent\n- Connaissance fiscalité guinéenne',
      benefits: '- Mutuelle\n- Prime de transport\n- Formation continue',
      status: 'PUBLIEE',
      closingDate: '2026-08-30',
    },
    {
      title: 'Stagiaire Marketing Digital',
      description: 'Stage de 6 mois en marketing digital. Le/la stagiaire participera à la stratégie de communication digitale, gestion des réseaux sociaux, création de contenu.',
      department: 'Marketing',
      location: 'Conakry',
      contractType: 'STAGE',
      salaryMin: 350000,
      salaryMax: 500000,
      requirements: '- Étudiant(e) en Marketing/Communication\n- Connaissance réseaux sociaux\n- Créatif(ve) et curieux(se)\n- maîtrise Canva/Photoshop',
      benefits: '- Indemnité de stage\n- Possibilité d\'embauche\n- Formation continue',
      status: 'BROUILLON',
      closingDate: null,
    },
  ]

  for (const offer of jobOffers) {
    const existing = await db.jobOffer.findFirst({
      where: { companyId: company.id, title: offer.title },
    })
    if (existing) { console.log(`  ⏭️  Offre "${offer.title}" existe déjà`); continue }
    await db.jobOffer.create({
      data: {
        ...offer,
        companyId: company.id,
        publishedAt: offer.status === 'PUBLIEE' ? new Date() : null,
      },
    })
    console.log(`  💼 Offre "${offer.title}" créée (${offer.status})`)
  }

  console.log('\n✅ Seed v0.7 terminé : budget + onboarding + offres d\'emploi')
}

seedV7()
  .then(() => db.$disconnect())
  .catch(e => { console.error(e); db.$disconnect() })
