'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Settings, Building2, Users, Calculator, Bell, Plus, Trash2, Edit2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Company {
  id: string
  raisonSociale: string
  sigle: string | null
  nif: string | null
  rc: string | null
  cnssNumero: string | null
  adresse: string | null
  ville: string | null
  telephone: string | null
  email: string | null
  devise: string
  _count?: { employees: number }
}

export function SettingsPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editTarget, setEditTarget] = useState<Company | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/companies')
      if (!res.ok) throw new Error('Erreur chargement')
      const data = await res.json()
      setCompanies(data)
    } catch {
      toast.error('Impossible de charger les sociétés')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/companies/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Échec de la suppression')
      } else {
        toast.success(data.message || 'Société supprimée')
        setDeleteTarget(null)
        loadCompanies()
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestion des sociétés et configuration du tenant
        </p>
      </div>

      {/* Sociétés — gestion dynamique */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#27698a]" />
            <h2 className="font-semibold text-slate-900">Sociétés ({companies.length})</h2>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="bg-[#27698a] hover:bg-[#1f5570]">
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle société
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Chargement...
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Aucune société. Cliquez sur « Nouvelle société » pour commencer.
          </div>
        ) : (
          <div className="space-y-2">
            {companies.map(c => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 truncate">{c.raisonSociale}</span>
                    {c.sigle && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {c.sigle}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {c.ville || '—'} · {c._count?.employees || 0} employé(s)
                    {c.nif && ` · NIF: ${c.nif}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditTarget(c)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-[#27698a]"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(c)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
                    title="Supprimer"
                    disabled={companies.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {companies.length <= 1 && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Il doit rester au moins une société. La suppression est désactivée tant qu'il n'y en a qu'une.
            </span>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* CNSS */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-[#478e5e]" />
            <h2 className="font-semibold text-slate-900">Paramètres CNSS</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CNSS salarié" value="5%" />
            <Field label="CNSS employeur" value="17%" />
            <Field label="Plafond CNSS" value="4 640 000 GNF" />
            <Field label="SMIG mensuel" value="580 000 GNF" />
            <Field label="ITS/RTS" value="1,5%" />
            <Field label="Versement forfaitaire" value="4%" />
            <Field label="Taxe apprentissage" value="1%" />
            <Field label="Formation pro" value="3%" />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Date d'effet : 01/01/2024. Toute modification crée une nouvelle version.
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#b94659]" />
            <h2 className="font-semibold text-slate-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            <Toggle label="Email" desc="Notifications par email" enabled />
            <Toggle label="WhatsApp" desc="Notifications WhatsApp Business" enabled />
            <Toggle label="SMS" desc="Notifications SMS via Twilio" disabled />
            <Toggle label="Push mobile" desc="Notifications push (app mobile)" disabled />
          </div>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Supprimer la société
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de supprimer définitivement la société{' '}
              <strong className="text-slate-900">{deleteTarget?.raisonSociale}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
              <p className="font-semibold mb-1">Cette action est irréversible.</p>
              <p>
                Tous les éléments suivants seront <strong>supprimés automatiquement</strong> :
              </p>
              <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-xs">
                <li>{deleteTarget?._count?.employees || 0} employé(s) et leurs contrats</li>
                <li>Tous les documents associés</li>
                <li>Les demandes de congés et notifications</li>
                <li>Les bulletins de paie et données comptables</li>
                <li>Les utilisateurs rattachés à cette société</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Annuler
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      {editTarget && (
        <CompanyFormDialog
          company={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null)
            loadCompanies()
          }}
        />
      )}

      {/* Create dialog */}
      {createOpen && (
        <CompanyFormDialog
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            loadCompanies()
          }}
        />
      )}
    </div>
  )
}

function CompanyFormDialog({
  company,
  onClose,
  onSaved,
}: {
  company?: Company
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    raisonSociale: company?.raisonSociale || '',
    sigle: company?.sigle || '',
    nif: company?.nif || '',
    rc: company?.rc || '',
    cnssNumero: company?.cnssNumero || '',
    adresse: company?.adresse || '',
    ville: company?.ville || '',
    telephone: company?.telephone || '',
    email: company?.email || '',
    devise: company?.devise || 'GNF',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.raisonSociale.trim()) {
      toast.error('La raison sociale est obligatoire')
      return
    }
    setSaving(true)
    try {
      const url = company ? `/api/companies/${company.id}` : '/api/companies'
      const method = company ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Échec de l\'enregistrement')
      } else {
        toast.success(company ? 'Société modifiée' : 'Société créée')
        onSaved()
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#27698a]" />
            {company ? 'Modifier la société' : 'Nouvelle société'}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations légales de la société.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="rs" className="text-xs font-medium">Raison sociale *</Label>
            <Input
              id="rs"
              value={form.raisonSociale}
              onChange={e => setForm({ ...form, raisonSociale: e.target.value })}
              className="mt-1"
              required
              placeholder="Ex: Ma Société SARL"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sigle" className="text-xs font-medium">Sigle</Label>
              <Input
                id="sigle"
                value={form.sigle}
                onChange={e => setForm({ ...form, sigle: e.target.value })}
                className="mt-1"
                placeholder="Ex: MSS"
              />
            </div>
            <div>
              <Label htmlFor="ville" className="text-xs font-medium">Ville</Label>
              <Input
                id="ville"
                value={form.ville}
                onChange={e => setForm({ ...form, ville: e.target.value })}
                className="mt-1"
                placeholder="Conakry"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nif" className="text-xs font-medium">NIF</Label>
              <Input
                id="nif"
                value={form.nif}
                onChange={e => setForm({ ...form, nif: e.target.value })}
                className="mt-1"
                placeholder="NIF-XXX"
              />
            </div>
            <div>
              <Label htmlFor="rc" className="text-xs font-medium">RC</Label>
              <Input
                id="rc"
                value={form.rc}
                onChange={e => setForm({ ...form, rc: e.target.value })}
                className="mt-1"
                placeholder="RC/XXX"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="cnss" className="text-xs font-medium">Numéro CNSS</Label>
            <Input
              id="cnss"
              value={form.cnssNumero}
              onChange={e => setForm({ ...form, cnssNumero: e.target.value })}
              className="mt-1"
              placeholder="CNSS-XXX"
            />
          </div>
          <div>
            <Label htmlFor="adresse" className="text-xs font-medium">Adresse</Label>
            <Input
              id="adresse"
              value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })}
              className="mt-1"
              placeholder="Hamdallaye, Conakry"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tel" className="text-xs font-medium">Téléphone</Label>
              <Input
                id="tel"
                value={form.telephone}
                onChange={e => setForm({ ...form, telephone: e.target.value })}
                className="mt-1"
                placeholder="+224 6XX XXX XXX"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1"
                placeholder="contact@societe.gn"
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#27698a] hover:bg-[#1f5570]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                company ? 'Enregistrer' : 'Créer la société'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-slate-500 font-medium">{label}</Label>
      <div className="mt-1 p-2 rounded border border-slate-200 bg-slate-50 text-sm text-slate-900">
        {value}
      </div>
    </div>
  )
}

function Toggle({ label, desc, enabled, disabled }: { label: string; desc: string; enabled?: boolean; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded border border-slate-200">
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
        enabled && !disabled ? 'bg-[#27698a]' : 'bg-slate-300'
      }`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
          enabled && !disabled ? 'translate-x-5' : ''
        }`}></div>
      </div>
    </div>
  )
}
