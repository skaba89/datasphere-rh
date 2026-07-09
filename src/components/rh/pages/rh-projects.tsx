'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, CheckCircle2, Clock, AlertCircle, Users, DollarSign, Calendar } from 'lucide-react'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Project { id: string; name: string; desc: string; status: string; progress: number; startDate: string; endDate: string; budget: number; spent: number; manager: string; team: number; milestones: any[] }

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  EN_COURS: { label: 'En cours', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Clock },
  TERMINE: { label: 'Terminé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  PLANIFIE: { label: 'Planifié', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
}

export function RHProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/rh-projects').then(r => r.json()).then(d => { if (m) { setProjects(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const stats = { total: projects.length, enCours: projects.filter(p => p.status === 'EN_COURS').length, termine: projects.filter(p => p.status === 'TERMINE').length, budgetTotal: projects.reduce((s, p) => s + p.budget, 0) }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><FolderKanban className="w-6 h-6 text-[#27698a]" />Projets RH</h1><p className="text-sm text-slate-500 mt-1">Transformation, digitalisation et changement</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={FolderKanban} label="Total projets" value={stats.total} color="#27698a" />
        <KpiCard icon={Clock} label="En cours" value={stats.enCours} color="#96783c" />
        <KpiCard icon={CheckCircle2} label="Terminés" value={stats.termine} color="#478e5e" />
        <KpiCard icon={DollarSign} label="Budget total" value={formatGNF(stats.budgetTotal)} color="#b94659" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map(p => {
          const status = STATUS_META[p.status] || STATUS_META.EN_COURS
          const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0
          return (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div><h3 className="font-semibold text-slate-900">{p.name}</h3><p className="text-xs text-slate-500 mt-0.5">{p.desc}</p></div>
                <Badge variant="outline" className={status.color}><status.icon className="w-3 h-3 mr-1" />{status.label}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(p.startDate)} → {formatDate(p.endDate)}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.team} membres</span>
                <span>Manager : {p.manager}</span>
              </div>
              <div className="mt-3"><div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Progression</span><span className="font-bold text-slate-700">{p.progress}%</span></div><div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-[#27698a]'}`} style={{ width: `${p.progress}%` }} /></div></div>
              <div className="mt-2"><div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-500">Budget</span><span className="font-mono text-slate-700">{formatGNF(p.spent)} / {formatGNF(p.budget)} ({budgetPct}%)</span></div><div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${budgetPct > 90 ? 'bg-red-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPct}%` }} /></div></div>
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-600 mb-2">Jalons</div>
                <div className="flex flex-wrap gap-1">{p.milestones.map((m, i) => <Badge key={i} variant="outline" className={`text-[10px] ${m.done ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>{m.done ? '✓' : '○'} {m.name}</Badge>)}</div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-lg lg:text-xl font-bold text-slate-900 truncate">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
