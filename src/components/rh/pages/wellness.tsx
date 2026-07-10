'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Trophy, Footprints, Brain, Apple, Moon, Droplet, Dumbbell, Smile, TrendingUp, Plus, Check, Frown, Meh, Laugh, Phone, Stethoscope, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const CHALLENGES = [
  { id: 'steps', title: '10 000 pas/jour', desc: 'Marchez 10 000 pas chaque jour pendant 30 jours', icon: Footprints, color: 'bg-emerald-100 text-emerald-700', unit: 'pas', target: 10000, current: 7234, participants: 6 },
  { id: 'water', title: '8 verres d\'eau/jour', desc: 'Hydratez-vous correctement chaque jour', icon: Droplet, color: 'bg-sky-100 text-sky-700', unit: 'verres', target: 8, current: 5, participants: 9 },
  { id: 'sleep', title: '8h de sommeil', desc: 'Dormez au moins 8h par nuit pendant 21 jours', icon: Moon, color: 'bg-purple-100 text-purple-700', unit: 'heures', target: 8, current: 7, participants: 4 },
  { id: 'meditation', title: '10 min méditation/jour', desc: 'Pratiquez la pleine conscience quotidiennement', icon: Brain, color: 'bg-amber-100 text-amber-700', unit: 'minutes', target: 10, current: 10, participants: 5 },
  { id: 'fruit', title: '5 fruits & légumes/jour', desc: 'Mangez sainement avec 5 portions par jour', icon: Apple, color: 'bg-red-100 text-red-700', unit: 'portions', target: 5, current: 3, participants: 7 },
  { id: 'workout', title: '3 séances sport/semaine', desc: 'Faites de l\'exercice 3 fois par semaine', icon: Dumbbell, color: 'bg-[#27698a]/10 text-[#27698a]', unit: 'séances', target: 3, current: 2, participants: 8 },
]

const WELLNESS_TIPS = [
  { title: 'Pause active', desc: 'Levez-vous toutes les 45 minutes pour étirer vos jambes. Réduisez les maux de dos de 40%.', icon: Footprints, color: 'text-emerald-600' },
  { title: 'Règle 20-20-20', desc: 'Toutes les 20 minutes, regardez à 20 pieds (6m) pendant 20 secondes pour reposer vos yeux.', icon: Brain, color: 'text-sky-600' },
  { title: 'Respiration 4-7-8', desc: 'Inspirez 4s, retenez 7s, expirez 8s. Réduit le stress en 3 cycles.', icon: Heart, color: 'text-red-600' },
  { title: 'Hydratation', desc: 'Buvez 1.5L d\'eau par jour. La déshydratation réduit la concentration de 25%.', icon: Droplet, color: 'text-blue-600' },
  { title: 'Sommeil régulier', desc: 'Couchez-vous à heure fixe. Le sommeil irrégulier altère la mémoire de 40%.', icon: Moon, color: 'text-purple-600' },
  { title: 'Gratitude', desc: 'Notez 3 choses positives chaque soir. Augmente le bonheur de 25% en 8 semaines.', icon: Smile, color: 'text-amber-600' },
]

const MOOD_TRACKER = [
  { day: 'Lun', mood: 4 }, { day: 'Mar', mood: 3 }, { day: 'Mer', mood: 5 },
  { day: 'Jeu', mood: 4 }, { day: 'Ven', mood: 5 }, { day: 'Sam', mood: 5 }, { day: 'Dim', mood: 4 },
]

const MOOD_EMOJIS: React.ElementType[] = [Frown, Meh, Meh, Smile, Laugh]

export function WellnessPage() {
  const [joined, setJoined] = useState<string[]>(['water', 'meditation'])

  const toggleJoin = (id: string) => {
    if (joined.includes(id)) {
      setJoined(joined.filter(j => j !== id))
      toast.success('Vous avez quitté le défi')
    } else {
      setJoined([...joined, id])
      toast.success('Défi rejoint ! Bon courage')
    }
  }

  const totalParticipants = CHALLENGES.reduce((s, c) => s + c.participants, 0)
  const activeChallenges = CHALLENGES.filter(c => joined.includes(c.id)).length
  const avgMood = MOOD_TRACKER.reduce((s, m) => s + m.mood, 0) / MOOD_TRACKER.length

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Heart className="w-6 h-6 text-[#27698a]" />Bien-être &amp; Wellness</h1>
        <p className="text-sm text-slate-500 mt-1">Défis santé, suivi de l'humeur et conseils bien-être</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Trophy} label="Défis actifs" value={activeChallenges} color="#27698a" sub={`${CHALLENGES.length} disponibles`} />
        <KpiCard icon={Footprints} label="Participants total" value={totalParticipants} color="#478e5e" sub="employés engagés" />
        <KpiCard icon={Smile} label="Humeur moyenne" value={`${avgMood.toFixed(1)}/5`} color="#96783c" sub="cette semaine" />
        <KpiCard icon={TrendingUp} label="Taux participation" value={`${Math.round((totalParticipants / 9) * 100)}%`} color="#b94659" sub="de l'effectif" />
      </div>

      {/* Mood tracker */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Smile className="w-4 h-4 text-[#27698a]" />Suivi de l'humeur (cette semaine)</h2>
        <div className="flex items-end justify-between gap-2">
          {MOOD_TRACKER.map((m, i) => { const MoodIcon = MOOD_EMOJIS[m.mood - 1]; return (
            <div key={i} className="flex-1 text-center">
              <div className="mb-1 flex justify-center"><MoodIcon className="w-6 h-6 text-[#27698a]" /></div>
              <div className="h-20 flex items-end">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-[#27698a] to-[#478e5e]" style={{ height: `${(m.mood / 5) * 100}%` }}></div>
              </div>
              <div className="text-xs text-slate-500 mt-1">{m.day}</div>
            </div>
          ) })}
        </div>
      </Card>

      {/* Défis */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4 text-[#27698a]" />Défis santé en cours</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CHALLENGES.map(c => {
            const isJoined = joined.includes(c.id)
            const pct = Math.round((c.current / c.target) * 100)
            return (
              <Card key={c.id} className={`p-4 ${isJoined ? 'ring-2 ring-[#27698a]/30' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="w-4 h-4" /></div>
                  {isJoined && <Badge variant="outline" className="bg-[#27698a]/10 text-[#27698a] text-[10px]"><Check className="w-2.5 h-2.5 mr-0.5" />Inscrit</Badge>}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Progression aujourd'hui</span>
                    <span className="font-bold text-slate-700">{c.current}/{c.target} {c.unit}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#27698a]'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400">{c.participants} participants</span>
                  <Button size="sm" variant={isJoined ? 'outline' : 'default'} className="h-7 text-xs" onClick={() => toggleJoin(c.id)}>
                    {isJoined ? 'Quitter' : <><Plus className="w-3 h-3 mr-1" />Rejoindre</>}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Conseils bien-être */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-[#27698a]" />Conseils bien-être quotidiens</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {WELLNESS_TIPS.map((tip, i) => (
            <div key={i} className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <tip.icon className={`w-4 h-4 ${tip.color}`} />
                <span className="text-sm font-medium text-slate-900">{tip.title}</span>
              </div>
              <p className="text-xs text-slate-600">{tip.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Ressources */}
      <Card className="p-5 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <h2 className="font-semibold text-slate-900 mb-3">Ressources santé</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="font-medium text-slate-900 mb-1 inline-flex items-center gap-1"><Phone className="w-4 h-4 text-[#27698a]" /> Ligne d'écoute</div>
            <p className="text-xs text-slate-600">Support psychologique gratuit et confidentiel. Disponible 24/7 au 116 (numéro vert Guinée).</p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="font-medium text-slate-900 mb-1 inline-flex items-center gap-1"><Stethoscope className="w-4 h-4 text-[#27698a]" /> Médecin du travail</div>
            <p className="text-xs text-slate-600">Visites médicales planifiées dans le module Santé & Wellness. Prochaine campagne : Septembre 2026.</p>
          </div>
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <div className="font-medium text-slate-900 mb-1 inline-flex items-center gap-1"><Sparkles className="w-4 h-4 text-[#27698a]" /> Sessions relaxation</div>
            <p className="text-xs text-slate-600">Sessions de méditation guidée tous les mardis 12h-12h30 en salle de repos. Gratuit, sans inscription.</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p>
          <p className="text-base lg:text-lg font-bold text-slate-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  )
}
