'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Briefcase, Calendar, FileText, Wallet, X, Phone, Mail, MapPin, Award, Clock } from 'lucide-react'
import { formatDate, formatGNF, CONTRACT_TYPES, LEAVE_TYPES, LEAVE_STATUS } from '@/lib/utils-rh'

interface EmployeeDetail {
  id: string
  matricule: string
  nom: string
  prenoms: string
  cnssNumero: string | null
  dateNaissance: string | null
  sexe: string | null
  situationFamiliale: string | null
  nombreEnfants: number
  telephone: string | null
  email: string | null
  poste: string
  dateEmbauche: string
  dateSortie: string | null
  statut: string
  company: { id: string; raisonSociale: string; sigle: string | null }
  contracts: Array<{
    id: string
    type: string
    dateDebut: string
    dateFin: string | null
    poste: string
    salaireBase: number
    status: string
  }>
  leaveRequests: Array<{
    id: string
    type: string
    dateDebut: string
    dateFin: string
    motif: string | null
    statut: string
  }>
  payslips: Array<{
    id: string
    mois: number
    annee: number
    netAPayer: number
    createdAt: string
  }>
}

interface Props {
  employeeId: string | null
  onClose: () => void
}

export function EmployeeDetailModal({ employeeId, onClose }: Props) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  // Loading est true tant qu'on attend la première réponse pour cet ID
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const loading = employeeId && employeeId !== loadedId

  useEffect(() => {
    if (!employeeId) return
    let mounted = true
    fetch(`/api/employees/${employeeId}`)
      .then(r => r.json())
      .then(d => { if (mounted) { setEmployee(d); setLoadedId(employeeId) } })
      .catch(() => { if (mounted) { setEmployee(null); setLoadedId(employeeId) } })
    return () => { mounted = false }
  }, [employeeId])

  return (
    <Dialog open={!!employeeId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        {loading && (
          <div className="p-8 text-center text-slate-500">Chargement...</div>
        )}

        {!loading && employee && (
          <>
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-[#27698a]/5 to-transparent">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                  employee.sexe === 'F' ? 'bg-pink-500' : 'bg-[#27698a]'
                }`}>
                  {employee.prenoms[0]}{employee.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900">
                    {employee.nom} {employee.prenoms}
                  </h2>
                  <p className="text-sm text-slate-600">{employee.poste}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Matricule : {employee.matricule}
                    </Badge>
                    <Badge variant="outline" className={
                      employee.statut === 'actif'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }>
                      {employee.statut === 'actif' ? '● Actif' : '○ Inactif'}
                    </Badge>
                    {employee.contracts[0] && (
                      <Badge variant="outline" className={CONTRACT_TYPES[employee.contracts[0].type]?.color}>
                        {CONTRACT_TYPES[employee.contracts[0].type]?.label}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {employee.company.raisonSociale}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
              <div className="px-5 pt-3 border-b border-slate-200">
                <TabsList className="bg-transparent p-0 h-auto">
                  <TabsTrigger value="info" className="text-xs data-[state=active]:bg-[#27698a]/10">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    Informations
                  </TabsTrigger>
                  <TabsTrigger value="contracts" className="text-xs data-[state=active]:bg-[#27698a]/10">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                    Contrats ({employee.contracts.length})
                  </TabsTrigger>
                  <TabsTrigger value="leaves" className="text-xs data-[state=active]:bg-[#27698a]/10">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    Congés ({employee.leaveRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="payslips" className="text-xs data-[state=active]:bg-[#27698a]/10">
                    <Wallet className="w-3.5 h-3.5 mr-1.5" />
                    Bulletins ({employee.payslips.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-5 overflow-y-auto max-h-[60vh]">
                {/* Informations */}
                <TabsContent value="info" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoCard icon={Award} label="Numéro CNSS" value={employee.cnssNumero || '—'} />
                    <InfoCard icon={User} label="Sexe" value={employee.sexe === 'F' ? 'Féminin' : employee.sexe === 'M' ? 'Masculin' : '—'} />
                    <InfoCard icon={User} label="Date de naissance" value={employee.dateNaissance ? formatDate(employee.dateNaissance) : '—'} />
                    <InfoCard icon={User} label="Situation" value={employee.situationFamiliale || '—'} />
                    <InfoCard icon={User} label="Enfants" value={String(employee.nombreEnfants)} />
                    <InfoCard icon={Mail} label="Email" value={employee.email || '—'} />
                    <InfoCard icon={Phone} label="Téléphone" value={employee.telephone || '—'} />
                    <InfoCard icon={Briefcase} label="Poste" value={employee.poste} />
                    <InfoCard icon={Clock} label="Embauche" value={formatDate(employee.dateEmbauche)} />
                  </div>
                </TabsContent>

                {/* Contrats */}
                <TabsContent value="contracts" className="mt-0 space-y-3">
                  {employee.contracts.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-8">Aucun contrat</p>
                  )}
                  {employee.contracts.map((c, i) => (
                    <Card key={c.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={CONTRACT_TYPES[c.type]?.color}>
                            {CONTRACT_TYPES[c.type]?.label}
                          </Badge>
                          {i === 0 && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                              Actuel
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(c.dateDebut)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                        <div>
                          <div className="text-xs text-slate-500">Poste</div>
                          <div className="font-medium text-slate-900">{c.poste}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Salaire de base</div>
                          <div className="font-medium text-slate-900 font-mono">{formatGNF(c.salaireBase)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Date de début</div>
                          <div className="font-medium text-slate-900">{formatDate(c.dateDebut)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Date de fin</div>
                          <div className="font-medium text-slate-900">{c.dateFin ? formatDate(c.dateFin) : '—'}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {/* Congés */}
                <TabsContent value="leaves" className="mt-0 space-y-2">
                  {employee.leaveRequests.length === 0 && (
                    <p className="text-sm text-slate-400 italic text-center py-8">Aucune demande de congé</p>
                  )}
                  {employee.leaveRequests.map(l => {
                    const type = LEAVE_TYPES[l.type] || { label: l.type, color: '' }
                    const status = LEAVE_STATUS[l.statut] || { label: l.statut, color: '' }
                    return (
                      <Card key={l.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={type.color}>{type.label}</Badge>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {formatDate(l.dateDebut)} → {formatDate(l.dateFin)}
                            </div>
                            {l.motif && <div className="text-xs text-slate-500">{l.motif}</div>}
                          </div>
                        </div>
                        <Badge variant="outline" className={status.color}>{status.label}</Badge>
                      </Card>
                    )
                  })}
                </TabsContent>

                {/* Bulletins */}
                <TabsContent value="payslips" className="mt-0 space-y-2">
                  {employee.payslips.length === 0 && (
                    <Card className="p-6 text-center">
                      <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">Aucun bulletin de paie généré</p>
                      <p className="text-xs text-slate-400 mt-1">Les bulletins apparaîtront ici après calcul de paie</p>
                    </Card>
                  )}
                  {employee.payslips.map(p => (
                    <Card key={p.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            Bulletin {String(p.mois).padStart(2, '0')}/{p.annee}
                          </div>
                          <div className="text-xs text-slate-500">
                            Généré le {formatDate(p.createdAt.slice(0, 10))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#27698a] font-mono">{formatGNF(p.netAPayer)}</div>
                        <div className="text-[10px] text-slate-500">net à payer</div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium text-slate-900 truncate">{value}</div>
    </div>
  )
}
