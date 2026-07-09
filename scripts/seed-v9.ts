import { db } from '@/lib/db'

async function seedV9() {
  const company = await db.company.findFirst()
  if (!company) { console.error('Company not found'); process.exit(1) }
  const employees = await db.employee.findMany()

  // Interviews
  const interviews = [
    { emp: 0, type: 'ANNUEL', scheduledAt: '2026-07-15T10:00', status: 'PLANIFIE', location: 'Bureau DG', conductedBy: 'DG', agenda: 'Bilan année, objectifs 2026, perspectives évolution', rating: 0 },
    { emp: 1, type: 'PROFESSIONNEL', scheduledAt: '2026-06-20T14:00', status: 'REALISE', location: 'Salle RH', conductedBy: 'RH', agenda: 'Aspirations professionnelles, formations souhaitées', minutes: 'Aïssatou souhaite évoluer vers un poste de DRH. Formation management recommandée.', rating: 5 },
    { emp: 2, type: 'RECALAGE', scheduledAt: '2026-06-25T09:00', status: 'REALISE', location: 'Bureau manager', conductedBy: 'Manager', agenda: 'Retards répétés, qualité livrables', minutes: 'Ousmane a conscience des retards. Plan d amélioration convenu sur 3 mois.', rating: 3 },
    { emp: 3, type: 'ANNUEL', scheduledAt: '2026-05-15T11:00', status: 'REALISE', location: 'Salle RH', conductedBy: 'RH', agenda: 'Évaluation annuelle, satisfaction poste', minutes: 'Fatoumata satisfaite. Souhaite formation Excel avancé.', rating: 4 },
    { emp: 4, type: 'PROFESSIONNEL', scheduledAt: '2026-07-20T10:00', status: 'PLANIFIE', location: 'Salle RH', conductedBy: 'RH', agenda: 'Fin de stage, perspectives embauche', rating: 0 },
  ]

  for (const iv of interviews) {
    const emp = employees[iv.emp]
    if (!emp) continue
    const existing = await db.interview.findFirst({ where: { companyId: company.id, employeeId: emp.id, type: iv.type, scheduledAt: new Date(iv.scheduledAt) } })
    if (existing) { console.log(`  ⏭️  Interview ${emp.nom} ${iv.type}`); continue }
    await db.interview.create({
      data: {
        companyId: company.id, employeeId: emp.id,
        type: iv.type, status: iv.status, scheduledAt: new Date(iv.scheduledAt),
        location: iv.location, conductedBy: iv.conductedBy, agenda: iv.agenda,
        minutes: iv.minutes || null, rating: iv.rating,
      },
    })
    console.log(`  ✅ Interview ${emp.nom} ${iv.type} (${iv.status})`)
  }

  // Career paths
  const careerPaths = [
    { emp: 1, currentRole: 'Responsable RH', targetRole: 'Directrice RH', timeline: '24 mois', readiness: 4, gaps: 'Management d équipe, stratégie RH globale', actions: 'Formation management DRH, mentorat par DG', mentor: 'DG' },
    { emp: 2, currentRole: 'Développeur Senior', targetRole: 'Lead Developer', timeline: '12 mois', readiness: 3, gaps: 'Architecture logicielle, leadership technique', actions: 'Formation architecture, encadrement junior', mentor: 'DT' },
    { emp: 6, currentRole: 'Manager Commercial', targetRole: 'Directeur Commercial', timeline: '36 mois', readiness: 3, gaps: 'Stratégie commerciale, gestion budget', actions: 'MBA commercial, pilotage équipe élargie', mentor: 'DG' },
    { emp: 3, currentRole: 'Comptable', targetRole: 'Responsable Finance', timeline: '24 mois', readiness: 4, gaps: 'Contrôle de gestion, reporting avancé', actions: 'Formation DSCG, prise en charge comptabilité analytique', mentor: 'DAF' },
  ]

  for (const cp of careerPaths) {
    const emp = employees[cp.emp]
    if (!emp) continue
    const existing = await db.careerPath.findFirst({ where: { companyId: company.id, employeeId: emp.id, targetRole: cp.targetRole } })
    if (existing) { console.log(`  ⏭️  Career ${emp.nom} → ${cp.targetRole}`); continue }
    await db.careerPath.create({
      data: {
        companyId: company.id, employeeId: emp.id,
        currentRole: cp.currentRole, targetRole: cp.targetRole,
        timeline: cp.timeline, readiness: cp.readiness,
        gaps: cp.gaps, actions: cp.actions, mentor: cp.mentor,
      },
    })
    console.log(`  ✅ Career ${emp.nom}: ${cp.currentRole} → ${cp.targetRole}`)
  }

  // Contractors
  const contractors = [
    { name: 'Cabinet Audit Plus GN', type: 'CONSULTANT', service: 'Audit financier annuel', contractStart: '2026-01-01', contractEnd: '2026-12-31', monthlyRate: 2500000, contactName: 'Mamadou Barry', contactEmail: 'barry@auditplus.gn', contactPhone: '+224 622 333 111', notes: 'Cabinet recommandé par le commissaire aux comptes' },
    { name: 'Digital Africa Solutions', type: 'PRESTATAIRE', service: 'Maintenance applicative plateforme RH', contractStart: '2026-03-01', monthlyRate: 3500000, contactName: 'Aïcha Diallo', contactEmail: 'aicha@dasafrica.com', contactPhone: '+224 622 444 222', notes: 'SLA 24h pour incidents critiques' },
    { name: 'Mamadou Sow (Freelance)', type: 'FREELANCE', service: 'Développement mobile React Native', contractStart: '2026-06-01', contractEnd: '2026-09-30', dailyRate: 250000, contactName: 'Mamadou Sow', contactEmail: 'msow.freelance@gmail.com', contactPhone: '+224 622 555 333', notes: 'Développement app mobile employé' },
    { name: 'Cabinet Formation Conakry', type: 'PRESTATAIRE', service: 'Formations RH et management', contractStart: '2026-01-01', contractEnd: '2026-12-31', dailyRate: 800000, contactName: 'Fatou Bérété', contactEmail: 'contact@formation-conakry.gn', contactPhone: '+224 622 666 444', notes: 'Catalogue de 50+ formations disponibles' },
    { name: 'Ibrahima Keïta (Stagiaire)', type: 'STAGIAIRE', service: 'Support IT niveau 1', contractStart: '2026-07-01', contractEnd: '2026-12-31', monthlyRate: 350000, contactName: 'Ibrahima Keïta', contactEmail: 'ibrahima.keita@demo.gn', contactPhone: '+224 622 777 555', notes: 'Stage fin d études, possibilité embauche' },
  ]

  for (const c of contractors) {
    const existing = await db.contractor.findFirst({ where: { companyId: company.id, name: c.name } })
    if (existing) { console.log(`  ⏭️  Contractor ${c.name}`); continue }
    await db.contractor.create({ data: { companyId: company.id, ...c, status: 'ACTIF' } })
    console.log(`  ✅ Contractor ${c.name} (${c.type})`)
  }

  console.log('\n✅ Seed v0.9 terminé : interviews + career paths + contractors')
}

seedV9().then(() => db.$disconnect()).catch(e => { console.error(e); db.$disconnect() })
