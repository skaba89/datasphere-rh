'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, FileText, Calendar, Clock, Wallet, Download, TrendingUp, Award, Lock } from 'lucide-react'
import { formatGNF, formatDate, LEAVE_TYPES, LEAVE_STATUS, CONTRACT_TYPES } from '@/lib/utils-rh'

export function EmployeePortalPage() {
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    // Charge le premier employé comme "employé connecté" (simulation)
    fetch('/api/employees')
      .then(r => r.json())
      .then(d => {
        if (mounted && d.length > 0) {
          // Charge le détail complet
          fetch(`/api/employees/${d[0].id}`)
            .then(r => r.json())
            .then(emp => { if (mounted) { setEmployee(emp); setLoading(false) } })
            .catch(() => { if (mounted) setLoading(false) })
        } else if (mounted) {
          setLoading(false)
        }
      })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!employee) {
    return <div className="p-6 text-center text-slate-500">Aucun employé trouvé</div>
  }

  const contract = employee.contracts?.[0]
  const contractType = contract?.type || 'CDI'
  const contractInfo = CONTRACT_TYPES[contractType]

  // Simulation données
  const soldesConges = { acquis: 22.5, pris: 7.5, disponible: 15, enAttente: 2 }
  const derniersBulletins = [
    { mois: 'Juin 2026', net: 3391684, periode: '2026-06' },
    { mois: 'Mai 2026', net: 3391684, periode: '2026-05' },
    { mois: 'Avril 2026', net: 3350000, periode: '2026-04' },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <User className="w-6 h-6 text-[#27698a]" />
          Mon portail employé
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Espace self-service · {employee.company?.raisonSociale}
        </p>
      </div>

      {/* Carte profil */}
      <Card className="p-5 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0 ${
            employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'
          }`}>
            {employee.prenoms[0]}{employee.nom[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">{employee.nom} {employee.prenoms}</h2>
            <p className="text-sm text-slate-600">{employee.poste}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{employee.matricule}</Badge>
              <Badge variant="outline" className="text-xs">CNSS : {employee.cnssNumero || '—'}</Badge>
              {contract && (
                <Badge variant="outline" className={contractInfo.color}>{contractInfo.label}</Badge>
              )}
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                ● {employee.statut === 'actif' ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <InfoItem icon={Calendar} label="Embauche" value={formatDate(employee.dateEmbauche)} />
              <InfoItem icon={Wallet} label="Salaire base" value={contract ? formatGNF(contract.salaireBase) : '—'} />
              <InfoItem icon={User} label="Email" value={employee.email || '—'} />
              <InfoItem icon={User} label="Téléphone" value={employee.telephone || '—'} />
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Calendar} label="Congés disponibles" value={`${soldesConges.disponible} j`} sub={`${soldesConges.acquis} acquis · ${soldesConges.pris} pris`} color="#27698a" />
        <KpiCard icon={Clock} label="En attente" value={`${soldesConges.enAttente} j`} sub="demandes non traitées" color="#96783c" />
        <KpiCard icon={Wallet} label="Net Juin 2026" value={formatGNF(derniersBulletins[0].net)} sub="dernier bulletin" color="#478e5e" />
        <KpiCard icon={Award} label="Ancienneté" value={`${Math.floor((Date.now() - new Date(employee.dateEmbauche).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} an(s)`} sub="dans l'entreprise" color="#b94659" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Mes bulletins */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#27698a]" />
              Mes bulletins de paie
            </h2>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Tout télécharger
            </Button>
          </div>
          <div className="space-y-2">
            {derniersBulletins.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#27698a]/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#27698a]" />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-slate-900">{b.mois}</div>
                    <div className="text-xs text-slate-500">Bulletin de paie</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-[#27698a]">{formatGNF(b.net)}</div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Mes congés */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#27698a]" />
              Mes demandes de congé
            </h2>
            <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Nouvelle demande
            </Button>
          </div>
          <div className="space-y-2">
            {employee.leaveRequests?.slice(0, 5).map((leave: any) => {
              const type = LEAVE_TYPES[leave.type] || { label: leave.type, color: '' }
              const status = LEAVE_STATUS[leave.statut] || { label: leave.statut, color: '' }
              return (
                <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={type.color}>{type.label}</Badge>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {formatDate(leave.dateDebut)} → {formatDate(leave.dateFin)}
                      </div>
                      {leave.motif && <div className="text-xs text-slate-500">{leave.motif}</div>}
                    </div>
                  </div>
                  <Badge variant="outline" className={status.color}>{status.label}</Badge>
                </div>
              )
            })}
            {(!employee.leaveRequests || employee.leaveRequests.length === 0) && (
              <p className="text-sm text-slate-400 italic text-center py-4">Aucune demande de congé</p>
            )}
          </div>
        </Card>
      </div>

      {/* Solde congés détaillé */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#27698a]" />
          Solde de congés payés
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SoldeCard label="Acquis (an)" value={soldesConges.acquis} max={30} color="bg-[#27698a]" />
          <SoldeCard label="Pris" value={soldesConges.pris} max={30} color="bg-[#b94659]" />
          <SoldeCard label="Disponible" value={soldesConges.disponible} max={30} color="bg-[#478e5e]" />
          <SoldeCard label="En attente" value={soldesConges.enAttente} max={10} color="bg-[#96783c]" />
        </div>
      </Card>

      {/* Mes documents */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#27698a]" />
          Mes documents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {employee.documents?.slice(0, 6).map((doc: any) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{doc.name}</div>
                <div className="text-xs text-slate-500">{doc.type} · {doc.category}</div>
              </div>
              {doc.confidential && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700"><Lock className="w-3 h-3" /></Badge>}
              <Button variant="ghost" size="sm" className="h-7">
                <Download className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {(!employee.documents || employee.documents.length === 0) && (
            <p className="text-sm text-slate-400 italic col-span-2 text-center py-4">Aucun document</p>
          )}
        </div>
      </Card>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-medium text-slate-900 mt-0.5 truncate">{value}</div>
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{label}</p>
          <p className="text-base lg:text-lg font-bold text-slate-900 mt-1 truncate">{value}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sub}</p>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  )
}

function SoldeCard({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="p-3 rounded-lg border border-slate-200">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-900">{value} <span className="text-xs text-slate-500">jours</span></div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
