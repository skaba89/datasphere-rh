'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileCheck, GitBranch, CheckCircle2, Clock, PenTool, Archive } from 'lucide-react'
import { formatDate } from '@/lib/utils-rh'

interface Data { documents: any[]; workflows: any[] }

export function DocTraceabilityPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'documents' | 'workflows'>('documents')
  useEffect(() => { let m = true; fetch('/api/doc-traceability').then(r => r.json()).then(d => { if (m) { setData(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  if (loading || !data) return <div className="p-6"><div className="animate-pulse h-64 bg-slate-200 rounded-xl" /></div>

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><GitBranch className="w-6 h-6 text-[#27698a]" />Traçabilité documentaire</h1><p className="text-sm text-slate-500 mt-1">Versioning, workflows d'approbation et archivage</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={FileCheck} label="Documents tracés" value={data.documents.length} color="#27698a" />
        <KpiCard icon={PenTool} label="Signés" value={data.documents.filter((d: any) => d.status === 'SIGNE').length} color="#478e5e" />
        <KpiCard icon={Clock} label="En attente" value={data.documents.filter((d: any) => d.status === 'EN_ATTENTE').length} color="#96783c" />
        <KpiCard icon={Archive} label="Workflows" value={data.workflows.length} color="#b94659" />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[{ k: 'documents', l: 'Documents', i: FileCheck }, { k: 'workflows', l: 'Workflows', i: GitBranch }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as any)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.k ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500'}`}><t.i className="w-4 h-4 inline mr-2" />{t.l}</button>
        ))}
      </div>

      {tab === 'documents' && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50"><h2 className="font-semibold text-slate-900 text-sm">Documents avec traçabilité ({data.documents.length})</h2></div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {data.documents.map((doc: any) => (
              <div key={doc.id} className="px-4 py-3 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.status === 'SIGNE' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}><FileCheck className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-medium text-sm text-slate-900">{doc.name}</span><Badge variant="outline" className={`text-[10px] ${doc.status === 'SIGNE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{doc.status === 'SIGNE' ? '✓ Signé' : '⏳ En attente'}</Badge><Badge variant="outline" className="text-[10px]">v{doc.version}</Badge></div>
                    <div className="text-xs text-slate-500">{doc.type} · {doc.category}{doc.employee ? ` · ${doc.employee}` : ''}</div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{doc.versions.length} version{doc.versions.length > 1 ? 's' : ''}</span>
                      <span>Créé : {formatDate(doc.createdAt)}</span>
                      {doc.signedAt && <span>Signé : {formatDate(doc.signedAt)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {data.documents.length === 0 && <div className="px-4 py-8 text-center text-slate-400"><FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" /><p className="text-sm">Aucun document</p></div>}
          </div>
        </Card>
      )}

      {tab === 'workflows' && (
        <div className="space-y-3">
          {data.workflows.map((wf: any) => (
            <Card key={wf.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-semibold text-slate-900 text-sm">{wf.name}</h3><div className="text-xs text-slate-500 mt-0.5">{wf.docCount} document{wf.docCount > 1 ? 's' : ''} en cours</div></div>
                <Badge variant="outline" className={wf.status === 'TERMINE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : wf.status === 'EN_COURS' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>{wf.status === 'TERMINE' ? 'Terminé' : wf.status === 'EN_COURS' ? 'En cours' : 'En attente'}</Badge>
              </div>
              <div className="flex items-center gap-1">
                {wf.steps.map((step: string, i: number) => (
                  <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < wf.currentStep ? 'bg-emerald-500 text-white' : i === wf.currentStep ? 'bg-[#27698a] text-white' : 'bg-slate-200 text-slate-400'}`}>{i < wf.currentStep ? '✓' : i + 1}</div>
                      <span className="text-[9px] mt-1 text-center text-slate-500 max-w-[80px] truncate">{step}</span>
                    </div>
                    {i < wf.steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < wf.currentStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
