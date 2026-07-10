import { db } from '@/lib/db'
import { executeWorkflow, type Workflow, type WorkflowStep } from './workflows'

/**
 * Helper pour gérer les workflows personnalisés (créés via UI).
 */

export interface CustomWorkflowData {
  name: string
  description?: string
  steps: WorkflowStep[]
  trigger?: string
  triggerConfig?: Record<string, any>
  isActive?: boolean
}

export async function createCustomWorkflow(companyId: string, data: CustomWorkflowData) {
  return db.customWorkflow.create({
    data: {
      companyId,
      name: data.name,
      description: data.description || null,
      steps: JSON.stringify(data.steps),
      trigger: data.trigger || null,
      triggerConfig: data.triggerConfig ? JSON.stringify(data.triggerConfig) : null,
      isActive: data.isActive ?? true,
    },
  })
}

export async function listCustomWorkflows(companyId: string, includeInactive = false) {
  const where: any = { companyId }
  if (!includeInactive) where.isActive = true

  const workflows = await db.customWorkflow.findMany({
    where,
    orderBy: [{ trigger: 'asc' }, { createdAt: 'desc' }],
  })

  return workflows.map(w => ({
    ...w,
    steps: (() => { try { return JSON.parse(w.steps) } catch { return [] } })(),
    triggerConfig: (() => { try { return JSON.parse(w.triggerConfig || '{}') } catch { return {} } })(),
  }))
}

export async function getCustomWorkflow(companyId: string, id: string) {
  const w = await db.customWorkflow.findFirst({ where: { id, companyId } })
  if (!w) return null
  return {
    ...w,
    steps: (() => { try { return JSON.parse(w.steps) } catch { return [] } })(),
    triggerConfig: (() => { try { return JSON.parse(w.triggerConfig || '{}') } catch { return {} } })(),
  }
}

export async function updateCustomWorkflow(companyId: string, id: string, data: Partial<CustomWorkflowData>) {
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.steps !== undefined) updateData.steps = JSON.stringify(data.steps)
  if (data.trigger !== undefined) updateData.trigger = data.trigger
  if (data.triggerConfig !== undefined) updateData.triggerConfig = JSON.stringify(data.triggerConfig)
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  return db.customWorkflow.updateMany({ where: { id, companyId }, data: updateData })
}

export async function deleteCustomWorkflow(companyId: string, id: string) {
  return db.customWorkflow.deleteMany({ where: { id, companyId } })
}

/**
 * Exécute un workflow custom par son ID.
 */
export async function runCustomWorkflow(companyId: string, id: string, input: string, userId?: string) {
  const cw = await getCustomWorkflow(companyId, id)
  if (!cw) throw new Error('Workflow introuvable')

  const workflow: Workflow = {
    id: cw.id,
    name: cw.name,
    description: cw.description || '',
    steps: cw.steps,
  }

  const result = await executeWorkflow(companyId, workflow, input, userId)

  // Incrémente le compteur d'exécution
  await db.customWorkflow.update({
    where: { id },
    data: { lastRunAt: new Date(), runCount: { increment: 1 } },
  })

  return { ...result, workflowId: cw.id, workflowName: cw.name }
}

/**
 * Récupère les workflows déclenchés par un événement donné.
 */
export async function getTriggeredWorkflows(companyId: string, trigger: string) {
  const workflows = await listCustomWorkflows(companyId)
  return workflows.filter(w => w.isActive && w.trigger === trigger)
}

/**
 * Déclenche tous les workflows associés à un événement.
 */
export async function triggerEvent(companyId: string, trigger: string, input: string, userId?: string) {
  const workflows = await getTriggeredWorkflows(companyId, trigger)
  const results = []

  for (const cw of workflows) {
    try {
      const result = await runCustomWorkflow(companyId, cw.id, input, userId)
      results.push({ workflowId: cw.id, workflowName: cw.name, success: true, ...result })
    } catch (e: any) {
      results.push({ workflowId: cw.id, workflowName: cw.name, success: false, error: e?.message })
    }
  }

  return { triggered: workflows.length, results }
}
