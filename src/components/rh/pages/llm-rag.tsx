'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Plus, Trash2, Search, X, FileText, Database, Loader2, Sparkles, Eye, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface IndexedDoc { title: string; source: string; documentId: string | null; chunks: number; createdAt: string }
interface SearchResult { id: string; title: string; source: string; content: string; score: number; chunkIndex: number }

const SOURCE_META: Record<string, { label: string; color: string }> = {
  policy: { label: 'Politique', color: 'bg-[#27698a]/10 text-[#27698a]' },
  contract_template: { label: 'Contrat type', color: 'bg-purple-50 text-purple-700' },
  faq: { label: 'FAQ', color: 'bg-emerald-50 text-emerald-700' },
  manual: { label: 'Manuel', color: 'bg-sky-50 text-sky-700' },
  law: { label: 'Loi', color: 'bg-red-50 text-red-700' },
  other: { label: 'Autre', color: 'bg-slate-100 text-slate-700' },
}

export function LlmRagPage() {
  const [docs, setDocs] = useState<IndexedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ source: 'policy', title: '', content: '' })
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  const load = () => { setLoading(true); fetch('/api/llm/rag/index').then(r => r.json()).then(d => { setDocs(d.documents || []); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!form.title || !form.content) { toast.error('Titre et contenu requis'); return }
    if (form.content.length < 50) { toast.error('Min 50 caractères'); return }
    setAdding(true)
    try { const r = await fetch('/api/llm/rag/index', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const d = await r.json(); if (d.success) { toast.success(`${d.chunksCreated} chunks indexés`); setShowAdd(false); setForm({ source: 'policy', title: '', content: '' }); load() } else toast.error(d.error) } catch { toast.error('Erreur') } finally { setAdding(false) }
  }
  const handleDelete = async (doc: IndexedDoc) => {
    if (!confirm(`Supprimer "${doc.title}" ?`)) return
    const params = new URLSearchParams({ title: doc.title, source: doc.source }); if (doc.documentId) params.set('documentId', doc.documentId)
    try { await fetch(`/api/llm/rag/index?${params}`, { method: 'DELETE' }); toast.success('Supprimé'); load() } catch { toast.error('Erreur') }
  }
  const handleSearch = async () => {
    if (!search.trim()) return; setSearching(true); setSelectedResult(null)
    try { const r = await fetch(`/api/llm/rag/search?q=${encodeURIComponent(search)}&limit=10`); const d = await r.json(); setResults(d.results || []) } catch { toast.error('Erreur') } finally { setSearching(false) }
  }

  const totalChunks = docs.reduce((s, d) => s + d.chunks, 0)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><BookOpen className="w-6 h-6 text-[#27698a]" />Base de connaissances RAG</h1><p className="text-sm text-slate-500 mt-1">Indexez vos documents RH pour Q&A contextuelle</p></div>
        <Button className="bg-[#27698a] hover:bg-[#1f5670]" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" />Indexer un document</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3 border-l-4 border-l-[#27698a]"><div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-[#27698a]" /><span className="text-[10px] text-slate-500 uppercase">Documents</span></div><div className="text-xl font-bold text-slate-900">{docs.length}</div></Card>
        <Card className="p-3 border-l-4 border-l-emerald-500"><div className="flex items-center gap-2 mb-1"><Database className="w-4 h-4 text-emerald-600" /><span className="text-[10px] text-slate-500 uppercase">Chunks</span></div><div className="text-xl font-bold text-emerald-600">{totalChunks}</div></Card>
        <Card className="p-3 border-l-4 border-l-purple-500"><div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-purple-600" /><span className="text-[10px] text-slate-500 uppercase">Sources</span></div><div className="text-xl font-bold text-purple-600">{new Set(docs.map(d => d.source)).size}</div></Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Search className="w-4 h-4 text-[#27698a]" />Tester la recherche</h3>
        <div className="flex gap-2 mb-3"><input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Cherchez un mot-clé..." className="flex-1 px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#27698a]" /><Button onClick={handleSearch} disabled={searching || !search.trim()} className="bg-[#27698a] hover:bg-[#1f5670]">{searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}</Button></div>
        {results.length > 0 && <div className="space-y-2">{results.map(r => { const meta = SOURCE_META[r.source] || SOURCE_META.other; return <div key={r.id} className="p-3 rounded border border-slate-200 cursor-pointer hover:border-[#27698a]/40" onClick={() => setSelectedResult(r)}><div className="flex items-center gap-2 mb-1"><Badge variant="outline" className={`text-[9px] ${meta.color}`}>{meta.label}</Badge><span className="text-sm font-medium text-slate-900 truncate">{r.title}</span><Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 ml-auto">score: {r.score}</Badge></div><p className="text-xs text-slate-600 line-clamp-2">{r.content}</p></div> })}</div>}
      </Card>

      <div>
        <h2 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-[#27698a]" />Documents indexés ({docs.length})</h2>
        {loading ? <Card className="p-8 text-center text-slate-400 text-sm">Chargement…</Card> : docs.length === 0 ? <Card className="p-8 text-center text-slate-400"><BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun document indexé</p></Card> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {docs.map((doc, idx) => { const meta = SOURCE_META[doc.source] || SOURCE_META.other; return (
              <Card key={idx} className="p-4">
                <div className="flex items-start justify-between mb-2"><Badge variant="outline" className={`text-[9px] ${meta.color}`}>{meta.label}</Badge><button onClick={() => handleDelete(doc)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
                <h3 className="text-sm font-semibold text-slate-900 truncate">{doc.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400"><span className="flex items-center gap-0.5"><Database className="w-2.5 h-2.5" />{doc.chunks} chunks</span><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span></div>
              </Card>
            )})}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAdd(false)}>
          <Card className="p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4"><div><h2 className="text-lg font-bold">Indexer un document</h2><p className="text-xs text-slate-500 mt-1">Le document sera découpé en chunks</p></div><Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}><X className="w-4 h-4" /></Button></div>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Type</label><select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm"><option value="policy">Politique</option><option value="contract_template">Contrat type</option><option value="faq">FAQ</option><option value="manual">Manuel</option><option value="law">Loi</option><option value="other">Autre</option></select></div>
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Titre</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Politique de télétravail" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" /></div>
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Contenu ({form.content.length} caractères)</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={12} placeholder="Collez le texte du document..." className="w-full px-3 py-2 rounded border border-slate-300 text-sm font-mono resize-y" /></div>
              <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setShowAdd(false)}>Annuler</Button><Button className="flex-1 bg-[#27698a] hover:bg-[#1f5670]" onClick={handleAdd} disabled={adding || !form.title || form.content.length < 50}>{adding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Indexation…</> : 'Indexer'}</Button></div>
            </div>
          </Card>
        </div>
      )}

      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedResult(null)}>
          <Card className="p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3"><div><Badge variant="outline" className={`text-[9px] ${(SOURCE_META[selectedResult.source] || SOURCE_META.other).color}`}>{(SOURCE_META[selectedResult.source] || SOURCE_META.other).label}</Badge><h2 className="text-lg font-bold text-slate-900 mt-2">{selectedResult.title}</h2><p className="text-xs text-slate-400">Chunk #{selectedResult.chunkIndex} · Score: {selectedResult.score}</p></div><Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}><X className="w-4 h-4" /></Button></div>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{selectedResult.content}</pre>
          </Card>
        </div>
      )}
    </div>
  )
}
