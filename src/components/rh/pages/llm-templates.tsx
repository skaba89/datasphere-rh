'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Play, Loader2, Check, Copy, Zap, Clock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface Template { id: string; category: string; title: string; description: string; variables: any[]; recommendedMaxTokens: number; recommendedTemperature: number; tags?: string[] }
interface Category { id: string; label: string; icon: string }

const CATEGORY_COLORS: Record<string, string> = { contrats: '#27698a', evaluations: '#10b981', communication: '#8b5cf6', juridique: '#dc2626', analyse: '#f59e0b', onboarding: '#0ea5e9', conflits: '#ef4444' }

export function LlmTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [varValues, setVarValues] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetch('/api/llm/templates').then(r => r.json()).then(d => { setTemplates(d.templates || []); setCategories(d.categories || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const openTemplate = (template: Template) => { setSelectedTemplate(template); setResult(null); const defaults: Record<string, string> = {}; for (const v of template.variables) defaults[v.name] = v.defaultValue || ''; setVarValues(defaults) }

  const runTemplate = async () => {
    if (!selectedTemplate) return
    setRunning(true); setResult(null)
    try {
      const res = await fetch('/api/llm/templates/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: selectedTemplate.id, variables: varValues }) })
      const data = await res.json()
      if (data.success) { setResult(data); toast.success(`Généré en ${data.durationMs}ms`) }
      else toast.error(data.error || 'Échec')
    } catch { toast.error('Erreur réseau') }
    finally { setRunning(false) }
  }

  const filteredTemplates = selectedCategory === 'all' ? templates : templates.filter(t => t.category === selectedCategory)
  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><FileText className="w-6 h-6 text-[#27698a]" />Templates de prompts RH</h1><p className="text-sm text-slate-500 mt-1">{templates.length} prompts prêts à l'emploi</p></div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedCategory === 'all' ? 'bg-[#27698a] text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>Tous ({templates.length})</button>
        {categories.map(cat => { const count = templates.filter(t => t.category === cat.id).length; return <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedCategory === cat.id ? 'text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`} style={selectedCategory === cat.id ? { backgroundColor: CATEGORY_COLORS[cat.id] } : {}}>{cat.label} ({count})</button> })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          {filteredTemplates.map(template => (
            <Card key={template.id} className={`p-4 cursor-pointer transition-all ${selectedTemplate?.id === template.id ? 'border-2 border-[#27698a]' : 'hover:border-[#27698a]/40'}`} onClick={() => openTemplate(template)}>
              <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: (CATEGORY_COLORS[template.category] || '#27698a') + '15', color: CATEGORY_COLORS[template.category] || '#27698a' }}><FileText className="w-4 h-4" /></div><div><h3 className="text-sm font-semibold text-slate-900">{template.title}</h3><div className="text-[10px] text-slate-400 uppercase">{template.category}</div></div></div></div>
              <p className="text-xs text-slate-600 line-clamp-2">{template.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400"><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{template.recommendedMaxTokens} tok</span><span>Temp {template.recommendedTemperature}</span><span>{template.variables.length} variables</span></div>
            </Card>
          ))}
        </div>

        {selectedTemplate ? (
          <Card className="p-5 sticky top-4 h-fit">
            <div className="flex items-start justify-between mb-3"><div><h2 className="text-lg font-bold text-slate-900">{selectedTemplate.title}</h2><p className="text-xs text-slate-500 mt-1">{selectedTemplate.description}</p></div><Badge variant="outline" className="text-[9px]" style={{ color: CATEGORY_COLORS[selectedTemplate.category] || '#27698a', borderColor: (CATEGORY_COLORS[selectedTemplate.category] || '#27698a') + '40' }}>{selectedTemplate.category}</Badge></div>
            <div className="space-y-3 mb-4">
              <h3 className="text-xs font-semibold text-slate-700 uppercase">Variables</h3>
              {selectedTemplate.variables.map(v => (
                <div key={v.name}><label className="text-xs font-medium text-slate-700 mb-1 block flex items-center gap-1">{v.label}{v.required && <span className="text-red-500">*</span>}</label><input type={v.type === 'number' ? 'number' : v.type === 'date' ? 'date' : 'text'} value={varValues[v.name] || ''} onChange={e => setVarValues({ ...varValues, [v.name]: e.target.value })} className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm focus:outline-none focus:border-[#27698a]" placeholder={v.defaultValue || ''} /></div>
              ))}
            </div>
            <Button className="w-full bg-[#27698a] hover:bg-[#1f5670] mb-3" onClick={runTemplate} disabled={running || selectedTemplate.variables.some(v => v.required && !varValues[v.name])}>{running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération…</> : <><Play className="w-4 h-4 mr-2" />Générer</>}</Button>
            {result && (
              <div className="space-y-2">
                <div className="flex items-center justify-between"><h3 className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" />Résultat</h3><div className="flex gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{result.durationMs}ms</span>{result.usage?.totalTokens && <span>{result.usage.totalTokens} tok</span>}<Badge variant="outline" className="text-[9px] bg-slate-50">{result.providerLabel || result.provider}</Badge></div></div>
                <div className="relative"><pre className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap max-h-80 overflow-y-auto">{result.content}</pre><button onClick={() => { navigator.clipboard.writeText(result.content); toast.success('Copié') }} className="absolute top-2 right-2 p-1 rounded bg-white border border-slate-200 hover:bg-slate-50"><Copy className="w-3 h-3 text-slate-600" /></button></div>
              </div>
            )}
          </Card>
        ) : <Card className="p-8 text-center text-slate-400"><FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-sm">Sélectionnez un template</p></Card>}
      </div>
    </div>
  )
}
