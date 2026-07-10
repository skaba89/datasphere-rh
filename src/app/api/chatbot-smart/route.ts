import { NextResponse } from 'next/server'
import { chatWithFallback } from '@/lib/llm/fallback'
import { getDefaultProvider } from '@/lib/llm/settings'
import { getFunctionsSchema, executeFunction, parseFunctionCall } from '@/lib/llm/functions'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { db } from '@/lib/db'
export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message) return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    const ctx = await getCompanyContext(request); if ('error' in ctx) return ctx.error
    const company = await db.company.findUnique({ where: { id: ctx.companyId } })
    const employees = await db.employee.count({ where: { companyId: ctx.companyId } })
    const functionsList = getFunctionsSchema().map(f => `- ${f.function.name}: ${f.function.description}`).join('\n')
    const systemPrompt = `Tu es l'assistant RH DataSphere RH Guinée. Entreprise: ${company?.raisonSociale || 'Demo'}, ${employees} employés.\n\nFonctions disponibles:\n${functionsList}\n\nSi une question nécessite des données, utilise le format:\n<function_call>\n{"name":"nom_fonction","args":{}}\n</function_call>`
    const { provider, model, temperature, maxTokens } = await getDefaultProvider(ctx.companyId)
    const first = await chatWithFallback(provider.id, model, [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }], { temperature, maxTokens: 500, tracking: { companyId: ctx.companyId, endpoint: 'chatbot_smart', feature: 'chatbot_smart_step1' } })
    const fc = parseFunctionCall(first.content)
    if (fc) {
      const fr = await executeFunction(fc.name, fc.args, ctx.companyId)
      const second = await chatWithFallback(provider.id, model, [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }, { role: 'assistant', content: first.content }, { role: 'user', content: `Résultat de ${fc.name}:\n${JSON.stringify(fr)}\n\nFormule une réponse claire en français.` }], { temperature, maxTokens: 500, tracking: { companyId: ctx.companyId, endpoint: 'chatbot_smart', feature: 'chatbot_smart_step2' } })
      return NextResponse.json({ reply: second.content, provider: second.provider, model: second.model, usage: second.usage, durationMs: first.durationMs + second.durationMs, functionCalled: { name: fc.name, args: fc.args, result: fr }, timestamp: new Date().toISOString() })
    }
    return NextResponse.json({ reply: first.content, provider: first.provider, model: first.model, usage: first.usage, durationMs: first.durationMs, functionCalled: null, timestamp: new Date().toISOString() })
  } catch (e: any) { console.error('POST /api/chatbot-smart error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
