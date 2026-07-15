'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, KeyRound, Eye, EyeOff, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { validatePassword } from '@/lib/security'

interface ChangePasswordModalProps {
  onClose: () => void
}

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const validation = validatePassword(newPassword)
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const canSubmit = validation.valid && passwordsMatch && currentPassword.length > 0 && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.remainingAttempts !== undefined) {
          toast.error(`${data.error} (${data.remainingAttempts} tentative(s) restante(s))`)
        } else {
          toast.error(data.error || 'Échec du changement de mot de passe')
        }
      } else {
        toast.success(data.message || 'Mot de passe modifié avec succès')
        onClose()
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const criteria = [
    { label: '8 caractères minimum', valid: newPassword.length >= 8 },
    { label: '1 majuscule', valid: /[A-Z]/.test(newPassword) },
    { label: '1 minuscule', valid: /[a-z]/.test(newPassword) },
    { label: '1 chiffre', valid: /[0-9]/.test(newPassword) },
    { label: '1 caractère spécial', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ]

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#27698a]" />
            Changer le mot de passe
          </DialogTitle>
          <DialogDescription>
            Pour votre sécurité, choisissez un mot de passe fort.
            Les autres sessions seront déconnectées.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mot de passe actuel */}
          <div>
            <Label htmlFor="current" className="text-xs font-medium">Mot de passe actuel</Label>
            <div className="relative mt-1">
              <Input
                id="current"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="pr-10"
                placeholder="••••••••"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <Label htmlFor="new" className="text-xs font-medium">Nouveau mot de passe</Label>
            <div className="relative mt-1">
              <Input
                id="new"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="pr-10"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Critères */}
            <div className="mt-2 grid grid-cols-1 gap-1">
              {criteria.map(c => (
                <div key={c.label} className="flex items-center gap-1.5 text-xs">
                  {c.valid ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <X className="w-3 h-3 text-slate-300" />
                  )}
                  <span className={c.valid ? 'text-emerald-700' : 'text-slate-400'}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <Label htmlFor="confirm" className="text-xs font-medium">Confirmer le nouveau mot de passe</Label>
            <div className="relative mt-1">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`pr-10 ${confirmPassword && !passwordsMatch ? 'border-red-300' : ''}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600 mt-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-[#27698a] hover:bg-[#1f5570]"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Modification...</>
              ) : (
                <><KeyRound className="w-4 h-4 mr-2" />Changer</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
