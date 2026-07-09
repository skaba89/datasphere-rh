'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'

interface Risk { id: string; category: string; title: string; probability: string; impact: string; score: number; status: string; owner: string; mitigation: string; deadline: string }

const CAT_META: Record<string, { label: string; color: string }> = {
  JURIDIQUE: { label: 'Juridique', color: 'bg-red-100 text-red-700' },
  TURNOVER: { label: 'Turnover', color: 'bg-amber-100 text-amber-700' },
  CONFORMITE: { label: 'Conformité', color: 'bg-purple-100 text-purple-700' },
  FINANCIER: { label: 'Financier', color: 'bg-sky-100 text-sky-700' },
  RH: { label: 'RH', color: 'bg-emerald-100 text-emerald-700' },
  SECURITE: { label: 'Sécurité', color: 'bg-rose-100 text-rose-700' },
}
const PROB_META: Record<string, { label: string; color: string }> = { CERTAIN: { label: 'Certain', color: 'text-red-600 font-bold' }, HAUTE: { label: 'Haute', color: 'text-red-500' }, MOYENNE: { label: 'Moyenne', color: 'text-amber-500' }, BASSE: { label: 'Basse', color: 'text-slate-500' } }
const IMPACT_META: Record<string, { label: string; color: string }> = { TRES_HAUT: { label: 'Très haut', color: 'text-red-600 font-bold' }, HAUT: { label: 'Haut', color: 'text-red-500' }, MOYEN: { label: 'Moyen', color: 'text-amber-500' }, BAS: { label: 'Bas', color: 'text-slate-500' } }
const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = { OUVERT: { label: 'Ouvert', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle }, EN_COURS: { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock }, SURVEILLANCE: { label: 'Surveillance', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Clock }, RESOLU: { label: 'Résolu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 } }

export function RisksPage() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/risks').then(r => r.json()).then(d => { if (m) { setRisks(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const sorted = [...risks].sort((a, b) => b.score - a.score)
  const stats = { total: risks.length, ouverts: risks.filter(r => r.status === 'OUVERT').length, enCours: risks.filter(r => r.status === 'EN_COURS').length, resolus: risks.filter(r => r.status === 'RESOLU').length }
  const maxScore = Math.max(...risks.map(r => r.score), 20)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-[#27698a]" />Gestion des risques</h1><p className="text-sm text-slate-500 mt-1">Cartographie, évaluation et plans de mitigation</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={ShieldAlert} label="Total risques" value={stats.total} color="#27698a" />
        <KpiCard icon={AlertTriangle} label="Ouverts" value={stats.ouverts} color="#b94659" />
        <KpiCard icon={Clock} label="En cours" value={stats.enCours} color="#96783c" />
        <KpiCard icon={CheckCircle2} label="Résolus" value={stats.resolus} color="#478e5e" />
      </div>

      {/* Matrice probabilité × impact */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Matrice des risques</h2>
        <div className="grid grid-cols-5 gap-1 text-xs">
          <div></div><div className="text-center font-semibold text-slate-500">Bas</div><div className="text-center font-semibold text-slate-500">Moyen</div><div className="text-center font-semibold text-slate-500">Haut</div><div className="text-center font-semibold text-slate-500">Très haut</div>
          {['CERTAIN', 'HAUTE', 'MOYENNE', 'BASSE'].map(prob => (
            <>
              <div className="flex items-center font-semibold text-slate-500 text-[10px]">{PROB_META[prob]?.label}</div>
              {['BAS', 'MOYEN', 'HAUT', 'TRES_HAUT'].map(imp => {
                const cellRisks = risks.filter(r => r.probability === prob && r.impact === imp)
                const score = (prob === 'CERTAIN' ? 4 : prob === 'HAUTE' ? 3 : prob === 'MOYENNE' ? 2 : 1) * (imp === 'TRES_HAUT' ? 4 : imp === 'HAUT' ? 3 : imp === 'MOYEN' ? 2 : 1)
                const bg = score >= 12 ? 'bg-red-100' : score >= 8 ? 'bg-amber-100' : score >= 4 ? 'bg-sky-100' : 'bg-emerald-100'
                return <div key={imp} className={`p-2 rounded ${bg} min-h-[50px] flex flex-wrap gap-1 content-start`}>{cellRisks.map(r => <span key={r.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-slate-300 text-slate-700 cursor-pointer" title={r.title}>{r.title.slice(0, 15)}...</span>)}</div>
              })}
            </>
          ))}
        </div>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {sorted.map(r => {
          const cat = CAT_META[r.category] || CAT_META.RH
          const prob = PROB_META[r.probability] || PROB_META.MOYENNE
          const imp = IMPACT_META[r.impact] || IMPACT_META.MOYEN
          const status = STATUS_META[r.status] || STATUS_META.OUVERT
          const scoreColor = r.score >= 12 ? 'text-red-600' : r.score >= 8 ? 'text-amber-600' : 'text-sky-600'
          return (
            <Card key={r.id} className={`p-4 ${r.score >= 12 ? 'border-l-4 border-l-red-500' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}><ShieldAlert className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1"><Badge variant="outline" className={cat.color + ' text-[10px]'}>{cat.label}</Badge><Badge variant="outline" className={`text-[10px] ${status.color}`}><status.icon className="w-2.5 h-2.5 mr-0.5" />{status.label}</Badge></div>
                  <h3 className="font-semibold text-slate-900 text-sm">{r.title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs"><div><span className="text-slate-400">Probabilité</span><div className={prob.color}>{prob.label}</div></div><div><span className="text-slate-400">Impact</span><div className={imp.color}>{imp.label}</div></div><div><span className="text-slate-400">Score</span><div className={`font-bold ${scoreColor}`}>{r.score}/20</div></div><div><span className="text-slate-400">Responsable</span><div className="text-slate-700">{r.owner}</div></div></div>
                  <div className="mt-2 p-2 rounded bg-emerald-50 text-xs text-emerald-800"><b>Mitigation :</b> {r.mitigation}</div>
                  <div className="text-xs text-slate-400 mt-1">Échéance : {formatDate(r.deadline)}</div>
                </div>
                <div className="shrink-0"><div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${scoreColor} border-2 ${r.score >= 12 ? 'border-red-300 bg-red-50' : r.score >= 8 ? 'border-amber-300 bg-amber-50' : 'border-sky-300 bg-sky-50'}`}>{r.score}</div></div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
