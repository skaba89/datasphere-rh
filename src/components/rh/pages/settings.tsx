'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Building2, Users, Calculator, Bell } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configuration du tenant — Demo SARL
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Société */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-[#27698a]" />
            <h2 className="font-semibold text-slate-900">Société</h2>
          </div>
          <div className="space-y-3">
            <Field label="Raison sociale" value="Demo SARL" />
            <Field label="Sigle" value="DS" />
            <Field label="NIF" value="GN-CONAKRY-001-2024" />
            <Field label="RC" value="RC/Conakry/2024/A-001" />
            <Field label="Numéro CNSS" value="CNSS-001-2024" />
            <Field label="Adresse" value="Hamdallaye, Route Le Prince, Conakry" />
            <Field label="Email" value="contact@demo.gn" />
            <Field label="Téléphone" value="+224 622 000 000" />
          </div>
        </Card>

        {/* CNSS */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-[#478e5e]" />
            <h2 className="font-semibold text-slate-900">Paramètres CNSS</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CNSS salarié" value="5%" />
            <Field label="CNSS employeur" value="8%" />
            <Field label="Plafond CNSS" value="4 640 000 GNF" />
            <Field label="SMIG mensuel" value="580 000 GNF" />
            <Field label="RTS" value="1%" />
            <Field label="Versement forfaitaire" value="4%" />
            <Field label="Taxe apprentissage" value="1%" />
            <Field label="Formation pro" value="3%" />
          </div>
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            ⚠️ Date d'effet : 01/01/2024. Toute modification crée une nouvelle version.
          </div>
        </Card>

        {/* Roles */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#96783c]" />
            <h2 className="font-semibold text-slate-900">Utilisateurs &amp; rôles</h2>
          </div>
          <div className="space-y-2">
            {[
              { email: 'admin@demo.gn', role: 'Admin Entreprise', status: 'Actif' },
              { email: 'rh@demo.gn', role: 'RH', status: 'Actif' },
              { email: 'comptable@demo.gn', role: 'Comptable', status: 'Actif' },
              { email: 'manager@demo.gn', role: 'Manager', status: 'Actif' },
            ].map(u => (
              <div key={u.email} className="flex items-center justify-between p-2 rounded border border-slate-200">
                <div>
                  <div className="text-sm font-medium text-slate-900">{u.email}</div>
                  <div className="text-xs text-slate-500">{u.role}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {u.status}
                </span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            Inviter un utilisateur
          </Button>
        </Card>

        {/* Notifications */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-[#b94659]" />
            <h2 className="font-semibold text-slate-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            <Toggle label="Email" desc="Notifications par email" enabled />
            <Toggle label="WhatsApp" desc="Notifications WhatsApp Business" enabled />
            <Toggle label="SMS" desc="Notifications SMS via Twilio" disabled />
            <Toggle label="Push mobile" desc="Notifications push (app mobile)" disabled />
          </div>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-xs text-slate-500 font-medium">{label}</Label>
      <div className="mt-1 p-2 rounded border border-slate-200 bg-slate-50 text-sm text-slate-900">
        {value}
      </div>
    </div>
  )
}

function Toggle({ label, desc, enabled, disabled }: { label: string; desc: string; enabled?: boolean; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded border border-slate-200">
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
        enabled && !disabled ? 'bg-[#27698a]' : 'bg-slate-300'
      }`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
          enabled && !disabled ? 'translate-x-5' : ''
        }`}></div>
      </div>
    </div>
  )
}
