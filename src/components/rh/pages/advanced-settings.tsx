'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Shield, Bell, Plug, Lock, Users, Key, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Accès total plateforme multi-tenant', color: 'bg-red-100 text-red-700' },
  { key: 'ADMIN_ENTREPRISE', label: 'Admin Entreprise', desc: 'Gestion complète du tenant', color: 'bg-[#27698a]/10 text-[#27698a]' },
  { key: 'RH', label: 'RH', desc: 'Gestion employés, paie, congés', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'MANAGER', label: 'Manager', desc: 'Validation congés, équipe, évaluations', color: 'bg-amber-100 text-amber-700' },
  { key: 'COMPTABLE', label: 'Comptable', desc: 'Paie, déclarations, exports', color: 'bg-purple-100 text-purple-700' },
  { key: 'EMPLOYE', label: 'Employé', desc: 'Portail self-service', color: 'bg-sky-100 text-sky-700' },
]

const MODULES = [
  'dashboard', 'employees', 'payroll', 'leaves', 'time', 'budget', 'expenses',
  'recruitment', 'joboffers', 'evaluations', 'interviews', 'orgchart', 'training',
  'onboarding', 'skills', 'career', 'satisfaction', 'ai-insights', 'analytics',
  'ai', 'reports', 'vault', 'signature', 'notifications', 'compliance', 'contractors',
  'portal', 'exports', 'geo', 'forecasts', 'audit', 'settings'
]

const PERMISSIONS: Record<string, Record<string, { read: boolean; write: boolean; validate: boolean }>> = {
  SUPER_ADMIN: MODULES.reduce((acc, m) => ({ ...acc, [m]: { read: true, write: true, validate: true } }), {}),
  ADMIN_ENTREPRISE: MODULES.filter(m => m !== 'audit').reduce((acc, m) => ({ ...acc, [m]: { read: true, write: true, validate: true } }), {}),
  RH: ['dashboard', 'employees', 'contracts', 'leaves', 'evaluations', 'interviews', 'recruitment', 'joboffers', 'onboarding', 'skills', 'career', 'training', 'satisfaction', 'portal', 'reports'].reduce((acc, m) => ({ ...acc, [m]: { read: true, write: true, validate: true } }), {}),
  MANAGER: ['dashboard', 'employees', 'leaves', 'evaluations', 'interviews', 'orgchart', 'portal'].reduce((acc, m) => ({ ...acc, [m]: { read: true, write: m === 'leaves' || m === 'evaluations', validate: m === 'leaves' } }), {}),
  COMPTABLE: ['dashboard', 'employees', 'payroll', 'budget', 'expenses', 'exports', 'reports'].reduce((acc, m) => ({ ...acc, [m]: { read: true, write: true, validate: m === 'expenses' } }), {}),
  EMPLOYE: ['dashboard', 'portal', 'leaves'].reduce((acc, m) => ({ ...acc, [m]: { read: true, write: m === 'leaves', validate: false } }), {}),
}

const INTEGRATIONS = [
  { name: 'Twilio WhatsApp', desc: 'Notifications WhatsApp Business', icon: '💬', connected: true, category: 'Notifications' },
  { name: 'Twilio SMS', desc: 'Envoi SMS aux employés', icon: '📱', connected: true, category: 'Notifications' },
  { name: 'SendGrid Email', desc: 'Envoi emails transactionnels', icon: '📧', connected: true, category: 'Notifications' },
  { name: 'Slack', desc: 'Notifications canal Slack', icon: '💼', connected: false, category: 'Notifications' },
  { name: 'Microsoft Teams', desc: 'Intégration Teams', icon: 'Teams', connected: false, category: 'Notifications' },
  { name: 'Google Workspace', desc: 'Calendar, Drive, Gmail', icon: 'Google', connected: false, category: 'Productivité' },
  { name: 'Microsoft 365', desc: 'Outlook, SharePoint', icon: 'MS', connected: false, category: 'Productivité' },
  { name: 'Stripe', desc: 'Paiements abonnements SaaS', icon: '💳', connected: false, category: 'Paiement' },
  { name: 'Orange Money', desc: 'Paiements mobiles Guinée', icon: '🟠', connected: false, category: 'Paiement' },
]

export function AdvancedSettingsPage() {
  const [selectedRole, setSelectedRole] = useState('RH')
  const [activeTab, setActiveTab] = useState<'roles' | 'integrations' | 'security'>('roles')

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-2"><Settings className="w-6 h-6 text-[#27698a]" />Paramètres avancés</h1>
        <p className="text-sm text-slate-500 mt-1">Rôles &amp; permissions, intégrations, sécurité</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {([
          { key: 'roles', label: 'Rôles & permissions', icon: Key },
          { key: 'integrations', label: 'Intégrations', icon: Plug },
          { key: 'security', label: 'Sécurité', icon: Shield },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-[#27698a] text-[#27698a]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <tab.icon className="w-4 h-4 inline mr-2" />{tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Rôles & permissions */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {ROLES.map(role => (
              <button key={role.key} onClick={() => setSelectedRole(role.key)}
                className={`p-3 rounded-lg border text-left transition-colors ${selectedRole === role.key ? 'border-[#27698a] bg-[#27698a]/5 ring-1 ring-[#27698a]' : 'border-slate-200 hover:bg-slate-50'}`}>
                <Badge variant="outline" className={role.color + ' text-[10px] mb-1'}>{role.label}</Badge>
                <p className="text-xs text-slate-500">{role.desc}</p>
              </button>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><Lock className="w-4 h-4 text-[#27698a]" />Matrice permissions — {ROLES.find(r => r.key === selectedRole)?.label}</h2>
              <Button size="sm" variant="outline" onClick={() => toast.success('Permissions sauvegardées')}>Sauvegarder</Button>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr className="text-left text-xs text-slate-600 uppercase">
                    <th className="px-3 py-2">Module</th>
                    <th className="px-3 py-2 text-center">Lecture</th>
                    <th className="px-3 py-2 text-center">Écriture</th>
                    <th className="px-3 py-2 text-center">Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map(mod => {
                    const perms = PERMISSIONS[selectedRole]?.[mod] || { read: false, write: false, validate: false }
                    return (
                      <tr key={mod} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-medium text-slate-700">{mod}</td>
                        <td className="px-3 py-2 text-center">{perms.read ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                        <td className="px-3 py-2 text-center">{perms.write ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                        <td className="px-3 py-2 text-center">{perms.validate ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Intégrations */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTEGRATIONS.map(integ => (
            <Card key={integ.name} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">{integ.icon}</div>
                <Badge variant="outline" className={integ.connected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>
                  {integ.connected ? '● Connecté' : '○ Non connecté'}
                </Badge>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{integ.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{integ.desc}</p>
              <p className="text-[10px] text-slate-400 mt-1">{integ.category}</p>
              <Button variant={integ.connected ? 'outline' : 'default'} size="sm" className="w-full mt-3 h-7 text-xs"
                onClick={() => toast.info(integ.connected ? 'Déconnexion...' : 'Configuration...')}>
                {integ.connected ? 'Déconnecter' : 'Connecter'}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Sécurité */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-[#27698a]" />Politique de sécurité</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingToggle label="Authentification 2FA obligatoire" desc="Pour Admin et Super Admin" enabled />
              <SettingToggle label="Rotation mot de passe" desc="Tous les 90 jours" enabled />
              <SettingToggle label="Verrouillage compte" desc="Après 5 échecs (15 min)" enabled />
              <SettingToggle label="Session timeout" desc="Déconnexion après 30 min d'inactivité" enabled />
              <SettingToggle label="IP whitelist" desc="Restreindre accès par IP" enabled={false} />
              <SettingToggle label="Audit trail immuable" desc="Logs append-only, rétention 10 ans" enabled />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-[#27698a]" />Chiffrement &amp; données</h2>
            <div className="space-y-2">
              <SecurityRow label="Chiffrement at-rest" value="AES-256" status="ok" />
              <SecurityRow label="Chiffrement in-transit" value="TLS 1.3 + HSTS" status="ok" />
              <SecurityRow label="Backup automatique" value="Quotidien, RPO 24h" status="ok" />
              <SecurityRow label="Disaster recovery" value="Testé trimestriellement" status="ok" />
              <SecurityRow label="Conformité RGPD" value="Registre traitements actif" status="ok" />
              <SecurityRow label="Conformité CNSS Guinée" value="Déclarations automatisées" status="ok" />
              <SecurityRow label="Pentest annuel" value="Dernier : Mars 2026" status="warning" />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function SettingToggle({ label, desc, enabled }: { label: string; desc: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled)
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200">
      <div><div className="text-sm font-medium text-slate-900">{label}</div><div className="text-xs text-slate-500">{desc}</div></div>
      <button onClick={() => setOn(!on)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${on ? 'bg-[#27698a]' : 'bg-slate-300'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function SecurityRow({ label, value, status }: { label: string; value: string; status: 'ok' | 'warning' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">{value}</span>
        {status === 'ok' ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="w-4 h-4 rounded-full bg-amber-400" />}
      </div>
    </div>
  )
}
