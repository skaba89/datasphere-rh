/**
 * Enrichissement complet pour démo client :
 * - Offres d'emploi (JobOffers)
 * - Candidats (Candidates)
 * - Formations (Trainings)
 * - Évaluations (Evaluations)
 * - Objectifs (Objectives)
 * - Compétences + évaluations (Skills + SkillAssessments)
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌟 Enrichissement démo client...')
  const company = await db.company.findFirst({ where: { sigle: 'DSD' } })
  if (!company) throw new Error('Société DSD introuvable')

  const employees = await db.employee.findMany({ where: { companyId: company.id } })
  if (employees.length === 0) throw new Error('Aucun employé DSD')

  // === Job Offers ===
  const existingOffers = await db.jobOffer.count({ where: { companyId: company.id } })
  if (existingOffers === 0) {
    const offers = [
      {
        title: 'Développeur Full-Stack Senior',
        description: 'Nous recherchons un développeur expérimenté pour rejoindre notre équipe IT. Vous travaillerez sur des projets innovants avec les technologies modernes (React, Node.js, PostgreSQL).',
        department: 'IT',
        location: 'Conakry',
        contractType: 'CDI',
        salaryMin: 4000000,
        salaryMax: 6000000,
        requirements: 'Bac+5 en informatique, 5 ans d\'expérience, maîtrise React/Node.js, anglais technique',
        benefits: 'Mutuelle, primes performance, télétravail 2j/sem, formation continue',
        status: 'PUBLIEE',
        publishedAt: new Date('2026-06-15'),
        closingDate: '2026-08-15',
      },
      {
        title: 'Comptable Senior',
        description: 'Poste de comptable senior pour gérer la comptabilité générale et analytique. Expérience en paie et déclarations CNSS requise.',
        department: 'Finance',
        location: 'Conakry',
        contractType: 'CDI',
        salaryMin: 3500000,
        salaryMax: 4500000,
        requirements: 'DEC/Bac+3 compta, 3 ans expérience, maîtrise logiciel comptable, connaissance CNSS Guinée',
        benefits: 'Mutuelle, primes, 13ème mois',
        status: 'PUBLIEE',
        publishedAt: new Date('2026-06-20'),
        closingDate: '2026-08-30',
      },
      {
        title: 'Responsable Commercial',
        description: 'Pilotez le développement commercial sur la zone de Conakry. Management d\'une équipe de 5 commerciaux.',
        department: 'Commercial',
        location: 'Conakry',
        contractType: 'CDI',
        salaryMin: 5000000,
        salaryMax: 7000000,
        requirements: 'Bac+4 commerce, 5 ans expérience B2B, leadership, réseau guinéen',
        benefits: 'Voiture de fonction, commissions, mutuelle',
        status: 'PUBLIEE',
        publishedAt: new Date('2026-07-01'),
        closingDate: '2026-09-01',
      },
      {
        title: 'Stagiaire Marketing Digital',
        description: 'Stage de 6 mois en marketing digital. Création de contenu, gestion réseaux sociaux, analyse campagne.',
        department: 'Marketing',
        location: 'Conakry',
        contractType: 'STAGE',
        salaryMin: 500000,
        salaryMax: 800000,
        requirements: 'Étudiant en marketing/communication, maîtrise réseaux sociaux, créativité',
        benefits: 'Indemnité de stage, possibilité d\'embauche',
        status: 'PUBLIEE',
        publishedAt: new Date('2026-07-05'),
        closingDate: '2026-08-31',
      },
    ]
    for (const o of offers) {
      await db.jobOffer.create({ data: { ...o, companyId: company.id } })
    }
    console.log(`  ✓ ${offers.length} offres d'emploi créées`)
  } else {
    console.log(`  ⊘ ${existingOffers} offres d'emploi existent déjà`)
  }

  // === Candidates ===
  const existingCand = await db.candidate.count({ where: { companyId: company.id } })
  if (existingCand === 0) {
    const candidates = [
      { firstName: 'Mohamed', lastName: 'Sylla', email: 'mohamed.sylla@gmail.com', phone: '+224 622 123 456', positionApplied: 'Développeur Full-Stack Senior', source: 'LINKEDIN', status: 'EN_ENTRETIEN', rating: 4, expectedSalary: 5500000, availability: 'immédiate', notes: 'Profil excellent, 6 ans expérience chez Orange Guinée' },
      { firstName: 'Aïcha', lastName: 'Barry', email: 'aicha.barry@yahoo.fr', phone: '+224 628 234 567', positionApplied: 'Comptable Senior', source: 'REFERRAL', status: 'NOUVEAU', rating: 3, expectedSalary: 4000000, availability: '2026-09-01', notes: 'Recommandée par le DG' },
      { firstName: 'Ibrahima', lastName: 'Camara', email: 'ibrahima.camara@gmail.com', phone: '+224 621 345 678', positionApplied: 'Responsable Commercial', source: 'CABINET', status: 'OFFRE', rating: 5, expectedSalary: 6500000, availability: 'immédiate', notes: 'Très bon profil, expérience MTN Guinée' },
      { firstName: 'Fatoumata', lastName: 'Diallo', email: 'fatoumata.diallo@gmail.com', phone: '+224 624 456 789', positionApplied: 'Stagiaire Marketing Digital', source: 'PORTAIL', status: 'NOUVEAU', rating: 4, expectedSalary: 700000, availability: 'immédiate', notes: 'Étudiante ISG, très motivée' },
      { firstName: 'Sékou', lastName: 'Touré', email: 'sekou.toure@gmail.com', phone: '+224 620 567 890', positionApplied: 'Développeur Full-Stack Senior', source: 'LINKEDIN', status: 'REFUSE', rating: 2, expectedSalary: 6000000, availability: '2026-10-01', notes: 'Salaire trop élevé, compétences partielles' },
      { firstName: 'Mariama', lastName: 'Condé', email: 'mariama.conde@yahoo.fr', phone: '+224 612 678 901', positionApplied: 'Comptable Senior', source: 'PORTAIL', status: 'ACCEPTE', rating: 5, expectedSalary: 4200000, availability: 'immédiate', notes: 'Embauchée, début 01/09/2026' },
    ]
    for (const c of candidates) {
      await db.candidate.create({
        data: {
          ...c,
          companyId: company.id,
          interviewDate: c.status === 'EN_ENTRETIEN' ? new Date('2026-07-20') : null,
        },
      })
    }
    console.log(`  ✓ ${candidates.length} candidats créés`)
  } else {
    console.log(`  ⊘ ${existingCand} candidats existent déjà`)
  }

  // === Trainings ===
  const existingTrain = await db.training.count({ where: { companyId: company.id } })
  if (existingTrain === 0) {
    const trainings = [
      { title: 'Sécurité informatique - Cybersécurité 101', description: 'Formation sur les bonnes pratiques de sécurité informatique, phishing, mots de passe, RGPD', category: 'SECURITE', duration: 14, format: 'PRESENTIEL', startDate: '2026-07-20', endDate: '2026-07-21', trainer: 'Boubacar Barry (Expert Cybersécurité)', location: 'Salle de formation Conakry', maxParticipants: 20, status: 'PLANIFIEE' },
      { title: 'Management d\'équipe - Leadership', description: 'Développer ses compétences managériales, communication, delegation, feedback', category: 'MANAGEMENT', duration: 21, format: 'MIXTE', startDate: '2026-08-05', endDate: '2026-08-07', trainer: 'Cabinet AFRIQUE RH', location: 'Conakry + en ligne', maxParticipants: 12, status: 'PLANIFIEE' },
      { title: 'Excel avancé - Tableaux croisés & Macros', description: 'Maîtriser les fonctionnalités avancées d\'Excel pour reporting et analyse', category: 'TECHNIQUE', duration: 14, format: 'EN_LIGNE', startDate: '2026-06-10', endDate: '2026-06-11', trainer: 'Lamine Barry', location: 'En ligne (Teams)', maxParticipants: 15, status: 'TERMINEE' },
      { title: 'Anglais professionnel B2', description: 'Améliorer son anglais pour les communications professionnelles internationales', category: 'LANGUES', duration: 40, format: 'EN_LIGNE', startDate: '2026-09-01', endDate: '2026-12-15', trainer: 'British Council', location: 'En ligne', maxParticipants: 10, status: 'PLANIFIEE' },
      { title: 'Paie & CNSS Guinée - Mise à jour 2026', description: 'Évolutions réglementaires CNSS, ITS, calculs de paie conformes', category: 'RH', duration: 7, format: 'PRESENTIEL', startDate: '2026-07-25', endDate: '2026-07-25', trainer: 'Fatoumata Touré (Comptable)', location: 'Salle RH', maxParticipants: 8, status: 'EN_COURS' },
    ]
    for (const t of trainings) {
      const training = await db.training.create({ data: { ...t, companyId: company.id } })
      // Inscribe some employees
      const inscrits = employees.slice(0, 5)
      for (const emp of inscrits) {
        await db.trainingEnrollment.create({
          data: {
            trainingId: training.id,
            employeeId: emp.id,
            status: t.status === 'TERMINEE' ? 'COMPLETE' : 'CONFIRME',
          },
        })
      }
    }
    console.log(`  ✓ ${trainings.length} formations créées (avec inscriptions)`)
  } else {
    console.log(`  ⊘ ${existingTrain} formations existent déjà`)
  }

  // === Skills ===
  const existingSkills = await db.skill.count({ where: { companyId: company.id } })
  if (existingSkills === 0) {
    const skills = [
      { name: 'JavaScript / TypeScript', category: 'TECHNIQUE', description: 'Programmation frontend et backend' },
      { name: 'React / Next.js', category: 'TECHNIQUE', description: 'Développement frontend React' },
      { name: 'Node.js / Express', category: 'TECHNIQUE', description: 'Backend JavaScript' },
      { name: 'PostgreSQL / Prisma', category: 'TECHNIQUE', description: 'Base de données relationnelle' },
      { name: 'Comptabilité Guinée', category: 'TECHNIQUE', description: 'Plan comptable OHADA, CNSS, ITS' },
      { name: 'Management d\'équipe', category: 'MANAGEMENT', description: 'Leadership, délégation, feedback' },
      { name: 'Communication', category: 'SOFT', description: 'Communication interpersonnelle' },
      { name: 'Anglais', category: 'LANGUE', description: 'Anglais professionnel' },
      { name: 'Français', category: 'LANGUE', description: 'Langue maternelle' },
      { name: 'Excel avancé', category: 'TECHNIQUE', description: 'Tableaux croisés, macros, Power Query' },
    ]
    const createdSkills = []
    for (const s of skills) {
      const skill = await db.skill.create({ data: { ...s, companyId: company.id } })
      createdSkills.push(skill)
    }

    // Skill assessments for each employee
    for (const emp of employees) {
      // Each employee gets 3-5 random skill assessments
      const nbSkills = 3 + Math.floor(Math.random() * 3)
      const shuffled = [...createdSkills].sort(() => Math.random() - 0.5).slice(0, nbSkills)
      for (const skill of shuffled) {
        await db.skillAssessment.create({
          data: {
            skillId: skill.id,
            employeeId: emp.id,
            level: 1 + Math.floor(Math.random() * 5), // 1-5
            targetLevel: 3 + Math.floor(Math.random() * 3), // 3-5
          },
        })
      }
    }
    console.log(`  ✓ ${skills.length} compétences créées (avec évaluations par employé)`)
  } else {
    console.log(`  ⊘ ${existingSkills} compétences existent déjà`)
  }

  // === Evaluations ===
  const existingEval = await db.evaluation.count()
  if (existingEval === 0) {
    for (const emp of employees) {
      await db.evaluation.create({
        data: {
          employeeId: emp.id,
          period: '2026-S1',
          type: 'SEMESTRIELLE',
          globalRating: 2 + Math.floor(Math.random() * 4), // 2-5
          strengths: 'Autonomie, fiabilité, bon esprit d\'équipe',
          improvements: 'Peut progresser en communication transversale et prise d\'initiative',
          goals: 'Objectifs S2: monter en compétence sur les nouveaux outils, prendre leadership sur projet',
          managerNotes: 'Bon semestre, employé engagé. À soutenir dans le développement de carrière.',
          employeeNotes: 'Satisfait du semestre, souhaite plus de responsabilités',
          status: 'TERMINE',
          evaluatorId: 'admin@datasphere.gn',
          evaluatedAt: new Date('2026-07-01'),
        },
      })
    }
    console.log(`  ✓ ${employees.length} évaluations créées`)
  } else {
    console.log(`  ⊘ ${existingEval} évaluations existent déjà`)
  }

  // === Objectives ===
  const existingObj = await db.objective.count()
  if (existingObj === 0) {
    const objectivesByPoste = [
      { poste: 'Directeur Général', objectives: [
        { title: 'Croissance CA 2026', description: 'Atteindre +15% de chiffre d\'affaires vs 2025', type: 'COMPANY', progress: 68, dueDate: '2026-12-31', weight: 5 },
        { title: 'Certification ISO 9001', description: 'Obtenir la certification qualité', type: 'COMPANY', progress: 45, dueDate: '2026-10-30', weight: 4 },
      ]},
      { poste: 'DRH', objectives: [
        { title: 'Réduction turnover', description: 'Ramener le turnover sous 10%', type: 'COMPANY', progress: 75, dueDate: '2026-12-31', weight: 4 },
        { title: 'Mise en place entretiens annuels', description: '100% des employés évalués', type: 'INDIVIDUAL', progress: 100, dueDate: '2026-07-31', weight: 3, status: 'ATTEINT' },
      ]},
      { poste: 'Comptable', objectives: [
        { title: 'Zéro retard déclaration CNSS', description: 'Toutes les déclarations à jour', type: 'INDIVIDUAL', progress: 100, dueDate: '2026-12-31', weight: 4, status: 'ATTEINT' },
        { title: 'Automatisation reporting mensuel', description: 'Mettre en place reporting automatique', type: 'INDIVIDUAL', progress: 60, dueDate: '2026-09-30', weight: 3 },
      ]},
      { poste: 'Responsable IT', objectives: [
        { title: 'Migration cloud', description: 'Migrer l\'infrastructure vers le cloud', type: 'INDIVIDUAL', progress: 40, dueDate: '2026-12-31', weight: 5 },
        { title: 'Sécurisation SI', description: 'Audit sécurité + plan d\'action', type: 'INDIVIDUAL', progress: 80, dueDate: '2026-08-31', weight: 4 },
      ]},
    ]

    for (const emp of employees) {
      const objForPoste = objectivesByPoste.find(o => emp.poste?.includes(o.poste.split(' ')[0]))
      if (objForPoste) {
        for (const obj of objForPoste.objectives) {
          await db.objective.create({
            data: {
              employeeId: emp.id,
              title: obj.title,
              description: obj.description,
              type: obj.type || 'INDIVIDUAL',
              status: obj.status || 'EN_COURS',
              progress: obj.progress,
              dueDate: obj.dueDate,
              weight: obj.weight,
            },
          })
        }
      } else {
        // Default objective for other employees
        await db.objective.create({
          data: {
            employeeId: emp.id,
            title: 'Objectifs semestre 2',
            description: 'Atteindre les KPIs définis en entretien annuel',
            type: 'INDIVIDUAL',
            status: 'EN_COURS',
            progress: 20 + Math.floor(Math.random() * 60),
            dueDate: '2026-12-31',
            weight: 3,
          },
        })
      }
    }
    console.log(`  ✓ Objectifs créés pour ${employees.length} employés`)
  } else {
    console.log(`  ⊘ ${existingObj} objectifs existent déjà`)
  }

  // === Final stats ===
  console.log('\n📊 État final :')
  console.log(`   Offres d'emploi : ${await db.jobOffer.count()}`)
  console.log(`   Candidats : ${await db.candidate.count()}`)
  console.log(`   Formations : ${await db.training.count()}`)
  console.log(`   Inscriptions formation : ${await db.trainingEnrollment.count()}`)
  console.log(`   Compétences : ${await db.skill.count()}`)
  console.log(`   Évaluations compétences : ${await db.skillAssessment.count()}`)
  console.log(`   Évaluations annuelles : ${await db.evaluation.count()}`)
  console.log(`   Objectifs : ${await db.objective.count()}`)
  console.log('\n✅ Enrichissement terminé !')
}

main().catch(e => { console.error('Erreur:', e); process.exit(1) }).finally(() => db.$disconnect())
