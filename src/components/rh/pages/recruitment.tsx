'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, Star, Trash2, Mail, Phone, Briefcase, Calendar, DollarSign, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  positionApplied: string
  source: string
  status: string
  rating: number
  expectedSalary: number | null
  availability: string | null
  notes: string | null
  interviewDate: string | null
  createdAt: string
}

const COLUMNS: Array<{ key: string; label: string; color: string }> = [
  { key: 'NOUVEAU', label: 'Nouveaux', color: 'border-t-sky-500' },
  { key: 'EN_ENTRETIEN', label: 'En entretien', color: 'border-t-amber-500' },
  { key: 'OFFRE', label: 'Offre envoyée', color: 'border-t-violet-500' },
  { key: 'ACCEPTE', label: 'Accepté', color: 'border-t-emerald-500' },
  { key: 'REFUSE', label: 'Refusé', color: 'border-t-red-500' },
]

const SOURCES: Record<string, string> = {
  PORTAIL: 'Portail',
  LINKEDIN: 'LinkedIn',
  REFERRAL: 'Recommandation',
  CABINET: 'Cabinet',
}

export function RecruitmentPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [moving, setMoving] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/candidates')
      .then(r => r.json())
      .then(d => { setCandidates(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/candidates')
      .then(r => r.json())
      .then(d => { if (mounted) { setCandidates(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const handleDrop = async (status: string) => {
    if (!draggingId) return
    setMoving(draggingId)
    try {
      const res = await fetch(`/api/candidates/${draggingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success('Statut mis à jour')
        load()
      }
    } catch {
      toast.error('Erreur')
    }
    setDraggingId(null)
    setMoving(null)
  }

  const stats = {
    total: candidates.length,
    nouveau: candidates.filter(c => c.status === 'NOUVEAU').length,
    entretien: candidates.filter(c => c.status === 'EN_ENTRETIEN').length,
    accepte: candidates.filter(c => c.status === 'ACCEPTE').length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Recrutement &amp; Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pipeline candidats · {stats.total} candidat{stats.total > 1 ? 's' : ''} · {stats.nouveau} nouveaux · {stats.entretien} en entretien
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nouveau candidat
        </Button>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {COLUMNS.map(col => {
          const colCandidates = candidates.filter(c => c.status === col.key)
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.key)}
              className={`bg-slate-100/50 rounded-lg border-t-4 ${col.color} border-x border-b border-slate-200 min-h-[400px]`}
            >
              <div className="p-3 border-b border-slate-200 bg-white/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-900">{col.label}</h3>
                  <Badge variant="outline" className="text-xs">{colCandidates.length}</Badge>
                </div>
              </div>
              <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
                {colCandidates.map(c => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    onDragStart={() => setDraggingId(c.id)}
                    isDragging={draggingId === c.id}
                    isMoving={moving === c.id}
                    onRate={(rating) => {
                      fetch(`/api/candidates/${c.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rating }),
                      }).then(() => load())
                    }}
                    onDelete={async () => {
                      if (!confirm(`Supprimer ${c.firstName} ${c.lastName} ?`)) return
                      await fetch(`/api/candidates/${c.id}`, { method: 'DELETE' })
                      toast.success('Candidat supprimé')
                      load()
                    }}
                  />
                ))}
                {colCandidates.length === 0 && (
                  <div className="text-center text-xs text-slate-400 py-8 italic">
                    Glisser ici
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {wizardOpen && (
        <CandidateWizard
          onClose={() => setWizardOpen(false)}
          onCreated={() => { setWizardOpen(false); load() }}
        />
      )}
    </div>
  )
}

function CandidateCard({ candidate, onDragStart, isDragging, isMoving, onRate, onDelete }: {
  candidate: Candidate
  onDragStart: () => void
  isDragging: boolean
  isMoving: boolean
  onRate: (rating: number) => void
  onDelete: () => void
}) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className={`p-3 cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''} ${isMoving ? 'border-[#27698a]' : ''}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-[#27698a] text-white flex items-center justify-center text-xs font-bold shrink-0">
          {candidate.firstName[0]}{candidate.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-slate-900 truncate">
            {candidate.firstName} {candidate.lastName}
          </div>
          <div className="text-xs text-slate-500 truncate flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {candidate.positionApplied}
          </div>
        </div>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onRate(n === candidate.rating ? 0 : n)}
            className={`${n <= candidate.rating ? 'text-amber-400' : 'text-slate-300'} hover:text-amber-500`}
          >
            <Star className="w-3 h-3 fill-current" />
          </button>
        ))}
      </div>

      <div className="space-y-1 text-xs text-slate-600">
        {candidate.email && (
          <div className="flex items-center gap-1.5 truncate">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{candidate.email}</span>
          </div>
        )}
        {candidate.phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 shrink-0" />
            {candidate.phone}
          </div>
        )}
        {candidate.expectedSalary && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 shrink-0" />
            {new Intl.NumberFormat('fr-FR').format(candidate.expectedSalary)} GNF
          </div>
        )}
        {candidate.availability && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0" />
            {candidate.availability}
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
        <Badge variant="outline" className="text-[10px]">
          {SOURCES[candidate.source] || candidate.source}
        </Badge>
        <span className="text-[10px] text-slate-400">
          {new Date(candidate.createdAt).toLocaleDateString('fr-FR')}
        </span>
      </div>

      {candidate.notes && (
        <div className="mt-2 p-2 rounded bg-slate-50 text-xs italic text-slate-600">
          « {candidate.notes.slice(0, 80)}{candidate.notes.length > 80 ? '...' : ''} »
        </div>
      )}
    </Card>
  )
}

function CandidateWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    positionApplied: '',
    source: 'PORTAIL',
    expectedSalary: '',
    availability: 'Immédiate',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.positionApplied) {
      toast.error('Prénom, nom et poste sont requis')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expectedSalary: form.expectedSalary ? Number(form.expectedSalary) : null,
        }),
      })
      if (res.ok) {
        toast.success('Candidat ajouté au pipeline')
        onCreated()
      } else {
        toast.error('Erreur lors de la création')
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
            <UserPlus className="w-5 h-5 text-[#27698a]" />
            Nouveau candidat
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Prénom *</Label>
              <Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Nom *</Label>
              <Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Poste visé *</Label>
            <Input value={form.positionApplied} onChange={e => setForm({ ...form, positionApplied: e.target.value })} className="mt-1" placeholder="Développeur Senior" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Téléphone</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Source</Label>
              <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Prétention salaire (GNF)</Label>
              <Input type="number" value={form.expectedSalary} onChange={e => setForm({ ...form, expectedSalary: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Disponibilité</Label>
            <Input value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} placeholder="Profil, compétences, remarques..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
