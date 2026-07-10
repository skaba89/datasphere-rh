'use client'
import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Upload, Play, Loader2, Copy, X, Clock, Cpu, ScanLine, FileText, IdCard, FileSearch } from 'lucide-react'
import { toast } from 'sonner'

interface Provider { id: string; label: string; color: string; configured: boolean; models: any[] }
interface UploadedImage { id: string; base64: string; mimeType: string; preview: string; name: string; size: number }

const PRESET_PROMPTS = [
  { id: 'ocr', label: 'OCR document', icon: ScanLine, prompt: 'Extrais tout le texte visible sur ce document.' },
  { id: 'attestation', label: 'Analyse attestation', icon: FileText, prompt: 'Analyse ce document RH. Extrais : type, nom employé, employeur, date, montant(s), signature (oui/non).' },
  { id: 'id_card', label: 'Pièce d\'identité', icon: IdCard, prompt: 'Extrais les informations de cette pièce d\'identité : nom, prénoms, date naissance, numéro.' },
  { id: 'contract', label: 'Analyse contrat', icon: FileSearch, prompt: 'Analyse ce contrat. Identifie : type (CDI/CDD), parties, poste, salaire, durée.' },
  { id: 'custom', label: 'Prompt custom', icon: Cpu, prompt: 'Décris ce que tu vois sur cette image.' },
]

export function LlmVisionPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<UploadedImage[]>([])
  const [selectedProvider, setSelectedProvider] = useState('')
  const [prompt, setPrompt] = useState(PRESET_PROMPTS[0].prompt)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/llm/providers').then(r => r.json()).then(d => {
      const withVision = (d.providers || []).filter((p: Provider) => (p.configured || p.id === 'zai') && p.models.some((m: any) => m.tags?.includes('vision')))
      setProviders(withVision); if (withVision.length > 0) setSelectedProvider(withVision[0].id); setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleUpload = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} n'est pas une image`); return }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} trop volumineux (max 10MB)`); return }
      const reader = new FileReader()
      reader.onload = () => { const r = reader.result as string; const b64 = r.split(',')[1]; setImages(prev => [...prev, { id: Math.random().toString(36).slice(2), base64: b64, mimeType: file.type, preview: r, name: file.name, size: file.size }]) }
      reader.readAsDataURL(file)
    })
  }
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); handleUpload(e.dataTransfer.files) }
  const removeImage = (id: string) => setImages(prev => prev.filter(img => img.id !== id))

  const runAnalysis = async () => {
    if (images.length === 0 || !prompt.trim()) return
    setRunning(true); setResult(null)
    try {
      const res = await fetch('/api/llm/vision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: selectedProvider || undefined, images: images.map(img => ({ base64: img.base64, mimeType: img.mimeType })), prompt }) })
      const data = await res.json()
      if (data.success) { setResult(data); toast.success(`Analyse réussie en ${data.durationMs}ms`) }
      else toast.error(data.error || 'Échec')
    } catch { toast.error('Erreur réseau') }
    finally { setRunning(false) }
  }

  if (loading) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Eye className="w-6 h-6 text-[#27698a]" />Vision IA</h1><p className="text-sm text-slate-500 mt-1">Analyse de documents via modèles de vision (GPT-4o, Gemini, GLM-4V)</p></div>

      {providers.length === 0 ? (
        <Card className="p-8 text-center text-slate-400"><Eye className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-sm">Aucun provider avec vision configuré</p><p className="text-xs mt-1">Configurez OpenAI (GPT-4o), Google Gemini, ou Z.ai (GLM-4V)</p></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-[#27698a]" />Images ({images.length})</h3>
              <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#27698a] hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" /><p className="text-sm text-slate-600">Cliquez ou glissez des images</p><p className="text-[10px] text-slate-400 mt-1">JPEG, PNG, WebP — max 10MB</p><input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} className="hidden" />
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {images.map(img => (
                    <div key={img.id} className="relative group">
                      <img src={img.preview} alt={img.name} className="w-full h-24 object-cover rounded border border-slate-200" />
                      <button onClick={() => removeImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                      <div className="text-[9px] text-slate-500 truncate mt-1">{img.name}</div><div className="text-[8px] text-slate-400">{(img.size / 1024).toFixed(0)} KB</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-4 space-y-3">
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Provider de vision</label><select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="w-full px-3 py-2 rounded border border-slate-300 text-sm">{providers.map(p => <option key={p.id} value={p.id}>{p.label} — {p.models.filter(m => m.tags?.includes('vision')).map(m => m.label).join(', ')}</option>)}</select></div>
              <div><label className="text-xs font-medium text-slate-700 mb-1 block">Type d'analyse</label><div className="flex flex-wrap gap-1 mb-2">{PRESET_PROMPTS.map(p => { const Icon = p.icon; return <button key={p.id} onClick={() => setPrompt(p.prompt)} className={`text-[10px] px-2 py-1 rounded-full border ${prompt === p.prompt ? 'border-[#27698a] bg-[#27698a]/5 text-[#27698a]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Icon className="w-3 h-3 inline mr-1" />{p.label}</button> })}</div><textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-slate-300 text-sm resize-none focus:outline-none focus:border-[#27698a]" /></div>
              <Button className="w-full bg-[#27698a] hover:bg-[#1f5670]" onClick={runAnalysis} disabled={running || images.length === 0 || !prompt.trim()}>{running ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyse…</> : <><Play className="w-4 h-4 mr-2" />Analyser {images.length} image{images.length > 1 ? 's' : ''}</>}</Button>
            </Card>
          </div>
          <Card className="p-4 sticky top-4 h-fit">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Eye className="w-4 h-4 text-[#27698a]" />Résultat</h3>{result && <div className="flex gap-2 text-[10px] text-slate-500"><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{result.durationMs}ms</span>{result.usage?.totalTokens && <span>{result.usage.totalTokens} tok</span>}<Badge variant="outline" className="text-[9px] bg-slate-50">{result.providerLabel || result.provider}</Badge></div>}</div>
            {!result ? <div className="text-center text-slate-400 py-12"><Eye className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-sm">Le résultat apparaîtra ici</p></div> : (
              <div className="space-y-3">
                <div className="relative"><pre className="p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">{result.content}</pre><button onClick={() => { navigator.clipboard.writeText(result.content); toast.success('Copié') }} className="absolute top-2 right-2 p-1 rounded bg-white border border-slate-200 hover:bg-slate-50"><Copy className="w-3 h-3 text-slate-600" /></button></div>
                {result.usage && <div className="grid grid-cols-3 gap-2 text-[10px]"><div className="p-2 rounded bg-slate-50 text-center"><div className="text-slate-500">Prompt</div><div className="font-bold text-slate-900">{result.usage.promptTokens || 0}</div></div><div className="p-2 rounded bg-slate-50 text-center"><div className="text-slate-500">Completion</div><div className="font-bold text-slate-900">{result.usage.completionTokens || 0}</div></div><div className="p-2 rounded bg-slate-50 text-center"><div className="text-slate-500">Total</div><div className="font-bold text-slate-900">{result.usage.totalTokens || 0}</div></div></div>}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
