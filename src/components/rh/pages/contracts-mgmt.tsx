'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileSignature, AlertTriangle, DollarSign, CheckCircle2, Clock, RefreshCw, X, Calendar, List, Maximize2 } from 'lucide-react'
import { formatGNF, formatDate } from '@/lib/utils-rh'
import { toast } from 'sonner'
import { ContractDetailModal } from '@/components/rh/contract-detail-modal'

interface Data { contracts: any[]; stats: any }
interface RenewResult { success: boolean; renewed: any; message: string }

const TYPE_META: Record<string, { label: string; color: string }> = {
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

export function ContractsMgmtPage({ userRole }: { userRole?: string | null }) {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'list' | 'calendar'>('list')
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [renewModal, setRenewModal] = useState<{ contract: any } | null>(null)
  const [renewing, setRenewing] = useState(false)
  const [renewResult, setRenewResult] = useState<RenewResult | null>(null)
  const [duration, setDuration] = useState(12)
  const [newAmount, setNewAmount] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  // Permissions RBAC
  const canRenew = !userRole || ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH'].includes(userRole)

  useEffect(() => {
    let m = true
    fetch('/api/contracts-mgmt').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) })
    return () => { m = false }
  }, [])

  const openRenew = (contract: any) => {
    setRenewModal({ contract })
    setRenewResult(null)
    setDuration(12)
    setNewAmount('')
  }

  const handleRenew = async () => {
    if (!renewModal) return
    setRenewing(true)
    try {
      const r = await fetch('/api/contracts-mgmt/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: renewModal.contract.id,
          durationMonths: duration,
          newAmount: newAmount ? parseFloat(newAmount) : null,
        }),
      })
      const d = await r.json()
      if (d.success) {
        setRenewResult(d)
        toast.success(d.message)
      } else {
        toast.error(d.error || 'Échec du renouvellement')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setRenewing(false)
    }
  }

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><FileSignature className="w-6 h-6 text-[#27698a]" />Gestion contractuelle</h1><p className="text-sm text-slate-500 mt-1">Contrats fournisseurs, échéances et renouvellements</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={FileSignature} label="Contrats" value={data.stats.total} color="#27698a" />
        <KpiCard icon={CheckCircle2} label="Actifs" value={data.stats.actifs} color="#478e5e" />
        <KpiCard icon={DollarSign} label="Montant total" value={formatGNF(data.stats.montantTotal)} color="#96783c" />
        <KpiCard icon={AlertTriangle} label="Alertes" value={data.stats.alertes} color="#b94659" />
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b border-slate-200">
        {([{ key: 'list', label: 'Liste', icon: List }, { key: 'calendar', label: 'Calendrier échéances', icon: Calendar }] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}>
            <t.icon className="w-4 h-4 inline mr-2" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.contracts.map((c: any) => {
          const type = TYPE_META[c.type] || { label: c.type, color: 'bg-slate-100 text-slate-700' }
          const status = STATUS_META[c.status] || STATUS_META.ACTIF
          const isExpiringSoon = c.status === 'EXPIRE_BIENTOT' || c.status === 'EXPIRE'
          return (
            <Card key={c.id} className={`p-4 ${c.alerts > 0 ? 'border-l-4 border-l-amber-500' : ''}`}>
              <div className="flex items-start justify-between mb-2"><Badge variant="outline" className={type.color + ' text-[10px]'}>{type.label}</Badge><div className="flex gap-1">
                <Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge>
                <button onClick={() => setDetailId(c.id)} className="text-slate-400 hover:text-[#27698a] p-0.5 rounded hover:bg-slate-100" title="Voir le détail"><Maximize2 className="w-3 h-3" /></button>
              </div></div>
              <h3 className="font-semibold text-slate-900 text-sm cursor-pointer hover:text-[#27698a]" onClick={() => setDetailId(c.id)}>{c.title}</h3>
              <div className="text-xs text-slate-500 mt-1">{c.supplier}</div>
              <p className="text-xs text-slate-600 mt-2">{c.desc}</p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Montant</div><div className="font-bold text-slate-900">{formatGNF(c.amount)}</div></div>
                <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Clauses</div><div className="font-bold text-slate-900">{c.clauses}</div></div>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500"><Clock className="w-3 h-3" />{formatDate(c.startDate)} → {formatDate(c.endDate)}</div>
              {c.renewalDate && <div className="mt-1 text-xs text-[#27698a] flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Renouvellement : {formatDate(c.renewalDate)}</div>}
              {c.alerts > 0 && <div className="mt-1 text-xs text-amber-600">⚠ {c.alerts} alerte(s) · Responsable : {c.owner}</div>}
              {isExpiringSoon && canRenew && (
                <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-xs border-[#27698a] text-[#27698a] hover:bg-[#27698a] hover:text-white" onClick={() => openRenew(c)}>
                  <RefreshCw className="w-3 h-3 mr-1.5" />Renouveler
                </Button>
              )}
              {isExpiringSoon && !canRenew && (
                <div className="mt-3 text-[10px] text-slate-400 text-center italic">Lecture seule · RH requis pour renouveler</div>
              )}
            </Card>
          )
        })}
      </div>
      )}

      {tab === 'calendar' && (
        <CalendarView contracts={data.contracts} month={calMonth} onMonthChange={setCalMonth} onRenew={canRenew ? openRenew : undefined} />
      )}

      {/* Modal renouvellement */}
      {renewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !renewing && setRenewModal(null)}>
          <Card className="p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="w-5 h-5 text-[#27698a]" />Renouveler le contrat</h2>
                <p className="text-xs text-slate-500 mt-1">{renewModal.contract.title}</p>
              </div>
              {!renewing && <Button variant="ghost" size="sm" onClick={() => setRenewModal(null)}><X className="w-4 h-4" /></Button>}
            </div>

            {!renewResult ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-50 text-xs">
                  <div className="flex justify-between mb-1"><span className="text-slate-500">Fournisseur</span><span className="font-medium text-slate-900">{renewModal.contract.supplier}</span></div>
                  <div className="flex justify-between mb-1"><span className="text-slate-500">Échéance actuelle</span><span className="font-medium text-slate-900">{formatDate(renewModal.contract.endDate)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Montant actuel</span><span className="font-medium text-slate-900">{formatGNF(renewModal.contract.amount)}</span></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Durée du renouvellement (mois)</label>
                  <div className="flex gap-2">
                    {[6, 12, 24, 36].map(d => (
                      <button key={d} onClick={() => setDuration(d)} className={`px-3 py-1.5 rounded text-xs font-medium ${duration === d ? 'bg-[#27698a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{d} mois</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Nouveau montant (GNF) — optionnel</label>
                  <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder={renewModal.contract.amount.toLocaleString()} className="w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#27698a]" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRenewModal(null)} disabled={renewing}>Annuler</Button>
                  <Button className="flex-1 bg-[#27698a] hover:bg-[#1f5670]" onClick={handleRenew} disabled={renewing}>
                    {renewing ? <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />Renouvellement…</> : 'Confirmer'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-emerald-900 text-sm">Contrat renouvelé avec succès</span></div>
                  <div className="text-xs text-emerald-800 space-y-1">
                    <div className="flex justify-between"><span>Nouvelle échéance</span><span className="font-mono">{formatDate(renewResult.renewed.newEndDate)}</span></div>
                    <div className="flex justify-between"><span>Date de renouvellement</span><span className="font-mono">{formatDate(renewResult.renewed.renewalDate)}</span></div>
                    <div className="flex justify-between"><span>Renouvelé par</span><span>{renewResult.renewed.renewedBy}</span></div>
                    <div className="flex justify-between"><span>Tx hash (audit)</span><span className="font-mono text-[10px]">{renewResult.renewed.txHash.slice(0, 16)}…</span></div>
                  </div>
                </div>
                <Button className="w-full bg-[#27698a] hover:bg-[#1f5670]" onClick={() => setRenewModal(null)}>Fermer</Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Modal détail contrat */}
      {detailId && (
        <ContractDetailModal
          contractId={detailId}
          onClose={() => setDetailId(null)}
          onRenew={canRenew ? (c) => { setDetailId(null); openRenew(c) } : undefined}
        />
      )}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-lg lg:text-xl font-bold text-slate-900 truncate">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function CalendarView({ contracts, month, onMonthChange, onRenew }: {
  contracts: any[]
  month: Date
  onMonthChange: (d: Date) => void
  onRenew?: (c: any) => void
}) {
  // Calcul de la grille du mois
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1)
  const lastDay = new Date(year, m + 1, 0)
  const daysInMonth = lastDay.getDate()
  // 0 = dimanche → on décale pour lundi=0
  const startWeekday = (firstDay.getDay() + 6) % 7

  const monthName = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Indexe les contrats par jour d'échéance
  const contractsByDay: Record<number, any[]> = {}
  for (const c of contracts) {
    const end = new Date(c.endDate)
    if (end.getFullYear() === year && end.getMonth() === m) {
      const day = end.getDate()
      if (!contractsByDay[day]) contractsByDay[day] = []
      contractsByDay[day].push(c)
    }
    // Renouvellement aussi
    if (c.renewalDate) {
      const ren = new Date(c.renewalDate)
      if (ren.getFullYear() === year && ren.getMonth() === m) {
        const day = ren.getDate()
        if (!contractsByDay[day]) contractsByDay[day] = []
        contractsByDay[day].push({ ...c, _isRenewal: true })
      }
    }
  }

  const cells: Array<{ day: number | null; contracts: any[] }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, contracts: [] })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, contracts: contractsByDay[d] || [] })
  while (cells.length % 7 !== 0) cells.push({ day: null, contracts: [] })

  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <Card className="overflow-hidden">
      {/* Header calendrier */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 text-sm capitalize flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#27698a]" />{monthName}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onMonthChange(new Date(year, m - 1, 1))}>‹ Préc</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))}>Aujourd'hui</Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onMonthChange(new Date(year, m + 1, 1))}>Suiv ›</Button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {weekdays.map(w => <div key={w} className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 uppercase text-center">{w}</div>)}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isToday = cell.day === today.getDate() && m === today.getMonth() && year === today.getFullYear()
          return (
            <div key={i} className={`min-h-[80px] border-r border-b border-slate-100 p-1 ${cell.day === null ? 'bg-slate-50/50' : ''} ${isToday ? 'bg-[#27698a]/5' : ''}`}>
              {cell.day !== null && (
                <>
                  <div className={`text-[10px] font-medium mb-1 ${isToday ? 'text-[#27698a] bg-[#27698a]/10 rounded-full w-5 h-5 flex items-center justify-center' : 'text-slate-500'}`}>{cell.day}</div>
                  <div className="space-y-0.5">
                    {cell.contracts.slice(0, 3).map((c, j) => {
                      const isRenewal = c._isRenewal
                      const isExpired = c.status === 'EXPIRE'
                      const isExpiringSoon = c.status === 'EXPIRE_BIENTOT'
                      const color = isRenewal ? 'bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20' :
                                    isExpired ? 'bg-red-50 text-red-700 border-red-200' :
                                    isExpiringSoon ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                      return (
                        <div key={j} className={`text-[9px] px-1 py-0.5 rounded border ${color} cursor-pointer hover:opacity-80 truncate`} title={`${isRenewal ? '🔄 Renouvellement' : '⏰ Échéance'}: ${c.title} (${c.supplier})`}>
                          {isRenewal ? '🔄 ' : '⏰ '}{c.title.slice(0, 16)}{c.title.length > 16 ? '…' : ''}
                        </div>
                      )
                    })}
                    {cell.contracts.length > 3 && <div className="text-[9px] text-slate-400 px-1">+{cell.contracts.length - 3} autre(s)</div>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200"></span>Échéance normale</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-50 border border-amber-200"></span>Expire bientôt (≤30j)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200"></span>Expiré</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#27698a]/10 border border-[#27698a]/20"></span>Date de renouvellement</span>
      </div>
    </Card>
  )
}
