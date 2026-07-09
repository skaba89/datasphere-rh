'use client'

import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2 } from 'lucide-react'

interface Company {
  id: string
  raisonSociale: string
  sigle: string | null
  ville: string | null
  _count?: { employees: number }
}

interface CompanySelectorProps {
  value: string
  onChange: (companyId: string) => void
}

export function CompanySelector({ value, onChange }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    let mounted = true
    fetch('/api/companies')
      .then(r => r.json())
      .then(d => { if (mounted) setCompanies(d) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  if (companies.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-slate-400" />
      <Select value={value || companies[0]?.id} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[180px] text-xs border-slate-200">
          <SelectValue placeholder="Société" />
        </SelectTrigger>
        <SelectContent>
          {companies.map(c => (
            <SelectItem key={c.id} value={c.id} className="text-xs">
              <div className="flex flex-col">
                <span className="font-medium">{c.raisonSociale}</span>
                <span className="text-[10px] text-slate-500">
                  {c.ville || '—'} · {c._count?.employees || 0} employés
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
