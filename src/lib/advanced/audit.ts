import { db } from '@/lib/db'

export interface AuditEntry {
  companyId: string
  module: 'CONTRACTS_MGMT' | 'BLOCKCHAIN' | 'PREDICTIVE' | 'DATA_GOVERNANCE' | 'PILOTAGE'
  action: string // RENEW | REVOKE | TRAIN | EXPORT | CREATE | UPDATE | DELETE
  targetType?: string
  targetId?: string
  targetLabel?: string
  performedBy?: string
  details?: Record<string, any>
  txHash?: string
  ipAddress?: string
}

/**
 * Enregistre une entrée dans le journal d'audit avancé.
 */
export async function logAudit(entry: AuditEntry) {
  try {
    return await db.advancedAuditLog.create({
      data: {
        companyId: entry.companyId,
        module: entry.module,
        action: entry.action,
        targetType: entry.targetType || null,
        targetId: entry.targetId || null,
        targetLabel: entry.targetLabel || null,
        performedBy: entry.performedBy || 'Système',
        details: entry.details ? JSON.stringify(entry.details) : null,
        txHash: entry.txHash || null,
        ipAddress: entry.ipAddress || null,
      },
    })
  } catch (error) {
    console.error('logAudit error:', error)
    return null
  }
}

/**
 * Récupère les entrées d'audit filtrées par société + module optionnel.
 */
export async function getAuditLogs(companyId: string, module?: string, limit = 50) {
  return db.advancedAuditLog.findMany({
    where: { companyId, ...(module ? { module } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
