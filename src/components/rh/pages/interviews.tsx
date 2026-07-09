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
import { MessageSquare, Calendar, Plus, Loader2, Star, FileText, MapPin, User, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Interview {
  id: string; type: string; status: string; scheduledAt: string | null;
  location: string | null; conductedBy: string | null; agenda: string | null;
  minutes: string | null; rating: number;
  employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  ANNUEL: { label: 'Annuel', color: 'bg-[#27698a]/10 text-[#27698a]' },
  PROFESSIONNEL: { label: 'Professionnel', color: 'bg-purple-100 text-purple-700' },
  RECALAGE: { label: 'Recalage', color: 'bg-amber-100 text-amber-700' },
  SORTIE: { label: 'Exit', color: 'bg-red-100 text-red-700' },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PLANIFIE: { label: 'Planifié', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  REALISE: { label: 'Réalisé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ANNULE: { label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200' },
  REPORT: { label: 'Reporté', color: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/interviews').then(r => r.json()).then(d => { if (mounted) { setInterviews(d); setLoading(false) } }).catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const load = () => { setLoading(true); fetch('/api/interviews').then(r => r.json()).then(d => { setInterviews(d); setLoading(false) }) }

  const stats = { total: interviews.length, planifie: interviews.filter(i => i.status === 'PLANIFIE').length, realise: interviews.filter(i => i.status === 'REALISE').length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><MessageSquare className="w-6 h-6 text-[#27698a]" />Entretiens professionnels</h1>
          <p className="text-sm text-slate-500 mt-1">Planification, comptes-rendus et suivi</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Planifier</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={MessageSquare} label="Total" value={stats.total} color="#27698a" />
        <KpiCard icon={Calendar} label="Planifiés" value={stats.planifie} color="#96783c" />
        <KpiCard icon={FileText} label="Réalisés" value={stats.realise} color="#478e5e" />
      </div>

      <div className="space-y-3">
        {interviews.map(int => {
          const type = TYPE_META[int.type] || TYPE_META.ANNUEL
          const status = STATUS_META[int.status] || STATUS_META.PLANIFIE
          return (
            <Card key={int.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${int.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>
                  {int.employee.prenoms[0]}{int.employee.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className={type.color}>{type.label}</Badge>
                    <Badge variant="outline" className={status.color}>{status.label}</Badge>
                    {int.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-3 h-3 ${n <= int.rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{int.employee.nom} {int.employee.prenoms}</h3>
                  <p className="text-xs text-slate-500">{int.employee.poste}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                    {int.scheduledAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(int.scheduledAt).toLocaleString('fr-FR')}</span>}
                    {int.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{int.location}</span>}
                    {int.conductedBy && <span className="flex items-center gap-1"><User className="w-3 h-3" />{int.conductedBy}</span>}
                  </div>
                  {int.agenda && <div className="mt-2 p-2 rounded bg-slate-50 text-xs text-slate-700"><b>Ordre du jour :</b> {int.agenda}</div>}
                  {int.minutes && <div className="mt-1 p-2 rounded bg-[#27698a]/5 text-xs text-slate-700"><b>Compte-rendu :</b> {int.minutes}</div>}
                </div>
              </div>
            </Card>
          )
        })}
        {interviews.length === 0 && <Card className="p-8 text-center text-slate-400"><MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun entretien planifié</p></Card>}
      </div>

      {wizardOpen && <InterviewWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function InterviewWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', type: 'ANNUEL', scheduledAt: '', location: 'Bureau Conakry', conductedBy: 'RH', agenda: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])

  const handleSubmit = async () => {
    if (!form.employeeId) { toast.error('Employé requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/interviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Entretien planifié'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#27698a]" />Planifier un entretien</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Employé *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-sm">Date/heure</Label><Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Lieu</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Conducteur</Label><Input value={form.conductedBy} onChange={e => setForm({ ...form, conductedBy: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-sm">Ordre du jour</Label><Textarea value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} className="mt-1" rows={3} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Planifier</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
