import { db } from '@/lib/db'
import { chat, type ChatMessage, type ChatOptions, type ChatResult } from './router'
import { getProviderById, LLM_PROVIDERS, isProviderConfigured, type LlmProvider } from './providers'

export async function chatWithFallback(primaryProviderId: string, model: string, messages: ChatMessage[], options: ChatOptions = {}, fallbackProviderIds?: string[]): Promise<ChatResult & { fallbackUsed: boolean; attemptedProviders: string[] }> {
  const attempted: string[] = []
  let lastError: string | undefined
  const fallbacks = fallbackProviderIds || buildFallbackList(primaryProviderId)
  const allToTry = [primaryProviderId, ...fallbacks.filter(id => id !== primaryProviderId)]
  for (const providerId of allToTry) {
    attempted.push(providerId)
    const provider = getProviderById(providerId)
    if (!provider) continue
    if (!isProviderConfigured(provider) && providerId !== 'zai') continue
    try {
      const useModel = providerId === primaryProviderId ? model : provider.defaultModel
      const result = await chat(providerId, useModel, messages, options)
      return { ...result, fallbackUsed: providerId !== primaryProviderId, attemptedProviders: attempted, originalError: lastError }
    } catch (e: any) { lastError = e?.message || String(e) }
  }
  throw new Error(`Tous les providers LLM ont échoué. Tentés: ${attempted.join(', ')}. Dernier erreur: ${lastError}`)
}

function buildFallbackList(primaryProviderId: string): string[] {
  const list: string[] = ['zai']
  for (const p of LLM_PROVIDERS) { if (p.id === primaryProviderId || p.id === 'zai') continue; if (isProviderConfigured(p)) list.push(p.id) }
  return list
}
