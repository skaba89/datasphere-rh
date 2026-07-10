'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PenTool, QrCode, Shield, CheckCircle2, FileCheck, Loader2, ExternalLink, Search, Copy, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Signature {
  id: string
  signerName: string
  signerRole: string
  documentType: string
  documentTitle: string
  documentHash: string
  qrToken: string
  signedAt: string
  employee: { nom: string; prenoms: string; matricule: string } | null
}

const DOC_TYPES: Record<string, { label: string; color: string }> = {
  CONTRAT: { label: 'Contrat', color: 'bg-emerald-100 text-emerald-700' },
  BULLETIN: { label: 'Bulletin', color: 'bg-sky-100 text-sky-700' },
  ATTESTATION: { label: 'Attestation', color: 'bg-violet-100 text-violet-700' },
  LETTRE: { label: 'Lettre', color: 'bg-amber-100 text-amber-700' },
  OTHER: { label: 'Autre', color: 'bg-slate-100 text-slate-700' },
}

const ROLE_META: Record<string, string> = {
  EMPLOYE: 'Employé',
  RH: 'Ressources Humaines',
  MANAGER: 'Manager',
  ADMIN: 'Administrateur',
  WITNESS: 'Témoin',
}

export function SignaturePage() {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [lastSignature, setLastSignature] = useState<Signature | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/signatures')
      .then(r => r.json())
      .then(d => { setSignatures(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/signatures')
      .then(r => r.json())
      .then(d => { if (mounted) { setSignatures(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <PenTool className="w-6 h-6 text-[#27698a]" />
            Signature électronique
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Signatures horodatées · Hash SHA-256 · QR code de vérification publique
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setVerifyOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            Vérifier une signature
          </Button>
          <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
            <PenTool className="w-4 h-4 mr-2" />
            Signer un document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={FileCheck} label="Total signatures" value={signatures.length} color="#27698a" />
        <KpiCard icon={Shield} label="Vérifiables" value={signatures.length} color="#478e5e" sub="via QR code" />
        <KpiCard icon={CheckCircle2} label="Valides" value={signatures.length} color="#96783c" sub="toutes valides" />
        <KpiCard icon={PenTool} label="Aujourd'hui" value={signatures.filter(s => new Date(s.signedAt).toDateString() === new Date().toDateString()).length} color="#b94659" />
      </div>

      {/* Liste signatures */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">
            Signatures électroniques ({signatures.length})
          </h2>
          <Badge variant="outline" className="bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20">
            <Shield className="w-3 h-3 mr-1" />
            SHA-256 + QR
          </Badge>
        </div>
        <div className="divide-y divide-slate-100">
          {signatures.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-400">
              <PenTool className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Aucune signature électronique</p>
              <p className="text-xs mt-1">Signez votre premier document pour générer un QR code de vérification</p>
            </div>
          )}
          {signatures.map(sig => {
            const docType = DOC_TYPES[sig.documentType] || DOC_TYPES.OTHER
            return (
              <div key={sig.id} className="px-4 py-3 hover:bg-slate-50 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${docType.color}`}>
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className={docType.color}>{docType.label}</Badge>
                    <span className="text-sm font-medium text-slate-900">{sig.documentTitle}</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <div>Signé par : <span className="font-medium text-slate-900">{sig.signerName}</span> ({ROLE_META[sig.signerRole] || sig.signerRole})</div>
                    {sig.employee && (
                      <div>Employé lié : {sig.employee.nom} {sig.employee.prenoms} · {sig.employee.matricule}</div>
                    )}
                    <div className="font-mono text-[10px] text-slate-400">Hash : {sig.documentHash.slice(0, 24)}...{sig.documentHash.slice(-8)}</div>
                    <div>Date : {new Date(sig.signedAt).toLocaleString('fr-FR')}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => window.open(`/api/verify/${sig.qrToken}`, '_blank')}
                  >
                    <QrCode className="w-3 h-3 mr-1" />
                    Vérifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(sig.qrToken)
                      toast.success('Token copié')
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Token
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Info sécurité */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-[#478e5e]" />
          <h2 className="font-semibold text-slate-900">Sécurité &amp; conformité</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-slate-900">Hash SHA-256</div>
                <div className="text-xs text-slate-500">Empreinte cryptographique unique du document signé</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-slate-900">Horodatage UTC</div>
                <div className="text-xs text-slate-500">Date et heure précise de signature, traçable</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-slate-900">QR code de vérification</div>
                <div className="text-xs text-slate-500">Endpoint public /api/verify/[token] pour contrôle tiers</div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-slate-900">Audit trail</div>
                <div className="text-xs text-slate-500">Chaque signature journalisée dans l'audit log</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-slate-900">Métadonnées signataire</div>
                <div className="text-xs text-slate-500">Nom, rôle, IP, user-agent pour preuve d'identité</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-slate-900">Conformité</div>
                <div className="text-xs text-slate-500">Compatible exigences CNSS Guinée et RGPD</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {wizardOpen && (
        <SignatureWizard
          onClose={() => setWizardOpen(false)}
          onSigned={(sig) => { setWizardOpen(false); setLastSignature(sig); load() }}
        />
      )}

      {verifyOpen && (
        <VerifyDialog onClose={() => setVerifyOpen(false)} />
      )}

      {lastSignature && (
        <Dialog open onOpenChange={(v) => !v && setLastSignature(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                Document signé avec succès !
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <QrCode className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-sm text-slate-700">Document : <strong>{lastSignature.documentTitle}</strong></p>
                <p className="text-xs text-slate-500 mt-1">Signé par {lastSignature.signerName}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Token de vérification :</div>
                <div className="font-mono text-xs text-[#27698a] break-all">{lastSignature.qrToken}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Hash SHA-256 :</div>
                <div className="font-mono text-[10px] text-slate-700 break-all">{lastSignature.documentHash.slice(0, 48)}...</div>
              </div>
              <Button
                className="w-full bg-[#27698a] hover:bg-[#1f5570]"
                onClick={() => window.open(`/api/verify/${lastSignature.qrToken}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Vérifier publiquement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: number; color: string; sub?: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
          {sub && <div className="text-[10px] text-slate-400">{sub}</div>}
        </div>
      </div>
    </Card>
  )
}

function SignatureWizard({ onClose, onSigned }: { onClose: () => void; onSigned: (sig: Signature) => void }) {
  const [employees, setEmployees] = useState<any[]>([])
  const [form, setForm] = useState({
    employeeId: '',
    signerName: 'Admin Demo',
    signerRole: 'ADMIN',
    documentType: 'CONTRAT',
    documentTitle: '',
    documentContent: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.signerName || !form.documentTitle) { toast.error('Nom signataire et titre requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Signature électronique créée')
        onSigned(data.signature)
      } else {
        toast.error('Erreur')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-[#27698a]" />
            Signer un document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Signataire *</Label>
              <Input value={form.signerName} onChange={e => setForm({ ...form, signerName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Rôle</Label>
              <Select value={form.signerRole} onValueChange={v => setForm({ ...form, signerRole: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Employé lié (optionnel)</Label>
            <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Aucun" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} — {e.poste}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Type document</Label>
              <Select value={form.documentType} onValueChange={v => setForm({ ...form, documentType: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Titre document *</Label>
              <Input value={form.documentTitle} onChange={e => setForm({ ...form, documentTitle: e.target.value })} className="mt-1" placeholder="Contrat CDI - Diallo Mamadou" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Contenu du document (sera hashé)</Label>
            <Textarea
              value={form.documentContent}
              onChange={e => setForm({ ...form, documentContent: e.target.value })}
              className="mt-1 font-mono text-xs"
              rows={6}
              placeholder="Collez ici le contenu du document à signer. Le hash SHA-256 sera calculé sur ce contenu."
            />
            <div className="text-xs text-slate-400 mt-1">{form.documentContent.length} caractères</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenTool className="w-4 h-4 mr-2" />}
            Signer électroniquement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function VerifyDialog({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (!token) { toast.error('Token requis'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/verify/${token}`)
      const data = await res.json()
      setResult(data)
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#27698a]" />
            Vérifier une signature
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Token QR code</Label>
            <Input
              value={token}
              onChange={e => setToken(e.target.value)}
              className="mt-1 font-mono text-xs"
              placeholder="Collez le token de vérification..."
            />
          </div>
          <Button onClick={handleVerify} disabled={loading} className="w-full bg-[#27698a] hover:bg-[#1f5570]">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Vérifier
          </Button>

          {result && (
            <div className={`p-4 rounded-lg border ${result.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {result.valid ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    Signature valide
                  </div>
                  <div className="text-sm space-y-1">
                    <div><span className="text-slate-500">Document :</span> <strong>{result.signature.documentTitle}</strong></div>
                    <div><span className="text-slate-500">Type :</span> {result.signature.documentType}</div>
                    <div><span className="text-slate-500">Signataire :</span> {result.signature.signerName} ({result.signature.signerRole})</div>
                    <div><span className="text-slate-500">Date :</span> {new Date(result.signature.signedAt).toLocaleString('fr-FR')}</div>
                    <div><span className="text-slate-500">Hash :</span> <span className="font-mono text-xs">{result.signature.hashPreview}</span></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700 font-medium">
                  <X className="w-5 h-5" />
                  {result.error || 'Signature invalide'}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

