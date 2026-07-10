'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Plus, Loader2, Navigation, Home, Building2, Wifi, CheckCircle2, XCircle, MapPinned, AlertTriangle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface WorkLocation { id: string; name: string; address: string | null; latitude: number | null; longitude: number | null; radius: number; type: string; active: boolean }
interface GeoCheckIn { id: string; date: string; checkIn: string; checkOut: string | null; mode: string; verified: boolean; distance: number | null; employee: { nom: string; prenoms: string; matricule: string; poste: string; sexe: string | null }; workLocation: { name: string; type: string } | null }

const LOC_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  BUREAU: { label: 'Bureau', icon: Building2, color: 'bg-[#27698a]/10 text-[#27698a]' },
  DOMICILE: { label: 'Domicile', icon: Home, color: 'bg-emerald-100 text-emerald-700' },
  SITE: { label: 'Site', icon: MapPin, color: 'bg-amber-100 text-amber-700' },
  COWORKING: { label: 'Coworking', icon: Wifi, color: 'bg-purple-100 text-purple-700' },
}

const MODE_META: Record<string, { label: string; color: string }> = {
  PRESENTIEL: { label: 'Présentiel', color: 'bg-emerald-100 text-emerald-700' },
  TELETRAVAIL: { label: 'Télétravail', color: 'bg-sky-100 text-sky-700' },
  MISSION: { label: 'Mission', color: 'bg-amber-100 text-amber-700' },
}

export function GeoPage() {
  const [data, setData] = useState<{ locations: WorkLocation[]; checkIns: GeoCheckIn[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [locWizard, setLocWizard] = useState(false)
  const [checkInWizard, setCheckInWizard] = useState(false)

  const load = () => { setLoading(true); fetch('/api/work-locations').then(r => r.json()).then(d => { setData(d); setLoading(false) }) }
  useEffect(() => { let m = true; fetch('/api/work-locations').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const stats = { totalLocs: data.locations.length, totalCheckIns: data.checkIns.length, verified: data.checkIns.filter(c => c.verified).length, teletravail: data.checkIns.filter(c => c.mode === 'TELETRAVAIL').length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><MapPinned className="w-6 h-6 text-[#27698a]" />Géolocalisation &amp; Télétravail</h1>
          <p className="text-sm text-slate-500 mt-1">Pointage GPS, géofencing et gestion du télétravail</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCheckInWizard(true)}><Navigation className="w-4 h-4 mr-2" />Pointer</Button>
          <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setLocWizard(true)}><Plus className="w-4 h-4 mr-2" />Lieu</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={MapPin} label="Lieux de travail" value={stats.totalLocs} color="#27698a" />
        <KpiCard icon={Navigation} label="Pointages GPS" value={stats.totalCheckIns} color="#478e5e" />
        <KpiCard icon={CheckCircle2} label="Vérifiés" value={stats.verified} color="#96783c" />
        <KpiCard icon={Home} label="Télétravail" value={stats.teletravail} color="#b94659" />
      </div>

      {/* Lieux de travail */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-3">Lieux de travail configurés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.locations.map(loc => {
            const meta = LOC_TYPE_META[loc.type] || LOC_TYPE_META.BUREAU
            return (
              <div key={loc.id} className={`p-3 rounded-lg border ${loc.active ? 'border-slate-200' : 'border-slate-200 opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.color}`}><meta.icon className="w-4 h-4" /></div>
                  <Badge variant="outline" className={meta.color + ' text-[10px]'}>{meta.label}</Badge>
                </div>
                <div className="font-medium text-sm text-slate-900">{loc.name}</div>
                {loc.address && <div className="text-xs text-slate-500 mt-0.5">{loc.address}</div>}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                  {loc.latitude && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {loc.latitude.toFixed(4)}, {loc.longitude?.toFixed(4)}</span>}
                  <span>Rayon: {loc.radius}m</span>
                </div>
              </div>
            )
          })}
          {data.locations.length === 0 && <p className="text-sm text-slate-400 italic col-span-full text-center py-4">Aucun lieu configuré</p>}
        </div>
      </Card>

      {/* Historique pointages */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">Pointages GPS ({data.checkIns.length})</h2></div>
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {data.checkIns.map(c => {
            const mode = MODE_META[c.mode] || MODE_META.PRESENTIEL
            return (
              <div key={c.id} className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.verified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                  {c.verified ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-slate-900">{c.employee.nom} {c.employee.prenoms}</span>
                    <Badge variant="outline" className={mode.color + ' text-[10px]'}>{mode.label}</Badge>
                    {c.workLocation && <span className="text-xs text-slate-500 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {c.workLocation.name}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {formatDate(c.date)} · Arrivée {c.checkIn}{c.checkOut ? ` · Départ ${c.checkOut}` : ''}
                    {c.distance !== null && ` · ${c.distance}m du point`}
                  </div>
                </div>
                <Badge variant="outline" className={`inline-flex items-center gap-1 ${c.verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {c.verified ? <><Check className="w-3 h-3" /> Vérifié</> : <><AlertTriangle className="w-3 h-3" /> Hors zone</>}
                </Badge>
              </div>
            )
          })}
          {data.checkIns.length === 0 && <div className="px-4 py-8 text-center text-slate-400"><Navigation className="w-10 h-10 mx-auto text-slate-300 mb-2" /><p className="text-sm">Aucun pointage GPS</p></div>}
        </div>
      </Card>

      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
        <MapPin className="w-3.5 h-3.5 inline" /> <strong>Géofencing :</strong> Les pointages sont vérifiés automatiquement en comparant la position GPS de l'employé avec le rayon configuré du lieu de travail. Le télétravail est tracé séparément.
      </div>

      {locWizard && <LocationWizard onClose={() => setLocWizard(false)} onCreated={() => { setLocWizard(false); load() }} />}
      {checkInWizard && <CheckInWizard locations={data.locations} onClose={() => setCheckInWizard(false)} onCreated={() => { setCheckInWizard(false); load() }} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function LocationWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '', radius: '100', type: 'BUREAU' })
  const [loading, setLoading] = useState(false)
  const detectLocation = () => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => { setForm({ ...form, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }); toast.success('Position GPS détectée') }, () => toast.error('Géolocalisation refusée')) } else { toast.error('Géolocalisation non supportée') } }
  const handleSubmit = async () => {
    if (!form.name) { toast.error('Nom requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/work-locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Lieu créé'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-[#27698a]" />Nouveau lieu de travail</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Bureau Conakry" /></div>
          <div><Label className="text-sm">Adresse</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-sm">Type</Label><Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(LOC_TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Latitude</Label><Input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} className="mt-1" placeholder="9.5092" /></div>
            <div><Label className="text-sm">Longitude</Label><Input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} className="mt-1" placeholder="-13.7122" /></div>
          </div>
          <Button variant="outline" size="sm" onClick={detectLocation} className="w-full"><Navigation className="w-4 h-4 mr-2" />Détecter ma position GPS</Button>
          <div><Label className="text-sm">Rayon géofencing (m)</Label><Input type="number" value={form.radius} onChange={e => setForm({ ...form, radius: e.target.value })} className="mt-1" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CheckInWizard({ locations, onClose, onCreated }: { locations: WorkLocation[]; onClose: () => void; onCreated: () => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({ employeeId: '', workLocationId: '', mode: 'PRESENTIEL', latitude: '', longitude: '' })
  const [loading, setLoading] = useState(false)
  useEffect(() => { fetch('/api/employees').then(r => r.json()).then(setEmployees).catch(() => {}) }, [])
  const detectLocation = () => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => { setForm({ ...form, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }); toast.success('Position GPS détectée') }, () => toast.error('Géolocalisation refusée')) } }
  const handleSubmit = async () => {
    if (!form.employeeId) { toast.error('Employé requis'); return }
    setLoading(true)
    const now = new Date().toTimeString().slice(0, 5)
    try {
      const res = await fetch('/api/work-locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, checkIn: now, date: new Date().toISOString().slice(0, 10), latitude: form.latitude ? Number(form.latitude) : null, longitude: form.longitude ? Number(form.longitude) : null }) })
      const data = await res.json()
      if (res.ok) { toast.success(data.verified ? `Pointage vérifié (${data.distance}m)` : 'Pointage enregistré (hors zone)'); onCreated() }
    } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Navigation className="w-5 h-5 text-[#27698a]" />Pointage GPS</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Employé *</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Lieu</Label><Select value={form.workLocationId} onValueChange={v => setForm({ ...form, workLocationId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Aucun" /></SelectTrigger><SelectContent><SelectItem value="">Aucun</SelectItem>{locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-sm">Mode</Label><Select value={form.mode} onValueChange={v => setForm({ ...form, mode: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PRESENTIEL">Présentiel</SelectItem><SelectItem value="TELETRAVAIL">Télétravail</SelectItem><SelectItem value="MISSION">Mission</SelectItem></SelectContent></Select></div>
          </div>
          <Button variant="outline" size="sm" onClick={detectLocation} className="w-full"><Navigation className="w-4 h-4 mr-2" />Détecter ma position GPS</Button>
          {form.latitude && <div className="p-2 rounded bg-slate-50 text-xs text-slate-600 inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {form.latitude}, {form.longitude}</div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Pointer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
