'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Plane, FileText, Home, Users, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'

interface Data { expats: any[]; visas: any[]; kpis: any }
const VISA_STATUS: Record<string, { label: string; color: string }> = { VALIDE: { label: 'Valide', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, EN_RENOUVELLEMENT: { label: 'Renouvellement', color: 'bg-amber-50 text-amber-700 border-amber-200' }, EXPIRE: { label: 'Expiré', color: 'bg-red-50 text-red-700 border-red-200' } }

export function InternationalPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/international').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Globe className="w-6 h-6 text-[#27698a]" />Relations internationales</h1><p className="text-sm text-slate-500 mt-1">Expatriés, visas, permis de travail et mobilité</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Globe} label="Expatriés" value={data.kpis.totalExpats} color="#27698a" />
        <KpiCard icon={CheckCircle2} label="Visas valides" value={data.kpis.validVisas} color="#478e5e" />
        <KpiCard icon={Clock} label="Expirent <60j" value={data.kpis.expiringSoon} color="#96783c" />
        <KpiCard icon={AlertTriangle} label="En renouvellement" value={data.kpis.renewalInProgress} color="#b94659" />
      </div>

      {/* Expatriés */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#27698a]" />Expatriés ({data.expats.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.expats.map((e: any) => (
            <div key={e.id} className="p-4 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2"><span className="text-2xl">{e.nationality.split(' ')[0]}</span><Badge variant="outline" className={`text-[10px] ${VISA_STATUS[e.visaStatus]?.color || ''}`}>{VISA_STATUS[e.visaStatus]?.label || e.visaStatus}</Badge></div>
              <h3 className="font-semibold text-slate-900 text-sm">{e.name}</h3><div className="text-xs text-slate-500 mt-0.5">{e.role}</div>
              <div className="space-y-1 mt-3 text-xs text-slate-600">
                <div className="flex items-center gap-1"><Plane className="w-3 h-3" />Arrivée : {formatDate(e.arrivalDate)}</div>
                <div className="flex items-center gap-1"><FileText className="w-3 h-3" />Visa : {formatDate(e.visaExpiry)} · Permis : {formatDate(e.permitExpiry)}</div>
                <div className="flex items-center gap-1"><Home className="w-3 h-3" />{e.housing}</div>
                <div className="flex items-center gap-1"><Users className="w-3 h-3" />Famille : {e.familyRelocation ? <><CheckCircle2 className="w-3 h-3 inline text-emerald-600" /> Re localisée</> : '—'}</div>
              </div>
              <div className="mt-2 p-1.5 rounded bg-slate-50 text-xs text-slate-500">Assurance : {e.insurance}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Visas & permis */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">Suivi visas &amp; permis ({data.visas.length})</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-xs text-slate-600 uppercase"><th className="px-3 py-2">Employé</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Numéro</th><th className="px-3 py-2">Émission</th><th className="px-3 py-2">Expiration</th><th className="px-3 py-2 text-center">Jours restants</th><th className="px-3 py-2">Statut</th></tr></thead>
          <tbody>{data.visas.map((v: any) => { const status = VISA_STATUS[v.status] || VISA_STATUS.VALIDE; return (
            <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-medium text-slate-900">{v.employee}</td><td className="px-3 py-2 text-slate-600">{v.type}</td><td className="px-3 py-2 font-mono text-xs text-slate-500">{v.number}</td><td className="px-3 py-2 text-slate-600">{formatDate(v.issueDate)}</td><td className="px-3 py-2 text-slate-600">{formatDate(v.expiryDate)}</td><td className={`px-3 py-2 text-center font-bold ${v.daysLeft < 30 ? 'text-red-600' : v.daysLeft < 90 ? 'text-amber-600' : 'text-slate-700'}`}>{v.daysLeft}j</td><td className="px-3 py-2"><Badge variant="outline" className={`text-[10px] ${status.color}`}>{status.label}</Badge></td>
            </tr>)})}
          </tbody>
        </table></div>
      </Card>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
