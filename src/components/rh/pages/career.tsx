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
import { TrendingUp, Plus, Loader2, Target, ArrowRight, Star, Compass } from 'lucide-react'
import { toast } from 'sonner'

interface CareerPath {
  id: string; currentRole: string; targetRole: string; timeline: string;
  readiness: number; status: string; gaps: string | null; actions: string | null; mentor: string | null;
  employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  EN_COURS: { label: 'En cours', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  ATTEINT: { label: 'Atteint', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REORIENTE: { label: 'Réorienté', color: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const READINESS_LABELS = ['', 'Non prêt', 'Préparation', 'En progression', 'Presque prêt', 'Prêt']

export function CareerPage() {
  const [paths, setPaths] = useState<CareerPath[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/career-paths').then(r => r.json()).then(d => { if (mounted) { setPaths(d); setLoading(false) } }).catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const load = () => { setLoading(true); fetch('/api/career-paths').then(r => r.json()).then(d => { setPaths(d); setLoading(false) }) }

  const stats = { total: paths.length, enCours: paths.filter(p => p.status === 'EN_COURS').length, pret: paths.filter(p => p.readiness >= 4).length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Compass className="w-6 h-6 text-[#27698a]" />Plan de carrière</h1>
          <p className="text-sm text-slate-500 mt-1">Succession, mobilité interne et développement</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau plan</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Compass} label="Plans total" value={stats.total} color="#27698a" />
        <KpiCard icon={TrendingUp} label="En cours" value={stats.enCours} color="#96783c" />
        <KpiCard icon={Star} label="Prêts (≥4/5)" value={stats.pret} color="#478e5e" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {paths.map(p => {
          const status = STATUS_META[p.status] || STATUS_META.EN_COURS
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-bold ${p.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{p.employee.prenoms[0]}{p.employee.nom[0]}</div>
                  <div><h3 className="font-semibold text-slate-900 text-sm">{p.employee.nom} {p.employee.prenoms}</h3><p className="text-xs text-slate-500">{p.employee.matricule}</p></div>
                </div>
                <Badge variant="outline" className={status.color}>{status.label}</Badge>
              </div>

              <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-slate-50">
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Poste actuel</div>
                  <div className="text-sm font-medium text-slate-700">{p.currentRole}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#27698a] shrink-0" />
                <div className="flex-1 text-center">
                  <div className="text-[10px] text-slate-400 uppercase">Poste cible</div>
                  <div className="text-sm font-bold text-[#27698a]">{p.targetRole}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded border border-slate-200">
                  <div className="text-slate-500">Préparation</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(n => <div key={n} className={`w-4 h-1.5 rounded-full ${n <= p.readiness ? 'bg-[#27698a]' : 'bg-slate-200'}`} />)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{READINESS_LABELS[p.readiness]}</div>
                </div>
                <div className="p-2 rounded border border-slate-200">
                  <div className="text-slate-500">Horizon</div>
                  <div className="text-sm font-medium text-slate-700 mt-1">{p.timeline}</div>
                </div>
              </div>

              {p.mentor && <div className="mt-2 text-xs text-slate-600">Mentor : <span className="font-medium">{p.mentor}</span></div>}
              {p.gaps && <div className="mt-2 p-2 rounded bg-amber-50 text-xs text-amber-800"><b>Écarts :</b> {p.gaps}</div>}
              {p.actions && <div className="mt-1 p-2 rounded bg-emerald-50 text-xs text-emerald-800"><b>Actions :</b> {p.actions}</div>}
            </Card>
          )
        })}
        {paths.length === 0 && <Card className="col-span-full p-8 text-center text-slate-400"><Compass className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun plan de carrière défini</p></Card>}
      </div>

      {wizardOpen && <CareerWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function CareerWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', currentRole: '', targetRole: '', timeline: '12 mois', readiness: '3', gaps: '', actions: '', mentor: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])

  const handleSubmit = async () => {
    if (!form.employeeId || !form.currentRole || !form.targetRole) { toast.error('Employé, poste actuel et cible requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/career-paths', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Plan de carrière créé'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Compass className="w-5 h-5 text-[#27698a]" />Nouveau plan de carrière</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Employé *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Poste actuel *</Label><Input value={form.currentRole} onChange={e => setForm({ ...form, currentRole: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Poste cible *</Label><Input value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Horizon</Label><Select value={form.timeline} onValueChange={v => setForm({ ...form, timeline: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="6 mois">6 mois</SelectItem><SelectItem value="12 mois">12 mois</SelectItem><SelectItem value="24 mois">24 mois</SelectItem><SelectItem value="36 mois">36 mois</SelectItem></SelectContent></Select></div>
            <div><Label className="text-sm">Préparation (1-5)</Label><Select value={form.readiness} onValueChange={v => setForm({ ...form, readiness: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n} - {READINESS_LABELS[n]}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label className="text-sm">Écarts de compétences</Label><Textarea value={form.gaps} onChange={e => setForm({ ...form, gaps: e.target.value })} className="mt-1" rows={2} /></div>
          <div><Label className="text-sm">Plan d'action</Label><Textarea value={form.actions} onChange={e => setForm({ ...form, actions: e.target.value })} className="mt-1" rows={2} /></div>
          <div><Label className="text-sm">Mentor proposé</Label><Input value={form.mentor} onChange={e => setForm({ ...form, mentor: e.target.value })} className="mt-1" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
