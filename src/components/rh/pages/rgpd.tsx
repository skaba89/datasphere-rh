'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Download, Trash2, FileText, AlertTriangle, Check, Clock, Loader2, Webhook, Plus, Copy, X } from 'lucide-react'
import { toast } from 'sonner'

interface Consent { id: string; consentType: string; granted: boolean; createdAt: string; withdrawnAt: string | null }
interface DataReq { id: string; requestType: string; status: string; createdAt: string; processedAt: string | null }
interface IncomingWH { id: string; name: string; source: string; incomingToken: string; triggerWorkflow: string | null; isActive: boolean; receiveCount: number; lastReceivedAt: string | null }

const CONSENT_TYPES = [{ id: 'COOKIES', label: 'Cookies', desc: 'Session et préférences', required: true }, { id: 'DATA_PROCESSING', label: 'Traitement données', desc: 'Données RH', required: true }, { id: 'MARKETING', label: 'Marketing', desc: 'Communications', required: false }, { id: 'ANALYTICS', label: 'Analytics', desc: 'Suivi anonymisé', required: false }, { id: 'PHOTO', label: 'Photo', desc: 'Badge, annuaire', required: false }, { id: 'BIOMETRIC', label: 'Biométrie', desc: 'Empreinte, facial', required: false }]
const REQUEST_TYPES = [{ id: 'EXPORT', label: 'Export données', icon: Download, desc: 'Télécharger toutes les données' }, { id: 'DELETE', label: 'Droit à l\'oubli', icon: Trash2, desc: 'Suppression complète' }, { id: 'PORTABILITY', label: 'Portabilité', icon: FileText, desc: 'Format JSON portable' }, { id: 'CORRECT', label: 'Rectification', icon: Shield, desc: 'Corriger des données' }, { id: 'RESTRICT', label: 'Restriction', icon: AlertTriangle, desc: 'Limiter le traitement' }, { id: 'OBJECT', label: 'Opposition', icon: Shield, desc: 'S\'opposer au traitement' }]

export function RgpdPage() {
  const [tab, setTab] = useState<'consents' | 'requests' | 'webhooks'>('consents')
  const [consents, setConsents] = useState<Consent[]>([])
  const [requests, setRequests] = useState<DataReq[]>([])
  const [webhooks, setWebhooks] = useState<IncomingWH[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateWh, setShowCreateWh] = useState(false)
  const [whForm, setWhForm] = useState({ name: '', source: 'custom' })
  const [newToken, setNewToken] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const load = () => { setLoading(true); Promise.all([fetch('/api/rgpd/consents').then(r => r.json()).catch(() => ({ consents: [] })), fetch('/api/rgpd/requests').then(r => r.json()).catch(() => ({ requests: [] })), fetch('/api/incoming-webhooks').then(r => r.json()).catch(() => ({ webhooks: [] }))]).then(([c, r, w]) => { setConsents(c.consents || []); setRequests(r.requests || []); setWebhooks(w.webhooks || []) }).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const handleConsent = async (type: string, granted: boolean) => { await fetch('/api/rgpd/consents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ consentType: type, granted }) }); toast.success(`Consentement ${granted ? 'accordé' : 'retiré'}`); load() }
  const handleRequest = async (type: string) => { setProcessing(true); try { const r = await fetch('/api/rgpd/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestType: type }) }); const d = await r.json(); if (d.success) { toast.success(`Requête ${type} traitée`); if (type === 'EXPORT' || type === 'PORTABILITY') window.open('/api/rgpd/export', '_blank'); load() } else toast.error(d.error) } catch { toast.error('Erreur') } finally { setProcessing(false) } }
  const handleCreateWh = async () => { if (!whForm.name) return; const r = await fetch('/api/incoming-webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(whForm) }); const d = await r.json(); if (d.success) { setNewToken(d.token); toast.success('Webhook créé'); setShowCreateWh(false); setWhForm({ name: '', source: 'custom' }); load() } }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Shield className="w-6 h-6 text-[#27698a]" />Conformité RGPD</h1><p className="text-sm text-slate-500 mt-1">Gestion des consentements, droits RGPD et webhooks entrants</p></div>

      <div className="flex gap-2 border-b border-slate-200">
        {([{ key: 'consents', label: 'Consentements', icon: Check }, { key: 'requests', label: 'Requêtes RGPD', icon: FileText }, { key: 'webhooks', label: 'Webhooks entrants', icon: Webhook }] as const).map(t => <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.key ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}><t.icon className="w-4 h-4 inline mr-2" />{t.label}</button>)}
      </div>

      {tab === 'consents' && (
        <div className="space-y-3">
          {CONSENT_TYPES.map(ct => { const latest = consents.find(c => c.consentType === ct.id && c.granted && !c.withdrawnAt); const hasConsent = !!latest; return (
            <Card key={ct.id} className="p-4"><div className="flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-900">{ct.label}</span>{ct.required && <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700">Requis</Badge>}{hasConsent && <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700"><Check className="w-2.5 h-2.5 mr-0.5" />Accordé</Badge>}</div><p className="text-xs text-slate-500 mt-0.5">{ct.desc}</p></div>{!ct.required && <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleConsent(ct.id, !hasConsent)}>{hasConsent ? 'Retirer' : 'Accorder'}</Button>}</div></Card>
          )})}
        </div>
      )}

      {tab === 'requests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {REQUEST_TYPES.map(rt => { const Icon = rt.icon; return (
              <Card key={rt.id} className="p-4"><div className="flex items-start gap-2 mb-3"><div className="w-8 h-8 rounded-lg bg-[#27698a]/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-[#27698a]" /></div><div><h3 className="text-sm font-semibold text-slate-900">{rt.label}</h3><p className="text-[10px] text-slate-500">{rt.desc}</p></div></div><Button size="sm" className="w-full h-7 text-xs bg-[#27698a] hover:bg-[#1f5670]" onClick={() => handleRequest(rt.id)} disabled={processing}>{processing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}Demander</Button></Card>
            )})}
          </div>
          {requests.length > 0 && <Card className="overflow-hidden"><div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h3 className="text-sm font-semibold">Historique ({requests.length})</h3></div><div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">{requests.map(r => <div key={r.id} className="px-4 py-2 flex items-center gap-3"><Badge variant="outline" className={`text-[9px] ${r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.status}</Badge><span className="text-xs font-medium text-slate-900">{r.requestType}</span><span className="text-[10px] text-slate-400 ml-auto">{new Date(r.createdAt).toLocaleString('fr-FR')}</span></div>)}</div></Card>}
        </div>
      )}

      {tab === 'webhooks' && (
        <div className="space-y-4">
          {newToken && <Card className="p-4 border-2 border-emerald-400 bg-emerald-50"><div className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div className="flex-1"><p className="text-sm font-bold text-emerald-900">Webhook créé — copiez l'URL !</p><code className="block mt-1 p-2 rounded bg-white border border-emerald-200 text-xs font-mono text-emerald-900 break-all">POST {typeof window !== 'undefined' ? window.location.origin : ''}/api/incoming-webhooks/{newToken}</code></div><button onClick={() => { navigator.clipboard.writeText(newToken); toast.success('Copié') }}><Copy className="w-4 h-4 text-emerald-600" /></button><button onClick={() => setNewToken(null)}><X className="w-4 h-4 text-slate-400" /></button></div></Card>}
          <div className="flex justify-end"><Button size="sm" className="bg-[#27698a] hover:bg-[#1f5670]" onClick={() => setShowCreateWh(!showCreateWh)}><Plus className="w-4 h-4 mr-1" />Créer un webhook</Button></div>
          {showCreateWh && <Card className="p-4 space-y-3"><input value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} placeholder="Nom (ex: Slack)" className="w-full px-3 py-2 rounded border border-slate-300 text-sm" /><select value={whForm.source} onChange={e => setWhForm({ ...whForm, source: e.target.value })} className="w-full px-3 py-2 rounded border border-slate-300 text-sm"><option value="custom">Custom</option><option value="slack">Slack</option><option value="github">GitHub</option><option value="zapier">Zapier</option></select><Button className="w-full bg-[#27698a] hover:bg-[#1f5670]" onClick={handleCreateWh}>Créer</Button></Card>}
          {webhooks.length === 0 ? <Card className="p-8 text-center text-slate-400"><Webhook className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun webhook entrant</p></Card> : <div className="space-y-2">{webhooks.map(w => <Card key={w.id} className="p-4"><div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold text-slate-900">{w.name}</span><Badge variant="outline" className="text-[9px] bg-[#27698a]/5 text-[#27698a]">{w.source}</Badge></div><code className="text-[10px] font-mono text-slate-500 truncate block">POST /api/incoming-webhooks/{w.incomingToken.slice(0, 20)}…</code><div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400"><span>{w.receiveCount} reçus</span>{w.lastReceivedAt && <span><Clock className="w-2.5 h-2.5 inline mr-0.5" />{new Date(w.lastReceivedAt).toLocaleString('fr-FR')}</span>}</div></Card>)}</div>}
        </div>
      )}

      <Card className="p-4 bg-gradient-to-br from-[#27698a]/5 to-transparent"><div className="flex items-start gap-3"><Shield className="w-5 h-5 text-[#27698a] shrink-0 mt-0.5" /><div className="text-sm text-slate-700"><p className="font-semibold text-slate-900 mb-1">Conformité RGPD & Loi guinéenne</p><p className="text-xs">Gestion des droits RGPD : consentements, export (Article 20), droit à l'oubli (Article 17), rectification (16), restriction (18), opposition (21). Les webhooks entrants permettent de recevoir des notifications externes et déclencher des workflows IA.</p></div></div></Card>
    </div>
  )
}
