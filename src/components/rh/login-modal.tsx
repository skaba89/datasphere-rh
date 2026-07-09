'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'

interface LoginModalProps {
  onClose: () => void
  onSuccess: (user: { email: string; name: string; role: string }) => void
}

const DEMO_PASSWORD = 'demo123'

const DEMO_ACCOUNTS = [
  { email: 'admin@datasphere.gn', role: 'Super Admin', company: 'DataSphere Demo SARL' },
  { email: 'rh@datasphere.gn', role: 'RH', company: 'DataSphere Demo SARL' },
  { email: 'comptable@datasphere.gn', role: 'Comptable', company: 'DataSphere Demo SARL' },
  { email: 'manager@datasphere.gn', role: 'Manager', company: 'DataSphere Demo SARL' },
]

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('admin@datasphere.gn')
  const [password, setPassword] = useState(DEMO_PASSWORD)
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
          <DialogDescription className="text-xs text-slate-500">
            Connectez-vous à votre espace RH DataSphere
          </DialogDescription>
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
              placeholder="admin@datasphere.gn"
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
          <p className="text-xs font-semibold text-slate-700 mb-2">Comptes de démonstration (mot de passe : {DEMO_PASSWORD}) :</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => { setEmail(acc.email); setPassword(DEMO_PASSWORD) }}
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
