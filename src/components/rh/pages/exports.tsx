'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileSpreadsheet, FileText, Users, Briefcase, FileCheck, ScrollText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

const EXPORT_TYPES: Array<{ key: string; label: string; desc: string; icon: React.ElementType; color: string; formats: string[] }> = [
  {
    key: 'employees',
    label: 'Employés',
    desc: 'Liste complète avec contrats, salaires, contacts',
    icon: Users,
    color: 'bg-[#27698a]/10 text-[#27698a]',
    formats: ['csv', 'json'],
  },
  {
    key: 'candidates',
    label: 'Candidats',
    desc: 'Pipeline recrutement complet',
    icon: Briefcase,
    color: 'bg-purple-100 text-purple-700',
    formats: ['csv', 'json'],
  },
  {
    key: 'documents',
    label: 'Documents',
    desc: 'Inventaire du coffre-fort RH',
    icon: FileCheck,
    color: 'bg-emerald-100 text-emerald-700',
    formats: ['csv', 'json'],
  },
  {
    key: 'audit',
    label: 'Journal d\'audit',
    desc: '500 dernières actions enregistrées',
    icon: ScrollText,
    color: 'bg-amber-100 text-amber-700',
    formats: ['csv', 'json'],
  },
]

export function ExportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (type: string, format: string) => {
    const key = `${type}-${format}`
    setDownloading(key)
    try {
      const res = await fetch(`/api/exports?type=${type}&format=${format}`)
      if (!res.ok) {
        toast.error('Erreur lors de l\'export')
        return
      }

      if (format === 'json') {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      toast.success(`Export ${type} (${format}) téléchargé`)
    } catch {
      toast.error('Erreur réseau')
    }
    setDownloading(null)
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-6 h-6 text-[#27698a]" />
          Exports Excel / PDF
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Téléchargez vos données en CSV (Excel) ou JSON — formats personnalisables
        </p>
      </div>

      {/* Cartes d'export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORT_TYPES.map(exp => (
          <Card key={exp.key} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${exp.color}`}>
                <exp.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900">{exp.label}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{exp.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-slate-500 mr-2">Formats :</span>
              {exp.formats.map(fmt => (
                <Badge key={fmt} variant="outline" className="text-xs uppercase">
                  {fmt === 'csv' && <FileSpreadsheet className="w-3 h-3 mr-1" />}
                  {fmt === 'json' && <FileText className="w-3 h-3 mr-1" />}
                  {fmt}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              {exp.formats.map(fmt => (
                <Button
                  key={fmt}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownload(exp.key, fmt)}
                  disabled={downloading === `${exp.key}-${fmt}`}
                >
                  {downloading === `${exp.key}-${fmt}`
                    ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    : <Download className="w-4 h-4 mr-2" />
                  }
                  {fmt.toUpperCase()}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Section rapports PDF */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#27698a]" />
          <h2 className="font-semibold text-slate-900">Rapports PDF prédéfinis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Bulletin de paie individuel', desc: 'Généré depuis le simulateur de paie', page: 'payroll' },
            { label: 'Déclaration CNSS trimestrielle', desc: 'Format CNSS Guinée', page: 'payroll' },
            { label: 'Attestation d\'employeur', desc: 'Générée par IA RH', page: 'ai' },
            { label: 'Contrat de travail CDI', desc: 'Généré par IA RH', page: 'ai' },
            { label: 'Rapport DG mensuel', desc: 'Synthèse exécutive', page: 'reports' },
            { label: 'Solde de tout compte', desc: 'Document de fin de contrat', page: 'payroll' },
          ].map(rapport => (
            <div key={rapport.label} className="p-3 rounded-lg border border-slate-200 hover:border-[#27698a]/30 hover:bg-[#27698a]/5 transition-colors">
              <div className="font-medium text-sm text-slate-900">{rapport.label}</div>
              <div className="text-xs text-slate-500 mt-1">{rapport.desc}</div>
              <Button variant="ghost" size="sm" className="mt-2 text-xs h-7 text-[#27698a]" asChild>
                <a href={`#${rapport.page}`}>Aller au module →</a>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Info */}
      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
        ✅ <strong>Exports disponibles :</strong>
        <ul className="mt-2 ml-4 list-disc space-y-1">
          <li><strong>CSV</strong> : compatible Excel, LibreOffice, Google Sheets (séparateur ; encodage UTF-8 BOM)</li>
          <li><strong>JSON</strong> : pour intégrations API et scripts</li>
          <li>Les exports incluent les en-têtes de colonnes et sont horodatés</li>
          <li>Téléchargement direct via le navigateur (pas de stockage serveur)</li>
        </ul>
      </div>
    </div>
  )
}
