'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, LogIn, LogOut, Calendar, Users, TrendingUp, Plus, Loader2, Coffee } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface TimeEntry {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  breakMinutes: number
  workedMinutes: number
  overtimeMinutes: number
  status: string
  location: string | null
  employee: { id: string; nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PRESENT: { label: 'Présent', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  ABSENT: { label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200' },
  RETARD: { label: 'Retard', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  CONGE: { label: 'Congé', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  MISSION: { label: 'Mission', color: 'bg-sky-100 text-sky-700 border-sky-200' },
}

function formatMinutes(min: number): string {
  if (min === 0) return '—'
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h${m.toString().padStart(2, '0')}`
}

export function TimeTrackingPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/time-entries')
      .then(r => r.json())
      .then(d => { setEntries(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/time-entries')
      .then(r => r.json())
      .then(d => { if (mounted) { setEntries(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const todayEntries = entries.filter(e => e.date === today)
  const totalPresent = entries.filter(e => e.status === 'PRESENT').length
  const totalAbsent = entries.filter(e => e.status === 'ABSENT').length
  const totalOvertime = entries.reduce((sum, e) => sum + e.overtimeMinutes, 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#27698a]" />
            Temps &amp; Présence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pointage, heures travaillées et heures supplémentaires
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau pointage
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Présents aujourd'hui" value={totalPresent} color="#478e5e" />
        <KpiCard icon={Users} label="Absents aujourd'hui" value={totalAbsent} color="#b94659" />
        <KpiCard icon={Clock} label="Heures pointées" value={entries.length} color="#27698a" />
        <KpiCard icon={TrendingUp} label="Heures supp. total" value={formatMinutes(totalOvertime)} color="#96783c" />
      </div>

      {/* Liste des pointages */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 text-sm">
            Historique des pointages ({entries.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-600 uppercase">
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Arrivée</th>
                <th className="px-4 py-3 text-center">Départ</th>
                <th className="px-4 py-3 text-center hidden md:table-cell">Pause</th>
                <th className="px-4 py-3 text-center">Travaillées</th>
                <th className="px-4 py-3 text-center hidden lg:table-cell">Supp.</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => {
                const status = STATUS_META[e.status] || STATUS_META.PRESENT
                return (
                  <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${
                          e.employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'
                        }`}>
                          {e.employee.prenoms[0]}{e.employee.nom[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">{e.employee.nom} {e.employee.prenoms}</div>
                          <div className="text-xs text-slate-500 truncate">{e.employee.poste}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-center">
                      {e.checkIn ? (
                        <span className="font-mono text-sm text-emerald-600 flex items-center justify-center gap-1">
                          <LogIn className="w-3 h-3" />
                          {e.checkIn}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {e.checkOut ? (
                        <span className="font-mono text-sm text-red-600 flex items-center justify-center gap-1">
                          <LogOut className="w-3 h-3" />
                          {e.checkOut}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600 hidden md:table-cell">
                      <span className="flex items-center justify-center gap-1 text-xs">
                        <Coffee className="w-3 h-3" />
                        {e.breakMinutes}min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium text-slate-900">
                      {formatMinutes(e.workedMinutes)}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {e.overtimeMinutes > 0 ? (
                        <span className="font-mono text-xs text-amber-600 font-bold">+{formatMinutes(e.overtimeMinutes)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={status.color}>{status.label}</Badge>
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    Aucun pointage enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800">
        ⏱️ <strong>Règles de calcul :</strong> Heures normales = 8h/jour (480 min). Au-delà = heures supplémentaires (majoration 25% en semaine, 50% de nuit, 75% dimanche, 100% jour férié).
        Pause déjeuner par défaut : 60 minutes.
      </div>

      {wizardOpen && (
        <CheckInWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
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
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

function CheckInWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employeeId: '',
    date: new Date().toISOString().slice(0, 10),
    checkIn: '08:00',
    checkOut: '17:00',
    breakMinutes: '60',
    status: 'PRESENT',
    location: 'Bureau Conakry',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.employeeId) { toast.error('Sélectionne un employé'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Pointage enregistré')
        onCreated()
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#27698a]" />
            Nouveau pointage
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Employé *</Label>
            <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Date</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Arrivée</Label>
              <Input type="time" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Départ</Label>
              <Input type="time" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Pause (min)</Label>
              <Input type="number" value={form.breakMinutes} onChange={e => setForm({ ...form, breakMinutes: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Lieu</Label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
