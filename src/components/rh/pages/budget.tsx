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
import { Wallet, TrendingUp, TrendingDown, PieChart, Plus, Loader2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF } from '@/lib/utils-rh'

interface BudgetData {
  items: any[]
  summary: Record<string, { prevu: number; realise: number }>
  totals: { prevu: number; realise: number; ecart: number }
  monthlyData: Array<{ mois: string; masseSalariale: number; charges: number; total: number }>
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  MASSE_SALARIALE: { label: 'Masse salariale', color: 'bg-[#27698a]' },
  CHARGES: { label: 'Charges patronales', color: 'bg-[#b94659]' },
  FORMATION: { label: 'Formation', color: 'bg-[#478e5e]' },
  RECRUTEMENT: { label: 'Recrutement', color: 'bg-[#96783c]' },
  AUTRE: { label: 'Autre', color: 'bg-slate-500' },
}

export function BudgetPage() {
  const [data, setData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    fetch('/api/budget')
      .then(r => r.json())
      .then(d => { if (mounted) { setData(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const load = () => {
    fetch('/api/budget')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }

  if (loading || !data) {
    return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>
  }

  const ecartPct = data.totals.prevu > 0 ? (data.totals.ecart / data.totals.prevu) * 100 : 0
  const maxMonthly = Math.max(...data.monthlyData.map(m => m.total), 1)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#27698a]" />
            Budget RH
          </h1>
          <p className="text-sm text-slate-500 mt-1">Prévisions vs réalisé · Exercice 2026</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle ligne budgétaire
        </Button>
      </div>

      {/* KPIs globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Wallet} label="Budget prévu 2026" value={formatGNF(data.totals.prevu)} color="#27698a" />
        <KpiCard icon={TrendingDown} label="Réalisé" value={formatGNF(data.totals.realise)} color="#478e5e" />
        <KpiCard icon={ecartPct >= 0 ? TrendingUp : TrendingDown} label="Écart" value={formatGNF(Math.abs(data.totals.ecart))} color={ecartPct >= 0 ? '#478e5e' : '#b94659'} sub={`${ecartPct >= 0 ? '√' : '⚠'} ${Math.abs(ecartPct).toFixed(1)}%`} />
        <KpiCard icon={PieChart} label="Taux d'exécution" value={`${data.totals.prevu > 0 ? ((data.totals.realise / data.totals.prevu) * 100).toFixed(0) : 0}%`} color="#96783c" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Évolution mensuelle */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Évolution mensuelle 2026</h2>
          <div className="space-y-3">
            {data.monthlyData.map((m, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{m.mois}</span>
                  <span className="text-slate-500 font-mono">{formatGNF(m.total)}</span>
                </div>
                <div className="flex gap-1 h-5">
                  <div className="bg-[#27698a] rounded-l" style={{ width: `${(m.masseSalariale / maxMonthly) * 100}%` }} title={`Masse salariale: ${formatGNF(m.masseSalariale)}`} />
                  <div className="bg-[#b94659] rounded-r" style={{ width: `${(m.charges / maxMonthly) * 100}%` }} title={`Charges: ${formatGNF(m.charges)}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#27698a] rounded"></div>
              <span className="text-slate-600">Masse salariale</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#b94659] rounded"></div>
              <span className="text-slate-600">Charges patronales</span>
            </div>
          </div>
        </Card>

        {/* Répartition par catégorie */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Répartition par catégorie</h2>
          <div className="space-y-3">
            {Object.entries(data.summary).map(([cat, amounts]) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META.AUTRE
              const total = amounts.prevu + amounts.realise
              const maxCat = Math.max(...Object.values(data.summary).map(s => s.prevu + s.realise), 1)
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{meta.label}</span>
                    <span className="text-slate-500">
                      Prévu: {formatGNF(amounts.prevu)} · Réalisé: {formatGNF(amounts.realise)}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className={`${meta.color} opacity-60`} style={{ width: `${(amounts.prevu / maxCat) * 100}%` }} />
                    <div className={meta.color} style={{ width: `${(amounts.realise / maxCat) * 100}%` }} />
                  </div>
                </div>
              )
            })}
            {Object.keys(data.summary).length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">Aucune donnée budgétaire</p>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-400 rounded"></div>
              <span className="text-slate-600">Prévu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#27698a] rounded"></div>
              <span className="text-slate-600">Réalisé</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Liste des lignes budgétaires */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 text-sm">Lignes budgétaires ({data.items.length})</h2>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left text-xs text-slate-600 uppercase">
                <th className="px-4 py-2">Catégorie</th>
                <th className="px-4 py-2">Libellé</th>
                <th className="px-4 py-2">Période</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(item => {
                const meta = CATEGORY_META[item.category] || CATEGORY_META.AUTRE
                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-xs">
                        <span className={`w-2 h-2 rounded-full ${meta.color} mr-1.5`} />
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">{item.label}</td>
                    <td className="px-4 py-2 text-slate-600 font-mono text-xs">{item.period}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className={item.type === 'PREVU' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}>
                        {item.type === 'PREVU' ? 'Prévu' : 'Réalisé'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-medium text-slate-900">{formatGNF(item.amount)}</td>
                  </tr>
                )
              })}
              {data.items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Aucune ligne budgétaire</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {wizardOpen && (
        <BudgetWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string; color: string; sub?: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p>
          <p className="text-base lg:text-lg font-bold text-slate-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  )
}

function BudgetWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    category: 'MASSE_SALARIALE',
    label: '',
    amount: '',
    period: '2026-07',
    type: 'PREVU',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.label || !form.amount) { toast.error('Libellé et montant requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Ligne budgétaire créée')
        onCreated()
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
            <DollarSign className="w-5 h-5 text-[#27698a]" />
            Nouvelle ligne budgétaire
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Catégorie</Label>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Libellé *</Label>
            <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="mt-1" placeholder="Salaire Juillet 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Montant (GNF) *</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Période</Label>
              <Input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="mt-1" placeholder="2026-07" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Type</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PREVU">Prévu</SelectItem>
                <SelectItem value="REALISE">Réalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
