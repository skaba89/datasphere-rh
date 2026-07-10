'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard, LayoutGrid, Users, Calculator, CalendarDays, Settings, ScrollText,
  Briefcase, Sparkles, BarChart3, Lock, Award, Network, Bell, Download,
  User, Clock, GraduationCap, PenTool, Wallet, ClipboardList, Activity,
  FileText, Smile, Brain, ShieldCheck, Receipt, MessageSquare, Compass, Lightbulb, MapPinned, TrendingUp, Settings2, Heart, RefreshCw, Megaphone, LifeBuoy, Calendar, Globe, Trophy, Gift, HandCoins, CalendarClock, Package, AlertTriangle, Zap, FolderKanban, GitBranch, Bot, ShieldAlert, Users2, HeartHandshake, Leaf, AlertOctagon, Plane, FileSignature, Database, Boxes, Loader2
} from 'lucide-react'
import type { PageKey } from '@/app/page'

interface SidebarProps {
  current: PageKey
  onNavigate: (page: PageKey) => void
  mobileOpen?: boolean
  onClose?: () => void
  companyId?: string
}

type NavItem = { key: PageKey; label: string; icon: React.ElementType; badge?: string }
type NavSection = { title: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Pilotage',
    items: [
      { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { key: 'pilotage', label: 'Pilotage consolidé', icon: Zap },
      { key: 'customdash', label: 'Dashboard custom', icon: LayoutGrid },
      { key: 'calendar', label: 'Calendrier global', icon: Calendar },
      { key: 'employees', label: 'Employés', icon: Users },
      { key: 'payroll', label: 'Paie & CNSS', icon: Calculator },
      { key: 'leaves', label: 'Congés & absences', icon: CalendarDays, badge: '3' },
      { key: 'time', label: 'Temps & présence', icon: Clock },
      { key: 'geo', label: 'Géolocalisation', icon: MapPinned },
      { key: 'budget', label: 'Budget RH', icon: Wallet },
      { key: 'expenses', label: 'Notes de frais', icon: Receipt, badge: '5' },
      { key: 'loans', label: 'Prêts & Avances', icon: HandCoins },
      { key: 'shifts', label: 'Planning équipe', icon: CalendarClock },
      { key: 'accounting', label: 'Comptabilité', icon: Calculator },
      { key: 'referential', label: 'Référentiel', icon: Briefcase },
    ],
  },
  {
    title: 'Talent',
    items: [
      { key: 'recruitment', label: 'Recrutement', icon: Briefcase },
      { key: 'joboffers', label: 'Offres d\'emploi', icon: FileText },
      { key: 'evaluations', label: 'Évaluations', icon: Award },
      { key: 'feedback360', label: 'Feedback 360°', icon: RefreshCw },
      { key: 'interviews', label: 'Entretiens', icon: MessageSquare },
      { key: 'orgchart', label: 'Organigramme', icon: Network },
      { key: 'training', label: 'Formation', icon: GraduationCap },
      { key: 'onboarding', label: 'Onboarding', icon: ClipboardList },
      { key: 'skills', label: 'Compétences', icon: Brain },
      { key: 'career', label: 'Plan de carrière', icon: Compass },
      { key: 'health', label: 'Santé & Wellness', icon: Heart },
      { key: 'wellness', label: 'Bien-être', icon: Trophy },
      { key: 'benefits', label: 'Avantages sociaux', icon: Gift },
      { key: 'equipment', label: 'Inventaire matériel', icon: Package },
      { key: 'conflicts', label: 'Conflits', icon: AlertTriangle },
      { key: 'gamification', label: 'Gamification', icon: Trophy },
      { key: 'mentoring', label: 'Mentoring', icon: HeartHandshake },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { key: 'satisfaction', label: 'Satisfaction', icon: Smile },
      { key: 'announcements', label: 'Communication', icon: Megaphone },
      { key: 'helpdesk', label: 'Helpdesk RH', icon: LifeBuoy },
      { key: 'cse', label: 'CSE / IRP', icon: Users2 },
      { key: 'diversity', label: 'Diversité & Inclusion', icon: Heart },
    ],
  },
  {
    title: 'Analytics & IA',
    items: [
      { key: 'ai-insights', label: 'Aide décision IA', icon: Lightbulb },
      { key: 'forecasts', label: 'Prévisions IA', icon: TrendingUp },
      { key: 'analytics', label: 'Analytics RH', icon: Activity },
      { key: 'ai', label: 'IA RH', icon: Sparkles },
      { key: 'chatbot', label: 'Chatbot RH', icon: Bot },
      { key: 'reports', label: 'Reporting DG', icon: BarChart3 },
      { key: 'custom-reports', label: 'Rapports custom', icon: BarChart3 },
      { key: 'rh-projects', label: 'Projets RH', icon: FolderKanban },
      { key: 'predictive', label: 'IA prédictive', icon: Brain },
    ],
  },
  {
    title: 'Premium',
    items: [
      { key: 'vault', label: 'Coffre-fort RH', icon: Lock },
      { key: 'signature', label: 'Signature e-', icon: PenTool },
      { key: 'notifications', label: 'Notifications', icon: Bell },
      { key: 'compliance', label: 'Conformité', icon: ShieldCheck },
      { key: 'contractors', label: 'Prestataires B2B', icon: Briefcase },
      { key: 'doc-traceability', label: 'Traçabilité docs', icon: GitBranch },
      { key: 'risks', label: 'Gestion risques', icon: ShieldAlert },
      { key: 'crisis', label: 'Gestion de crise', icon: AlertOctagon },
      { key: 'rse', label: 'Durabilité RSE', icon: Leaf },
      { key: 'contracts-mgmt', label: 'Contrats fournisseurs', icon: FileSignature },
      { key: 'blockchain', label: 'Blockchain', icon: Boxes },
    ],
  },
  {
    title: 'Self-service',
    items: [
      { key: 'portal', label: 'Portail employé', icon: User },
      { key: 'exports', label: 'Exports Excel/PDF', icon: Download },
      { key: 'language', label: 'Multi-langue', icon: Globe },
      { key: 'webhooks', label: 'API & Webhooks', icon: Zap },
      { key: 'international', label: 'International', icon: Plane },
    ],
  },
  {
    title: 'Administration',
    items: [
      { key: 'audit', label: "Journal d'audit", icon: ScrollText },
      { key: 'data-governance', label: 'Gouvernance données', icon: Database },
      { key: 'advsettings', label: 'Paramètres avancés', icon: Settings2 },
      { key: 'settings', label: 'Paramètres', icon: Settings },
    ],
  },
]

export function Sidebar({ current, onNavigate, mobileOpen, onClose, companyId }: SidebarProps) {
  const [enabledModules, setEnabledModules] = useState<Set<string> | null>(null)

  useEffect(() => {
    let mounted = true
    setEnabledModules(null)
    fetch('/api/modules')
      .then(r => r.json())
      .then(d => {
        if (mounted) {
          setEnabledModules(new Set(d.enabledModules || []))
        }
      })
      .catch(() => {
        if (mounted) setEnabledModules(new Set())
      })
    return () => { mounted = false }
  }, [companyId]) // Re-fetch when company changes

  // Filtrer les sections selon les modules activés
  const filteredSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item =>
      !enabledModules || enabledModules.has(item.key)
    ),
  })).filter(section => section.items.length > 0)

  // État de chargement
  if (enabledModules === null) {
    return (
      <aside className="hidden md:flex w-60 lg:w-64 shrink-0 border-r border-slate-200 bg-white flex-col">
        <nav className="flex-1 p-3 lg:p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </nav>
      </aside>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 lg:w-64 shrink-0 border-r border-slate-200 bg-white flex-col">
        <SidebarContent
          sections={filteredSections}
          current={current}
          onNavigate={onNavigate}
        />
      </aside>

      {/* Mobile sidebar (overlay) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="relative w-72 max-w-[80vw] bg-white flex flex-col shadow-xl">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200">
              <span className="font-semibold text-slate-900 text-sm">Menu</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
              >
                ✕
              </button>
            </div>
            <SidebarContent
              sections={filteredSections}
              current={current}
              onNavigate={(p) => {
                onNavigate(p)
                onClose?.()
              }}
            />
          </aside>
        </div>
      )}
    </>
  )
}

function SidebarContent({
  sections,
  current,
  onNavigate,
}: {
  sections: NavSection[]
  current: PageKey
  onNavigate: (page: PageKey) => void
}) {
  return (
    <>
      <nav className="flex-1 p-3 lg:p-4 space-y-4 overflow-y-auto">
        {sections.map(section => (
          <div key={section.title}>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold px-3 mb-2">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map(item => (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    current === item.key
                      ? 'bg-[#27698a] text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      current === item.key ? 'bg-white text-[#27698a]' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 lg:p-4 border-t border-slate-200">
        <div className="rounded-lg bg-gradient-to-br from-[#27698a]/10 to-[#478e5e]/10 p-3 border border-[#27698a]/20">
          <div className="text-xs font-semibold text-slate-900 mb-1">Période active</div>
          <div className="text-sm text-slate-700">Juillet 2026</div>
          <div className="text-[10px] text-slate-500 mt-1">Statut : OUVERTE</div>
        </div>
      </div>
    </>
  )
}
