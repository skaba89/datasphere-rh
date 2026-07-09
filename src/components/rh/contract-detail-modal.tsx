'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, FileSignature, Clock, DollarSign, AlertTriangle, RefreshCw, Bell, Zap, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Props {
  contractId: string
  onClose: () => void
  onRenew?: (contract: any) => void
}

interface DetailData {
  contract: any
  timeline: Array<{
    id: string
    type: 'AUDIT' | 'NOTIF' | 'WEBHOOK' | 'CREATION'
    action: string
    label: string
    date: string
    details?: any
    severity?: string
  }>
  stats: { auditEvents: number; notifications: number; webhooks: number; renewals: number; alerts: number }
}

const TYPE_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PRESTATION_IT: { label: 'Prestation IT', color: 'bg-[#27698a]/10 text-[#27698a]' },
  AUDIT: { label: 'Audit', color: 'bg-purple-100 text-purple-700' },
  ASSURANCE: { label: 'Assurance', color: 'bg-red-100 text-red-700' },
  FORMATION: { label: 'Formation', color: 'bg-amber-100 text-amber-700' },
  TELECOM: { label: 'Télécom', color: 'bg-sky-100 text-sky-700' },
  TRAVAUX: { label: 'Travaux', color: 'bg-emerald-100 text-emerald-700' },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIF: { label: 'Actif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  EXPIRE_BIENTOT: { label: 'Expire bientôt', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  EXPIRE: { label: 'Expiré', color: 'bg-red-50 text-red-700 border-red-200' },
}

const TIMELINE_TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  CREATION: { icon: FileText, color: 'text-[#27698a]', bg: 'bg-[#27698a]/10' },
  AUDIT: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  NOTIF: { icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50' },
  WEBHOOK: { icon: RefreshCw, color: 'text-sky-600', bg: 'bg-sky-50' },
}

const ACTION_LABELS: Record<string, string> = {
  RENEW: 'Renouvellement',
  REVOKE: 'Résiliation',
  ALERT: 'Alerte automatique',
  UPDATE: 'Modification',
  CREATE: 'Création',
  NOTIFICATION: 'Notification envoyée',
  WEBHOOK: 'Webhook déclenché',
  CRÉATION: 'Création initiale',
}

const SEVERITY_META: Record<string, { color: string }> = {
  EXPIRE: { color: 'text-red-700 bg-red-100 border-red-200' },
  URGENT: { color: 'text-red-700 bg-red-100 border-red-200' },
  ATTENTION: { color: 'text-amber-700 bg-amber-100 border-amber-200' },
  SURVEILLER: { color: 'text-sky-700 bg-sky-100 border-sky-200' },
}

export function ContractDetailModal({ contractId, onClose, onRenew }: Props) {
  const [data, setData] = useState<DetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/contracts-mgmt/${contractId}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [contractId])

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="p-8"><div className="animate-pulse h-32 w-64 bg-slate-200 rounded" /></Card>
    </div>
  )

  if (!data) return null

  const c = data.contract
  const typeMeta = TYPE_META[c.type] || { label: c.type, color: 'bg-slate-100 text-slate-700' }
  const statusMeta = STATUS_META[c.status] || STATUS_META.ACTIF
  const daysLeft = c.daysLeft

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="p-0 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#27698a]/10 flex items-center justify-center shrink-0">
              <FileSignature className="w-5 h-5 text-[#27698a]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{c.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{c.supplier}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className={`text-[10px] ${typeMeta.color}`}>{typeMeta.label}</Badge>
                <Badge variant="outline" className={`text-[10px] ${statusMeta.color}`}>{statusMeta.label}</Badge>
                {daysLeft < 30 && daysLeft >= 0 && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">⏰ {daysLeft}j restants</Badge>}
                {daysLeft < 0 && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">⚠ Expiré depuis {Math.abs(daysLeft)}j</Badge>}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        {/* Infos clés */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><div className="text-slate-500">Montant</div><div className="font-bold text-slate-900">{formatGNF(c.amount)}</div></div>
          <div><div className="text-slate-500">Clauses</div><div className="font-bold text-slate-900">{c.clauses}</div></div>
          <div><div className="text-slate-500">Responsable</div><div className="font-bold text-slate-900">{c.owner || '—'}</div></div>
          <div><div className="text-slate-500">Alertes actives</div><div className={`font-bold ${c.alerts > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.alerts}</div></div>
          <div className="col-span-2"><div className="text-slate-500">Période</div><div className="font-bold text-slate-900 flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(c.startDate)} → {formatDate(c.endDate)}</div></div>
          {c.renewalDate && <div className="col-span-2"><div className="text-slate-500">Renouvellement prévu</div><div className="font-bold text-[#27698a] flex items-center gap-1"><RefreshCw className="w-3 h-3" />{formatDate(c.renewalDate)}</div></div>}
        </div>

        {/* Description */}
        {c.description && (
          <div className="px-5 py-3 border-b border-slate-200">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Description</div>
            <p className="text-sm text-slate-700">{c.description}</p>
          </div>
        )}

        {/* Stats timeline */}
        <div className="px-5 py-3 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded bg-amber-50"><div className="text-amber-700">Renouvellements</div><div className="font-bold text-amber-900 text-base">{data.stats.renewals}</div></div>
          <div className="p-2 rounded bg-orange-50"><div className="text-orange-700">Alertes</div><div className="font-bold text-orange-900 text-base">{data.stats.alerts}</div></div>
          <div className="p-2 rounded bg-purple-50"><div className="text-purple-700">Notifications</div><div className="font-bold text-purple-900 text-base">{data.stats.notifications}</div></div>
          <div className="p-2 rounded bg-sky-50"><div className="text-sky-700">Webhooks</div><div className="font-bold text-sky-900 text-base">{data.stats.webhooks}</div></div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#27698a]" />Timeline complète ({data.timeline.length} événement{data.timeline.length > 1 ? 's' : ''})
          </h3>

          {data.timeline.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">Aucun événement</div>
          ) : (
            <div className="space-y-2">
              {data.timeline.map((evt) => {
                const meta = TIMELINE_TYPE_META[evt.type] || TIMELINE_TYPE_META.AUDIT
                const sevMeta = evt.severity ? SEVERITY_META[evt.severity] : null
                const isExpanded = expanded === evt.id
                return (
                  <div key={evt.id} className="flex items-start gap-3 p-2 rounded border border-slate-100 hover:bg-slate-50">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-slate-900">{ACTION_LABELS[evt.action] || evt.action}</span>
                        {sevMeta && <span className={`text-[9px] px-1.5 py-0.5 rounded border ${sevMeta.color}`}>{evt.severity}</span>}
                        <span className="text-[10px] text-slate-400 ml-auto">{new Date(evt.date).toLocaleString('fr-FR')}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{evt.label}</p>
                      {evt.details && Object.keys(evt.details).length > 0 && (
                        <>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : evt.id)}
                            className="text-[10px] text-[#27698a] hover:underline mt-1 flex items-center gap-0.5"
                          >
                            {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            {isExpanded ? 'Masquer' : 'Voir'} détails
                          </button>
                          {isExpanded && (
                            <pre className="mt-1 p-2 rounded bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto">
                              {JSON.stringify(evt.details, null, 2)}
                            </pre>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          {onRenew && (c.status === 'EXPIRE_BIENTOT' || c.status === 'EXPIRE') && (
            <Button variant="outline" size="sm" className="border-[#27698a] text-[#27698a] hover:bg-[#27698a] hover:text-white" onClick={() => onRenew(c)}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Renouveler
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
        </div>
      </Card>
    </div>
  )
}
