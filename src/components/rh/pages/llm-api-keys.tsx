'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Key, Plus, X, Check, Trash2, Power, Copy, AlertTriangle, Clock, Cpu, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKeyItem { id: string; name: string; keyPrefix: string; scopes: string[]; rateLimitPerHour: number; lastUsedAt: string | null; lastUsedIp: string | null; requestCount: number; isActive: boolean; expiresAt: string | null; createdAt: string }
interface ScopeInfo { id: string; label: string }

export function LlmApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [scopes, setScopes] = useState<ScopeInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', scopes: ['llm:chat'], rateLimitPerHour: 100 })
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  const load = () => { setLoading(true); fetch('/api/llm/api-keys').then(r => r.json()).then(d => { setKeys(d.keys || []); setScopes(d.availableScopes || []); setLoading(false) }).catch(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name) { toast.error('Nom requis'); return }
    setCreating(true)
    try { const r = await fetch('/api/llm/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const d = await r.json(); if (d.success) { setNewKey(d.plainKey); setShowKey(true); toast.success('Clé créée'); setShowCreate(false); setForm({ name: '', scopes: ['llm:chat'], rateLimitPerHour: 100 }); load() } else toast.error(d.error) } catch { toast.error('Erreur') } finally { setCreating(false) }
  }
  const handleToggle = async (id: string, isActive: boolean) => { await fetch(`/api/llm/api-keys/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) }); toast.success(`Clé ${!isActive ? 'activée' : 'désactivée'}`); load() }
  const handleDelete = async (id: string) => { if (!confirm("Supprimer définitivement ?")) return; await fetch(`/api/llm/api-keys/${id}`, { method: 'DELETE' }); toast.success('Clé supprimée'); load() }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Key className="w-6 h-6 text-[#27698a]" />Clés API publique</h1><p className="text-sm text-slate-500 mt-1">Intégrez DataSphere RH via l'API REST v1</p></div>
        <Button className="bg-[#27698a] hover:bg-[#1f5670]" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Créer une clé</Button>
      </div>

      {newKey && (
        <Card className="p-5 border-2 border-emerald-400 bg-emerald-50">
          <div className="flex items-start gap-3 mb-3"><AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /><div className="flex-1"><h3 className="text-sm font-bold text-emerald-900">Clé créée — copiez-la maintenant !</h3><p className="text-xs text-emerald-700 mt-1">Cette clé ne sera plus jamais affichée.</p></div><Button variant="ghost" size="sm" onClick={() => { setNewKey(null); setShowKey(false) }}><X className="w-4 h-4" /></Button></div>
          <div className="flex items-center gap-2"><code className="flex-1 p-3 rounded bg-white border border-emerald-200 text-sm font-mono text-emerald-900 break-all">{showKey ? newKey : '•'.repeat(newKey.length)}</code><Button variant="outline" size="sm" onClick={() => setShowKey(!showKey)}>{showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button><Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copié') }}><Copy className="w-4 h-4" /></Button></div>
        </Card>
      )}

      {loading ? <Card className="p-8 text-center text-slate-400">Chargement…</Card> : keys.length === 0 ? <Card className="p-8 text-center text-slate-400"><Key className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucune clé API</p></Card> : (
        <div className="space-y-2">
          {keys.map(k => (
            <Card key={k.id} className={`p-4 ${!k.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${k.isActive ? 'bg-[#27698a]/10 text-[#27698a]' : 'bg-slate-100 text-slate-400'}`}><Key className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1"><span className="text-sm font-semibold text-slate-900">{k.name}</span><code className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">{k.keyPrefix}…</code><Badge variant="outline" className={`text-[9px] ${k.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>{k.isActive ? '● Active' : '○ Désactivée'}</Badge></div>
                  <div className="flex flex-wrap gap-1 mb-2">{k.scopes.map(s => <Badge key={s} variant="outline" className="text-[8px] bg-[#27698a]/5 text-[#27698a]">{s}</Badge>)}</div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400"><span>{k.requestCount} requêtes</span><span>{k.rateLimitPerHour}/h</span>{k.lastUsedAt && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(k.lastUsedAt).toLocaleString('fr-FR')}</span>}</div>
                </div>
                <div className="flex gap-1 shrink-0"><Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleToggle(k.id, k.isActive)}><Power className="w-3 h-3" /></Button><Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(k.id)}><Trash2 className="w-3 h-3" /></Button></div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-[#27698a]" />Documentation API v1</h3>
        <div className="space-y-2 text-xs">
          <div><div className="font-mono text-[#27698a] font-medium">POST /api/v1/llm/chat</div><div className="text-slate-500">Chat unifié — scope: <code>llm:chat</code></div></div>
          <div><div className="font-mono text-[#27698a] font-medium">POST /api/v1/llm/vision</div><div className="text-slate-500">Analyse images — scope: <code>llm:vision</code></div></div>
          <div><div className="font-mono text-[#27698a] font-medium">POST /api/v1/llm/rag/ask</div><div className="text-slate-500">Q&A sur documents — scope: <code>rag:ask</code></div></div>
          <div><div className="font-mono text-[#27698a] font-medium">POST /api/v1/llm/templates/run</div><div className="text-slate-500">Templates — scope: <code>templates:run</code></div></div>
          <div><div className="font-mono text-[#27698a] font-medium">POST /api/v1/llm/workflows/run</div><div className="text-slate-500">Workflows — scope: <code>workflows:run</code></div></div>
        </div>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <Card className="p-6 max-w-md w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4"><h2 className="text-lg font-bold">Créer une clé API</h2><Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></Button></div>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Nom</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Intégration Slack" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" /></div>
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Scopes</label><div className="space-y-1 max-h-48 overflow-y-auto">{scopes.map(s => <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-slate-50"><input type="checkbox" checked={form.scopes.includes(s.id)} onChange={(e) => { if (e.target.checked) setForm({ ...form, scopes: [...form.scopes, s.id] }); else setForm({ ...form, scopes: form.scopes.filter(x => x !== s.id) }) }} /><code className="font-mono text-[#27698a]">{s.id}</code><span className="text-slate-500">{s.label}</span></label>)}</div></div>
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Limite (req/heure)</label><input type="number" value={form.rateLimitPerHour} onChange={e => setForm({ ...form, rateLimitPerHour: parseInt(e.target.value) || 100 })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm" /></div>
              <div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Annuler</Button><Button className="flex-1 bg-[#27698a] hover:bg-[#1f5670]" onClick={handleCreate} disabled={creating || !form.name}>{creating ? 'Création…' : 'Créer'}</Button></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
