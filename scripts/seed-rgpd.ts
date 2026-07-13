/**
 * Seed RGPD consent data for demo
 */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  console.log('🔒 Seed RGPD consent data...')
  const company = await db.company.findFirst()
  if (!company) { console.log('No company'); return }

  // Check if consents already exist
  const existing = await db.dataConsent.count({ where: { companyId: company.id } })
  if (existing > 0) { console.log(`⊘ ${existing} consents already exist`); return }

  const employees = await db.employee.findMany({ where: { companyId: company.id }, take: 10 })
  const consentTypes = ['PROCESSING', 'MARKETING', 'TRANSFER', 'ANALYTICS']

  for (const emp of employees) {
    for (const type of consentTypes) {
      await db.dataConsent.create({
        data: {
          companyId: company.id,
          employeeId: emp.id,
          consentType: type,
          granted: Math.random() > 0.2, // 80% granted
          grantedAt: new Date(Date.now() - Math.random() * 90 * 86400000),
          withdrawnAt: Math.random() > 0.8 ? new Date() : null,
        },
      })
    }
  }

  // Add a few RGPD requests
  const requests = [
    { requestType: 'ACCESS', status: 'COMPLETED', details: 'Demande accès données personnelles', response: 'Documents transmis par email', treatedBy: 'admin@datasphere.gn', treatedAt: new Date() },
    { requestType: 'PORTABILITY', status: 'COMPLETED', details: 'Export données employé', response: 'Export JSON transmis', treatedBy: 'rh@datasphere.gn', treatedAt: new Date() },
    { requestType: 'RECTIFICATION', status: 'IN_PROGRESS', details: 'Correction adresse personnelle', response: null, treatedBy: null, treatedAt: null },
    { requestType: 'ERASURE', status: 'PENDING', details: 'Demande suppression données (fin contrat)', response: null, treatedBy: null, treatedAt: null },
  ]

  for (const r of requests) {
    await db.dataRequest.create({
      data: {
        companyId: company.id,
        employeeId: employees[Math.floor(Math.random() * employees.length)]?.id || null,
        ...r,
      },
    })
  }

  console.log(`✅ Created ${employees.length * consentTypes.length} consents + ${requests.length} RGPD requests`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
