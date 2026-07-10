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
import { Heart, Plus, Loader2, Stethoscope, Syringe, Bed, Ergonomics, Activity, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface HealthRecord {
  id: string; type: string; date: string; nextDate: string | null; status: string; provider: string | null; result: string | null; notes: string | null;
  employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }
}

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  VISITE_MEDICALE: { label: 'Visite médicale', icon: Stethoscope, color: 'bg-[#27698a]/10 text-[#27698a]' },
  VACCINATION: { label: 'Vaccination', icon: Syringe, color: 'bg-emerald-100 text-emerald-700' },
  ARRET_MALADIE: { label: 'Arrêt maladie', icon: Bed, color: 'bg-red-100 text-red-700' },
  ERGONOMIE: { label: 'Ergonomie', icon: Activity, color: 'bg-amber-100 text-amber-700' },
  BILAN_SANTE: { label: 'Bilan de santé', icon: Heart, color: 'bg-purple-100 text-purple-700' },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PLANIFIE: { label: 'Planifié', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  REALISE: { label: 'Réalisé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ANNULE: { label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200' },
}

export function HealthPage() {
  const [items, setItems] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => { let m = true; fetch('/api/health').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/health').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }

  const stats = { total: items.length, planifie: items.filter(i => i.status === 'PLANIFIE').length, realise: items.filter(i => i.status === 'REALISE').length, overdue: items.filter(i => i.nextDate && new Date(i.nextDate) < new Date() && i.status !== 'REALISE').length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Heart className="w-6 h-6 text-[#27698a]" />Santé &amp; Wellness</h1><p className="text-sm text-slate-500 mt-1">Suivi médical, vaccinations et bien-être au travail</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau dossier</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Heart} label="Total dossiers" value={stats.total} color="#27698a" />
        <KpiCard icon={Clock} label="Planifiés" value={stats.planifie} color="#96783c" />
        <KpiCard icon={CheckCircle2} label="Réalisés" value={stats.realise} color="#478e5e" />
        <KpiCard icon={Activity} label="En retard" value={stats.overdue} color="#b94659" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(item => {
          const type = TYPE_META[item.type] || TYPE_META.VISITE_MEDICALE
          const status = STATUS_META[item.status] || STATUS_META.PLANIFIE
          const isOverdue = item.nextDate && new Date(item.nextDate) < new Date() && item.status !== 'REALISE'
          return (
            <Card key={item.id} className={`p-4 ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${type.color}`}><type.icon className="w-4 h-4" /></div>
                <Badge variant="outline" className={status.color}>{status.label}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${item.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{item.employee.prenoms[0]}{item.employee.nom[0]}</div>
                <span className="font-medium text-sm text-slate-900">{item.employee.nom} {item.employee.prenoms}</span>
              </div>
              <Badge variant="outline" className={type.color + ' text-[10px] mb-2'}>{type.label}</Badge>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.date)}{item.nextDate ? ` → ${formatDate(item.nextDate)}` : ''}</div>
                {item.provider && <div className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{item.provider}</div>}
                {item.result && <div className="p-1.5 rounded bg-slate-50 text-slate-700"><b>Résultat :</b> {item.result}</div>}
                {item.notes && <div className="text-slate-500 italic">{item.notes}</div>}
              </div>
              {isOverdue && <div className="mt-2 p-1.5 rounded bg-red-50 text-xs text-red-700 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> En retard — planifier urgemment</div>}
            </Card>
          )
        })}
        {items.length === 0 && <Card className="col-span-full p-8 text-center text-slate-400"><Heart className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun dossier de santé</p></Card>}
      </div>

      {wizardOpen && <HealthWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function HealthWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', type: 'VISITE_MEDICALE', date: new Date().toISOString().slice(0, 10), nextDate: '', provider: '', result: '', notes: '' })
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])
  const handleSubmit = async () => {
    if (!form.employeeId) { toast.error('Employé requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Dossier créé'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-[#27698a]" />Nouveau dossier santé</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Employé *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-sm">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Prochaine visite</Label><Input type="date" value={form.nextDate} onChange={e => setForm({ ...form, nextDate: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-sm">Prestataire</Label><Input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="mt-1" placeholder="Clinique Pasteur" /></div>
          <div><Label className="text-sm">Résultat</Label><Input value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} className="mt-1" placeholder="Apte / Inapte / Restrictions" /></div>
          <div><Label className="text-sm">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
