'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Target, Star, TrendingUp, Award, Plus, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface Employee { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }

interface Objective {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  progress: number
  weight: number
  dueDate: string | null
  employee: Employee
}

interface Evaluation {
  id: string
  period: string
  type: string
  globalRating: number
  strengths: string | null
  improvements: string | null
  goals: string | null
  managerNotes: string | null
  status: string
  evaluatedAt: string | null
  employee: Employee
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  EN_COURS: { label: 'En cours', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  ATTEINT: { label: 'Atteint', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PARTIEL: { label: 'Partiel', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  NON_ATTEINT: { label: 'Non atteint', color: 'bg-red-100 text-red-700 border-red-200' },
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  INDIVIDUAL: { label: 'Individuel', color: 'bg-[#27698a]/10 text-[#27698a]' },
  TEAM: { label: 'Équipe', color: 'bg-purple-100 text-purple-700' },
  COMPANY: { label: 'Entreprise', color: 'bg-violet-100 text-violet-700' },
}

export function EvaluationsPage() {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'objectives' | 'evaluations'>('objectives')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardType, setWizardType] = useState<'objective' | 'evaluation'>('objective')

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/objectives').then(r => r.json()),
      fetch('/api/evaluations').then(r => r.json()),
    ]).then(([objs, evals]) => {
      setObjectives(objs)
      setEvaluations(evals)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetch('/api/objectives').then(r => r.json()),
      fetch('/api/evaluations').then(r => r.json()),
    ]).then(([objs, evals]) => {
      if (mounted) { setObjectives(objs); setEvaluations(evals); setLoading(false) }
    }).catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const stats = {
    totalObjectives: objectives.length,
    inProgress: objectives.filter(o => o.status === 'EN_COURS').length,
    achieved: objectives.filter(o => o.status === 'ATTEINT').length,
    totalEvaluations: evaluations.length,
    avgRating: evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.globalRating, 0) / evaluations.length
      : 0,
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#27698a]" />
            Évaluations &amp; Objectifs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Suivi des performances, entretiens annuels et objectifs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setWizardType('objective'); setWizardOpen(true) }}>
            <Target className="w-4 h-4 mr-2" />
            Nouvel objectif
          </Button>
          <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => { setWizardType('evaluation'); setWizardOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle évaluation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Target} label="Objectifs" value={stats.totalObjectives} color="#27698a" sub={`${stats.inProgress} en cours`} />
        <StatCard icon={CheckCircle2} label="Atteints" value={stats.achieved} color="#478e5e" sub={`${stats.totalObjectives > 0 ? Math.round(stats.achieved / stats.totalObjectives * 100) : 0}% de réussite`} />
        <StatCard icon={Award} label="Évaluations" value={stats.totalEvaluations} color="#96783c" sub="entretiens complétés" />
        <StatCard icon={Star} label="Note moyenne" value={stats.avgRating.toFixed(1)} color="#b94659" sub="sur 5" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('objectives')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'objectives' ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Objectifs ({objectives.length})
        </button>
        <button
          onClick={() => setTab('evaluations')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'evaluations' ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Évaluations ({evaluations.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'objectives' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {objectives.map(obj => {
            const status = STATUS_META[obj.status] || STATUS_META.EN_COURS
            const type = TYPE_META[obj.type] || TYPE_META.INDIVIDUAL
            return (
              <Card key={obj.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className={type.color}>{type.label}</Badge>
                  <Badge variant="outline" className={status.color}>{status.label}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{obj.title}</h3>
                {obj.description && <p className="text-xs text-slate-600 mb-2 line-clamp-2">{obj.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-8 h-8 rounded-full bg-[#27698a] text-white flex items-center justify-center text-xs font-bold">
                    {obj.employee.prenoms[0]}{obj.employee.nom[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-slate-900 truncate">{obj.employee.nom} {obj.employee.prenoms}</div>
                    <div className="text-[10px] text-slate-500 truncate">{obj.employee.poste}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Progression</span>
                    <span className="font-medium text-slate-700">{obj.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        obj.status === 'ATTEINT' ? 'bg-emerald-500' :
                        obj.status === 'PARTIEL' ? 'bg-amber-500' :
                        obj.status === 'NON_ATTEINT' ? 'bg-red-500' :
                        'bg-[#27698a]'
                      }`}
                      style={{ width: `${obj.progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Pondération: {obj.weight}/5</span>
                  {obj.dueDate && <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />{obj.dueDate}</span>}
                </div>
              </Card>
            )
          })}
          {objectives.length === 0 && (
            <Card className="col-span-full p-8 text-center text-slate-400">
              <Target className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Aucun objectif défini</p>
            </Card>
          )}
        </div>
      )}

      {tab === 'evaluations' && (
        <div className="space-y-3">
          {evaluations.map(ev => (
            <Card key={ev.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                  ev.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'
                }`}>
                  {ev.employee.prenoms[0]}{ev.employee.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{ev.employee.nom} {ev.employee.prenoms}</h3>
                      <p className="text-xs text-slate-500">{ev.employee.poste} · {ev.employee.matricule}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20">{ev.type}</Badge>
                      <Badge variant="outline" className="bg-slate-100 text-slate-700">{ev.period}</Badge>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-4 h-4 ${n <= ev.globalRating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                    {ev.strengths && (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                        <div className="text-xs font-semibold text-emerald-700 mb-1">✓ Points forts</div>
                        <p className="text-xs text-emerald-900">{ev.strengths}</p>
                      </div>
                    )}
                    {ev.improvements && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200">
                        <div className="text-xs font-semibold text-amber-700 mb-1">⚠ À améliorer</div>
                        <p className="text-xs text-amber-900">{ev.improvements}</p>
                      </div>
                    )}
                    {ev.goals && (
                      <div className="p-2 rounded bg-sky-50 border border-sky-200">
                        <div className="text-xs font-semibold text-sky-700 mb-1">🎯 Objectifs futurs</div>
                        <p className="text-xs text-sky-900">{ev.goals}</p>
                      </div>
                    )}
                    {ev.managerNotes && (
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="text-xs font-semibold text-slate-700 mb-1">Notes manager</div>
                        <p className="text-xs text-slate-900">{ev.managerNotes}</p>
                      </div>
                    )}
                  </div>
                  {ev.evaluatedAt && (
                    <p className="text-xs text-slate-400 mt-2">
                      Évalué le {new Date(ev.evaluatedAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {evaluations.length === 0 && (
            <Card className="p-8 text-center text-slate-400">
              <Award className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Aucune évaluation complétée</p>
            </Card>
          )}
        </div>
      )}

      {wizardOpen && (
        <EvaluationWizard
          type={wizardType}
          onClose={() => setWizardOpen(false)}
          onCreated={() => { setWizardOpen(false); load() }}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string | number; color: string; sub: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-[10px] text-slate-400">{sub}</div>
        </div>
      </div>
    </Card>
  )
}

function EvaluationWizard({ type, onClose, onCreated }: { type: 'objective' | 'evaluation'; onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    type: 'INDIVIDUAL',
    weight: '3',
    dueDate: '',
    period: '2026-annual',
    evalType: 'ANNUELLE',
    globalRating: '3',
    strengths: '',
    improvements: '',
    goals: '',
    managerNotes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.employeeId) { toast.error('Sélectionne un employé'); return }
    setLoading(true)
    const endpoint = type === 'objective' ? '/api/objectives' : '/api/evaluations'
    const body = type === 'objective'
      ? { employeeId: form.employeeId, title: form.title, description: form.description, type: form.type, weight: form.weight, dueDate: form.dueDate }
      : { employeeId: form.employeeId, period: form.period, type: form.evalType, globalRating: form.globalRating, strengths: form.strengths, improvements: form.improvements, goals: form.goals, managerNotes: form.managerNotes }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success(type === 'objective' ? 'Objectif créé' : 'Évaluation enregistrée')
        onCreated()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'objective' ? <Target className="w-5 h-5 text-[#27698a]" /> : <Award className="w-5 h-5 text-[#27698a]" />}
            {type === 'objective' ? 'Nouvel objectif' : 'Nouvelle évaluation'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Employé *</Label>
            <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'objective' ? (
            <>
              <div>
                <Label className="text-sm">Titre *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Augmenter les ventes de 20%" />
              </div>
              <div>
                <Label className="text-sm">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm">Type</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
                      <SelectItem value="TEAM">Équipe</SelectItem>
                      <SelectItem value="COMPANY">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Pondération (1-5)</Label>
                  <Input type="number" min="1" max="5" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Échéance</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Période</Label>
                  <Select value={form.period} onValueChange={v => setForm({ ...form, period: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2026-S1">2026 S1</SelectItem>
                      <SelectItem value="2026-S2">2026 S2</SelectItem>
                      <SelectItem value="2026-annual">2026 Annuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Type</Label>
                  <Select value={form.evalType} onValueChange={v => setForm({ ...form, evalType: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANNUELLE">Annuelle</SelectItem>
                      <SelectItem value="SEMESTRIELLE">Semestrielle</SelectItem>
                      <SelectItem value="PROBATION">Fin de période essai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm">Note globale (0-5)</Label>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm({ ...form, globalRating: String(n) })}>
                      <Star className={`w-6 h-6 ${n <= Number(form.globalRating) ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">Points forts</Label>
                <Textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-sm">À améliorer</Label>
                <Textarea value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-sm">Objectifs futurs</Label>
                <Textarea value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-sm">Notes manager</Label>
                <Textarea value={form.managerNotes} onChange={e => setForm({ ...form, managerNotes: e.target.value })} className="mt-1" rows={2} />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {type === 'objective' ? 'Créer objectif' : 'Enregistrer évaluation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
