'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileSignature, Boxes, Brain, Database, Activity, Zap, ArrowRight, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface PilotageData {
  modules: any[]
  kpis: {
    contracts: { total: number; actifs: number; montant: number; alertes: number }
    blockchain: { total: number; actifs: number; revoked: number }
    predictive: { lastVersion: string; lastTrainedAt: string | null; trainings: number; avgTurnover: number; avgPerf: number; avgPromo: number }
    audit: { total: number; last24h: number }
    webhooks: { total: number; active: number }
  }
  activitySeries: Array<{ day: string; [key: string]: any }>
}

const MODULE_COLORS: Record<string, string> = {
  CONTRACTS_MGMT: '#27698a',
  BLOCKCHAIN: '#8b5cf6',
  PREDICTIVE: '#10b981',
  DATA_GOVERNANCE: '#f59e0b',
}

export function PilotagePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [data, setData] = useState<PilotageData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/pilotage').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const k = data.kpis

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#27698a]" />Pilotage RH consolidé
          </h1>
          <p className="text-sm text-slate-500 mt-1">Vue agrégée des 4 modules avancés</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />Actualiser
        </Button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={FileSignature} label="Contrats actifs" value={k.contracts.actifs} sub={`${k.contracts.total} total`} color="#27698a" />
        <KpiCard icon={Boxes} label="Certificats actifs" value={k.blockchain.actifs} sub={`${k.blockchain.revoked} révoqués`} color="#8b5cf6" />
        <KpiCard icon={Brain} label="Modèles IA" value={k.predictive.trainings} sub={k.predictive.lastVersion} color="#10b981" />
        <KpiCard icon={Activity} label="Audit (24h)" value={k.audit.last24h} sub={`${k.audit.total} total`} color="#f59e0b" />
        <KpiCard icon={Database} label="Alertes contrats" value={k.contracts.alertes} sub={`${k.contracts.montant.toLocaleString()} GNF`} color="#dc2626" />
        <KpiCard icon={Zap} label="Webhooks actifs" value={k.webhooks.active} sub={`${k.webhooks.total} total`} color="#0ea5e9" />
      </div>

      {/* Graphique d'activité */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4 text-[#27698a]" />Activité des 7 derniers jours
        </h2>
        <p className="text-xs text-slate-500 mb-4">Actions enregistrées par module et par jour</p>
        <div className="h-64">
          {data.activitySeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.activitySeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  {Object.entries(MODULE_COLORS).map(([mod, color]) => (
                    <linearGradient key={mod} id={`grad-${mod}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.entries(MODULE_COLORS).map(([mod, color]) => (
                  <Area key={mod} type="monotone" dataKey={mod} stackId="1" stroke={color} fill={`url(#grad-${mod})`} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Aucune activité enregistrée ces 7 derniers jours. Déclenchez une action (ré-entraîner IA, renouveler contrat, révoquer certificat) pour peupler l'historique.
            </div>
          )}
        </div>
      </Card>

      {/* Cartes des 4 modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contracts */}
        <Card className="p-5 border-l-4 border-l-[#27698a]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#27698a]/10 flex items-center justify-center"><FileSignature className="w-4 h-4 text-[#27698a]" /></div>
              <div><h3 className="font-semibold text-slate-900 text-sm">Gestion contractuelle</h3><p className="text-xs text-slate-500">{k.contracts.total} contrats · {k.contracts.actifs} actifs</p></div>
            </div>
            {onNavigate && <Button variant="ghost" size="sm" onClick={() => onNavigate('contracts-mgmt')}><ArrowRight className="w-3.5 h-3.5" /></Button>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Montant total</div><div className="font-bold text-slate-900 text-[11px]">{k.contracts.montant.toLocaleString()} GNF</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Alertes</div><div className="font-bold text-amber-600">{k.contracts.alertes}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Taux actif</div><div className="font-bold text-emerald-600">{k.contracts.total > 0 ? Math.round((k.contracts.actifs / k.contracts.total) * 100) : 0}%</div></div>
          </div>
        </Card>

        {/* Blockchain */}
        <Card className="p-5 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center"><Boxes className="w-4 h-4 text-purple-600" /></div>
              <div><h3 className="font-semibold text-slate-900 text-sm">Blockchain</h3><p className="text-xs text-slate-500">{k.blockchain.total} certificats · {k.blockchain.actifs} actifs</p></div>
            </div>
            {onNavigate && <Button variant="ghost" size="sm" onClick={() => onNavigate('blockchain')}><ArrowRight className="w-3.5 h-3.5" /></Button>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Actifs</div><div className="font-bold text-emerald-600">{k.blockchain.actifs}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Révoqués</div><div className="font-bold text-red-600">{k.blockchain.revoked}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Taux valide</div><div className="font-bold text-purple-600">{k.blockchain.total > 0 ? Math.round((k.blockchain.actifs / k.blockchain.total) * 100) : 0}%</div></div>
          </div>
        </Card>

        {/* Predictive */}
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><Brain className="w-4 h-4 text-emerald-600" /></div>
              <div><h3 className="font-semibold text-slate-900 text-sm">IA prédictive</h3><p className="text-xs text-slate-500">{k.predictive.trainings} entraînements</p></div>
            </div>
            {onNavigate && <Button variant="ghost" size="sm" onClick={() => onNavigate('predictive')}><ArrowRight className="w-3.5 h-3.5" /></Button>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Turnover moy.</div><div className="font-bold text-red-600">{k.predictive.avgTurnover}%</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Perf moy.</div><div className="font-bold text-emerald-600">{k.predictive.avgPerf}%</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Promo moy.</div><div className="font-bold text-[#27698a]">{k.predictive.avgPromo}%</div></div>
          </div>
          {k.predictive.lastTrainedAt && <p className="text-[10px] text-slate-400 mt-2">Dernier : {k.predictive.lastVersion} · {formatDate(k.predictive.lastTrainedAt)}</p>}
        </Card>

        {/* Audit */}
        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center"><Activity className="w-4 h-4 text-amber-600" /></div>
              <div><h3 className="font-semibold text-slate-900 text-sm">Audit trail</h3><p className="text-xs text-slate-500">{k.audit.total} événements · {k.webhooks.active} webhooks</p></div>
            </div>
            {onNavigate && <Button variant="ghost" size="sm" onClick={() => onNavigate('audit')}><ArrowRight className="w-3.5 h-3.5" /></Button>}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">24h</div><div className="font-bold text-amber-600">{k.audit.last24h}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Total</div><div className="font-bold text-slate-900">{k.audit.total}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Webhooks</div><div className="font-bold text-sky-600">{k.webhooks.active}/{k.webhooks.total}</div></div>
          </div>
        </Card>
      </div>

      {/* Récap rapide */}
      <Card className="p-4 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#27698a] shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">Pilotage consolidé</p>
            <p className="text-xs">Cette vue agrège les KPIs des 4 modules avancés. Chaque action (ré-entraînement IA, renouvellement, révocation, export) est tracée dans le journal d'audit et peut déclencher des webhooks configurables. Cliquez sur les flèches pour accéder au détail de chaque module.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
      </div>
      <div className="text-xl lg:text-2xl font-bold text-slate-900 truncate">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>}
    </Card>
  )
}
