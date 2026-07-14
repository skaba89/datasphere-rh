import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/advanced/auth-helpers'

/**
 * GET /api/backup
 * Exporte toutes les données de la société de l'utilisateur connecté au format JSON.
 * Permet au client de télécharger ses données à tout moment (sécurité, RGPD, audit).
 *
 * Sécurité : nécessite authentification + rôle SUPER_ADMIN ou ADMIN_ENTREPRISE.
 */
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
    }

    if (!['SUPER_ADMIN', 'ADMIN_ENTREPRISE'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Permission refusée. Seuls les administrateurs peuvent exporter les données.' },
        { status: 403 }
      )
    }

    const companyId = user.companyId
    if (!companyId) {
      return NextResponse.json({ error: 'Aucune société associée' }, { status: 400 })
    }

    // Récupérer la société
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        raisonSociale: true,
        sigle: true,
        nif: true,
        rc: true,
        cnssNumero: true,
        adresse: true,
        ville: true,
        telephone: true,
        email: true,
        devise: true,
        createdAt: true,
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    // Récupérer toutes les données liées à la société
    const [
      employees,
      contracts,
      leaveRequests,
      documents,
      notifications,
      trainings,
      jobOffers,
      candidates,
      evaluations,
      objectives,
      skills,
      complianceItems,
      expenseReports,
      interviews,
      budgetItems,
      onboardingTasks,
      auditLogs,
      dataConsents,
      dataRequests,
    ] = await Promise.all([
      db.employee.findMany({ where: { companyId }, include: { contracts: true } }),
      db.contract.findMany({ where: { employee: { companyId } } }),
      db.leaveRequest.findMany({ where: { employee: { companyId } }, include: { employee: { select: { matricule: true, nom: true, prenoms: true } } } }),
      db.document.findMany({ where: { companyId } }),
      db.notification.findMany({ where: { companyId } }),
      db.training.findMany({ where: { companyId }, include: { enrollments: true } }),
      db.jobOffer.findMany({ where: { companyId } }),
      db.candidate.findMany({ where: { companyId } }),
      db.evaluation.findMany({ where: { employee: { companyId } } }),
      db.objective.findMany({ where: { employee: { companyId } } }),
      db.skill.findMany({ where: { companyId }, include: { assessments: true } }),
      db.complianceItem.findMany({ where: { companyId } }),
      db.expenseReport.findMany({ where: { companyId } }),
      db.interview.findMany({ where: { companyId } }),
      db.budgetItem.findMany({ where: { companyId } }),
      db.onboardingTask.findMany({ where: { companyId } }),
      db.auditLog.findMany({ where: { entityId: companyId }, take: 1000, orderBy: { createdAt: 'desc' } }),
      db.dataConsent.findMany({ where: { companyId } }),
      db.dataRequest.findMany({ where: { companyId } }),
    ])

    const backup = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.email,
        version: '1.0',
        format: 'DataSphere RH Backup',
      },
      company,
      stats: {
        employees: employees.length,
        contracts: contracts.length,
        leaveRequests: leaveRequests.length,
        documents: documents.length,
        notifications: notifications.length,
        trainings: trainings.length,
        jobOffers: jobOffers.length,
        candidates: candidates.length,
        evaluations: evaluations.length,
        objectives: objectives.length,
        skills: skills.length,
        complianceItems: complianceItems.length,
        expenseReports: expenseReports.length,
        interviews: interviews.length,
        budgetItems: budgetItems.length,
        onboardingTasks: onboardingTasks.length,
        auditLogs: auditLogs.length,
        dataConsents: dataConsents.length,
        dataRequests: dataRequests.length,
      },
      data: {
        employees,
        contracts,
        leaveRequests,
        documents,
        notifications,
        trainings,
        jobOffers,
        candidates,
        evaluations,
        objectives,
        skills,
        complianceItems,
        expenseReports,
        interviews,
        budgetItems,
        onboardingTasks,
        auditLogs,
        dataConsents,
        dataRequests,
      },
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'DATA_EXPORT',
        entityType: 'company',
        entityId: companyId,
        userId: user.email,
        diff: JSON.stringify({ after: { exportedAt: backup.metadata.exportedAt, tables: Object.keys(backup.stats).length } }),
      },
    })

    // Retourner en JSON avec en-tête de téléchargement
    const jsonStr = JSON.stringify(backup, null, 2)
    const filename = `datasphere-backup-${company.raisonSociale.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': jsonStr.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('GET /api/backup error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', detail: error?.message },
      { status: 500 }
    )
  }
}
