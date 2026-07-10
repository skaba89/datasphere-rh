// Cache minimal avec fallback mémoire
type CacheValue = string | number | object | null
const memoryCache = new Map<string, { value: CacheValue; expiresAt: number }>()

export async function cacheGet<T = CacheValue>(key: string): Promise<T | null> {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { memoryCache.delete(key); return null }
  return entry.value as T
}

export async function cacheSet(key: string, value: CacheValue, ttlSeconds: number): Promise<void> {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  if (memoryCache.size > 1000) { const now = Date.now(); for (const [k, v] of memoryCache) { if (now > v.expiresAt) memoryCache.delete(k) } }
}

export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const c = await cacheGet<T>(key)
  if (c !== null) return c
  const result = await fn()
  await cacheSet(key, result, ttlSeconds)
  return result
}

export const CACHE_KEYS = {
  pilotage: (companyId: string) => `pilotage:kpis:${companyId}`,
  healthCheck: () => `health:check`,
  providers: () => `llm:providers:list`,
}

export const CACHE_TTL = {
  pilotage: 30,
  healthCheck: 10,
  providers: 3600,
}
