'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Wallet, TrendingUp, TrendingDown, AlertTriangle, Briefcase, FileText, Star } from 'lucide-react'
import { formatGNF } from '@/lib/utils-rh'

interface ReportData {
  period: string
  company: { name: string; ville: string | null }
  kpis: {
    totalEmployees: number
    totalPayroll: number
    totalCharges: number
    totalCost: number
    turnover: number
    provisionConges: number
    avgSalary: number
  }
  contractTypes: Record<string, number>
  byDepartment: Record<string, { count: number; payroll: number }>
  monthlyEvolution: Array<{ mois: string; masseSalariale: number; charges: number; cout: number }>
  topEmployees: Array<{ nom: string; poste: string; salaire: number; cout: number }>
  recruitmentStats: { total: number; nouveau: number; entretien: number; offre: number; accepte: number; refuse: number }
  documentsStats: { total: number; confidentiels: number; signs: number; parCategorie: Record<string, number> }
  alerts: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }>
}

export function DGReportPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/reports')
      .then(r => r.json())
      .then(d => { if (mounted) { setData(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading || !data) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    )
  }

  const { kpis, contractTypes, byDepartment, monthlyEvolution, topEmployees, recruitmentStats, documentsStats, alerts } = data
  const maxMonthly = Math.max(...monthlyEvolution.map(m => m.cout))

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Reporting Direction Générale</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data.company.name} · {data.company.ville} · Période {data.period}
          </p>
        </div>
        <Badge variant="outline" className="bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20">
          Synthèse exécutive
        </Badge>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          icon={Users}
          label="Effectif total"
          value={kpis.totalEmployees.toString()}
          sub={`Salaire moyen : ${formatGNF(kpis.avgSalary)}`}
          color="#27698a"
        />
        <KpiCard
          icon={Wallet}
          label="Masse salariale"
          value={formatGNF(kpis.totalPayroll)}
          sub="Brut mensuel"
          color="#478e5e"
        />
        <KpiCard
          icon={TrendingUp}
          label="Charges patronales"
          value={formatGNF(kpis.totalCharges)}
          sub="~18% de la masse salariale"
          color="#96783c"
        />
        <KpiCard
          icon={TrendingDown}
          label="Coût total employeur"
          value={formatGNF(kpis.totalCost)}
          sub="Brut + charges"
          color="#b94659"
        />
      </div>

      {/* Alertes */}
      {alerts.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900 text-sm">Alertes direction</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm ${
                  a.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' :
                  a.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  'bg-sky-50 border-sky-200 text-sky-800'
                }`}
              >
                {a.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Évolution masse salariale */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Évolution masse salariale (6 mois)</h2>
          <div className="space-y-3">
            {monthlyEvolution.map((m, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{m.mois}</span>
                  <span className="text-slate-500 font-mono">{formatGNF(m.cout)}</span>
                </div>
                <div className="flex gap-1 h-6">
                  <div
                    className="bg-[#27698a] rounded-l"
                    style={{ width: `${(m.masseSalariale / maxMonthly) * 100}%` }}
                    title={`Masse salariale: ${formatGNF(m.masseSalariale)}`}
                  ></div>
                  <div
                    className="bg-[#b94659] rounded-r"
                    style={{ width: `${(m.charges / maxMonthly) * 100}%` }}
                    title={`Charges: ${formatGNF(m.charges)}`}
                  ></div>
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

        {/* Répartition par département */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Répartition par département</h2>
          <div className="space-y-3">
            {Object.entries(byDepartment).map(([dept, info]) => {
              const maxPayroll = Math.max(...Object.values(byDepartment).map(d => d.payroll))
              return (
                <div key={dept}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{dept}</span>
                    <span className="text-slate-500">{info.count} employé{info.count > 1 ? 's' : ''} · {formatGNF(info.payroll)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#27698a] to-[#478e5e] rounded-full"
                      style={{ width: `${(info.payroll / maxPayroll) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
            {Object.keys(byDepartment).length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">Aucune donnée</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Top 5 employés par coût */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-4">Top 5 employés par coût total</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-600 uppercase">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Employé</th>
                  <th className="px-3 py-2 hidden sm:table-cell">Poste</th>
                  <th className="px-3 py-2 text-right">Salaire</th>
                  <th className="px-3 py-2 text-right">Coût total</th>
                </tr>
              </thead>
              <tbody>
                {topEmployees.map((e, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-bold text-[#27698a]">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{e.nom}</td>
                    <td className="px-3 py-2 hidden sm:table-cell text-slate-600 text-xs">{e.poste}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-slate-700">{formatGNF(e.salaire)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold text-[#b94659]">{formatGNF(e.cout)}</td>
                  </tr>
                ))}
                {topEmployees.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Provision congés + turn-over */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Indicateurs RH</h2>
          <div className="space-y-3">
            <IndicatorRow
              label="Provision congés payés"
              value={formatGNF(kpis.provisionConges)}
              sub="Estimation 50% non pris"
              color="text-[#27698a]"
            />
            <IndicatorRow
              label="Turn-over annuel"
              value={`${kpis.turnover}%`}
              sub={kpis.turnover < 5 ? '✓ Sous la moyenne' : '⚠ Au-dessus de la moyenne'}
              color={kpis.turnover < 5 ? 'text-[#478e5e]' : 'text-[#b94659]'}
            />
            <IndicatorRow
              label="Salaire moyen"
              value={formatGNF(kpis.avgSalary)}
              sub="Brut mensuel"
              color="text-slate-700"
            />
            <IndicatorRow
              label="Coût moyen employé"
              value={formatGNF(kpis.totalCost / kpis.totalEmployees)}
              sub="Tout inclus"
              color="text-slate-700"
            />
          </div>
        </Card>
      </div>

      {/* Répartition contrats */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Répartition par type de contrat</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(contractTypes).map(([type, count]) => (
            <div key={type} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <div className="text-xs text-slate-500 mt-1">{type}</div>
              <div className="text-[10px] text-slate-400">
                {((count / kpis.totalEmployees) * 100).toFixed(0)}% de l'effectif
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recrutement + Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-[#27698a]" />
            <h2 className="font-semibold text-slate-900">Pipeline recrutement</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Total" value={recruitmentStats.total} />
            <StatBox label="Nouveaux" value={recruitmentStats.nouveau} color="text-sky-600" />
            <StatBox label="Entretiens" value={recruitmentStats.entretien} color="text-amber-600" />
            <StatBox label="Offres" value={recruitmentStats.offre} color="text-violet-600" />
            <StatBox label="Acceptés" value={recruitmentStats.accepte} color="text-emerald-600" />
            <StatBox label="Refusés" value={recruitmentStats.refuse} color="text-red-600" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-[#27698a]" />
            <h2 className="font-semibold text-slate-900">Coffre-fort documents</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatBox label="Total" value={documentsStats.total} />
            <StatBox label="Confidentiels" value={documentsStats.confidentiels} color="text-red-600" />
            <StatBox label="Signés" value={documentsStats.signs} color="text-emerald-600" />
          </div>
          <div className="mt-3 space-y-1.5">
            {Object.entries(documentsStats.parCategorie).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-slate-600">{cat}</span>
                <span className="font-medium text-slate-900">{count}</span>
              </div>
            ))}
            {Object.keys(documentsStats.parCategorie).length === 0 && (
              <p className="text-xs text-slate-400 italic">Aucun document archivé</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <Card className="p-4 lg:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p>
          <p className="text-lg lg:text-xl font-bold text-slate-900 mt-1 truncate">{value}</p>
          <p className="text-xs text-slate-500 mt-1 truncate">{sub}</p>
        </div>
        <div
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '15', color }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  )
}

function IndicatorRow({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-bold ${color} mt-0.5`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  )
}

function StatBox({ label, value, color = 'text-slate-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-2 rounded-lg border border-slate-200 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
