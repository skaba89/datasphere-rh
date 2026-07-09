'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calculator, Download, FileSpreadsheet, Check, X, RefreshCw, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF } from '@/lib/utils-rh'

interface Data { fecLines: any[]; totalLines: number; integrations: any[]; monthlyTotals: any }

export function AccountingPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/accounting-exports').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Calculator className="w-6 h-6 text-[#27698a]" />Intégrations comptables</h1><p className="text-sm text-slate-500 mt-1">Exports Sage, Cegid, FEC et conformité DGI Guinée</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-slate-500">Masse salariale brute</div><div className="text-lg font-bold text-slate-900">{formatGNF(data.monthlyTotals.brut)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">CNSS employeur (8%)</div><div className="text-lg font-bold text-[#b94659]">{formatGNF(data.monthlyTotals.cnssEmployeur)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">CNSS salarié (5%)</div><div className="text-lg font-bold text-[#27698a]">{formatGNF(data.monthlyTotals.cnssSalarie)}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Lignes FEC générées</div><div className="text-lg font-bold text-slate-900">{data.totalLines}</div></Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Intégrations configurées</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.integrations.map((integ, i) => (
            <div key={i} className="p-4 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm text-slate-900">{integ.name}</div>
                <Badge variant="outline" className={integ.status === 'configured' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>
                  {integ.status === 'configured' ? <><Check className="w-3 h-3 mr-1" />Configuré</> : 'Disponible'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{integ.desc}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400"><span>Format: {integ.format}</span>{integ.lastSync && <span>· Dernier sync: {integ.lastSync}</span>}</div>
              <Button size="sm" variant={integ.status === 'configured' ? 'outline' : 'default'} className="w-full mt-3 h-7 text-xs" onClick={() => toast.info(integ.status === 'configured' ? `Export ${integ.format} en cours...` : `Configuration ${integ.name}...`)}>
                {integ.status === 'configured' ? <><Download className="w-3 h-3 mr-1" />Exporter</> : 'Configurer'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Aperçu FEC (Fichier des Écritures Comptables)</h2>
          <Button size="sm" variant="outline" onClick={() => toast.success('Export FEC téléchargé (simulation)')}><Download className="w-4 h-4 mr-2" />Télécharger FEC complet</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50"><tr className="text-left text-slate-600 uppercase"><th className="px-3 py-2">Journal</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Compte</th><th className="px-3 py-2">Tiers</th><th className="px-3 py-2">Libellé</th><th className="px-3 py-2 text-right">Débit</th><th className="px-3 py-2 text-right">Crédit</th></tr></thead>
            <tbody>
              {data.fecLines.map((line, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5 font-mono">{line.journal}</td><td className="px-3 py-1.5 font-mono">{line.date}</td><td className="px-3 py-1.5 font-mono">{line.compte}</td><td className="px-3 py-1.5 font-mono">{line.tiers}</td><td className="px-3 py-1.5 truncate max-w-xs">{line.libelle}</td><td className="px-3 py-1.5 text-right font-mono">{line.debit !== '0' ? formatGNF(Number(line.debit)) : '—'}</td><td className="px-3 py-1.5 text-right font-mono">{line.credit !== '0' ? formatGNF(Number(line.credit)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-slate-400">Affichage de {data.fecLines.length} lignes sur {data.totalLines} total. Format FEC conforme aux exigences DGI Guinée.</div>
      </Card>

      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
        💡 <strong>Conformité DGI Guinée :</strong> Les exports FEC sont conformes au format exigé par la Direction Générale des Impôts pour le contrôle fiscal. Le mapping des comptes est configurable dans Paramètres avancés &gt; Intégrations.
      </div>
    </div>
  )
}
