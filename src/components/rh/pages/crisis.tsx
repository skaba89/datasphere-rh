'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertOctagon, Phone, Mail, CheckCircle2, Clock, AlertTriangle, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'

interface Data { plans: any[]; contacts: any[]; drills: any[] }
const SEV_META: Record<string, { label: string; color: string }> = { CRITIQUE: { label: 'Critique', color: 'bg-red-100 text-red-700 border-red-200' }, HAUTE: { label: 'Haute', color: 'bg-amber-100 text-amber-700 border-amber-200' }, MOYENNE: { label: 'Moyenne', color: 'bg-sky-100 text-sky-700 border-sky-200' } }
const STATUS_META: Record<string, { label: string; color: string }> = { A_JOUR: { label: 'À jour', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, A_VERIFIER: { label: 'À vérifier', color: 'bg-amber-50 text-amber-700 border-amber-200' } }
const DRILL_RESULT: Record<string, { label: string; color: string }> = { REUSSI: { label: 'Réussi', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, PARTIEL: { label: 'Partiel', color: 'bg-amber-50 text-amber-700 border-amber-200' }, ECHEC: { label: 'Échec', color: 'bg-red-50 text-red-700 border-red-200' } }

export function CrisisPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'plans' | 'contacts' | 'drills'>('plans')
  useEffect(() => { let m = true; fetch('/api/crisis').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const stats = { total: data.plans.length, aJour: data.plans.filter(p => p.status === 'A_JOUR').length, aVerifier: data.plans.filter(p => p.status === 'A_VERIFIER').length, contacts: data.contacts.length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><AlertOctagon className="w-6 h-6 text-[#27698a]" />Gestion de crise</h1><p className="text-sm text-slate-500 mt-1">Plans de continuité, contacts d'urgence et exercices</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={AlertOctagon} label="Plans de crise" value={stats.total} color="#27698a" />
        <KpiCard icon={CheckCircle2} label="À jour" value={stats.aJour} color="#478e5e" />
        <KpiCard icon={Clock} label="À vérifier" value={stats.aVerifier} color="#96783c" />
        <KpiCard icon={Phone} label="Contacts urgence" value={stats.contacts} color="#b94659" />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[{ k: 'plans', l: 'Plans', i: AlertOctagon }, { k: 'contacts', l: 'Contacts', i: Phone }, { k: 'drills', l: 'Exercices', i: Activity }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.k ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}><t.i className="w-4 h-4 inline mr-2" />{t.l}</button>
        ))}
      </div>

      {tab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.plans.map((p: any) => {
            const sev = SEV_META[p.severity] || SEV_META.MOYENNE
            const status = STATUS_META[p.status] || STATUS_META.A_VERIFIER
            const pct = Math.round((p.completedSteps / p.steps) * 100)
            return (
              <Card key={p.id} className={`p-4 ${p.status === 'A_VERIFIER' ? 'border-l-4 border-l-amber-500' : ''}`}>
                <div className="flex items-start justify-between mb-2"><Badge variant="outline" className={sev.color + ' text-[10px]'}>{sev.label}</Badge><Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge></div>
                <h3 className="font-semibold text-slate-900 text-sm">{p.name}</h3><p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                <div className="mt-3"><div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">{p.completedSteps}/{p.steps} étapes</span><span className="font-bold text-slate-700">{pct}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : 'bg-[#27698a]'}`} style={{ width: `${pct}%` }} /></div></div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400"><span>Responsable : {p.owner}</span><span>MàJ : {formatDate(p.lastUpdate)}</span></div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.contacts.map((c: any) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${c.available === '24/7' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}><Phone className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm">{c.name}</h3><div className="text-xs text-slate-500">{c.role}</div>
                  <div className="space-y-1 mt-2 text-xs"><div className="flex items-center gap-1.5 text-slate-700"><Phone className="w-3 h-3" />{c.phone}</div>{c.email && <div className="flex items-center gap-1.5 text-slate-700 truncate"><Mail className="w-3 h-3" />{c.email}</div>}</div>
                  <Badge variant="outline" className={`text-[10px] mt-2 ${c.available === '24/7' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-500'}`}>{c.available === '24/7' ? '● 24/7' : '○ Heures ouvrées'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'drills' && (
        <div className="space-y-3">
          {data.drills.map((d: any) => {
            const result = DRILL_RESULT[d.result] || DRILL_RESULT.PARTIEL
            return (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${result.color}`}><Activity className="w-4 h-4" /></div><h3 className="font-semibold text-slate-900 text-sm">{d.name}</h3></div><Badge variant="outline" className={`text-[10px] ${result.color}`}>{result.label}</Badge></div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2"><span>{formatDate(d.date)}</span><span>{d.participants} participants</span><span>Durée : {d.duration}</span></div>
                {d.notes && <div className="mt-2 p-2 rounded bg-slate-50 text-xs text-slate-600 italic">{d.notes}</div>}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
