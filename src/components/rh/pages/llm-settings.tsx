'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Plus, Check, X, Play, Star, Trash2, Zap, Cpu, Clock, DollarSign, ExternalLink, BarChart3, TrendingUp, Power } from 'lucide-react'
import { toast } from 'sonner'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

interface Provider { id: string; label: string; description: string; color: string; apiStyle: string; docsUrl: string; envVar: string; defaultModel: string; configured: boolean; models: any[] }
interface Setting { id: string; providerId: string; modelId: string; isDefault: boolean; temperature: number; maxTokens: number; lastTestedAt: string | null; lastTestOk: boolean | null }
interface UsageStats { total: number; totalTokens: number; totalPromptTokens: number; totalCompletionTokens: number; totalCostUsd: number; successRate: number; avgDurationMs: number; byProvider: Record<string, { count: number; tokens: number; cost: number; success: number }>; byDay: Array<{ date: string; count: number; tokens: number; cost: number }> }

export function LlmSettingsPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState<Provider | null>(null)
  const [form, setForm] = useState({ modelId: '', isDefault: false, temperature: 0.7, maxTokens: 1000 })
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/llm/providers').then(r => r.json()),
      fetch('/api/llm/settings').then(r => r.json()),
      fetch('/api/llm/usage?since=30d').then(r => r.json()).catch(() => ({ total: 0 })),
    ]).then(([pData, sData, uData]) => {
      setProviders(pData.providers || [])
      setSettings(sData.settings || [])
      setUsage(uData.total !== undefined ? uData as UsageStats : null)
    }).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!showAdd) return
    try {
      const r = await fetch('/api/llm/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerId: showAdd.id, modelId: form.modelId, isDefault: form.isDefault, temperature: form.temperature, maxTokens: form.maxTokens }) })
      const d = await r.json()
      if (d.success) { toast.success(`${showAdd.label} configuré`); setShowAdd(null); setForm({ modelId: '', isDefault: false, temperature: 0.7, maxTokens: 1000 }); load() }
      else toast.error(d.error || 'Échec')
    } catch { toast.error('Erreur réseau') }
  }

  const handleTest = async (id: string) => {
    setTestingId(id)
    try {
      const r = await fetch('/api/llm/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerId: id }) })
      const d = await r.json()
      setTestResults(prev => ({ ...prev, [id]: d }))
      if (d.success) toast.success(`${id} fonctionne (${d.durationMs}ms)`)
      else toast.error(`Échec : ${d.error}`)
    } catch { toast.error('Erreur réseau') }
    finally { setTestingId(null) }
  }

  const handleSetDefault = async (id: string) => {
    try { await fetch(`/api/llm/settings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) }); toast.success('Défini par défaut'); load() }
    catch { toast.error('Erreur') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ?')) return
    try { await fetch(`/api/llm/settings/${id}`, { method: 'DELETE' }); toast.success('Supprimé'); load() }
    catch { toast.error('Erreur') }
  }

  const openAdd = (provider: Provider) => { setShowAdd(provider); setForm({ modelId: provider.defaultModel, isDefault: settings.length === 0, temperature: 0.7, maxTokens: 1000 }) }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>
  const configuredCount = providers.filter(p => p.configured).length

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Brain className="w-6 h-6 text-[#27698a]" />Paramètres IA</h1><p className="text-sm text-slate-500 mt-1">Configurez les providers LLM. {configuredCount}/{providers.length} configurés.</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-[#27698a]"><div className="flex items-center gap-2 mb-1"><Cpu className="w-4 h-4 text-[#27698a]" /><span className="text-[10px] text-slate-500 uppercase">Providers</span></div><div className="text-xl font-bold text-slate-900">{providers.length}</div></Card>
        <Card className="p-3 border-l-4 border-l-emerald-500"><div className="flex items-center gap-2 mb-1"><Check className="w-4 h-4 text-emerald-600" /><span className="text-[10px] text-slate-500 uppercase">Configurés</span></div><div className="text-xl font-bold text-emerald-600">{configuredCount}</div></Card>
        <Card className="p-3 border-l-4 border-l-amber-500"><div className="flex items-center gap-2 mb-1"><Star className="w-4 h-4 text-amber-600" /><span className="text-[10px] text-slate-500 uppercase">Actifs</span></div><div className="text-xl font-bold text-slate-900">{settings.length}</div></Card>
        <Card className="p-3 border-l-4 border-l-purple-500"><div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-purple-600" /><span className="text-[10px] text-slate-500 uppercase">Défaut</span></div><div className="text-sm font-bold text-slate-900 truncate">{settings.find(s => s.isDefault)?.providerId || 'ZAI (auto)'}</div></Card>
      </div>

      {usage && usage.total > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-[#27698a]" />Consommation IA (30 jours)</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 mt-3">
            <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-slate-500">Appels</div><div className="text-base font-bold text-slate-900">{usage.total}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-slate-500">Tokens</div><div className="text-base font-bold text-[#27698a]">{usage.totalTokens.toLocaleString()}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-slate-500">Prompt</div><div className="text-base font-bold text-slate-700">{usage.totalPromptTokens.toLocaleString()}</div></div>
            <div className="p-2 rounded bg-slate-50"><div className="text-[10px] text-slate-500">Completion</div><div className="text-base font-bold text-slate-700">{usage.totalCompletionTokens.toLocaleString()}</div></div>
            <div className="p-2 rounded bg-amber-50"><div className="text-[10px] text-amber-700">Coût</div><div className="text-base font-bold text-amber-700">${usage.totalCostUsd.toFixed(4)}</div></div>
            <div className="p-2 rounded bg-emerald-50"><div className="text-[10px] text-emerald-700">Succès</div><div className="text-base font-bold text-emerald-700">{usage.successRate.toFixed(1)}%</div></div>
          </div>
          {usage.byDay?.length > 0 && (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usage.byDay} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <defs><linearGradient id="grad-tokens" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#27698a" stopOpacity={0.8} /><stop offset="95%" stopColor="#27698a" stopOpacity={0.1} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="tokens" name="Tokens" stroke="#27698a" fill="url(#grad-tokens)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {settings.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-[#27698a]" />Providers configurés ({settings.length})</h2></div>
          <div className="divide-y divide-slate-100">
            {settings.map(s => {
              const provider = providers.find(p => p.id === s.providerId)
              return (
                <div key={s.id} className="px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (provider?.color || '#27698a') + '15', color: provider?.color || '#27698a' }}><Brain className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-slate-900">{provider?.label || s.providerId}</span>
                        <Badge variant="outline" className="text-[9px] font-mono bg-slate-50">{s.modelId}</Badge>
                        {s.isDefault && <Badge variant="outline" className="text-[9px] bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20"><Star className="w-2.5 h-2.5 mr-0.5" />Défaut</Badge>}
                        {s.lastTestedAt && <Badge variant="outline" className={`text-[9px] inline-flex items-center gap-1 ${s.lastTestOk ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{s.lastTestOk ? <><Check className="w-2.5 h-2.5" /> OK</> : <><X className="w-2.5 h-2.5" /> Échec</>}</Badge>}
                      </div>
                      <div className="text-[11px] text-slate-500">Température : {s.temperature} · Max tokens : {s.maxTokens}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleTest(s.providerId)} disabled={testingId === s.providerId}><Play className="w-3 h-3 mr-1" />{testingId === s.providerId ? '…' : 'Tester'}</Button>
                      {!s.isDefault && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleSetDefault(s.id)}><Star className="w-3 h-3" /></Button>}
                      <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(s.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div>
        <h2 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-[#27698a]" />Catalogue ({providers.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {providers.map(provider => {
            const isAdded = settings.some(s => s.providerId === provider.id)
            return (
              <Card key={provider.id} className={`p-4 ${!provider.configured && provider.id !== 'zai' && provider.id !== 'ollama' ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: provider.color + '15', color: provider.color }}><Brain className="w-4 h-4" /></div>
                    <div><div className="font-semibold text-slate-900 text-sm">{provider.label}</div><div className="text-[10px] text-slate-400 uppercase">{provider.apiStyle}</div></div>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${provider.configured || provider.id === 'ollama' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>{provider.configured || provider.id === 'ollama' ? '● Configuré' : '○ Manquant'}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-2 line-clamp-2">{provider.description}</p>
                <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1"><code className="font-mono bg-slate-50 px-1 py-0.5 rounded">{provider.envVar}</code><a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-[#27698a] hover:underline ml-auto flex items-center gap-0.5">Docs <ExternalLink className="w-2.5 h-2.5" /></a></div>
                <div className="flex flex-wrap gap-1 mb-3">{provider.models.slice(0, 4).map(m => <span key={m.id} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 font-mono">{m.id}</span>)}{provider.models.length > 4 && <span className="text-[9px] text-slate-400">+{provider.models.length - 4}</span>}</div>
                <div className="flex gap-1">
                  {!isAdded ? <Button size="sm" className="flex-1 h-7 text-xs bg-[#27698a] hover:bg-[#1f5670]" onClick={() => openAdd(provider)}><Plus className="w-3 h-3 mr-1" />Configurer</Button>
                  : <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" disabled><Check className="w-3 h-3 mr-1 text-emerald-600" />Ajouté</Button>}
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleTest(provider.id)} disabled={testingId === provider.id} title="Tester"><Play className="w-3 h-3" /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(null)}>
          <Card className="p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4"><div><h2 className="text-lg font-bold text-slate-900">Configurer {showAdd.label}</h2><p className="text-xs text-slate-500 mt-1">{showAdd.description}</p></div><Button variant="ghost" size="sm" onClick={() => setShowAdd(null)}><X className="w-4 h-4" /></Button></div>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Modèle</label><select value={form.modelId} onChange={e => setForm({ ...form, modelId: e.target.value })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm">{showAdd.models.map(m => <option key={m.id} value={m.id}>{m.label} ({m.id})</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-medium text-slate-700 mb-1 block">Température : {form.temperature}</label><input type="range" min="0" max="2" step="0.1" value={form.temperature} onChange={e => setForm({ ...form, temperature: parseFloat(e.target.value) })} className="w-full" /></div><div><label className="text-xs font-medium text-slate-700 mb-1 block">Max tokens</label><input type="number" value={form.maxTokens} onChange={e => setForm({ ...form, maxTokens: parseInt(e.target.value) || 1000 })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" /></div></div>
              <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} /><span>Définir comme provider par défaut</span></label>
              <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setShowAdd(null)}>Annuler</Button><Button className="flex-1 bg-[#27698a] hover:bg-[#1f5670]" onClick={handleAdd}>Enregistrer</Button></div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-4 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex items-start gap-3"><Brain className="w-5 h-5 text-[#27698a] shrink-0 mt-0.5" /><div className="text-sm text-slate-700"><p className="font-semibold text-slate-900 mb-1">Configuration des clés API</p><p className="text-xs">Ajoutez vos clés dans <code className="font-mono bg-slate-100 px-1 rounded">.env</code> puis redémarrez. Z.ai (GLM) fonctionne sans clé.</p></div></div>
      </Card>
    </div>
  )
}
