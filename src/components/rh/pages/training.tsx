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
import { GraduationCap, Clock, Users, MapPin, Calendar, Plus, Loader2, CheckCircle2, Award, Video, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Training {
  id: string
  title: string
  description: string | null
  category: string
  duration: number
  format: string
  startDate: string | null
  endDate: string | null
  trainer: string | null
  location: string | null
  maxParticipants: number | null
  status: string
  enrolledCount: number
  enrollments: Array<{
    id: string
    status: string
    progress: number
    employee: { id: string; nom: string; prenoms: string; matricule: string }
  }>
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  RH: { label: 'RH', color: 'bg-[#27698a]/10 text-[#27698a]' },
  TECHNIQUE: { label: 'Technique', color: 'bg-purple-100 text-purple-700' },
  SECURITE: { label: 'Sécurité', color: 'bg-red-100 text-red-700' },
  MANAGEMENT: { label: 'Management', color: 'bg-amber-100 text-amber-700' },
  LANGUES: { label: 'Langues', color: 'bg-emerald-100 text-emerald-700' },
}

const FORMAT_META: Record<string, { label: string; icon: React.ElementType }> = {
  PRESENTIEL: { label: 'Présentiel', icon: Building2 },
  EN_LIGNE: { label: 'En ligne', icon: Video },
  MIXTE: { label: 'Mixte', icon: GraduationCap },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PLANIFIEE: { label: 'Planifiée', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  EN_COURS: { label: 'En cours', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  TERMINEE: { label: 'Terminée', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ANNULEE: { label: 'Annulée', color: 'bg-red-100 text-red-700 border-red-200' },
}

export function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/trainings')
      .then(r => r.json())
      .then(d => { setTrainings(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/trainings')
      .then(r => r.json())
      .then(d => { if (mounted) { setTrainings(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const stats = {
    total: trainings.length,
    enCours: trainings.filter(t => t.status === 'EN_COURS').length,
    planifiees: trainings.filter(t => t.status === 'PLANIFIEE').length,
    totalInscriptions: trainings.reduce((sum, t) => sum + t.enrolledCount, 0),
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#27698a]" />
            Formation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catalogue de formations, inscriptions et certifications
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle formation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={GraduationCap} label="Total formations" value={stats.total} color="#27698a" />
        <KpiCard icon={Clock} label="En cours" value={stats.enCours} color="#478e5e" />
        <KpiCard icon={Calendar} label="Planifiées" value={stats.planifiees} color="#96783c" />
        <KpiCard icon={Users} label="Inscriptions" value={stats.totalInscriptions} color="#b94659" />
      </div>

      {/* Liste formations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {trainings.map(t => {
          const cat = CATEGORY_META[t.category] || CATEGORY_META.RH
          const fmt = FORMAT_META[t.format] || FORMAT_META.PRESENTIEL
          const status = STATUS_META[t.status] || STATUS_META.PLANIFIEE
          const places = t.maxParticipants ? `${t.enrolledCount}/${t.maxParticipants}` : `${t.enrolledCount} inscrits`
          const fullness = t.maxParticipants ? (t.enrolledCount / t.maxParticipants) * 100 : 0

          return (
            <Card key={t.id} className="p-4 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className={cat.color}>{cat.label}</Badge>
                <Badge variant="outline" className={status.color}>{status.label}</Badge>
              </div>

              <h3 className="font-semibold text-slate-900 text-sm mb-1">{t.title}</h3>
              {t.description && <p className="text-xs text-slate-600 mb-2 line-clamp-2">{t.description}</p>}

              <div className="space-y-1 text-xs text-slate-600 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{t.duration} heures</span>
                </div>
                <div className="flex items-center gap-2">
                  <fmt.icon className="w-3 h-3" />
                  <span>{fmt.label}{t.location ? ` · ${t.location}` : ''}</span>
                </div>
                {t.trainer && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    <span>Formateur : {t.trainer}</span>
                  </div>
                )}
                {t.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    <span>Du {formatDate(t.startDate)}{t.endDate ? ` au ${formatDate(t.endDate)}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Inscriptions */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">{places}</span>
                  {t.enrolledCount > 0 && (
                    <div className="flex -space-x-1">
                      {t.enrollments.slice(0, 3).map(enr => (
                        <div key={enr.id} className="w-5 h-5 rounded-full bg-[#27698a] text-white flex items-center justify-center text-[9px] font-bold border border-white">
                          {enr.employee.prenoms[0]}{enr.employee.nom[0]}
                        </div>
                      ))}
                      {t.enrollments.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[9px] font-bold border border-white">
                          +{t.enrollments.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {t.maxParticipants && (
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${fullness >= 100 ? 'bg-red-500' : fullness >= 80 ? 'bg-amber-500' : 'bg-[#27698a]'}`}
                      style={{ width: `${Math.min(fullness, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  Détails
                </Button>
                {t.status === 'PLANIFIEE' && (
                  <Button size="sm" className="flex-1 h-7 text-xs bg-[#27698a] hover:bg-[#1f5570]">
                    Inscrire
                  </Button>
                )}
                {t.status === 'TERMINEE' && (
                  <Button variant="outline" size="sm" className="flex-1 h-7 text-xs text-emerald-600 border-emerald-200">
                    <Award className="w-3 h-3 mr-1" />
                    Certificats
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
        {trainings.length === 0 && (
          <Card className="col-span-full p-8 text-center text-slate-400">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucune formation planifiée</p>
          </Card>
        )}
      </div>

      {wizardOpen && (
        <TrainingWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
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

function TrainingWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'RH',
    duration: '8',
    format: 'PRESENTIEL',
    startDate: '',
    endDate: '',
    trainer: '',
    location: 'Conakry',
    maxParticipants: '20',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Titre requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Formation créée')
        onCreated()
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
            <GraduationCap className="w-5 h-5 text-[#27698a]" />
            Nouvelle formation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Titre *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Gestion de projet avancée" />
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Durée (h)</Label>
              <Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Format</Label>
              <Select value={form.format} onValueChange={v => setForm({ ...form, format: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FORMAT_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Date début</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Date fin</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Formateur</Label>
              <Input value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Max participants</Label>
              <Input type="number" value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-sm">Lieu</Label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer formation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
