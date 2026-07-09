/**
 * Add additional demo users to the existing Neon database
 * Run after seed-netlify.ts to populate RH, Comptable, Manager accounts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('👥 Ajout des utilisateurs de démo...')
  const company = await db.company.findFirst()
  if (!company) {
    console.error('❌ Aucune société trouvée. Lancez d\'abord seed-netlify.ts')
    process.exit(1)
  }

  const demoUsers = [
    { email: 'rh@datasphere.gn', name: 'Aïcha Diallo', role: 'RH' },
    { email: 'comptable@datasphere.gn', name: 'Fatoumata Touré', role: 'COMPTABLE' },
    { email: 'manager@datasphere.gn', name: 'Sékou Traoré', role: 'MANAGER' },
  ]

  const passwordHash = await bcrypt.hash('demo123', 10)

  for (const u of demoUsers) {
    const existing = await db.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`  ⊘ ${u.email} existe déjà`)
      continue
    }
    await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash,
        companyId: company.id,
        active: true,
      },
    })
    console.log(`  ✓ ${u.email} créé (role: ${u.role})`)
  }

  console.log('\n✅ Utilisateurs de démo ajoutés !')
  console.log('   Tous les comptes utilisent le mot de passe: demo123')
}

main().catch(e => { console.error('Erreur:', e); process.exit(1) }).finally(() => db.$disconnect())
