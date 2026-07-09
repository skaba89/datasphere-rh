'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Award, TrendingUp, Users } from 'lucide-react'
import { formatGNF } from '@/lib/utils-rh'

interface Data { positions: any[]; grades: any[]; scales: any[] }

export function ReferentialPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'positions' | 'grades' | 'scales'>('positions')
  useEffect(() => { let m = true; fetch('/api/referential').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-[#27698a]" />Référentiel</h1><p className="text-sm text-slate-500 mt-1">Postes, grades et échelles salariales</p></div>
      <div className="flex gap-2 border-b border-slate-200">
        {[{ k: 'positions', l: 'Postes', i: Briefcase }, { k: 'grades', l: 'Grades', i: Award }, { k: 'scales', l: 'Échelles', i: TrendingUp }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.k ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}><t.i className="w-4 h-4 inline mr-2" />{t.l}</button>
        ))}
      </div>

      {tab === 'positions' && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">Postes référencés ({data.positions.length})</h2></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-xs text-slate-600 uppercase"><th className="px-3 py-2">Poste</th><th className="px-3 py-2">Département</th><th className="px-3 py-2 text-center">Effectif</th><th className="px-3 py-2 text-right">Salaire min</th><th className="px-3 py-2 text-right">Salaire max</th></tr></thead>
            <tbody>{data.positions.map((p, i) => (<tr key={i} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-3 py-2 font-medium text-slate-900">{p.name}</td><td className="px-3 py-2"><Badge variant="outline" className="text-[10px]">{p.department}</Badge></td><td className="px-3 py-2 text-center">{p.count}</td><td className="px-3 py-2 text-right font-mono text-xs">{formatGNF(p.minSalary)}</td><td className="px-3 py-2 text-right font-mono text-xs font-bold">{formatGNF(p.maxSalary)}</td></tr>))}</tbody>
          </table></div>
        </Card>
      )}

      {tab === 'grades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.grades.map((g, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between mb-2"><div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#27698a]/10 text-[#27698a]"><Award className="w-4 h-4" /></div><Badge variant="outline" className="text-[10px]">Niveau {g.level}</Badge></div>
              <h3 className="font-semibold text-slate-900 text-sm">{g.name}</h3>
              <div className="mt-2 space-y-1 text-xs"><div className="flex justify-between"><span className="text-slate-500">Min</span><span className="font-mono font-bold text-slate-900">{formatGNF(g.minSalary)}</span></div><div className="flex justify-between"><span className="text-slate-500">Max</span><span className="font-mono font-bold text-slate-900">{formatGNF(g.maxSalary)}</span></div></div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-500"><Users className="w-3 h-3" />{g.count} employé{g.count > 1 ? 's' : ''}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'scales' && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">Échelles salariales par catégorie</h2></div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-xs text-slate-600 uppercase"><th className="px-3 py-2">Catégorie</th><th className="px-3 py-2 text-right">Entrée</th><th className="px-3 py-2 text-right">Confirmé</th><th className="px-3 py-2 text-right">Senior</th><th className="px-3 py-2 text-right">Marché</th></tr></thead>
            <tbody>{data.scales.map((s, i) => (<tr key={i} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-3 py-2 font-medium text-slate-900">{s.category}</td><td className="px-3 py-2 text-right font-mono text-xs">{formatGNF(s.entry)}</td><td className="px-3 py-2 text-right font-mono text-xs">{formatGNF(s.mid)}</td><td className="px-3 py-2 text-right font-mono text-xs font-bold">{formatGNF(s.senior)}</td><td className="px-3 py-2 text-right font-mono text-xs text-slate-500">{formatGNF(s.market)}</td></tr>))}</tbody>
          </table></div>
          <div className="p-3 text-xs text-slate-400">Les valeurs marché sont basées sur une enquête salariale Guinée 2024 (cabinets partenaires).</div>
        </Card>
      )}
    </div>
  )
}
