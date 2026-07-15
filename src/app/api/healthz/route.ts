import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/healthz
 *
 * Health check complet pour monitoring de production.
 * Utilisé par :
 * - Netlify pour vérifier la disponibilité
 * - UptimeRobot / cron-job.org pour alerter en cas de panne
 * - Les load balancers pour le routing
 *
 * Retourne :
 * - status: healthy / degraded / unhealthy
 * - checks: database, memory, environment, version, uptime
 * - latency: temps de réponse de chaque check
 */
export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, { status: 'ok' | 'error' | 'warning'; latencyMs?: number; details?: string }> = {}
  let allOk = true
  let hasWarning = false

  // 1. Base de données (latence critique)
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - dbStart
    checks.database = {
      status: dbLatency > 1000 ? 'warning' : 'ok',
      latencyMs: dbLatency,
      details: `PostgreSQL Neon — ${dbLatency}ms`,
    }
    if (dbLatency > 1000) hasWarning = true
  } catch (e: any) {
    checks.database = { status: 'error', details: e?.message?.slice(0, 100) }
    allOk = false
  }

  // 2. Mémoire utilisée
  const memUsage = process.memoryUsage()
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  checks.memory = {
    status: memMB > 400 ? 'warning' : 'ok',
    details: `${memMB}MB / ${memTotalMB}MB`,
  }
  if (memMB > 400) hasWarning = true

  // 3. Variables d'environnement critiques
  const requiredEnvVars = ['DATABASE_URL']
  const missingEnv = requiredEnvVars.filter(v => !process.env[v])
  checks.environment = {
    status: missingEnv.length === 0 ? 'ok' : 'error',
    details: missingEnv.length === 0
      ? 'Variables critiques OK'
      : `Manquantes: ${missingEnv.join(', ')}`,
  }
  if (missingEnv.length > 0) allOk = false

  // 4. NEXTAUTH_SECRET (warning si non configuré)
  checks.nextauth_secret = {
    status: process.env.NEXTAUTH_SECRET ? 'ok' : 'warning',
    details: process.env.NEXTAUTH_SECRET
      ? `${process.env.NEXTAUTH_SECRET.length} caractères`
      : 'Non configuré',
  }
  if (!process.env.NEXTAUTH_SECRET) hasWarning = true

  // 5. Version et uptime
  checks.version = {
    status: 'ok',
    details: process.env.npm_package_version || '1.0.0',
  }
  checks.uptime = {
    status: 'ok',
    details: `${Math.round(process.uptime())}s`,
  }

  // 6. Compteur sociétés (vérifie que la DB a des données)
  try {
    const companyCount = await db.company.count()
    checks.data = {
      status: companyCount > 0 ? 'ok' : 'warning',
      details: `${companyCount} société(s)`,
    }
    if (companyCount === 0) hasWarning = true
  } catch {
    checks.data = { status: 'error', details: 'Comptage impossible' }
    allOk = false
  }

  const totalLatency = Date.now() - startTime
  const status = !allOk ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy'

  const response = {
    status,
    timestamp: new Date().toISOString(),
    latency: `${totalLatency}ms`,
    service: 'DataSphere RH Guinée',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    checks,
  }

  // HTTP 200 si healthy ou degraded, 503 si unhealthy
  const httpStatus = status === 'unhealthy' ? 503 : 200

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'public, max-age=30',
      'X-Health-Status': status,
    },
  })
}
