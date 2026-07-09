'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Globe, Check, Languages } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const LANGUAGES = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', desc: 'Langue officielle — complet', coverage: 100, default: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', desc: 'International — complete', coverage: 100, default: false },
  { code: 'ff', name: 'Fulfulde', nativeName: 'Fulfulde', flag: '🇬🇳', desc: 'Langue locale Guinée — partiel', coverage: 45, default: false },
  { code: 'sus', name: 'Sosoxui', nativeName: 'Sosoxui', flag: '🇬🇳', desc: 'Langue Soussou — partiel', coverage: 30, default: false },
  { code: 'man', name: 'Mandingo', nativeName: 'Mandingo', flag: '🇬🇳', desc: 'Langue Maninka — partiel', coverage: 25, default: false },
  { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦', desc: 'Arabe — RTL — partiel', coverage: 60, default: false },
]

const TRANSLATION_STATS = [
  { module: 'Dashboard', fr: 100, en: 100, ff: 50, sus: 30, man: 25, ar: 60 },
  { module: 'Employés', fr: 100, en: 100, ff: 45, sus: 30, man: 20, ar: 55 },
  { module: 'Paie & CNSS', fr: 100, en: 100, ff: 40, sus: 25, man: 20, ar: 65 },
  { module: 'Congés', fr: 100, en: 100, ff: 55, sus: 35, man: 30, ar: 60 },
  { module: 'Recrutement', fr: 100, en: 100, ff: 40, sus: 25, man: 25, ar: 55 },
  { module: 'Formation', fr: 100, en: 100, ff: 35, sus: 20, man: 15, ar: 50 },
  { module: 'Portail employé', fr: 100, en: 100, ff: 45, sus: 30, man: 25, ar: 60 },
]

const SAMPLE_TRANSLATIONS = [
  { key: 'dashboard.title', fr: 'Tableau de bord', en: 'Dashboard', ff: 'Ɗaɓɓitagol', ar: 'لوحة التحكم' },
  { key: 'employees.title', fr: 'Employés', en: 'Employees', ff: 'Golliiɓe', ar: 'الموظفون' },
  { key: 'payroll.title', fr: 'Paie & CNSS', en: 'Payroll & CNSS', ff: 'Njoɓdi & CNSS', ar: 'الرواتب والضمان الاجتماعي' },
  { key: 'leaves.title', fr: 'Congés & absences', en: 'Leaves & absences', ff: 'Fartaŋŋe & ŋakkeende', ar: 'الإجازات والغياب' },
  { key: 'common.save', fr: 'Enregistrer', en: 'Save', ff: 'Danndu', ar: 'حفظ' },
  { key: 'common.cancel', fr: 'Annuler', en: 'Cancel', ff: 'Haaytu', ar: 'إلغاء' },
  { key: 'common.search', fr: 'Rechercher', en: 'Search', ff: 'Ɗaɓɓo', ar: 'بحث' },
]

export function LanguagePage() {
  const [selectedLang, setSelectedLang] = useState('fr')

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Globe className="w-6 h-6 text-[#27698a]" />Multi-langue</h1>
        <p className="text-sm text-slate-500 mt-1">Configuration des langues et couverture des traductions</p>
      </div>

      {/* Langue active */}
      <Card className="p-5 bg-gradient-to-br from-[#27698a]/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{LANGUAGES.find(l => l.code === selectedLang)?.flag}</div>
            <div>
              <h2 className="font-semibold text-slate-900 text-lg">{LANGUAGES.find(l => l.code === selectedLang)?.nativeName}</h2>
              <p className="text-sm text-slate-500">{LANGUAGES.find(l => l.code === selectedLang)?.desc}</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-[#27698a]/10 text-[#27698a] border-[#27698a]/20">
            <Languages className="w-3 h-3 mr-1" />
            Langue active
          </Badge>
        </div>
      </Card>

      {/* Sélecteur de langues */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-3">Langues disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LANGUAGES.map(lang => (
            <Card key={lang.code} className={`p-4 cursor-pointer transition-all ${selectedLang === lang.code ? 'ring-2 ring-[#27698a] bg-[#27698a]/5' : 'hover:bg-slate-50'}`} >
              <button onClick={() => { setSelectedLang(lang.code); toast.success(`Langue changée : ${lang.nativeName}`) }} className="w-full text-left">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{lang.flag}</div>
                  {selectedLang === lang.code && <Check className="w-5 h-5 text-[#27698a]" />}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{lang.nativeName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{lang.name}</p>
                <p className="text-xs text-slate-400 mt-1">{lang.desc}</p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Couverture</span>
                    <span className={`font-bold ${lang.coverage >= 80 ? 'text-emerald-600' : lang.coverage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{lang.coverage}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${lang.coverage >= 80 ? 'bg-emerald-500' : lang.coverage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${lang.coverage}%` }} />
                  </div>
                </div>
                {lang.default && <Badge variant="outline" className="mt-2 text-[9px] bg-slate-50 text-slate-500">Par défaut</Badge>}
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Matrice de traduction */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Couverture par module</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-600 uppercase">
                <th className="px-3 py-2">Module</th>
                <th className="px-3 py-2 text-center">🇫🇷 FR</th>
                <th className="px-3 py-2 text-center">🇬🇧 EN</th>
                <th className="px-3 py-2 text-center">🇬🇳 FF</th>
                <th className="px-3 py-2 text-center">🇬🇳 SUS</th>
                <th className="px-3 py-2 text-center">🇬🇳 MAN</th>
                <th className="px-3 py-2 text-center">🇸🇦 AR</th>
              </tr>
            </thead>
            <tbody>
              {TRANSLATION_STATS.map(stat => (
                <tr key={stat.module} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-700">{stat.module}</td>
                  {['fr', 'en', 'ff', 'sus', 'man', 'ar'].map(lang => {
                    const val = stat[lang as keyof typeof stat] as number
                    return (
                      <td key={lang} className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center justify-center w-10 py-0.5 rounded text-xs font-bold ${val >= 80 ? 'bg-emerald-100 text-emerald-700' : val >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {val}%
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Échantillon de traductions */}
      <Card className="p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Aperçu des traductions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-600 uppercase">
                <th className="px-3 py-2">Clé</th>
                <th className="px-3 py-2">🇫🇷 FR</th>
                <th className="px-3 py-2">🇬🇧 EN</th>
                <th className="px-3 py-2">🇬🇳 FF</th>
                <th className="px-3 py-2">🇸🇦 AR</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_TRANSLATIONS.map(t => (
                <tr key={t.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{t.key}</td>
                  <td className="px-3 py-2 text-slate-900 font-medium">{t.fr}</td>
                  <td className="px-3 py-2 text-slate-700">{t.en}</td>
                  <td className="px-3 py-2 text-slate-700">{t.ff}</td>
                  <td className="px-3 py-2 text-slate-700" dir="rtl">{t.ar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800">
        🌍 <strong>Multi-langue :</strong> Le français et l'anglais sont entièrement supportés. Les langues locales guinéennes (Fulfulde, Soussou, Maninka) sont en cours de traduction communautaire. L'arabe (RTL) est partiellement disponible. La détection de langue se fait automatiquement selon les préférences du navigateur.
      </div>
    </div>
  )
}
