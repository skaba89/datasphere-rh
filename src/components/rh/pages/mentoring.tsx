'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowRight, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'

interface Mentoring { id: string; mentor: any; mentee: any; topic: string; startDate: string; frequency: string; status: string; sessions: number; nextSession: string | null; progress: number }
const FREQ_META: Record<string, string> = { HEBDOMADAIRE: 'Hebdomadaire', BI_MENSUEL: 'Bi-mensuel', MENSUEL: 'Mensuel' }

export function MentoringPage() {
  const [items, setItems] = useState<Mentoring[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/mentoring').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const stats = { total: items.length, actifs: items.filter(i => i.status === 'ACTIF').length, termines: items.filter(i => i.status === 'TERMINE').length, totalSessions: items.reduce((s, i) => s + i.sessions, 0) }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Users className="w-6 h-6 text-[#27698a]" />Mentoring</h1><p className="text-sm text-slate-500 mt-1">Appariement mentors / mentorés et suivi des sessions</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Pairages" value={stats.total} color="#27698a" />
        <KpiCard icon={Users} label="Actifs" value={stats.actifs} color="#478e5e" />
        <KpiCard icon={CheckCircle2} label="Terminés" value={stats.termines} color="#96783c" />
        <KpiCard icon={Calendar} label="Sessions totales" value={stats.totalSessions} color="#b94659" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.map(m => (
          <Card key={m.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className={m.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>{m.status === 'ACTIF' ? '● Actif' : '✓ Terminé'}</Badge>
              <Badge variant="outline" className="text-[10px]">{FREQ_META[m.frequency] || m.frequency}</Badge>
            </div>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">{m.topic}</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1"><div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold ${m.mentor?.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{m.mentor?.prenoms?.[0]}{m.mentor?.nom?.[0]}</div><div><div className="text-xs font-medium text-slate-900">{m.mentor?.nom} {m.mentor?.prenoms}</div><div className="text-[10px] text-slate-500">Mentor</div></div></div>
              <ArrowRight className="w-4 h-4 text-[#27698a] shrink-0" />
              <div className="flex items-center gap-2 flex-1"><div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold ${m.mentee?.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{m.mentee?.prenoms?.[0]}{m.mentee?.nom?.[0]}</div><div><div className="text-xs font-medium text-slate-900">{m.mentee?.nom} {m.mentee?.prenoms}</div><div className="text-[10px] text-slate-500">Mentoré</div></div></div>
            </div>
            <div className="mb-3"><div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Progression</span><span className="font-bold text-slate-700">{m.progress}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${m.progress === 100 ? 'bg-emerald-500' : 'bg-[#27698a]'}`} style={{ width: `${m.progress}%` }} /></div></div>
            <div className="flex items-center justify-between text-xs text-slate-500"><span>{m.sessions} session{m.sessions > 1 ? 's' : ''} · Depuis {formatDate(m.startDate)}</span>{m.nextSession && <span className="flex items-center gap-1 text-[#27698a]"><Calendar className="w-3 h-3" />Prochaine : {formatDate(m.nextSession)}</span>}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
