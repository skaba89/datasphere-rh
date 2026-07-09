'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'

interface LoginModalProps {
  onClose: () => void
  onSuccess: (user: { email: string; name: string; role: string }) => void
}

const DEMO_ACCOUNTS = [
  { email: 'admin@demo.gn', role: 'Admin Entreprise', company: 'Demo SARL' },
  { email: 'rh@demo.gn', role: 'RH', company: 'Demo SARL' },
  { email: 'comptable@demo.gn', role: 'Comptable', company: 'Demo SARL' },
  { email: 'manager@demo.gn', role: 'Manager', company: 'Demo SARL' },
  { email: 'admin@minebokedemo.gn', role: 'Admin Mine', company: 'Mine de Boké' },
]

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('admin@demo.gn')
  const [password, setPassword] = useState('Demo1234!')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Connexion échouée')
      } else {
        toast.success(`Bienvenue ${data.user.name}`)
        onSuccess(data.user)
      }
    } catch {
      toast.error('Erreur réseau')
    }
    setLoading(false)
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#27698a] to-[#435862] flex items-center justify-center text-white font-bold text-sm">
              DS
            </div>
            Connexion
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1"
              placeholder="admin@demo.gn"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1"
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-[#27698a] hover:bg-[#1f5570]" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-700 mb-2">Comptes de démonstration (mot de passe : Demo1234!) :</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => { setEmail(acc.email); setPassword('Demo1234!') }}
                className="w-full text-left p-2 rounded border border-slate-200 hover:bg-slate-50 text-xs"
              >
                <div className="font-medium text-slate-900">{acc.email}</div>
                <div className="text-slate-500">{acc.role} · {acc.company}</div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
