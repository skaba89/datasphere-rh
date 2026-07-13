'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FileText, Download, Printer, Loader2, Building2, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'
import { formatGNF } from '@/lib/utils-rh'

type ReportType = 'cnss_monthly' | 'its_annual' | 'solde_tout_compte'

export function FiscalReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('cnss_monthly')
  const [month, setMonth] = useState('2026-07')
  const [year, setYear] = useState('2026')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<any>(null)

  const generateReport = async () => {
    setLoading(true)
    setReport(null)
    try {
      const params = new URLSearchParams({ type: reportType })
      if (reportType === 'cnss_monthly') params.set('month', month)
      if (reportType === 'its_annual') params.set('year', year)
      if (reportType === 'solde_tout_compte') {
        // Pour la démo, prendre le premier employé
        const empRes = await fetch('/api/employees')
        const emps = await empRes.json()
        if (emps.length > 0) params.set('employeeId', emps[0].id)
      }

      const res = await fetch(`/api/reports/fiscal?${params}`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Échec de la génération')
      } else {
        setReport(data)
        toast.success('Rapport généré avec succès')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const reportTypes = [
    { key: 'cnss_monthly' as ReportType, label: 'Déclaration CNSS mensuelle', desc: 'Cotisations 5% salarié + 17% employeur', icon: Building2 },
    { key: 'its_annual' as ReportType, label: 'Déclaration ITS annuelle', desc: 'ITS 1,5% + VF 4% + taxes patronales', icon: Calendar },
    { key: 'solde_tout_compte' as ReportType, label: 'Solde de tout compte', desc: 'Reçu de fin de contrat légal', icon: Users },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Rapports fiscaux</h1>
        <p className="text-sm text-slate-500 mt-1">
          Documents conformes à la législation guinéenne (CNSS, ITS, Code du travail)
        </p>
      </div>

      {/* Sélection du type de rapport */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900">Type de rapport</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reportTypes.map(rt => {
            const Icon = rt.icon
            return (
              <button
                key={rt.key}
                onClick={() => setReportType(rt.key)}
                className={`text-left p-4 rounded-lg border transition-all ${
                  reportType === rt.key
                    ? 'border-[#27698a] bg-[#27698a]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    reportType === rt.key ? 'bg-[#27698a] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`font-medium text-sm ${reportType === rt.key ? 'text-[#27698a]' : 'text-slate-900'}`}>
                    {rt.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{rt.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Paramètres du rapport */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          {reportType === 'cnss_monthly' && (
            <div>
              <Label className="text-xs text-slate-500 font-medium">Mois</Label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          )}
          {reportType === 'its_annual' && (
            <div>
              <Label className="text-xs text-slate-500 font-medium">Année</Label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          )}
          <Button
            onClick={generateReport}
            disabled={loading}
            className="bg-[#27698a] hover:bg-[#1f5570] sm:col-span-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération...</>
            ) : (
              <><FileText className="w-4 h-4 mr-2" />Générer le rapport</>
            )}
          </Button>
        </div>
      </Card>

      {/* Affichage du rapport */}
      {report && (
        <Card className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{report.title}</h2>
              <p className="text-sm text-slate-500">{report.subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Imprimer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${report.type}_${Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export JSON
              </Button>
            </div>
          </div>

          {/* En-tête société */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Employeur</div>
              <div className="font-semibold text-slate-900">{report.company.raisonSociale}</div>
              <div className="text-xs text-slate-600 mt-1">{report.company.adresse || '—'}</div>
              <div className="text-xs text-slate-600">NIF : {report.company.nif || '—'} · RC : {report.company.rc || '—'}</div>
              <div className="text-xs text-slate-600">CNSS : {report.company.cnssNumero || '—'}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Période</div>
              <div className="font-semibold text-slate-900">{report.period.label}</div>
              <div className="text-xs text-slate-600 mt-1">Effectif : {report.totals.effectif} employé(s)</div>
              <div className="text-xs text-slate-600">Généré le : {new Date(report.generatedAt).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          {/* Tableau CNSS mensuel */}
          {report.type === 'cnss_monthly' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-slate-700">Matricule</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Nom</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">N° CNSS</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Salaire brut</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Assiette</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Salarié (5%)</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Employeur (17%)</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.lignes.map((l: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-mono">{l.matricule}</td>
                      <td className="px-3 py-2">{l.prenoms} {l.nom}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{l.cnssNumero}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.salaireBrut)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.assietteCnss)}</td>
                      <td className="px-3 py-2 text-right font-mono text-red-600">{formatGNF(l.cotisationSalarie)}</td>
                      <td className="px-3 py-2 text-right font-mono text-blue-600">{formatGNF(l.cotisationEmployeur)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatGNF(l.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={3} className="px-3 py-3">TOTAUX</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalSalaireBrut)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalAssiette)}</td>
                    <td className="px-3 py-3 text-right font-mono text-red-600">{formatGNF(report.totals.totalCotisationSalarie)}</td>
                    <td className="px-3 py-3 text-right font-mono text-blue-600">{formatGNF(report.totals.totalCotisationEmployeur)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalGeneral)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Tableau ITS annuel */}
          {report.type === 'its_annual' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-semibold text-slate-700">Matricule</th>
                    <th className="px-3 py-2 font-semibold text-slate-700">Nom</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Salaire annuel</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">ITS (1,5%)</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">VF (4%)</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Taxe appr. (1%)</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Form. pro (3%)</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">AT (2%)</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.lignes.map((l: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="px-3 py-2 font-mono">{l.matricule}</td>
                      <td className="px-3 py-2">{l.prenoms} {l.nom}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.salaireAnnuelBrut)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.its)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.versementForfaitaire)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.taxeApprentissage)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.formationPro)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatGNF(l.accidentTravail)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatGNF(l.totalCharges)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold">
                  <tr>
                    <td colSpan={2} className="px-3 py-3">TOTAUX</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalSalaireAnnuelBrut)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalIts)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalVersementForfaitaire)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalTaxeApprentissage)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalFormationPro)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalAccidentTravail)}</td>
                    <td className="px-3 py-3 text-right font-mono">{formatGNF(report.totals.totalGeneral)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Solde de tout compte */}
          {report.type === 'solde_tout_compte' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Employé</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-500">Matricule :</span> <span className="font-mono">{report.employee.matricule}</span></div>
                  <div><span className="text-slate-500">Nom :</span> <span className="font-semibold">{report.employee.prenoms} {report.employee.nom}</span></div>
                  <div><span className="text-slate-500">Poste :</span> {report.employee.poste}</div>
                  <div><span className="text-slate-500">Contrat :</span> {report.employee.typeContrat}</div>
                  <div><span className="text-slate-500">Embauche :</span> {report.employee.dateEmbauche}</div>
                  <div><span className="text-slate-500">Fin :</span> {report.employee.dateFin}</div>
                </div>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-semibold text-slate-700">Élément</th>
                    <th className="px-4 py-2 font-semibold text-slate-700 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2">Salaire brut (prorata)</td>
                    <td className="px-4 py-2 text-right font-mono">{report.formattedElements.salaireBrutMois}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2">Primes</td>
                    <td className="px-4 py-2 text-right font-mono">{report.formattedElements.primes}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2">Congés payés compensateurs</td>
                    <td className="px-4 py-2 text-right font-mono">{report.formattedElements.congesPayes}</td>
                  </tr>
                  {report.elements.indemniteFinContrat > 0 && (
                    <tr className="border-b border-slate-100">
                      <td className="px-4 py-2">Indemnité de fin de contrat (6%)</td>
                      <td className="px-4 py-2 text-right font-mono">{report.formattedElements.indemniteFinContrat}</td>
                    </tr>
                  )}
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-2">Indemnité compensatrice de préavis</td>
                    <td className="px-4 py-2 text-right font-mono">{report.formattedElements.indemniteCompensatrice}</td>
                  </tr>
                  <tr className="border-b-2 border-slate-200 font-semibold bg-slate-50">
                    <td className="px-4 py-2">TOTAL BRUT</td>
                    <td className="px-4 py-2 text-right font-mono">{report.formattedElements.totalBrut}</td>
                  </tr>
                  <tr className="border-b border-slate-100 text-red-700">
                    <td className="px-4 py-2">CNSS salarié (5%)</td>
                    <td className="px-4 py-2 text-right font-mono">- {report.formattedElements.cnssSalarie}</td>
                  </tr>
                  <tr className="border-b-2 border-slate-200 text-red-700">
                    <td className="px-4 py-2">ITS (1,5%)</td>
                    <td className="px-4 py-2 text-right font-mono">- {report.formattedElements.its}</td>
                  </tr>
                  <tr className="font-bold text-lg bg-[#27698a]/5">
                    <td className="px-4 py-3">NET À PAYER</td>
                    <td className="px-4 py-3 text-right font-mono text-[#27698a]">{report.formattedElements.netAPayer}</td>
                  </tr>
                </tbody>
              </table>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900 italic">
                {report.mention}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="text-center">
                  <div className="border-t border-slate-300 pt-2 text-xs text-slate-500">
                    Signature de l'employeur<br/>(cachet)
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-300 pt-2 text-xs text-slate-500">
                    Signature de l'employé<br/>(précédée de la mention manuscrite « Pour solde de tout compte »)
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
