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
import { Receipt, CheckCircle2, XCircle, Clock, Plus, Loader2, Wallet, Car, Coffee, Home, BookOpen, Package } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Expense {
  id: string
  title: string
  category: string
  amount: number
  date: string
  description: string | null
  status: string
  submittedAt: string
  approvedBy: string | null
  employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  TRANSPORT: { label: 'Transport', icon: Car, color: 'bg-[#27698a]/10 text-[#27698a]' },
  REPAS: { label: 'Repas', icon: Coffee, color: 'bg-amber-100 text-amber-700' },
  HEBERGEMENT: { label: 'Hébergement', icon: Home, color: 'bg-purple-100 text-purple-700' },
  FORMATION: { label: 'Formation', icon: BookOpen, color: 'bg-emerald-100 text-emerald-700' },
  MATERIEL: { label: 'Matériel', icon: Package, color: 'bg-sky-100 text-sky-700' },
  AUTRE: { label: 'Autre', icon: Receipt, color: 'bg-slate-100 text-slate-700' },
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  APPROUVE: { label: 'Approuvé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  REFUSE: { label: 'Refusé', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  REMBOURSE: { label: 'Remboursé', color: 'bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20', icon: Wallet },
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [acting, setActing] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/expenses')
      .then(r => r.json())
      .then(d => { setExpenses(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/expenses')
      .then(r => r.json())
      .then(d => { if (mounted) { setExpenses(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = filterStatus === 'all' ? expenses : expenses.filter(e => e.status === filterStatus)

  const handleAction = async (id: string, status: string, name: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Note de frais de ${name} ${status === 'APPROUVE' ? 'approuvée' : status === 'REFUSE' ? 'refusée' : 'remboursée'}`)
        load()
      }
    } catch { toast.error('Erreur') }
    setActing(null)
  }

  const stats = {
    total: expenses.length,
    enAttente: expenses.filter(e => e.status === 'EN_ATTENTE').length,
    approuve: expenses.filter(e => e.status === 'APPROUVE').length,
    montantEnAttente: expenses.filter(e => e.status === 'EN_ATTENTE').reduce((s, e) => s + e.amount, 0),
    montantTotal: expenses.reduce((s, e) => s + e.amount, 0),
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#27698a]" />
            Notes de frais
          </h1>
          <p className="text-sm text-slate-500 mt-1">Remboursements · validations · suivi</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle note
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Receipt} label="Total notes" value={stats.total} color="#27698a" />
        <KpiCard icon={Clock} label="En attente" value={stats.enAttente} color="#96783c" />
        <KpiCard icon={Wallet} label="Montant en attente" value={formatGNF(stats.montantEnAttente)} color="#b94659" />
        <KpiCard icon={CheckCircle2} label="Montant total" value={formatGNF(stats.montantTotal)} color="#478e5e" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'EN_ATTENTE', 'APPROUVE', 'REFUSE', 'REMBOURSE'] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterStatus === f ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
            {f === 'all' ? 'Toutes' : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Liste */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 text-sm">{filtered.length} note(s) de frais</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {filtered.map(exp => {
            const cat = CATEGORY_META[exp.category] || CATEGORY_META.AUTRE
            const status = STATUS_META[exp.status] || STATUS_META.EN_ATTENTE
            const StatusIcon = status.icon
            const CatIcon = cat.icon
            return (
              <div key={exp.id} className="px-4 py-3 hover:bg-slate-50 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                  <CatIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm text-slate-900">{exp.title}</span>
                    <Badge variant="outline" className={cat.color + ' text-[10px]'}>{cat.label}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                      <StatusIcon className="w-2.5 h-2.5 mr-0.5" />{status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className={`w-4 h-4 rounded-full text-white flex items-center justify-center text-[8px] font-bold ${exp.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>
                        {exp.employee.prenoms[0]}{exp.employee.nom[0]}
                      </div>
                      {exp.employee.nom} {exp.employee.prenoms}
                    </div>
                    <span>·</span>
                    <span>{formatDate(exp.date)}</span>
                    <span>·</span>
                    <span>Soumise le {formatDate(exp.submittedAt.slice(0, 10))}</span>
                  </div>
                  {exp.description && <p className="text-xs text-slate-500 mt-1 italic">{exp.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-slate-900">{formatGNF(exp.amount)}</div>
                  {exp.status === 'EN_ATTENTE' && (
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" className="h-6 text-[10px] px-2 bg-[#478e5e] hover:bg-[#3a7549]"
                        disabled={acting === exp.id}
                        onClick={() => handleAction(exp.id, 'APPROUVE', `${exp.employee.nom}`)}>
                        {acting === exp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      </Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600 border-red-200"
                        disabled={acting === exp.id}
                        onClick={() => handleAction(exp.id, 'REFUSE', `${exp.employee.nom}`)}>
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {exp.status === 'APPROUVE' && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] mt-1 text-[#27698a] border-[#27698a]/20"
                      disabled={acting === exp.id}
                      onClick={() => handleAction(exp.id, 'REMBOURSE', `${exp.employee.nom}`)}>
                      {acting === exp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wallet className="w-3 h-3" />}
                      Rembourser
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Aucune note de frais</p>
            </div>
          )}
        </div>
      </Card>

      {wizardOpen && (
        <ExpenseWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-lg lg:text-xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

function ExpenseWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employeeId: '', title: '', category: 'TRANSPORT', amount: '',
    date: new Date().toISOString().slice(0, 10), description: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.employeeId || !form.title || !form.amount) { toast.error('Employé, titre et montant requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success('Note de frais créée'); onCreated() }
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-[#27698a]" /> Nouvelle note de frais</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Employé *</Label>
            <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Titre *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Taxi aéroport" />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label className="text-sm">Montant (GNF) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Date</Label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Soumettre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
