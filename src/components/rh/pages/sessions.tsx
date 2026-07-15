'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Monitor, Smartphone, Globe, Clock, LogOut, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Session {
  id: string
  ipAddress: string
  browser: string
  os: string
  device: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}

export function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      if (data.sessions) {
        setSessions(data.sessions)
      }
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId)
    try {
      const res = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Session révoquée')
        loadSessions()
      } else {
        toast.error(data.error || 'Échec')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setRevoking(null)
    }
  }

  const handleRevokeAll = async () => {
    if (!confirm('Déconnecter tous les autres appareils ? Vous resterez connecté sur celui-ci.')) return
    setRevoking('all')
    try {
      const res = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message || 'Sessions révoquées')
        loadSessions()
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setRevoking(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Appareils connectés</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos sessions actives — déconnectez les appareils non reconnus
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSessions}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Actualiser
          </Button>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleRevokeAll} disabled={revoking === 'all'}>
              {revoking === 'all' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <LogOut className="w-3.5 h-3.5 mr-1" />}
              Tout déconnecter
            </Button>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-8 text-center text-slate-400">
          <Monitor className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p>Aucune session active</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <Card key={s.id} className={`p-4 ${s.isCurrent ? 'border-[#27698a]/30 bg-[#27698a]/5' : ''}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    s.device === 'Mobile' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {s.device === 'Mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 text-sm">
                        {s.browser} sur {s.os}
                      </span>
                      {s.isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#27698a] text-white font-medium">
                          Cet appareil
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {s.ipAddress}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(s.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(s.id)}
                    disabled={revoking === s.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                  >
                    {revoking === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="w-3.5 h-3.5 mr-1" />
                        Déconnecter
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 border-blue-200 bg-blue-50">
        <p className="text-xs text-blue-800">
          <strong>Conseil sécurité :</strong> Si vous voyez un appareil que vous ne reconnaissez pas,
          déconnectez-le immédiatement et changez votre mot de passe.
        </p>
      </Card>
    </div>
  )
}
