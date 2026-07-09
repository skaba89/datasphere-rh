import { db } from '@/lib/db'

async function seedMissing() {
  const company = await db.company.findFirst()
  if (!company) { console.error('Company not found'); process.exit(1) }
  const employees = await db.employee.findMany()

  // === BENEFITS ===
  const benefits = [
    { emp: 0, type: 'MUTUELLE', label: 'Mutuelle santé familiale', provider: 'ASKIA Santé', employeeContribution: 50000, employerContribution: 100000, startDate: '2024-01-01' },
    { emp: 1, type: 'MUTUELLE', label: 'Mutuelle santé individuelle', provider: 'ASKIA Santé', employeeContribution: 30000, employerContribution: 70000, startDate: '2024-06-01' },
    { emp: 0, type: 'TRANSPORT', label: 'Indemnité transport mensuelle', provider: null, employeeContribution: 0, employerContribution: 150000, startDate: '2024-01-01' },
    { emp: 2, type: 'TRANSPORT', label: 'Indemnité transport mensuelle', provider: null, employeeContribution: 0, employerContribution: 150000, startDate: '2024-01-15' },
    { emp: 3, type: 'REPAS', label: 'Tickets restaurant', provider: 'Sodexo Guinée', employeeContribution: 25000, employerContribution: 50000, startDate: '2024-03-01' },
    { emp: 0, type: 'RETRAITE', label: 'Plan épargne retraite complémentaire', provider: 'CNSS Guinée', employeeContribution: 100000, employerContribution: 100000, startDate: '2024-01-01' },
    { emp: 6, type: 'PREVOYANCE', label: 'Prévoyance décès/invalidité', provider: 'NSIA Assurance', employeeContribution: 15000, employerContribution: 35000, startDate: '2024-09-01' },
    { emp: 5, type: 'MUTUELLE', label: 'Mutuelle santé individuelle', provider: 'ASKIA Santé', employeeContribution: 30000, employerContribution: 70000, startDate: '2024-04-10' },
  ]
  for (const b of benefits) {
    const emp = employees[b.emp]; if (!emp) continue
    const existing = await db.benefit.findFirst({ where: { companyId: company.id, employeeId: emp.id, type: b.type, label: b.label } })
    if (existing) { console.log(`  ⏭️  Benefit ${b.label}`); continue }
    await db.benefit.create({ data: { companyId: company.id, employeeId: emp.id, type: b.type, label: b.label, provider: b.provider, employeeContribution: b.employeeContribution, employerContribution: b.employerContribution, startDate: b.startDate } })
    console.log(`  ✅ Benefit ${b.label}`)
  }

  // === LOANS ===
  const loans = [
    { emp: 2, type: 'AVANCE', amount: 500000, reason: 'Urgence médicale familiale', requestDate: '2026-07-01', status: 'EN_ATTENTE' },
    { emp: 4, type: 'AVANCE_SALAIRE', amount: 175000, reason: 'Avance sur salaire juillet', requestDate: '2026-07-03', status: 'APPROUVE', approvalDate: '2026-07-04', approvedBy: 'manager@demo.gn', monthlyDeduction: 175000, totalMonths: 1, remainingAmount: 175000 },
    { emp: 5, type: 'PRET', amount: 3000000, reason: 'Achat véhicule', requestDate: '2026-05-15', status: 'APPROUVE', approvalDate: '2026-05-18', approvedBy: 'dg@demo.gn', monthlyDeduction: 250000, totalMonths: 12, remainingAmount: 2000000 },
    { emp: 6, type: 'AVANCE', amount: 200000, reason: 'Frais scolaire enfants', requestDate: '2026-06-20', status: 'REFUSE', approvalDate: '2026-06-22', approvedBy: 'manager@demo.gn' },
    { emp: 1, type: 'PRET', amount: 1500000, reason: 'Travaux habitat', requestDate: '2026-07-02', status: 'EN_ATTENTE' },
  ]
  for (const l of loans) {
    const emp = employees[l.emp]; if (!emp) continue
    const existing = await db.loan.findFirst({ where: { companyId: company.id, employeeId: emp.id, amount: l.amount, requestDate: l.requestDate } })
    if (existing) { console.log(`  ⏭️  Loan ${l.amount}`); continue }
    await db.loan.create({ data: { companyId: company.id, employeeId: emp.id, type: l.type, amount: l.amount, reason: l.reason, requestDate: l.requestDate, status: l.status, approvalDate: l.approvalDate || null, approvedBy: l.approvedBy || null, monthlyDeduction: l.monthlyDeduction || null, totalMonths: l.totalMonths || null, remainingAmount: l.remainingAmount || null } })
    console.log(`  ✅ Loan ${l.type} ${l.amount} (${l.status})`)
  }

  // === SHIFTS ===
  const today = new Date()
  const shiftTypes = [
    { type: 'MATIN', startTime: '06:00', endTime: '14:00' },
    { type: 'APRES_MIDI', startTime: '14:00', endTime: '22:00' },
    { type: 'JOURNEE', startTime: '08:00', endTime: '17:00' },
  ]
  for (let d = 0; d < 5; d++) {
    const date = new Date(today); date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().slice(0, 10)
    if (date.getDay() === 0) continue
    for (let i = 0; i < 3; i++) {
      const emp = employees[i + 5]; if (!emp) continue
      const st = shiftTypes[i % 3]
      const existing = await db.shift.findFirst({ where: { companyId: company.id, employeeId: emp.id, date: dateStr } })
      if (existing) continue
      await db.shift.create({ data: { companyId: company.id, employeeId: emp.id, date: dateStr, startTime: st.startTime, endTime: st.endTime, type: st.type, location: 'Bureau Conakry' } })
    }
  }
  console.log(`  ✅ Shifts créés`)

  // === EQUIPMENT ===
  const equipment = [
    { name: 'Ordinateur portable Dell Latitude 5440', category: 'IT', serialNumber: 'DL5440-2024-001', brand: 'Dell', model: 'Latitude 5440', purchaseDate: '2024-03-15', purchasePrice: 4500000, condition: 'BON', status: 'ATTRIBUE' },
    { name: 'Ordinateur portable HP ProBook 450', category: 'IT', serialNumber: 'HP450-2024-002', brand: 'HP', model: 'ProBook 450 G10', purchaseDate: '2024-06-01', purchasePrice: 3800000, condition: 'NEUF', status: 'ATTRIBUE' },
    { name: 'MacBook Air M2', category: 'IT', serialNumber: 'MBA-M2-003', brand: 'Apple', model: 'MacBook Air M2', purchaseDate: '2024-09-01', purchasePrice: 6500000, condition: 'NEUF', status: 'ATTRIBUE' },
    { name: 'Imprimante HP LaserJet Pro', category: 'IT', serialNumber: 'HPLJ-004', brand: 'HP', model: 'LaserJet Pro M404', purchaseDate: '2023-11-20', purchasePrice: 850000, condition: 'BON', status: 'EN_STOCK' },
    { name: 'Toyota Hilux 2023', category: 'VEHICULE', serialNumber: 'TH-2023-GN-001', brand: 'Toyota', model: 'Hilux 2.4D', purchaseDate: '2023-01-10', purchasePrice: 85000000, condition: 'BON', status: 'ATTRIBUE' },
    { name: 'Bureau réglable hauteur', category: 'BUREAU', serialNumber: 'BUR-006', brand: 'IKEA', model: 'BEKANT', purchaseDate: '2024-02-01', purchasePrice: 1200000, condition: 'NEUF', status: 'ATTRIBUE' },
    { name: 'Chaise ergonomique', category: 'BUREAU', serialNumber: 'CH-007', brand: 'Herman Miller', model: 'Aeron', purchaseDate: '2024-01-15', purchasePrice: 3500000, condition: 'BON', status: 'ATTRIBUE' },
    { name: 'Projecteur Epson EB-X51', category: 'IT', serialNumber: 'EP-008', brand: 'Epson', model: 'EB-X51', purchaseDate: '2023-06-10', purchasePrice: 1500000, condition: 'USAGE', status: 'EN_REPARATION' },
    { name: 'Téléphone IP Cisco', category: 'IT', serialNumber: 'CISCO-009', brand: 'Cisco', model: 'SPA504G', purchaseDate: '2023-03-01', purchasePrice: 350000, condition: 'BON', status: 'EN_STOCK' },
  ]
  for (const e of equipment) {
    const existing = await db.equipment.findFirst({ where: { companyId: company.id, name: e.name } })
    if (existing) { console.log(`  ⏭️  Equipment ${e.name}`); continue }
    await db.equipment.create({ data: { companyId: company.id, ...e } })
    console.log(`  ✅ Equipment ${e.name}`)
  }

  // === PAYSLIPS (bulletins de paie) ===
  const months = [
    { mois: 6, annee: 2026, libelle: 'Juin 2026' },
    { mois: 5, annee: 2026, libelle: 'Mai 2026' },
    { mois: 4, annee: 2026, libelle: 'Avril 2026' },
  ]
  let payslipCount = 0
  for (const m of months) {
    for (const emp of employees) {
      const contract = await db.contract.findFirst({ where: { employeeId: emp.id }, orderBy: { createdAt: 'desc' } })
      if (!contract) continue
      const existing = await db.payslip.findFirst({ where: { employeeId: emp.id, mois: m.mois, annee: m.annee } })
      if (existing) continue
      const brut = contract.salaireBase
      const cnssSal = Math.min(brut, 4640000) * 0.05
      const rts = brut * 0.01
      const cnssEmp = Math.min(brut, 4640000) * 0.08
      const vf = brut * 0.04
      const taxeAppr = brut * 0.01
      const formPro = brut * 0.03
      const accTrav = brut * 0.02
      const net = brut - cnssSal - rts
      await db.payslip.create({
        data: {
          employeeId: emp.id, contractId: contract.id,
          mois: m.mois, annee: m.annee,
          salaireBase: brut, primes: 0, heuresSup: 0, avantagesNature: 0,
          salaireBrut: brut, salaireBrutImposable: brut,
          cnssSalarie: cnssSal, cnssEmployeur: cnssEmp, rts,
          versementForfaitaire: vf, taxeApprentissage: taxeAppr, formationPro: formPro,
          netAPayer: net,
        },
      })
      payslipCount++
    }
  }
  console.log(`  ✅ ${payslipCount} bulletins de paie créés`)

  console.log('\n✅ Seed manquant terminé : benefits + loans + shifts + equipment + payslips')
}

seedMissing().then(() => db.$disconnect()).catch(e => { console.error(e); db.$disconnect() })
