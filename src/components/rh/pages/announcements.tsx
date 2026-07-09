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
import { Megaphone, Plus, Loader2, Pin, AlertTriangle, Calendar, Info, PartyPopper, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface Announcement {
  id: string; title: string; content: string; category: string; priority: string; pinned: boolean; authorName: string | null; publishedAt: string; expiresAt: string | null
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  INFO: { label: 'Info', icon: Info, color: 'bg-sky-100 text-sky-700' },
  ALERT: { label: 'Alerte', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  EVENT: { label: 'Événement', icon: PartyPopper, color: 'bg-purple-100 text-purple-700' },
  POLICY: { label: 'Politique', icon: FileText, color: 'bg-amber-100 text-amber-700' },
}

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' },
  NORMAL: { label: 'Normal', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  LOW: { label: 'Faible', color: 'bg-slate-50 text-slate-400 border-slate-200' },
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => { let m = true; fetch('/api/announcements').then(r => r.json()).then(d => { if (m) { setItems(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/announcements').then(r => r.json()).then(d => { setItems(d); setLoading(false) }) }

  const stats = { total: items.length, pinned: items.filter(i => i.pinned).length, urgent: items.filter(i => i.priority === 'URGENT').length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Megaphone className="w-6 h-6 text-[#27698a]" />Communication interne</h1><p className="text-sm text-slate-500 mt-1">Annonces, alertes et événements entreprise</p></div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle annonce</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard icon={Megaphone} label="Annonces" value={stats.total} color="#27698a" />
        <KpiCard icon={Pin} label="Épinglées" value={stats.pinned} color="#96783c" />
        <KpiCard icon={AlertTriangle} label="Urgentes" value={stats.urgent} color="#b94659" />
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const cat = CATEGORY_META[item.category] || CATEGORY_META.INFO
          const prio = PRIORITY_META[item.priority] || PRIORITY_META.NORMAL
          return (
            <Card key={item.id} className={`p-4 ${item.pinned ? 'border-l-4 border-l-[#27698a]' : ''} ${item.priority === 'URGENT' ? 'border-red-200' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}><cat.icon className="w-4 h-4" /></div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1">{item.title}{item.pinned && <Pin className="w-3 h-3 text-[#27698a]" />}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Badge variant="outline" className={cat.color + ' text-[10px]'}>{cat.label}</Badge>
                      <Badge variant="outline" className={prio.color + ' text-[10px]'}>{prio.label}</Badge>
                      <span>·</span><span>{item.authorName || 'RH'}</span>
                      <span>·</span><span>{new Date(item.publishedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.content}</p>
              {item.expiresAt && <div className="mt-2 text-xs text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" />Expire le {item.expiresAt}</div>}
            </Card>
          )
        })}
        {items.length === 0 && <Card className="p-8 text-center text-slate-400"><Megaphone className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucune annonce</p></Card>}
      </div>

      {wizardOpen && <AnnouncementWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function AnnouncementWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'INFO', priority: 'NORMAL', pinned: false, expiresAt: '' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast.error('Titre et contenu requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Annonce publiée'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-[#27698a]" />Nouvelle annonce</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Titre *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-sm">Contenu *</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="mt-1" rows={4} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Catégorie</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-sm">Priorité</Label><Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.pinned} onChange={e => setForm({ ...form, pinned: e.target.checked })} className="rounded" /><span className="text-sm">Épingler en haut</span></label>
            <div className="flex-1"><Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="text-xs" placeholder="Expiration" /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Publier</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
