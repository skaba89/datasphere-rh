'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Users, UserCheck, UserX, Wallet, TrendingUp, CalendarClock, AlertTriangle } from 'lucide-react'
import { formatGNF } from '@/lib/utils-rh'

interface DashboardData {
  totalEmployees: number
  activeEmployees: number
  onLeaveToday: number
  pendingLeaves: number
  monthlyPayroll: number
  monthlyCharges: number
  cdiCount: number
  cddCount: number
  stageCount: number
  alerts: Array<{ id: string; type: string; message: string; severity: 'info' | 'warning' | 'critical' }>
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/dashboard')
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

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Tableau de bord RH</h1>
        <p className="text-sm text-slate-500 mt-1">
          Vue d'ensemble de l'activité RH — Demo SARL · Juillet 2026
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          icon={Users}
          label="Effectif total"
          value={data.totalEmployees.toString()}
          sub={`${data.activeEmployees} actifs`}
          color="#27698a"
        />
        <KpiCard
          icon={CalendarClock}
          label="En congé aujourd'hui"
          value={data.onLeaveToday.toString()}
          sub={`${data.pendingLeaves} demandes en attente`}
          color="#96783c"
        />
        <KpiCard
          icon={Wallet}
          label="Masse salariale (mois)"
          value={formatGNF(data.monthlyPayroll)}
          sub="Brut imposable"
          color="#478e5e"
        />
        <KpiCard
          icon={TrendingUp}
          label="Charges patronales"
          value={formatGNF(data.monthlyCharges)}
          sub="Estimation mensuelle"
          color="#b94659"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Répartition contrats */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Répartition des contrats</h2>
            <span className="text-xs text-slate-500">Effectif actif</span>
          </div>
          <div className="space-y-3">
            <ContractBar label="CDI" count={data.cdiCount} total={data.totalEmployees} color="bg-emerald-500" />
            <ContractBar label="CDD" count={data.cddCount} total={data.totalEmployees} color="bg-amber-500" />
            <ContractBar label="Stage" count={data.stageCount} total={data.totalEmployees} color="bg-sky-500" />
          </div>
        </Card>

        {/* Alertes */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900">Alertes RH</h2>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {data.alerts.length === 0 && (
              <p className="text-sm text-slate-400 italic">Aucune alerte</p>
            )}
            {data.alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border text-sm ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-sky-50 border-sky-200 text-sky-800'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction label="Nouvel employé" desc="Wizard 5 étapes" color="bg-[#27698a]" />
          <QuickAction label="Ouvrir période paie" desc="Juillet 2026" color="bg-[#478e5e]" />
          <QuickAction label="Saisir éléments variables" desc="Primes, HS, absences" color="bg-[#96783c]" />
          <QuickAction label="Générer bulletins PDF" desc="Batch async" color="bg-[#b94659]" />
        </div>
      </Card>
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
          <p className="text-lg lg:text-2xl font-bold text-slate-900 mt-1 truncate">{value}</p>
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

function ContractBar({ label, count, total, color }: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{count} · {pct.toFixed(0)}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function QuickAction({ label, desc, color }: { label: string; desc: string; color: string }) {
  return (
    <button className="text-left p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors group">
      <div className={`w-8 h-8 rounded-lg ${color} mb-2 flex items-center justify-center text-white text-xs font-bold`}>
        →
      </div>
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
    </button>
  )
}
