/**
 * Enrich demo data: 2nd company (Mine de Boké), +15 employees, leave requests, payroll, contracts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Enrichissement des données démo...')

  // Check if Mine de Boké already exists
  const existingMine = await db.company.findFirst({ where: { raisonSociale: { contains: 'Boké' } } })
  if (existingMine) {
    console.log('⊘ Mine de Boké existe déjà, skip')
    return
  }

  // === 2nd company: Mine de Boké ===
  const mine = await db.company.create({
    data: {
      raisonSociale: 'Société Minière de Boké SARL',
      sigle: 'SMB',
      nif: 'NIF-SMB-002',
      rc: 'RC-SMB-002',
      cnssNumero: 'CNSS-SMB-002',
      adresse: 'Boké, Boké Region',
      ville: 'Boké',
      telephone: '+224 621 111 111',
      email: 'contact@minebokedemo.gn',
      devise: 'GNF',
    },
  })
  console.log('  ✓ Société Minière de Boké créée')

  // Admin for Mine — upsert (user may already exist if company was previously deleted)
  const bcryptMod = await import('bcryptjs')
  const existingMineUser = await db.user.findUnique({ where: { email: 'admin@minebokedemo.gn' } })
  if (existingMineUser) {
    await db.user.update({
      where: { id: existingMineUser.id },
      data: { companyId: mine.id, active: true },
    })
    console.log('  ✓ User admin mine reconnecté à la nouvelle société')
  } else {
    await db.user.create({
      data: {
        email: 'admin@minebokedemo.gn',
        name: 'Mamadou Camara (Admin Mine)',
        role: 'SUPER_ADMIN',
        passwordHash: await bcryptMod.hash('demo123', 10),
        companyId: mine.id,
        active: true,
      },
    })
    console.log('  ✓ User admin mine créé')
  }

  // === 15 employees for Mine de Boké ===
  const mineEmployees = [
    { matricule: 'SMB-001', nom: 'Camara', prenoms: 'Boubacar', poste: 'Directeur Mine', sexe: 'M', dateEmbauche: '2019-03-15', salaire: 8000000, type: 'CDI' },
    { matricule: 'SMB-002', nom: 'Diallo', prenoms: 'Ousmane', poste: 'Ingénieur Mine', sexe: 'M', dateEmbauche: '2020-06-01', salaire: 5500000, type: 'CDI' },
    { matricule: 'SMB-003', nom: 'Sow', prenoms: 'Mamadou', poste: 'Chef d\'équipe', sexe: 'M', dateEmbauche: '2021-01-10', salaire: 3500000, type: 'CDI' },
    { matricule: 'SMB-004', nom: 'Touré', prenoms: 'Boubacar', poste: 'Ouvrier mine', sexe: 'M', dateEmbauche: '2021-09-15', salaire: 1800000, type: 'CDI' },
    { matricule: 'SMB-005', nom: 'Condé', prenoms: 'Alpha', poste: 'Ouvrier mine', sexe: 'M', dateEmbauche: '2022-02-01', salaire: 1800000, type: 'CDI' },
    { matricule: 'SMB-006', nom: 'Bah', prenoms: 'Mariama', poste: 'Responsable HSE', sexe: 'F', dateEmbauche: '2022-04-10', salaire: 4200000, type: 'CDI' },
    { matricule: 'SMB-007', nom: 'Cissé', prenoms: 'Kadiatou', poste: 'Comptable', sexe: 'F', dateEmbauche: '2022-08-01', salaire: 3200000, type: 'CDI' },
    { matricule: 'SMB-008', nom: 'Diallo', prenoms: 'Fatoumata', poste: 'Assistante RH', sexe: 'F', dateEmbauche: '2023-01-15', salaire: 2200000, type: 'CDI' },
    { matricule: 'SMB-009', nom: 'Keita', prenoms: 'Ibrahima', poste: 'Médecin du travail', sexe: 'M', dateEmbauche: '2023-03-01', salaire: 4500000, type: 'CDI' },
    { matricule: 'SMB-010', nom: 'Sylla', prenoms: 'Mamadou', poste: 'Chauffeur poids lourd', sexe: 'M', dateEmbauche: '2023-06-10', salaire: 1800000, type: 'CDI' },
    { matricule: 'SMB-011', nom: 'Barry', prenoms: 'Aissatou', poste: 'Standardiste', sexe: 'F', dateEmbauche: '2023-09-01', salaire: 1500000, type: 'CDI' },
    { matricule: 'SMB-012', nom: 'Traoré', prenoms: 'Lamine', poste: 'Ouvrier mine CDD', sexe: 'M', dateEmbauche: '2024-01-15', salaire: 1800000, type: 'CDD' },
    { matricule: 'SMB-013', nom: 'Camara', prenoms: 'Hawa', poste: 'Stagiaire RH', sexe: 'F', dateEmbauche: '2024-09-01', salaire: 800000, type: 'STAGE' },
    { matricule: 'SMB-014', nom: 'Diallo', prenoms: 'Boubacar', poste: 'Magasinier', sexe: 'M', dateEmbauche: '2024-02-01', salaire: 2000000, type: 'CDI' },
    { matricule: 'SMB-015', nom: 'Sow', prenoms: 'Aminata', poste: 'Infirmière', sexe: 'F', dateEmbauche: '2023-11-10', salaire: 2800000, type: 'CDI' },
  ]

  for (const emp of mineEmployees) {
    const employee = await db.employee.create({
      data: {
        companyId: mine.id, matricule: emp.matricule, nom: emp.nom, prenoms: emp.prenoms,
        sexe: emp.sexe, poste: emp.poste, dateEmbauche: emp.dateEmbauche, statut: 'actif',
        telephone: `+224 621 ${emp.matricule.slice(-3)}`,
        email: `${emp.prenoms.toLowerCase()}.${emp.nom.toLowerCase()}@minebokedemo.gn`,
        situationFamiliale: 'Marié(e)', nombreEnfants: Math.floor(Math.random() * 4),
      },
    })
    await db.contract.create({
      data: {
        employeeId: employee.id, type: emp.type, dateDebut: emp.dateEmbauche,
        dateFin: emp.type === 'CDD' ? '2025-01-15' : null, poste: emp.poste,
        salaireBase: emp.salaire, devise: 'GNF', status: 'ACTIF',
      },
    })
  }
  console.log(`  ✓ ${mineEmployees.length} employés mine créés`)

  // === Leave requests ===
  const dsCompany = await db.company.findFirst({ where: { sigle: 'DSD' } })
  if (dsCompany) {
    const dsEmployees = await db.employee.findMany({ where: { companyId: dsCompany.id }, take: 5 })
    const leaveTypes = ['CONGE_PAYE', 'MALADIE', 'MATERNITE', 'PATERNITE', 'MARIAGE']
    const statuses = ['EN_ATTENTE', 'VALIDE_RH', 'VALIDE_DIR', 'REFUSE', 'EN_ATTENTE']
    const today = new Date()

    for (let i = 0; i < dsEmployees.length; i++) {
      const emp = dsEmployees[i]
      const start = new Date(today)
      start.setDate(start.getDate() + i * 3 + 5)
      const end = new Date(start)
      end.setDate(end.getDate() + 2 + (i % 3))
      const dateDebutStr = start.toISOString().slice(0, 10)
      const dateFinStr = end.toISOString().slice(0, 10)
      const nbJours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

      await db.leaveRequest.create({
        data: {
          employeeId: emp.id,
          type: leaveTypes[i % leaveTypes.length],
          dateDebut: dateDebutStr,
          dateFin: dateFinStr,
          motif: ['Congés annuels planifiés', 'Raison personnelle', 'Convalescence', 'Évènement familial', 'Mariage'][i % 5],
          statut: statuses[i % statuses.length],
        },
      })
    }
    console.log(`  ✓ ${dsEmployees.length} demandes de congés créées`)
  }

  // === Notifications ===
  const dsCompany2 = await db.company.findFirst({ where: { sigle: 'DSD' } })
  if (!dsCompany2) throw new Error('DataSphere company not found')

  const allNotifs = [
    { type: 'CONGE', subject: 'Demande de congé en attente', message: 'Aïcha Diallo a demandé 3 jours de congé annuel', severity: 'INFO' },
    { type: 'CONTRAT', subject: 'Contrat CDD arrivant à échéance', message: 'Le contrat de Ibrahima Sow (CDD) se termine le 01/01/2025', severity: 'URGENT' },
    { type: 'PAIE', subject: 'Paie du mois prête', message: 'Les bulletins de paie de juillet 2026 sont disponibles', severity: 'INFO' },
    { type: 'ALERTE', subject: 'CNSS à régulariser', message: '2 employés sans numéro CNSS — régularisation requise', severity: 'ATTENTION' },
    { type: 'CONGE', subject: 'Demande de congé validée', message: 'La demande de Mamadou Camara a été validée par la direction', severity: 'INFO' },
  ]
  for (const n of allNotifs) {
    await db.notification.create({
      data: {
        companyId: dsCompany2.id,
        recipient: 'admin@datasphere.gn',
        channel: 'IN_APP',
        subject: n.subject,
        message: n.message,
        status: 'EN_ATTENTE',
        type: n.type,
        metadata: JSON.stringify({ severity: n.severity }),
      },
    })
  }
  console.log(`  ✓ ${allNotifs.length} notifications créées`)

  // === Audit log entries ===
  const auditActions = [
    { action: 'LOGIN', entityType: 'user', entityId: 'admin@datasphere.gn', userId: 'admin@datasphere.gn', diff: '{"after":{"email":"admin@datasphere.gn","role":"SUPER_ADMIN"}}' },
    { action: 'CREATE_EMPLOYEE', entityType: 'employee', entityId: 'DS-001', userId: 'admin@datasphere.gn', diff: '{"after":{"matricule":"DS-001","nom":"Camara"}}' },
    { action: 'UPDATE_PAYROLL', entityType: 'payroll', entityId: '2026-07', userId: 'rh@datasphere.gn', diff: '{"after":{"month":"2026-07","status":"VALIDATED"}}' },
    { action: 'VIEW_EMPLOYEE', entityType: 'employee', entityId: 'DS-002', userId: 'rh@datasphere.gn', diff: '{}' },
    { action: 'GENERATE_REPORT', entityType: 'report', entityId: 'monthly-2026-07', userId: 'admin@datasphere.gn', diff: '{"after":{"type":"monthly","month":"2026-07"}}' },
  ]
  for (const log of auditActions) {
    await db.auditLog.create({ data: log })
  }
  console.log(`  ✓ ${auditActions.length} logs d'audit créés`)

  // === Final stats ===
  const totalCompanies = await db.company.count()
  const totalEmployees = await db.employee.count()
  const totalUsers = await db.user.count()
  const totalContracts = await db.contract.count()
  const totalLeaves = await db.leaveRequest.count()
  const totalNotifs = await db.notification.count()
  const totalAudit = await db.auditLog.count()

  console.log('\n📊 État final de la base :')
  console.log(`   Sociétés : ${totalCompanies}`)
  console.log(`   Utilisateurs : ${totalUsers}`)
  console.log(`   Employés : ${totalEmployees}`)
  console.log(`   Contrats : ${totalContracts}`)
  console.log(`   Demandes de congés : ${totalLeaves}`)
  console.log(`   Notifications : ${totalNotifs}`)
  console.log(`   Logs d'audit : ${totalAudit}`)
  console.log('\n✅ Enrichissement terminé !')
}

main().catch(e => { console.error('Erreur:', e); process.exit(1) }).finally(() => db.$disconnect())
