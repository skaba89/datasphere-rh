'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Brain, Plus, Loader2, Star, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface SkillData {
  skills: Array<{
    id: string
    name: string
    category: string
    description: string | null
    assessments: Array<{ level: number; targetLevel: number; employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null } }>
  }>
  matrix: Record<string, Record<string, { level: number; target: number }>>
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  TECHNIQUE: { label: 'Technique', color: 'bg-[#27698a]/10 text-[#27698a]' },
  SOFT: { label: 'Soft skills', color: 'bg-purple-100 text-purple-700' },
  LANGUE: { label: 'Langue', color: 'bg-emerald-100 text-emerald-700' },
  MANAGEMENT: { label: 'Management', color: 'bg-amber-100 text-amber-700' },
}

const LEVEL_LABELS = ['', 'Débutant', 'Basique', 'Intermédiaire', 'Avancé', 'Expert']

export function SkillsPage() {
  const [data, setData] = useState<SkillData | null>(null)
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [assessWizard, setAssessWizard] = useState<{ skillId: string; skillName: string } | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/skills')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/skills')
      .then(r => r.json())
      .then(d => { if (mounted) { setData(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading || !data) {
    return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>
  }

  // Get all unique employees from assessments
  const employeeMap: Record<string, { nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }> = {}
  data.skills.forEach(s => {
    s.assessments.forEach(a => {
      if (!employeeMap[a.employee.id]) employeeMap[a.employee.id] = a.employee
    })
  })
  const employees = Object.values(employeeMap)

  // Stats
  const totalAssessments = data.skills.reduce((s, sk) => s + sk.assessments.length, 0)
  const gaps = data.skills.reduce((s, sk) => s + sk.assessments.filter(a => a.level < a.targetLevel).length, 0)
  const mastered = data.skills.reduce((s, sk) => s + sk.assessments.filter(a => a.level >= a.targetLevel).length, 0)

  // Group skills by category
  const byCategory: Record<string, typeof data.skills> = {}
  data.skills.forEach(s => {
    if (!byCategory[s.category]) byCategory[s.category] = []
    byCategory[s.category].push(s)
  })

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-[#27698a]" />
            Gestion des compétences
          </h1>
          <p className="text-sm text-slate-500 mt-1">Matrice skills · {data.skills.length} compétences · {employees.length} évaluations</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle compétence
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Brain} label="Compétences" value={data.skills.length} color="#27698a" />
        <KpiCard icon={Star} label="Évaluations" value={totalAssessments} color="#478e5e" />
        <KpiCard icon={CheckCircle2} label="Maîtrisées" value={mastered} color="#478e5e" sub="niveau ≥ cible" />
        <KpiCard icon={AlertTriangle} label="Gaps" value={gaps} color="#b94659" sub="à développer" />
      </div>

      {/* Matrice par catégorie */}
      {Object.entries(byCategory).map(([cat, skills]) => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.TECHNIQUE
        return (
          <Card key={cat} className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className={meta.color}>{meta.label}</Badge>
              <span className="text-xs text-slate-500">{skills.length} compétence{skills.length > 1 ? 's' : ''}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left text-xs text-slate-600 font-semibold">Compétence</th>
                    {employees.map(emp => (
                      <th key={emp.id} className="px-2 py-2 text-center text-xs text-slate-600 font-medium min-w-[80px]">
                        <div className={`w-7 h-7 rounded-full mx-auto text-white flex items-center justify-center text-[10px] font-bold ${emp.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>
                          {emp.prenoms[0]}{emp.nom[0]}
                        </div>
                        <div className="mt-1 text-[10px] truncate">{emp.nom}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {skills.map(skill => (
                    <tr key={skill.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setAssessWizard({ skillId: skill.id, skillName: skill.name })}
                          className="font-medium text-slate-900 text-sm hover:text-[#27698a] text-left"
                        >
                          {skill.name}
                        </button>
                        {skill.description && <div className="text-xs text-slate-500 mt-0.5">{skill.description}</div>}
                      </td>
                      {employees.map(emp => {
                        const cell = data.matrix[skill.id]?.[emp.id]
                        if (!cell) return <td key={emp.id} className="px-2 py-3 text-center text-slate-300">—</td>
                        const isGap = cell.level < cell.target
                        const bgColor = isGap ? 'bg-amber-100 text-amber-700' :
                                        cell.level >= 4 ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-sky-100 text-sky-700'
                        return (
                          <td key={emp.id} className="px-2 py-3 text-center">
                            <div className={`inline-flex items-center gap-0.5 px-2 py-1 rounded ${bgColor}`} title={`Niveau ${cell.level}/5 · Cible ${cell.target}`}>
                              {cell.level}
                              {isGap && <AlertTriangle className="w-2.5 h-2.5" />}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      })}

      {data.skills.length === 0 && (
        <Card className="p-8 text-center text-slate-400">
          <Brain className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Aucune compétence définie</p>
        </Card>
      )}

      {/* Légende */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900 text-sm">Légende des niveaux</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="flex items-center gap-2 p-2 rounded border border-slate-200">
              <div className={`w-6 h-6 rounded flex items-center justify-center font-bold ${n <= 2 ? 'bg-amber-100 text-amber-700' : n <= 3 ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {n}
              </div>
              <span className="text-slate-700">{LEVEL_LABELS[n]}</span>
            </div>
          ))}
        </div>
      </Card>

      {wizardOpen && (
        <SkillWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
      )}

      {assessWizard && (
        <AssessWizard
          skillId={assessWizard.skillId}
          skillName={assessWizard.skillName}
          onClose={() => setAssessWizard(null)}
          onCreated={() => { setAssessWizard(null); load() }}
        />
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: number; color: string; sub?: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
          {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
        </div>
      </div>
    </Card>
  )
}

function SkillWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', category: 'TECHNIQUE', description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Nom requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success('Compétence créée'); onCreated() }
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-[#27698a]" /> Nouvelle compétence</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Nom *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="JavaScript / React" />
          </div>
          <div>
            <Label className="text-sm">Catégorie</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssessWizard({ skillId, skillName, onClose, onCreated }: { skillId: string; skillName: string; onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', level: '3', targetLevel: '4' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.employeeId) { toast.error('Sélectionne un employé'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, ...form }),
      })
      if (res.ok) { toast.success('Évaluation enregistrée'); onCreated() }
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-[#27698a]" /> Évaluer : {skillName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Employé</Label>
            <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Niveau actuel (1-5)</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} - {LEVEL_LABELS[n]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Niveau cible (1-5)</Label>
              <Select value={form.targetLevel} onValueChange={v => setForm({ ...form, targetLevel: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} - {LEVEL_LABELS[n]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
