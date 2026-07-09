'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Download, Filter, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { formatGNF, formatDate, CONTRACT_TYPES } from '@/lib/utils-rh'

interface Employee {
  id: string
  matricule: string
  nom: string
  prenoms: string
  cnssNumero: string | null
  poste: string
  dateEmbauche: string
  statut: string
  sexe: string | null
  contract?: {
    type: string
    salaireBase: number
  } | null
}

export function EmployeesPage({ onCreate, onSelect, onImport }: {
  onCreate?: () => void
  onSelect?: (id: string) => void
  onImport?: () => void
}) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const load = () => {
    setLoading(true)
    fetch('/api/employees')
      .then(r => r.json())
      .then(d => { setEmployees(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/employees')
      .then(r => r.json())
      .then(d => { if (mounted) { setEmployees(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const filtered = employees.filter(e => {
    if (search && !`${e.nom} ${e.prenoms} ${e.matricule} ${e.cnssNumero || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'all' && e.statut !== filterStatus) return false
    if (filterType !== 'all' && (!e.contract || e.contract.type !== filterType)) return false
    return true
  })

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Employés</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} employé{filtered.length > 1 ? 's' : ''} · Demo SARL
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onImport?.()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => onCreate?.()}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel employé
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3 lg:p-4">
        <div className="flex flex-wrap gap-2 lg:gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, matricule, CNSS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="actif">Actif</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
              <SelectItem value="sorti">Sorti</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Contrat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous contrats</SelectItem>
              <SelectItem value="CDI">CDI</SelectItem>
              <SelectItem value="CDD">CDD</SelectItem>
              <SelectItem value="STAGE">Stage</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-slate-700">Employé</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">Matricule</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden lg:table-cell">CNSS</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">Poste</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Contrat</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden lg:table-cell">Salaire base</th>
                <th className="px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">Embauche</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const contractType = e.contract?.type || 'CDI'
                const contractInfo = CONTRACT_TYPES[contractType]
                return (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onSelect?.(e.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${
                          e.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'
                        }`}>
                          {e.prenoms[0]}{e.nom[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {e.nom} {e.prenoms}
                          </div>
                          <div className="text-xs text-slate-500 md:hidden">
                            {e.poste} · {e.matricule}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-600">
                      {e.matricule}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-slate-600">
                      {e.cnssNumero || '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-700">
                      {e.poste}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={contractInfo.color}>
                        {contractInfo.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700 font-mono text-xs">
                      {e.contract ? formatGNF(e.contract.salaireBase) : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600 text-xs">
                      {formatDate(e.dateEmbauche)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={
                        e.statut === 'actif'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }>
                        {e.statut === 'actif' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Aucun employé ne correspond à votre recherche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Affichage {filtered.length} / {employees.length} employés
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
