import { db } from '@/lib/db'
import crypto from 'crypto'

export type ApiScope = 'llm:chat' | 'llm:vision' | 'llm:stream' | 'rag:ask' | 'rag:search' | 'rag:index' | 'templates:run' | 'workflows:run' | 'employees:read' | 'audit:read' | '*'
export const ALL_SCOPES: ApiScope[] = ['llm:chat', 'llm:vision', 'llm:stream', 'rag:ask', 'rag:search', 'rag:index', 'templates:run', 'workflows:run', 'employees:read', 'audit:read', '*']
export const SCOPE_LABELS: Record<ApiScope, string> = { 'llm:chat': 'LLM Chat', 'llm:vision': 'LLM Vision', 'llm:stream': 'LLM Stream', 'rag:ask': 'RAG Q&A', 'rag:search': 'RAG Search', 'rag:index': 'RAG Index', 'templates:run': 'Templates', 'workflows:run': 'Workflows', 'employees:read': 'Employés', 'audit:read': 'Audit', '*': 'Admin' }

function hashApiKey(key: string): string { return crypto.createHash('sha256').update(key).digest('hex') }

export async function verifyApiKey(request: Request): Promise<{ companyId: string; apiKeyId: string; keyName: string; scopes: ApiScope[]; rateLimitPerHour: number } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(dsrh_live_[a-f0-9]+)$/)
  if (!match) return null
  const keyHash = hashApiKey(match[1])
  const apiKey = await db.apiKey.findUnique({ where: { keyHash }, include: { company: { select: { id: true } } } })
  if (!apiKey || !apiKey.isActive || !apiKey.company) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null
  let scopes: ApiScope[] = []; try { scopes = JSON.parse(apiKey.scopes) } catch {}
  db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date(), requestCount: { increment: 1 } } }).catch(() => {})
  return { companyId: apiKey.company.id, apiKeyId: apiKey.id, keyName: apiKey.name, scopes, rateLimitPerHour: apiKey.rateLimitPerHour }
}

export function hasScope(scopes: ApiScope[], required: ApiScope): boolean { return scopes.includes('*') || scopes.includes(required) }

export async function createApiKey(companyId: string, data: { name: string; scopes: ApiScope[]; rateLimitPerHour?: number; expiresAt?: Date }): Promise<{ apiKey: any; plainKey: string }> {
  const random = crypto.randomBytes(24).toString('hex')
  const key = `dsrh_live_${random}`
  const keyPrefix = key.slice(0, 16)
  const keyHash = hashApiKey(key)
  const apiKey = await db.apiKey.create({ data: { companyId, name: data.name, keyPrefix, keyHash, scopes: JSON.stringify(data.scopes), rateLimitPerHour: data.rateLimitPerHour || 100, expiresAt: data.expiresAt || null, isActive: true } })
  return { apiKey, plainKey: key }
}

export async function listApiKeys(companyId: string) {
  const keys = await db.apiKey.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } })
  return keys.map(k => ({ ...k, scopes: (() => { try { return JSON.parse(k.scopes) } catch { return [] } })() }))
}
