'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CalendarClock, Plus, Loader2, Sun, Sunset, Moon, Clock as ClockIcon } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Shift { id: string; date: string; startTime: string; endTime: string; type: string; location: string | null; notes: string | null; employee: { nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null } }

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = { MATIN: { label: 'Matin', icon: Sun, color: 'bg-amber-100 text-amber-700' }, APRES_MIDI: { label: 'Après-midi', icon: Sunset, color: 'bg-orange-100 text-orange-700' }, NUIT: { label: 'Nuit', icon: Moon, color: 'bg-indigo-100 text-indigo-700' }, JOURNEE: { label: 'Journée', icon: ClockIcon, color: 'bg-[#27698a]/10 text-[#27698a]' } }

export function ShiftsPage() {
  const [items, setItems] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  useEffect(() => { let m = true; fetch('/api/shifts').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/shifts').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }

  // Group by date
  const byDate: Record<string, Shift[]> = {}
  items.forEach(s => { if (!byDate[s.date]) byDate[s.date] = []; byDate[s.date].push(s) })
  const sortedDates = Object.keys(byDate).sort()

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><CalendarClock className="w-6 h-6 text-[#27698a]" />Planning d'équipe</h1><p className="text-sm text-slate-500 mt-1">Shifts, rotations et affectations horaires</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau shift</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(TYPE_META).map(([key, meta]) => { const count = items.filter(s => s.type === key).length; return (
          <Card key={key} className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}><meta.icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{count}</div><div className="text-xs text-slate-500">{meta.label}</div></div></div></Card>
        )})}
      </div>
      <div className="space-y-4">
        {sortedDates.map(date => (
          <Card key={date} className="p-4">
            <h2 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#27698a]" />{formatDate(date)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {byDate[date].map(s => {
                const meta = TYPE_META[s.type] || TYPE_META.JOURNEE
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-200">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}><meta.icon className="w-3.5 h-3.5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5"><div className={`w-5 h-5 rounded-full text-white flex items-center justify-center text-[8px] font-bold ${s.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{s.employee.prenoms[0]}{s.employee.nom[0]}</div><span className="text-sm font-medium text-slate-900 truncate">{s.employee.nom} {s.employee.prenoms}</span></div>
                      <div className="text-xs text-slate-500 flex items-center gap-2"><span className="font-mono">{s.startTime} - {s.endTime}</span><Badge variant="outline" className={meta.color + ' text-[9px]'}>{meta.label}</Badge>{s.location && <span>· {s.location}</span>}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card className="p-8 text-center text-slate-400"><CalendarClock className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun shift planifié</p></Card>}
      </div>
      {wizardOpen && <ShiftWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}
function ShiftWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().slice(0, 10), startTime: '08:00', endTime: '17:00', type: 'JOURNEE', location: 'Bureau Conakry', notes: '' })
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])
  const handleSubmit = async () => { if (!form.employeeId) { toast.error('Employé requis'); return }; setLoading(true); try { const res = await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Shift créé'); onCreated() } } catch { toast.error('Erreur') }; setLoading(false) }
  return (<Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-[#27698a]" />Nouveau shift</DialogTitle></DialogHeader>
    <div className="space-y-3">
      <div><Label className="text-sm">Employé *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid grid-cols-3 gap-3"><div><Label className="text-sm">Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" /></div><div><Label className="text-sm">Début</Label><Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="mt-1" /></div><div><Label className="text-sm">Fin</Label><Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="mt-1" /></div></div>
      <div className="grid grid-cols-2 gap-3"><div><Label className="text-sm">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-sm">Lieu</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" /></div></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
  </DialogContent></Dialog>)
}
