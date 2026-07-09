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
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Plus, Loader2, Calendar, FileCheck, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface ComplianceItem {
  id: string
  title: string
  description: string | null
  category: string
  status: string
  dueDate: string | null
  lastCheck: string | null
  frequency: string
  responsible: string | null
  notes: string | null
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  TRAVAIL: { label: 'Code du travail', color: 'bg-[#27698a]/10 text-[#27698a]' },
  CNSS: { label: 'CNSS', color: 'bg-emerald-100 text-emerald-700' },
  FISCAL: { label: 'Fiscal', color: 'bg-amber-100 text-amber-700' },
  RGPD: { label: 'RGPD / Données', color: 'bg-purple-100 text-purple-700' },
  AUTRE: { label: 'Autre', color: 'bg-slate-100 text-slate-700' },
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  A_JOUR: { label: 'À jour', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  A_VERIFIER: { label: 'À vérifier', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  EN_RETARD: { label: 'En retard', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  NON_APPLICABLE: { label: 'N/A', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: FileCheck },
}

const FREQUENCY_META: Record<string, string> = {
  MENSUEL: 'Mensuel',
  TRIMESTRIEL: 'Trimestriel',
  ANNUEL: 'Annuel',
  PONCTUEL: 'Ponctuel',
}

export function CompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('all')

  const load = () => {
    setLoading(true)
    fetch('/api/compliance')
      .then(r => r.json())
      .then(d => { setItems(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/compliance')
      .then(r => r.json())
      .then(d => { if (mounted) { setItems(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)

  const stats = {
    total: items.length,
    aJour: items.filter(i => i.status === 'A_JOUR').length,
    aVerifier: items.filter(i => i.status === 'A_VERIFIER').length,
    enRetard: items.filter(i => i.status === 'EN_RETARD').length,
  }

  const complianceRate = stats.total > 0 ? Math.round((stats.aJour / stats.total) * 100) : 0

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#27698a]" />
            Conformité légale
          </h1>
          <p className="text-sm text-slate-500 mt-1">Suivi des obligations légales et réglementaires</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel item
        </Button>
      </div>

      {/* KPIs + Compliance rate */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 lg:col-span-1">
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">{complianceRate}%</div>
            <div className="text-xs text-slate-500">Taux de conformité</div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${complianceRate}%` }} />
            </div>
          </div>
        </Card>
        <KpiCard icon={CheckCircle2} label="À jour" value={stats.aJour} color="#478e5e" />
        <KpiCard icon={Clock} label="À vérifier" value={stats.aVerifier} color="#96783c" />
        <KpiCard icon={AlertTriangle} label="En retard" value={stats.enRetard} color="#b94659" />
      </div>

      {/* Alertes */}
      {stats.enRetard > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <div className="font-semibold text-sm">{stats.enRetard} item(s) en retard — action requise</div>
              <div className="text-xs">Vérifiez les obligations ci-dessous et régularisez la situation.</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === 'all' ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>Toutes</button>
        {Object.entries(CATEGORY_META).map(([k, v]) => (
          <button key={k} onClick={() => setFilterCat(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === k ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{v.label}</button>
        ))}
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(item => {
          const cat = CATEGORY_META[item.category] || CATEGORY_META.AUTRE
          const status = STATUS_META[item.status] || STATUS_META.A_JOUR
          const StatusIcon = status.icon
          return (
            <Card key={item.id} className={`p-4 ${item.status === 'EN_RETARD' ? 'border-red-200 bg-red-50/30' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cat.color}>{cat.label}</Badge>
                  <Badge variant="outline" className={status.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-400">{FREQUENCY_META[item.frequency] || item.frequency}</span>
              </div>

              <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
              {item.description && <p className="text-xs text-slate-600 mt-1">{item.description}</p>}

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                {item.dueDate && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3 h-3" />
                    Échéance : {formatDate(item.dueDate)}
                  </div>
                )}
                {item.lastCheck && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <FileCheck className="w-3 h-3" />
                    Dernier contrôle : {formatDate(item.lastCheck)}
                  </div>
                )}
                {item.responsible && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <ShieldCheck className="w-3 h-3" />
                    Responsable : {item.responsible}
                  </div>
                )}
              </div>

              {item.notes && (
                <div className="mt-2 p-2 rounded bg-slate-50 text-xs text-slate-600 italic">{item.notes}</div>
              )}
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center text-slate-400">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucun item de conformité</p>
          </Card>
        )}
      </div>

      {wizardOpen && (
        <ComplianceWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
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

function ComplianceWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'TRAVAIL', status: 'A_JOUR',
    dueDate: '', frequency: 'ANNUEL', responsible: 'RH', notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Titre requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success('Item de conformité créé'); onCreated() }
    } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-[#27698a]" /> Nouvel item de conformité</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Titre *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Déclaration CNSS trimestrielle" />
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
                  {Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Échéance</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Fréquence</Label>
              <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Responsable</Label>
            <Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="mt-1" />
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
