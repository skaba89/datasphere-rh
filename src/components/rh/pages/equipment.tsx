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
import { Package, Plus, Loader2, Laptop, Car, Table2, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF, formatDate } from '@/lib/utils-rh'

interface Equipment { id: string; name: string; category: string; serialNumber: string | null; brand: string | null; model: string | null; purchaseDate: string | null; purchasePrice: number | null; condition: string; status: string; notes: string | null }

const CAT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = { IT: { label: 'IT', icon: Laptop, color: 'bg-[#27698a]/10 text-[#27698a]' }, VEHICULE: { label: 'Véhicule', icon: Car, color: 'bg-amber-100 text-amber-700' }, BUREAU: { label: 'Bureau', icon: Table2, color: 'bg-emerald-100 text-emerald-700' }, AUTRE: { label: 'Autre', icon: Package, color: 'bg-slate-100 text-slate-700' } }
const STATUS_META: Record<string, { label: string; color: string }> = { EN_STOCK: { label: 'En stock', color: 'bg-slate-50 text-slate-600 border-slate-200' }, ATTRIBUE: { label: 'Attribué', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, EN_REPARATION: { label: 'En réparation', color: 'bg-amber-50 text-amber-700 border-amber-200' }, RETIRE: { label: 'Retiré', color: 'bg-red-50 text-red-700 border-red-200' } }
const CONDITION_META: Record<string, string> = { NEUF: 'Neuf', BON: 'Bon', USAGE: 'Usagé', A_REPARER: 'À réparer', HORS_SERVICE: 'HS' }

export function EquipmentPage() {
  const [items, setItems] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  useEffect(() => { let m = true; fetch('/api/equipment').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/equipment').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }
  const filtered = filterCat === 'all' ? items : items.filter(i => i.category === filterCat)
  const stats = { total: items.length, attribue: items.filter(i => i.status === 'ATTRIBUE').length, stock: items.filter(i => i.status === 'EN_STOCK').length, valeur: items.reduce((s, i) => s + (i.purchasePrice || 0), 0) }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Package className="w-6 h-6 text-[#27698a]" />Inventaire matériel</h1><p className="text-sm text-slate-500 mt-1">Équipements IT, véhicules et mobilier de bureau</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvel équipement</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Package} label="Total" value={stats.total} color="#27698a" />
        <KpiCard icon={Laptop} label="Attribués" value={stats.attribue} color="#478e5e" />
        <KpiCard icon={Package} label="En stock" value={stats.stock} color="#96783c" />
        <KpiCard icon={Wrench} label="Valeur totale" value={formatGNF(stats.valeur)} color="#b94659" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === 'all' ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>Tous</button>
        {Object.entries(CAT_META).map(([k, v]) => <button key={k} onClick={() => setFilterCat(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterCat === k ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{v.label}</button>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(e => {
          const cat = CAT_META[e.category] || CAT_META.AUTRE
          const status = STATUS_META[e.status] || STATUS_META.EN_STOCK
          return (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cat.color}`}><cat.icon className="w-4 h-4" /></div>
                <Badge variant="outline" className={status.color + ' text-[10px]'}>{status.label}</Badge>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{e.name}</h3>
              <Badge variant="outline" className={cat.color + ' text-[10px] mt-1'}>{cat.label}</Badge>
              <div className="space-y-1 mt-2 text-xs text-slate-600">
                {e.brand && <div>Marque : {e.brand} {e.model}</div>}
                {e.serialNumber && <div className="font-mono">S/N : {e.serialNumber}</div>}
                <div>État : <span className={`font-medium ${e.condition === 'NEUF' || e.condition === 'BON' ? 'text-emerald-600' : e.condition === 'A_REPARER' ? 'text-amber-600' : e.condition === 'HORS_SERVICE' ? 'text-red-600' : ''}`}>{CONDITION_META[e.condition] || e.condition}</span></div>
                {e.purchaseDate && <div>Acheté : {formatDate(e.purchaseDate)}{e.purchasePrice ? ` · ${formatGNF(e.purchasePrice)}` : ''}</div>}
              </div>
              {e.notes && <div className="mt-2 p-1.5 rounded bg-slate-50 text-xs italic text-slate-600">{e.notes}</div>}
            </Card>
          )
        })}
        {filtered.length === 0 && <Card className="col-span-full p-8 text-center text-slate-400"><Package className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun équipement</p></Card>}
      </div>
      {wizardOpen && <EquipmentWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-lg lg:text-xl font-bold text-slate-900 truncate">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
function EquipmentWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', category: 'IT', serialNumber: '', brand: '', model: '', purchaseDate: '', purchasePrice: '', condition: 'NEUF', status: 'EN_STOCK', notes: '' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => { if (!form.name) { toast.error('Nom requis'); return }; setLoading(true); try { const res = await fetch('/api/equipment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Équipement créé'); onCreated() } } catch { toast.error('Erreur') }; setLoading(false) }
  return (<Dialog open onOpenChange={(v) => !v && onClose()}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-[#27698a]" />Nouvel équipement</DialogTitle></DialogHeader>
    <div className="space-y-3">
      <div><Label className="text-sm">Nom *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Ordinateur portable Dell Latitude" /></div>
      <div className="grid grid-cols-2 gap-3"><div><Label className="text-sm">Catégorie</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CAT_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-sm">État</Label><Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CONDITION_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div></div>
      <div className="grid grid-cols-2 gap-3"><div><Label className="text-sm">Marque</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="mt-1" /></div><div><Label className="text-sm">Modèle</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="mt-1" /></div></div>
      <div><Label className="text-sm">Numéro de série</Label><Input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className="mt-1 font-mono" /></div>
      <div className="grid grid-cols-2 gap-3"><div><Label className="text-sm">Date achat</Label><Input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className="mt-1" /></div><div><Label className="text-sm">Prix (GNF)</Label><Input type="number" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} className="mt-1" /></div></div>
      <div><Label className="text-sm">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} /></div>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
  </DialogContent></Dialog>)
}
