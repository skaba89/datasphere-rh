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
import { RefreshCw, Plus, Loader2, Star, Users, User, Crown, ArrowRight, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Feedback360 {
  id: string; period: string; status: string;
  employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }
  responses: Array<{ id: string; evaluatorName: string; evaluatorRole: string; rating: number; strengths: string | null; improvements: string | null }>
}

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  MANAGER: { label: 'Manager', icon: Crown, color: 'bg-[#27698a]/10 text-[#27698a]' },
  PAIR: { label: 'Pair', icon: Users, color: 'bg-emerald-100 text-emerald-700' },
  SUBORDONNE: { label: 'Subordonné', icon: User, color: 'bg-amber-100 text-amber-700' },
  SELF: { label: 'Auto-éval', icon: User, color: 'bg-purple-100 text-purple-700' },
  CLIENT: { label: 'Client', icon: Users, color: 'bg-sky-100 text-sky-700' },
}

export function Feedback360Page() {
  const [items, setItems] = useState<Feedback360[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [respondWizard, setRespondWizard] = useState<string | null>(null)

  useEffect(() => { let m = true; fetch('/api/feedback360').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/feedback360').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><RefreshCw className="w-6 h-6 text-[#27698a]" />Feedback 360°</h1><p className="text-sm text-slate-500 mt-1">Évaluation multi-évaluateurs (manager, pairs, subordonnés, self)</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau feedback</Button>
      </div>

      <div className="space-y-3">
        {items.map(fb => {
          const avgRating = fb.responses.length > 0 ? fb.responses.reduce((s, r) => s + r.rating, 0) / fb.responses.length : 0
          const roles = [...new Set(fb.responses.map(r => r.evaluatorRole))]
          return (
            <Card key={fb.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-xs font-bold ${fb.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{fb.employee.prenoms[0]}{fb.employee.nom[0]}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{fb.employee.nom} {fb.employee.prenoms}</h3>
                    <p className="text-xs text-slate-500">{fb.employee.poste} · {fb.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={fb.status === 'OUVERT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}>{fb.status === 'OUVERT' ? 'Ouvert' : 'Clôturé'}</Badge>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(avgRating) ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />)}
                    <span className="text-xs text-slate-500 ml-1">{avgRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs text-slate-500">Évaluateurs :</span>
                {roles.map(role => {
                  const meta = ROLE_META[role] || ROLE_META.PAIR
                  const count = fb.responses.filter(r => r.evaluatorRole === role).length
                  return <Badge key={role} variant="outline" className={meta.color + ' text-[10px]'}><meta.icon className="w-2.5 h-2.5 mr-1" />{meta.label} ({count})</Badge>
                })}
                {roles.length === 0 && <span className="text-xs text-slate-400 italic">Aucune réponse</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {fb.responses.map(resp => {
                  const meta = ROLE_META[resp.evaluatorRole] || ROLE_META.PAIR
                  return (
                    <div key={resp.id} className="p-2 rounded border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900">{resp.evaluatorName}</span>
                        <div className="flex items-center gap-1"><Badge variant="outline" className={meta.color + ' text-[9px]'}>{meta.label}</Badge><span className="text-amber-500 font-bold">{resp.rating}/5</span></div>
                      </div>
                      {resp.strengths && <div className="text-emerald-700"><b>+</b> {resp.strengths.slice(0, 60)}</div>}
                      {resp.improvements && <div className="text-amber-700 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> <span>{resp.improvements.slice(0, 60)}</span></div>}
                    </div>
                  )
                })}
              </div>

              {fb.status === 'OUVERT' && <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={() => setRespondWizard(fb.id)}><Plus className="w-3 h-3 mr-1" />Ajouter évaluation</Button>}
            </Card>
          )
        })}
        {items.length === 0 && <Card className="p-8 text-center text-slate-400"><RefreshCw className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun feedback 360°</p></Card>}
      </div>

      {wizardOpen && <FeedbackWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
      {respondWizard && <RespondWizard feedbackId={respondWizard} onClose={() => setRespondWizard(null)} onCreated={() => { setRespondWizard(null); load() }} />}
    </div>
  )
}

function FeedbackWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', period: '2026-S2' })
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])
  const handleSubmit = async () => {
    if (!form.employeeId) { toast.error('Employé requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/feedback360', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Feedback 360° créé'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-[#27698a]" />Nouveau feedback 360°</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Employé évalué *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-sm">Période</Label><Select value={form.period} onValueChange={v => setForm({ ...form, period: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="2026-S1">2026 S1</SelectItem><SelectItem value="2026-S2">2026 S2</SelectItem><SelectItem value="2026-annual">2026 Annuelle</SelectItem></SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RespondWizard({ feedbackId, onClose, onCreated }: { feedbackId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ evaluatorName: '', evaluatorRole: 'PAIR', rating: '3', strengths: '', improvements: '' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!form.evaluatorName) { toast.error('Nom évaluateur requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/feedback360', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feedbackId, ...form }) }); if (res.ok) { toast.success('Évaluation soumise'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-[#27698a]" />Ajouter une évaluation</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Votre nom *</Label><Input value={form.evaluatorName} onChange={e => setForm({ ...form, evaluatorName: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-sm">Votre rôle</Label><Select value={form.evaluatorRole} onValueChange={v => setForm({ ...form, evaluatorRole: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(ROLE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label className="text-sm">Note (0-5)</Label><div className="flex items-center gap-2 mt-1">{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => setForm({ ...form, rating: String(n) })}><Star className={`w-6 h-6 ${n <= Number(form.rating) ? 'text-amber-400 fill-current' : 'text-slate-300'}`} /></button>)}</div></div>
          <div><Label className="text-sm">Points forts</Label><Textarea value={form.strengths} onChange={e => setForm({ ...form, strengths: e.target.value })} className="mt-1" rows={2} /></div>
          <div><Label className="text-sm">Axes d'amélioration</Label><Textarea value={form.improvements} onChange={e => setForm({ ...form, improvements: e.target.value })} className="mt-1" rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Soumettre</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
