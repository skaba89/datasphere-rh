'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck, ShieldAlert, Users, Monitor, Activity, Lock, AlertTriangle,
  CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Smartphone, Globe
} from 'lucide-react'
import { toast } from 'sonner'

export function SecurityDashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/security-dashboard')
      if (res.status === 401) {
        toast.error('Accès refusé — réservé aux administrateurs')
        setLoading(false)
        return
      }
      if (res.status === 403) {
        toast.error('Permission refusée — admin seulement')
        setLoading(false)
        return
      }
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Accès refusé ou données indisponibles</p>
        </Card>
      </div>
    )
  }

  const { summary, checks, stats } = data

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Sécurité</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tableau de bord de sécurité et conformité
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Actualiser
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={`p-4 ${summary.errors > 0 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex items-center gap-2">
            {summary.errors > 0 ? <XCircle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <div>
              <div className="text-2xl font-bold text-slate-900">{summary.errors}</div>
              <div className="text-xs text-slate-500">Erreurs</div>
            </div>
          </div>
        </Card>
        <Card className={`p-4 ${summary.warnings > 0 ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${summary.warnings > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
            <div>
              <div className="text-2xl font-bold text-slate-900">{summary.warnings}</div>
              <div className="text-xs text-slate-500">Avertissements</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-2xl font-bold text-slate-900">{summary.ok}</div>
              <div className="text-xs text-slate-500">OK</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration checks */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900">Configuration</h2>
        </div>
        <div className="space-y-2">
          {checks.map((check: any, i: number) => (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                check.status === 'ok'
                  ? 'border-emerald-200 bg-emerald-50'
                  : check.status === 'warning'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-3">
                {check.status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <div>
                  <div className="text-sm font-medium text-slate-900">{check.name}</div>
                  <div className="text-xs text-slate-600">{check.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stats grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users stats */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#27698a]" />
            <h2 className="font-semibold text-slate-900">Utilisateurs</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Total" value={stats.users.total} color="text-slate-900" />
            <StatBox label="Actifs" value={stats.users.active} color="text-emerald-600" />
            <StatBox label="Inactifs" value={stats.users.inactive} color="text-amber-600" />
            <StatBox label="Sans société" value={stats.users.withoutCompany} color="text-red-600" />
          </div>
        </Card>

        {/* Sessions stats */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5 text-[#27698a]" />
            <h2 className="font-semibold text-slate-900">Sessions actives</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Sessions actives" value={stats.sessions.active} color="text-[#27698a]" />
            <StatBox label="Connexions 24h" value={stats.logins.successful24h} color="text-emerald-600" />
            <StatBox label="Échecs 24h" value={stats.logins.failed24h} color="text-red-600" />
            <StatBox label="Comptes verrouillés" value={stats.logins.lockedAccounts} color="text-amber-600" />
          </div>
        </Card>
      </div>

      {/* Locked accounts */}
      {stats.logins.lockedAccounts > 0 && (
        <Card className="p-5 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-red-900">Comptes verrouillés</h2>
          </div>
          <div className="space-y-2">
            {stats.logins.lockedEmails.map((acc: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-white border border-red-200">
                <span className="text-sm font-mono text-slate-900">{acc.email}</span>
                <span className="text-xs text-red-600 font-medium">{acc.attempts} tentatives échouées</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent failed attempts */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-slate-900">Tentatives échouées récentes (24h)</h2>
        </div>
        {stats.recentFailedAttempts.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Aucune tentative échouée dans les dernières 24h</p>
        ) : (
          <div className="space-y-1">
            {stats.recentFailedAttempts.map((att: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span className="font-mono text-slate-700">{att.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="font-mono">{att.ipAddress || '—'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(att.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent audit */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900">Activité récente (audit)</h2>
        </div>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {stats.recentAudits.map((audit: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded border border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                  audit.action.includes('LOGIN') ? 'bg-emerald-50 text-emerald-700' :
                  audit.action.includes('CREATE') ? 'bg-blue-50 text-blue-700' :
                  audit.action.includes('DELETE') || audit.action.includes('DEACTIVATE') ? 'bg-red-50 text-red-700' :
                  audit.action.includes('PASSWORD') ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-50 text-slate-600'
                }`}>
                  {audit.action}
                </span>
                <span className="text-slate-600">{audit.user}</span>
              </div>
              <span className="text-slate-400">{new Date(audit.time).toLocaleString('fr-FR')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  )
}
