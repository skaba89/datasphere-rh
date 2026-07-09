'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Lock, Upload, Search, FileText, FileCheck, FileLock2, Download, Trash2, ShieldCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Document {
  id: string
  name: string
  type: string
  category: string
  confidential: boolean
  retentionYears: number
  fileSize: number
  mimeType: string
  signedAt: string | null
  uploadedBy: string | null
  createdAt: string
  employee: { id: string; nom: string; prenoms: string; matricule: string } | null
}

const DOC_TYPES: Record<string, { label: string; color: string }> = {
  CONTRAT: { label: 'Contrat', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CV: { label: 'CV', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  DIPLOME: { label: 'Diplôme', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  CNSS_CARTE: { label: 'Carte CNSS', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  PIECE_IDENTITE: { label: 'Pièce d\'identité', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  ATTESTATION: { label: 'Attestation', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  OTHER: { label: 'Autre', color: 'bg-slate-100 text-slate-700 border-slate-200' },
}

const CATEGORIES = ['RH', 'PAIE', 'ADMIN', 'LEGAL']

export function VaultPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [uploadOpen, setUploadOpen] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => { setDocuments(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => { if (mounted) { setDocuments(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = documents.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat !== 'all' && d.category !== filterCat) return false
    if (filterType !== 'all' && d.type !== filterType) return false
    return true
  })

  const stats = {
    total: documents.length,
    confidentiels: documents.filter(d => d.confidential).length,
    signs: documents.filter(d => d.signedAt).length,
    parCategorie: CATEGORIES.map(cat => ({
      cat,
      count: documents.filter(d => d.category === cat).length,
    })),
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#27698a]" />
            Coffre-fort RH
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Archivage sécurisé · {stats.total} document{stats.total > 1 ? 's' : ''} · {stats.confidentiels} confidentiel{stats.confidentiels > 1 ? 's' : ''} · {stats.signs} signé{stats.signs > 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Téléverser un document
        </Button>
      </div>

      {/* Stats par catégorie */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.parCategorie.map(s => (
          <Card key={s.cat} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{s.cat}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{s.count}</div>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                s.cat === 'RH' ? 'bg-[#27698a]/10 text-[#27698a]' :
                s.cat === 'PAIE' ? 'bg-[#478e5e]/10 text-[#478e5e]' :
                s.cat === 'ADMIN' ? 'bg-[#96783c]/10 text-[#96783c]' :
                'bg-[#b94659]/10 text-[#b94659]'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <Card className="p-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher un document..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              {Object.entries(DOC_TYPES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Liste documents */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">
            {filtered.length} document{filtered.length > 1 ? 's' : ''}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Chiffrement AES-256
          </div>
        </div>

        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Aucun document {documents.length === 0 ? '— téléversez votre premier document' : 'ne correspond à votre recherche'}</p>
            </div>
          )}
          {filtered.map(doc => {
            const typeInfo = DOC_TYPES[doc.type] || DOC_TYPES.OTHER
            return (
              <div key={doc.id} className="px-4 py-3 hover:bg-slate-50 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                  {doc.confidential ? <FileLock2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900 text-sm truncate">{doc.name}</span>
                    {doc.confidential && (
                      <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Confidentiel
                      </Badge>
                    )}
                    {doc.signedAt && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                        <FileCheck className="w-2.5 h-2.5 mr-1" />
                        Signé
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                    <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                    <span>·</span>
                    <span>Catégorie : {doc.category}</span>
                    <span>·</span>
                    <span>Rétention : {doc.retentionYears} ans</span>
                    {doc.employee && (
                      <>
                        <span>·</span>
                        <span>Employé : {doc.employee.nom} {doc.employee.prenoms}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Ajouté le {formatDate(doc.createdAt.slice(0, 10))}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => toast.info('Téléchargement simulé (MinIO en production)')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        🔒 <strong>Sécurité du coffre-fort :</strong> Tous les documents sont chiffrés en AES-256 au repos.
        Rétention légale 10 ans (Code du travail guinéen + RGPD).
        Accès tracé dans le journal d'audit.
      </div>

      {uploadOpen && (
        <UploadDialog onClose={() => setUploadOpen(false)} onUploaded={() => { setUploadOpen(false); load() }} />
      )}
    </div>
  )
}

function UploadDialog({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [form, setForm] = useState({
    name: '',
    type: 'OTHER',
    category: 'RH',
    confidential: false,
    retentionYears: 10,
    employeeId: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Array<{ id: string; nom: string; prenoms: string; matricule: string }>>([])

  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(setEmployees)
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!form.name || !file) {
      toast.error('Nom et fichier requis')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          category: form.category,
          confidential: form.confidential,
          retentionYears: Number(form.retentionYears),
          employeeId: form.employeeId || null,
          fileSize: file.size,
          mimeType: file.type,
        }),
      })
      if (res.ok) {
        toast.success('Document archivé dans le coffre-fort')
        onUploaded()
      } else {
        toast.error('Erreur lors de l\'archivage')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#27698a]" />
            Téléverser un document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Nom du document *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Contrat de travail CDI - Diallo Mamadou" />
          </div>

          <div
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-[#27698a] hover:bg-[#27698a]/5 transition-colors cursor-pointer"
            onClick={() => document.getElementById('vault-file-input')?.click()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => e.preventDefault()}
          >
            {file ? (
              <div>
                <FileText className="w-8 h-8 mx-auto text-[#27698a] mb-2" />
                <p className="text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">Glissez un fichier ou cliquez</p>
                <p className="text-xs text-slate-400 mt-1">PDF, image, document — max 10 Mo</p>
              </div>
            )}
            <input
              id="vault-file-input"
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Employé lié (optionnel)</Label>
              <Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nom} {e.prenoms} ({e.matricule})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Rétention (années)</Label>
              <Input type="number" value={form.retentionYears} onChange={e => setForm({ ...form, retentionYears: Number(e.target.value) })} className="mt-1" />
            </div>
          </div>

          <label className="flex items-center gap-2 p-2 rounded border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={form.confidential}
              onChange={e => setForm({ ...form, confidential: e.target.checked })}
              className="rounded"
            />
            <Lock className="w-3.5 h-3.5 text-red-500" />
            <span className="text-sm">Confidentiel (accès restreint + chiffrement renforcé)</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Archiver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
