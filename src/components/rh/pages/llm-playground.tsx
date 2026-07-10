'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cpu, Play, Plus, X, Check, Clock, DollarSign, Zap, Repeat, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface Provider { id: string; label: string; color: string; configured: boolean; defaultModel: string; models: any[] }
interface RunResult { providerId: string; providerLabel: string; model: string; content: string; durationMs: number; usage?: any; success: boolean; error?: string; costUsd?: number }

const DEFAULT_PROMPTS = [
  { label: 'Bonjour', prompt: 'Dis bonjour en français, en une phrase.' },
  { label: 'Calcul paie', prompt: 'Calcule le salaire net pour un brut de 1 500 000 GNF avec 8% CNSS.' },
  { label: 'Contrat CDI', prompt: 'Rédige les 3 premiers articles d\'un contrat CDI guinéen.' },
]

export function LlmPlaygroundPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState(DEFAULT_PROMPTS[0].prompt)
  const [systemPrompt, setSystemPrompt] = useState('Tu es un assistant RH professionnel. Réponds en français.')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(500)
  const [selectedConfigs, setSelectedConfigs] = useState<Array<{ providerId: string; modelId: string }>>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newConfig, setNewConfig] = useState<{ providerId: string; modelId: string }>({ providerId: '', modelId: '' })
  const [results, setResults] = useState<RunResult[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    fetch('/api/llm/providers').then(r => r.json()).then(d => {
      const available = (d.providers || []).filter((p: Provider) => p.configured || p.id === 'zai')
      setProviders(available)
      if (available.length > 0 && selectedConfigs.length === 0) { const zai = available.find((p: Provider) => p.id === 'zai') || available[0]; setSelectedConfigs([{ providerId: zai.id, modelId: zai.defaultModel }]) }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const addConfig = () => {
    if (!newConfig.providerId) return
    const provider = providers.find(p => p.id === newConfig.providerId)
    if (!provider) return
    const modelId = newConfig.modelId || provider.defaultModel
    if (selectedConfigs.some(c => c.providerId === newConfig.providerId && c.modelId === modelId)) { toast.error('Déjà ajouté'); return }
    setSelectedConfigs([...selectedConfigs, { providerId: newConfig.providerId, modelId }]); setNewConfig({ providerId: '', modelId: '' }); setShowAdd(false)
  }

  const runComparison = async () => {
    if (!prompt.trim() || selectedConfigs.length === 0) return
    setRunning(true); setResults([])
    const promises = selectedConfigs.map(async (config) => {
      const provider = providers.find(p => p.id === config.providerId)
      const result: RunResult = { providerId: config.providerId, providerLabel: provider?.label || config.providerId, model: config.modelId, content: '', durationMs: 0, success: false }
      try {
        const res = await fetch('/api/llm/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: config.providerId, model: config.modelId, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], temperature, maxTokens }) })
        const data = await res.json()
        if (data.success) { result.content = data.content; result.durationMs = data.durationMs; result.usage = data.usage; result.success = true; const model = provider?.models.find(m => m.id === config.modelId); if (model?.inputPricePer1M && data.usage) { result.costUsd = Math.round(((model.inputPricePer1M * (data.usage.promptTokens || 0) / 1e6) + (model.outputPricePer1M || 0) * (data.usage.completionTokens || 0) / 1e6) * 1e6) / 1e6 } }
        else result.error = data.error || 'Échec'
      } catch (e: any) { result.error = e?.message || 'Erreur' }
      return result
    })
    const settled = await Promise.allSettled(promises)
    setResults(settled.map(s => s.status === 'fulfilled' ? s.value : { providerId: '', providerLabel: 'Error', model: '', content: '', durationMs: 0, success: false, error: 'Error' }))
    setRunning(false); toast.success(`${results.filter(r => r.success).length}/${selectedConfigs.length} providers ont répondu`)
  }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Cpu className="w-6 h-6 text-[#27698a]" />Playground IA</h1><p className="text-sm text-slate-500 mt-1">Comparez les réponses de plusieurs providers</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <div><label className="text-xs font-medium text-slate-700 mb-1 block">System prompt</label><textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border border-slate-300 text-sm resize-none focus:outline-none focus:border-[#27698a]" /></div>
          <div><label className="text-xs font-medium text-slate-700 mb-1 block">Prompt</label><div className="flex flex-wrap gap-1 mb-2">{DEFAULT_PROMPTS.map(p => <button key={p.label} onClick={() => setPrompt(p.prompt)} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600">{p.label}</button>)}</div><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full px-3 py-2 rounded border border-slate-300 text-sm resize-none focus:outline-none focus:border-[#27698a]" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-700 mb-1 block">Température : {temperature}</label><input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full" /></div><div><label className="text-xs font-medium text-slate-700 mb-1 block">Max tokens</label><input type="number" value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value) || 500)} className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm" /></div></div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Repeat className="w-4 h-4 text-[#27698a]" />Providers ({selectedConfigs.length})</h3><Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)}><Plus className="w-3.5 h-3.5 mr-1" />Ajouter</Button></div>
          {showAdd && <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-2"><select value={newConfig.providerId} onChange={e => { const p = providers.find(x => x.id === e.target.value); setNewConfig({ providerId: e.target.value, modelId: p?.defaultModel || '' }) }} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm">{<option value="">Sélectionner…</option>}{providers.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select>{newConfig.providerId && <select value={newConfig.modelId} onChange={e => setNewConfig({ ...newConfig, modelId: e.target.value })} className="w-full px-2 py-1.5 rounded border border-slate-300 text-sm">{providers.find(p => p.id === newConfig.providerId)?.models.map(m => <option key={m.id} value={m.id}>{m.label} ({m.id})</option>)}</select>}<Button size="sm" className="w-full bg-[#27698a] hover:bg-[#1f5670]" onClick={addConfig} disabled={!newConfig.providerId}><Check className="w-3.5 h-3.5 mr-1" />Confirmer</Button></div>}
          <div className="space-y-2 max-h-48 overflow-y-auto">{selectedConfigs.length === 0 ? <div className="text-center text-slate-400 text-xs py-4">Aucun provider</div> : selectedConfigs.map((config, idx) => { const provider = providers.find(p => p.id === config.providerId); return <div key={idx} className="flex items-center gap-2 p-2 rounded border border-slate-200"><span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: provider?.color || '#27698a' }} /><div className="flex-1 min-w-0"><div className="text-xs font-medium text-slate-900 truncate">{provider?.label}</div><div className="text-[10px] text-slate-500 font-mono truncate">{config.modelId}</div></div><button onClick={() => setSelectedConfigs(selectedConfigs.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button></div> })}</div>
          <Button className="w-full bg-[#27698a] hover:bg-[#1f5670]" onClick={runComparison} disabled={running || !prompt.trim() || selectedConfigs.length === 0}>{running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Comparaison…</> : <><Play className="w-4 h-4 mr-2" />Lancer ({selectedConfigs.length})</>}</Button>
        </Card>
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-[#27698a]" />Résultats</h2>
          <div className={`grid gap-3 ${results.length === 1 ? 'grid-cols-1' : results.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
            {results.map((result, idx) => { const provider = providers.find(p => p.id === result.providerId); return (
              <Card key={idx} className="p-4 border-l-4" style={{ borderLeftColor: provider?.color || '#27698a' }}>
                <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: (provider?.color || '#27698a') + '15', color: provider?.color || '#27698a' }}><Cpu className="w-3.5 h-3.5" /></div><div><div className="text-xs font-semibold text-slate-900">{result.providerLabel}</div><div className="text-[10px] text-slate-500 font-mono">{result.model}</div></div></div>{result.success ? <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700"><Check className="w-2.5 h-2.5 mr-0.5" />OK</Badge> : <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Échec</Badge>}</div>
                {result.success ? <><div className="text-xs text-slate-700 whitespace-pre-wrap max-h-64 overflow-y-auto bg-slate-50 p-2 rounded mb-2">{result.content}</div><div className="flex flex-wrap gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{result.durationMs}ms</span>{result.usage?.totalTokens && <span>{result.usage.totalTokens} tok</span>}{result.costUsd !== undefined && result.costUsd > 0 && <span className="flex items-center gap-0.5 text-amber-700"><DollarSign className="w-2.5 h-2.5" />${result.costUsd.toFixed(6)}</span>}</div></> : <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{result.error}</div>}
              </Card>
            )})}
          </div>
        </div>
      )}
    </div>
  )
}
