'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Download, FileText, Users, Wallet, Calendar, Clock, Briefcase, GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF } from '@/lib/utils-rh'

const ICON_MAP: Record<string, React.ElementType> = { Users, Wallet, Calendar, Clock, Briefcase, GraduationCap }

interface Data { templates: any[]; data: any }

export function CustomReportsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  useEffect(() => { let m = true; fetch('/api/custom-reports').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-[#27698a]" />Rapports personnalisés</h1><p className="text-sm text-slate-500 mt-1">Créateur de rapports avancés avec modèles préconfigurés</p></div>

      {/* Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.templates.map((t: any) => {
          const Icon = ICON_MAP[t.icon] || FileText
          const isSelected = selectedTemplate === t.id
          return (
            <Card key={t.id} className={`p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-[#27698a] bg-[#27698a]/5' : 'hover:bg-slate-50'}`}>
              <button onClick={() => setSelectedTemplate(isSelected ? null : t.id)} className="w-full text-left">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#27698a]/10 text-[#27698a]"><Icon className="w-4 h-4" /></div>
                  <Badge variant="outline" className="text-[10px]">{t.category}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {t.columns.map((c: string, i: number) => <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{c}</span>)}
                </div>
              </button>
            </Card>
          )
        })}
      </div>

      {/* Preview */}
      {selectedTemplate && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4 text-[#27698a]" />Aperçu du rapport</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toast.success('Export Excel téléchargé (simulation)')}><Download className="w-4 h-4 mr-1" />Excel</Button>
              <Button size="sm" variant="outline" onClick={() => toast.success('Export PDF téléchargé (simulation)')}><Download className="w-4 h-4 mr-1" />PDF</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-left text-xs text-slate-600 uppercase">
                {data.templates.find((t: any) => t.id === selectedTemplate)?.columns.map((c: string, i: number) => <th key={i} className="px-3 py-2">{c}</th>)}
              </tr></thead>
              <tbody>
                {/* Mock data rows */}
                <tr className="border-b border-slate-100"><td className="px-3 py-2">Juin 2026</td><td className="px-3 py-2">9</td><td className="px-3 py-2">1</td><td className="px-3 py-2">0</td><td className="px-3 py-2 text-emerald-600">3.2%</td></tr>
                <tr className="border-b border-slate-100"><td className="px-3 py-2">Mai 2026</td><td className="px-3 py-2">9</td><td className="px-3 py-2">0</td><td className="px-3 py-2">1</td><td className="px-3 py-2 text-emerald-600">2.8%</td></tr>
                <tr className="border-b border-slate-100"><td className="px-3 py-2">Avril 2026</td><td className="px-3 py-2">8</td><td className="px-3 py-2">1</td><td className="px-3 py-2">0</td><td className="px-3 py-2 text-amber-600">4.1%</td></tr>
                <tr className="border-b border-slate-100"><td className="px-3 py-2">Mars 2026</td><td className="px-3 py-2">8</td><td className="px-3 py-2">0</td><td className="px-3 py-2">0</td><td className="px-3 py-2 text-emerald-600">2.5%</td></tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {data.data.employeeCount} employés</span>
            <span className="inline-flex items-center gap-1"><Wallet className="w-3 h-3" /> {formatGNF(data.data.payrollTotal)} masse salariale</span>
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {data.data.leaveCount} congés</span>
            <span className="inline-flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {data.data.trainingCount} formations</span>
          </div>
        </Card>
      )}

      {/* Builder info */}
      <Card className="p-5 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#27698a]" />Créateur de rapport avancé</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-white border border-slate-200"><div className="font-medium text-slate-900 mb-1">1. Source de données</div><p className="text-xs text-slate-500">Sélectionnez la source : Employés, Paie, Congés, Formations, Notes de frais, Candidats...</p></div>
          <div className="p-3 rounded-lg bg-white border border-slate-200"><div className="font-medium text-slate-900 mb-1">2. Colonnes & filtres</div><p className="text-xs text-slate-500">Glissez-déposez les colonnes, appliquez des filtres (date, statut, département...)</p></div>
          <div className="p-3 rounded-lg bg-white border border-slate-200"><div className="font-medium text-slate-900 mb-1">3. Export & planification</div><p className="text-xs text-slate-500">Export Excel/PDF, planification automatique (mensuel, trimestriel), envoi par email</p></div>
        </div>
        <Button className="mt-4 bg-[#27698a] hover:bg-[#1f5570]" onClick={() => toast.info('Créateur avancé — bientôt disponible')}><BarChart3 className="w-4 h-4 mr-2" />Ouvrir le créateur</Button>
      </Card>
    </div>
  )
}
