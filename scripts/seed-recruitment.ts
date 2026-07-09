import { db } from '@/lib/db'

async function seedRecruitment() {
  const company = await db.company.findFirst({ where: { raisonSociale: 'Demo SARL' } })
  if (!company) {
    console.error('Demo SARL non trouvée')
    process.exit(1)
  }

  const candidates = [
    { firstName: 'Aïcha', lastName: 'Diakité', positionApplied: 'Responsable Marketing', source: 'LINKEDIN', expectedSalary: 3500000, rating: 4, status: 'NOUVEAU', email: 'aicha.diakite@email.com', phone: '+224 622 111 222', notes: '5 ans d\'expérience en marketing digital' },
    { firstName: 'Mamadou', lastName: 'Sow', positionApplied: 'Comptable Senior', source: 'REFERRAL', expectedSalary: 4000000, rating: 5, status: 'EN_ENTRETIEN', email: 'mamadou.sow@email.com', phone: '+224 622 333 444', notes: 'Très bon profil, recommandé par le DAF' },
    { firstName: 'Fatou', lastName: 'Cissé', positionApplied: 'Développeuse Full-Stack', source: 'PORTAIL', expectedSalary: 4500000, rating: 4, status: 'EN_ENTRETIEN', email: 'fatou.cisse@email.com', phone: '+224 622 555 666', notes: 'React + Node.js, disponible immédiatement' },
    { firstName: 'Ibrahima', lastName: 'Diallo', positionApplied: 'Chef de Projet', source: 'CABINET', expectedSalary: 5500000, rating: 5, status: 'OFFRE', email: 'ibrahima.diallo@email.com', phone: '+224 622 777 888', notes: 'Offre envoyée, en attente de réponse' },
    { firstName: 'Mariama', lastName: 'Bah', positionApplied: 'Assistante RH', source: 'PORTAIL', expectedSalary: 1800000, rating: 3, status: 'NOUVEAU', email: 'mariama.bah@email.com', phone: '+224 622 999 000', notes: 'Jeune diplômée motivée' },
    { firstName: 'Ousmane', lastName: 'Camara', positionApplied: 'Commercial B2B', source: 'LINKEDIN', expectedSalary: 2800000, rating: 4, status: 'ACCEPTE', email: 'ousmane.camara@email.com', phone: '+224 622 222 333', notes: 'A accepté l\'offre — début le 1er août' },
    { firstName: 'Kadiatou', lastName: 'Touré', positionApplied: 'Infirmière', source: 'REFERRAL', expectedSalary: 2200000, rating: 3, status: 'REFUSE', email: 'kadiatou.toure@email.com', phone: '+224 622 444 555', notes: 'A refusé pour raisons personnelles' },
  ]

  for (const c of candidates) {
    const existing = await db.candidate.findFirst({
      where: { firstName: c.firstName, lastName: c.lastName, companyId: company.id },
    })
    if (existing) {
      console.log(`  ⏭️  ${c.firstName} ${c.lastName} existe déjà`)
      continue
    }
    await db.candidate.create({ data: { ...c, companyId: company.id, availability: 'Immédiate' } })
    console.log(`  ✅ ${c.firstName} ${c.lastName} ajouté (${c.status})`)
  }

  // Documents démo
  const employee = await db.employee.findFirst({ where: { matricule: 'DS-001' } })
  if (employee) {
    const docs = [
      { name: 'Contrat CDI - Diallo Mamadou 2020.pdf', type: 'CONTRAT', category: 'RH', confidential: false, retentionYears: 10 },
      { name: 'CV - Diallo Mamadou.pdf', type: 'CV', category: 'RH', confidential: false, retentionYears: 5 },
      { name: 'Carte CNSS - Diallo Mamadou.pdf', type: 'CNSS_CARTE', category: 'ADMIN', confidential: true, retentionYears: 10 },
      { name: 'Pièce d\'identité - Diallo Mamadou.pdf', type: 'PIECE_IDENTITE', category: 'ADMIN', confidential: true, retentionYears: 10 },
      { name: 'Attestation de diplôme.pdf', type: 'DIPLOME', category: 'RH', confidential: false, retentionYears: 10 },
    ]
    for (const d of docs) {
      const existing = await db.document.findFirst({ where: { name: d.name, companyId: company.id } })
      if (existing) {
        console.log(`  ⏭️  Document ${d.name} existe déjà`)
        continue
      }
      await db.document.create({
        data: {
          ...d,
          companyId: company.id,
          employeeId: employee.id,
          fileKey: `documents/${company.id}/${d.name}`,
          fileSize: Math.floor(Math.random() * 500000) + 100000,
          mimeType: 'application/pdf',
          uploadedBy: 'rh@demo.gn',
          signedAt: d.type === 'CONTRAT' ? new Date() : null,
        },
      })
      console.log(`  📄 Document ${d.name} archivé`)
    }
  }

  console.log('\n✅ Seed recrutement + documents terminé')
}

seedRecruitment()
  .then(() => db.$disconnect())
  .catch(e => { console.error(e); db.$disconnect() })
