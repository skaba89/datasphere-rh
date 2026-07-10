'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Boxes, Link2, Shield, CheckCircle2, ExternalLink, Copy, Fingerprint, Clock, Ban, X, AlertTriangle, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Data { certificates: any[]; stats: any }
interface RevokeResult { success: boolean; revocation: any; message: string }

export function BlockchainPage({ userRole }: { userRole?: string | null }) {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [revokeModal, setRevokeModal] = useState<{ cert: any } | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [revokeResult, setRevokeResult] = useState<RevokeResult | null>(null)
  const [reason, setReason] = useState('')

  // Permissions RBAC
  const canRevoke = !userRole || ['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(userRole)

  useEffect(() => {
    let m = true
    fetch('/api/blockchain').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) })
    return () => { m = false }
  }, [])

  const openRevoke = (cert: any) => {
    setRevokeModal({ cert })
    setRevokeResult(null)
    setReason('')
  }

  const handleRevoke = async () => {
    if (!revokeModal) return
    if (reason.length < 5) {
      toast.error('Veuillez indiquer un motif (min 5 caractères)')
      return
    }
    setRevoking(true)
    try {
      const r = await fetch('/api/blockchain/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: revokeModal.cert.id, reason }),
      })
      const d = await r.json()
      if (d.success) {
        setRevokeResult(d)
        toast.success(d.message)
      } else {
        toast.error(d.error || 'Échec révocation')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setRevoking(false)
    }
  }

  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Boxes className="w-6 h-6 text-[#27698a]" />Certifications blockchain</h1><p className="text-sm text-slate-500 mt-1">Documents certifiés immuablement sur chaîne privée</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={CheckCircle2} label="Certificats" value={data.stats.total} color="#27698a" />
        <KpiCard icon={Shield} label="Vérifiés" value={data.stats.verified} color="#478e5e" />
        <KpiCard icon={Clock} label="En attente" value={data.stats.pending} color="#96783c" />
        <KpiCard icon={Link2} label="Hauteur chaîne" value={data.stats.networkHeight.toLocaleString()} color="#b94659" />
      </div>

      <Card className="p-4 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#27698a]/10 flex items-center justify-center"><Boxes className="w-5 h-5 text-[#27698a]" /></div><div><div className="font-semibold text-slate-900 text-sm">DataSphere Chain</div><div className="text-xs text-slate-500">Réseau blockchain privé · Temps de bloc : {data.stats.avgBlockTime}</div></div></div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">● Network operational</Badge>
        </div>
      </Card>

      <div className="space-y-3">
        {data.certificates.map((cert: any) => (
          <Card key={cert.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#27698a]/10 flex items-center justify-center shrink-0"><Fingerprint className="w-5 h-5 text-[#27698a]" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm">{cert.documentTitle}</h3>
                  <Badge variant="outline" className="text-[10px]">{cert.documentType}</Badge>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Confirmé</Badge>
                  {cert.immutable && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Immutable</Badge>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                  <div><span className="text-slate-400">Tx Hash</span><div className="font-mono text-[#27698a] truncate">{cert.txHash}</div></div>
                  <div><span className="text-slate-400">Bloc</span><div className="font-mono text-slate-700">#{cert.blockNumber.toLocaleString()}</div></div>
                  <div><span className="text-slate-400">Signataire</span><div className="text-slate-700">{cert.signerName} ({cert.signerRole})</div></div>
                  <div><span className="text-slate-400">Date</span><div className="text-slate-700">{formatDate(cert.timestamp)}</div></div>
                </div>
                <div className="mt-2 p-2 rounded bg-slate-50 text-xs"><span className="text-slate-400">Hash document :</span><span className="font-mono text-slate-600 ml-1">{cert.hash.slice(0, 32)}...{cert.hash.slice(-8)}</span></div>
                {cert.employee && <div className="text-xs text-slate-500 mt-1">Employé : {cert.employee}</div>}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(cert.hash); toast.success('Hash copié') }}><Copy className="w-3 h-3 mr-1" />Hash</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#27698a]" onClick={() => window.open(`/api/verify/${cert.qrToken}`, '_blank')}><ExternalLink className="w-3 h-3 mr-1" />Vérifier</Button>
                {canRevoke && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => openRevoke(cert)}><Ban className="w-3 h-3 mr-1" />Révoquer</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {data.certificates.length === 0 && <Card className="p-8 text-center text-slate-400"><Boxes className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun certificat blockchain</p></Card>}
      </div>

      <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-800">
        <Link2 className="w-3.5 h-3.5 inline" /> <strong>Blockchain privée :</strong> Les documents signés électroniquement sont certifiés sur la chaîne DataSphere Chain. Chaque certification est immuable, horodatée et vérifiable publiquement via le hash du document. Gas utilisé moyen : ~21 000 par transaction.
      </div>

      {/* Modal révocation */}
      {revokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !revoking && setRevokeModal(null)}>
          <Card className="p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Ban className="w-5 h-5 text-red-600" />Révoquer le certificat</h2>
                <p className="text-xs text-slate-500 mt-1">{revokeModal.cert.documentTitle}</p>
              </div>
              {!revoking && <Button variant="ghost" size="sm" onClick={() => setRevokeModal(null)}><X className="w-4 h-4" /></Button>}
            </div>

            {!revokeResult ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">La révocation ajoute le certificat au registre des révocations (CRL). Le document ne sera plus considéré comme valide lors d'une vérification, mais reste traçable sur la chaîne.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Certificat ID</span><span className="font-mono text-slate-700">{revokeModal.cert.id}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Bloc</span><span className="font-mono">#{revokeModal.cert.blockNumber.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Signataire</span><span>{revokeModal.cert.signerName}</span></div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 mb-1 block">Motif de révocation <span className="text-red-500">*</span></label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Ex : Document signé par erreur, informations erronées…" className="w-full px-3 py-2 rounded border border-slate-300 text-sm focus:outline-none focus:border-red-500 resize-none" />
                  <p className="text-[10px] text-slate-400 mt-1">{reason.length}/5 caractères minimum</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRevokeModal(null)} disabled={revoking}>Annuler</Button>
                  <Button variant="destructive" className="flex-1" onClick={handleRevoke} disabled={revoking || reason.length < 5}>
                    {revoking ? <><Ban className="w-3 h-3 mr-1.5 animate-pulse" />Révocation…</> : 'Confirmer la révocation'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2"><Ban className="w-5 h-5 text-red-600" /><span className="font-semibold text-red-900 text-sm">Certificat révoqué sur la chaîne</span></div>
                  <div className="text-xs text-red-800 space-y-1">
                    <div className="flex justify-between"><span>Tx hash révocation</span><span className="font-mono text-[10px]">{revokeResult.revocation.txHash.slice(0, 16)}…</span></div>
                    <div className="flex justify-between"><span>Bloc</span><span className="font-mono">#{revokeResult.revocation.blockNumber.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Date</span><span>{formatDate(revokeResult.revocation.timestamp)}</span></div>
                    <div className="flex justify-between"><span>Motif</span><span className="italic">{revokeResult.revocation.reason}</span></div>
                    <div className="flex justify-between"><span>Registre CRL</span><span className="font-mono text-[10px]">{revokeResult.revocation.registryEntry}</span></div>
                  </div>
                </div>
                <Button className="w-full bg-[#27698a] hover:bg-[#1f5670]" onClick={() => setRevokeModal(null)}>Fermer</Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-lg lg:text-xl font-bold text-slate-900 truncate">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}
