import { db } from '@/lib/db'

export async function saveGeneration(data: { companyId: string; type: string; title: string; content: string; providerId: string; modelId: string; promptTokens?: number; completionTokens?: number; totalTokens?: number; estimatedCostUsd?: number; durationMs?: number; metadata?: any; employeeId?: string; tags?: string[] }) {
  return db.aiGeneration.create({ data: { companyId: data.companyId, type: data.type, title: data.title, content: data.content, providerId: data.providerId, modelId: data.modelId, promptTokens: data.promptTokens || 0, completionTokens: data.completionTokens || 0, totalTokens: data.totalTokens || 0, estimatedCostUsd: data.estimatedCostUsd || 0, durationMs: data.durationMs || 0, metadata: data.metadata ? JSON.stringify(data.metadata) : null, employeeId: data.employeeId, tags: data.tags ? JSON.stringify(data.tags) : null } })
}
export async function listGenerations(companyId: string, filters: { type?: string; favorite?: boolean; archived?: boolean; limit?: number } = {}) {
  const where: any = { companyId, archived: filters.archived ?? false }
  if (filters.type) where.type = filters.type
  if (typeof filters.favorite === 'boolean') where.favorite = filters.favorite
  return db.aiGeneration.findMany({ where, orderBy: { createdAt: 'desc' }, take: filters.limit || 50 })
}
export async function getGeneration(companyId: string, id: string) { return db.aiGeneration.findFirst({ where: { id, companyId } }) }
export async function toggleFavorite(companyId: string, id: string) { const g = await getGeneration(companyId, id); if (!g) return null; return db.aiGeneration.update({ where: { id }, data: { favorite: !g.favorite } }) }
export async function archiveGeneration(companyId: string, id: string) { return db.aiGeneration.updateMany({ where: { id, companyId }, data: { archived: true } }) }
export async function deleteGeneration(companyId: string, id: string) { return db.aiGeneration.deleteMany({ where: { id, companyId } }) }
