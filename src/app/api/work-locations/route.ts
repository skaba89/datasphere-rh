import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ locations: [], checkIns: [] })
    const locations = await db.workLocation.findMany({ where: { companyId: company.id } })
    const checkIns = await db.geoCheckIn.findMany({
      include: { employee: { select: { id: true, nom: true, prenoms: true, matricule: true, poste: true, sexe: true } }, workLocation: { select: { id: true, name: true, type: true } } },
      orderBy: { date: 'desc' }, take: 50,
    })
    return NextResponse.json({ locations, checkIns })
  } catch (error) { console.error('GET /api/work-locations error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ error: 'Société introuvable' }, { status: 400 })

    if (body.checkIn && body.employeeId) {
      // Submit a geo check-in
      const workLoc = body.workLocationId ? await db.workLocation.findUnique({ where: { id: body.workLocationId } }) : null
      let verified = false
      let distance: number | null = null
      if (workLoc && workLoc.latitude && workLoc.longitude && body.latitude && body.longitude) {
        const R = 6371000 // Earth radius in meters
        const dLat = (body.latitude - workLoc.latitude) * Math.PI / 180
        const dLon = (body.longitude - workLoc.longitude) * Math.PI / 180
        const a = Math.sin(dLat/2) ** 2 + Math.cos(workLoc.latitude * Math.PI / 180) * Math.cos(body.latitude * Math.PI / 180) * Math.sin(dLon/2) ** 2
        distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))
        verified = distance <= workLoc.radius
      }
      const checkIn = await db.geoCheckIn.create({
        data: {
          employeeId: body.employeeId, workLocationId: body.workLocationId || null,
          date: body.date || new Date().toISOString().slice(0, 10),
          checkIn: body.checkIn, latitude: body.latitude || null, longitude: body.longitude || null,
          mode: body.mode || 'PRESENTIEL', verified, distance,
        },
      })
      return NextResponse.json({ success: true, checkIn, verified, distance }, { status: 201 })
    }

    // Create work location
    const loc = await db.workLocation.create({
      data: { companyId: company.id, name: body.name, address: body.address || null,
        latitude: body.latitude ? Number(body.latitude) : null, longitude: body.longitude ? Number(body.longitude) : null,
        radius: Number(body.radius) || 100, type: body.type || 'BUREAU' },
    })
    return NextResponse.json({ success: true, loc }, { status: 201 })
  } catch (error) { console.error('POST /api/work-locations error:', error); return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }) }
}
