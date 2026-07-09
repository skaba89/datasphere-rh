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
import { Briefcase, MapPin, DollarSign, Plus, Loader2, Calendar, Building2, Users, Eye, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF, formatDate, CONTRACT_TYPES } from '@/lib/utils-rh'

interface JobOffer {
  id: string
  title: string
  description: string | null
  department: string | null
  location: string | null
  contractType: string
  salaryMin: number | null
  salaryMax: number | null
  requirements: string | null
  benefits: string | null
  status: string
  publishedAt: string | null
  closingDate: string | null
  createdAt: string
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock },
  PUBLIEE: { label: 'Publiée', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Eye },
  FERMEE: { label: 'Fermée', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: XCircle },
  POURVUE: { label: 'Pourvue', color: 'bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20', icon: CheckCircle2 },
}

export function JobOffersPage() {
  const [offers, setOffers] = useState<JobOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/job-offers')
      .then(r => r.json())
      .then(d => { setOffers(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/job-offers')
      .then(r => r.json())
      .then(d => { if (mounted) { setOffers(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = filterStatus === 'all' ? offers : offers.filter(o => o.status === filterStatus)

  const stats = {
    total: offers.length,
    publiees: offers.filter(o => o.status === 'PUBLIEE').length,
    pourvues: offers.filter(o => o.status === 'POURVUE').length,
    brouillons: offers.filter(o => o.status === 'BROUILLON').length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-[#27698a]" />
            Offres d'emploi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publication et gestion des offres d'emploi · {stats.publiees} actives
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle offre
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Briefcase} label="Total offres" value={stats.total} color="#27698a" />
        <KpiCard icon={Eye} label="Publiées" value={stats.publiees} color="#478e5e" />
        <KpiCard icon={CheckCircle2} label="Pourvues" value={stats.pourvues} color="#96783c" />
        <KpiCard icon={Clock} label="Brouillons" value={stats.brouillons} color="#b94659" />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'PUBLIEE', 'BROUILLON', 'POURVUE', 'FERMEE'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === f ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'Toutes' : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Liste offres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {filtered.map(offer => {
          const status = STATUS_META[offer.status] || STATUS_META.BROUILLON
          const contractInfo = CONTRACT_TYPES[offer.contractType] || CONTRACT_TYPES.CDI
          const StatusIcon = status.icon
          return (
            <Card
              key={offer.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => setSelectedOffer(offer)}
            >
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className={contractInfo.color}>{contractInfo.label}</Badge>
                <Badge variant="outline" className={status.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <h3 className="font-semibold text-slate-900 text-sm mb-1 line-clamp-2">{offer.title}</h3>
              {offer.description && <p className="text-xs text-slate-600 mb-2 line-clamp-2">{offer.description}</p>}

              <div className="space-y-1 text-xs text-slate-600 mt-2 flex-1">
                {offer.department && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />
                    {offer.department}
                  </div>
                )}
                {offer.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {offer.location}
                  </div>
                )}
                {(offer.salaryMin || offer.salaryMax) && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" />
                    {offer.salaryMin && offer.salaryMax
                      ? `${formatGNF(offer.salaryMin)} - ${formatGNF(offer.salaryMax)}`
                      : offer.salaryMin ? `Min: ${formatGNF(offer.salaryMin)}` : `Max: ${formatGNF(offer.salaryMax || 0)}`
                    }
                  </div>
                )}
                {offer.publishedAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Publiée le {formatDate(offer.publishedAt.slice(0, 10))}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">{offer.closingDate ? `Clôture: ${formatDate(offer.closingDate)}` : 'Pas de date de clôture'}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-[#27698a]">
                  Détails →
                </Button>
              </div>
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center text-slate-400">
            <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucune offre d'emploi</p>
          </Card>
        )}
      </div>

      {/* Modal détail */}
      {selectedOffer && (
        <Dialog open onOpenChange={(v) => !v && setSelectedOffer(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedOffer.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={CONTRACT_TYPES[selectedOffer.contractType]?.color}>
                  {CONTRACT_TYPES[selectedOffer.contractType]?.label}
                </Badge>
                <Badge variant="outline" className={STATUS_META[selectedOffer.status]?.color}>
                  {STATUS_META[selectedOffer.status]?.label}
                </Badge>
                {selectedOffer.department && <Badge variant="outline">{selectedOffer.department}</Badge>}
                {selectedOffer.location && <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{selectedOffer.location}</Badge>}
              </div>

              {(selectedOffer.salaryMin || selectedOffer.salaryMax) && (
                <div className="p-3 rounded-lg bg-[#27698a]/5 border border-[#27698a]/20">
                  <div className="text-xs text-slate-500">Fourchette salariale</div>
                  <div className="text-lg font-bold text-[#27698a]">
                    {selectedOffer.salaryMin && selectedOffer.salaryMax
                      ? `${formatGNF(selectedOffer.salaryMin)} - ${formatGNF(selectedOffer.salaryMax)}`
                      : selectedOffer.salaryMin ? `Min: ${formatGNF(selectedOffer.salaryMin)}` : `Max: ${formatGNF(selectedOffer.salaryMax || 0)}`
                    }
                    <span className="text-xs text-slate-500 ml-2">/ mois</span>
                  </div>
                </div>
              )}

              {selectedOffer.description && (
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-2">Description du poste</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedOffer.description}</p>
                </div>
              )}

              {selectedOffer.requirements && (
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-2">Profil recherché</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedOffer.requirements}</p>
                </div>
              )}

              {selectedOffer.benefits && (
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-2">Avantages</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedOffer.benefits}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
                {selectedOffer.publishedAt && <span>Publiée le {formatDate(selectedOffer.publishedAt.slice(0, 10))}</span>}
                {selectedOffer.closingDate && <span>Clôture: {formatDate(selectedOffer.closingDate)}</span>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {wizardOpen && (
        <JobOfferWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

function JobOfferWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: '',
    location: 'Conakry',
    contractType: 'CDI',
    salaryMin: '',
    salaryMax: '',
    requirements: '',
    benefits: '',
    status: 'PUBLIEE',
    closingDate: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Titre requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/job-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        }),
      })
      if (res.ok) {
        toast.success('Offre d\'emploi créée')
        onCreated()
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
            <Briefcase className="w-5 h-5 text-[#27698a]" />
            Nouvelle offre d'emploi
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Titre du poste *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Développeur Full-Stack Senior" />
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} placeholder="Mission principale, responsabilités, contexte..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Département</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="mt-1" placeholder="IT" />
            </div>
            <div>
              <Label className="text-sm">Lieu</Label>
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Type contrat</Label>
              <Select value={form.contractType} onValueChange={v => setForm({ ...form, contractType: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Salaire min (GNF)</Label>
              <Input type="number" value={form.salaryMin} onChange={e => setForm({ ...form, salaryMin: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Salaire max (GNF)</Label>
              <Input type="number" value={form.salaryMax} onChange={e => setForm({ ...form, salaryMax: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Profil recherché</Label>
            <Textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} className="mt-1" rows={2} placeholder="Compétences, expérience, diplômes..." />
          </div>
          <div>
            <Label className="text-sm">Avantages</Label>
            <Textarea value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} className="mt-1" rows={2} placeholder="Mutuelle, primes, transport, formation..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Statut</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BROUILLON">Brouillon</SelectItem>
                  <SelectItem value="PUBLIEE">Publiée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Date de clôture</Label>
              <Input type="date" value={form.closingDate} onChange={e => setForm({ ...form, closingDate: e.target.value })} className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer l'offre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
