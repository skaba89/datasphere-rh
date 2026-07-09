'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, FileText, Loader2, Copy, Download, FileSignature, Briefcase, Calendar, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

const DOC_TYPES: Array<{ key: string; label: string; desc: string; icon: React.ElementType; color: string }> = [
  { key: 'contrat_cdi', label: 'Contrat CDI', desc: 'Contrat à durée indéterminée conforme Code du travail GN', icon: FileSignature, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'contrat_cdd', label: 'Contrat CDD', desc: 'Contrat à durée déterminée avec motif obligatoire', icon: FileSignature, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'lettre_embauche', label: "Lettre d'embauche", desc: 'Lettre officielle de confirmation embauche', icon: FileText, color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'attestation_employeur', label: 'Attestation employeur', desc: 'Attestation confirming employment', icon: FileText, color: 'bg-violet-100 text-violet-700 border-violet-200' },
  { key: 'attestation_salaire', label: 'Attestation de salaire', desc: 'Pour banque, bailleur, organisme', icon: FileText, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'lettre_fin_contrat', label: 'Lettre fin de contrat', desc: 'Notification officielle de fin de contrat', icon: FileText, color: 'bg-red-100 text-red-700 border-red-200' },
]

export function AIPage() {
  const [selectedType, setSelectedType] = useState<string>('')
  const [context, setContext] = useState({
    employeeName: '',
    position: '',
    salary: '',
    startDate: '',
    endDate: '',
    reason: '',
    motifCdd: '',
  })
  const [generatedContent, setGeneratedContent] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!selectedType) {
      toast.error('Sélectionne un type de document')
      return
    }
    setLoading(true)
    setGeneratedContent('')
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          context: {
            ...context,
            salary: context.salary ? Number(context.salary) : undefined,
          },
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setGeneratedContent(data.content)
        toast.success('Document généré par IA')
      } else {
        toast.error(data.error || 'Erreur de génération')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    toast.success('Copié dans le presse-papier')
  }

  const downloadAsText = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedType}_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Document téléchargé')
  }

  const selectedDoc = DOC_TYPES.find(d => d.key === selectedType)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#27698a]" />
          IA RH — Génération de documents
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Génère des documents RH conformes au Code du travail guinéen grâce à l'IA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-4">
          {/* Choix type document */}
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-3">1. Type de document</h2>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map(doc => (
                <button
                  key={doc.key}
                  onClick={() => setSelectedType(doc.key)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedType === doc.key
                      ? 'border-[#27698a] bg-[#27698a]/5 ring-1 ring-[#27698a]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${doc.color} flex items-center justify-center mb-2`}>
                    <doc.icon className="w-4 h-4" />
                  </div>
                  <div className="font-medium text-sm text-slate-900">{doc.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{doc.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Contexte */}
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-3">2. Contexte</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm flex items-center gap-1"><Briefcase className="w-3 h-3" /> Nom salarié</Label>
                  <Input value={context.employeeName} onChange={e => setContext({ ...context, employeeName: e.target.value })} className="mt-1" placeholder="Diallo Mamadou" />
                </div>
                <div>
                  <Label className="text-sm">Poste</Label>
                  <Input value={context.position} onChange={e => setContext({ ...context, position: e.target.value })} className="mt-1" placeholder="Directeur Technique" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm flex items-center gap-1"><DollarSign className="w-3 h-3" /> Salaire brut (GNF)</Label>
                  <Input type="number" value={context.salary} onChange={e => setContext({ ...context, salary: e.target.value })} className="mt-1" placeholder="3000000" />
                </div>
                <div>
                  <Label className="text-sm flex items-center gap-1"><Calendar className="w-3 h-3" /> Date début</Label>
                  <Input type="date" value={context.startDate} onChange={e => setContext({ ...context, startDate: e.target.value })} className="mt-1" />
                </div>
              </div>
              {selectedType === 'contrat_cdd' && (
                <>
                  <div>
                    <Label className="text-sm">Date de fin</Label>
                    <Input type="date" value={context.endDate} onChange={e => setContext({ ...context, endDate: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm">Motif du CDD</Label>
                    <Input value={context.motifCdd} onChange={e => setContext({ ...context, motifCdd: e.target.value })} className="mt-1" placeholder="Remplacement congé maternité" />
                  </div>
                </>
              )}
              {selectedType === 'lettre_fin_contrat' && (
                <div>
                  <Label className="text-sm">Motif de fin</Label>
                  <Input value={context.reason} onChange={e => setContext({ ...context, reason: e.target.value })} className="mt-1" placeholder="Fin période d'essai" />
                </div>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !selectedType}
              className="w-full mt-4 bg-[#27698a] hover:bg-[#1f5570]"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {loading ? 'Génération en cours...' : 'Générer le document'}
            </Button>
          </Card>
        </div>

        {/* Résultat */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">3. Document généré</h2>
            {generatedContent && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  Copier
                </Button>
                <Button variant="outline" size="sm" onClick={downloadAsText}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Télécharger
                </Button>
              </div>
            )}
          </div>

          {selectedDoc && !generatedContent && (
            <div className="mb-3 p-2 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Badge variant="outline" className={selectedDoc.color}>{selectedDoc.label}</Badge>
              <span className="ml-2">{selectedDoc.desc}</span>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-[#27698a] animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-600">L'IA rédige votre document...</p>
                <p className="text-xs text-slate-400 mt-1">Cela peut prendre 10-20 secondes</p>
              </div>
            </div>
          ) : generatedContent ? (
            <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-lg p-4 max-h-[600px]">
              <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans leading-relaxed">
                {generatedContent}
              </pre>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">Sélectionnez un type et générez votre document</p>
                <p className="text-xs mt-1">Les documents sont conformes au Code du travail guinéen</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
