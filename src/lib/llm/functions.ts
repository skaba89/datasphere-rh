import { chat, type ChatMessage } from './router'
import { chatWithFallback } from './fallback'
import { getDefaultProvider } from './settings'

const RH_FUNCTIONS = [
  { name: 'count_employees', description: 'Compte les employés', parameters: { type: 'object', properties: { statut: { type: 'string' }, sexe: { type: 'string' } }, required: [] },
    handler: async (args: any, companyId: string) => { const { db } = await import('@/lib/db'); const where: any = { companyId }; if (args.statut) where.statut = args.statut; if (args.sexe) where.sexe = args.sexe; return { count: await db.employee.count({ where }), filters: args } } },
  { name: 'search_employee', description: 'Recherche un employé', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
    handler: async (args: any, companyId: string) => { const { db } = await import('@/lib/db'); const q = (args.query || '').toLowerCase(); const employees = await db.employee.findMany({ where: { companyId }, take: 10 }); const filtered = employees.filter(e => e.nom.toLowerCase().includes(q) || e.prenoms.toLowerCase().includes(q) || e.matricule.toLowerCase().includes(q)); return { count: filtered.length, employees: filtered.map(e => ({ matricule: e.matricule, nom: e.nom, prenoms: e.prenoms, poste: e.poste, statut: e.statut })) } } },
  { name: 'count_pending_leaves', description: 'Compte les congés en attente', parameters: { type: 'object', properties: {}, required: [] },
    handler: async (_args: any, companyId: string) => { const { db } = await import('@/lib/db'); return { count: await db.leaveRequest.count({ where: { statut: 'EN_ATTENTE', employee: { companyId } } }) } } },
  { name: 'get_company_stats', description: 'Stats globales entreprise', parameters: { type: 'object', properties: {}, required: [] },
    handler: async (_args: any, companyId: string) => { const { db } = await import('@/lib/db'); const [emp, leaves, expenses] = await Promise.all([db.employee.count({ where: { companyId, statut: 'actif' } }), db.leaveRequest.count({ where: { statut: 'EN_ATTENTE', employee: { companyId } } }), db.expenseReport.count({ where: { status: 'EN_ATTENTE', employee: { companyId } } })]); return { effectifActif: emp, demandesCongeEnAttente: leaves, notesFraisEnAttente: expenses } } },
  { name: 'get_payroll_summary', description: 'Résumé paie', parameters: { type: 'object', properties: {}, required: [] },
    handler: async (_args: any, companyId: string) => { const { db } = await import('@/lib/db'); const contracts = await db.contract.findMany({ where: { employee: { companyId, statut: 'actif' } }, select: { salaireBase: true, type: true } }); const total = contracts.reduce((s, c) => s + (c.salaireBase || 0), 0); return { nombreEmployesPayes: contracts.length, masseSalarialeTotale: total, masseSalarialeFormatted: `${total.toLocaleString('fr-FR')} GNF` } } },
]

export function getFunctionsSchema() { return RH_FUNCTIONS.map(f => ({ type: 'function', function: { name: f.name, description: f.description, parameters: f.parameters } })) }
export async function executeFunction(name: string, args: any, companyId: string) { const fn = RH_FUNCTIONS.find(f => f.name === name); if (!fn) return { error: `Fonction inconnue: ${name}` }; try { return await fn.handler(args || {}, companyId) } catch (e: any) { return { error: e?.message } } }

export function parseFunctionCall(content: string): { name: string; args: any } | null {
  const match = content.match(/<function_call>\s*([\s\S]*?)\s*<\/function_call>/)
  if (match) { try { const p = JSON.parse(match[1]); if (p.name) return { name: p.name, args: p.args || p.arguments || {} } } catch {} }
  const trimmed = content.trim()
  if (trimmed.startsWith('{') && trimmed.includes('"name"')) { try { const p = JSON.parse(trimmed); if (p.name) return { name: p.name, args: p.args || p.arguments || {} } } catch {} }
  return null
}
