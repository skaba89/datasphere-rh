'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, Shield, GitBranch, CheckCircle2, AlertTriangle, Clock, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'
import { toast } from 'sonner'

interface Data { kpis: any; entities: any[]; lineage: any[]; policies: any[] }
const POLICY_TYPE: Record<string, { label: string; color: string }> = {
  RETENTION: { label: 'Rétention', color: 'bg-[#27698a]/10 text-[#27698a]' },
  PRIVACY: { label: 'Confidentialité', color: 'bg-purple-100 text-purple-700' },
  PORTABILITY: { label: 'Portabilité', color: 'bg-emerald-100 text-emerald-700' },
}

export function DataGovernancePage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    let m = true
    fetch('/api/data-governance').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) })
    return () => { m = false }
  }, [])

  const handleExportCSV = async () => {
    if (!data) return
    setExporting(true)
    try {
      // Construction du CSV côté client
      const lines: string[] = []
      lines.push('# RAPPORT DE GOUVERNANCE DES DONNEES')
      lines.push(`# Genere le : ${new Date().toLocaleString('fr-FR')}`)
      lines.push('')

      // Section KPIs
      lines.push('## INDICATEURS CLES (KPIs)')
      lines.push('Indicateur,Valeur')
      lines.push(`Qualite globale,${data.kpis.dataQuality}%`)
      lines.push(`Completeness,${data.kpis.completeness}%`)
      lines.push(`Exactitude,${data.kpis.accuracy}%`)
      lines.push(`Cohérence,${data.kpis.consistency}%`)
      lines.push(`Fraîcheur,${data.kpis.freshness}%`)
      lines.push(`Unicité,${data.kpis.uniqueness}%`)
      lines.push('')

      // Section entités
      lines.push('## QUALITE PAR ENTITE')
      lines.push('Entité,Enregistrements,Qualité (%),Problèmes,Dernier audit,Responsable')
      for (const e of data.entities) {
        lines.push(`${e.name},${e.records},${e.quality}%,${e.issues},${formatDate(e.lastAudit)},${e.owner}`)
      }
      lines.push('')

      // Section lineage
      lines.push('## LINEAGE DES DONNEES')
      lines.push('Source,Target,Transformation,Statut')
      for (const l of data.lineage) {
        lines.push(`${l.source},${l.target},${l.transform},${l.status}`)
      }
      lines.push('')

      // Section politiques
      lines.push('## POLITIQUES DE DONNEES')
      lines.push('Nom,Type,Description')
      for (const p of data.policies) {
        const desc = (p.desc || '').replace(/,/g, ';')
        lines.push(`${p.name},${p.type},${desc}`)
      }

      const csv = lines.join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gouvernance-donnees-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success('Rapport CSV exporté')
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(false)
    }
  }

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Database className="w-6 h-6 text-[#27698a]" />Gouvernance des données</h1>
          <p className="text-sm text-slate-500 mt-1">Qualité, lineage et politiques de gestion des données</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={exporting} className="border-[#27698a] text-[#27698a] hover:bg-[#27698a] hover:text-white">
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Export…' : 'Exporter rapport CSV'}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard icon={Database} label="Qualité globale" value={`${data.kpis.dataQuality}%`} color="#27698a" />
        <KpiCard icon={CheckCircle2} label="Complétude" value={`${data.kpis.completeness}%`} color="#478e5e" />
        <KpiCard icon={CheckCircle2} label="Exactitude" value={`${data.kpis.accuracy}%`} color="#96783c" />
        <KpiCard icon={GitBranch} label="Cohérence" value={`${data.kpis.consistency}%`} color="#b94659" />
        <KpiCard icon={Clock} label="Fraîcheur" value={`${data.kpis.freshness}%`} color="#8b5cf6" />
        <KpiCard icon={Database} label="Unicité" value={`${data.kpis.uniqueness}%`} color="#0ea5e9" />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">Qualité par entité ({data.entities.length})</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-xs text-slate-600 uppercase"><th className="px-3 py-2">Entité</th><th className="px-3 py-2 text-center">Enregistrements</th><th className="px-3 py-2 text-center">Qualité</th><th className="px-3 py-2 text-center">Problèmes</th><th className="px-3 py-2">Dernier audit</th><th className="px-3 py-2">Responsable</th></tr></thead>
          <tbody>{data.entities.map((e, i) => (<tr key={i} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-3 py-2 font-mono text-xs text-[#27698a]">{e.name}</td><td className="px-3 py-2 text-center">{e.records}</td><td className="px-3 py-2 text-center"><span className={`font-bold ${e.quality >= 90 ? 'text-emerald-600' : e.quality >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{e.quality}%</span></td><td className="px-3 py-2 text-center">{e.issues > 0 ? <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">{e.issues} ⚠</Badge> : <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />}</td><td className="px-3 py-2 text-slate-600 text-xs">{formatDate(e.lastAudit)}</td><td className="px-3 py-2 text-slate-600 text-xs">{e.owner}</td></tr>))}</tbody>
        </table></div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><GitBranch className="w-4 h-4 text-[#27698a]" />Lineage des données</h2>
          <div className="space-y-2">
            {data.lineage.map((l, i) => (<div key={i} className="flex items-center gap-2 p-2 rounded border border-slate-200 text-xs">
              <span className="font-mono text-[#27698a]">{l.source}</span><span className="text-slate-400">→</span><span className="font-mono text-slate-700">{l.target}</span><span className="text-slate-400">·</span><span className="text-slate-500">{l.transform}</span><Badge variant="outline" className={`text-[9px] ml-auto ${l.status === 'OK' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{l.status}</Badge>
            </div>))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-[#27698a]" />Politiques de données</h2>
          <div className="space-y-2">
            {data.policies.map((p, i) => { const meta = POLICY_TYPE[p.type] || POLICY_TYPE.RETENTION; return (
              <div key={i} className="p-2 rounded border border-slate-200"><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-slate-900">{p.name}</span><Badge variant="outline" className={meta.color + ' text-[9px]'}>{meta.label}</Badge></div><p className="text-xs text-slate-500">{p.desc}</p></div>
            )})}
          </div>
        </Card>
      </div>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return <Card className="p-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-3.5 h-3.5" /></div><div><div className="text-sm font-bold text-slate-900">{value}</div><div className="text-[10px] text-slate-500">{label}</div></div></div></Card>
}
