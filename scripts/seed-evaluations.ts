import { db } from '@/lib/db'

async function seedEvaluations() {
  const employees = await db.employee.findMany({ take: 5 })

  const objectives = [
    { employeeIdx: 0, title: 'Augmenter le chiffre d\'affaires de 25%', type: 'COMPANY', status: 'EN_COURS', progress: 65, weight: 5, dueDate: '2026-12-31' },
    { employeeIdx: 0, title: 'Mettre en place la nouvelle stratégie digitale', type: 'INDIVIDUAL', status: 'ATTEINT', progress: 100, weight: 4 },
    { employeeIdx: 1, title: 'Réduire le turn-over de 50%', type: 'INDIVIDUAL', status: 'EN_COURS', progress: 40, weight: 4, dueDate: '2026-12-31' },
    { employeeIdx: 1, title: 'Digitaliser 100% du processus RH', type: 'TEAM', status: 'PARTIEL', progress: 75, weight: 3 },
    { employeeIdx: 2, title: 'Livrer le projet mobile en Q4', type: 'INDIVIDUAL', status: 'EN_COURS', progress: 30, weight: 4, dueDate: '2026-12-15' },
    { employeeIdx: 3, title: 'Clôturer les comptes sous 5 jours', type: 'INDIVIDUAL', status: 'ATTEINT', progress: 100, weight: 3 },
    { employeeIdx: 4, title: 'Compléter la formation RH', type: 'INDIVIDUAL', status: 'EN_COURS', progress: 50, weight: 2, dueDate: '2026-09-30' },
  ]

  for (const obj of objectives) {
    const employee = employees[obj.employeeIdx]
    if (!employee) continue

    const existing = await db.objective.findFirst({
      where: { employeeId: employee.id, title: obj.title },
    })
    if (existing) {
      console.log(`  ⏭️  Objectif "${obj.title}" existe déjà`)
      continue
    }
    await db.objective.create({
      data: {
        employeeId: employee.id,
        title: obj.title,
        type: obj.type,
        status: obj.status,
        progress: obj.progress,
        weight: obj.weight,
        dueDate: obj.dueDate || null,
      },
    })
    console.log(`  ✅ Objectif "${obj.title}" créé`)
  }

  // Évaluations
  const evals = [
    {
      employeeIdx: 0,
      period: '2026-S1',
      type: 'SEMESTRIELLE',
      globalRating: 5,
      strengths: 'Excellente leadership, vision stratégique claire, capable de fédérer les équipes autour d\'objectifs ambitieux.',
      improvements: 'Pourrait déléguer davantage les tâches opérationnelles pour se concentrer sur la stratégie.',
      goals: 'Poursuivre la digitalisation et développer le mentorat des jeunes cadres.',
      managerNotes: 'Mamadou est un atout majeur de l\'entreprise. À encourager dans la voie du mentorat.',
    },
    {
      employeeIdx: 1,
      period: '2026-S1',
      type: 'SEMESTRIELLE',
      globalRating: 4,
      strengths: 'Très organisée, excellente communication, mise en place des nouveaux processus RH avec succès.',
      improvements: 'Gagner en assurance sur les sujets stratégiques, oser prendre des décisions plus rapidement.',
      goals: 'Finaliser la digitalisation RH complète et former l\'équipe aux nouveaux outils.',
      managerNotes: 'Aïssatou a progressé significativement ce semestre. Continuer à lui donner des responsabilités.',
    },
    {
      employeeIdx: 3,
      period: '2026-annual',
      type: 'ANNUELLE',
      globalRating: 4,
      strengths: 'Rigueur comptable exemplaire, fiabilité, respect des délais.',
      improvements: 'Moderniser les pratiques, s\'approprier les nouveaux outils numériques.',
      goals: 'Formation Excel avancé et automatisation des reports comptables.',
      managerNotes: 'Fatoumata est la mémoire comptable de l\'entreprise. Précieuse.',
    },
  ]

  for (const ev of evals) {
    const employee = employees[ev.employeeIdx]
    if (!employee) continue

    const existing = await db.evaluation.findFirst({
      where: { employeeId: employee.id, period: ev.period },
    })
    if (existing) {
      console.log(`  ⏭️  Évaluation ${ev.period} pour ${employee.nom} existe déjà`)
      continue
    }
    await db.evaluation.create({
      data: {
        employeeId: employee.id,
        period: ev.period,
        type: ev.type,
        globalRating: ev.globalRating,
        strengths: ev.strengths,
        improvements: ev.improvements,
        goals: ev.goals,
        managerNotes: ev.managerNotes,
        evaluatorId: 'manager@demo.gn',
        status: 'TERMINE',
        evaluatedAt: new Date(),
      },
    })
    console.log(`  ✅ Évaluation ${ev.period} créée pour ${employee.nom} (note: ${ev.globalRating}/5)`)
  }

  // Notifications démo
  const company = await db.company.findFirst()
  if (company) {
    const notifs = [
      { recipient: 'mamadou.diallo@demo.gn', channel: 'EMAIL', subject: 'Votre bulletin de paie de Juin 2026', message: 'Bonjour Mamadou,\n\nVotre bulletin de paie pour la période de Juin 2026 est disponible sur votre portail employé.\n\nCordialement,\nRH Demo SARL', type: 'PAIE', status: 'ENVOYE' },
      { recipient: '+224 622 000 002', channel: 'WHATSAPP', subject: null, message: 'Bonjour Aïssatou, votre demande de congé du 15/07 au 25/07 a été APPROUVÉE. Bon congé !', type: 'CONGE', status: 'ENVOYE' },
      { recipient: '+224 622 000 003', channel: 'SMS', subject: null, message: '🔔 Paie de Juin 2026 traitée. Consultez votre bulletin sur le portail.', type: 'PAIE', status: 'ENVOYE' },
      { recipient: 'all@demo.gn', channel: 'EMAIL', subject: 'Rappel : déclaration CNSS trimestrielle Q2 2026', message: 'Bonjour à toutes et tous,\n\nLa déclaration CNSS du trimestre Q2 2026 doit être soumise avant le 15 juillet 2026.\n\nMerci de préparer les éléments nécessaires.\n\nService RH', type: 'ALERTE', status: 'ENVOYE' },
    ]

    for (const n of notifs) {
      const existing = await db.notification.findFirst({
        where: { companyId: company.id, recipient: n.recipient, message: n.message },
      })
      if (existing) {
        console.log(`  ⏭️  Notification à ${n.recipient} existe déjà`)
        continue
      }
      await db.notification.create({
        data: {
          companyId: company.id,
          ...n,
          sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      })
      console.log(`  📧 Notification ${n.channel} envoyée à ${n.recipient}`)
    }
  }

  console.log('\n✅ Seed évaluations + objectifs + notifications terminé')
}

seedEvaluations()
  .then(() => db.$disconnect())
  .catch(e => { console.error(e); db.$disconnect() })
