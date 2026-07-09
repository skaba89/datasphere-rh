import { db } from '@/lib/db'

async function seedV10() {
  const company = await db.company.findFirst()
  if (!company) { console.error('Company not found'); process.exit(1) }
  const employees = await db.employee.findMany({ take: 5 })

  // Work locations
  const locations = [
    { name: 'Bureau Principal Conakry', address: 'Hamdallaye, Route Le Prince, Conakry', latitude: 9.5092, longitude: -13.7122, radius: 150, type: 'BUREAU' },
    { name: 'Site Mine Boké', address: 'Quartier Minière, Boké', latitude: 10.9426, longitude: -14.2974, radius: 200, type: 'SITE' },
    { name: 'Espace Coworking Kaloum', address: 'Kaloum, Conakry', latitude: 9.5092, longitude: -13.7122, radius: 100, type: 'COWORKING' },
  ]

  for (const loc of locations) {
    const existing = await db.workLocation.findFirst({ where: { companyId: company.id, name: loc.name } })
    if (existing) { console.log(`  ⏭️  Location "${loc.name}"`); continue }
    await db.workLocation.create({ data: { ...loc, companyId: company.id } })
    console.log(`  ✅ Location "${loc.name}" créée`)
  }

  const workLocs = await db.workLocation.findMany({ where: { companyId: company.id } })
  const mainLoc = workLocs[0]

  // Geo check-ins (7 derniers jours)
  const today = new Date()
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const d = new Date(today); d.setDate(d.getDate() - dayOffset)
    const dateStr = d.toISOString().slice(0, 10)
    const dayOfWeek = d.getDay()
    if (dayOfWeek === 0) continue

    for (let i = 0; i < Math.min(4, employees.length); i++) {
      const emp = employees[i]
      const isTelework = Math.random() < 0.2
      const checkIn = isTelework ? '09:00' : Math.random() < 0.2 ? '08:20' : '08:00'
      const verified = !isTelework
      const lat = isTelework ? null : 9.5092 + (Math.random() - 0.5) * 0.002
      const lng = isTelework ? null : -13.7122 + (Math.random() - 0.5) * 0.002
      const distance = isTelework ? null : Math.round(Math.random() * 120)

      const existing = await db.geoCheckIn.findFirst({ where: { employeeId: emp.id, date: dateStr } })
      if (existing) continue

      await db.geoCheckIn.create({
        data: {
          employeeId: emp.id, workLocationId: isTelework ? null : mainLoc.id,
          date: dateStr, checkIn, mode: isTelework ? 'TELETRAVAIL' : 'PRESENTIEL',
          latitude: lat, longitude: lng, verified, distance,
        },
      })
    }
  }
  console.log(`  ✅ Geo check-ins créés`)

  console.log('\n✅ Seed v1.0 terminé : work locations + geo check-ins')
}

seedV10().then(() => db.$disconnect()).catch(e => { console.error(e); db.$disconnect() })
