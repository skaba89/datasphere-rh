import { db } from '@/lib/db'
import { getProviderById } from './providers'

export async function trackUsage(data: { companyId: string; providerId: string; modelId: string; endpoint: string; promptTokens: number; completionTokens: number; totalTokens: number; durationMs: number; success: boolean; errorMsg?: string | null; feature?: string; userId?: string }): Promise<void> {
  try {
    const provider = getProviderById(data.providerId)
    const model = provider?.models.find(m => m.id === data.modelId)
    const inputCost = (model?.inputPricePer1M || 0) * (data.promptTokens / 1e6)
    const outputCost = (model?.outputPricePer1M || 0) * (data.completionTokens / 1e6)
    const estimatedCostUsd = Math.round((inputCost + outputCost) * 1e6) / 1e6
    await db.llmUsage.create({ data: { companyId: data.companyId, providerId: data.providerId, modelId: data.modelId, endpoint: data.endpoint, promptTokens: data.promptTokens, completionTokens: data.completionTokens, totalTokens: data.totalTokens, estimatedCostUsd, durationMs: data.durationMs, success: data.success, errorMsg: data.errorMsg || null, feature: data.feature || null, userId: data.userId || null } })
  } catch (e) { console.error('trackUsage error:', e) }
}

export async function getUsageStats(companyId: string, options: { since?: Date } = {}) {
  const where: any = { companyId }
  if (options.since) where.createdAt = { gte: options.since }
  const usages = await db.llmUsage.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 })
  const total = usages.length
  const totalTokens = usages.reduce((s, u) => s + u.totalTokens, 0)
  const totalCostUsd = usages.reduce((s, u) => s + u.estimatedCostUsd, 0)
  const successCount = usages.filter(u => u.success).length
  const byProvider: Record<string, { count: number; tokens: number; cost: number; success: number }> = {}
  for (const u of usages) { if (!byProvider[u.providerId]) byProvider[u.providerId] = { count: 0, tokens: 0, cost: 0, success: 0 }; byProvider[u.providerId].count++; byProvider[u.providerId].tokens += u.totalTokens; byProvider[u.providerId].cost += u.estimatedCostUsd; if (u.success) byProvider[u.providerId].success++ }
  const byDay: any[] = []
  const last30 = new Date(Date.now() - 30 * 86400000)
  for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); const ds = d.toISOString().slice(0, 10); const du = usages.filter(u => u.createdAt.toISOString().slice(0, 10) === ds); byDay.push({ date: ds, count: du.length, tokens: du.reduce((s, u) => s + u.totalTokens, 0), cost: Math.round(du.reduce((s, u) => s + u.estimatedCostUsd, 0) * 1e6) / 1e6 }) }
  return { total, totalTokens, totalPromptTokens: usages.reduce((s, u) => s + u.promptTokens, 0), totalCompletionTokens: usages.reduce((s, u) => s + u.completionTokens, 0), totalCostUsd: Math.round(totalCostUsd * 1e6) / 1e6, successRate: total > 0 ? (successCount / total) * 100 : 100, avgDurationMs: total > 0 ? Math.round(usages.reduce((s, u) => s + u.durationMs, 0) / total) : 0, byProvider, byDay }
}
