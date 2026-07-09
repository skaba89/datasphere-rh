'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Network, Users, Building2, Briefcase } from 'lucide-react'

interface Employee {
  id: string
  matricule: string
  nom: string
  prenoms: string
  poste: string
  sexe: string | null
  statut: string
  contract?: { type: string; salaireBase: number } | null
}

export function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/employees')
      .then(r => r.json())
      .then(d => { if (mounted) { setEmployees(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  // Catégoriser par niveau hiérarchique
  const categorize = (poste: string): 'direction' | 'management' | 'expert' | 'operationnel' | 'support' => {
    const p = poste.toLowerCase()
    if (p.includes('directeur') || p.includes('dg') || p.includes('ceo')) return 'direction'
    if (p.includes('manager') || p.includes('responsable') || p.includes('chef')) return 'management'
    if (p.includes('senior') || p.includes('expert') || p.includes('lead')) return 'expert'
    if (p.includes('compt') || p.includes('rh') || p.includes('assistant') || p.includes('infirm')) return 'support'
    return 'operationnel'
  }

  const LEVELS = [
    { key: 'direction', label: 'Direction', color: 'from-[#27698a] to-[#1f5570]', badge: 'bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20' },
    { key: 'management', label: 'Management', color: 'from-[#478e5e] to-[#3a7549]', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { key: 'expert', label: 'Experts', color: 'from-[#96783c] to-[#7d6432]', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
    { key: 'operationnel', label: 'Opérationnel', color: 'from-[#b94659] to-[#9c3a4a]', badge: 'bg-red-100 text-red-700 border-red-200' },
    { key: 'support', label: 'Support', color: 'from-[#435862] to-[#334248]', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  ]

  const grouped: Record<string, Employee[]> = {
    direction: [],
    management: [],
    expert: [],
    operationnel: [],
    support: [],
  }
  employees.forEach(e => {
    const cat = categorize(e.poste)
    grouped[cat].push(e)
  })

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse h-64 bg-slate-200 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Network className="w-6 h-6 text-[#27698a]" />
          Organigramme
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Structure hiérarchique de Demo SARL · {employees.length} employés
        </p>
      </div>

      {/* Stats par niveau */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {LEVELS.map(level => (
          <Card key={level.key} className="p-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${level.color} flex items-center justify-center text-white`}>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{grouped[level.key].length}</div>
                <div className="text-xs text-slate-500">{level.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Organigramme visuel */}
      <div className="space-y-6">
        {LEVELS.map((level, levelIdx) => {
          const levelEmployees = grouped[level.key]
          if (levelEmployees.length === 0) return null

          return (
            <div key={level.key}>
              {/* Ligne de connexion */}
              {levelIdx > 0 && (
                <div className="flex justify-center mb-4">
                  <div className="w-px h-8 bg-slate-300"></div>
                </div>
              )}

              {/* Niveau */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={level.badge}>{level.label}</Badge>
                <span className="text-xs text-slate-500">{levelEmployees.length} employé{levelEmployees.length > 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {levelEmployees.map(emp => (
                  <Card key={emp.id} className="p-3 hover:shadow-md transition-shadow group">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${level.color} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                        {emp.prenoms[0]}{emp.nom[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-slate-900 truncate">
                          {emp.nom} {emp.prenoms}
                        </div>
                        <div className="text-xs text-slate-600 truncate">{emp.poste}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {emp.matricule} · {emp.contract?.type || 'CDI'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Légende */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900 text-sm">Légende</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          {LEVELS.map(level => (
            <div key={level.key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded bg-gradient-to-br ${level.color}`}></div>
              <span className="text-slate-700">{level.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
