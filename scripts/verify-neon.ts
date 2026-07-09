import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('📊 Vérification données Neon...')
  const companyCount = await db.company.count()
  const userCount = await db.user.count()
  const empCount = await db.employee.count()
  const docCount = await db.document.count()

  console.log(`  Sociétés: ${companyCount}`)
  console.log(`  Users: ${userCount}`)
  console.log(`  Employés: ${empCount}`)
  console.log(`  Documents: ${docCount}`)

  // Si pas de documents RAG, en créer
  if (docCount === 0 && companyCount > 0) {
    const company = await db.company.findFirst()
    if (!company) throw new Error('No company')

    const ragDocs = [
      { title: 'Politique de télétravail', source: 'policy' },
      { title: 'Politique de congés', source: 'policy' },
      { title: 'FAQ RH', source: 'faq' },
      { title: 'Code du travail guinéen', source: 'law' },
      { title: 'Manuel onboarding', source: 'manual' },
    ]
    for (const doc of ragDocs) {
      await db.document.create({
        data: {
          companyId: company.id,
          name: doc.title,
          type: 'OTHER',
          fileKey: `rag/${doc.source}/${doc.title}`,
          fileSize: 500,
          mimeType: 'text/plain',
          category: 'RH',
        },
      })
    }
    console.log(`  ✓ ${ragDocs.length} documents RAG créés`)
  }

  // Test login user
  const admin = await db.user.findFirst({ where: { email: 'admin@datasphere.gn' } })
  console.log(`  Admin user: ${admin?.email} (role: ${admin?.role})`)
  console.log('\n✅ Base prête !')
}

main().catch(e => { console.error('Erreur:', e); process.exit(1) }).finally(() => db.$disconnect())
