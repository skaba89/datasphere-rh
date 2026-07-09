'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, CalendarDays, Heart, FileText, PartyPopper, GraduationCap, DollarSign } from 'lucide-react'
import { formatDate, LEAVE_TYPES } from '@/lib/utils-rh'

interface CalEvent {
  date: string
  type: 'leave' | 'holiday' | 'interview' | 'training' | 'expense' | 'health' | 'announcement'
  title: string
  subtitle?: string
  color: string
  icon: React.ElementType
}

const EVENT_META: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  leave: { color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: CalendarDays, label: 'Congé' },
  holiday: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: PartyPopper, label: 'Férié' },
  interview: { color: 'text-[#27698a]', bg: 'bg-[#27698a]/5 border-[#27698a]/20', icon: FileText, label: 'Entretien' },
  training: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: GraduationCap, label: 'Formation' },
  expense: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: DollarSign, label: 'Frais' },
  health: { color: 'text-pink-700', bg: 'bg-pink-50 border-pink-200', icon: Heart, label: 'Santé' },
  announcement: { color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200', icon: PartyPopper, label: 'Annonce' },
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)) // Juillet 2026
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetch('/api/leaves').then(r => r.json()).catch(() => []),
      fetch('/api/interviews').then(r => r.json()).catch(() => []),
      fetch('/api/trainings').then(r => r.json()).catch(() => []),
      fetch('/api/expenses').then(r => r.json()).catch(() => []),
      fetch('/api/health').then(r => r.json()).catch(() => []),
      fetch('/api/announcements').then(r => r.json()).catch(() => []),
    ]).then(([leaves, interviews, trainings, expenses, health, announcements]) => {
      if (!mounted) return
      const evts: CalEvent[] = []

      leaves.forEach((l: any) => {
        if (l.statut === 'APPROUVE') {
          const type = LEAVE_TYPES[l.type] || { label: l.type }
          evts.push({ date: l.dateDebut, type: 'leave', title: `${type.label} - ${l.employee?.nom || ''}`, subtitle: l.dateFin ? `→ ${formatDate(l.dateFin)}` : '', color: '', icon: CalIcon })
        }
      })
      interviews.forEach((i: any) => {
        if (i.scheduledAt && i.status !== 'ANNULE') {
          evts.push({ date: i.scheduledAt.slice(0, 10), type: 'interview', title: `Entretien ${i.employee?.nom || ''}`, subtitle: i.type, color: '', icon: FileText })
        }
      })
      trainings.forEach((t: any) => {
        if (t.startDate && t.status !== 'ANNULEE') {
          evts.push({ date: t.startDate, type: 'training', title: t.title, subtitle: t.location || '', color: '', icon: GraduationCap })
        }
      })
      expenses.forEach((e: any) => {
        evts.push({ date: e.date, type: 'expense', title: `${e.title} - ${e.employee?.nom || ''}`, subtitle: `${e.amount} GNF`, color: '', icon: DollarSign })
      })
      health.forEach((h: any) => {
        if (h.status !== 'ANNULE') {
          evts.push({ date: h.date, type: 'health', title: `${h.type} - ${h.employee?.nom || ''}`, subtitle: h.provider || '', color: '', icon: Heart })
        }
      })
      announcements.forEach((a: any) => {
        if (a.category === 'EVENT' && a.expiresAt) {
          evts.push({ date: a.expiresAt, type: 'announcement', title: a.title, subtitle: a.authorName || '', color: '', icon: PartyPopper })
        }
      })

      // Jours fériés fixes Guinée
      const holidays = [
        { date: '2026-01-01', title: "Jour de l'An" },
        { date: '2026-05-01', title: 'Fête du Travail' },
        { date: '2026-10-02', title: "Fête de l'Indépendance" },
        { date: '2026-12-25', title: 'Noël' },
      ]
      holidays.forEach(h => evts.push({ date: h.date, type: 'holiday', title: h.title, color: '', icon: PartyPopper }))

      setEvents(evts)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = (firstDay.getDay() + 6) % 7 // 0 = Monday
  const daysInMonth = lastDay.getDate()

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    events.forEach(e => {
      const d = e.date
      if (!map[d]) map[d] = []
      map[d].push(e)
    })
    return map
  }, [events])

  const cells: Array<{ day: number | null; dateStr: string | null }> = []
  for (let i = 0; i < startWeekday; i++) cells.push({ day: null, dateStr: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr })
  }

  const today = new Date().toISOString().slice(0, 10)
  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : []
  const monthEvents = events.filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
  const typeCounts: Record<string, number> = {}
  monthEvents.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1 })

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><CalIcon className="w-6 h-6 text-[#27698a]" />Calendrier global</h1>
        <p className="text-sm text-slate-500 mt-1">Vue mensuelle de tous les événements RH en un coup d'œil</p>
      </div>

      {/* Stats par type */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
        {Object.entries(EVENT_META).map(([key, meta]) => (
          <Card key={key} className="p-2 text-center">
            <div className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center ${meta.bg} mb-1`}>
              <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
            </div>
            <div className="text-sm font-bold text-slate-900">{typeCounts[key] || 0}</div>
            <div className="text-[10px] text-slate-500">{meta.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">{MONTHS[month]} {year}</h2>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
            {cells.map((cell, i) => {
              if (!cell.day) return <div key={i} className="min-h-[70px] md:min-h-[80px]" />
              const dayEvents = eventsByDate[cell.dateStr!] || []
              const isToday = cell.dateStr === today
              const isSelected = cell.dateStr === selectedDate
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[70px] md:min-h-[80px] p-1 rounded-lg border text-left transition-colors ${
                    isSelected ? 'border-[#27698a] bg-[#27698a]/5 ring-1 ring-[#27698a]' :
                    isToday ? 'border-[#27698a]/40 bg-[#27698a]/5' :
                    'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-xs font-medium ${isToday ? 'text-[#27698a] font-bold' : 'text-slate-600'}`}>{cell.day}</div>
                  <div className="space-y-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, idx) => {
                      const meta = EVENT_META[e.type] || EVENT_META.announcement
                      return <div key={idx} className={`text-[9px] px-1 py-0.5 rounded truncate ${meta.bg} ${meta.color}`}>{e.title}</div>
                    })}
                    {dayEvents.length > 3 && <div className="text-[9px] text-slate-400">+{dayEvents.length - 3} autres</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Selected day events */}
        <Card className="p-4">
          <h2 className="font-semibold text-slate-900 mb-3 text-sm">
            {selectedDate ? formatDate(selectedDate) : 'Sélectionnez un jour'}
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">Aucun événement</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e, i) => {
                const meta = EVENT_META[e.type] || EVENT_META.announcement
                return (
                  <div key={i} className={`p-2 rounded-lg border ${meta.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      <Badge variant="outline" className={`text-[9px] ${meta.bg} ${meta.color}`}>{meta.label}</Badge>
                    </div>
                    <div className="text-sm font-medium text-slate-900">{e.title}</div>
                    {e.subtitle && <div className="text-xs text-slate-500">{e.subtitle}</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Légende */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-2">Types d'événements</div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(EVENT_META).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-1.5 text-[10px]">
                  <div className={`w-2.5 h-2.5 rounded ${meta.bg}`}></div>
                  <span className="text-slate-600">{meta.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
