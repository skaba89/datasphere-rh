'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Crown, Star, Award, TrendingUp } from 'lucide-react'

interface Data { leaderboard: any[]; badges: any[]; stats: any }

const LEVEL_META: Record<string, { color: string; icon: React.ElementType }> = {
  Or: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Crown },
  Argent: { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Medal },
  Bronze: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Award },
  Débutant: { color: 'bg-sky-100 text-sky-700 border-sky-200', icon: Star },
}

export function GamificationPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { let m = true; fetch('/api/gamification').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Trophy className="w-6 h-6 text-[#27698a]" />Gamification</h1><p className="text-sm text-slate-500 mt-1">Points, badges et classements employés</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Trophy} label="Points distribués" value={data.stats.totalPoints} color="#27698a" />
        <KpiCard icon={Crown} label="Niveau Or" value={data.stats.goldCount} color="#96783c" />
        <KpiCard icon={Award} label="Badges décernés" value={data.stats.badgesEarned} color="#478e5e" />
        <KpiCard icon={TrendingUp} label="Participants" value={data.leaderboard.length} color="#b94659" />
      </div>

      {/* Leaderboard */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-[#27698a]" />Classement</h2>
        <div className="space-y-2">
          {data.leaderboard.map((e, i) => {
            const meta = LEVEL_META[e.level] || LEVEL_META.Débutant
            const LevelIcon = meta.icon
            const rankColor = i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-slate-300' : i === 2 ? 'bg-orange-400' : 'bg-slate-200'
            return (
              <div key={e.id} className={`flex items-center gap-3 p-3 rounded-lg ${i < 3 ? 'bg-slate-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full ${rankColor} text-white flex items-center justify-center text-sm font-bold shrink-0`}>{i + 1}</div>
                <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shrink-0 ${e.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'}`}>{e.name[0]}{e.name.split(' ')[1]?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900 truncate">{e.name}</div>
                  <div className="text-xs text-slate-500 truncate">{e.poste}</div>
                </div>
                <div className="flex flex-wrap gap-1">{e.badges.map((b: string, j: number) => <span key={j} className="text-xs">{b}</span>)}</div>
                <Badge variant="outline" className={`text-[10px] ${meta.color}`}><LevelIcon className="w-2.5 h-2.5 mr-0.5" />{e.level}</Badge>
                <div className="text-right shrink-0 w-16"><div className="text-lg font-bold text-[#27698a]">{e.points}</div><div className="text-[10px] text-slate-400">pts</div></div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-[#27698a]" />Badges disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.badges.map((b, i) => (
            <div key={i} className="text-center p-3 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${b.color} text-2xl mb-2`}>{b.icon}</div>
              <div className="font-medium text-xs text-slate-900">{b.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{b.desc}</div>
              <Badge variant="outline" className="text-[9px] mt-2 bg-slate-50">{b.earned} décerné{b.earned > 1 ? 's' : ''}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
