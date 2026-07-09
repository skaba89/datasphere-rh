'use client'
import { useEffect, useState, useRef } from 'react'
import { Bell, Check, CheckCheck, AlertTriangle, FileText, Calendar, DollarSign, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface NotifItem {
  id: string
  recipient: string
  channel: string
  subject: string | null
  message: string
  status: string // EN_ATTENTE | ENVOYE | ECHEC | LU
  type: string // INFO | ALERTE | CONGE | PAIE | CONTRAT
  metadata: any
  sentAt: string | null
  createdAt: string
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  INFO: { icon: Info, color: 'text-sky-600', bg: 'bg-sky-50' },
  ALERTE: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  CONTRAT: { icon: FileText, color: 'text-[#27698a]', bg: 'bg-[#27698a]/10' },
  CONGE: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  PAIE: { icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

const SEVERITY_META: Record<string, { color: string }> = {
  EXPIRE: { color: 'text-red-700 bg-red-100 border-red-200' },
  URGENT: { color: 'text-red-700 bg-red-100 border-red-200' },
  ATTENTION: { color: 'text-amber-700 bg-amber-100 border-amber-200' },
  SURVEILLER: { color: 'text-sky-700 bg-sky-100 border-sky-200' },
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/notifications?channel=IN_APP&limit=20')
      .then(r => r.json())
      .then(d => { setNotifs(d.notifications || []); setUnread(d.unread || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  // Polling toutes les 60s
  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  // Fermer en cliquant à l'extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'LU' }),
      })
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, status: 'LU' } : n))
      setUnread(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('Erreur')
    }
  }

  const markAllRead = async () => {
    try {
      const r = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      const d = await r.json()
      if (d.success) {
        setNotifs(prev => prev.map(n => ({ ...n, status: 'LU' })))
        setUnread(0)
        toast.success(`${d.updated} notification(s) marquée(s) lue(s)`)
      }
    } catch { toast.error('Erreur') }
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return 'à l\'instant'
    if (diffMin < 60) return `il y a ${diffMin} min`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `il y a ${diffH}h`
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) load() }}
        className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        title="Notifications"
      >
        <Bell className={`w-5 h-5 ${unread > 0 ? 'text-[#27698a]' : 'text-slate-600'}`} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#27698a]" />
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              {unread > 0 && <Badge variant="outline" className="text-[9px] bg-red-50 text-red-700 border-red-200">{unread} non lue{unread > 1 ? 's' : ''}</Badge>}
            </div>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#27698a] hover:bg-[#27698a]/10" onClick={markAllRead}>
                <CheckCheck className="w-3 h-3 mr-1" />Tout marquer lu
              </Button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {loading && notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-xs">Chargement…</div>
            ) : notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400">
                <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">Aucune notification</p>
              </div>
            ) : (
              notifs.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.INFO
                const severity = n.metadata?.severity
                const sevMeta = severity ? SEVERITY_META[severity] : null
                const isUnread = n.status !== 'LU'
                return (
                  <div key={n.id} className={`px-4 py-3 hover:bg-slate-50 transition-colors ${isUnread ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                        <meta.icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs font-semibold text-slate-900 truncate">{n.subject || n.type}</p>
                          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#27698a] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[9px] text-slate-400">{formatTime(n.createdAt)}</span>
                          {sevMeta && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${sevMeta.color}`}>{severity}</span>
                          )}
                          {isUnread && (
                            <button onClick={() => markAsRead(n.id)} className="text-[9px] text-[#27698a] hover:underline flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />Marquer lu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-center">
            <button onClick={() => { setOpen(false); /* could navigate to notifications page */ }} className="text-[10px] text-[#27698a] hover:underline">
              Voir toutes les notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
