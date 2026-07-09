/**
 * Seed pour déploiement Netlify + Neon SQL
 * Crée une société démo + employés + données RAG si la base est vide
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seed Netlify/Neon...')

  // Vérifie si déjà seedé
  const existing = await db.company.count()
  if (existing > 0) {
    console.log('⊘ Base déjà peuplée, skip')
    return
  }

  // 1. Société démo
  const company = await db.company.create({
    data: {
      raisonSociale: 'DataSphere Demo SARL',
      sigle: 'DSD',
      nif: 'NIF-DEMO-001',
      rc: 'RC-DEMO-001',
      cnssNumero: 'CNSS-DEMO-001',
      adresse: 'Kaloum, Conakry',
      ville: 'Conakry',
      telephone: '+224 620 000 000',
      email: 'demo@datasphere.gn',
      devise: 'GNF',
    },
  })
  console.log(`  ✓ Société: ${company.raisonSociale}`)

  // 2. Utilisateur admin
  const bcrypt = await import('bcryptjs')
  const passwordHash = await bcrypt.hash('demo123', 10)
  await db.user.create({
    data: {
      email: 'admin@datasphere.gn',
      name: 'Administrateur Démo',
      role: 'SUPER_ADMIN',
      passwordHash,
      companyId: company.id,
      active: true,
    },
  })
  console.log('  ✓ Utilisateur: admin@datasphere.gn / demo123')

  // 3. Employés démo
  const employees = [
    { matricule: 'DS-001', nom: 'Camara', prenoms: 'Mamadou', poste: 'Directeur Général', sexe: 'M', dateEmbauche: '2020-01-15', salaire: 5000000, type: 'CDI' },
    { matricule: 'DS-002', nom: 'Diallo', prenoms: 'Aïcha', poste: 'DRH', sexe: 'F', dateEmbauche: '2020-03-01', salaire: 3500000, type: 'CDI' },
    { matricule: 'DS-003', nom: 'Touré', prenoms: 'Fatoumata', poste: 'Comptable', sexe: 'F', dateEmbauche: '2021-09-01', salaire: 2500000, type: 'CDI' },
    { matricule: 'DS-004', nom: 'Barry', prenoms: 'Lamine', poste: 'Responsable IT', sexe: 'M', dateEmbauche: '2022-01-10', salaire: 3000000, type: 'CDI' },
    { matricule: 'DS-005', nom: 'Traoré', prenoms: 'Sékou', poste: 'Chef de projet', sexe: 'M', dateEmbauche: '2022-06-15', salaire: 2800000, type: 'CDI' },
    { matricule: 'DS-006', nom: 'Condé', prenoms: 'Mariama', poste: 'Assistante RH', sexe: 'F', dateEmbauche: '2023-01-05', salaire: 1800000, type: 'CDI' },
    { matricule: 'DS-007', nom: 'Sow', prenoms: 'Ibrahima', poste: 'Développeur', sexe: 'M', dateEmbauche: '2023-09-01', salaire: 2200000, type: 'CDD' },
    { matricule: 'DS-008', nom: 'Cissé', prenoms: 'Kadiatou', poste: 'Commercial', sexe: 'F', dateEmbauche: '2024-02-01', salaire: 2000000, type: 'CDI' },
    { matricule: 'DS-009', nom: 'Bah', prenoms: 'Ousmane', poste: 'Stagiaire', sexe: 'M', dateEmbauche: '2024-09-01', salaire: 800000, type: 'STAGE' },
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
        statut: 'actif',
        telephone: '+224 620 00 00 0' + emp.matricule.slice(-1),
        email: `${emp.prenoms.toLowerCase()}.${emp.nom.toLowerCase()}@datasphere.gn`,
        situationFamiliale: 'Célibataire',
        nombreEnfants: 0,
      },
    })

    await db.contract.create({
      data: {
        employeeId: employee.id,
        type: emp.type,
        dateDebut: emp.dateEmbauche,
        dateFin: emp.type === 'CDD' ? '2025-09-01' : null,
        poste: emp.poste,
        salaireBase: emp.salaire,
        devise: 'GNF',
        status: 'ACTIF',
      },
    })
  }
  console.log(`  ✓ Employés: ${employees.length} créés`)

  // 4. RAG documents
  const ragDocs = [
    { source: 'policy', title: 'Politique de télétravail', content: "Le télétravail est autorisé 2 jours par semaine pour les employés en CDI avec 3 mois d'ancienneté. L'entreprise fournit un ordinateur portable et rembourse la connexion internet jusqu'à 200 000 GNF/mois." },
    { source: 'policy', title: 'Politique de congés', content: "30 jours calendaires de congés payés par an. Congé maternité 14 semaines. Congé paternité 3 jours. L'entreprise ferme du 24 décembre au 2 janvier." },
    { source: 'faq', title: 'FAQ RH', content: "Paie le 28 du mois. CNSS 5% salarié, 17% employeur. ITS 1,5%. Demande d'attestation via le portail employé, délai 3 jours." },
    { source: 'law', title: 'Code du travail guinéen', content: "Période d'essai: 1 mois ouvriers, 2 mois agents de maîtrise, 3 mois cadres. Préavis: 1 mois à 3 mois selon grade. Heures supplémentaires majorées 25% puis 50%." },
    { source: 'manual', title: 'Manuel onboarding', content: "Jour 1: accueil RH, signature contrat, badge. Semaine 1: formation produit, shadowing. Documents requis: CNI, photo, CNSS, extrait de naissance, casier judiciaire." },
  ]

  for (const doc of ragDocs) {
    await db.documentChunk.create({
      data: {
        companyId: company.id,
        source: doc.source,
        title: doc.title,
        content: doc.content,
        chunkIndex: 0,
      },
    })
  }
  console.log(`  ✓ RAG: ${ragDocs.length} documents`)

  // 5. Contrats fournisseurs
  const contracts = [
    { title: 'Maintenance ERP', supplier: 'DataSphere GN', type: 'PRESTATION_IT', amount: 450000000, status: 'ACTIF', daysEnd: 185, owner: 'Aïcha Diallo', clauses: 12, alerts: 0, desc: 'Maintenance ERP' },
    { title: 'Audit financier', supplier: 'KPMG', type: 'AUDIT', amount: 180000000, status: 'ACTIF', daysEnd: 305, owner: 'Mamadou Camara', clauses: 8, alerts: 0, desc: 'Audit annuel' },
    { title: 'Assurance multi-risques', supplier: 'NSIA', type: 'ASSURANCE', amount: 95000000, status: 'EXPIRE_BIENTOT', daysEnd: 65, owner: 'Fatou Touré', clauses: 15, alerts: 2, desc: 'Police automobile' },
    { title: 'Cybersécurité', supplier: 'Sentry Africa', type: 'PRESTATION_IT', amount: 125000000, status: 'EXPIRE_BIENTOT', daysEnd: 25, owner: 'Lamine Barry', clauses: 9, alerts: 3, desc: 'Pentest annuel' },
    { title: 'Formation', supplier: 'Institut PME', type: 'FORMATION', amount: 45000000, status: 'ACTIF', daysEnd: 335, owner: 'Sékou Traoré', clauses: 6, alerts: 0, desc: 'Formation cadres' },
  ]

  for (const c of contracts) {
    const endDate = new Date(); endDate.setDate(endDate.getDate() + c.daysEnd)
    const startDate = new Date(); startDate.setDate(startDate.getDate() - 180)
    await db.contractSupplier.create({
      data: {
        companyId: company.id,
        title: c.title, supplier: c.supplier, type: c.type, description: c.desc,
        amount: c.amount, currency: 'GNF', clauses: c.clauses,
        startDate: startDate.toISOString(), endDate: endDate.toISOString(),
        status: c.status, owner: c.owner, alerts: c.alerts,
      },
    })
  }
  console.log(`  ✓ Contrats: ${contracts.length}`)

  console.log('\n✅ Seed terminé !')
  console.log('   Login: admin@datasphere.gn / demo123')
}

main()
  .catch((e) => { console.error('Erreur seed:', e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
