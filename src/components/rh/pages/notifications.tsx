'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Bell, Mail, MessageCircle, Smartphone, Send, CheckCircle2, Clock, XCircle, Loader2, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils-rh'

interface Notification {
  id: string
  recipient: string
  channel: string
  subject: string | null
  message: string
  status: string
  type: string
  sentAt: string | null
  createdAt: string
}

const CHANNEL_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  EMAIL: { label: 'Email', icon: Mail, color: 'bg-sky-100 text-sky-700' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-100 text-emerald-700' },
  SMS: { label: 'SMS', icon: Smartphone, color: 'bg-violet-100 text-violet-700' },
  IN_APP: { label: 'In-app', icon: Bell, color: 'bg-amber-100 text-amber-700' },
}

const STATUS_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ENVOYE: { label: 'Envoyé', icon: CheckCircle2, color: 'text-emerald-600' },
  EN_ATTENTE: { label: 'En attente', icon: Clock, color: 'text-amber-600' },
  ECHEC: { label: 'Échec', icon: XCircle, color: 'text-red-600' },
  LU: { label: 'Lu', icon: CheckCircle2, color: 'text-[#27698a]' },
}

const TYPE_META: Record<string, string> = {
  INFO: 'bg-sky-50 text-sky-700 border-sky-200',
  ALERTE: 'bg-amber-50 text-amber-700 border-amber-200',
  CONGE: 'bg-purple-50 text-purple-700 border-purple-200',
  PAIE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONTRAT: 'bg-red-50 text-red-700 border-red-200',
}

const TEMPLATES: Array<{ label: string; subject: string; message: string; type: string; channel: string }> = [
  {
    label: 'Bulletin de paie disponible',
    subject: 'Votre bulletin de paie de Juillet 2026 est disponible',
    message: 'Bonjour,\n\nVotre bulletin de paie pour la période de Juillet 2026 est désormais disponible sur votre portail employé DataSphere RH.\n\nConnectez-vous pour le consulter et le télécharger.\n\nCordialement,\nRH Demo SARL',
    type: 'PAIE',
    channel: 'EMAIL',
  },
  {
    label: 'Demande de congé approuvée',
    subject: '',
    message: 'Bonjour,\n\nVotre demande de congé du 15/07 au 25/07 a été APPROUVÉE.\n\nBon congé !\n\nRH Demo SARL',
    type: 'CONGE',
    channel: 'WHATSAPP',
  },
  {
    label: 'Rappel fin de contrat CDD',
    subject: 'Rappel : fin de votre contrat CDD',
    message: 'Bonjour,\n\nNous vous informons que votre contrat CDD arrive à échéance le 31/12/2026.\n\nMerci de contacter le service RH pour les démarches de renouvellement ou de fin de contrat.\n\nCordialement,\nRH Demo SARL',
    type: 'CONTRAT',
    channel: 'EMAIL',
  },
  {
    label: 'Notification paie mensuelle',
    subject: '',
    message: 'Paie de Juillet 2026 traitée. Consultez votre bulletin sur le portail.',
    type: 'PAIE',
    channel: 'SMS',
  },
]

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { setNotifications(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { if (mounted) { setNotifications(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const stats = {
    total: notifications.length,
    envoyes: notifications.filter(n => n.status === 'ENVOYE' || n.status === 'LU').length,
    email: notifications.filter(n => n.channel === 'EMAIL').length,
    whatsapp: notifications.filter(n => n.channel === 'WHATSAPP').length,
    sms: notifications.filter(n => n.channel === 'SMS').length,
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#27698a]" />
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Email · WhatsApp · SMS · In-app · {stats.total} notification{stats.total > 1 ? 's' : ''} envoyée{stats.total > 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" className="bg-[#27698a] hover:bg-[#1f5570]" onClick={() => setWizardOpen(true)}>
          <Send className="w-4 h-4 mr-2" />
          Nouvelle notification
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Send} label="Total envoyées" value={stats.total} color="#27698a" />
        <StatCard icon={Mail} label="Emails" value={stats.email} color="#0ea5e9" />
        <StatCard icon={MessageCircle} label="WhatsApp" value={stats.whatsapp} color="#10b981" />
        <StatCard icon={Smartphone} label="SMS" value={stats.sms} color="#8b5cf6" />
      </div>

      {/* Historique */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-slate-900 text-sm">Historique des notifications</h2>
        </div>
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
          {notifications.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p>Aucune notification envoyée</p>
              <p className="text-xs mt-1">Créez votre première notification</p>
            </div>
          )}
          {notifications.map(n => {
            const channel = CHANNEL_META[n.channel] || CHANNEL_META.EMAIL
            const status = STATUS_META[n.status] || STATUS_META.EN_ATTENTE
            const typeColor = TYPE_META[n.type] || TYPE_META.INFO
            const ChannelIcon = channel.icon
            const StatusIcon = status.icon

            return (
              <div key={n.id} className="px-4 py-3 hover:bg-slate-50 flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${channel.color}`}>
                  <ChannelIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className={typeColor}>{n.type}</Badge>
                    <Badge variant="outline" className="text-xs">{channel.label}</Badge>
                    <span className={`text-xs flex items-center gap-1 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                  {n.subject && (
                    <div className="font-medium text-sm text-slate-900 truncate">{n.subject}</div>
                  )}
                  <div className="text-xs text-slate-600 mt-1 line-clamp-2 whitespace-pre-wrap">{n.message}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    À : {n.recipient} · {n.sentAt ? formatDate(n.sentAt.slice(0, 10)) : formatDate(n.createdAt.slice(0, 10))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="p-3 rounded-lg bg-sky-50 border border-sky-200 text-xs text-sky-800">
        <Lightbulb className="w-3.5 h-3.5 inline" /> <strong>Intégrations disponibles :</strong> Twilio (WhatsApp Business + SMS), SendGrid (Email).
        En mode démo, les notifications sont simulées et stockées en base. En production, configurez les clés API dans .env.
      </div>

      {wizardOpen && (
        <NotificationWizard onClose={() => setWizardOpen(false)} onSent={() => { setWizardOpen(false); load() }} />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <Card className="p-3 lg:p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '15', color }}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xl lg:text-2xl font-bold text-slate-900">{value}</div>
          <div className="text-xs text-slate-500">{label}</div>
        </div>
      </div>
    </Card>
  )
}

function NotificationWizard({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [form, setForm] = useState({
    recipient: '',
    channel: 'EMAIL',
    subject: '',
    message: '',
    type: 'INFO',
  })
  const [loading, setLoading] = useState(false)

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setForm({
      recipient: form.recipient,
      channel: template.channel,
      subject: template.subject,
      message: template.message,
      type: template.type,
    })
  }

  const handleSubmit = async () => {
    if (!form.recipient || !form.message) {
      toast.error('Destinataire et message requis')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success(`Notification ${CHANNEL_META[form.channel].label} envoyée`)
        onSent()
      } else {
        toast.error('Erreur lors de l\'envoi')
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#27698a]" />
            Nouvelle notification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Templates rapides */}
          <div>
            <Label className="text-sm font-medium">Templates rapides</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {TEMPLATES.map(t => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="p-2 rounded border border-slate-200 hover:bg-slate-50 text-xs text-left"
                >
                  <div className="font-medium text-slate-900">{t.label}</div>
                  <div className="text-[10px] text-slate-500">{CHANNEL_META[t.channel].label} · {t.type}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm">Destinataire *</Label>
            <Input
              value={form.recipient}
              onChange={e => setForm({ ...form, recipient: e.target.value })}
              className="mt-1"
              placeholder={form.channel === 'EMAIL' ? 'email@exemple.gn' : '+224 622 000 000'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Canal</Label>
              <Select value={form.channel} onValueChange={v => setForm({ ...form, channel: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(TYPE_META).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.channel === 'EMAIL' && (
            <div>
              <Label className="text-sm">Sujet</Label>
              <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1" />
            </div>
          )}

          <div>
            <Label className="text-sm">Message *</Label>
            <Textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              className="mt-1"
              rows={5}
              placeholder="Contenu du message..."
            />
            <div className="text-xs text-slate-400 mt-1">{form.message.length} caractères</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-[#27698a] hover:bg-[#1f5570]">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
