/**
 * Seed des données démo pour les modules avancés
 * - ContractSupplier : 6 contrats fournisseurs variés
 * - Certificate : 8 certificats blockchain
 * - WebhookConfig : 1 webhook Slack de démo
 *
 * Usage : npx tsx scripts/seed-advanced.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const CONTRACT_TYPES = ['PRESTATION_IT', 'AUDIT', 'ASSURANCE', 'FORMATION', 'TELECOM', 'TRAVAUX']
const CONTRACT_STATUSES = ['ACTIF', 'EXPIRE_BIENTOT', 'EXPIRE']
const CERT_TYPES = ['ATTESTATION', 'CONTRAT', 'BULLETIN', 'CERTIFICAT']

function randomHex(len: number): string {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

function randomDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString()
}

async function main() {
  console.log('🌱 Seed modules avancés…')

  const company = await db.company.findFirst()
  if (!company) {
    console.error('❌ Aucune société trouvée. Lancez d\'abord le seed principal.')
    process.exit(1)
  }

  // ─── ContractSupplier ───
  console.log('  → ContractSupplier')
  const existingContracts = await db.contractSupplier.count({ where: { companyId: company.id } })
  if (existingContracts === 0) {
    const contracts = [
      { title: 'Maintenance ERP SAP', supplier: 'DataSphere Guinea', type: 'PRESTATION_IT', amount: 450000000, clauses: 12, status: 'ACTIF', daysStart: -180, daysEnd: 185, daysRenewal: 30, owner: 'Aïcha Diallo', alerts: 0, desc: 'Maintenance applicative et support niveau 3 du ERP' },
      { title: 'Audit financier annuel', supplier: 'KPMG Guinea', type: 'AUDIT', amount: 180000000, clauses: 8, status: 'ACTIF', daysStart: -60, daysEnd: 305, daysRenewal: 60, owner: 'Mamadou Camara', alerts: 0, desc: 'Audit des comptes annuels et certification' },
      { title: 'Assurance multi-risques', supplier: 'NSIA Assurance', type: 'ASSURANCE', amount: 95000000, clauses: 15, status: 'EXPIRE_BIENTOT', daysStart: -300, daysEnd: 65, daysRenewal: 15, owner: 'Fatou Touré', alerts: 2, desc: 'Police flotte automobile + locaux professionnels' },
      { title: 'Formation management', supplier: 'Institut PME Guinée', type: 'FORMATION', amount: 45000000, clauses: 6, status: 'ACTIF', daysStart: -30, daysEnd: 335, daysRenewal: null, owner: 'Sékou Traoré', alerts: 0, desc: 'Programme de formation cadres et managers (5 sessions)' },
      { title: 'Connectivité fibre + SD-WAN', supplier: 'Orange Business', type: 'TELECOM', amount: 72000000, clauses: 10, status: 'ACTIF', daysStart: -120, daysEnd: 245, daysRenewal: 45, owner: 'Lamine Barry', alerts: 0, desc: '2 liens fibre 1Gbps + SD-WAN multi-sites Conakry' },
      { title: 'Travaux aménagement bureaux', supplier: 'BTP Guinea SARL', type: 'TRAVAUX', amount: 320000000, clauses: 18, status: 'EXPIRE', daysStart: -400, daysEnd: -35, daysRenewal: null, owner: 'Aïcha Diallo', alerts: 1, desc: 'Aménagement 3e étage siège social (terminé)' },
      { title: 'Cybersécurité pentest', supplier: 'Sentry Africa', type: 'PRESTATION_IT', amount: 125000000, clauses: 9, status: 'EXPIRE_BIENTOT', daysStart: -90, daysEnd: 25, daysRenewal: 20, owner: 'Lamine Barry', alerts: 3, desc: 'Tests d\'intrusion annuels + audit ISO 27001' },
      { title: 'Assurance santé collective', supplier: 'Saham Assurance', type: 'ASSURANCE', amount: 220000000, clauses: 14, status: 'ACTIF', daysStart: -45, daysEnd: 320, daysRenewal: 75, owner: 'Fatou Touré', alerts: 0, desc: 'Mutuelle santé collective 100% employés + ayants droit' },
    ]

    for (const c of contracts) {
      await db.contractSupplier.create({
        data: {
          companyId: company.id,
          title: c.title,
          supplier: c.supplier,
          type: c.type,
          description: c.desc,
          amount: c.amount,
          currency: 'GNF',
          clauses: c.clauses,
          startDate: randomDate(c.daysStart),
          endDate: randomDate(c.daysEnd),
          renewalDate: c.daysRenewal !== null ? randomDate(c.daysRenewal) : null,
          status: c.status,
          owner: c.owner,
          alerts: c.alerts,
          txHash: '0x' + randomHex(64),
        },
      })
    }
    console.log(`    ✓ ${contracts.length} contrats créés`)
  } else {
    console.log(`    ⊘ ${existingContracts} contrats déjà présents (skip)`)
  }

  // ─── Certificate ───
  console.log('  → Certificate')
  const existingCerts = await db.certificate.count({ where: { companyId: company.id } })
  if (existingCerts === 0) {
    const employees = await db.employee.findMany({ take: 8 })
    const certs = [
      { title: 'Attestation d\'employeur', type: 'ATTESTATION', signer: 'Aïcha Diallo', role: 'RH' },
      { title: 'Contrat de travail CDI', type: 'CONTRAT', signer: 'Mamadou Camara', role: 'DRH' },
      { title: 'Bulletin de paie Juin 2026', type: 'BULLETIN', signer: 'Comptabilité', role: 'COMPTA' },
      { title: 'Certificat de travail', type: 'CERTIFICAT', signer: 'Aïcha Diallo', role: 'RH' },
      { title: 'Attestation CNSS', type: 'ATTESTATION', signer: 'Fatou Touré', role: 'JURIDIQUE' },
      { title: 'Contrat de travail CDD', type: 'CONTRAT', signer: 'Mamadou Camara', role: 'DRH' },
      { title: 'Bulletin de paie Mai 2026', type: 'BULLETIN', signer: 'Comptabilité', role: 'COMPTA' },
      { title: 'Certificat médical embauche', type: 'CERTIFICAT', signer: 'Dr. Sékou Conde', role: 'MEDECIN' },
    ]

    for (let i = 0; i < certs.length; i++) {
      const cert = certs[i]
      const emp = employees[i % employees.length]
      const blockNumber = 18500000 + Math.floor(Math.random() * 50000)
      await db.certificate.create({
        data: {
          companyId: company.id,
          documentTitle: `${cert.title} - ${emp ? emp.nom + ' ' + emp.prenoms : 'Employé ' + (i + 1)}`,
          documentType: cert.type,
          hash: randomHex(64),
          txHash: '0x' + randomHex(64),
          blockNumber,
          qrToken: randomHex(16),
          signerName: cert.signer,
          signerRole: cert.role,
          employeeId: emp?.id || null,
          employeeName: emp ? `${emp.nom} ${emp.prenoms}` : null,
          status: 'ACTIVE',
          immutable: true,
          timestamp: randomDate(-i * 5),
        },
      })
    }
    console.log(`    ✓ ${certs.length} certificats créés`)
  } else {
    console.log(`    ⊘ ${existingCerts} certificats déjà présents (skip)`)
  }

  // ─── WebhookConfig (démo) ───
  console.log('  → WebhookConfig')
  const existingWebhooks = await db.webhookConfig.count({ where: { companyId: company.id } })
  if (existingWebhooks === 0) {
    await db.webhookConfig.create({
      data: {
        companyId: company.id,
        name: 'Slack RH (démo)',
        url: 'https://example.com/webhook-demo',
        events: JSON.stringify(['contract.renewed', 'certificate.revoked', 'model.trained']),
        isActive: true,
        secret: 'demo-secret-12345',
      },
    })
    console.log('    ✓ 1 webhook démo créé')
  } else {
    console.log(`    ⊘ ${existingWebhooks} webhooks déjà présents (skip)`)
  }

  console.log('✅ Seed terminé')
  console.log('')
  console.log('Résumé :')
  const contracts = await db.contractSupplier.count({ where: { companyId: company.id } })
  const certs = await db.certificate.count({ where: { companyId: company.id } })
  const webhooks = await db.webhookConfig.count({ where: { companyId: company.id } })
  console.log(`  Contrats fournisseurs : ${contracts}`)
  console.log(`  Certificats blockchain : ${certs}`)
  console.log(`  Webhooks : ${webhooks}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
