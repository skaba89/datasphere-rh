'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, FileSpreadsheet, Download, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

interface ImportModalProps {
  onClose: () => void
  onImported: () => void
}

interface ImportRow {
  nom: string
  prenoms: string
  matricule?: string
  cnssNumero?: string
  sexe?: string
  telephone?: string
  email?: string
  poste: string
  dateEmbauche: string
  salaireBase: number
  contractType: string
}

interface ImportResult {
  dryRun: boolean
  totalRows: number
  validCount?: number
  created?: number
  errorCount: number
  errors: Array<{ row: number; field: string; message: string }>
  preview?: Array<Record<string, unknown>>
}

export function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows] = useState<ImportRow[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setFileName(file.name)
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      // Mapping flexible
      const mapped: ImportRow[] = json.map((r) => ({
        nom: String(r['nom'] || r['Nom'] || r['NOM'] || '').trim(),
        prenoms: String(r['prenoms'] || r['Prénoms'] || r['PRENOMS'] || '').trim(),
        matricule: String(r['matricule'] || r['Matricule'] || '').trim() || undefined,
        cnssNumero: String(r['cnss'] || r['CNSS'] || r['cnss_numero'] || '').trim() || undefined,
        sexe: String(r['sexe'] || r['Sexe'] || 'M').trim().toUpperCase().slice(0, 1),
        telephone: String(r['telephone'] || r['Téléphone'] || '').trim() || undefined,
        email: String(r['email'] || r['Email'] || '').trim() || undefined,
        poste: String(r['poste'] || r['Poste'] || '').trim(),
        dateEmbauche: String(r['date_embauche'] || r['dateEmbauche'] || r['Date embauche'] || '').trim(),
        salaireBase: Number(r['salaire_base'] || r['salaireBase'] || r['Salaire'] || 0),
        contractType: String(r['contract_type'] || r['type_contrat'] || r['Contrat'] || 'CDI').trim().toUpperCase(),
      }))

      setRows(mapped)
      setStep('preview')
      toast.success(`${mapped.length} lignes détectées dans ${file.name}`)
    } catch (e) {
      toast.error('Erreur lors de la lecture du fichier Excel')
      console.error(e)
    }
    setLoading(false)
  }

  const handleDryRun = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, dryRun: true }),
      })
      const data: ImportResult = await res.json()
      setResult(data)
      toast.info(`${data.validCount} valides, ${data.errorCount} erreurs`)
    } catch {
      toast.error('Erreur lors de la validation')
    }
    setLoading(false)
  }

  const handleCommit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, dryRun: false }),
      })
      const data: ImportResult = await res.json()
      setResult(data)
      if (data.created && data.created > 0) {
        toast.success(`${data.created} employés créés avec succès`)
        setStep('done')
      } else {
        toast.error('Aucun employé créé')
      }
    } catch {
      toast.error('Erreur lors de l\'import')
    }
    setLoading(false)
  }

  const downloadTemplate = () => {
    const template = [
      { nom: 'Diallo', prenoms: 'Mamadou', matricule: 'IMP-001', cnssNumero: '1234567890', sexe: 'M', telephone: '+224 622 000 001', email: 'mamadou.diallo@demo.gn', poste: 'Directeur Technique', dateEmbauche: '2024-01-15', salaireBase: 5000000, contractType: 'CDI' },
      { nom: 'Camara', prenoms: 'Aïssatou', matricule: 'IMP-002', cnssNumero: '1234567891', sexe: 'F', telephone: '+224 622 000 002', email: 'aissatou.camara@demo.gn', poste: 'Responsable RH', dateEmbauche: '2024-02-01', salaireBase: 3500000, contractType: 'CDI' },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Employés')
    XLSX.writeFile(wb, 'modele_import_employes.xlsx')
    toast.success('Modèle téléchargé')
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#27698a]" />
            Import d'employés en masse
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#27698a] hover:bg-[#27698a]/5 transition-colors cursor-pointer"
              onClick={() => inputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
              onDragOver={(e) => e.preventDefault()}
            >
              {loading ? (
                <Loader2 className="w-12 h-12 mx-auto text-[#27698a] animate-spin" />
              ) : (
                <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              )}
              <p className="font-medium text-slate-900">
                {loading ? 'Lecture en cours...' : 'Glissez un fichier Excel ici ou cliquez pour parcourir'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Formats supportés : .xlsx, .xls, .csv
              </p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Télécharger le modèle
              </Button>
              <span className="text-xs text-slate-500">
                Colonnes attendues : nom, prenoms, poste, date_embauche, salaire_base, contract_type
              </span>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{fileName}</p>
                <p className="text-xs text-slate-500">{rows.length} lignes détectées</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                <X className="w-4 h-4 mr-1" />
                Changer
              </Button>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">Nom</th>
                      <th className="px-2 py-2 text-left">Prénoms</th>
                      <th className="px-2 py-2 text-left hidden">Matricule</th>
                      <th className="px-2 py-2 text-left">Poste</th>
                      <th className="px-2 py-2 text-right">Salaire</th>
                      <th className="px-2 py-2 text-left">Contrat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="px-2 py-1.5">{r.nom}</td>
                        <td className="px-2 py-1.5">{r.prenoms}</td>
                        <td className="px-2 py-1.5 hidden">{r.matricule || '—'}</td>
                        <td className="px-2 py-1.5">{r.poste}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{r.salaireBase.toLocaleString()}</td>
                        <td className="px-2 py-1.5">{r.contractType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && (
                <div className="p-2 text-center text-xs text-slate-500 bg-slate-50">
                  ... et {rows.length - 50} autres lignes
                </div>
              )}
            </Card>

            {result && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <StatPill label="Valides" value={result.validCount || 0} color="text-emerald-600" />
                  <StatPill label="Erreurs" value={result.errorCount} color="text-red-600" />
                  <StatPill label="Total" value={result.totalRows} color="text-slate-700" />
                </div>
                {result.errors.length > 0 && (
                  <Card className="p-3 max-h-32 overflow-y-auto">
                    <div className="text-xs font-semibold text-red-700 mb-2">Erreurs détectées :</div>
                    {result.errors.map((e, i) => (
                      <div key={i} className="text-xs text-red-600 py-0.5">
                        Ligne {e.row} · <span className="font-medium">{e.field}</span> : {e.message}
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'done' && result && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#478e5e] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Import terminé !</h3>
            <p className="text-sm text-slate-600">
              {result.created} employé{result.created !== 1 ? 's' : ''} créé{result.created !== 1 ? 's' : ''} avec succès
            </p>
            {result.errorCount > 0 && (
              <p className="text-xs text-amber-700 mt-2">
                {result.errorCount} ligne(s) en erreur ignorée(s)
              </p>
            )}
          </div>
        )}

        {step !== 'done' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            {step === 'preview' && !result && (
              <Button onClick={handleDryRun} disabled={loading || rows.length === 0} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
                Valider (dry-run)
              </Button>
            )}
            {step === 'preview' && result && (
              <Button
                onClick={handleCommit}
                disabled={loading || (result.validCount || 0) === 0}
                className="bg-[#478e5e] hover:bg-[#3a7549]"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Importer {result.validCount} employé{(result.validCount || 0) > 1 ? 's' : ''}
              </Button>
            )}
          </DialogFooter>
        )}

        {step === 'done' && (
          <DialogFooter>
            <Button onClick={onImported} className="bg-[#27698a] hover:bg-[#1f5570]">
              Voir les employés
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
