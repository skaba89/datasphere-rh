'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Heart, Brain, Globe, CheckCircle2, Clock, TrendingUp, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'

interface Data { kpis: any; initiatives: any[]; stats: any }
const CAT_META: Record<string, { label: string; color: string }> = { POLITIQUE: { label: 'Politique', color: 'bg-[#27698a]/10 text-[#27698a]' }, HANDICAP: { label: 'Handicap', color: 'bg-purple-100 text-purple-700' }, FORMATION: { label: 'Formation', color: 'bg-amber-100 text-amber-700' }, GENRE: { label: 'Genre', color: 'bg-pink-100 text-pink-700' }, CULTURE: { label: 'Culture', color: 'bg-emerald-100 text-emerald-700' } }
const STATUS_META: Record<string, { label: string; color: string }> = { DEPLOYE: { label: 'Déployé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, EN_COURS: { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200' } }

export function DiversityPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/diversity').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Heart className="w-6 h-6 text-[#27698a]" />Diversité &amp; Inclusion</h1><p className="text-sm text-slate-500 mt-1">Inclusion, handicap, équité genre et diversité culturelle</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Taux féminin" value={`${data.kpis.genderRatio}%`} color="#b94659" sub={`${data.stats.F} femmes / ${data.stats.M} hommes`} />
        <KpiCard icon={TrendingUp} label="Femmes encadrement" value={`${data.kpis.womenInManagement}%`} color="#96783c" sub="postes de direction" />
        <KpiCard icon={Brain} label="Indice diversité" value={`${data.kpis.diversityIndex}/100`} color="#27698a" sub="score global D&I" />
        <KpiCard icon={Heart} label="Score inclusion" value={`${data.kpis.inclusionScore}/5`} color="#478e5e" sub="enquête employés" />
      </div>

      {/* Répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#27698a]" />Répartition par genre</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32"><svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="16" /><circle cx="64" cy="64" r="56" fill="none" stroke="#27698a" strokeWidth="16" strokeDasharray={`${2 * Math.PI * 56 * (data.stats.M / (data.stats.M + data.stats.F))} ${2 * Math.PI * 56}`} strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><div className="text-2xl font-bold text-slate-900">{data.stats.M + data.stats.F}</div><div className="text-xs text-slate-500">employés</div></div></div></div>
            <div className="space-y-2 flex-1"><div className="flex items-center justify-between p-2 rounded bg-[#27698a]/5"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#27698a]"></div><span className="text-sm font-medium">Hommes</span></div><span className="text-sm font-bold">{data.stats.M} · {Math.round(data.stats.M / (data.stats.M + data.stats.F) * 100)}%</span></div><div className="flex items-center justify-between p-2 rounded bg-pink-50"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pink-500"></div><span className="text-sm font-medium">Femmes</span></div><span className="text-sm font-bold">{data.stats.F} · {Math.round(data.stats.F / (data.stats.M + data.stats.F) * 100)}%</span></div></div>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-[#27698a]" />Pyramide des âges</h2>
          <div className="space-y-2">{Object.entries(data.stats.ageGroups).map(([group, count]: [string, any]) => { const pct = data.stats.totalEmployees > 0 ? (count / data.stats.totalEmployees) * 100 : 0; return <div key={group}><div className="flex items-center justify-between text-xs mb-1"><span className="font-medium text-slate-700">{group} ans</span><span className="text-slate-500">{count} · {pct.toFixed(0)}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#27698a] to-[#478e5e] rounded-full" style={{ width: `${pct}%` }} /></div></div> })}</div>
        </Card>
      </div>

      {/* Initiatives */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-[#27698a]" />Initiatives D&amp;I ({data.initiatives.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.initiatives.map((init: any) => {
            const cat = CAT_META[init.category] || CAT_META.POLITIQUE
            const status = STATUS_META[init.status] || STATUS_META.EN_COURS
            return (
              <div key={init.id} className="p-3 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2"><Badge variant="outline" className={cat.color + ' text-[10px]'}>{cat.label}</Badge><Badge variant="outline" className={`text-[10px] inline-flex items-center gap-1 ${status.color}`}>{init.status === 'DEPLOYE' && <Check className="w-3 h-3" />}{status.label}</Badge></div>
                <h3 className="font-medium text-sm text-slate-900">{init.title}</h3><p className="text-xs text-slate-500 mt-1">{init.desc}</p>
                <div className="mt-2"><div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-400">Progression</span><span className="font-bold text-slate-700">{init.progress}%</span></div><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${init.progress === 100 ? 'bg-emerald-500' : 'bg-[#27698a]'}`} style={{ width: `${init.progress}%` }} /></div></div>
                <div className="text-xs text-slate-400 mt-2">Responsable : {init.owner} · Depuis {formatDate(init.date)}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string; color: string; sub?: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-start justify-between"><div className="min-w-0"><p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p><p className="text-base lg:text-lg font-bold text-slate-900 mt-1 truncate">{value}</p>{sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}</div><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div></div></Card> }
