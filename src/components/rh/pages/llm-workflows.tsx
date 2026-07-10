'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Workflow as WorkflowIcon, Play, Loader2, Check, X, Clock, Cpu, ArrowRight, Zap, Plus, Trash2, Save, FileText, Library, Globe, ClipboardList, Sparkles, Key, Settings, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface WorkflowStep { id: string; type: string; label: string; config: any }
interface Workflow { id: string; name: string; description: string; steps: WorkflowStep[]; stepsCount: number; isCustom?: boolean }

const STEP_ICONS: Record<string, React.ElementType> = { generate_document: FileText, index_in_rag: Library, save_generation: Save, translate: Globe, summarize: ClipboardList, improve: Sparkles, extract_keywords: Key, custom: Settings }
const STEP_COLORS: Record<string, string> = { generate_document: 'bg-[#27698a]/10 text-[#27698a]', index_in_rag: 'bg-purple-50 text-purple-700', save_generation: 'bg-emerald-50 text-emerald-700', translate: 'bg-sky-50 text-sky-700', summarize: 'bg-amber-50 text-amber-700', improve: 'bg-pink-50 text-pink-700', extract_keywords: 'bg-orange-50 text-orange-700', custom: 'bg-slate-100 text-slate-700' }

export function LlmWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [customWorkflows, setCustomWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Workflow | null>(null)
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [finalOutput, setFinalOutput] = useState('')
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [stats, setStats] = useState<{ totalDurationMs: number; totalTokens: number } | null>(null)

  useEffect(() => {
    Promise.all([fetch('/api/llm/workflows').then(r => r.json()), fetch('/api/llm/custom-workflows').then(r => r.json())]).then(([pData, cData]) => { setWorkflows(pData.workflows || []); setCustomWorkflows(cData.custom || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const runWorkflow = async () => {
    if (!selected || !input.trim()) return
    setRunning(true); setResults(null)
    try {
      const isCustom = (selected as any).isCustom
      const url = isCustom ? `/api/llm/custom-workflows/${selected.id}/run` : '/api/llm/workflows'
      const body = isCustom ? { input } : { workflowId: selected.id, input }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) { setResults(data.results || []); setFinalOutput(data.finalOutput); setStats({ totalDurationMs: data.totalDurationMs, totalTokens: data.totalTokens }); toast.success(`${data.successCount}/${data.steps} étapes réussies`) }
      else toast.error(data.error)
    } catch { toast.error('Erreur') } finally { setRunning(false) }
  }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><WorkflowIcon className="w-6 h-6 text-[#27698a]" />Workflows IA</h1><p className="text-sm text-slate-500 mt-1">Chaînez plusieurs étapes IA</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Zap className="w-4 h-4 text-[#27698a]" />Prédéfinis ({workflows.length})</h2>
          {workflows.map(w => (
            <Card key={w.id} className={`p-4 cursor-pointer transition-all ${selected?.id === w.id ? 'border-2 border-[#27698a]' : 'hover:border-[#27698a]/40'}`} onClick={() => { setSelected(w); setResults(null); setInput('') }}>
              <div className="flex items-start justify-between mb-2"><h3 className="text-sm font-semibold text-slate-900">{w.name}</h3><Badge variant="outline" className="text-[9px] bg-[#27698a]/5 text-[#27698a]">{w.stepsCount || w.steps.length} étapes</Badge></div>
              <p className="text-xs text-slate-600 mb-2">{w.description}</p>
              <div className="flex items-center gap-1 flex-wrap">{(w.steps || []).slice(0, 5).map((s, i) => { const StepIcon = STEP_ICONS[s.type] || Settings; return <div key={s.id} className="flex items-center gap-1"><Badge variant="outline" className={`text-[8px] inline-flex items-center gap-0.5 ${STEP_COLORS[s.type] || 'bg-slate-100'}`}><StepIcon className="w-2.5 h-2.5" /> {s.label}</Badge>{i < (w.steps || []).length - 1 && <ArrowRight className="w-2.5 h-2.5 text-slate-300" />}</div> })}</div>
            </Card>
          ))}
          {customWorkflows.length > 0 && <h3 className="text-xs font-semibold text-slate-700 mt-4 mb-2">Custom ({customWorkflows.length})</h3>}
          {customWorkflows.map((w: any) => (
            <Card key={w.id} className={`p-3 cursor-pointer transition-all ${selected?.id === w.id ? 'border-2 border-[#27698a]' : 'hover:border-[#27698a]/40'}`} onClick={() => { setSelected({ ...w, isCustom: true, stepsCount: w.steps.length }); setResults(null); setInput('') }}>
              <div className="flex items-start justify-between mb-1"><span className="text-xs font-semibold text-slate-900">{w.name}</span>{w.trigger && w.trigger !== 'manual' && <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-700 inline-flex items-center gap-0.5"><Zap className="w-2.5 h-2.5" /> {w.trigger}</Badge>}</div>
              <p className="text-[10px] text-slate-500 truncate">{w.description}</p>
              <Badge variant="outline" className="text-[8px] bg-[#27698a]/5 text-[#27698a] mt-1">{w.steps.length} étapes</Badge>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {selected ? (
            <>
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">{selected.name}</h3>
                <textarea value={input} onChange={e => setInput(e.target.value)} rows={5} placeholder="Input initial..." className="w-full px-3 py-2 rounded border border-slate-300 text-sm resize-y focus:outline-none focus:border-[#27698a]" />
                <Button className="w-full mt-3 bg-[#27698a] hover:bg-[#1f5670]" onClick={runWorkflow} disabled={running || !input.trim()}>{running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Exécution…</> : <><Play className="w-4 h-4 mr-2" />Exécuter ({selected.steps?.length || selected.stepsCount} étapes)</>}</Button>
              </Card>
              {results.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">Résultats ({results.length})</h3>{stats && <div className="flex gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{stats.totalDurationMs}ms</span><span className="flex items-center gap-0.5"><Cpu className="w-2.5 h-2.5" />{stats.totalTokens} tok</span></div>}</div>
                  <div className="space-y-2 mb-4">{results.map((r, idx) => { const isExpanded = expandedStep === r.stepId; const RIcon = STEP_ICONS[r.stepType] || Settings; return <div key={r.stepId} className={`p-3 rounded border ${r.success ? 'border-slate-200' : 'border-red-200 bg-red-50'}`}><div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedStep(isExpanded ? null : r.stepId)}><div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${r.success ? 'bg-emerald-500' : 'bg-red-500'}`}>{r.success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}</div><div className="flex-1 min-w-0"><div className="text-xs font-medium text-slate-900 inline-flex items-center gap-1">{idx + 1}. <RIcon className="w-3 h-3" /> {r.stepLabel}</div><div className="text-[10px] text-slate-500">{r.durationMs}ms{r.tokensUsed ? ` · ${r.tokensUsed.totalTokens} tok` : ''}</div></div></div>{isExpanded && <div className="mt-3 space-y-2">{r.error ? <div className="text-xs text-red-600 bg-red-50 p-2 rounded inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {r.error}</div> : <><div><div className="text-[9px] text-slate-400 uppercase mb-0.5">Output</div><pre className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">{r.output?.slice(0, 1000)}</pre></div></>}</div>}</div> })}</div>
                  <div><div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" />Output final</div><pre className="text-xs text-slate-700 bg-[#27698a]/5 p-3 rounded max-h-64 overflow-y-auto whitespace-pre-wrap border border-[#27698a]/20">{finalOutput}</pre></div>
                </Card>
              )}
            </>
          ) : <Card className="p-8 text-center text-slate-400"><WorkflowIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-sm">Sélectionnez un workflow</p></Card>}
        </div>
      </div>
    </div>
  )
}
