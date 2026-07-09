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
import { HandCoins, Plus, Loader2, CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Loan { id: string; type: string; amount: number; reason: string | null; requestDate: string; approvalDate: string | null; status: string; monthlyDeduction: number | null; totalMonths: number | null; remainingAmount: number | null; approvedBy: string | null; employee: { nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null } }

const TYPE_META: Record<string, { label: string; color: string }> = { AVANCE: { label: 'Avance', color: 'bg-sky-100 text-sky-700' }, PRET: { label: 'Prêt', color: 'bg-purple-100 text-purple-700' }, AVANCE_SALAIRE: { label: 'Avance salaire', color: 'bg-amber-100 text-amber-700' } }
const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = { EN_ATTENTE: { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock }, APPROUVE: { label: 'Approuvé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 }, REFUSE: { label: 'Refusé', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle }, REMBOURSE: { label: 'Remboursé', color: 'bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20', icon: DollarSign } }

export function LoansPage() {
  const [items, setItems] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  useEffect(() => { let m = true; fetch('/api/loans').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/loans').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }
  const handleAction = async (id: string, status: string, amount: number, name: string) => { setActing(id); try { const res = await fetch('/api/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ loanId: id, status, amount }) }); if (res.ok) { toast.success(`Prêt de ${name} ${status === 'APPROUVE' ? 'approuvé' : 'refusé'}`); load() } } catch { toast.error('Erreur') }; setActing(null) }
  const stats = { total: items.length, enAttente: items.filter(i => i.status === 'EN_ATTENTE').length, montantEnAttente: items.filter(i => i.status === 'EN_ATTENTE').reduce((s, i) => s + i.amount, 0), montantTotal: items.reduce((s, i) => s + i.amount, 0) }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><HandCoins className="w-6 h-6 text-[#27698a]" />Prêts &amp; Avances</h1><p className="text-sm text-slate-500 mt-1">Avances salaires, prêts employés et remboursements</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle demande</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={HandCoins} label="Total demandes" value={stats.total} color="#27698a" />
        <KpiCard icon={Clock} label="En attente" value={stats.enAttente} color="#96783c" />
        <KpiCard icon={DollarSign} label="Montant en attente" value={formatGNF(stats.montantEnAttente)} color="#b94659" />
        <KpiCard icon={DollarSign} label="Montant total" value={formatGNF(stats.montantTotal)} color="#478e5e" />
      </div>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">{items.length} demande(s)</h2></div>
        <div className="divide-y divide-slate-100">
          {items.map(l => {
            const type = TYPE_META[l.type] || TYPE_META.AVANCE
            const status = STATUS_META[l.status] || STATUS_META.EN_ATTENTE
            return (
              <div key={l.id} className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${status.color.split(' ')[0]}`}><status.icon className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-medium text-sm text-slate-900">{l.employee.nom} {l.employee.prenoms}</span><Badge variant="outline" className={type.color + ' text-[10px]'}>{type.label}</Badge><Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge></div>
                  <div className="text-xs text-slate-500">Demandé le {formatDate(l.requestDate)}{l.reason ? ` · ${l.reason}` : ''}{l.monthlyDeduction ? ` · ${formatGNF(l.monthlyDeduction)}/mois × ${l.totalMonths} mois` : ''}{l.remainingAmount !== null && l.remainingAmount > 0 ? ` · Reste : ${formatGNF(l.remainingAmount)}` : ''}</div>
                </div>
                <div className="text-right shrink-0"><div className="font-mono font-bold text-slate-900">{formatGNF(l.amount)}</div>{l.status === 'EN_ATTENTE' && <div className="flex gap-1 mt-1"><Button size="sm" className="h-6 text-[10px] px-2 bg-[#478e5e] hover:bg-[#3a7549]" disabled={acting === l.id} onClick={() => handleAction(l.id, 'APPROUVE', l.amount, l.employee.nom)}><CheckCircle2 className="w-3 h-3" /></Button><Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-red-600 border-red-200" disabled={acting === l.id} onClick={() => handleAction(l.id, 'REFUSE', l.amount, l.employee.nom)}><XCircle className="w-3 h-3" /></Button></div>}</div>
              </div>
            )
          })}
          {items.length === 0 && <div className="px-4 py-8 text-center text-slate-400"><HandCoins className="w-10 h-10 mx-auto text-slate-300 mb-2" /><p className="text-sm">Aucune demande</p></div>}
        </div>
      </Card>
      {wizardOpen && <LoanWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-lg lg:text-xl font-bold text-slate-900 truncate">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
function LoanWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', type: 'AVANCE', amount: '', reason: '', requestDate: new Date().toISOString().slice(0, 10), monthlyDeduction: '', totalMonths: '' })
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])
  const handleSubmit = async () => { if (!form.employeeId || !form.amount) { toast.error('Employé et montant requis'); return }; setLoading(true); try { const res = await fetch('/api/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Demande créée'); onCreated() } } catch { toast.error('Erreur') }; setLoading(false) }
  return (<Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><HandCoins className="w-5 h-5 text-[#27698a]" />Nouvelle demande</DialogTitle></DialogHeader>
    <div className="space-y-3">
      <div><Label className="text-sm">Employé *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-2 gap-3"><div><Label className="text-sm">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-sm">Montant (GNF) *</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div></div>
      <div className="grid grid-cols-2 gap-3"><div><Label className="text-sm">Déduction/mois (GNF)</Label><Input type="number" value={form.monthlyDeduction} onChange={e => setForm({ ...form, monthlyDeduction: e.target.value })} className="mt-1" /></div><div><Label className="text-sm">Nb mois</Label><Input type="number" value={form.totalMonths} onChange={e => setForm({ ...form, totalMonths: e.target.value })} className="mt-1" /></div></div>
      <div><Label className="text-sm">Motif</Label><Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="mt-1" rows={2} /></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Soumettre</Button></DialogFooter>
  </DialogContent></Dialog>)
}
