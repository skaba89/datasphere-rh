'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, TrendingUp, AlertTriangle, Award, Sparkles, RefreshCw, BarChart3, Activity, X, Check } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend
} from 'recharts'

interface Data { models: any[]; insights: any[] }
interface TrainMetrics {
  modelVersion: string; trainedAt: string; sampleSize: number; features: string[]; trainDurationMs: number;
  turnover: any; performance: any; promotion: any;
}

const RISK_META: Record<string, { label: string; color: string; bg: string }> = {
  CRITIQUE: { label: 'Critique', color: 'text-red-600', bg: 'bg-red-100' },
  ÉLEVÉ: { label: 'Élevé', color: 'text-amber-600', bg: 'bg-amber-100' },
  MODÉRÉ: { label: 'Modéré', color: 'text-sky-600', bg: 'bg-sky-100' },
  FAIBLE: { label: 'Faible', color: 'text-emerald-600', bg: 'bg-emerald-100' },
}
const PERF_META: Record<string, { label: string; color: string; bg: string }> = {
  EXCELLENT: { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  BON: { label: 'Bon', color: 'text-sky-600', bg: 'bg-sky-100' },
  MOYEN: { label: 'Moyen', color: 'text-amber-600', bg: 'bg-amber-100' },
  'À SURVEILLER': { label: 'À surveiller', color: 'text-red-600', bg: 'bg-red-100' },
}

export function PredictivePage({ userRole }: { userRole?: string | null }) {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [trainMetrics, setTrainMetrics] = useState<TrainMetrics | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)

  // Permissions RBAC
  const canTrain = !userRole || ['SUPER_ADMIN', 'ADMIN_ENTREPRISE', 'RH'].includes(userRole)

  useEffect(() => {
    let m = true
    fetch('/api/predictive').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) })
    return () => { m = false }
  }, [])

  const handleTrain = async () => {
    setTraining(true)
    try {
      const r = await fetch('/api/predictive/train', { method: 'POST' })
      const d = await r.json()
      if (d.success) {
        setTrainMetrics(d.metrics)
        setShowMetrics(true)
        toast.success(`Modèle ré-entraîné : ${d.metrics.modelVersion}`)
      } else {
        toast.error(d.error || 'Échec entraînement')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setTraining(false)
    }
  }

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  // Distribution des risques turnover
  const riskDistribution = (['CRITIQUE', 'ÉLEVÉ', 'MODÉRÉ', 'FAIBLE'] as const).map(k => ({
    name: RISK_META[k].label,
    value: data.models.filter(m => m.turnoverLabel === k).length,
    color: k === 'CRITIQUE' ? '#dc2626' : k === 'ÉLEVÉ' ? '#f59e0b' : k === 'MODÉRÉ' ? '#0284c7' : '#10b981',
  }))

  // Scatter perf vs promotion
  const scatterData = data.models.map(m => ({
    perf: m.perfPrediction, promo: m.promotionProb, name: m.name,
    risk: m.turnoverRisk, riskLabel: m.turnoverLabel,
  }))

  // Top 5 turnover risk
  const topRisk = [...data.models].sort((a, b) => b.turnoverRisk - a.turnoverRisk).slice(0, 5).map(m => ({
    name: m.name.length > 14 ? m.name.slice(0, 12) + '…' : m.name, risk: m.turnoverRisk, label: m.turnoverLabel,
    color: m.turnoverLabel === 'CRITIQUE' ? '#dc2626' : m.turnoverLabel === 'ÉLEVÉ' ? '#f59e0b' : m.turnoverLabel === 'MODÉRÉ' ? '#0284c7' : '#10b981',
  }))

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Brain className="w-6 h-6 text-[#27698a]" />IA prédictive avancée</h1>
          <p className="text-sm text-slate-500 mt-1">Modèles ML pour turnover, performance et promotion</p>
        </div>
        <Button onClick={handleTrain} disabled={training || !canTrain} className="bg-[#27698a] hover:bg-[#1f5670]" title={canTrain ? '' : 'Permission refusée (rôle RH minimum requis)'}>
          <RefreshCw className={`w-4 h-4 mr-2 ${training ? 'animate-spin' : ''}`} />
          {training ? 'Entraînement…' : canTrain ? 'Ré-entraîner les modèles' : 'Lecture seule (RH requis)'}
        </Button>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.insights.map((ins, i) => (
          <Card key={i} className={`p-4 ${ins.severity === 'CRITICAL' ? 'border-l-4 border-l-red-500' : ins.severity === 'WARNING' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-[#27698a]'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ins.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : ins.severity === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-[#27698a]/10 text-[#27698a]'}`}>
                {ins.type === 'TURNOVER' ? <AlertTriangle className="w-4 h-4" /> : ins.type === 'PROMOTION' ? <Award className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
              <div><p className="text-sm font-medium text-slate-900">{ins.title}</p><p className="text-xs text-slate-400 mt-1">Confiance : {ins.confidence}%</p></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribution turnover */}
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-[#27698a]" />Distribution turnover</h2>
          <p className="text-xs text-slate-500 mb-4">Répartition des employés par niveau de risque</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {riskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Scatter perf vs promo */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-[#27698a]" />Performance vs Probabilité promotion</h2>
          <p className="text-xs text-slate-500 mb-4">Chaque point = 1 employé · taille = niveau de risque turnover</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="perf" name="Performance" domain={[0, 100]} label={{ value: 'Performance %', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: '#64748b' } }} tick={{ fontSize: 10 }} />
                <YAxis type="number" dataKey="promo" name="Promotion" domain={[0, 100]} label={{ value: 'Promo %', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#64748b' } }} tick={{ fontSize: 10 }} />
                <ZAxis type="number" dataKey="risk" range={[50, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload && payload[0] ? (
                  <div className="bg-white border rounded p-2 text-xs shadow"><div className="font-medium">{payload[0].payload.name}</div><div>Perf : {payload[0].payload.perf}% · Promo : {payload[0].payload.promo}%</div><div>Risque : {payload[0].payload.risk}% ({payload[0].payload.riskLabel})</div></div>
                ) : null} />
                <Scatter data={scatterData} fill="#27698a" fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top 5 risque turnover */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-red-500" />Top 5 — Risque de départ élevé</h2>
        <p className="text-xs text-slate-500 mb-4">Employés nécessitant une attention immédiate</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRisk} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="risk" radius={[0, 4, 4, 0]}>
                {topRisk.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Models per employee */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">Prédictions par employé ({data.models.length})</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50"><tr className="text-left text-xs text-slate-600 uppercase">
          <th className="px-3 py-2">Employé</th><th className="px-3 py-2 text-center">Risque turnover</th><th className="px-3 py-2 text-center">Performance prédite</th><th className="px-3 py-2 text-center">Prob. promotion</th><th className="px-3 py-2 text-center">Croissance salaire</th><th className="px-3 py-2">Facteurs clés</th>
        </tr></thead><tbody>
          {data.models.map((m: any) => {
            const risk = RISK_META[m.turnoverLabel] || RISK_META.FAIBLE
            const perf = PERF_META[m.perfLabel] || PERF_META.MOYEN
            return (
              <tr key={m.employeeId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2"><div className="flex items-center gap-2"><div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-[10px] font-bold ${m.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{m.name[0]}{m.name.split(' ')[1]?.[0]}</div><div><div className="font-medium text-slate-900 text-xs">{m.name}</div><div className="text-[10px] text-slate-500">{m.poste}</div></div></div></td>
                <td className="px-3 py-2 text-center"><div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${risk.bg}`}><span className={`text-xs font-bold ${risk.color}`}>{m.turnoverRisk}%</span></div><div className="text-[9px] text-slate-400 mt-0.5">{risk.label}</div></td>
                <td className="px-3 py-2 text-center"><div className={`inline-flex items-center gap-1 px-2 py-1 rounded ${perf.bg}`}><span className={`text-xs font-bold ${perf.color}`}>{m.perfPrediction}%</span></div><div className="text-[9px] text-slate-400 mt-0.5">{perf.label}</div></td>
                <td className="px-3 py-2 text-center"><div className="text-sm font-bold text-[#27698a]">{m.promotionProb}%</div><div className="h-1 w-16 mx-auto bg-slate-100 rounded-full overflow-hidden mt-1"><div className="h-full bg-[#27698a] rounded-full" style={{ width: `${m.promotionProb}%` }} /></div></td>
                <td className="px-3 py-2 text-center text-sm font-bold text-emerald-600">+{m.salaryGrowth}%</td>
                <td className="px-3 py-2"><div className="flex flex-wrap gap-1"><span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{m.factors.contractType}</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{m.factors.yearsExp} ans</span><span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Eval {m.factors.lastEval}/5</span>{m.factors.absences > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600">{m.factors.absences} abs</span>}</div></td>
              </tr>
            )
          })}
        </tbody></table></div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex items-start gap-3"><Sparkles className="w-5 h-5 text-[#27698a] shrink-0 mt-0.5" /><div className="text-sm text-slate-700"><p className="font-semibold text-slate-900 mb-1">Comment ça marche ?</p><p>Les modèles prédictifs analysent : type de contrat, ancienneté, évaluations, objectifs atteints, absences, demandes de congé. Le turnover risk augmente avec CDD, mauvaises évaluations, absences. La performance prédite augmente avec bonnes évaluations, objectifs atteints, ancienneté.</p></div></div>
      </Card>

      {/* Modal métriques d'entraînement */}
      {showMetrics && trainMetrics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMetrics(false)}>
          <Card className="p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Brain className="w-5 h-5 text-[#27698a]" />Métriques du modèle</h2>
                <p className="text-xs text-slate-500 mt-1">{trainMetrics.modelVersion} · entraîné le {formatDate(trainMetrics.trainedAt)}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMetrics(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-slate-50"><div className="text-xs text-slate-500">Échantillons</div><div className="text-lg font-bold text-slate-900">{trainMetrics.sampleSize}</div></div>
              <div className="p-3 rounded-lg bg-slate-50"><div className="text-xs text-slate-500">Features</div><div className="text-lg font-bold text-slate-900">{trainMetrics.features.length}</div></div>
              <div className="p-3 rounded-lg bg-slate-50"><div className="text-xs text-slate-500">Durée</div><div className="text-lg font-bold text-slate-900">{trainMetrics.trainDurationMs}ms</div></div>
              <div className="p-3 rounded-lg bg-emerald-50"><div className="text-xs text-slate-500">Statut</div><div className="text-lg font-bold text-emerald-600 inline-flex items-center gap-1"><Check className="w-4 h-4" /> {trainMetrics.status}</div></div>
            </div>
            {[
              { key: 'turnover', label: 'Risque turnover', data: trainMetrics.turnover, color: '#dc2626' },
              { key: 'performance', label: 'Performance', data: trainMetrics.performance, color: '#10b981' },
              { key: 'promotion', label: 'Promotion', data: trainMetrics.promotion, color: '#27698a' },
            ].map(m => (
              <div key={m.key} className="mb-3 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-slate-900">{m.label}</span><Badge variant="outline" className="text-[10px]">Score moyen : {m.data.avgScore}%</Badge></div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-1.5 rounded bg-slate-50"><div className="text-slate-500">Accuracy</div><div className="font-bold text-slate-900">{(m.data.accuracy * 100).toFixed(1)}%</div></div>
                  <div className="text-center p-1.5 rounded bg-slate-50"><div className="text-slate-500">Precision</div><div className="font-bold text-slate-900">{(m.data.precision * 100).toFixed(1)}%</div></div>
                  <div className="text-center p-1.5 rounded bg-slate-50"><div className="text-slate-500">Recall</div><div className="font-bold text-slate-900">{(m.data.recall * 100).toFixed(1)}%</div></div>
                  <div className="text-center p-1.5 rounded bg-slate-50"><div className="text-slate-500">F1</div><div className="font-bold text-slate-900">{(m.data.f1Score * 100).toFixed(1)}%</div></div>
                </div>
              </div>
            ))}
            <div className="mt-4 p-3 rounded-lg bg-[#27698a]/5 text-xs text-slate-600">
              <strong>Features utilisées :</strong> {trainMetrics.features.join(', ')}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
