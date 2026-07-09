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
import { Gift, Plus, Loader2, Heart, Car, UtensilsCrossed, PiggyBank, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Benefit { id: string; type: string; label: string; provider: string | null; employeeContribution: number; employerContribution: number; startDate: string; endDate: string | null; status: string; notes: string | null; employee: { nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null } }

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MUTUELLE: { label: 'Mutuelle', icon: Heart, color: 'bg-red-100 text-red-700' },
  TRANSPORT: { label: 'Transport', icon: Car, color: 'bg-sky-100 text-sky-700' },
  REPAS: { label: 'Repas', icon: UtensilsCrossed, color: 'bg-amber-100 text-amber-700' },
  RETRAITE: { label: 'Retraite', icon: PiggyBank, color: 'bg-purple-100 text-purple-700' },
  PREVOYANCE: { label: 'Prévoyance', icon: Shield, color: 'bg-emerald-100 text-emerald-700' },
  AUTRE: { label: 'Autre', icon: Gift, color: 'bg-slate-100 text-slate-700' },
}

export function BenefitsPage() {
  const [items, setItems] = useState<Benefit[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  useEffect(() => { let m = true; fetch('/api/benefits').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/benefits').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }
  const stats = { total: items.length, actifs: items.filter(i => i.status === 'ACTIF').length, coutEmployeur: items.filter(i => i.status === 'ACTIF').reduce((s, i) => s + i.employerContribution, 0), coutEmploye: items.filter(i => i.status === 'ACTIF').reduce((s, i) => s + i.employeeContribution, 0) }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Gift className="w-6 h-6 text-[#27698a]" />Avantages sociaux</h1><p className="text-sm text-slate-500 mt-1">Mutuelle, transport, retraite, prévoyance</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvel avantage</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Gift} label="Total" value={stats.total} color="#27698a" />
        <KpiCard icon={Shield} label="Actifs" value={stats.actifs} color="#478e5e" />
        <KpiCard icon={PiggyBank} label="Coût employeur/mois" value={formatGNF(stats.coutEmployeur)} color="#96783c" />
        <KpiCard icon={Heart} label="Coût employé/mois" value={formatGNF(stats.coutEmploye)} color="#b94659" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(b => {
          const meta = TYPE_META[b.type] || TYPE_META.AUTRE
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${meta.color}`}><meta.icon className="w-4 h-4" /></div>
                <Badge variant="outline" className={b.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>{b.status === 'ACTIF' ? 'Actif' : b.status === 'SUSPENDU' ? 'Suspendu' : 'Terminé'}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{b.label}</h3>
              <Badge variant="outline" className={meta.color + ' text-[10px] mt-1'}>{meta.label}</Badge>
              <div className="flex items-center gap-2 mt-2"><div className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-[9px] font-bold ${b.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{b.employee.prenoms[0]}{b.employee.nom[0]}</div><span className="text-xs font-medium text-slate-700">{b.employee.nom} {b.employee.prenoms}</span></div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Employeur</div><div className="font-bold text-slate-900">{formatGNF(b.employerContribution)}/mois</div></div>
                <div className="p-2 rounded bg-slate-50"><div className="text-slate-500">Employé</div><div className="font-bold text-slate-900">{formatGNF(b.employeeContribution)}/mois</div></div>
              </div>
              {b.provider && <div className="text-xs text-slate-500 mt-2">Prestataire : {b.provider}</div>}
              <div className="text-xs text-slate-400 mt-1">Depuis {formatDate(b.startDate)}</div>
            </Card>
          )
        })}
        {items.length === 0 && <Card className="col-span-full p-8 text-center text-slate-400"><Gift className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun avantage social</p></Card>}
      </div>
      {wizardOpen && <BenefitWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-lg lg:text-xl font-bold text-slate-900 truncate">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}
function BenefitWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', type: 'MUTUELLE', label: '', provider: '', employeeContribution: '', employerContribution: '', startDate: new Date().toISOString().slice(0, 10), notes: '' })
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])
  const handleSubmit = async () => { if (!form.employeeId || !form.label) { toast.error('Employé et libellé requis'); return }; setLoading(true); try { const res = await fetch('/api/benefits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Avantage créé'); onCreated() } } catch { toast.error('Erreur') }; setLoading(false) }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-[#27698a]" />Nouvel avantage</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label className="text-sm">Employé *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-sm">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-sm">Libellé *</Label><Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="mt-1" placeholder="Mutuelle santé familiale" /></div>
        <div><Label className="text-sm">Prestataire</Label><Input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="mt-1" placeholder="ASKIA Santé" /></div>
        <div className="grid grid-cols-2 gap-3"><div><Label className="text-sm">Cotisation employeur (GNF/mois)</Label><Input type="number" value={form.employerContribution} onChange={e => setForm({ ...form, employerContribution: e.target.value })} className="mt-1" /></div><div><Label className="text-sm">Cotisation employé (GNF/mois)</Label><Input type="number" value={form.employeeContribution} onChange={e => setForm({ ...form, employeeContribution: e.target.value })} className="mt-1" /></div></div>
        <div><Label className="text-sm">Date début</Label><Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
    </DialogContent></Dialog>
  )
}
