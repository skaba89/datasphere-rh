'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Users, Wallet, AlertTriangle, Brain, Activity } from 'lucide-react'
import { formatGNF } from '@/lib/utils-rh'

interface Forecast {
  category: string; period: string; predicted: number; confidence: number; trend: string; current: number; factors: string; label: string; unit: string
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string }> = {
  HEADCOUNT: { icon: Users, color: '#27698a' },
  PAYROLL: { icon: Wallet, color: '#b94659' },
  TURNOVER: { icon: AlertTriangle, color: '#96783c' },
  RECRUITMENT: { icon: Users, color: '#478e5e' },
  ABSENTEEISM: { icon: Activity, color: '#8b5cf6' },
}

export function ForecastsPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { let m = true; fetch('/api/forecasts').then(r => r.json()).then(d => { if (m) { setForecasts(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const formatValue = (f: Forecast) => {
    if (f.unit === 'GNF') return formatGNF(f.predicted)
    if (f.unit === '%') return `${f.predicted}%`
    return `${f.predicted} ${f.unit}`
  }
  const formatCurrent = (f: Forecast) => {
    if (f.unit === 'GNF') return formatGNF(f.current)
    if (f.unit === '%') return `${f.current}%`
    return `${f.current} ${f.unit}`
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Brain className="w-6 h-6 text-[#27698a]" />Prévisions IA</h1>
        <p className="text-sm text-slate-500 mt-1">Prédictions RH basées sur l'analyse de tendances et de données historiques</p>
      </div>

      {/* KPIs prévisionnels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {forecasts.slice(0, 4).map((f, i) => {
          const meta = CATEGORY_META[f.category] || { icon: Brain, color: '#27698a' }
          const TrendIcon = f.trend === 'UP' ? TrendingUp : f.trend === 'DOWN' ? TrendingDown : Minus
          const trendColor = f.trend === 'UP' ? 'text-emerald-600' : f.trend === 'DOWN' ? 'text-red-600' : 'text-slate-500'
          return (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{f.label}</p>
                  <p className="text-base lg:text-lg font-bold text-slate-900 mt-1 truncate">{formatValue(f)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Actuel : {formatCurrent(f)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + '15', color: meta.color }}>
                    <meta.icon className="w-4 h-4" />
                  </div>
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${f.confidence}%`, backgroundColor: meta.color }} />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{f.confidence}%</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Détail des prévisions */}
      <div className="space-y-3">
        {forecasts.map((f, i) => {
          const meta = CATEGORY_META[f.category] || { icon: Brain, color: '#27698a' }
          const TrendIcon = f.trend === 'UP' ? TrendingUp : f.trend === 'DOWN' ? TrendingDown : Minus
          const trendColor = f.trend === 'UP' ? 'text-emerald-600' : f.trend === 'DOWN' ? 'text-red-600' : 'text-slate-500'
          const trendBg = f.trend === 'UP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : f.trend === 'DOWN' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'
          let factors: string[] = []
          try { factors = JSON.parse(f.factors) } catch {}
          const variation = f.current > 0 ? ((f.predicted - f.current) / f.current) * 100 : 0

          return (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: meta.color + '15', color: meta.color }}>
                  <meta.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{f.label}</h3>
                    <Badge variant="outline" className="text-xs">{f.period}</Badge>
                    <Badge variant="outline" className={trendBg}>
                      <TrendIcon className="w-3 h-3 mr-1" />
                      {f.trend === 'UP' ? 'Hausse' : f.trend === 'DOWN' ? 'Baisse' : 'Stable'}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-4 mt-2">
                    <div>
                      <span className="text-xs text-slate-500">Prévu : </span>
                      <span className="text-xl font-bold text-slate-900">{formatValue(f)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Actuel : </span>
                      <span className="text-sm font-medium text-slate-700">{formatCurrent(f)}</span>
                    </div>
                    {variation !== 0 && (
                      <div className={`text-sm font-bold ${variation > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {variation > 0 ? '+' : ''}{variation.toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-slate-500">Confiance IA :</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                      <div className="h-full rounded-full" style={{ width: `${f.confidence}%`, backgroundColor: meta.color }} />
                    </div>
                    <span className="text-xs font-mono text-slate-600">{f.confidence}%</span>
                  </div>
                  {factors.length > 0 && (
                    <div className="mt-3 p-2 rounded bg-slate-50">
                      <div className="text-xs font-semibold text-slate-600 mb-1">Facteurs analysés :</div>
                      <div className="flex flex-wrap gap-1">
                        {factors.map((factor, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">{factor}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="p-4 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex items-start gap-3">
          <Brain className="w-5 h-5 text-[#27698a] shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">Comment les prévisions sont-elles calculées ?</p>
            <p>L'IA analyse les données historiques (effectif, masse salariale, turnover, absentéisme, candidatures) et les croise avec les facteurs internes (recrutements en cours, CDD se terminant, plan stratégique) et externes (inflation, marché de l'emploi) pour générer des prévisions à 3-12 mois.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
