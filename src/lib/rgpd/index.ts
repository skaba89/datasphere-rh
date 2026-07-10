import { db } from '@/lib/db'
import crypto from 'crypto'

export type ConsentType = 'COOKIES' | 'MARKETING' | 'ANALYTICS' | 'DATA_PROCESSING' | 'PHOTO' | 'BIOMETRIC'
export type RequestType = 'EXPORT' | 'DELETE' | 'CORRECT' | 'RESTRICT' | 'PORTABILITY' | 'OBJECT'

export const CONSENT_LABELS: Record<ConsentType, { label: string; description: string; required: boolean }> = {
  COOKIES: { label: 'Cookies', description: 'Cookies de session et préférences', required: true },
  DATA_PROCESSING: { label: 'Traitement des données', description: 'Traitement des données RH', required: true },
  MARKETING: { label: 'Marketing', description: 'Communications marketing', required: false },
  ANALYTICS: { label: 'Analytics', description: 'Suivi d\'utilisation anonymisé', required: false },
  PHOTO: { label: 'Photo', description: 'Photo employé (badge, annuaire)', required: false },
  BIOMETRIC: { label: 'Biométrie', description: 'Données biométriques', required: false },
}

export async function grantConsent(companyId: string, data: {
  employeeId?: string; consentType: ConsentType; granted: boolean; ipAddress?: string; userAgent?: string
}) {
  return db.dataConsent.create({ data: { companyId, employeeId: data.employeeId || null, consentType: data.consentType, granted: data.granted, ipAddress: data.ipAddress || null, userAgent: data.userAgent || null, withdrawnAt: data.granted ? null : new Date() } })
}

export async function getConsents(companyId: string, employeeId?: string) {
  return db.dataConsent.findMany({ where: { companyId, ...(employeeId ? { employeeId } : {}) }, orderBy: { createdAt: 'desc' } })
}

export async function exportEmployeeData(companyId: string, employeeId: string) {
  const employee = await db.employee.findFirst({
    where: { id: employeeId, companyId },
    include: { contracts: true, evaluations: true, objectives: true, leaveRequests: true, timeEntries: true, benefits: true, loans: true, shifts: true, documents: true, feedback360s: true, careerPaths: true }
  })
  if (!employee) throw new Error('Employé introuvable')
  const consents = await db.dataConsent.findMany({ where: { companyId, employeeId } })
  const certificates = await db.certificate.findMany({ where: { companyId, employeeId } })
  return {
    exportInfo: { exportedAt: new Date().toISOString(), companyId, employeeId, rgpdArticle: 'Article 20 — Droit à la portabilité' },
    personalData: { matricule: employee.matricule, nom: employee.nom, prenoms: employee.prenoms, dateNaissance: employee.dateNaissance, cnssNumero: employee.cnssNumero, sexe: employee.sexe, telephone: employee.telephone, email: employee.email, poste: employee.poste, dateEmbauche: employee.dateEmbauche, statut: employee.statut },
    contracts: employee.contracts.length, evaluations: employee.evaluations.length, objectives: employee.objectives.length,
    leaveRequests: employee.leaveRequests.length, timeEntries: employee.timeEntries.length, benefits: employee.benefits.length,
    loans: employee.loans.length, documents: employee.documents.length, certificates: certificates.length,
    consents: consents.map(c => ({ type: c.consentType, granted: c.granted, createdAt: c.createdAt })),
  }
}

export async function deleteEmployeeData(companyId: string, employeeId: string) {
  const deleted: Record<string, number> = {}
  deleted.contracts = (await db.contract.deleteMany({ where: { employeeId } })).count
  deleted.evaluations = (await db.evaluation.deleteMany({ where: { employeeId } })).count
  deleted.objectives = (await db.objective.deleteMany({ where: { employeeId } })).count
  deleted.leaveRequests = (await db.leaveRequest.deleteMany({ where: { employeeId } })).count
  deleted.timeEntries = (await db.timeEntry.deleteMany({ where: { employeeId } })).count
  deleted.benefits = (await db.benefit.deleteMany({ where: { employeeId } })).count
  deleted.loans = (await db.loan.deleteMany({ where: { employeeId } })).count
  deleted.shifts = (await db.shift.deleteMany({ where: { employeeId } })).count
  deleted.documents = (await db.document.deleteMany({ where: { employeeId } })).count
  deleted.certificates = (await db.certificate.deleteMany({ where: { companyId, employeeId } })).count
  deleted.consents = (await db.dataConsent.deleteMany({ where: { companyId, employeeId } })).count
  await db.employee.update({ where: { id: employeeId }, data: { nom: 'ANONYMIZED', prenoms: 'ANONYMIZED', dateNaissance: null, cnssNumero: null, telephone: null, email: null, photoUrl: null, statut: 'SUPPRIME', dateSortie: new Date().toISOString() } })
  await db.auditLog.create({ data: { action: 'DELETE', entityType: 'employee', entityId: employeeId, userId: 'RGPD_SYSTEM', diff: JSON.stringify({ after: { action: 'RIGHT_TO_BE_FORGOTTEN', deleted } }) } })
  return { deleted, anonymized: true }
}

export async function createDataRequest(companyId: string, data: { employeeId?: string; requestType: RequestType; details?: string }) {
  return db.dataRequest.create({ data: { companyId, employeeId: data.employeeId || null, requestType: data.requestType, details: data.details || null, status: 'PENDING' } })
}

export async function processDataRequest(companyId: string, requestId: string, processedBy: string) {
  const request = await db.dataRequest.findFirst({ where: { id: requestId, companyId } })
  if (!request) throw new Error('Requête introuvable')
  let result = ''
  if (request.requestType === 'EXPORT' || request.requestType === 'PORTABILITY') {
    if (request.employeeId) { const data = await exportEmployeeData(companyId, request.employeeId); result = JSON.stringify(data).slice(0, 5000) }
  } else if (request.requestType === 'DELETE') {
    if (request.employeeId) { const d = await deleteEmployeeData(companyId, request.employeeId); result = JSON.stringify(d) }
  } else { result = 'Traité manuellement par le DPO' }
  await db.dataRequest.update({ where: { id: requestId }, data: { status: 'COMPLETED', result, processedBy, processedAt: new Date() } })
  return { status: 'COMPLETED', result }
}

export function generateIncomingToken(): string {
  return 'wh_in_' + crypto.randomBytes(20).toString('hex')
}
