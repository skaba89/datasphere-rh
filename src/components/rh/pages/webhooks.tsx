'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Webhook, Key, Code2, Copy, Plus, Check, X, Zap, Activity, ShieldAlert, Play, Trash2, Power, History, ChevronDown, ChevronUp, AlertTriangle, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface Data { webhooks: any[]; apiKeys: any[]; events: any[]; endpoints: any[] }
interface AdvWebhook {
  id: string; name: string; url: string; events: string[];
  isActive: boolean; secret: string | null; lastTriggered: string | null; createdAt: string;
}
interface Delivery {
  id: string; webhookId: string; webhookName: string; event: string;
  payload: any; httpStatus: number | null; ok: boolean;
  errorMsg: string | null; durationMs: number; deliveredAt: string;
}
interface DeliveryStats { total: number; success: number; failed: number; avgDurationMs: number; last24h: number }

const METHOD_COLORS: Record<string, string> = { GET: 'bg-emerald-100 text-emerald-700', POST: 'bg-sky-100 text-sky-700', PATCH: 'bg-amber-100 text-amber-700', DELETE: 'bg-red-100 text-red-700' }

const AVAILABLE_EVENTS = [
  { event: 'contract.renewed', desc: 'Contrat fournisseur renouvelé' },
  { event: 'contract.expiring', desc: 'Contrat expirant bientôt (cron)' },
  { event: 'certificate.revoked', desc: 'Certificat blockchain révoqué' },
  { event: 'model.trained', desc: 'Modèle IA ré-entraîné' },
  { event: 'webhook.test', desc: 'Test manuel depuis l\'interface' },
  { event: '*', desc: 'Tous les événements (joker)' },
]

export function WebhooksPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'webhooks' | 'advanced' | 'apikeys' | 'docs'>('webhooks')

  // Advanced webhooks state
  const [advWebhooks, setAdvWebhooks] = useState<AdvWebhook[]>([])
  const [advLoading, setAdvLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', secret: '', events: ['contract.renewed'] })
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, any> | null>(null)

  // History state
  const [historyWebhook, setHistoryWebhook] = useState<AdvWebhook | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedPayload, setExpandedPayload] = useState<string | null>(null)

  useEffect(() => { let m = true; fetch('/api/webhooks').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])

  const loadAdv = () => {
    setAdvLoading(true)
    fetch('/api/webhooks').then(r => r.json()).then(d => {
      // Selon le endpoint appelé, on peut recevoir l'ancien ou nouveau format
      const wh = Array.isArray(d.webhooks) ? d.webhooks.filter((w: any) => w.events && Array.isArray(w.events)) : []
      setAdvWebhooks(wh as AdvWebhook[])
      setAdvLoading(false)
    }).catch(() => setAdvLoading(false))
  }

  useEffect(() => { if (tab === 'advanced') loadAdv() }, [tab])

  const handleCreate = async () => {
    if (!form.name || !form.url || form.events.length === 0) {
      toast.error('Nom, URL et au moins 1 événement requis')
      return
    }
    try {
      const r = await fetch('/api/webhooks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (d.success) {
        toast.success('Webhook créé')
        setShowCreate(false)
        setForm({ name: '', url: '', secret: '', events: ['contract.renewed'] })
        loadAdv()
      } else toast.error(d.error || 'Échec')
    } catch { toast.error('Erreur réseau') }
  }

  const handleTest = async (id: string) => {
    setTestingId(id); setTestResult(null)
    try {
      const r = await fetch('/api/webhooks/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: id }),
      })
      const d = await r.json()
      setTestResult({ [id]: d })
      if (d.success) toast.success(`Webhook testé (${d.durationMs}ms, HTTP ${d.status})`)
      else toast.error(`Échec test : ${d.errorMsg || 'HTTP ' + d.status}`)
    } catch { toast.error('Erreur réseau') }
    finally { setTestingId(null) }
  }

  const handleToggle = async (wh: AdvWebhook) => {
    try {
      await fetch('/api/webhooks', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wh.id, isActive: !wh.isActive }),
      })
      toast.success(`Webhook ${!wh.isActive ? 'activé' : 'désactivé'}`)
      loadAdv()
    } catch { toast.error('Erreur') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce webhook ?')) return
    try {
      await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' })
      toast.success('Webhook supprimé')
      loadAdv()
    } catch { toast.error('Erreur') }
  }

  const openHistory = async (wh: AdvWebhook) => {
    setHistoryWebhook(wh)
    setHistoryLoading(true)
    setExpandedPayload(null)
    try {
      const r = await fetch(`/api/webhooks/${wh.id}/deliveries?limit=100`)
      const d = await r.json()
      setDeliveries(d.deliveries || [])
      setDeliveryStats(d.stats || null)
    } catch { toast.error('Erreur') }
    finally { setHistoryLoading(false) }
  }

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Zap className="w-6 h-6 text-[#27698a]" />API publique &amp; Webhooks</h1><p className="text-sm text-slate-500 mt-1">Intégrations, clés API, webhooks et documentation</p></div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {([{ key: 'webhooks', label: 'Webhooks (mock)', icon: Webhook }, { key: 'advanced', label: 'Webhooks avancés', icon: ShieldAlert }, { key: 'apikeys', label: 'Clés API', icon: Key }, { key: 'docs', label: 'Documentation', icon: Code2 }] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}><t.icon className="w-4 h-4 inline mr-2" />{t.label}</button>
        ))}
      </div>

      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => toast.info('Configuration webhook...')}><Plus className="w-4 h-4 mr-2" />Nouveau webhook</Button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.webhooks.map((wh: any) => (
              <Card key={wh.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#27698a]/10 flex items-center justify-center"><Webhook className="w-4 h-4 text-[#27698a]" /></div><span className="font-medium text-sm text-slate-900">{wh.name}</span></div>
                  <Badge variant="outline" className={wh.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>{wh.status === 'ACTIVE' ? '● Actif' : '○ Inactif'}</Badge>
                </div>
                <div className="text-xs text-slate-500 font-mono truncate bg-slate-50 p-2 rounded mb-2">{wh.url}</div>
                <div className="flex flex-wrap gap-1 mb-2">{wh.events.map((e: string, i: number) => <Badge key={i} variant="outline" className="text-[9px] bg-slate-50">{e}</Badge>)}</div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Dernier déclenchement : {wh.lastFired ? new Date(wh.lastFired).toLocaleString('fr-FR') : 'Jamais'}</span>
                  <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{wh.successRate}% succès</span>
                </div>
              </Card>
            ))}
          </div>
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Événements disponibles</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {data.events.map((e: any, i: number) => (
                <div key={i} className="p-2 rounded border border-slate-200 text-xs"><div className="font-mono text-[#27698a] font-medium">{e.event}</div><div className="text-slate-500">{e.desc}</div><div className="text-slate-400 mt-1">{e.count} occurrences</div></div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'advanced' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />Nouveau webhook avancé
            </Button>
          </div>

          {/* Liste des webhooks avancés */}
          {advLoading ? (
            <Card className="p-8 text-center text-slate-400 text-sm">Chargement…</Card>
          ) : advWebhooks.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Aucun webhook avancé configuré</p>
              <p className="text-xs mt-1">Les webhooks avancés permettent de capter des événements temps réel (renouvellement, révocation, entraînement IA, alertes cron) et de les pousser vers vos intégrations Slack/Teams/Make.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {advWebhooks.map((wh) => (
                <Card key={wh.id} className={`p-4 ${wh.isActive ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${wh.isActive ? 'bg-[#27698a]/10' : 'bg-slate-100'}`}>
                        <Webhook className={`w-4 h-4 ${wh.isActive ? 'text-[#27698a]' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-900">{wh.name}</div>
                        <div className="text-[10px] text-slate-400">Créé le {new Date(wh.createdAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={wh.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>
                      {wh.isActive ? '● Actif' : '○ Inactif'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-500 font-mono truncate bg-slate-50 p-2 rounded mb-2">{wh.url}</div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {wh.events.map((e, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] bg-slate-50">{e}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>Dernier déclenchement : {wh.lastTriggered ? new Date(wh.lastTriggered).toLocaleString('fr-FR') : 'Jamais'}</span>
                    {wh.secret && <span className="flex items-center gap-1 text-amber-600"><Key className="w-3 h-3" />Secret</span>}
                  </div>

                  {testResult?.[wh.id] && (
                    <div className={`p-2 rounded text-xs mb-2 ${testResult[wh.id].success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      <span className="inline-flex items-center gap-1">{testResult[wh.id].success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} HTTP {testResult[wh.id].status || 'N/A'} · {testResult[wh.id].durationMs}ms</span>
                      {testResult[wh.id].errorMsg && ` · ${testResult[wh.id].errorMsg}`}
                    </div>
                  )}

                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => handleTest(wh.id)} disabled={testingId === wh.id}>
                      <Play className="w-3 h-3 mr-1" />{testingId === wh.id ? 'Test…' : 'Tester'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openHistory(wh)} title="Historique des livraisons">
                      <History className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleToggle(wh)} title={wh.isActive ? 'Désactiver' : 'Activer'}>
                      <Power className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(wh.id)} title="Supprimer">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Liste des événements disponibles */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-2">Événements disponibles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {AVAILABLE_EVENTS.map((e, i) => (
                <div key={i} className="p-2 rounded border border-slate-200 text-xs">
                  <div className="font-mono text-[#27698a] font-medium">{e.event}</div>
                  <div className="text-slate-500">{e.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Modal création */}
          {showCreate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
              <Card className="p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Nouveau webhook</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Nom</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Slack RH" className="w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#27698a]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">URL</label>
                    <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" className="w-full px-3 py-2 rounded border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#27698a]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Secret (optionnel)</label>
                    <input value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} placeholder="votre-secret" className="w-full px-3 py-2 rounded border border-slate-300 text-sm font-mono focus:outline-none focus:border-[#27698a]" />
                    <p className="text-[10px] text-slate-400 mt-1">Sera envoyé dans le header <code>X-Webhook-Secret</code></p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 mb-1 block">Événements à écouter</label>
                    <div className="space-y-1">
                      {AVAILABLE_EVENTS.map(e => (
                        <label key={e.event} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-slate-50">
                          <input type="checkbox" checked={form.events.includes(e.event)} onChange={(ev) => {
                            if (ev.target.checked) setForm({ ...form, events: [...form.events, e.event] })
                            else setForm({ ...form, events: form.events.filter(x => x !== e.event) })
                          }} className="rounded" />
                          <span className="font-mono text-[#27698a]">{e.event}</span>
                          <span className="text-slate-500">— {e.desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Annuler</Button>
                    <Button className="flex-1 bg-[#27698a] hover:bg-[#1f5570]" onClick={handleCreate}>Créer</Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Modal historique des livraisons */}
          {historyWebhook && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setHistoryWebhook(null)}>
              <Card className="p-0 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><History className="w-5 h-5 text-[#27698a]" />Historique des livraisons</h2>
                    <p className="text-xs text-slate-500 mt-1">{historyWebhook.name} · {historyWebhook.url}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setHistoryWebhook(null)}><X className="w-4 h-4" /></Button>
                </div>

                {/* Stats */}
                {deliveryStats && (
                  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div><div className="text-slate-500">Total</div><div className="font-bold text-slate-900 text-base">{deliveryStats.total}</div></div>
                    <div><div className="text-slate-500">Succès</div><div className="font-bold text-emerald-600 text-base">{deliveryStats.success}</div></div>
                    <div><div className="text-slate-500">Échecs</div><div className="font-bold text-red-600 text-base">{deliveryStats.failed}</div></div>
                    <div><div className="text-slate-500">Durée moy.</div><div className="font-bold text-slate-900 text-base">{deliveryStats.avgDurationMs}ms</div></div>
                    <div><div className="text-slate-500">24h</div><div className="font-bold text-[#27698a] text-base">{deliveryStats.last24h}</div></div>
                  </div>
                )}

                {/* Liste */}
                <div className="flex-1 overflow-y-auto">
                  {historyLoading ? (
                    <div className="p-8 text-center text-slate-400 text-sm">Chargement…</div>
                  ) : deliveries.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm">Aucune livraison enregistrée</p>
                      <p className="text-xs mt-1">Déclenchez une action (test, renouvellement, révocation) pour peupler l'historique.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {deliveries.map((d) => (
                        <div key={d.id} className="px-5 py-3 hover:bg-slate-50">
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${d.ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {d.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[9px] font-mono bg-slate-50">{d.event}</Badge>
                                <span className={`text-xs font-mono font-bold ${d.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {d.httpStatus ? `HTTP ${d.httpStatus}` : 'ERREUR'}
                                </span>
                                <span className="text-[10px] text-slate-400">{d.durationMs}ms</span>
                                <span className="text-[10px] text-slate-400 ml-auto">{new Date(d.deliveredAt).toLocaleString('fr-FR')}</span>
                              </div>
                              {d.errorMsg && <div className="text-[11px] text-red-600 mt-1 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {d.errorMsg}</div>}
                              <button
                                onClick={() => setExpandedPayload(expandedPayload === d.id ? null : d.id)}
                                className="text-[10px] text-[#27698a] hover:underline mt-1 flex items-center gap-0.5"
                              >
                                {expandedPayload === d.id ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                {expandedPayload === d.id ? 'Masquer' : 'Voir'} payload
                              </button>
                              {expandedPayload === d.id && (
                                <pre className="mt-2 p-2 rounded bg-slate-900 text-slate-100 text-[10px] font-mono overflow-x-auto">
                                  {JSON.stringify(d.payload, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openHistory(historyWebhook)} disabled={historyLoading}>
                    <History className="w-3.5 h-3.5 mr-1.5" />Actualiser
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setHistoryWebhook(null)}>Fermer</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {tab === 'apikeys' && (
        <div className="space-y-4">
          <div className="flex justify-end"><Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => toast.info('Génération clé API...')}><Plus className="w-4 h-4 mr-2" />Générer clé</Button></div>
          {data.apiKeys.map((ak: any) => (
            <Card key={ak.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Key className="w-4 h-4 text-amber-700" /></div><div><span className="font-medium text-sm text-slate-900">{ak.name}</span><div className="text-xs text-slate-400">Créée le {ak.created} · Dernière utilisation : {ak.lastUsed}</div></div></div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{ak.requests} requêtes</Badge>
              </div>
              <div className="flex items-center gap-2"><code className="flex-1 text-xs font-mono bg-slate-50 p-2 rounded truncate">{ak.key}</code><Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(ak.key); toast.success('Clé copiée') }}><Copy className="w-3.5 h-3.5" /></Button></div>
              <div className="flex flex-wrap gap-1 mt-2">{ak.scopes.map((s: string, i: number) => <Badge key={i} variant="outline" className="text-[9px] bg-[#27698a]/5 text-[#27698a]">{s}</Badge>)}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'docs' && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Code2 className="w-4 h-4 text-[#27698a]" />Endpoints API REST</h2>
            <div className="space-y-1">
              {data.endpoints.map((ep: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 border border-slate-100">
                  <Badge className={`text-[10px] font-mono ${METHOD_COLORS[ep.method] || 'bg-slate-100'}`}>{ep.method}</Badge>
                  <code className="text-xs font-mono text-slate-700 flex-1">{ep.path}</code>
                  <span className="text-xs text-slate-500">{ep.desc}</span>
                  {ep.auth ? <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 inline-flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> Auth</Badge> : <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700">Public</Badge>}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Authentification</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
              <div className="text-slate-400"># Header d'authentification</div>
              <div>Authorization: Bearer dsrh_live_mx8f2k9...d4e</div>
              <div className="mt-2 text-slate-400"># Exemple de requête</div>
              <div>curl -X GET \</div>
              <div className="ml-4">https://api.datasphererh.gn/api/v1/employees \</div>
              <div className="ml-4">-H "Authorization: Bearer YOUR_API_KEY"</div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Rate limiting</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded border border-slate-200"><div className="text-slate-500 text-xs">Par utilisateur</div><div className="font-bold text-slate-900">100 req/min</div></div>
              <div className="p-3 rounded border border-slate-200"><div className="text-slate-500 text-xs">Par tenant</div><div className="font-bold text-slate-900">1000 req/min</div></div>
              <div className="p-3 rounded border border-slate-200"><div className="text-slate-500 text-xs">Burst max</div><div className="font-bold text-slate-900">50 req/sec</div></div>
              <div className="p-3 rounded border border-slate-200"><div className="text-slate-500 text-xs">Quota quotidien</div><div className="font-bold text-slate-900">10 000 req</div></div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
