import { db } from '@/lib/db'

async function seed() {
  // Company
  const company = await db.company.create({
    data: {
      raisonSociale: 'Demo SARL',
      sigle: 'DS',
      nif: 'GN-CONAKRY-001-2024',
      rc: 'RC/Conakry/2024/A-001',
      cnssNumero: 'CNSS-001-2024',
      adresse: 'Hamdallaye, Route Le Prince',
      ville: 'Conakry',
      telephone: '+224 622 000 000',
      email: 'contact@demo.gn',
      devise: 'GNF',
    },
  })

  // CNSS params
  await db.cnssParam.create({
    data: { companyId: company.id, dateEffet: '2024-01-01' },
  })

  // Employees with contracts
  const employees = [
    { matricule: 'DS-001', nom: 'Diallo', prenoms: 'Mamadou', sexe: 'M', poste: 'Directeur Technique', salaire: 5000000, type: 'CDI', dateEmbauche: '2020-03-15', cnss: '1234567890' },
    { matricule: 'DS-002', nom: 'Camara', prenoms: 'Aïssatou', sexe: 'F', poste: 'Responsable RH', salaire: 3500000, type: 'CDI', dateEmbauche: '2021-06-01', cnss: '1234567891' },
    { matricule: 'DS-003', nom: 'Bah', prenoms: 'Ousmane', sexe: 'M', poste: 'Développeur Senior', salaire: 4000000, type: 'CDD', dateEmbauche: '2024-01-15', cnss: '1234567892' },
    { matricule: 'DS-004', nom: 'Touré', prenoms: 'Fatoumata', sexe: 'F', poste: 'Comptable', salaire: 2800000, type: 'CDI', dateEmbauche: '2019-09-01', cnss: '1234567893' },
    { matricule: 'DS-005', nom: 'Sylla', prenoms: 'Ibrahima', sexe: 'M', poste: 'Stagiaire RH', salaire: 350000, type: 'STAGE', dateEmbauche: '2024-09-01', cnss: '1234567894' },
    { matricule: 'DS-006', nom: 'Conté', prenoms: 'Mariama', sexe: 'F', poste: 'Infirmière', salaire: 2200000, type: 'CDI', dateEmbauche: '2022-04-10', cnss: '1234567895' },
    { matricule: 'DS-007', nom: 'Kaba', prenoms: 'Lamine', sexe: 'M', poste: 'Manager Commercial', salaire: 3200000, type: 'CDI', dateEmbauche: '2018-11-05', cnss: '1234567896' },
    { matricule: 'DS-008', nom: 'Doubiya', prenoms: 'Hawa', sexe: 'F', poste: 'Assistante RH', salaire: 1800000, type: 'CDD', dateEmbauche: '2024-05-20', cnss: '1234567897' },
  ]

  for (const emp of employees) {
    const employee = await db.employee.create({
      data: {
        companyId: company.id,
        matricule: emp.matricule,
        nom: emp.nom,
        prenoms: emp.prenoms,
        sexe: emp.sexe,
        poste: emp.poste,
        dateEmbauche: emp.dateEmbauche,
        cnssNumero: emp.cnss,
        email: `${emp.prenoms.toLowerCase().replace(/\s/g, '.')}@demo.gn`,
        telephone: '+224 622 00 ' + emp.matricule.slice(-2) + ' ' + emp.matricule.slice(-2),
        statut: 'actif',
        situationFamiliale: emp.sexe === 'F' ? 'MARIE' : 'CELIBATAIRE',
        nombreEnfants: Math.floor(Math.random() * 4),
      },
    })

    await db.contract.create({
      data: {
        employeeId: employee.id,
        type: emp.type,
        dateDebut: emp.dateEmbauche,
        dateFin: emp.type === 'CDD' ? '2025-12-31' : null,
        poste: emp.poste,
        salaireBase: emp.salaire,
        devise: 'GNF',
        status: 'ACTIF',
      },
    })
  }

  // Holidays Guinée 2025
  const holidays = [
    { date: '2025-01-01', name: "Jour de l'An", type: 'LEGAL' },
    { date: '2025-03-08', name: 'Journée de la Femme', type: 'LEGAL' },
    { date: '2025-05-01', name: 'Fête du Travail', type: 'LEGAL' },
    { date: '2025-10-02', name: "Fête de l'Indépendance", type: 'LEGAL' },
    { date: '2025-12-25', name: 'Noël', type: 'RELIGIEUX' },
  ]
  for (const h of holidays) {
    await db.holiday.create({ data: h })
  }

  // Sample leave requests
  const allEmployees = await db.employee.findMany()
  await db.leaveRequest.create({
    data: {
      employeeId: allEmployees[1].id,
      type: 'CONGE_PAYE',
      dateDebut: '2026-07-15',
      dateFin: '2026-07-25',
      motif: 'Vacances familiales',
      statut: 'EN_ATTENTE',
    },
  })
  await db.leaveRequest.create({
    data: {
      employeeId: allEmployees[2].id,
      type: 'MALADIE',
      dateDebut: '2026-06-20',
      dateFin: '2026-06-22',
      motif: 'Grippe',
      statut: 'APPROUVE',
    },
  })
  await db.leaveRequest.create({
    data: {
      employeeId: allEmployees[4].id,
      type: 'CONGE_PAYE',
      dateDebut: '2026-08-01',
      dateFin: '2026-08-10',
      motif: 'Congé annuel',
      statut: 'APPROUVE',
    },
  })

  console.log('✅ Seed terminé — Company + 8 employés + contrats + congés + jours fériés')
}

seed().catch(console.error).finally(() => db.$disconnect())
