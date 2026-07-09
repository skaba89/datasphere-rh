import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function seedAuth() {
  // Créer une seconde société pour démonstration multi-sociétés
  const company2 = await db.company.create({
    data: {
      raisonSociale: 'Mine de Boké SARL',
      sigle: 'MBK',
      nif: 'GN-BOKE-002-2024',
      rc: 'RC/Boké/2024/B-002',
      cnssNumero: 'CNSS-002-2024',
      adresse: 'Quartier Minière, Boké',
      ville: 'Boké',
      telephone: '+224 622 111 111',
      email: 'contact@minebokedemo.gn',
      devise: 'GNF',
    },
  })

  await db.cnssParam.create({
    data: { companyId: company2.id, dateEffet: '2024-01-01' },
  })

  // Récupérer la première société (Demo SARL)
  const company1 = await db.company.findFirst({
    where: { raisonSociale: 'Demo SARL' },
  })
  if (!company1) {
    console.error('Demo SARL non trouvée — lance d\'abord seed.ts')
    process.exit(1)
  }

  // Créer les utilisateurs
  const password = 'Demo1234!'
  const hash = await bcrypt.hash(password, 10)

  const users = [
    { email: 'admin@demo.gn', name: 'Admin Demo', role: 'ADMIN_ENTREPRISE', companyId: company1.id },
    { email: 'rh@demo.gn', name: 'Aïssatou Camara', role: 'RH', companyId: company1.id },
    { email: 'comptable@demo.gn', name: 'Fatoumata Touré', role: 'COMPTABLE', companyId: company1.id },
    { email: 'manager@demo.gn', name: 'Mamadou Diallo', role: 'MANAGER', companyId: company1.id },
    { email: 'admin@minebokedemo.gn', name: 'Admin Mine Boké', role: 'ADMIN_ENTREPRISE', companyId: company2.id },
  ]

  for (const u of users) {
    const existing = await db.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`  ⏭️  ${u.email} existe déjà`)
      continue
    }
    await db.user.create({
      data: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: hash,
        companyId: u.companyId,
      },
    })
    console.log(`  ✅ ${u.email} créé (rôle: ${u.role})`)
  }

  console.log('\n📋 Comptes de connexion :')
  console.log('   Tous les mots de passe : Demo1234!')
  console.log('   - admin@demo.gn (ADMIN_ENTREPRISE - Demo SARL)')
  console.log('   - rh@demo.gn (RH - Demo SARL)')
  console.log('   - comptable@demo.gn (COMPTABLE - Demo SARL)')
  console.log('   - manager@demo.gn (MANAGER - Demo SARL)')
  console.log('   - admin@minebokedemo.gn (ADMIN_ENTREPRISE - Mine de Boké)')
}

seedAuth()
  .then(() => db.$disconnect())
  .catch(e => { console.error(e); db.$disconnect() })
