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
import { Smile, Frown, Meh, TrendingUp, Plus, Loader2, Star, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Survey {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  startDate: string | null
  endDate: string | null
  responseCount: number
  avgScore: number
  nps: number | null
  responses: Array<{ score: number; comment: string | null; employee: { nom: string; prenoms: string } }>
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  NPS: { label: 'NPS', color: 'bg-[#27698a]/10 text-[#27698a]' },
  ENGAGEMENT: { label: 'Engagement', color: 'bg-purple-100 text-purple-700' },
  EXIT: { label: 'Exit', color: 'bg-red-100 text-red-700' },
  '360': { label: '360°', color: 'bg-amber-100 text-amber-700' },
}

export function SatisfactionPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/surveys')
      .then(r => r.json())
      .then(d => { setSurveys(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/surveys')
      .then(r => r.json())
      .then(d => { if (mounted) { setSurveys(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const totalResponses = surveys.reduce((s, x) => s + x.responseCount, 0)
  const avgNps = surveys.filter(s => s.nps !== null).length > 0
    ? Math.round(surveys.filter(s => s.nps !== null).reduce((s, x) => s + (x.nps || 0), 0) / surveys.filter(s => s.nps !== null).length)
    : 0
  const avgScore = surveys.length > 0 ? surveys.reduce((s, x) => s + x.avgScore, 0) / surveys.length : 0

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Smile className="w-6 h-6 text-[#27698a]" />
            Satisfaction employé
          </h1>
          <p className="text-sm text-slate-500 mt-1">Enquêtes NPS, engagement et feedback</p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle enquête
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={MessageSquare} label="Enquêtes" value={surveys.length} color="#27698a" />
        <KpiCard icon={Star} label="Réponses" value={totalResponses} color="#478e5e" />
        <KpiCard icon={TrendingUp} label="NPS moyen" value={avgNps.toString()} color={avgNps >= 0 ? '#478e5e' : '#b94659'} sub={avgNps >= 50 ? 'Excellent' : avgNps >= 0 ? 'Correct' : 'À améliorer'} />
        <KpiCard icon={Smile} label="Score moyen" value={avgScore.toFixed(1)} color="#96783c" sub="sur 10" />
      </div>

      {/* Liste enquêtes */}
      <div className="space-y-3">
        {surveys.map(survey => {
          const type = TYPE_META[survey.type] || TYPE_META.NPS
          const npsColor = survey.nps !== null
            ? survey.nps >= 50 ? 'text-emerald-600' : survey.nps >= 0 ? 'text-amber-600' : 'text-red-600'
            : 'text-slate-400'
          const npsIcon = survey.nps !== null
            ? survey.nps >= 50 ? Smile : survey.nps >= 0 ? Meh : Frown
            : Meh
          const NpsIcon = npsIcon

          return (
            <Card key={survey.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={type.color}>{type.label}</Badge>
                    <Badge variant="outline" className={survey.status === 'OUVERTE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600'}>
                      {survey.status === 'OUVERTE' ? 'Ouverte' : survey.status === 'FERMEE' ? 'Fermée' : 'Brouillon'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900">{survey.title}</h3>
                  {survey.description && <p className="text-xs text-slate-500 mt-1">{survey.description}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  {survey.nps !== null ? (
                    <>
                      <div className={`text-3xl font-bold ${npsColor}`}>{survey.nps > 0 ? '+' : ''}{survey.nps}</div>
                      <div className="text-xs text-slate-500">NPS</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-slate-700">{survey.avgScore.toFixed(1)}</div>
                      <div className="text-xs text-slate-500">Score moyen / {survey.type === 'NPS' ? '10' : '5'}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {survey.responseCount} réponse{survey.responseCount > 1 ? 's' : ''}</span>
                {survey.startDate && <span>· Du {formatDate(survey.startDate)}</span>}
                {survey.endDate && <span>· Au {formatDate(survey.endDate)}</span>}
              </div>

              {/* Distribution scores */}
              {survey.responses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-600 mb-2">Distribution des scores</div>
                    <div className="flex items-end gap-1 h-20">
                      {Array.from({ length: survey.type === 'NPS' ? 11 : 6 }, (_, i) => {
                        const count = survey.responses.filter(r => r.score === i).length
                        const maxCount = Math.max(...Array.from({ length: survey.type === 'NPS' ? 11 : 6 }, (_, j) => survey.responses.filter(r => r.score === j).length), 1)
                        const color = survey.type === 'NPS'
                          ? i <= 6 ? 'bg-red-400' : i <= 8 ? 'bg-amber-400' : 'bg-emerald-500'
                          : i <= 2 ? 'bg-red-400' : i <= 3 ? 'bg-amber-400' : 'bg-emerald-500'
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="text-[10px] text-slate-500">{count > 0 ? count : ''}</div>
                            <div className={`w-full ${color} rounded-t transition-all`} style={{ height: `${(count / maxCount) * 60}px` }}></div>
                            <div className="text-[10px] text-slate-400">{i}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <NpsIcon className="w-3 h-3" />
                      {survey.nps !== null && survey.nps >= 50 ? 'Promoteurs dominants' : survey.nps !== null && survey.nps >= 0 ? 'Neutres majoritaires' : survey.nps !== null ? 'Détracteurs à surveiller' : 'Feedback'}
                    </div>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {survey.responses.filter(r => r.comment).slice(0, 3).map((r, i) => (
                        <div key={i} className="text-xs p-1.5 rounded bg-slate-50 text-slate-600 italic">
                          « {r.comment?.slice(0, 80)}{r.comment && r.comment.length > 80 ? '...' : ''} »
                        </div>
                      ))}
                      {survey.responses.filter(r => r.comment).length === 0 && (
                        <p className="text-xs text-slate-400 italic">Aucun commentaire</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
        {surveys.length === 0 && (
          <Card className="p-8 text-center text-slate-400">
            <Smile className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucune enquête créée</p>
          </Card>
        )}
      </div>

      {wizardOpen && (
        <SurveyWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string | number; color: string; sub?: string }) {
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

function SurveyWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'NPS',
    endDate: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Titre requis'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Enquête créée')
        onCreated()
      }
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
            <Smile className="w-5 h-5 text-[#27698a]" />
            Nouvelle enquête
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Titre *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="Satisfaction Juillet 2026" />
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Date de fin</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
