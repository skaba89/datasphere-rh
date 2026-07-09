'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ClipboardList, CheckCircle2, Clock, AlertCircle, Plus, Loader2, User, FileText, Laptop, GraduationCap, Package } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface OnboardingTask {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  dueDate: string | null
  assignedTo: string | null
  completedAt: string | null
  createdAt: string
  employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null; dateEmbauche: string }
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ADMIN: { label: 'Administratif', icon: FileText, color: 'bg-[#27698a]/10 text-[#27698a]' },
  IT: { label: 'IT', icon: Laptop, color: 'bg-purple-100 text-purple-700' },
  RH: { label: 'RH', icon: User, color: 'bg-emerald-100 text-emerald-700' },
  FORMATION: { label: 'Formation', icon: GraduationCap, color: 'bg-amber-100 text-amber-700' },
  EQUIPEMENT: { label: 'Équipement', icon: Package, color: 'bg-sky-100 text-sky-700' },
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  A_FAIRE: { label: 'À faire', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: Loader2 },
  TERMINE: { label: 'Terminé', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  BLOQUE: { label: 'Bloqué', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
}

export function OnboardingPage() {
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [filterEmployee, setFilterEmployee] = useState<string>('all')

  const load = () => {
    setLoading(true)
    fetch('/api/onboarding')
      .then(r => r.json())
      .then(d => { setTasks(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/onboarding')
      .then(r => r.json())
      .then(d => { if (mounted) { setTasks(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const toggleStatus = async (task: OnboardingTask) => {
    const newStatus = task.status === 'TERMINE' ? 'A_FAIRE' : 'TERMINE'
    try {
      const res = await fetch(`/api/onboarding/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(newStatus === 'TERMINE' ? 'Tâche terminée' : 'Tâche rouverte')
        load()
      }
    } catch {
      toast.error('Erreur')
    }
  }

  // Grouper par employé
  const byEmployee: Record<string, OnboardingTask[]> = {}
  tasks.forEach(t => {
    const key = t.employee.id
    if (!byEmployee[key]) byEmployee[key] = []
    byEmployee[key].push(t)
  })

  const employees = Object.entries(byEmployee).map(([id, ts]) => ({
    id,
    employee: ts[0].employee,
    tasks: ts,
    completed: ts.filter(t => t.status === 'TERMINE').length,
    total: ts.length,
  }))

  const filteredEmployees = filterEmployee === 'all' ? employees : employees.filter(e => e.id === filterEmployee)

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'TERMINE').length,
    inProgress: tasks.filter(t => t.status === 'EN_COURS').length,
    blocked: tasks.filter(t => t.status === 'BLOQUE').length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-[#27698a]" />
            Onboarding
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Checklists de nouvelle embauche · {stats.completed}/{stats.total} tâches complétées
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={ClipboardList} label="Total tâches" value={stats.total} color="#27698a" />
        <KpiCard icon={CheckCircle2} label="Terminées" value={stats.completed} color="#478e5e" />
        <KpiCard icon={Clock} label="En cours" value={stats.inProgress} color="#96783c" />
        <KpiCard icon={AlertCircle} label="Bloquées" value={stats.blocked} color="#b94659" />
      </div>

      {/* Filtre employé */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Filtrer par employé :</span>
          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-[250px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les employés</SelectItem>
              {employees.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.employee.nom} {e.employee.prenoms} ({e.completed}/{e.total})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Listes par employé */}
      <div className="space-y-4">
        {filteredEmployees.map(({ employee, tasks: empTasks, completed, total }) => {
          const pct = total > 0 ? (completed / total) * 100 : 0
          return (
            <Card key={employee.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'
                  }`}>
                    {employee.prenoms[0]}{employee.nom[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{employee.nom} {employee.prenoms}</h3>
                    <p className="text-xs text-slate-500">{employee.poste} · Embauché le {formatDate(employee.dateEmbauche)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{completed}/{total}</div>
                  <div className="text-xs text-slate-500">{pct.toFixed(0)}% complété</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-[#27698a]'}`} style={{ width: `${pct}%` }} />
              </div>

              {/* Tâches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {empTasks.map(task => {
                  const cat = CATEGORY_META[task.category] || CATEGORY_META.ADMIN
                  const status = STATUS_META[task.status] || STATUS_META.A_FAIRE
                  const CatIcon = cat.icon
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggleStatus(task)}
                      className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors hover:bg-slate-50 ${
                        task.status === 'TERMINE' ? 'bg-emerald-50/50 border-emerald-200' : 'border-slate-200'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${task.status === 'TERMINE' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </div>
                        {task.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</div>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                            {status.label}
                          </Badge>
                          {task.assignedTo && (
                            <span className="text-[10px] text-slate-400">→ {task.assignedTo}</span>
                          )}
                        </div>
                      </div>
                      {task.status === 'TERMINE' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded border-2 border-slate-300 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
        {filteredEmployees.length === 0 && (
          <Card className="p-8 text-center text-slate-400">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucune tâche d'onboarding</p>
          </Card>
        )}
      </div>

      {wizardOpen && (
        <OnboardingWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

function OnboardingWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    category: 'ADMIN',
    dueDate: '',
    assignedTo: 'RH',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.employeeId || !form.title) { toast.error('Employé et titre requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Tâche d\'onboarding créée')
        onCreated()
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#27698a]" />
            Nouvelle tâche d'onboarding
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
          <div>
            <Label className="text-sm">Titre *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Créer compte email professionnel" />
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Assigné à</Label>
              <Select value={form.assignedTo} onValueChange={v => setForm({ ...form, assignedTo: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RH">RH</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Échéance</Label>
            <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer tâche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
