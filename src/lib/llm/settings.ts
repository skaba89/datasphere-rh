import { db } from '@/lib/db'
import { LLM_PROVIDERS, getProviderById, type LlmProvider } from './providers'

export async function getDefaultProvider(companyId: string): Promise<{ provider: LlmProvider; model: string; temperature: number; maxTokens: number; settingsId?: string }> {
  const setting = await db.llmSettings.findFirst({ where: { companyId, isDefault: true } })
  if (setting) { const provider = getProviderById(setting.providerId); if (provider) return { provider, model: setting.modelId, temperature: setting.temperature, maxTokens: setting.maxTokens, settingsId: setting.id } }
  if (process.env.ZAI_API_KEY) { const zai = LLM_PROVIDERS.find(p => p.id === 'zai')!; return { provider: zai, model: zai.defaultModel, temperature: 0.7, maxTokens: 1000 } }
  for (const p of LLM_PROVIDERS) { if (p.id === 'zai' || p.id === 'ollama') continue; if (process.env[p.envVar]) return { provider: p, model: p.defaultModel, temperature: 0.7, maxTokens: 1000 } }
  const zai = LLM_PROVIDERS.find(p => p.id === 'zai')!
  return { provider: zai, model: zai.defaultModel, temperature: 0.7, maxTokens: 1000 }
}

export async function getLlmSettings(companyId: string) { return db.llmSettings.findMany({ where: { companyId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] }) }

export async function upsertLlmSetting(companyId: string, data: { providerId: string; modelId: string; isDefault?: boolean; temperature?: number; maxTokens?: number; apiKeyAlias?: string }) {
  if (data.isDefault) await db.llmSettings.updateMany({ where: { companyId, isDefault: true }, data: { isDefault: false } })
  const existing = await db.llmSettings.findFirst({ where: { companyId, providerId: data.providerId } })
  if (existing) return db.llmSettings.update({ where: { id: existing.id }, data: { modelId: data.modelId, isDefault: data.isDefault ?? existing.isDefault, temperature: data.temperature ?? existing.temperature, maxTokens: data.maxTokens ?? existing.maxTokens, apiKeyAlias: data.apiKeyAlias ?? existing.apiKeyAlias } })
  return db.llmSettings.create({ data: { companyId, providerId: data.providerId, modelId: data.modelId, isDefault: data.isDefault ?? false, temperature: data.temperature ?? 0.7, maxTokens: data.maxTokens ?? 1000, apiKeyAlias: data.apiKeyAlias } })
}
