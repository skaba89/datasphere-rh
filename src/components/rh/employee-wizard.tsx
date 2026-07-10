'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Check, User, Briefcase, FileText, Phone, CheckCircle2, Lightbulb, AlertTriangle } from 'lucide-react'
import { formatGNF, CONTRACT_TYPES } from '@/lib/utils-rh'
import { toast } from 'sonner'

interface EmployeeWizardProps {
  onClose: () => void
  onCreated: () => void
}

interface FormData {
  // Step 1: Identification
  nom: string
  prenoms: string
  sexe: string
  dateNaissance: string
  cnssNumero: string
  situationFamiliale: string
  nombreEnfants: number
  // Step 2: Contact
  email: string
  telephone: string
  adresse: string
  // Step 3: Contrat
  contractType: string
  poste: string
  dateEmbauche: string
  dateFin: string
  salaireBase: number
  motifCdd: string
  matricule: string
}

const STEPS = [
  { num: 1, label: 'Identification', icon: User },
  { num: 2, label: 'Contact', icon: Phone },
  { num: 3, label: 'Contrat', icon: Briefcase },
  { num: 4, label: 'Récapitulatif', icon: FileText },
  { num: 5, label: 'Confirmation', icon: CheckCircle2 },
]

export function EmployeeWizard({ onClose, onCreated }: EmployeeWizardProps) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormData>({
    nom: '',
    prenoms: '',
    sexe: 'M',
    dateNaissance: '',
    cnssNumero: '',
    situationFamiliale: 'CELIBATAIRE',
    nombreEnfants: 0,
    email: '',
    telephone: '',
    adresse: '',
    contractType: 'CDI',
    poste: '',
    dateEmbauche: new Date().toISOString().slice(0, 10),
    dateFin: '',
    salaireBase: 1500000,
    motifCdd: '',
    matricule: '',
  })

  const update = (field: keyof FormData, value: string | number) => {
    setForm({ ...form, [field]: value })
  }

  const canGoNext = () => {
    if (step === 1) return form.nom && form.prenoms
    if (step === 2) return true // optionnel
    if (step === 3) return form.poste && form.dateEmbauche && form.salaireBase > 0
    return true
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la création')
        setSubmitting(false)
        return
      }
      toast.success(`Employé ${form.nom} ${form.prenoms} créé avec succès`)
      setStep(5)
      setSubmitting(false)
      setTimeout(() => onCreated(), 1500)
    } catch (e) {
      toast.error('Erreur réseau')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#27698a]" />
            Nouvel employé
          </DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 mt-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > s.num
                      ? 'bg-[#478e5e] text-white'
                      : step === s.num
                      ? 'bg-[#27698a] text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-[10px] mt-1 text-slate-600 hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${step > s.num ? 'bg-[#478e5e]' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[280px]">
          {step === 1 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nom *" value={form.nom} onChange={v => update('nom', v)} placeholder="Diallo" />
                <Field label="Prénoms *" value={form.prenoms} onChange={v => update('prenoms', v)} placeholder="Mamadou" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">Sexe</Label>
                  <Select value={form.sexe} onValueChange={v => update('sexe', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field label="Date de naissance" type="date" value={form.dateNaissance} onChange={v => update('dateNaissance', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Numéro CNSS" value={form.cnssNumero} onChange={v => update('cnssNumero', v)} placeholder="1234567890" />
                <div>
                  <Label className="text-sm font-medium">Situation familiale</Label>
                  <Select value={form.situationFamiliale} onValueChange={v => update('situationFamiliale', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CELIBATAIRE">Célibataire</SelectItem>
                      <SelectItem value="MARIE">Marié(e)</SelectItem>
                      <SelectItem value="DIVORCE">Divorcé(e)</SelectItem>
                      <SelectItem value="VEUF">Veuf(ve)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Field label="Nombre d'enfants" type="number" value={String(form.nombreEnfants)} onChange={v => update('nombreEnfants', Number(v) || 0)} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Field label="Email" type="email" value={form.email} onChange={v => update('email', v)} placeholder="mamadou.diallo@demo.gn" />
              <Field label="Téléphone" value={form.telephone} onChange={v => update('telephone', v)} placeholder="+224 622 000 000" />
              <Field label="Adresse" value={form.adresse} onChange={v => update('adresse', v)} placeholder="Hamdallaye, Conakry" />
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800">
                <Lightbulb className="w-3.5 h-3.5 inline" /> Les informations de contact sont optionnelles mais recommandées pour le portail employé.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Matricule" value={form.matricule} onChange={v => update('matricule', v)} placeholder="Auto si vide" />
                <div>
                  <Label className="text-sm font-medium">Type de contrat *</Label>
                  <Select value={form.contractType} onValueChange={v => update('contractType', v)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CONTRACT_TYPES).map(([key, info]) => (
                        <SelectItem key={key} value={key}>{info.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Field label="Poste *" value={form.poste} onChange={v => update('poste', v)} placeholder="Développeur Senior" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date d'embauche *" type="date" value={form.dateEmbauche} onChange={v => update('dateEmbauche', v)} />
                {form.contractType === 'CDD' && (
                  <Field label="Date de fin" type="date" value={form.dateFin} onChange={v => update('dateFin', v)} />
                )}
              </div>
              <div>
                <Field
                  label="Salaire de base (GNF) *"
                  type="number"
                  value={String(form.salaireBase)}
                  onChange={v => update('salaireBase', Number(v) || 0)}
                />
                <div className="mt-1 text-xs text-slate-500">
                  SMIG Guinée : 580 000 GNF · Plafond CNSS : 4 640 000 GNF
                </div>
              </div>
              {form.contractType === 'CDD' && (
                <Field label="Motif du CDD" value={form.motifCdd} onChange={v => update('motifCdd', v)} placeholder="Remplacement congé maternité" />
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Identification</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <SummaryItem label="Nom complet" value={`${form.nom} ${form.prenoms}`} />
                  <SummaryItem label="Sexe" value={form.sexe === 'M' ? 'Masculin' : 'Féminin'} />
                  <SummaryItem label="CNSS" value={form.cnssNumero || '—'} />
                  <SummaryItem label="Situation" value={form.situationFamiliale} />
                  <SummaryItem label="Enfants" value={String(form.nombreEnfants)} />
                  <SummaryItem label="Email" value={form.email || '—'} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-3">Contrat</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <SummaryItem label="Matricule" value={form.matricule || 'Auto-généré'} />
                  <SummaryItem label="Type" value={CONTRACT_TYPES[form.contractType]?.label || form.contractType} />
                  <SummaryItem label="Poste" value={form.poste} />
                  <SummaryItem label="Embauche" value={form.dateEmbauche} />
                  <SummaryItem label="Salaire base" value={formatGNF(form.salaireBase)} highlight />
                  {form.contractType === 'CDD' && form.dateFin && (
                    <SummaryItem label="Fin contrat" value={form.dateFin} />
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 inline" /> Vérifiez les informations avant validation. Un audit trail sera créé.
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#478e5e] flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Employé créé !</h3>
              <p className="text-sm text-slate-600">
                {form.nom} {form.prenoms} a été ajouté avec succès.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Redirection vers la liste des employés...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 5 && (
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={submitting}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className="bg-[#27698a] hover:bg-[#1f5570]"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : step === 4 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[#478e5e] hover:bg-[#3a7549]"
              >
                {submitting ? 'Création...' : 'Créer l\'employé'}
                <Check className="w-4 h-4 ml-1" />
              </Button>
            ) : null}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  )
}

function SummaryItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-medium ${highlight ? 'text-[#27698a] font-bold' : 'text-slate-900'}`}>{value}</div>
    </div>
  )
}
