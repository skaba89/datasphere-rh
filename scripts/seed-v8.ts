import { db } from '@/lib/db'

async function seedV8() {
  const company = await db.company.findFirst()
  if (!company) { console.error('Company not found'); process.exit(1) }
  const employees = await db.employee.findMany()

  // === Surveys ===
  const surveys = [
    { title: 'NPS Employé Q2 2026', description: 'Quelle est la probabilité que vous recommandiez Demo SARL comme employeur ?', type: 'NPS', status: 'FERMEE', startDate: '2026-04-01', endDate: '2026-04-15' },
    { title: 'Enquête engagement Juin 2026', description: 'Évaluer votre niveau d\'engagement au travail', type: 'ENGAGEMENT', status: 'FERMEE', startDate: '2026-06-01', endDate: '2026-06-15' },
    { title: 'Satisfaction Juillet 2026', description: 'Comment évaluez-vous votre satisfaction globale ?', type: 'NPS', status: 'OUVERTE', startDate: '2026-07-01', endDate: '2026-07-31' },
  ]

  for (const s of surveys) {
    const existing = await db.survey.findFirst({ where: { companyId: company.id, title: s.title } })
    if (existing) { console.log(`  ⏭️  Survey "${s.title}"`); continue }
    const survey = await db.survey.create({ data: { ...s, companyId: company.id } })

    // Add responses
    const numResponses = Math.floor(Math.random() * 4) + 3
    for (let i = 0; i < numResponses && i < employees.length; i++) {
      const emp = employees[i]
      const score = s.type === 'NPS' ? Math.floor(Math.random() * 11) : Math.floor(Math.random() * 6)
      const comments = [
        'Très bonne ambiance de travail',
        'Bon accompagnement managérial',
        'Manque de communication sur la stratégie',
        'Processus RH efficaces',
        'Salaires compétitifs pour le marché guinéen',
        null, null,
      ]
      await db.surveyResponse.create({
        data: {
          surveyId: survey.id,
          employeeId: emp.id,
          score,
          comment: comments[Math.floor(Math.random() * comments.length)],
        },
      })
    }
    console.log(`  ✅ Survey "${s.title}" créée`)
  }

  // === Skills ===
  const skillsData = [
    { name: 'JavaScript / TypeScript', category: 'TECHNIQUE', description: 'React, Next.js, Node.js' },
    { name: 'Python', category: 'TECHNIQUE', description: 'Data analysis, scripting' },
    { name: 'SQL / PostgreSQL', category: 'TECHNIQUE', description: 'Requêtes, optimisation' },
    { name: 'Gestion de projet', category: 'MANAGEMENT', description: 'Agile, Scrum' },
    { name: 'Leadership d\'équipe', category: 'MANAGEMENT', description: 'Management direct' },
    { name: 'Français', category: 'LANGUE', description: 'Langue maternelle' },
    { name: 'Anglais', category: 'LANGUE', description: 'Professionnel' },
    { name: 'Communication', category: 'SOFT', description: 'Présentation, négociation' },
    { name: 'Résolution de problèmes', category: 'SOFT', description: 'Analyse, créativité' },
    { name: 'Paie guinéenne', category: 'TECHNIQUE', description: 'CNSS, RTS, VF' },
  ]

  const createdSkills = []
  for (const s of skillsData) {
    const existing = await db.skill.findFirst({ where: { companyId: company.id, name: s.name } })
    if (existing) { createdSkills.push(existing); continue }
    const skill = await db.skill.create({ data: { ...s, companyId: company.id } })
    createdSkills.push(skill)
    console.log(`  ✅ Skill "${s.name}" créé`)
  }

  // Assessments for 5 employees
  const assessEmployees = employees.slice(0, 5)
  for (const emp of assessEmployees) {
    for (const skill of createdSkills.slice(0, 7)) {
      const existing = await db.skillAssessment.findFirst({ where: { skillId: skill.id, employeeId: emp.id } })
      if (existing) continue
      const level = Math.floor(Math.random() * 4) + 2 // 2-5
      const target = Math.min(5, level + Math.floor(Math.random() * 2))
      await db.skillAssessment.create({
        data: { skillId: skill.id, employeeId: emp.id, level, targetLevel: target },
      })
    }
  }
  console.log(`  ✅ ${assessEmployees.length * 7} assessments créés`)

  // === Compliance items ===
  const complianceItems = [
    { title: 'Déclaration CNSS trimestrielle Q2 2026', category: 'CNSS', status: 'A_JOUR', dueDate: '2026-07-15', lastCheck: '2026-07-01', frequency: 'TRIMESTRIEL', responsible: 'Comptable', notes: 'Déclaration soumise le 10/07/2026' },
    { title: 'Déclaration impôt sur salaire (RTS) Juin', category: 'FISCAL', status: 'A_JOUR', dueDate: '2026-07-15', lastCheck: '2026-07-05', frequency: 'MENSUEL', responsible: 'Comptable' },
    { title: 'Registre du travail à jour', category: 'TRAVAIL', status: 'A_JOUR', lastCheck: '2026-06-30', frequency: 'MENSUEL', responsible: 'RH' },
    { title: 'Affichage obligatoire (conventions collectives)', category: 'TRAVAIL', status: 'A_VERIFIER', dueDate: '2026-07-31', lastCheck: '2026-05-15', frequency: 'TRIMESTRIEL', responsible: 'RH', notes: 'Vérifier affichage nouveau local' },
    { title: 'Déclaration RGPD registre des traitements', category: 'RGPD', status: 'A_JOUR', lastCheck: '2026-04-01', frequency: 'ANNUEL', responsible: 'DPO' },
    { title: 'Audit sécurité incendie', category: 'AUTRE', status: 'EN_RETARD', dueDate: '2026-06-30', lastCheck: '2025-12-15', frequency: 'ANNUEL', responsible: 'Admin', notes: 'URGENT - Reprogrammer audit' },
    { title: 'Versement forfaitaire CNSS Juin', category: 'CNSS', status: 'A_JOUR', dueDate: '2026-07-15', lastCheck: '2026-07-10', frequency: 'MENSUEL', responsible: 'Comptable' },
    { title: 'Visite médicale annuelle', category: 'TRAVAIL', status: 'A_VERIFIER', dueDate: '2026-09-30', lastCheck: '2025-10-15', frequency: 'ANNUEL', responsible: 'RH', notes: 'Planifier avec clinique partenaire' },
  ]

  for (const item of complianceItems) {
    const existing = await db.complianceItem.findFirst({ where: { companyId: company.id, title: item.title } })
    if (existing) { console.log(`  ⏭️  Compliance "${item.title}"`); continue }
    await db.complianceItem.create({ data: { ...item, companyId: company.id } })
    console.log(`  ✅ Compliance "${item.title}" créé (${item.status})`)
  }

  // === Expense reports ===
  const expenses = [
    { employeeIdx: 0, title: 'Taxi aéroport - déplacement client', category: 'TRANSPORT', amount: 150000, date: '2026-07-03', status: 'APPROUVE', description: 'Aller-retour aéroport pour réunion Boké' },
    { employeeIdx: 1, title: 'Repas équipe RH', category: 'REPAS', amount: 350000, date: '2026-07-02', status: 'EN_ATTENTE', description: 'Déjeuner équipe RH (4 personnes)' },
    { employeeIdx: 2, title: 'Hébergement mission Boké', category: 'HEBERGEMENT', amount: 1200000, date: '2026-06-28', status: 'EN_ATTENTE', description: '2 nuits hôtel Boké pour mission terrain' },
    { employeeIdx: 3, title: 'Formation Excel avancé', category: 'FORMATION', amount: 500000, date: '2026-06-25', status: 'REMBOURSE', description: 'Frais inscription formation 2 jours' },
    { employeeIdx: 4, title: 'Clavier et souris bureau', category: 'MATERIEL', amount: 180000, date: '2026-07-01', status: 'EN_ATTENTE', description: 'Équipement poste de travail' },
    { employeeIdx: 6, title: 'Carburant déplacements semaine', category: 'TRANSPORT', amount: 400000, date: '2026-06-30', status: 'APPROUVE', description: 'Visites clients zone Conakry' },
    { employeeIdx: 0, title: 'Repas déplacement Boké', category: 'REPAS', amount: 125000, date: '2026-07-03', status: 'REFUSE', description: 'Repas non prévu dans la mission' },
  ]

  for (const exp of expenses) {
    const emp = employees[exp.employeeIdx]
    if (!emp) continue
    const existing = await db.expenseReport.findFirst({ where: { companyId: company.id, employeeId: emp.id, title: exp.title, date: exp.date } })
    if (existing) { console.log(`  ⏭️  Expense "${exp.title}"`); continue }
    await db.expenseReport.create({
      data: {
        companyId: company.id,
        employeeId: emp.id,
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        description: exp.description,
        status: exp.status,
        approvedBy: exp.status !== 'EN_ATTENTE' ? 'manager@demo.gn' : null,
        approvedAt: exp.status !== 'EN_ATTENTE' ? new Date() : null,
      },
    })
    console.log(`  ✅ Expense "${exp.title}" créé (${exp.status})`)
  }

  console.log('\n✅ Seed v0.8 terminé : surveys + skills + compliance + expenses')
}

seedV8()
  .then(() => db.$disconnect())
  .catch(e => { console.error(e); db.$disconnect() })
