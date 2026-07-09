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
import { LifeBuoy, Plus, Loader2, CheckCircle2, Clock, AlertTriangle, MessageSquare, Search, HelpCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Ticket {
  id: string; employeeName: string; subject: string; description: string; category: string; priority: string; status: string; assignedTo: string | null; response: string | null; createdAt: string
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  PAIE: { label: 'Paie', color: 'bg-[#27698a]/10 text-[#27698a]' },
  CONGE: { label: 'Congé', color: 'bg-emerald-100 text-emerald-700' },
  CONTRAT: { label: 'Contrat', color: 'bg-purple-100 text-purple-700' },
  TECHNIQUE: { label: 'Technique', color: 'bg-amber-100 text-amber-700' },
  RH: { label: 'RH', color: 'bg-sky-100 text-sky-700' },
  AUTRE: { label: 'Autre', color: 'bg-slate-100 text-slate-700' },
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OUVERT: { label: 'Ouvert', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: Clock },
  EN_COURS: { label: 'En cours', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Loader2 },
  RESOLU: { label: 'Résolu', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  FERME: { label: 'Fermé', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: CheckCircle2 },
}

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  URGENT: { label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200' },
  NORMAL: { label: 'Normal', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  LOW: { label: 'Faible', color: 'bg-slate-50 text-slate-400 border-slate-200' },
}

const FAQ_ITEMS = [
  { q: 'Comment demander un congé ?', a: 'Rendez-vous dans le module Congés & absences, cliquez sur "Nouvelle demande", sélectionnez le type et les dates. Votre manager recevra une notification.' },
  { q: 'Où trouver mon bulletin de paie ?', a: 'Votre bulletin est disponible dans le Portail employé > Mes bulletins de paie. Vous pouvez le télécharger en PDF.' },
  { q: 'Comment déclarer des notes de frais ?', a: 'Module Notes de frais > Nouvelle note. Saisissez le montant, la catégorie et la description. Le manager l\'approuvera.' },
  { q: 'Comment pointer ma présence ?', a: 'Utilisez le module Temps & présence ou Géolocalisation pour pointer avec votre GPS.' },
  { q: 'Comment consulter mon solde de congés ?', a: 'Le solde est visible dans le Portail employé > Solde de congés payés.' },
  { q: 'Qui contacter pour un problème de paie ?', a: 'Créez un ticket dans ce module Helpdesk avec la catégorie "Paie". Le service comptable vous répondra.' },
]

export function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [respondTicket, setRespondTicket] = useState<Ticket | null>(null)
  const [search, setSearch] = useState('')
  const [showFAQ, setShowFAQ] = useState(false)

  useEffect(() => { let m = true; fetch('/api/helpdesk').then(r => r.json()).then(d => { if (m) { setTickets(d); setLoading(false) } }).catch(() => { if (m) setLoading(false) }); return () => { m = false } }, [])
  const load = () => { setLoading(true); fetch('/api/helpdesk').then(r => r.json()).then(d => { setTickets(d); setLoading(false) }) }

  const filtered = tickets.filter(t => !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.employeeName.toLowerCase().includes(search.toLowerCase()))
  const stats = { total: tickets.length, ouvert: tickets.filter(t => t.status === 'OUVERT').length, enCours: tickets.filter(t => t.status === 'EN_COURS').length, resolu: tickets.filter(t => t.status === 'RESOLU').length }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><LifeBuoy className="w-6 h-6 text-[#27698a]" />Helpdesk RH</h1><p className="text-sm text-slate-500 mt-1">Tickets de support et base de connaissances</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFAQ(!showFAQ)}><HelpCircle className="w-4 h-4 mr-2" />FAQ</Button>
          <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}><Plus className="w-4 h-4 mr-2" />Nouveau ticket</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={MessageSquare} label="Total tickets" value={stats.total} color="#27698a" />
        <KpiCard icon={Clock} label="Ouverts" value={stats.ouvert} color="#96783c" />
        <KpiCard icon={Loader2} label="En cours" value={stats.enCours} color="#b94659" />
        <KpiCard icon={CheckCircle2} label="Résolus" value={stats.resolu} color="#478e5e" />
      </div>

      {/* FAQ */}
      {showFAQ && (
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-[#27698a]" />Questions fréquentes</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, i) => (
              <details key={i} className="p-3 rounded-lg border border-slate-200 cursor-pointer">
                <summary className="text-sm font-medium text-slate-900">{faq.q}</summary>
                <p className="text-xs text-slate-600 mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Rechercher un ticket..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Tickets */}
      <div className="space-y-2">
        {filtered.map(ticket => {
          const cat = CATEGORY_META[ticket.category] || CATEGORY_META.AUTRE
          const status = STATUS_META[ticket.status] || STATUS_META.OUVERT
          const prio = PRIORITY_META[ticket.priority] || PRIORITY_META.NORMAL
          return (
            <Card key={ticket.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${status.color.split(' ')[0]}`}>
                  <status.icon className={`w-4 h-4 ${ticket.status === 'EN_COURS' ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm text-slate-900">{ticket.subject}</span>
                    <Badge variant="outline" className={cat.color + ' text-[10px]'}>{cat.label}</Badge>
                    <Badge variant="outline" className={status.color + ' text-[10px]'}>{status.label}</Badge>
                    <Badge variant="outline" className={prio.color + ' text-[10px]'}>{prio.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">{ticket.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>Par {ticket.employeeName}</span><span>·</span><span>{formatDate(ticket.createdAt.slice(0, 10))}</span>
                    {ticket.assignedTo && <><span>·</span><span>Assigné à {ticket.assignedTo}</span></>}
                  </div>
                  {ticket.response && <div className="mt-2 p-2 rounded bg-emerald-50 text-xs text-emerald-800"><b>Réponse :</b> {ticket.response}</div>}
                </div>
                {ticket.status === 'OUVERT' && <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={() => setRespondTicket(ticket)}>Répondre</Button>}
              </div>
            </Card>
          )
        })}
        {filtered.length === 0 && <Card className="p-8 text-center text-slate-400"><LifeBuoy className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p>Aucun ticket</p></Card>}
      </div>

      {wizardOpen && <TicketWizard onClose={() => setWizardOpen(false)} onCreated={() => { setWizardOpen(false); load() }} />}
      {respondTicket && <RespondTicketWizard ticket={respondTicket} onClose={() => setRespondTicket(null)} onCreated={() => { setRespondTicket(null); load() }} />}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return <Card className="p-3 lg:p-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}><Icon className="w-4 h-4" /></div><div><div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div></Card>
}

function TicketWizard({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ employeeName: '', subject: '', description: '', category: 'RH', priority: 'NORMAL' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!form.subject || !form.description) { toast.error('Sujet et description requis'); return }
    setLoading(true)
    try { const res = await fetch('/api/helpdesk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (res.ok) { toast.success('Ticket créé'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><LifeBuoy className="w-5 h-5 text-[#27698a]" />Nouveau ticket</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-sm">Votre nom</Label><Input value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-sm">Sujet *</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-sm">Description *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Catégorie</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATEGORY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-sm">Priorité</Label><Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(PRIORITY_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Créer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RespondTicketWizard({ ticket, onClose, onCreated }: { ticket: Ticket; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ response: '', status: 'RESOLU' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    if (!form.response) { toast.error('Réponse requise'); return }
    setLoading(true)
    try { const res = await fetch('/api/helpdesk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticketId: ticket.id, ...form }) }); if (res.ok) { toast.success('Réponse envoyée'); onCreated() } } catch { toast.error('Erreur') }
    setLoading(false)
  }
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#27698a]" />Répondre : {ticket.subject}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="p-2 rounded bg-slate-50 text-xs text-slate-600">{ticket.description}</div>
          <div><Label className="text-sm">Réponse *</Label><Textarea value={form.response} onChange={e => setForm({ ...form, response: e.target.value })} className="mt-1" rows={4} /></div>
          <div><Label className="text-sm">Statut après réponse</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EN_COURS">En cours</SelectItem><SelectItem value="RESOLU">Résolu</SelectItem><SelectItem value="FERME">Fermé</SelectItem></SelectContent></Select></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Envoyer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
