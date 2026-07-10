'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, Lightbulb, Heart, Vote, ThumbsUp, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate, formatGNF } from '@/lib/utils-rh'

interface Data { representatives: any[]; meetings: any[]; suggestions: any[]; socialActions: any[] }

export function CSEPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'reps' | 'meetings' | 'suggestions' | 'social'>('reps')
  useEffect(() => { let m = true; fetch('/api/cse').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-[#27698a]" />CSE / IRP</h1><p className="text-sm text-slate-500 mt-1">Comité Social d'Entreprise &amp; Institution Représentative du Personnel</p></div>

      <div className="flex gap-2 border-b border-slate-200 flex-wrap">
        {[{ k: 'reps', l: 'Représentants', i: Users }, { k: 'meetings', l: 'Réunions', i: Calendar }, { k: 'suggestions', l: 'Suggestions', i: Lightbulb }, { k: 'social', l: 'Œuvres sociales', i: Heart }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.k ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}><t.i className="w-4 h-4 inline mr-2" />{t.l}</button>
        ))}
      </div>

      {tab === 'reps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.representatives.map((r: any) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between mb-2"><div className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold ${r.role.includes('CSE') ? 'bg-[#27698a]' : 'bg-[#478e5e]'}`}>{r.name[0]}{r.name.split(' ')[1]?.[0]}</div><Badge variant="outline" className={r.role.includes('CSE') ? 'bg-[#27698a]/10 text-[#27698a]' : 'bg-emerald-50 text-emerald-700'}>{r.role}</Badge></div>
              <h3 className="font-semibold text-slate-900 text-sm">{r.name}</h3><div className="text-xs text-slate-500 mt-1">Département : {r.department}</div>
              <div className="flex items-center justify-between mt-2 text-xs"><span className="text-slate-400">Mandat {r.mandate}</span><span className="flex items-center gap-1 text-[#27698a]"><Vote className="w-3 h-3" />{r.votes} voix</span></div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'meetings' && (
        <div className="space-y-3">
          {data.meetings.map((m: any) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><Badge variant="outline" className={m.type === 'CSE' ? 'bg-[#27698a]/10 text-[#27698a]' : 'bg-emerald-50 text-emerald-700'}>{m.type}</Badge><Badge variant="outline" className={m.status === 'PLANIFIE' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>{m.status === 'PLANIFIE' ? 'Planifiée' : 'Terminée'}</Badge></div><span className="text-xs text-slate-400">{m.attendees} participants</span></div>
              <h3 className="font-semibold text-slate-900 text-sm">{m.title}</h3><div className="text-xs text-slate-500 mt-1"><Calendar className="w-3 h-3 inline mr-1" />{formatDate(m.date)}</div><div className="mt-2 p-2 rounded bg-slate-50 text-xs text-slate-700"><b>Ordre du jour :</b> {m.agenda}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'suggestions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.suggestions.map((s: any) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between mb-2"><Badge variant="outline" className="text-[10px]">{s.category}</Badge><Badge variant="outline" className={`text-[10px] inline-flex items-center gap-1 ${s.status === 'RESOLU' ? 'bg-emerald-50 text-emerald-700' : s.status === 'EN_COURS' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>{s.status === 'RESOLU' ? <><Check className="w-3 h-3" /> Résolu</> : s.status === 'EN_COURS' ? 'En cours' : 'En attente'}</Badge></div>
              <h3 className="font-semibold text-slate-900 text-sm">{s.title}</h3><p className="text-xs text-slate-500 mt-1">{s.desc}</p>
              <div className="flex items-center justify-between mt-3"><span className="text-xs text-slate-400">Par : {s.author}</span><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success('Vote enregistré !')}><ThumbsUp className="w-3 h-3 mr-1" />{s.votes}</Button></div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'social' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.socialActions.map((sa: any) => (
            <Card key={sa.id} className="p-4">
              <div className="flex items-start justify-between mb-2"><div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#27698a]/10 text-[#27698a]"><Heart className="w-4 h-4" /></div><Badge variant="outline" className={sa.status === 'PLANIFIE' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}>{sa.status === 'PLANIFIE' ? 'Planifié' : 'Terminé'}</Badge></div>
              <h3 className="font-semibold text-slate-900 text-sm">{sa.name}</h3>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs"><div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Budget</div><div className="font-bold text-slate-900">{formatGNF(sa.budget)}</div></div><div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Bénéficiaires</div><div className="font-bold text-slate-900">{sa.beneficiaries}</div></div></div>
              <div className="text-xs text-slate-400 mt-2"><Calendar className="w-3 h-3 inline mr-1" />{formatDate(sa.date)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
