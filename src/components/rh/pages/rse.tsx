'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Leaf, Users, Shield, TrendingUp, CheckCircle2, Clock } from 'lucide-react'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Data { kpis: any; pillars: any[]; actions: any[] }
const PILLAR_META: Record<string, { label: string; icon: React.ElementType; color: string }> = { ENVIRONNEMENT: { label: 'Environnement', icon: Leaf, color: 'bg-emerald-100 text-emerald-700' }, SOCIAL: { label: 'Social', icon: Users, color: 'bg-[#27698a]/10 text-[#27698a]' }, GOUVERNANCE: { label: 'Gouvernance', icon: Shield, color: 'bg-purple-100 text-purple-700' } }
const STATUS_META: Record<string, { label: string; color: string }> = { ATTEINT: { label: 'Atteint', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, EN_COURS: { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200' } }

export function RSEPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/rse').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Leaf className="w-6 h-6 text-[#27698a]" />Durabilité &amp; RSE</h1><p className="text-sm text-slate-500 mt-1">Impact social, environnemental et gouvernance (ESG)</p></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Leaf} label="Empreinte carbone" value={`${data.kpis.carbonFootprint} tCO₂`} color="#478e5e" sub={`${data.kpis.carbonPerEmployee} tCO₂/employé`} />
        <KpiCard icon={Leaf} label="Énergie verte" value={`${data.kpis.greenEnergy}%`} color="#27698a" sub="panneaux solaires" />
        <KpiCard icon={Users} label="Recrutement local" value={`${data.kpis.localHiring}%`} color="#96783c" sub="employés guinéens" />
        <KpiCard icon={TrendingUp} label="Écart salarial H/F" value={`${data.kpis.genderPayGap}%`} color={data.kpis.genderPayGap <= 0 ? '#478e5e' : '#b94659'} sub="négatif = favorable aux femmes" />
      </div>

      {/* 3 piliers ESG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(['ENVIRONNEMENT', 'SOCIAL', 'GOUVERNANCE'] as const).map(pillar => {
          const meta = PILLAR_META[pillar]
          const items = data.pillars.filter((p: any) => p.pillar === pillar)
          return (
            <Card key={pillar} className="p-5">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}><meta.icon className="w-4 h-4" /></div>{meta.label}</h2>
              <div className="space-y-3">
                {items.map((p: any) => { const status = STATUS_META[p.status] || STATUS_META.EN_COURS; return (
                  <div key={p.id} className="p-2 rounded border border-slate-200">
                    <div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-slate-900">{p.name}</span><Badge variant="outline" className={`text-[9px] ${status.color}`}>{status.label}</Badge></div>
                    <div className="flex items-center gap-2 text-xs"><span className="font-bold text-slate-700">{p.value}</span><span className="text-slate-400">/ {p.target}</span></div>
                    <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-[#27698a]'}`} style={{ width: `${p.progress}%` }} /></div>
                    <p className="text-[10px] text-slate-400 mt-1">{p.desc}</p>
                  </div>
                )})}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Actions RSE */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Leaf className="w-4 h-4 text-[#27698a]" />Actions RSE ({data.actions.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.actions.map((a: any) => {
            const meta = PILLAR_META[a.pillar] || PILLAR_META.SOCIAL
            return (
              <div key={a.id} className="p-3 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2"><div className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.color}`}><meta.icon className="w-3.5 h-3.5" /></div><Badge variant="outline" className="text-[9px]">{meta.label}</Badge></div>
                <h3 className="font-medium text-sm text-slate-900">{a.name}</h3>
                <div className="mt-2 space-y-1 text-xs text-slate-600"><div><span className="text-slate-400">Impact :</span> {a.impact}</div><div><span className="text-slate-400">Budget :</span> <span className="font-mono font-bold">{formatGNF(a.budget)}</span></div><div><span className="text-slate-400">Date :</span> {formatDate(a.date)}</div></div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string; color: string; sub?: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-start justify-between"><div className="min-w-0"><p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p><p className="text-base lg:text-lg font-bold text-slate-900 mt-1 truncate">{value}</p>{sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}</div><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div></div></Card> }
