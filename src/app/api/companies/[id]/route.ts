import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const company = await db.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            employees: true,
            users: true,
            documents: true,
            notifications: true,
            reports: true,
            trainings: true,
            budgetItems: true,
            jobOffers: true,
            surveys: true,
            skills: true,
            complianceItems: true,
            expenseReports: true,
            interviews: true,
          },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('GET /api/companies/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updated = await db.company.update({
      where: { id },
      data: {
        raisonSociale: body.raisonSociale,
        sigle: body.sigle,
        nif: body.nif,
        rc: body.rc,
        cnssNumero: body.cnssNumero,
        adresse: body.adresse,
        ville: body.ville,
        telephone: body.telephone,
        email: body.email,
        devise: body.devise,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/companies/[id] error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que la société existe
    const company = await db.company.findUnique({
      where: { id },
      select: { id: true, raisonSociale: true, _count: { select: { employees: true } } },
    })

    if (!company) {
      return NextResponse.json({ error: 'Société introuvable' }, { status: 404 })
    }

    // Vérifier qu'il reste au moins une société après suppression
    const totalCompanies = await db.company.count()
    if (totalCompanies <= 1) {
      return NextResponse.json(
        { error: 'Impossible de supprimer la dernière société. Il doit en rester au moins une.' },
        { status: 400 }
      )
    }

    // Suppression manuelle transactionnelle de toutes les dépendances
    // On ne peut pas compter sur onDelete: Cascade si le schéma DB n'est pas à jour
    await db.$transaction(async (tx) => {
      // 1. Supprimer les enregistrements qui n'ont pas de cascade configuré
      // Users: SetNull (détacher sans supprimer)
      await tx.user.updateMany({
        where: { companyId: id },
        data: { companyId: null },
      })

      // 2. Supprimer les employés d'abord (leurs sous-relations cascaderont)
      // Mais d'abord supprimer les records qui référencent employeeId directement
      // pour éviter les contraintes FK

      // Documents
      await tx.document.deleteMany({ where: { companyId: id } })

      // Notifications
      await tx.notification.deleteMany({ where: { companyId: id } })

      // Reports
      await tx.report.deleteMany({ where: { companyId: id } })

      // Trainings
      await tx.training.deleteMany({ where: { companyId: id } })

      // BudgetItems
      await tx.budgetItem.deleteMany({ where: { companyId: id } })

      // JobOffers
      await tx.jobOffer.deleteMany({ where: { companyId: id } })

      // Surveys
      await tx.survey.deleteMany({ where: { companyId: id } })

      // Skills
      await tx.skill.deleteMany({ where: { companyId: id } })

      // ComplianceItems
      await tx.complianceItem.deleteMany({ where: { companyId: id } })

      // ExpenseReports
      await tx.expenseReport.deleteMany({ where: { companyId: id } })

      // Interviews
      await tx.interview.deleteMany({ where: { companyId: id } })

      // Candidates
      await tx.candidate.deleteMany({ where: { companyId: id } })

      // Contractors
      await tx.contractor.deleteMany({ where: { companyId: id } })

      // CnssParams
      await tx.cnssParam.deleteMany({ where: { companyId: id } })

      // PayrollPeriods
      await tx.payrollPeriod.deleteMany({ where: { companyId: id } })

      // OnboardingTasks
      await tx.onboardingTask.deleteMany({ where: { companyId: id } })

      // WorkLocations
      await tx.workLocation.deleteMany({ where: { companyId: id } })

      // Shifts
      await tx.shift.deleteMany({ where: { companyId: id } })

      // Equipment
      await tx.equipment.deleteMany({ where: { companyId: id } })

      // Loans
      await tx.loan.deleteMany({ where: { companyId: id } })

      // Benefits
      await tx.benefit.deleteMany({ where: { companyId: id } })

      // Announcements
      await tx.announcement.deleteMany({ where: { companyId: id } })

      // HelpdeskTickets
      await tx.helpdeskTicket.deleteMany({ where: { companyId: id } })

      // Feedback360
      await tx.feedback360.deleteMany({ where: { companyId: id } })

      // HealthRecords
      await tx.healthRecord.deleteMany({ where: { companyId: id } })

      // CareerPaths
      await tx.careerPath.deleteMany({ where: { companyId: id } })

      // Certificates
      await tx.certificate.deleteMany({ where: { companyId: id } })

      // Forecasts
      await tx.forecast.deleteMany({ where: { companyId: id } })

      // AIInsights
      await tx.aIInsight.deleteMany({ where: { companyId: id } })

      // ModelTrainings
      await tx.modelTraining.deleteMany({ where: { companyId: id } })

      // WebhookConfigs
      await tx.webhookConfig.deleteMany({ where: { companyId: id } })

      // WebhookDeliveries
      await tx.webhookDelivery.deleteMany({ where: { companyId: id } })

      // ContractSuppliers
      await tx.contractSupplier.deleteMany({ where: { companyId: id } })

      // AdvancedAuditLogs
      await tx.advancedAuditLog.deleteMany({ where: { companyId: id } })

      // 3. Maintenant supprimer les employés (leurs contracts/payslips/leaves cascaderont)
      await tx.employee.deleteMany({ where: { companyId: id } })

      // 4. Enfin, supprimer la société elle-même
      await tx.company.delete({ where: { id } })
    }, { timeout: 120000, maxWait: 120000 })

    return NextResponse.json({
      success: true,
      message: `Société « ${company.raisonSociale} » supprimée avec ${company._count.employees} employé(s) associé(s)`,
    })
  } catch (error: any) {
    console.error('DELETE /api/companies/[id] error:', error)

    // Gérer les erreurs de contrainte d'intégrité
    if (error?.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Contrainte de clé étrangère bloquée. Certaines données liées n\'ont pas pu être supprimées.',
          detail: error?.meta?.field_name || 'unknown',
        },
        { status: 400 }
      )
    }

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Société introuvable ou déjà supprimée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }
}
