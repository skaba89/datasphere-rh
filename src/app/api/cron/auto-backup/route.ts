import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/cron/auto-backup
 *
 * Sauvegarde automatique quotidienne de toutes les sociétés.
 * Pour chaque société :
 * 1. Compte les enregistrements de chaque table
 * 2. Crée un log de sauvegarde (AuditLog)
 * 3. Vérifie l'intégrité des données
 *
 * À appeler quotidiennement via cron-job.org ou UptimeRobot.
 * Sécurisé par CRON_SECRET.
 *
 * Note : La base Neon effectue déjà des sauvegardes automatiques
 * (point-in-time recovery). Ce endpoint ajoute une couche de
 * vérification et de traçabilité métier.
 */
export async function GET(request: Request) {
  // Vérifier le secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const results = {
    timestamp: new Date().toISOString(),
    companiesBackedUp: 0,
    totalRecords: 0,
    issues: [] as string[],
    companies: [] as any[],
  }

  try {
    const companies = await db.company.findMany({
      select: { id: true, raisonSociale: true, sigle: true },
    })

    for (const company of companies) {
      const counts = {
        employees: await db.employee.count({ where: { companyId: company.id } }),
        contracts: await db.contract.count({ where: { employee: { companyId: company.id } } }),
        leaveRequests: await db.leaveRequest.count({ where: { employee: { companyId: company.id } } }),
        documents: await db.document.count({ where: { companyId: company.id } }),
        notifications: await db.notification.count({ where: { companyId: company.id } }),
        trainings: await db.training.count({ where: { companyId: company.id } }),
        candidates: await db.candidate.count({ where: { companyId: company.id } }),
        jobOffers: await db.jobOffer.count({ where: { companyId: company.id } }),
        evaluations: await db.evaluation.count({ where: { employee: { companyId: company.id } } }),
        objectives: await db.objective.count({ where: { employee: { companyId: company.id } } }),
        skills: await db.skill.count({ where: { companyId: company.id } }),
        complianceItems: await db.complianceItem.count({ where: { companyId: company.id } }),
        expenseReports: await db.expenseReport.count({ where: { companyId: company.id } }),
        onboardingTasks: await db.onboardingTask.count({ where: { companyId: company.id } }),
        dataConsents: await db.dataConsent.count({ where: { companyId: company.id } }),
        dataRequests: await db.dataRequest.count({ where: { companyId: company.id } }),
      }

      const companyTotal = Object.values(counts).reduce((s: number, c) => s + (c as number), 0)
      results.totalRecords += companyTotal
      results.companiesBackedUp++

      // Vérifications d'intégrité
      // 1. Employés sans contrat
      const employeesWithoutContract = await db.employee.count({
        where: { companyId: company.id, contracts: { none: {} } },
      })
      if (employeesWithoutContract > 0) {
        results.issues.push(`${company.raisonSociale}: ${employeesWithoutContract} employé(s) sans contrat`)
      }

      // 2. Employés actifs sans salaire
      const activeWithoutSalary = await db.employee.count({
        where: {
          companyId: company.id,
          statut: 'actif',
          contracts: { none: { salaireBase: { gt: 0 } } },
        },
      })
      if (activeWithoutSalary > 0) {
        results.issues.push(`${company.raisonSociale}: ${activeWithoutSalary} employé(s) actif(s) sans salaire`)
      }

      results.companies.push({
        id: company.id,
        raisonSociale: company.raisonSociale,
        sigle: company.sigle,
        totalRecords: companyTotal,
        counts,
      })

      // Log de sauvegarde dans l'audit
      await db.auditLog.create({
        data: {
          action: 'AUTO_BACKUP',
          entityType: 'company',
          entityId: company.id,
          userId: 'system-cron',
          diff: JSON.stringify({
            after: {
              totalRecords: companyTotal,
              timestamp: results.timestamp,
              issues: results.issues.filter(i => i.includes(company.raisonSociale)).length,
            },
          }),
        },
      })
    }

    // Nettoyer les sessions expirées
    const expiredSessions = await db.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    ;(results as any).expiredSessionsCleaned = expiredSessions.count

    console.log('[cron] Auto-backup completed:', results)
    return NextResponse.json(results)
  } catch (error: any) {
    console.error('[cron] Auto-backup error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde', detail: error?.message, ...results },
      { status: 500 }
    )
  }
}
