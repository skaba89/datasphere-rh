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
import { LogOut, LogIn, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string | null
}

export type PageKey = 'dashboard' | 'pilotage' | 'customdash' | 'calendar' | 'employees' | 'payroll' | 'leaves' | 'recruitment' | 'joboffers' | 'evaluations' | 'orgchart' | 'ai' | 'reports' | 'analytics' | 'vault' | 'signature' | 'notifications' | 'exports' | 'portal' | 'time' | 'training' | 'budget' | 'onboarding' | 'satisfaction' | 'skills' | 'compliance' | 'expenses' | 'interviews' | 'career' | 'contractors' | 'ai-insights' | 'geo' | 'forecasts' | 'health' | 'feedback360' | 'announcements' | 'helpdesk' | 'wellness' | 'language' | 'benefits' | 'loans' | 'shifts' | 'equipment' | 'accounting' | 'conflicts' | 'custom-reports' | 'webhooks' | 'referential' | 'gamification' | 'rh-projects' | 'doc-traceability' | 'chatbot' | 'risks' | 'mentoring' | 'cse' | 'diversity' | 'crisis' | 'international' | 'rse' | 'contracts-mgmt' | 'predictive' | 'data-governance' | 'blockchain' | 'advsettings' | 'settings' | 'audit'

export default function Home() {
  const [page, setPage] = useState<PageKey>('dashboard')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [employeesTick, setEmployeesTick] = useState(0)
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
    toast.success('Déconnecté')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center px-4 lg:px-6 gap-4">
        <div className="flex items-center gap-2 lg:gap-3">
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
          {user ? (
            <>
              {/* Role badge */}
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-[#27698a]/10 text-[#27698a] border border-[#27698a]/20 font-medium">
                {user.role}
              </span>
              <button
                onClick={() => setPage('audit')}
                className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
              >
                📋 Audit
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
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-1.5 text-xs text-white bg-[#27698a] hover:bg-[#1f5570] px-3 py-1.5 rounded-lg font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              Connexion
            </button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar current={page} onNavigate={setPage} />

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
