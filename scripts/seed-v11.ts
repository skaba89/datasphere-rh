import { db } from '@/lib/db'

async function seedV11() {
  const company = await db.company.findFirst()
  if (!company) { console.error('Company not found'); process.exit(1) }
  const employees = await db.employee.findMany()

  // Health records
  const healthRecords = [
    { emp: 0, type: 'VISITE_MEDICALE', date: '2026-01-15', nextDate: '2027-01-15', status: 'REALISE', provider: 'Clinique Pasteur Conakry', result: 'Apte sans restrictions', notes: 'Bilan complet, tension normale' },
    { emp: 1, type: 'VISITE_MEDICALE', date: '2026-02-01', nextDate: '2027-02-01', status: 'REALISE', provider: 'Clinique Ambroise Paré', result: 'Apte avec restrictions : pas de port de charges >10kg', notes: 'Grossesse - aménagement poste' },
    { emp: 2, type: 'VACCINATION', date: '2026-03-10', nextDate: '2026-09-10', status: 'REALISE', provider: 'Centre de vaccination Conakry', result: 'Vaccin grippe saisonnière administré' },
    { emp: 3, type: 'VISITE_MEDICALE', date: '2026-06-01', nextDate: '2026-12-01', status: 'REALISE', provider: 'Clinique Pasteur', result: 'Apte' },
    { emp: 4, type: 'VISITE_MEDICALE', date: '2026-07-15', status: 'PLANIFIE', provider: 'Clinique Pasteur', notes: 'Visite initiale stagiaire' },
    { emp: 5, type: 'ERGONOMIE', date: '2026-05-20', status: 'REALISE', provider: 'Cabinet Ergo GN', result: 'Poste conforme, recommandation écran anti-reflets' },
    { emp: 6, type: 'BILAN_SANTE', date: '2026-04-01', nextDate: '2027-04-01', status: 'REALISE', provider: 'Clinique Ambroise Paré', result: 'Bilan satisfaisant, cholestérol à surveiller' },
    { emp: 1, type: 'VACCINATION', date: '2026-06-15', status: 'PLANIFIE', provider: 'Centre vaccination', notes: 'Rappel DTP' },
  ]

  for (const hr of healthRecords) {
    const emp = employees[hr.emp]
    if (!emp) continue
    const existing = await db.healthRecord.findFirst({ where: { companyId: company.id, employeeId: emp.id, type: hr.type, date: hr.date } })
    if (existing) { console.log(`  ⏭️  Health ${emp.nom} ${hr.type}`); continue }
    await db.healthRecord.create({ data: { companyId: company.id, employeeId: emp.id, type: hr.type, date: hr.date, nextDate: hr.nextDate || null, status: hr.status, provider: hr.provider || null, result: hr.result || null, notes: hr.notes || null } })
    console.log(`  ✅ Health ${emp.nom} ${hr.type} (${hr.status})`)
  }

  // Feedback 360
  const feedbacks = [
    { emp: 0, period: '2026-S1', responses: [
      { evaluatorName: 'DG', evaluatorRole: 'MANAGER', rating: 5, strengths: 'Leadership exceptionnel, vision claire', improvements: 'Déléguer davantage l\'opérationnel' },
      { evaluatorName: 'Aïssatou Camara', evaluatorRole: 'PAIR', rating: 4, strengths: 'Excellent communicant', improvements: 'Parfois trop direct' },
      { evaluatorName: 'Fatoumata Touré', evaluatorRole: 'SUBORDONNE', rating: 5, strengths: 'Bienveillant, à l\'écoute', improvements: 'Rien à signaler' },
      { evaluatorName: 'Mamadou Diallo', evaluatorRole: 'SELF', rating: 4, strengths: 'Vision stratégique', improvements: 'Améliorer équilibre pro/perso' },
    ]},
    { emp: 1, period: '2026-S1', responses: [
      { evaluatorName: 'Mamadou Diallo', evaluatorRole: 'MANAGER', rating: 4, strengths: 'Organisée, proactive', improvements: 'Gagner en assurance' },
      { evaluatorName: 'Fatoumata Touré', evaluatorRole: 'PAIR', rating: 4, strengths: 'Excellente collaboratrice', improvements: 'Prendre plus d' + 'initiatives' },
      { evaluatorName: 'Aïssatou Camara', evaluatorRole: 'SELF', rating: 3, strengths: 'Sens de l\'organisation', improvements: 'Développer leadership' },
    ]},
  ]

  for (const fb of feedbacks) {
    const emp = employees[fb.emp]
    if (!emp) continue
    const existing = await db.feedback360.findFirst({ where: { companyId: company.id, employeeId: emp.id, period: fb.period } })
    if (existing) { console.log(`  ⏭️  Feedback360 ${emp.nom} ${fb.period}`); continue }
    const feedback = await db.feedback360.create({ data: { companyId: company.id, employeeId: emp.id, period: fb.period, status: 'CLOTURE' } })
    for (const resp of fb.responses) {
      await db.feedbackResponse.create({ data: { feedbackId: feedback.id, ...resp } })
    }
    console.log(`  ✅ Feedback360 ${emp.nom} ${fb.period} (${fb.responses.length} réponses)`)
  }

  // Announcements
  const announcements = [
    { title: 'Nouvelle politique de télétravail', content: 'À partir du 1er septembre 2026, le télétravail est autorisé 2 jours par semaine pour tous les employés éligibles. Veuillez consulter la nouvelle politique dans le module Documents.', category: 'POLICY', priority: 'NORMAL', pinned: true, authorName: 'RH', expiresAt: '2026-09-30' },
    { title: 'URGENT : Maintenance plateforme ce samedi', content: 'Une maintenance de la plateforme DataSphere RH est prévue ce samedi 12 juillet de 8h à 12h. L\'application sera indisponible pendant cette période. Merci de planifier vos tâches en conséquence.', category: 'ALERT', priority: 'URGENT', pinned: true, authorName: 'IT' },
    { title: 'Fête de l\'Indépendance - 2 octobre', content: 'L\'entreprise sera fermée le 2 octobre 2026 pour la fête de l\'Indépendance. Joyeuse fête à tous !', category: 'EVENT', priority: 'NORMAL', authorName: 'RH' },
    { title: 'Résultats enquête satisfaction Q2', content: 'NPS employé Q2 2026 : +12. Merci à tous pour votre participation. Les actions d\'amélioration sont en cours de définition.', category: 'INFO', priority: 'NORMAL', authorName: 'Direction' },
    { title: 'Nouveau partenariat formation', content: 'Un nouveau partenariat avec le Cabinet Formation Conakry nous donne accès à 50+ formations à tarifs préférentiels. Consultez le catalogue dans le module Formation.', category: 'INFO', priority: 'LOW', authorName: 'RH' },
  ]

  for (const ann of announcements) {
    const existing = await db.announcement.findFirst({ where: { companyId: company.id, title: ann.title } })
    if (existing) { console.log(`  ⏭️  Announcement "${ann.title}"`); continue }
    await db.announcement.create({ data: { companyId: company.id, ...ann } })
    console.log(`  ✅ Announcement "${ann.title}"`)
  }

  // Helpdesk tickets
  const tickets = [
    { employeeName: 'Aïssatou Camara', subject: 'Erreur sur mon bulletin de juin', description: 'Mon bulletin de paie de juin indique un salaire de base incorrect. Il devrait être de 3 500 000 GNF mais affiche 3 200 000 GNF.', category: 'PAIE', priority: 'URGENT', status: 'OUVERT' },
    { employeeName: 'Ousmane Bah', subject: 'Impossible de demander un congé', description: 'Le bouton "Nouvelle demande" dans le module Congés ne répond pas.', category: 'TECHNIQUE', priority: 'NORMAL', status: 'EN_COURS', assignedTo: 'IT', response: 'Nous investiguons le problème. En attendant, vous pouvez envoyer votre demande par email.' },
    { employeeName: 'Fatoumata Touré', subject: 'Question sur les heures supplémentaires', description: 'Comment sont calculées les majorations pour les heures de nuit ?', category: 'RH', priority: 'NORMAL', status: 'RESOLU', assignedTo: 'RH', response: 'Les heures de nuit (22h-6h) sont majorées de 50%. Cette majoration est cumulable avec celle du dimanche (75%) et des jours fériés (100%).' },
    { employeeName: 'Mariama Conté', subject: 'Demande de copie de contrat', description: 'J\'ai besoin d\'une copie de mon contrat de travail pour une démarche bancaire.', category: 'CONTRAT', priority: 'NORMAL', status: 'RESOLU', assignedTo: 'RH', response: 'Votre contrat a été envoyé par email. Vous pouvez aussi le télécharger depuis le Portail employé > Documents.' },
    { employeeName: 'Lamine Kaba', subject: 'Accès formation gestion de projet', description: 'Je souhaite m\'inscrire à la formation "Gestion de projet avancée" prévue en août.', category: 'RH', priority: 'LOW', status: 'OUVERT' },
  ]

  for (const t of tickets) {
    const existing = await db.helpdeskTicket.findFirst({ where: { companyId: company.id, subject: t.subject } })
    if (existing) { console.log(`  ⏭️  Ticket "${t.subject}"`); continue }
    await db.helpdeskTicket.create({ data: { companyId: company.id, ...t } })
    console.log(`  ✅ Ticket "${t.subject}" (${t.status})`)
  }

  console.log('\n✅ Seed v1.1 terminé : health + feedback360 + announcements + helpdesk')
}

seedV11().then(() => db.$disconnect()).catch(e => { console.error(e); db.$disconnect() })
