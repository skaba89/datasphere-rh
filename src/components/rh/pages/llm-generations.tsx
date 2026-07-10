'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Library, Star, Archive, Trash2, Copy, Eye, Clock, Cpu, Filter, X, Search } from 'lucide-react'
import { toast } from 'sonner'

interface Generation { id: string; type: string; title: string; content: string; providerId: string; modelId: string; totalTokens: number; estimatedCostUsd: number; durationMs: number; metadata: any; tags: string[]; favorite: boolean; archived: boolean; createdAt: string }

const PROVIDER_COLORS: Record<string, string> = { zai: '#2563eb', openai: '#10a37f', anthropic: '#d97706', groq: '#f55036', gemini: '#4285f4', openrouter: '#8b5cf6', mistral: '#ff7000', deepseek: '#4d6bfe' }

export function LlmGenerationsPage() {
  const [generations, setGenerations] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites' | 'archived'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Generation | null>(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter === 'favorites') params.set('favorite', 'true')
    if (filter === 'archived') params.set('archived', 'true')
    fetch(`/api/llm/generations?${params}`).then(r => r.json()).then(d => setGenerations(d.generations || [])).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [filter])

  const handleFavorite = async (id: string) => { await fetch(`/api/llm/generations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'favorite' }) }); load(); if (selected?.id === id) setSelected(prev => prev ? { ...prev, favorite: !prev.favorite } : null) }
  const handleArchive = async (id: string) => { if (!confirm('Archiver ?')) return; await fetch(`/api/llm/generations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'archive' }) }); toast.success('Archivé'); load(); if (selected?.id === id) setSelected(null) }
  const handleDelete = async (id: string) => { if (!confirm('Supprimer ?')) return; await fetch(`/api/llm/generations/${id}`, { method: 'DELETE' }); toast.success('Supprimé'); load(); if (selected?.id === id) setSelected(null) }

  const filtered = search ? generations.filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || g.content.toLowerCase().includes(search.toLowerCase()) || g.type.toLowerCase().includes(search.toLowerCase())) : generations
  const totalTokens = generations.reduce((s, g) => s + g.totalTokens, 0)
  const totalCost = generations.reduce((s, g) => s + g.estimatedCostUsd, 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Library className="w-6 h-6 text-[#27698a]" />Bibliothèque générations IA</h1><p className="text-sm text-slate-500 mt-1">Historique — réutilisez, marquez favoris, archivez</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-[#27698a]"><div className="text-[10px] text-slate-500 uppercase">Total</div><div className="text-xl font-bold text-slate-900">{generations.length}</div></Card>
        <Card className="p-3 border-l-4 border-l-amber-500"><div className="text-[10px] text-slate-500 uppercase">Favoris</div><div className="text-xl font-bold text-amber-600">{generations.filter(g => g.favorite).length}</div></Card>
        <Card className="p-3 border-l-4 border-l-emerald-500"><div className="text-[10px] text-slate-500 uppercase">Tokens</div><div className="text-xl font-bold text-emerald-600">{totalTokens.toLocaleString()}</div></Card>
        <Card className="p-3 border-l-4 border-l-purple-500"><div className="text-[10px] text-slate-500 uppercase">Coût</div><div className="text-xl font-bold text-purple-600">${totalCost.toFixed(4)}</div></Card>
      </div>

      <Card className="p-3"><div className="flex flex-wrap gap-2 items-center"><Filter className="w-4 h-4 text-slate-400" />{(['all', 'favorites', 'archived'] as const).map(f => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-[#27698a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{f === 'all' ? 'Toutes' : f === 'favorites' ? '⭐ Favoris' : '🗄 Archivées'}</button>)}<div className="relative flex-1 min-w-[200px] ml-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#27698a]" /></div></div></Card>

      {loading ? <Card className="p-8 text-center text-slate-400">Chargement…</Card> : filtered.length === 0 ? <Card className="p-8 text-center text-slate-400"><Library className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucune génération</p></Card> : (
        <div className="space-y-2">
          {filtered.map(g => { const providerColor = PROVIDER_COLORS[g.providerId] || '#64748b'; return (
            <Card key={g.id} className={`p-3 cursor-pointer hover:border-[#27698a]/40 transition-colors ${g.favorite ? 'border-l-4 border-l-amber-400' : ''}`} onClick={() => setSelected(g)}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1"><Badge variant="outline" className="text-[9px] bg-slate-100 text-slate-700">{g.type}</Badge><span className="text-sm font-medium text-slate-900 truncate">{g.title}</span>{g.favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}</div>
                  <p className="text-xs text-slate-500 line-clamp-2">{g.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400"><span className="flex items-center gap-0.5"><Cpu className="w-2.5 h-2.5" style={{ color: providerColor }} />{g.providerId}/{g.modelId}</span><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{g.durationMs}ms</span><span>{g.totalTokens} tok</span>{g.estimatedCostUsd > 0 && <span className="text-amber-600">${g.estimatedCostUsd.toFixed(4)}</span>}<span>{new Date(g.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>
                </div>
                <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleFavorite(g.id)} className={`p-1.5 rounded hover:bg-slate-100 ${g.favorite ? 'text-amber-500' : 'text-slate-400'}`}><Star className={`w-3.5 h-3.5 ${g.favorite ? 'fill-amber-500' : ''}`} /></button>
                  <button onClick={() => setSelected(g)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { navigator.clipboard.writeText(g.content); toast.success('Copié') }} className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleArchive(g.id)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400"><Archive className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </Card>
          )})}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <Card className="p-0 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between">
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[9px] bg-slate-100">{selected.type}</Badge>{selected.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}</div><h2 className="text-lg font-bold text-slate-900 truncate">{selected.title}</h2><p className="text-[10px] text-slate-400 mt-1">{selected.providerId}/{selected.modelId} · {selected.durationMs}ms · {selected.totalTokens} tokens</p></div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto p-5"><pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{selected.content}</pre></div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(selected.content); toast.success('Copié') }}><Copy className="w-3.5 h-3.5 mr-1.5" />Copier</Button><Button variant="outline" size="sm" onClick={() => handleFavorite(selected.id)}><Star className={`w-3.5 h-3.5 mr-1.5 ${selected.favorite ? 'fill-amber-500 text-amber-500' : ''}`} />{selected.favorite ? 'Retirer' : 'Favori'}</Button><Button variant="outline" size="sm" onClick={() => handleArchive(selected.id)}><Archive className="w-3.5 h-3.5 mr-1.5" />Archiver</Button></div>
          </Card>
        </div>
      )}
    </div>
  )
}
