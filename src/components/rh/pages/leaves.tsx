'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Check, X, Clock, Loader2 } from 'lucide-react'
import { formatDate, LEAVE_TYPES, LEAVE_STATUS } from '@/lib/utils-rh'
import { toast } from 'sonner'

interface LeaveRequest {
  id: string
  type: string
  dateDebut: string
  dateFin: string
  motif: string | null
  statut: string
  employee: {
    nom: string
    prenoms: string
    matricule: string
    poste: string
  }
}

export function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'EN_ATTENTE' | 'APPROUVE' | 'REFUSE'>('all')
  const [acting, setActing] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/leaves')
      .then(r => r.json())
      .then(d => { setLeaves(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/leaves')
      .then(r => r.json())
      .then(d => { if (mounted) { setLeaves(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const approve = async (id: string, name: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/leaves/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        toast.success(`Congé de ${name} approuvé`)
        load()
      } else {
        toast.error('Erreur lors de l\'approbation')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setActing(null)
  }

  const reject = async (id: string, name: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/leaves/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motif: 'Refusé par le manager' }),
      })
      if (res.ok) {
        toast.success(`Congé de ${name} refusé`)
        load()
      } else {
        toast.error('Erreur lors du refus')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setActing(null)
  }

  const filtered = filter === 'all' ? leaves : leaves.filter(l => l.statut === filter)

  const stats = {
    total: leaves.length,
    pending: leaves.filter(l => l.statut === 'EN_ATTENTE').length,
    approved: leaves.filter(l => l.statut === 'APPROUVE').length,
    refused: leaves.filter(l => l.statut === 'REFUSE').length,
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Congés & absences</h1>
          <p className="text-sm text-slate-500 mt-1">
            Workflow de validation à 3 niveaux — Demo SARL
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total demandes" value={stats.total} icon={Calendar} color="#27698a" />
        <StatCard label="En attente" value={stats.pending} icon={Clock} color="#96783c" />
        <StatCard label="Approuvées" value={stats.approved} icon={Check} color="#478e5e" />
        <StatCard label="Refusées" value={stats.refused} icon={X} color="#b94659" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'EN_ATTENTE', 'APPROUVE', 'REFUSE'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-[#27698a] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'Toutes' : LEAVE_STATUS[f].label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {filtered.map(leave => {
          const type = LEAVE_TYPES[leave.type] || { label: leave.type, color: 'bg-slate-100 text-slate-700 border-slate-200' }
          const status = LEAVE_STATUS[leave.statut] || { label: leave.statut, color: 'bg-slate-100 text-slate-700 border-slate-200' }
          const days = Math.ceil(
            (new Date(leave.dateFin).getTime() - new Date(leave.dateDebut).getTime()) / (1000 * 60 * 60 * 24)
          ) + 1

          return (
            <Card key={leave.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className={type.color}>
                  {type.label}
                </Badge>
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#27698a] flex items-center justify-center text-white text-xs font-semibold">
                  {leave.employee.prenoms[0]}{leave.employee.nom[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 truncate">
                    {leave.employee.nom} {leave.employee.prenoms}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {leave.employee.poste} · {leave.employee.matricule}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Du</span>
                  <span className="font-medium text-slate-900">{formatDate(leave.dateDebut)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Au</span>
                  <span className="font-medium text-slate-900">{formatDate(leave.dateFin)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Durée</span>
                  <span className="font-medium text-slate-900">{days} jour{days > 1 ? 's' : ''}</span>
                </div>
              </div>

              {leave.motif && (
                <div className="mt-3 p-2 rounded bg-slate-50 text-xs text-slate-600 italic">
                  « {leave.motif} »
                </div>
              )}

              {leave.statut === 'EN_ATTENTE' && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#478e5e] hover:bg-[#3a7549] h-8 text-xs"
                    onClick={() => approve(leave.id, `${leave.employee.nom} ${leave.employee.prenoms}`)}
                    disabled={acting === leave.id}
                  >
                    {acting === leave.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => reject(leave.id, `${leave.employee.nom} ${leave.employee.prenoms}`)}
                    disabled={acting === leave.id}
                  >
                    {acting === leave.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                    Refuser
                  </Button>
                </div>
              )}
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <Card className="col-span-full p-8 text-center text-slate-500">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Aucune demande de congé</p>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '15', color }}
        >
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
