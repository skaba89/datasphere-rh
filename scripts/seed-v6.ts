import { db } from '@/lib/db'

async function seedV6() {
  const employees = await db.employee.findMany({ take: 8 })
  const company = await db.company.findFirst()

  // Time entries (7 derniers jours pour 5 employés)
  const today = new Date()
  const timeEntries = []
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date(today)
    d.setDate(d.getDate() - dayOffset)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOfWeek = d.getDay()
    if (dayOfWeek === 0) continue // skip dimanche

    for (let i = 0; i < Math.min(5, employees.length); i++) {
      const emp = employees[i]
      const isAbsent = Math.random() < 0.1
      const isLate = Math.random() < 0.15
      const checkIn = isAbsent ? null : isLate ? '09:15' : '08:00'
      const checkOut = isAbsent ? null : Math.random() < 0.3 ? '18:30' : '17:00'

      const existing = await db.timeEntry.findFirst({
        where: { employeeId: emp.id, date: dateStr },
      })
      if (existing) continue

      timeEntries.push({
        employeeId: emp.id,
        date: dateStr,
        checkIn,
        checkOut,
        breakMinutes: 60,
        status: isAbsent ? 'ABSENT' : isLate ? 'RETARD' : 'PRESENT',
        location: 'Bureau Conakry',
      })
    }
  }

  for (const te of timeEntries) {
    let workedMinutes = 0
    let overtimeMinutes = 0
    if (te.checkIn && te.checkOut) {
      const [inH, inM] = te.checkIn.split(':').map(Number)
      const [outH, outM] = te.checkOut.split(':').map(Number)
      const totalMin = (outH * 60 + outM) - (inH * 60 + inM)
      workedMinutes = Math.max(0, totalMin - 60)
      overtimeMinutes = Math.max(0, workedMinutes - 480)
    }
    await db.timeEntry.create({
      data: { ...te, workedMinutes, overtimeMinutes },
    })
  }
  console.log(`  ✅ ${timeEntries.length} pointages créés`)

  // Formations
  if (company) {
    const trainings = [
      {
        title: 'Gestion de projet avancée',
        description: 'Formation certifiante PMP sur les méthodes Agile, Scrum et Kanban. Pour chefs de projet et futurs managers.',
        category: 'MANAGEMENT',
        duration: 24,
        format: 'PRESENTIEL',
        startDate: '2026-08-15',
        endDate: '2026-08-17',
        trainer: 'Cabinet Afrique Formation',
        location: 'Hôtel Kaloum, Conakry',
        maxParticipants: 15,
        status: 'PLANIFIEE',
      },
      {
        title: 'Sécurité informatique - Niveau 1',
        description: 'Bonnes pratiques de cybersécurité en entreprise. Phishing, mots de passe, RGPD.',
        category: 'SECURITE',
        duration: 8,
        format: 'EN_LIGNE',
        startDate: '2026-07-20',
        endDate: '2026-07-20',
        trainer: 'Ousmane Bah',
        location: 'Plateforme Zoom',
        maxParticipants: 30,
        status: 'EN_COURS',
      },
      {
        title: 'Paie guinéenne et CNSS',
        description: 'Maîtriser le calcul de la paie conforme à la législation guinéenne : CNSS, RTS, versement forfaitaire.',
        category: 'RH',
        duration: 16,
        format: 'MIXTE',
        startDate: '2026-06-10',
        endDate: '2026-06-11',
        trainer: 'Fatoumata Touré',
        location: 'Salle de formation Demo SARL',
        maxParticipants: 10,
        status: 'TERMINEE',
      },
      {
        title: 'Anglais professionnel B2',
        description: 'Amélioration de l\'anglais professionnel pour communication internationale. Niveau B2 ciblé.',
        category: 'LANGUES',
        duration: 40,
        format: 'EN_LIGNE',
        startDate: '2026-09-01',
        endDate: '2026-12-15',
        trainer: 'British Council Guinée',
        location: 'Plateforme British Council',
        maxParticipants: 20,
        status: 'PLANIFIEE',
      },
    ]

    for (const t of trainings) {
      const existing = await db.training.findFirst({ where: { companyId: company.id, title: t.title } })
      if (existing) {
        console.log(`  ⏭️  Formation "${t.title}" existe déjà`)
        continue
      }
      const training = await db.training.create({ data: { ...t, companyId: company.id } })

      // Inscrire quelques employés
      const numEnroll = Math.min(3, employees.length)
      for (let i = 0; i < numEnroll; i++) {
        const emp = employees[i]
        const existingEnr = await db.trainingEnrollment.findFirst({
          where: { trainingId: training.id, employeeId: emp.id },
        })
        if (existingEnr) continue

        await db.trainingEnrollment.create({
          data: {
            trainingId: training.id,
            employeeId: emp.id,
            status: t.status === 'TERMINEE' ? 'COMPLETE' : 'CONFIRME',
            progress: t.status === 'TERMINEE' ? 100 : t.status === 'EN_COURS' ? 45 : 0,
            completedAt: t.status === 'TERMINEE' ? new Date() : null,
          },
        })
      }
      console.log(`  ✅ Formation "${t.title}" créée avec ${numEnroll} inscrits`)
    }
  }

  // Signatures électroniques
  const signatures = [
    {
      employeeId: employees[0]?.id,
      signerName: 'Admin Demo',
      signerRole: 'ADMIN',
      documentType: 'CONTRAT',
      documentTitle: 'Contrat CDI - Diallo Mamadou (2020)',
      documentContent: 'CONTRAT DE TRAVAIL CDI entre Demo SARL et Diallo Mamadou, poste Directeur Technique, salaire 5 000 000 GNF, date embauche 15/03/2020.',
    },
    {
      employeeId: employees[1]?.id,
      signerName: 'Aïssatou Camara',
      signerRole: 'EMPLOYE',
      documentType: 'BULLETIN',
      documentTitle: 'Bulletin de paie - Camara Aïssatou - Juin 2026',
      documentContent: 'BULLETIN DE PAIE Juin 2026 - Camara Aïssatou - Salaire brut 3 500 000 GNF - Net 2 975 000 GNF.',
    },
    {
      employeeId: employees[3]?.id,
      signerName: 'Fatoumata Touré',
      signerRole: 'RH',
      documentType: 'ATTESTATION',
      documentTitle: 'Attestation d\'employeur - Touré Fatoumata',
      documentContent: 'ATTESTATION D\'EMPLOYEUR - Fatoumata Touré, employée depuis le 01/09/2019 au poste de Comptable chez Demo SARL.',
    },
  ]

  const crypto = require('crypto')
  for (const s of signatures) {
    const existing = await db.signature.findFirst({ where: { documentTitle: s.documentTitle } })
    if (existing) {
      console.log(`  ⏭️  Signature "${s.documentTitle}" existe déjà`)
      continue
    }
    const documentHash = crypto.createHash('sha256').update(s.documentContent).digest('hex')
    const qrToken = crypto.randomBytes(16).toString('hex')
    await db.signature.create({
      data: {
        employeeId: s.employeeId || null,
        signerName: s.signerName,
        signerRole: s.signerRole,
        documentType: s.documentType,
        documentTitle: s.documentTitle,
        documentHash,
        qrToken,
      },
    })
    console.log(`  ✅ Signature "${s.documentTitle}" créée (token: ${qrToken.slice(0, 8)}...)`)
  }

  console.log('\n✅ Seed v0.6 terminé : pointages + formations + signatures')
}

seedV6()
  .then(() => db.$disconnect())
  .catch(e => { console.error(e); db.$disconnect() })
