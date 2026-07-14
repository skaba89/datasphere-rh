'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/rh/sidebar'
import { DashboardPage } from '@/components/rh/pages/dashboard'
import { EmployeesPage } from '@/components/rh/pages/employees'
import { PayrollPage } from '@/components/rh/pages/payroll'
import { LeavesPage } from '@/components/rh/pages/leaves'
import { SettingsPage } from '@/components/rh/pages/settings'
import { AuditPage } from '@/components/rh/pages/audit'
import { RecruitmentPage } from '@/components/rh/pages/recruitment'
import { AIPage } from '@/components/rh/pages/ai'
import { DGReportPage } from '@/components/rh/pages/dg-report'
import { VaultPage } from '@/components/rh/pages/vault'
import { EvaluationsPage } from '@/components/rh/pages/evaluations'
import { OrgChartPage } from '@/components/rh/pages/orgchart'
import { NotificationsPage } from '@/components/rh/pages/notifications'
import { ExportsPage } from '@/components/rh/pages/exports'
import { EmployeePortalPage } from '@/components/rh/pages/employee-portal'
import { TimeTrackingPage } from '@/components/rh/pages/time-tracking'
import { TrainingPage } from '@/components/rh/pages/training'
import { SignaturePage } from '@/components/rh/pages/signature'
import { BudgetPage } from '@/components/rh/pages/budget'
import { OnboardingPage } from '@/components/rh/pages/onboarding'
import { AnalyticsPage } from '@/components/rh/pages/analytics'
import { JobOffersPage } from '@/components/rh/pages/job-offers'
import { SatisfactionPage } from '@/components/rh/pages/satisfaction'
import { SkillsPage } from '@/components/rh/pages/skills'
import { CompliancePage } from '@/components/rh/pages/compliance'
import { ExpensesPage } from '@/components/rh/pages/expenses'
import { InterviewsPage } from '@/components/rh/pages/interviews'
import { CareerPage } from '@/components/rh/pages/career'
import { ContractorsPage } from '@/components/rh/pages/contractors'
import { AIInsightsPage } from '@/components/rh/pages/ai-insights'
import { GeoPage } from '@/components/rh/pages/geo'
import { ForecastsPage } from '@/components/rh/pages/forecasts'
import { AdvancedSettingsPage } from '@/components/rh/pages/advanced-settings'
import { CustomDashboardPage } from '@/components/rh/pages/custom-dashboard'
import { HealthPage } from '@/components/rh/pages/health'
import { Feedback360Page } from '@/components/rh/pages/feedback360'
import { AnnouncementsPage } from '@/components/rh/pages/announcements'
import { HelpdeskPage } from '@/components/rh/pages/helpdesk'
import { CalendarPage } from '@/components/rh/pages/calendar'
import { WellnessPage } from '@/components/rh/pages/wellness'
import { LanguagePage } from '@/components/rh/pages/language'
import { BenefitsPage } from '@/components/rh/pages/benefits'
import { LoansPage } from '@/components/rh/pages/loans'
import { ShiftsPage } from '@/components/rh/pages/shifts'
import { EquipmentPage } from '@/components/rh/pages/equipment'
import { AccountingPage } from '@/components/rh/pages/accounting'
import { ConflictsPage } from '@/components/rh/pages/conflicts'
import { CustomReportsPage } from '@/components/rh/pages/custom-reports'
import { WebhooksPage } from '@/components/rh/pages/webhooks'
import { ReferentialPage } from '@/components/rh/pages/referential'
import { GamificationPage } from '@/components/rh/pages/gamification'
import { RHProjectsPage } from '@/components/rh/pages/rh-projects'
import { DocTraceabilityPage } from '@/components/rh/pages/doc-traceability'
import { ChatbotPage } from '@/components/rh/pages/chatbot'
import { RisksPage } from '@/components/rh/pages/risks'
import { MentoringPage } from '@/components/rh/pages/mentoring'
import { CSEPage } from '@/components/rh/pages/cse'
import { DiversityPage } from '@/components/rh/pages/diversity'
import { CrisisPage } from '@/components/rh/pages/crisis'
import { InternationalPage } from '@/components/rh/pages/international'
import { RSEPage } from '@/components/rh/pages/rse'
import { ContractsMgmtPage } from '@/components/rh/pages/contracts-mgmt'
import { PredictivePage } from '@/components/rh/pages/predictive'
import { DataGovernancePage } from '@/components/rh/pages/data-governance'
import { BlockchainPage } from '@/components/rh/pages/blockchain'
import { PilotagePage } from '@/components/rh/pages/pilotage'
import { NotificationsBell } from '@/components/rh/notifications-bell'
import { EmployeeWizard } from '@/components/rh/employee-wizard'
import { LoginModal } from '@/components/rh/login-modal'
import { CompanySelector } from '@/components/rh/company-selector'
import { EmployeeDetailModal } from '@/components/rh/employee-detail'
import { ImportModal } from '@/components/rh/import-modal'
import { FiscalReportsPage } from '@/components/rh/pages/fiscal-reports'
import { HelpPage } from '@/components/rh/pages/help'
import { LogOut, LogIn, Upload, Users, Wallet, CalendarDays, FileText, Target, BarChart3, GraduationCap, Bot, ShieldCheck, ClipboardList, Menu, Building2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
}

export type PageKey = 'dashboard' | 'pilotage' | 'customdash' | 'calendar' | 'employees' | 'payroll' | 'leaves' | 'recruitment' | 'joboffers' | 'evaluations' | 'orgchart' | 'ai' | 'reports' | 'analytics' | 'vault' | 'signature' | 'notifications' | 'exports' | 'portal' | 'time' | 'training' | 'budget' | 'onboarding' | 'satisfaction' | 'skills' | 'compliance' | 'expenses' | 'interviews' | 'career' | 'contractors' | 'ai-insights' | 'geo' | 'forecasts' | 'health' | 'feedback360' | 'announcements' | 'helpdesk' | 'wellness' | 'language' | 'benefits' | 'loans' | 'shifts' | 'equipment' | 'accounting' | 'conflicts' | 'custom-reports' | 'webhooks' | 'referential' | 'gamification' | 'rh-projects' | 'doc-traceability' | 'chatbot' | 'risks' | 'mentoring' | 'cse' | 'diversity' | 'crisis' | 'international' | 'rse' | 'contracts-mgmt' | 'predictive' | 'data-governance' | 'blockchain' | 'advsettings' | 'settings' | 'audit' | 'fiscal-reports' | 'help'

export default function Home() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [employeesTick, setEmployeesTick] = useState(0)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  // Vérifier la session au chargement
  useEffect(() => {
    let mounted = true
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (mounted) { setUser(d.user || null); setLoadingUser(false) } })
      .catch(() => { if (mounted) setLoadingUser(false) })
    return () => { mounted = false }
  }, [])

  // Ouvrir wizard depuis n'importe où
  useEffect(() => {
    const handler = () => setWizardOpen(true)
    window.addEventListener('open-employee-wizard', handler)
    return () => window.removeEventListener('open-employee-wizard', handler)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setPage('dashboard')
    toast.success('Déconnecté')
  }

  // === État de chargement ===
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#27698a] to-[#435862] flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 animate-pulse">
            DS
          </div>
          <p className="text-sm text-slate-500">Chargement de DataSphere RH...</p>
        </div>
      </div>
    )
  }

  // === Page d'accueil publique (non connecté) ===
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-[#27698a]/5">
        {/* Header minimal */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-slate-200 h-14 flex items-center px-4 lg:px-6">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#27698a] to-[#435862] flex items-center justify-center text-white font-bold text-sm">
              DS
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-slate-900 text-sm">DataSphere RH</span>
              <span className="text-[10px] text-slate-500 -mt-0.5">Guinée · SIRH Premium</span>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-1.5 text-xs text-white bg-[#27698a] hover:bg-[#1f5570] px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Se connecter
            </button>
          </div>
        </header>

        {/* Hero section */}
        <main className="flex-1 flex items-center justify-center px-4 lg:px-6 py-12 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#27698a]/10 text-[#27698a] text-xs font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#27698a] animate-pulse"></span>
              SIRH Premium · Conforme au Code du travail guinéen
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Gérez vos ressources humaines
              <span className="block bg-gradient-to-r from-[#27698a] to-[#478e5e] bg-clip-text text-transparent">
                avec intelligence et simplicité
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Plateforme RH complète : paie & CNSS, congés, contrats, recrutement,
              formations, évaluations, analytics. Adaptée au contexte guinéen.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <button
                onClick={() => setLoginOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#27698a] hover:bg-[#1f5570] text-white rounded-lg font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Accéder à la plateforme
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium transition-colors"
              >
                Découvrir les fonctionnalités
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: '60+', label: 'Modules RH' },
                { value: '24', label: 'Employés démo' },
                { value: '2', label: 'Sociétés' },
                { value: '100%', label: 'Conforme Guinée' },
              ].map(stat => (
                <div key={stat.label} className="p-4 rounded-xl bg-white border border-slate-200">
                  <div className="text-2xl lg:text-3xl font-bold text-[#27698a]">{stat.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Features section */}
        <section id="features" className="px-4 lg:px-6 py-16 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-12">
              Une suite complète pour la gestion RH
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Users, title: 'Gestion des employés', desc: 'Fiches détaillées, contrats, documents, historique. Wizard de création en 5 étapes.' },
                { icon: Wallet, title: 'Paie & CNSS', desc: 'Calculs conformes CNSS (5%/17%), ITS 1.5%, versement forfaitaire. Bulletins PDF.' },
                { icon: CalendarDays, title: 'Congés & absences', desc: 'Workflow de validation multi-niveaux. Gestion des soldes et types de congés.' },
                { icon: FileText, title: 'Contrats & documents', desc: 'Génération automatique de CDI, CDD, lettres, attestations par IA.' },
                { icon: Target, title: 'Recrutement', desc: 'Pipeline candidats, offres d\'emploi, entretiens, lettres d\'embauche.' },
                { icon: BarChart3, title: 'Analytics & reporting', desc: 'Tableaux de bord, KPIs, pyramide des âges, turnover, prévisions.' },
                { icon: GraduationCap, title: 'Formations', desc: 'Planification, inscriptions, suivi des compétences et évaluations.' },
                { icon: Bot, title: 'IA & Chatbot', desc: 'Assistant RH propulsé par GLM-4. Génération de documents juridiques.' },
                { icon: ShieldCheck, title: 'Audit & sécurité', desc: 'Traçabilité complète, multi-tenant, rôles et permissions.' },
              ].map(f => {
                const Icon = f.icon
                return (
                  <div key={f.title} className="p-5 rounded-xl border border-slate-200 hover:border-[#27698a]/30 hover:shadow-md transition-all">
                    <div className="w-10 h-10 rounded-lg bg-[#27698a]/10 text-[#27698a] flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Target audience section */}
        <section id="audience" className="px-4 lg:px-6 py-16 bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-12">
              Conçu pour les entreprises guinéennes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, title: 'PME', desc: '5 à 50 employés', detail: 'Gestion simple et abordable : paie, congés, contrats' },
                { icon: Building2, title: 'Sociétés de services', desc: '50 à 200 employés', detail: 'Multi-sociétés, recrutement, formations, analytics' },
                { icon: Wallet, title: 'Commerces & Distribution', desc: '10 à 100 employés', detail: 'Pointage, planning, notes de frais' },
                { icon: Users, title: 'ONG & Organisations', desc: '20 à 500 employés', detail: 'Multi-projets, conformité, reporting avancé' },
              ].map(a => {
                const Icon = a.icon
                return (
                  <div key={a.title} className="p-5 rounded-xl bg-white border border-slate-200 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#27698a]/10 text-[#27698a] flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{a.title}</h3>
                    <p className="text-xs text-[#27698a] font-medium mt-0.5">{a.desc}</p>
                    <p className="text-sm text-slate-600 mt-2">{a.detail}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pricing section */}
        <section id="pricing" className="px-4 lg:px-6 py-16 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-4">
              Des tarifs adaptés au marché guinéen
            </h2>
            <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
              Vous ne payez que pour les modules que vous utilisez. Tarifs en GNF, sans engagement.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: 'Starter',
                  price: '150 000',
                  period: 'GNF / mois',
                  target: 'Moins de 10 employés',
                  features: ['5 modules essentiels', 'Paie & CNSS conforme', 'Congés & absences', 'Support email'],
                  cta: 'Démarrer',
                  highlighted: false,
                },
                {
                  name: 'Business',
                  price: '750 000',
                  period: 'GNF / mois',
                  target: '10 à 50 employés',
                  features: ['20 modules', 'Recrutement & formations', 'Rapports fiscaux', 'Multi-sociétés', 'Support prioritaire'],
                  cta: 'Essai gratuit',
                  highlighted: true,
                },
                {
                  name: 'Enterprise',
                  price: 'Sur devis',
                  period: '',
                  target: '50+ employés',
                  features: ['Tous les 70+ modules', 'IA prédictive & blockchain', 'SSO & sécurité avancée', 'Support 24/7', 'Formation incluse'],
                  cta: 'Nous contacter',
                  highlighted: false,
                },
              ].map(plan => (
                <div
                  key={plan.name}
                  className={`p-6 rounded-2xl border-2 ${
                    plan.highlighted
                      ? 'border-[#27698a] bg-[#27698a]/5 relative'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#27698a] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      POPULAIRE
                    </div>
                  )}
                  <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{plan.target}</p>
                  <div className="mt-4 mb-4">
                    <span className="text-3xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && <span className="text-sm text-slate-500 ml-1">{plan.period}</span>}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map(feat => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-[#478e5e] mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setLoginOpen(true)}
                    className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                      plan.highlighted
                        ? 'bg-[#27698a] hover:bg-[#1f5570] text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-500 mt-8">
              Tous les tarifs incluent : hébergement sécurisé, mises à jour, sauvegardes quotidiennes.
              <br />Conformité CNSS, ITS, Code du travail guinéen (Loi L/2014/072/AN).
            </p>
          </div>
        </section>

        {/* Demo CTA section */}
        <section className="px-4 lg:px-6 py-16 bg-gradient-to-br from-[#27698a] to-[#435862] text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Prêt à découvrir DataSphere RH ?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Connectez-vous à la démo avec des données réelles (24 employés, 2 sociétés, paie CNSS conforme)
              et explorez les 70+ modules disponibles.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setLoginOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#27698a] rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Accéder à la démonstration
              </button>
              <div className="text-xs text-white/70 bg-white/10 px-4 py-2 rounded-lg">
                Démo : <code className="font-mono">admin@datasphere.gn</code> / <code className="font-mono">demo123</code>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 px-4 lg:px-6 py-10 text-center text-xs">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-[#27698a] to-[#435862] flex items-center justify-center text-white font-bold text-xs">
                DS
              </div>
              <span className="font-semibold text-white text-sm">DataSphere RH Guinée</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-4">
              <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
              <a href="#audience" className="hover:text-white transition-colors">Cible</a>
              <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
              <button onClick={() => setLoginOpen(true)} className="hover:text-white transition-colors">Démo</button>
            </div>
            <p className="text-slate-500">© 2026 DataSphere RH · Conakry · République de Guinée</p>
            <p className="mt-1 text-slate-600">SIRH Premium SaaS — Conforme au Code du travail (Loi L/2014/072/AN), CNSS, ITS</p>
          </div>
        </footer>

        {/* Modal de connexion */}
        {loginOpen && (
          <LoginModal
            onClose={() => setLoginOpen(false)}
            onSuccess={(u) => {
              setUser(u)
              setLoginOpen(false)
              setPage('dashboard')
            }}
          />
        )}
      </div>
    )
  }

  // === Application complète (connecté) ===
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-4 lg:px-6 gap-4">
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 rounded hover:bg-slate-100 text-slate-600"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#27698a] to-[#435862] flex items-center justify-center text-white font-bold text-sm">
            DS
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-slate-900 text-sm">DataSphere RH</span>
            <span className="text-[10px] text-slate-500 -mt-0.5">
              Guinée {user ? `· ${user.name}` : '· Démo'}
            </span>
          </div>
        </div>

        {/* Company selector (multi-sociétés) */}
        <div className="hidden md:block ml-2">
          <CompanySelector value={selectedCompany} onChange={setSelectedCompany} />
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-4 text-xs text-slate-500">
          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            ● En ligne
          </span>
          <span>GNF</span>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-3">
          <NotificationsBell />
          {user && (
            <>
              {/* Role badge */}
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-[#27698a]/10 text-[#27698a] border border-[#27698a]/20 font-medium">
                {user.role}
              </span>
              <button
                onClick={() => setPage('audit')}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Audit
              </button>
              <button
                onClick={() => setImportOpen(true)}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
              >
                <Upload className="w-3.5 h-3.5" />
                Import
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#27698a] text-white flex items-center justify-center text-xs font-medium">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar
          current={page}
          onNavigate={setPage}
          companyId={selectedCompany}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'employees' && (
            <EmployeesPage
              key={employeesTick}
              onCreate={() => setWizardOpen(true)}
              onImport={() => setImportOpen(true)}
              onSelect={(id) => setSelectedEmployee(id)}
            />
          )}
          {page === 'payroll' && <PayrollPage />}
          {page === 'leaves' && <LeavesPage />}
          {page === 'recruitment' && <RecruitmentPage />}
          {page === 'joboffers' && <JobOffersPage />}
          {page === 'evaluations' && <EvaluationsPage />}
          {page === 'orgchart' && <OrgChartPage />}
          {page === 'ai' && <AIPage />}
          {page === 'reports' && <DGReportPage />}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'vault' && <VaultPage />}
          {page === 'signature' && <SignaturePage />}
          {page === 'notifications' && <NotificationsPage />}
          {page === 'exports' && <ExportsPage />}
          {page === 'portal' && <EmployeePortalPage />}
          {page === 'time' && <TimeTrackingPage />}
          {page === 'training' && <TrainingPage />}
          {page === 'budget' && <BudgetPage />}
          {page === 'onboarding' && <OnboardingPage />}
          {page === 'satisfaction' && <SatisfactionPage />}
          {page === 'skills' && <SkillsPage />}
          {page === 'compliance' && <CompliancePage />}
          {page === 'expenses' && <ExpensesPage />}
          {page === 'interviews' && <InterviewsPage />}
          {page === 'career' && <CareerPage />}
          {page === 'contractors' && <ContractorsPage />}
          {page === 'ai-insights' && <AIInsightsPage />}
          {page === 'geo' && <GeoPage />}
          {page === 'forecasts' && <ForecastsPage />}
          {page === 'customdash' && <CustomDashboardPage />}
          {page === 'advsettings' && <AdvancedSettingsPage />}
          {page === 'health' && <HealthPage />}
          {page === 'feedback360' && <Feedback360Page />}
          {page === 'announcements' && <AnnouncementsPage />}
          {page === 'helpdesk' && <HelpdeskPage />}
          {page === 'calendar' && <CalendarPage />}
          {page === 'wellness' && <WellnessPage />}
          {page === 'language' && <LanguagePage />}
          {page === 'benefits' && <BenefitsPage />}
          {page === 'loans' && <LoansPage />}
          {page === 'shifts' && <ShiftsPage />}
          {page === 'equipment' && <EquipmentPage />}
          {page === 'accounting' && <AccountingPage />}
          {page === 'conflicts' && <ConflictsPage />}
          {page === 'custom-reports' && <CustomReportsPage />}
          {page === 'webhooks' && <WebhooksPage />}
          {page === 'referential' && <ReferentialPage />}
          {page === 'gamification' && <GamificationPage />}
          {page === 'rh-projects' && <RHProjectsPage />}
          {page === 'doc-traceability' && <DocTraceabilityPage />}
          {page === 'chatbot' && <ChatbotPage />}
          {page === 'risks' && <RisksPage />}
          {page === 'mentoring' && <MentoringPage />}
          {page === 'cse' && <CSEPage />}
          {page === 'diversity' && <DiversityPage />}
          {page === 'crisis' && <CrisisPage />}
          {page === 'international' && <InternationalPage />}
          {page === 'rse' && <RSEPage />}
          {page === 'contracts-mgmt' && <ContractsMgmtPage userRole={user?.role} />}
          {page === 'predictive' && <PredictivePage userRole={user?.role} />}
          {page === 'data-governance' && <DataGovernancePage />}
          {page === 'blockchain' && <BlockchainPage userRole={user?.role} />}
          {page === 'pilotage' && <PilotagePage onNavigate={(p) => setPage(p as PageKey)} />}
          {page === 'settings' && <SettingsPage />}
          {page === 'audit' && <AuditPage />}
          {page === 'fiscal-reports' && <FiscalReportsPage />}
          {page === 'help' && <HelpPage />}
        </main>
      </div>

      {/* Footer sticky */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-4 lg:px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>© 2026 DataSphere RH Guinée · Conakry · République de Guinée</span>
        <span className="text-slate-400">v1.8.0 — Contrats + IA prédictive + Gouvernance + Blockchain</span>
      </footer>

      {/* Modals */}
      {wizardOpen && (
        <EmployeeWizard
          onClose={() => setWizardOpen(false)}
          onCreated={() => {
            setWizardOpen(false)
            setPage('employees')
            setEmployeesTick(t => t + 1)
          }}
        />
      )}

      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false)
            setPage('employees')
            setEmployeesTick(t => t + 1)
          }}
        />
      )}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onSuccess={(u) => {
            setUser(u)
            setLoginOpen(false)
          }}
        />
      )}

      {selectedEmployee && (
        <EmployeeDetailModal
          employeeId={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  )
}
