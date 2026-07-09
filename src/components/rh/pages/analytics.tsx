'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, BarChart2, PieChart as PieChartIcon, TrendingUp, Users, Clock, Award, Target, DollarSign, Activity } from 'lucide-react'
import { formatGNF } from '@/lib/utils-rh'

interface AnalyticsData {
  kpis: {
    totalEmployees: number
    avgCostPerEmployee: number
    absenteeRate: number
    performanceRate: number
    turnoverRate: number
    trainingCompletionRate: number
    avgTimeToHire: number
    totalCandidates: number
    totalTrainings: number
    totalDocuments: number
  }
  headcountEvolution: Array<{ mois: string; effectif: number; recrutements: number; departs: number }>
  ageGroups: Record<string, number>
  genderDist: { M: number; F: number }
  deptStats: Record<string, number>
}

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { if (mounted) { setData(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading || !data) {
    return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-64" /><div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl" />)}</div></div></div>
  }

  const { kpis, headcountEvolution, ageGroups, genderDist, deptStats } = data
  const maxHeadcount = Math.max(...headcountEvolution.map(h => h.effectif), 1)
  const maxDept = Math.max(...Object.values(deptStats), 1)
  const totalByAge = Object.values(ageGroups).reduce((a, b) => a + b, 0)
  const totalGender = genderDist.M + genderDist.F

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#27698a]" />
          Analytics RH
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tableau de bord BI · Indicateurs avancés et tendances
        </p>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Effectif total" value={kpis.totalEmployees.toString()} sub="employés actifs" color="#27698a" />
        <KpiCard icon={DollarSign} label="Coût moyen/employé" value={formatGNF(kpis.avgCostPerEmployee)} sub="tout inclus" color="#b94659" />
        <KpiCard icon={Target} label="Taux de performance" value={`${kpis.performanceRate.toFixed(0)}%`} sub="objectifs atteints" color="#478e5e" />
        <KpiCard icon={Clock} label="Absentéisme" value={`${kpis.absenteeRate.toFixed(1)}%`} sub="taux mensuel" color="#96783c" />
      </div>

      {/* KPIs secondaires */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniKpi icon={TrendingUp} label="Turn-over" value={`${kpis.turnoverRate}%`} color={kpis.turnoverRate < 5 ? 'text-emerald-600' : 'text-red-600'} />
        <MiniKpi icon={Award} label="Completion formation" value={`${kpis.trainingCompletionRate.toFixed(0)}%`} color="text-[#27698a]" />
        <MiniKpi icon={Clock} label="Time-to-hire" value={`${kpis.avgTimeToHire}j`} color="text-purple-600" />
        <MiniKpi icon={Users} label="Candidats actifs" value={kpis.totalCandidates.toString()} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Évolution effectif */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-[#27698a]" />
              Évolution effectif (12 mois)
            </h2>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
              +{(headcountEvolution[headcountEvolution.length - 1]?.effectif || 0) - (headcountEvolution[0]?.effectif || 0)} employés
            </Badge>
          </div>
          <div className="space-y-2">
            {headcountEvolution.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-10 shrink-0">{h.mois}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded relative overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#27698a] to-[#478e5e] rounded flex items-center justify-end pr-2" style={{ width: `${(h.effectif / maxHeadcount) * 100}%` }}>
                    <span className="text-[10px] font-bold text-white">{h.effectif}</span>
                  </div>
                </div>
                <div className="flex gap-0.5 w-12 shrink-0">
                  {h.recrutements > 0 && <span className="text-[10px] text-emerald-600 font-bold">+{h.recrutements}</span>}
                  {h.departs > 0 && <span className="text-[10px] text-red-600 font-bold">-{h.departs}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Répartition par département */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#27698a]" />
            Effectif par département
          </h2>
          <div className="space-y-3">
            {Object.entries(deptStats)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <div key={dept}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{dept}</span>
                    <span className="text-slate-500">{count} employé{count > 1 ? 's' : ''} · {((count / kpis.totalEmployees) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / maxDept) * 100}%`,
                        backgroundColor: dept === 'Direction' ? '#27698a' :
                                         dept === 'RH' ? '#478e5e' :
                                         dept === 'IT' ? '#96783c' :
                                         dept === 'Finance' ? '#b94659' :
                                         dept === 'Santé' ? '#8b5cf6' :
                                         dept === 'Commercial' ? '#0ea5e9' : '#64748b',
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Pyramide des âges */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#27698a]" />
            Pyramide des âges
          </h2>
          <div className="space-y-2">
            {Object.entries(ageGroups).map(([group, count]) => {
              const pct = totalByAge > 0 ? (count / totalByAge) * 100 : 0
              return (
                <div key={group}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{group} ans</span>
                    <span className="text-slate-500">{count} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#27698a] to-[#435862] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Répartition par genre */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-[#27698a]" />
            Répartition par genre
          </h2>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                <circle
                  cx="64" cy="64" r="56" fill="none"
                  stroke="#27698a" strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 56 * (genderDist.M / totalGender)} ${2 * Math.PI * 56}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">{totalGender}</div>
                  <div className="text-xs text-slate-500">employés</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-[#27698a]/5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#27698a]"></div>
                <span className="text-sm font-medium text-slate-700">Hommes</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{genderDist.M} · {totalGender > 0 ? ((genderDist.M / totalGender) * 100).toFixed(0) : 0}%</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-pink-50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-sm font-medium text-slate-700">Femmes</span>
              </div>
              <span className="text-sm font-bold text-slate-900">{genderDist.F} · {totalGender > 0 ? ((genderDist.F / totalGender) * 100).toFixed(0) : 0}%</span>
            </div>
          </div>
        </Card>

        {/* Indicateurs avancés */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#27698a]" />
            Indicateurs clés
          </h2>
          <div className="space-y-3">
            <IndicatorRow
              label="Turn-over annuel"
              value={`${kpis.turnoverRate}%`}
              status={kpis.turnoverRate < 5 ? 'good' : 'warning'}
              benchmark="< 5% cible"
            />
            <IndicatorRow
              label="Taux d'absentéisme"
              value={`${kpis.absenteeRate.toFixed(1)}%`}
              status={kpis.absenteeRate < 5 ? 'good' : 'warning'}
              benchmark="< 5% cible"
            />
            <IndicatorRow
              label="Performance objectifs"
              value={`${kpis.performanceRate.toFixed(0)}%`}
              status={kpis.performanceRate >= 70 ? 'good' : 'warning'}
              benchmark="> 70% cible"
            />
            <IndicatorRow
              label="Completion formations"
              value={`${kpis.trainingCompletionRate.toFixed(0)}%`}
              status={kpis.trainingCompletionRate >= 80 ? 'good' : 'warning'}
              benchmark="> 80% cible"
            />
            <IndicatorRow
              label="Time-to-hire moyen"
              value={`${kpis.avgTimeToHire} jours`}
              status={kpis.avgTimeToHire < 30 ? 'good' : 'warning'}
              benchmark="< 30j cible"
            />
          </div>
        </Card>
      </div>

      {/* Synthèse */}
      <Card className="p-5 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <h2 className="font-semibold text-slate-900 mb-3">Synthèse exécutive</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Capital humain</div>
            <p className="text-slate-700">
              {kpis.totalEmployees} employés · {kpis.totalCandidates} candidats · turn-over {kpis.turnoverRate}% · {kpis.avgTimeToHire}j pour pourvoir un poste
            </p>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Performance</div>
            <p className="text-slate-700">
              {kpis.performanceRate.toFixed(0)}% objectifs atteints · {kpis.trainingCompletionRate.toFixed(0)}% formations complétées · {kpis.absenteeRate.toFixed(1)}% absentéisme
            </p>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Coût</div>
            <p className="text-slate-700">
              {formatGNF(kpis.avgCostPerEmployee)} par employé · {kpis.totalTrainings} formations actives · {kpis.totalDocuments} documents archivés
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p>
          <p className="text-base lg:text-lg font-bold text-slate-900 mt-1 truncate">{value}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sub}</p>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  )
}

function MiniKpi({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <div>
          <div className="text-lg font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

function IndicatorRow({ label, value, status, benchmark }: { label: string; value: string; status: 'good' | 'warning'; benchmark: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded border border-slate-200">
      <div>
        <div className="text-sm font-medium text-slate-700">{label}</div>
        <div className="text-xs text-slate-400">{benchmark}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${status === 'good' ? 'text-emerald-600' : 'text-amber-600'}`}>{value}</span>
        <span className={`w-2 h-2 rounded-full ${status === 'good' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
      </div>
    </div>
  )
}
