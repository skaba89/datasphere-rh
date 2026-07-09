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
import { Briefcase, Plus, Loader2, Mail, Phone, Calendar, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Contractor {
  id: string; name: string; type: string; service: string;
  contractStart: string; contractEnd: string | null;
  monthlyRate: number | null; dailyRate: number | null;
  contactName: string | null; contactEmail: string | null; contactPhone: string | null;
  status: string; notes: string | null
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  PRESTATAIRE: { label: 'Prestataire', color: 'bg-[#27698a]/10 text-[#27698a]' },
  CONSULTANT: { label: 'Consultant', color: 'bg-purple-100 text-purple-700' },
  FREELANCE: { label: 'Freelance', color: 'bg-amber-100 text-amber-700' },
  STAGIAIRE: { label: 'Stagiaire', color: 'bg-sky-100 text-sky-700' },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  ACTIF: { label: 'Actif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  TERMINE: { label: 'Terminé', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  SUSPENDU: { label: 'Suspendu', color: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export function ContractorsPage() {
  const [items, setItems] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/contractors').then(r => r.json()).then(d => { if (mounted) { setItems(d); setLoading(false) } }).catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const load = () => { setLoading(true); fetch('/api/contractors').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }

  const stats = { total: items.length, actifs: items.filter(i => i.status === 'ACTIF').length, coutMensuel: items.filter(i => i.status === 'ACTIF').reduce((s, i) => s + (i.monthlyRate || 0), 0) }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-[#27698a]" />Prestataires B2B</h1>
          <p className="text-sm text-slate-500 mt-1">Gestion des prestataires, consultants et freelances</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Briefcase} label="Total" value={stats.total} color="#27698a" />
        <KpiCard icon={Briefcase} label="Actifs" value={stats.actifs} color="#478e5e" />
        <KpiCard icon={DollarSign} label="Coût mensuel" value={formatGNF(stats.coutMensuel)} color="#b94659" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(c => {
          const type = TYPE_META[c.type] || TYPE_META.PRESTATAIRE
          const status = STATUS_META[c.status] || STATUS_META.ACTIF
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className={type.color}>{type.label}</Badge>
                <Badge variant="outline" className={status.color}>{status.label}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{c.name}</h3>
              <p className="text-xs text-slate-600 mt-1">{c.service}</p>
              <div className="space-y-1 mt-3 text-xs text-slate-600">
                <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Du {formatDate(c.contractStart)}{c.contractEnd ? ` au ${formatDate(c.contractEnd)}` : ' (en cours)'}</div>
                {c.monthlyRate && <div className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" />{formatGNF(c.monthlyRate)} / mois</div>}
                {c.dailyRate && <div className="flex items-center gap-1.5"><DollarSign className="w-3 h-3" />{formatGNF(c.dailyRate)} / jour</div>}
                {c.contactName && <div className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" />{c.contactName}</div>}
                {c.contactEmail && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3" />{c.contactEmail}</div>}
                {c.contactPhone && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{c.contactPhone}</div>}
              </div>
              {c.notes && <div className="mt-2 p-2 rounded bg-slate-50 text-xs italic text-slate-600">{c.notes}</div>}
            </Card>
          )
        })}
        {items.length === 0 && <Card className="col-span-full p-8 text-center text-slate-400"><Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun prestataire enregistré</p></Card>}
      </div>

      {wizardOpen && <ContractorWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-lg lg:text-xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function ContractorWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', type: 'PRESTATAIRE', service: '', contractStart: new Date().toISOString().slice(0, 10), contractEnd: '', monthlyRate: '', dailyRate: '', contactName: '', contactEmail: '', contactPhone: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.service) { toast.error('Nom et service requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/contractors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Prestataire créé'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#27698a]" />Nouveau prestataire</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label className="text-sm">Service fourni *</Label><Input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Début contrat</Label><Input type="date" value={form.contractStart} onChange={e => setForm({ ...form, contractStart: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Fin contrat</Label><Input type="date" value={form.contractEnd} onChange={e => setForm({ ...form, contractEnd: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Taux mensuel (GNF)</Label><Input type="number" value={form.monthlyRate} onChange={e => setForm({ ...form, monthlyRate: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Taux journalier (GNF)</Label><Input type="number" value={form.dailyRate} onChange={e => setForm({ ...form, dailyRate: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Contact</Label><Input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Téléphone</Label><Input value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-sm">Email</Label><Input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-sm">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
