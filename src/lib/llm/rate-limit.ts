import { db } from '@/lib/db'

export interface RateLimitConfig { maxCallsPerDay: number; maxCallsPerHour: number; maxTokensPerDay: number; maxCostPerDayUsd: number }
export const DEFAULT_RATE_LIMITS: RateLimitConfig = { maxCallsPerDay: 500, maxCallsPerHour: 100, maxTokensPerDay: 500000, maxCostPerDayUsd: 10 }

export async function checkRateLimit(companyId: string, config: RateLimitConfig = DEFAULT_RATE_LIMITS) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfHour = new Date(now.getTime() - 3600000)
  const [todayUsages, hourCount] = await Promise.all([
    db.llmUsage.findMany({ where: { companyId, createdAt: { gte: startOfDay } }, select: { totalTokens: true, estimatedCostUsd: true } }),
    db.llmUsage.count({ where: { companyId, createdAt: { gte: startOfHour } } }),
  ])
  const callsToday = todayUsages.length
  const tokensToday = todayUsages.reduce((s, u) => s + u.totalTokens, 0)
  const costTodayUsd = todayUsages.reduce((s, u) => s + u.estimatedCostUsd, 0)
  const current = { callsToday, callsThisHour: hourCount, tokensToday, costTodayUsd }
  if (callsToday >= config.maxCallsPerDay) return { allowed: false, reason: `Limite quotidienne (${callsToday}/${config.maxCallsPerDay})`, current, limits: config }
  if (hourCount >= config.maxCallsPerHour) return { allowed: false, reason: `Limite horaire (${hourCount}/${config.maxCallsPerHour})`, current, limits: config }
  if (tokensToday >= config.maxTokensPerDay) return { allowed: false, reason: `Limite tokens (${tokensToday}/${config.maxTokensPerDay})`, current, limits: config }
  if (costTodayUsd >= config.maxCostPerDayUsd) return { allowed: false, reason: `Limite coût ($${costTodayUsd.toFixed(2)}/$${config.maxCostPerDayUsd})`, current, limits: config }
  return { allowed: true, current, limits: config }
}
