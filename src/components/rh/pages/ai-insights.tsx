'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, AlertTriangle, TrendingUp, GraduationCap, ShieldAlert, DollarSign, UserCheck, Sparkles, Lightbulb } from 'lucide-react'
import { formatGNF } from '@/lib/utils-rh'

interface Insight {
  category: string; title: string; description: string; severity: string;
  confidence: number; recommendation: string; affectedEmployeeId?: string | null
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  TURNOVER_RISK: { label: 'Risque de départ', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  PROMOTION: { label: 'Promotion', icon: UserCheck, color: 'bg-emerald-100 text-emerald-700' },
  TRAINING_NEED: { label: 'Besoin formation', icon: GraduationCap, color: 'bg-amber-100 text-amber-700' },
  BUDGET_OPTIMIZATION: { label: 'Optimisation budget', icon: DollarSign, color: 'bg-[#27698a]/10 text-[#27698a]' },
  COMPLIANCE_RISK: { label: 'Risque conformité', icon: ShieldAlert, color: 'bg-purple-100 text-purple-700' },
}

const SEVERITY_META: Record<string, { label: string; color: string; border: string }> = {
  CRITICAL: { label: 'Critique', color: 'text-red-600', border: 'border-l-red-500' },
  WARNING: { label: 'Attention', color: 'text-amber-600', border: 'border-l-amber-500' },
  INFO: { label: 'Info', color: 'text-[#27698a]', border: 'border-l-[#27698a]' },
}

export function AIInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/ai-insights').then(r => r.json()).then(d => { if (mounted) { setInsights(d); setLoading(false) } }).catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  const stats = {
    total: insights.length,
    critical: insights.filter(i => i.severity === 'CRITICAL').length,
    warning: insights.filter(i => i.severity === 'WARNING').length,
    info: insights.filter(i => i.severity === 'INFO').length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#27698a]" />
          Aide à la décision IA
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Recommandations intelligentes basées sur l'analyse de vos données RH en temps réel
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Brain} label="Insights" value={stats.total} color="#27698a" />
        <KpiCard icon={AlertTriangle} label="Critiques" value={stats.critical} color="#b94659" />
        <KpiCard icon={AlertTriangle} label="Attentions" value={stats.warning} color="#96783c" />
        <KpiCard icon={TrendingUp} label="Infos" value={stats.info} color="#478e5e" />
      </div>

      {/* Insights */}
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const cat = CATEGORY_META[insight.category] || { label: insight.category, icon: Brain, color: 'bg-slate-100 text-slate-700' }
          const sev = SEVERITY_META[insight.severity] || SEVERITY_META.INFO
          const CatIcon = cat.icon

          return (
            <Card key={idx} className={`p-4 border-l-4 ${sev.border}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                  <CatIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className={cat.color}>{cat.label}</Badge>
                    <span className={`text-xs font-semibold ${sev.color}`}>{sev.label}</span>
                    <span className="text-xs text-slate-400">· Confiance {insight.confidence}%</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{insight.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{insight.description}</p>
                  <div className="mt-2 p-2 rounded bg-slate-50 text-xs text-slate-700">
                    <span className="font-semibold text-[#27698a] inline-flex items-center gap-1"><Lightbulb className="w-3 h-3 inline" /> Recommandation : </span>
                    {insight.recommendation}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
        {insights.length === 0 && (
          <Card className="p-8 text-center text-slate-400">
            <Brain className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucune insight pour le moment</p>
            <p className="text-xs mt-1">L'IA analyse vos données en continu</p>
          </Card>
        )}
      </div>

      {/* Info */}
      <Card className="p-4 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-[#27698a] shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold text-slate-900 mb-1">Comment ça marche ?</p>
            <p>L'IA analyse en temps réel vos données RH (contrats, évaluations, objectifs, conformité, présence, enquêtes) pour identifier :</p>
            <ul className="mt-2 ml-4 list-disc space-y-0.5 text-xs">
              <li><strong>Risques de départ</strong> : CDD se terminant, NPS négatif, absentéisme élevé</li>
              <li><strong>Opportunités de promotion</strong> : employés à haute performance et ancienneté</li>
              <li><strong>Besoins de formation</strong> : objectifs non atteints, gaps de compétences</li>
              <li><strong>Risques de conformité</strong> : obligations en retard, échéances proches</li>
              <li><strong>Optimisations budgétaires</strong> : allègements de charges, structure salariale</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}
