'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Plus, X, Settings2, GripVertical, TrendingUp, Users, Wallet, Calendar, Clock, Award, Brain, Bell, ShieldCheck, Receipt, Mail, MessageSquare, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF } from '@/lib/utils-rh'

interface Widget {
  id: string
  type: string
  title: string
  enabled: boolean
}

const AVAILABLE_WIDGETS: Array<{ type: string; title: string; icon: React.ElementType; color: string; size: 'sm' | 'md' | 'lg' }> = [
  { type: 'kpi_effectif', title: 'Effectif total', icon: Users, color: '#27698a', size: 'sm' },
  { type: 'kpi_payroll', title: 'Masse salariale', icon: Wallet, color: '#b94659', size: 'sm' },
  { type: 'kpi_leaves', title: 'Congés en attente', icon: Calendar, color: '#96783c', size: 'sm' },
  { type: 'kpi_expenses', title: 'Notes de frais', icon: Receipt, color: '#478e5e', size: 'sm' },
  { type: 'kpi_time', title: 'Présents aujourd\'hui', icon: Clock, color: '#8b5cf6', size: 'sm' },
  { type: 'kpi_evaluations', title: 'Note moyenne', icon: Award, color: '#0ea5e9', size: 'sm' },
  { type: 'chart_contracts', title: 'Répartition contrats', icon: TrendingUp, color: '#27698a', size: 'md' },
  { type: 'chart_departments', title: 'Effectif par département', icon: Users, color: '#478e5e', size: 'md' },
  { type: 'list_alerts', title: 'Alertes IA', icon: Brain, color: '#b94659', size: 'lg' },
  { type: 'list_notifications', title: 'Notifications récentes', icon: Bell, color: '#96783c', size: 'lg' },
  { type: 'list_compliance', title: 'Conformité', icon: ShieldCheck, color: '#8b5cf6', size: 'md' },
  { type: 'list_expenses', title: 'Notes de frais en attente', icon: Receipt, color: '#0ea5e9', size: 'md' },
]

export function CustomDashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'w1', type: 'kpi_effectif', title: 'Effectif total', enabled: true },
    { id: 'w2', type: 'kpi_payroll', title: 'Masse salariale', enabled: true },
    { id: 'w3', type: 'kpi_leaves', title: 'Congés en attente', enabled: true },
    { id: 'w4', type: 'kpi_expenses', title: 'Notes de frais', enabled: true },
    { id: 'w5', type: 'chart_contracts', title: 'Répartition contrats', enabled: true },
    { id: 'w6', type: 'chart_departments', title: 'Effectif par département', enabled: true },
    { id: 'w7', type: 'list_alerts', title: 'Alertes IA', enabled: true },
  ])
  const [showLibrary, setShowLibrary] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    let m = true
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/ai-insights').then(r => r.json()).catch(() => []),
      fetch('/api/expenses').then(r => r.json()).catch(() => []),
      fetch('/api/compliance').then(r => r.json()).catch(() => []),
    ]).then(([dash, insights, expenses, compliance]) => {
      if (m) setData({ dash, insights, expenses, compliance })
    }).catch(() => {})
    return () => { m = false }
  }, [])

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id))
    toast.success('Widget retiré')
  }

  const addWidget = (type: string) => {
    const def = AVAILABLE_WIDGETS.find(w => w.type === type)
    if (!def) return
    setWidgets([...widgets, { id: `w${Date.now()}`, type, title: def.title, enabled: true }])
    toast.success(`${def.title} ajouté`)
    setShowLibrary(false)
  }

  const colSpan = (size: string) => size === 'sm' ? 'col-span-1' : size === 'md' ? 'col-span-2' : 'col-span-3'

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><LayoutGrid className="w-6 h-6 text-[#27698a]" />Dashboard personnalisable</h1>
          <p className="text-sm text-slate-500 mt-1">Composez votre tableau de bord avec les widgets de votre choix</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
            <Settings2 className="w-4 h-4 mr-2" />{editMode ? 'Terminer' : 'Personnaliser'}
          </Button>
          <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setShowLibrary(true)}>
            <Plus className="w-4 h-4 mr-2" />Ajouter widget
          </Button>
        </div>
      </div>

      {/* Widgets grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {widgets.map(widget => {
          const def = AVAILABLE_WIDGETS.find(w => w.type === widget.type)
          if (!def) return null
          return (
            <Card key={widget.id} className={`p-4 relative ${colSpan(def.size)} ${editMode ? 'ring-2 ring-[#27698a]/30' : ''}`}>
              {editMode && (
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-move" />
                  <button onClick={() => removeWidget(widget.id)} className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <WidgetRenderer type={widget.type} data={data} def={def} />
            </Card>
          )
        })}
        {widgets.length === 0 && (
          <Card className="col-span-full p-8 text-center text-slate-400">
            <LayoutGrid className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucun widget — ajoutez-en depuis la bibliothèque</p>
          </Card>
        )}
      </div>

      {/* Library modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLibrary(false)}>
          <Card className="p-5 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-[#27698a]" />Bibliothèque de widgets</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowLibrary(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_WIDGETS.map(w => (
                <button key={w.type} onClick={() => addWidget(w.type)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-[#27698a] hover:bg-[#27698a]/5 text-left transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: w.color + '15', color: w.color }}>
                      <w.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-slate-900">{w.title}</span>
                  </div>
                  <p className="text-xs text-slate-500">Taille : {w.size}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function WidgetRenderer({ type, data, def }: { type: string; data: any; def: any }) {
  if (!data) return <div className="animate-pulse h-20 bg-slate-100 rounded" />

  const Icon = def.icon

  if (type.startsWith('kpi_')) {
    let value = '—'
    let sub = ''
    if (type === 'kpi_effectif') { value = String(data.dash?.totalEmployees || 0); sub = 'employés actifs' }
    if (type === 'kpi_payroll') { value = formatGNF(data.dash?.monthlyPayroll || 0); sub = 'masse salariale mensuelle' }
    if (type === 'kpi_leaves') { value = String(data.dash?.pendingLeaves || 0); sub = 'demandes en attente' }
    if (type === 'kpi_expenses') { value = String(data.expenses?.filter((e: any) => e.status === 'EN_ATTENTE').length || 0); sub = 'notes de frais en attente' }
    if (type === 'kpi_time') { value = String(data.dash?.activeEmployees || 0); sub = 'actifs aujourd\'hui' }
    if (type === 'kpi_evaluations') { value = '4.3'; sub = 'note moyenne / 5' }

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{def.title}</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: def.color + '15', color: def.color }}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
      </div>
    )
  }

  if (type === 'chart_contracts') {
    const cdi = data.dash?.cdiCount || 0
    const cdd = data.dash?.cddCount || 0
    const stage = data.dash?.stageCount || 0
    const total = cdi + cdd + stage || 1
    return (
      <div>
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{def.title}</h3>
        <div className="space-y-2">
          {[{ label: 'CDI', count: cdi, color: 'bg-emerald-500' }, { label: 'CDD', count: cdd, color: 'bg-amber-500' }, { label: 'Stage', count: stage, color: 'bg-sky-500' }].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1"><span className="font-medium text-slate-700">{item.label}</span><span className="text-slate-500">{item.count}</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / total) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'chart_departments') {
    return (
      <div>
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{def.title}</h3>
        <div className="space-y-2">
          {[{ dept: 'Direction', count: 1, color: '#27698a' }, { dept: 'RH', count: 3, color: '#478e5e' }, { dept: 'IT', count: 1, color: '#96783c' }, { dept: 'Finance', count: 1, color: '#b94659' }, { dept: 'Santé', count: 1, color: '#8b5cf6' }].map(d => (
            <div key={d.dept}>
              <div className="flex items-center justify-between text-xs mb-1"><span className="font-medium text-slate-700">{d.dept}</span><span className="text-slate-500">{d.count}</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(d.count / 9) * 100}%`, backgroundColor: d.color }} /></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'list_alerts') {
    const insights = data.insights || []
    return (
      <div>
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{def.title}</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {insights.slice(0, 5).map((insight: any, i: number) => (
            <div key={i} className={`p-2 rounded text-xs ${insight.severity === 'CRITICAL' ? 'bg-red-50 text-red-700' : insight.severity === 'WARNING' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'}`}>
              {insight.title}
            </div>
          ))}
          {insights.length === 0 && <p className="text-xs text-slate-400 italic">Aucune alerte</p>}
        </div>
      </div>
    )
  }

  if (type === 'list_notifications') {
    return (
      <div>
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{def.title}</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          <div className="p-2 rounded text-xs bg-sky-50 text-sky-700 inline-flex items-center gap-1"><Mail className="w-3 h-3 inline" /> Bulletin de paie Juin 2026 disponible</div>
          <div className="p-2 rounded text-xs bg-emerald-50 text-emerald-700 inline-flex items-center gap-1"><MessageSquare className="w-3 h-3 inline" /> Congé de Camara approuvé</div>
          <div className="p-2 rounded text-xs bg-amber-50 text-amber-700 inline-flex items-center gap-1"><Bell className="w-3 h-3 inline" /> Rappel : déclaration CNSS Q2</div>
        </div>
      </div>
    )
  }

  if (type === 'list_compliance') {
    const items = data.compliance || []
    const overdue = items.filter((c: any) => c.status === 'EN_RETARD')
    const aJour = items.filter((c: any) => c.status === 'A_JOUR')
    return (
      <div>
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{def.title}</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded bg-emerald-50 text-center">
            <div className="text-xl font-bold text-emerald-700">{aJour.length}</div>
            <div className="text-[10px] text-emerald-600">À jour</div>
          </div>
          <div className="p-2 rounded bg-red-50 text-center">
            <div className="text-xl font-bold text-red-700">{overdue.length}</div>
            <div className="text-[10px] text-red-600">En retard</div>
          </div>
        </div>
        {overdue.length > 0 && <div className="mt-2 p-2 rounded bg-red-50 text-xs text-red-700 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 inline" /> {overdue[0].title}</div>}
      </div>
    )
  }

  if (type === 'list_expenses') {
    const pending = (data.expenses || []).filter((e: any) => e.status === 'EN_ATTENTE')
    return (
      <div>
        <h3 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-3 flex items-center gap-2"><Icon className="w-3.5 h-3.5" />{def.title}</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {pending.slice(0, 4).map((exp: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-1.5 rounded border border-slate-200 text-xs">
              <span className="truncate">{exp.title}</span>
              <span className="font-mono font-bold text-slate-900">{formatGNF(exp.amount)}</span>
            </div>
          ))}
          {pending.length === 0 && <p className="text-xs text-slate-400 italic">Aucune note en attente</p>}
        </div>
      </div>
    )
  }

  return <div className="text-sm text-slate-400">Widget : {def.title}</div>
}
