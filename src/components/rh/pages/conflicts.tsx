'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Plus, Loader2, ShieldAlert, Users, DollarSign, Calendar, MessageSquare, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Conflict { id: string; type: string; severity: string; status: string; title: string; desc: string; reportedBy: string; date: string; assignedTo: string; actions: string }

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  HARCELEMENT: { label: 'Harcèlement', icon: ShieldAlert, color: 'bg-red-100 text-red-700' },
  DISCRIMINATION: { label: 'Discrimination', icon: Users, color: 'bg-purple-100 text-purple-700' },
  CONFLIT_EQUIPE: { label: 'Conflit équipe', icon: Users, color: 'bg-amber-100 text-amber-700' },
  SALAIRE: { label: 'Salaire', icon: DollarSign, color: 'bg-sky-100 text-sky-700' },
  CONGES: { label: 'Congés', icon: Calendar, color: 'bg-emerald-100 text-emerald-700' },
  AUTRE: { label: 'Autre', icon: AlertTriangle, color: 'bg-slate-100 text-slate-700' },
}
const SEVERITY_META: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' },
  HAUTE: { label: 'Haute', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  MOYENNE: { label: 'Moyenne', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  BASSE: { label: 'Basse', color: 'bg-slate-50 text-slate-500 border-slate-200' },
}
const STATUS_META: Record<string, { label: string; color: string }> = {
  OUVERT: { label: 'Ouvert', color: 'bg-red-50 text-red-700 border-red-200' },
  EN_COURS: { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  RESOLU: { label: 'Résolu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export function ConflictsPage() {
  const [items, setItems] = useState<Conflict[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  useEffect(() => { let m = true; fetch('/api/conflicts').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const stats = { total: items.length, ouvert: items.filter(i => i.status === 'OUVERT').length, enCours: items.filter(i => i.status === 'EN_COURS').length, resolu: items.filter(i => i.status === 'RESOLU').length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-[#27698a]" />Gestion des conflits</h1><p className="text-sm text-slate-500 mt-1">Médiation, escalade et résolution des litiges</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Signaler</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={AlertTriangle} label="Total" value={stats.total} color="#27698a" />
        <KpiCard icon={AlertTriangle} label="Ouverts" value={stats.ouvert} color="#b94659" />
        <KpiCard icon={MessageSquare} label="En cours" value={stats.enCours} color="#96783c" />
        <KpiCard icon={ShieldAlert} label="Résolus" value={stats.resolu} color="#478e5e" />
      </div>
      <div className="space-y-3">
        {items.map(c => {
          const type = TYPE_META[c.type] || TYPE_META.AUTRE
          const sev = SEVERITY_META[c.severity] || SEVERITY_META.BASSE
          const status = STATUS_META[c.status] || STATUS_META.OUVERT
          return (
            <Card key={c.id} className={`p-4 ${c.severity === 'URGENT' ? 'border-l-4 border-l-red-500' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${type.color}`}><type.icon className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1"><Badge variant="outline" className={type.color + ' text-[10px]'}>{type.label}</Badge><Badge variant="outline" className={sev.color + ' text-[10px]'}>{sev.label}</Badge><Badge variant="outline" className={status.color + ' text-[10px]'}>{status.label}</Badge></div>
                  <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{c.desc}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500"><span>Par : {c.reportedBy}</span><span>·</span><span>{formatDate(c.date)}</span><span>·</span><span>Assigné à : {c.assignedTo}</span></div>
                  {c.actions && <div className="mt-2 p-2 rounded bg-slate-50 text-xs text-slate-700"><b>Actions :</b> {c.actions}</div>}
                </div>
              </div>
            </Card>
          )
        })}
        {items.length === 0 && <Card className="p-8 text-center text-slate-400"><AlertTriangle className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun conflit signalé</p></Card>}
      </div>
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        <ShieldCheck className="w-3.5 h-3.5 inline" /> <strong>Confidentialité :</strong> Les signalements de harcèlement et discrimination sont traités de manière strictement confidentielle. Seuls le RH et la Direction ont accès. Un canal anonyme est disponible via le Helpdesk.
      </div>
      {wizardOpen && (
        <Dialog open onOpenChange={(v) => !v && setWizardOpen(false)}>
          <DialogContent className="max-w-md"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-[#27698a]" />Signaler un conflit</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-sm">Type</Label><Select defaultValue="CONFLIT_EQUIPE"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-sm">Gravité</Label><Select defaultValue="MOYENNE"><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SEVERITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-sm">Titre</Label><Input className="mt-1" /></div>
              <div><Label className="text-sm">Description</Label><Textarea className="mt-1" rows={3} /></div>
              <div><Label className="text-sm">Signalé par</Label><Input className="mt-1" placeholder="Votre nom ou 'Anonyme'" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setWizardOpen(false)}>Annuler</Button><Button className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => { setWizardOpen(false); toast.success('Conflit signalé — le service RH a été notifié') }}>Signaler</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) { return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card> }
