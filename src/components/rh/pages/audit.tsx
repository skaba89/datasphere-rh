'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollText, Search, Download, Filter, User, FileEdit, CheckCircle2, Trash2, LogIn, Zap, RefreshCw, Ban, AlertTriangle, FileSignature, Boxes, Brain, Database, Link2 } from 'lucide-react'

interface AuditLog {
  id: number
  action: string
  entityType: string
  entityId: string | null
  userId: string | null
  diff: { before?: Record<string, unknown>; after?: Record<string, unknown> } | string | null
  createdAt: string
}

interface AdvLog {
  id: string
  module: string
  action: string
  targetType: string | null
  targetId: string | null
  targetLabel: string | null
  performedBy: string
  details: Record<string, any>
  txHash: string | null
  ipAddress: string | null
  createdAt: string
}

const ACTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CREATE: { label: 'Création', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: User },
  UPDATE: { label: 'Modification', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: FileEdit },
  DELETE: { label: 'Suppression', color: 'bg-red-100 text-red-700 border-red-200', icon: Trash2 },
  VALIDATE: { label: 'Validation', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle2 },
  LOGIN: { label: 'Connexion', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: LogIn },
  EXPORT: { label: 'Export', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Download },
}

const ADV_ACTION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  RENEW: { label: 'Renouvellement', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: RefreshCw },
  REVOKE: { label: 'Révocation', color: 'bg-red-100 text-red-700 border-red-200', icon: Ban },
  TRAIN: { label: 'Entraînement IA', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Brain },
  EXPORT: { label: 'Export', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Download },
  ALERT: { label: 'Alerte', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
  CREATE: { label: 'Création', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: User },
  UPDATE: { label: 'Modification', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: FileEdit },
  DELETE: { label: 'Suppression', color: 'bg-red-100 text-red-700 border-red-200', icon: Trash2 },
}

const MODULE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  CONTRACTS_MGMT: { label: 'Contrats', color: '#27698a', icon: FileSignature },
  BLOCKCHAIN: { label: 'Blockchain', color: '#8b5cf6', icon: Boxes },
  PREDICTIVE: { label: 'IA prédictive', color: '#10b981', icon: Brain },
  DATA_GOVERNANCE: { label: 'Gouvernance', color: '#f59e0b', icon: Database },
  PILOTAGE: { label: 'Pilotage', color: '#0ea5e9', icon: Zap },
}

const ENTITY_LABELS: Record<string, string> = {
  employee: 'Employé',
  leave_request: 'Demande de congé',
  contract: 'Contrat',
  payslip: 'Bulletin de paie',
  cnss_param: 'Paramètre CNSS',
  user: 'Utilisateur',
}

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState<string>('all')
  const [tab, setTab] = useState<'classic' | 'advanced'>('classic')

  // Advanced audit state
  const [advLogs, setAdvLogs] = useState<AdvLog[]>([])
  const [advStats, setAdvStats] = useState<{ total: number; byModule: Record<string, number>; byAction: Record<string, number> } | null>(null)
  const [advLoading, setAdvLoading] = useState(false)
  const [advFilterModule, setAdvFilterModule] = useState<string>('all')
  const [advFilterAction, setAdvFilterAction] = useState<string>('all')
  const [advSearch, setAdvSearch] = useState('')

  useEffect(() => {
    let mounted = true
    fetch('/api/audit')
      .then(r => r.json())
      .then(d => { if (mounted) { setLogs(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const loadAdv = () => {
    setAdvLoading(true)
    fetch('/api/audit-advanced?limit=100')
      .then(r => r.json())
      .then(d => {
        if (d.logs) setAdvLogs(d.logs)
        if (d.stats) setAdvStats(d.stats)
        setAdvLoading(false)
      })
      .catch(() => setAdvLoading(false))
  }

  useEffect(() => { if (tab === 'advanced' && advLogs.length === 0) loadAdv() }, [tab])

  const filtered = logs.filter(l => {
    if (filterAction !== 'all' && l.action !== filterAction) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        l.entityType.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.userId || '').toLowerCase().includes(q) ||
        String(l.id).includes(q)
      )
    }
    return true
  })

  const advFiltered = advLogs.filter(l => {
    if (advFilterModule !== 'all' && l.module !== advFilterModule) return false
    if (advFilterAction !== 'all' && l.action !== advFilterAction) return false
    if (advSearch) {
      const q = advSearch.toLowerCase()
      return (
        (l.targetLabel || '').toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        (l.performedBy || '').toLowerCase().includes(q) ||
        (l.txHash || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Journal d'audit</h1>
          <p className="text-sm text-slate-500 mt-1">
            Traçabilité immuable des actions — {logs.length + (advStats?.total || 0)} événement{(logs.length + (advStats?.total || 0)) > 1 ? 's' : ''} enregistré{(logs.length + (advStats?.total || 0)) > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export audit
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {([{ key: 'classic', label: 'Audit classique', icon: ScrollText }, { key: 'advanced', label: 'Modules avancés', icon: Zap }] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}>
            <t.icon className="w-4 h-4 inline mr-2" />{t.label}
            {t.key === 'advanced' && advStats && <Badge variant="outline" className="ml-2 text-[9px] bg-[#27698a]/5 text-[#27698a]">{advStats.total}</Badge>}
          </button>
        ))}
      </div>

      {/* Stats par type d'action */}
      {tab === 'classic' && (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(ACTION_META).map(([key, meta]) => {
          const count = logs.filter(l => l.action === key).length
          return (
            <Card key={key} className="p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: meta.color.split(' ')[0].replace('bg-', '').includes('emerald') ? '#dcfce7' :
                                  meta.color.includes('sky') ? '#e0f2fe' :
                                  meta.color.includes('red') ? '#fee2e2' :
                                  meta.color.includes('purple') ? '#f3e8ff' :
                                  meta.color.includes('amber') ? '#fef3c7' : '#f1f5f9'
                }}>
                  <meta.icon className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-500">{meta.label}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      )}

      {tab === 'advanced' && (
        <>
          {/* Stats avancées */}
          {advStats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card className="p-3 col-span-2 md:col-span-3 lg:col-span-2">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Total événements</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{advStats.total}</div>
              </Card>
              {Object.entries(advStats.byModule).map(([mod, count]) => {
                const meta = MODULE_META[mod] || { label: mod, color: '#64748b', icon: Filter }
                return (
                  <Card key={mod} className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + '15', color: meta.color }}>
                        <meta.icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-900">{count}</div>
                        <div className="text-[10px] text-slate-500">{meta.label}</div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Filtres avancés */}
          <Card className="p-3 lg:p-4">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par cible, action, hash, auteur..."
                  value={advSearch}
                  onChange={e => setAdvSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select value={advFilterModule} onChange={e => setAdvFilterModule(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white">
                <option value="all">Tous modules</option>
                {Object.entries(MODULE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
              <select value={advFilterAction} onChange={e => setAdvFilterAction(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white">
                <option value="all">Toutes actions</option>
                {Object.entries(ADV_ACTION_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
              <Button variant="outline" size="sm" onClick={loadAdv} disabled={advLoading}>
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${advLoading ? 'animate-spin' : ''}`} />Actualiser
              </Button>
            </div>
          </Card>

          {/* Timeline avancée */}
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#27698a]" />
              <h2 className="font-semibold text-slate-900 text-sm">
                {advFiltered.length} événement{advFiltered.length > 1 ? 's' : ''}
              </h2>
              <span className="ml-auto text-xs text-slate-500">Tri du plus récent au plus ancien</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {advFiltered.length === 0 && (
                <div className="px-4 py-12 text-center text-slate-400">
                  <Zap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  Aucun événement avancé — déclenchez une action (ré-entraîner IA, renouveler contrat, révoquer certificat) pour peupler l'historique.
                </div>
              )}
              {advFiltered.map(log => {
                const actionMeta = ADV_ACTION_META[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Filter }
                const moduleMeta = MODULE_META[log.module] || { label: log.module, color: '#64748b', icon: Filter }
                return (
                  <div key={log.id} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: moduleMeta.color + '15', color: moduleMeta.color }}>
                      <moduleMeta.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className={actionMeta.color}>{actionMeta.label}</Badge>
                        <Badge variant="outline" className="text-[9px]" style={{ color: moduleMeta.color, borderColor: moduleMeta.color + '40' }}>{moduleMeta.label}</Badge>
                        <span className="text-sm font-medium text-slate-900">{log.targetLabel || '—'}</span>
                        {log.targetId && <span className="text-xs font-mono text-slate-400 truncate">#{log.targetId.slice(-8)}</span>}
                        {log.txHash && (
                          <span className="text-[10px] font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                            <Link2 className="w-2.5 h-2.5" /> {log.txHash.slice(0, 10)}…{log.txHash.slice(-6)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        Par <span className="font-medium text-slate-700">{log.performedBy}</span>
                        {' · '}
                        <time>{new Date(log.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                        {log.ipAddress && <span className="ml-2 text-slate-400">· IP {log.ipAddress}</span>}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 rounded bg-slate-50 text-[10px] font-mono text-slate-600 overflow-x-auto">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </>
      )}

      {tab === 'classic' && (
        <>
        <Card className="p-3 lg:p-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher par entité, action, utilisateur..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterAction('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                filterAction === 'all' ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              Toutes
            </button>
            {Object.entries(ACTION_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setFilterAction(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filterAction === key ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>
      </Card>
        </>
      )}

      {tab === 'classic' && (
        <>
        <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-slate-700" />
          <h2 className="font-semibold text-slate-900 text-sm">
            {filtered.length} événement{filtered.length > 1 ? 's' : ''}
          </h2>
          <span className="ml-auto text-xs text-slate-500">Tri du plus récent au plus ancien</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-400">
              <ScrollText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              Aucun événement
            </div>
          )}
          {filtered.map(log => {
            const meta = ACTION_META[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Filter }
            const entityLabel = ENTITY_LABELS[log.entityType] || log.entityType
            return (
              <div key={log.id} className="px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100">
                  <meta.icon className="w-4 h-4 text-slate-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="outline" className={meta.color}>
                      {meta.label}
                    </Badge>
                    <span className="text-sm font-medium text-slate-900">{entityLabel}</span>
                    {log.entityId && (
                      <span className="text-xs font-mono text-slate-400 truncate">
                        #{log.entityId.slice(-8)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600">
                    Par <span className="font-medium text-slate-700">{log.userId || 'système'}</span>
                    {' · '}
                    <time>{new Date(log.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}</time>
                  </div>
                  {log.diff && typeof log.diff === 'object' && (log.diff.before || log.diff.after) && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      {log.diff.before && (
                        <div className="p-2 rounded bg-red-50 border border-red-200">
                          <div className="text-red-700 font-semibold mb-1">Avant</div>
                          <pre className="text-red-900 text-[10px] font-mono overflow-x-auto">
                            {JSON.stringify(log.diff.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.diff.after && (
                        <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                          <div className="text-emerald-700 font-semibold mb-1">Après</div>
                          <pre className="text-emerald-900 text-[10px] font-mono overflow-x-auto">
                            {JSON.stringify(log.diff.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
        </>
      )}

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <AlertTriangle className="w-3.5 h-3.5 inline" /> Le journal d'audit est <strong>immuable</strong> : aucune modification ni suppression n'est possible.
        Rétention légale : 10 ans (Code du travail guinéen + RGPD).
      </div>
    </div>
  )
}
