'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, FileText, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { formatGNF, calculatePayroll } from '@/lib/utils-rh'
import { toast } from 'sonner'

const DEFAULT_PARAMS = {
  tauxCnssSalarie: 0.05,
  tauxCnssEmployeur: 0.17,
  plafondCnss: 4640000,
  smig: 580000,
  tauxRts: 0.015,
  tauxVersementForfaitaire: 0.04,
  tauxTaxeApprentissage: 0.01,
  tauxFormationPro: 0.03,
  tauxAccidentTravail: 0.02,
}

export function PayrollPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Paie & CNSS Guinée</h1>
        <p className="text-sm text-slate-500 mt-1">
          Moteur de calcul de paie paramétrable — workflow 8 étapes conforme à la CNSS Guinée
        </p>
      </div>

      <Tabs defaultValue="simulator">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-2xl">
          <TabsTrigger value="simulator" className="text-xs lg:text-sm">
            <Calculator className="w-4 h-4 mr-2" />
            Simulateur
          </TabsTrigger>
          <TabsTrigger value="periods" className="text-xs lg:text-sm">
            <FileText className="w-4 h-4 mr-2" />
            Périodes
          </TabsTrigger>
          <TabsTrigger value="payslips" className="text-xs lg:text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Bulletins
          </TabsTrigger>
          <TabsTrigger value="params" className="text-xs lg:text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulator" className="mt-6">
          <PayrollSimulator />
        </TabsContent>
        <TabsContent value="periods" className="mt-6">
          <PeriodsList />
        </TabsContent>
        <TabsContent value="payslips" className="mt-6">
          <PayslipsList />
        </TabsContent>
        <TabsContent value="params" className="mt-6">
          <CnssParamsEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PayrollSimulator() {
  const [form, setForm] = useState({
    salaireBase: 3000000,
    primes: 200000,
    heuresSup: 108175,
    avantagesNature: 300000,
    indemnitesNonImposables: 100000,
    retenuesDiverses: 0,
  })
  const [employeeInfo, setEmployeeInfo] = useState({
    nom: 'Diallo',
    prenoms: 'Mamadou',
    matricule: 'DS-001',
    cnss: '1234567890',
    poste: 'Directeur Technique',
    contratType: 'CDI',
    dateEmbauche: '2020-03-15',
  })
  const [generating, setGenerating] = useState(false)

  const result = calculatePayroll({ ...form, cnssParams: DEFAULT_PARAMS })
  const plafondAtteint = form.salaireBase + form.primes + form.heuresSup + form.avantagesNature - form.indemnitesNonImposables >= DEFAULT_PARAMS.plafondCnss

  const generatePayslip = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/payroll/generate-payslip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...employeeInfo,
          periode: 'Juillet 2026',
          ...form,
          ...result,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        // Ouvrir le HTML dans un nouvel onglet
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(data.html)
          newWindow.document.close()
          toast.success('Bulletin PDF généré — ouvert dans un nouvel onglet')
        } else {
          toast.error('Autorisez les popups pour voir le bulletin')
        }
      } else {
        toast.error('Erreur lors de la génération')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setGenerating(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#27698a]" />
            Éléments de paie
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Modifiez les valeurs pour simuler un bulletin de paie
          </p>
        </div>

        {/* Infos employé (simulation) */}
        <div className="p-3 rounded-lg bg-[#27698a]/5 border border-[#27698a]/20">
          <div className="text-xs font-semibold text-slate-700 mb-2">Employé simulé</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-slate-500">Nom</div>
              <input
                className="w-full mt-0.5 px-2 py-1 rounded border border-slate-200 bg-white text-slate-900"
                value={`${employeeInfo.nom} ${employeeInfo.prenoms}`}
                onChange={e => {
                  const parts = e.target.value.split(' ')
                  setEmployeeInfo({ ...employeeInfo, nom: parts[0] || '', prenoms: parts.slice(1).join(' ') || '' })
                }}
              />
            </div>
            <div>
              <div className="text-slate-500">Poste</div>
              <input
                className="w-full mt-0.5 px-2 py-1 rounded border border-slate-200 bg-white text-slate-900"
                value={employeeInfo.poste}
                onChange={e => setEmployeeInfo({ ...employeeInfo, poste: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <FormField
            label="Salaire de base"
            value={form.salaireBase}
            onChange={v => setForm({ ...form, salaireBase: v })}
            hint="Salaire contractuel brut"
          />
          <FormField
            label="Primes imposables"
            value={form.primes}
            onChange={v => setForm({ ...form, primes: v })}
            hint="Prime de rendement, ancienneté, etc."
          />
          <FormField
            label="Heures supplémentaires (montant majoré)"
            value={form.heuresSup}
            onChange={v => setForm({ ...form, heuresSup: v })}
            hint="5 HS × 17 308 × 1,25 = 108 175 GNF"
          />
          <FormField
            label="Avantages en nature"
            value={form.avantagesNature}
            onChange={v => setForm({ ...form, avantagesNature: v })}
            hint="Logement, véhicule, nourriture"
          />
          <FormField
            label="Indemnités non imposables"
            value={form.indemnitesNonImposables}
            onChange={v => setForm({ ...form, indemnitesNonImposables: v })}
            hint="Transport, représentation (exonérées)"
          />
          <FormField
            label="Retenues diverses"
            value={form.retenuesDiverses}
            onChange={v => setForm({ ...form, retenuesDiverses: v })}
            hint="Avances, saisies-arrêts, etc."
          />
        </div>

        <div className="pt-3 border-t border-slate-200">
          <Button
            className="w-full bg-[#27698a] hover:bg-[#1f5570]"
            onClick={generatePayslip}
            disabled={generating}
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {generating ? 'Génération...' : 'Générer bulletin PDF'}
          </Button>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Le bulletin s'ouvre dans un nouvel onglet — utilisable avec Ctrl+P pour PDF
          </p>
        </div>
      </Card>

      {/* Results */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900">Résultat du calcul</h2>
          <span className="text-xs text-slate-500">Workflow 8 étapes</span>
        </div>

        {plafondAtteint && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            ⚠️ Plafond CNSS atteint ({formatGNF(DEFAULT_PARAMS.plafondCnss)}) — cotisations plafonnées
          </div>
        )}

        <div className="space-y-1">
          <ResultRow label="Salaire brut" value={result.salaireBrut} highlight />
          <ResultRow label="Brut imposable" value={result.salaireBrutImposable} sub="Brut - indemnités exonérées" />

          <div className="my-2 border-t border-dashed border-slate-200"></div>
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-3 py-1">
            Retenues salarié
          </div>
          <ResultRow label="CNSS salarié (5%)" value={-result.cnssSalarie} sub="Plafonné 8×SMIG" negative />
          <ResultRow label="RTS (1%)" value={-result.rts} sub="Impôt sur salaire" negative />

          <div className="my-2 border-t border-dashed border-slate-200"></div>
          <ResultRow label="NET À PAYER" value={result.netAPayer} big highlight />

          <div className="my-2 border-t border-dashed border-slate-200"></div>
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-3 py-1">
            Charges employeur (informatives)
          </div>
          <ResultRow label="CNSS employeur (8%)" value={result.cnssEmployeur} />
          <ResultRow label="Versement forfaitaire (4%)" value={result.versementForfaitaire} />
          <ResultRow label="Taxe apprentissage (1%)" value={result.taxeApprentissage} />
          <ResultRow label="Formation pro (3%)" value={result.formationPro} />
          <ResultRow label="Accident travail (2%)" value={result.accidentTravail} />

          <div className="my-2 border-t border-dashed border-slate-200"></div>
          <ResultRow label="Total charges patronales" value={result.totalChargesPatronales} sub="Somme ci-dessus" />
          <ResultRow label="Coût total employeur" value={result.coutTotalEmployeur} highlight />
        </div>

        <div className="mt-4 p-3 rounded-lg bg-[#27698a]/5 border border-[#27698a]/20">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Taux de charges effectif</span>
            <span className="font-bold text-[#27698a]">
              {result.salaireBrut > 0
                ? ((result.totalChargesPatronales / result.salaireBrut) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

function FormField({ label, value, onChange, hint }: {
  label: string
  value: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <div className="relative mt-1">
        <Input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="pr-12 font-mono"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">GNF</span>
      </div>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

function ResultRow({ label, value, sub, highlight, negative, big }: {
  label: string
  value: number
  sub?: string
  highlight?: boolean
  negative?: boolean
  big?: boolean
}) {
  const isNegative = value < 0
  return (
    <div className={`flex items-start justify-between px-3 py-1.5 rounded ${
      highlight ? 'bg-slate-50' : ''
    } ${big ? 'py-3' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className={`text-sm ${highlight ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
          {label}
        </div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
      <div className={`font-mono text-sm ml-3 ${
        big ? 'text-lg font-bold' : ''
      } ${
        isNegative
          ? 'text-red-600'
          : highlight
          ? 'text-[#27698a] font-semibold'
          : 'text-slate-700'
      }`}>
        {formatGNF(Math.abs(value))}
      </div>
    </div>
  )
}

function PeriodsList() {
  const periods = [
    { mois: 'Juillet 2026', status: 'OUVERTE', employees: 8, brut: 24630000 },
    { mois: 'Juin 2026', status: 'CLOTUREE', employees: 8, brut: 24150000 },
    { mois: 'Mai 2026', status: 'CLOTUREE', employees: 8, brut: 23980000 },
    { mois: 'Avril 2026', status: 'CLOTUREE', employees: 7, brut: 21420000 },
  ]

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold text-slate-700">Période</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Statut</th>
              <th className="px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">Employés</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Masse salariale brute</th>
              <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {periods.map(p => (
              <tr key={p.mois} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.mois}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    p.status === 'CLOTUREE'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {p.status === 'CLOTUREE' ? 'Clôturée' : 'Ouverte'}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-slate-700">{p.employees}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{formatGNF(p.brut)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Calculer
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Bulletins
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function PayslipsList() {
  return (
    <Card className="p-8 text-center text-slate-500">
      <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
      <p className="font-medium text-slate-700">Aucun bulletin généré pour juillet 2026</p>
      <p className="text-sm mt-1">Lancez le calcul de paie pour la période active</p>
      <Button className="mt-4 bg-[#27698a] hover:bg-[#1f5570]">
        Lancer le calcul
      </Button>
    </Card>
  )
}

function CnssParamsEditor() {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">Paramètres CNSS Guinée</h2>
        <p className="text-xs text-slate-500 mt-1">
          Taux configurables par tenant — date d'effet 01/01/2024
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <ParamCard label="CNSS salarié" value="5%" hint="Plafonné 8×SMIG" />
        <ParamCard label="CNSS employeur" value="17%" hint="Plafonné 8×SMIG" />
        <ParamCard label="ITS/RTS" value="1,5%" hint="Impôt sur salaire" />
        <ParamCard label="Versement forfaitaire" value="4%" hint="Charge employeur" />
        <ParamCard label="Taxe apprentissage" value="1%" hint="Annuel" />
        <ParamCard label="Formation pro" value="3%" hint="Annuel" />
        <ParamCard label="Plafond CNSS" value={formatGNF(4640000)} hint="8 × SMIG" />
        <ParamCard label="SMIG mensuel" value={formatGNF(580000)} hint="Valeur 2024" />
        <ParamCard label="Accident travail" value="2%" hint="Selon risque" />
      </div>
      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        ⚠️ Toute modification crée une nouvelle version des paramètres avec date d'effet.
        Les périodes déjà clôturées ne sont pas recalculées.
      </div>
    </Card>
  )
}

function ParamCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-slate-900 mt-1 font-mono">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
    </div>
  )
}
