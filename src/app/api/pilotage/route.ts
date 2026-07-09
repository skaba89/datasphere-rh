import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/pilotage — KPIs consolidés des 4 modules avancés
export async function GET() {
  try {
    const company = await db.company.findFirst()
    if (!company) return NextResponse.json({ modules: [], kpis: {} })

    // 1. Contracts
    const contracts = await db.contractSupplier.findMany({ where: { companyId: company.id } })
    const contractsActifs = contracts.filter(c => c.status === 'ACTIF').length
    const contractsMontant = contracts.reduce((s, c) => s + c.amount, 0)
    const contractsAlertes = contracts.reduce((s, c) => s + (c.alerts || 0), 0)

    // 2. Blockchain
    const certs = await db.certificate.findMany({ where: { companyId: company.id } })
    const certsActifs = certs.filter(c => c.status === 'ACTIVE').length
    const certsRevoked = certs.filter(c => c.status === 'REVOKED').length

    // 3. Predictive (dernier training)
    const lastTraining = await db.modelTraining.findFirst({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
    })
    const trainingCount = await db.modelTraining.count({ where: { companyId: company.id } })

    // 4. Audit (activité récente)
    const auditCount = await db.advancedAuditLog.count({ where: { companyId: company.id } })
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const auditLast24h = await db.advancedAuditLog.count({
      where: { companyId: company.id, createdAt: { gte: last24h } },
    })

    // 5. Webhooks
    const webhookCount = await db.webhookConfig.count({ where: { companyId: company.id } })
    const webhookActive = await db.webhookConfig.count({
      where: { companyId: company.id, isActive: true },
    })

    // Données pour les graphiques
    // Activité par module (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentLogs = await db.advancedAuditLog.findMany({
      where: { companyId: company.id, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
    })
    const activityByDay: Record<string, Record<string, number>> = {}
    for (const l of recentLogs) {
      const day = l.createdAt.toISOString().slice(0, 10)
      if (!activityByDay[day]) activityByDay[day] = {}
      activityByDay[day][l.module] = (activityByDay[day][l.module] || 0) + 1
    }
    const activitySeries = Object.entries(activityByDay).map(([day, modules]) => ({ day, ...modules }))

    // Synthèse KPIs
    const kpis = {
      contracts: { total: contracts.length, actifs: contractsActifs, montant: contractsMontant, alertes: contractsAlertes },
      blockchain: { total: certs.length, actifs: certsActifs, revoked: certsRevoked },
      predictive: {
        lastVersion: lastTraining?.modelVersion || '—',
        lastTrainedAt: lastTraining?.createdAt?.toISOString() || null,
        trainings: trainingCount,
        avgTurnover: lastTraining?.avgTurnoverScore || 0,
        avgPerf: lastTraining?.avgPerfScore || 0,
        avgPromo: lastTraining?.avgPromoScore || 0,
      },
      audit: { total: auditCount, last24h: auditLast24h },
      webhooks: { total: webhookCount, active: webhookActive },
    }

    const modules = [
      { key: 'contracts-mgmt', label: 'Gestion contractuelle', icon: 'FileSignature', color: '#27698a' },
      { key: 'blockchain', label: 'Blockchain', icon: 'Boxes', color: '#8b5cf6' },
      { key: 'predictive', label: 'IA prédictive', icon: 'Brain', color: '#10b981' },
      { key: 'data-governance', label: 'Gouvernance données', icon: 'Database', color: '#f59e0b' },
    ]

    return NextResponse.json({ modules, kpis, activitySeries })
  } catch (error) {
    console.error('GET /api/pilotage error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
