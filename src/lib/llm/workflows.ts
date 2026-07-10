import { chat, type ChatMessage, type ChatOptions, type ChatResult } from './router'
import { getDefaultProvider } from './settings'

export interface WorkflowStep { id: string; type: string; label: string; config: any }
export interface Workflow { id: string; name: string; description: string; steps: WorkflowStep[] }
export interface WorkflowExecutionResult { stepId: string; stepType: string; stepLabel: string; input: string; output: string; success: boolean; error?: string; durationMs: number; tokensUsed?: any; metadata?: any }

export const PREDEFINED_WORKFLOWS: Workflow[] = [
  { id: 'contract_pipeline', name: 'Pipeline contrat complet', description: 'Génère → améliore → sauve → indexe', steps: [
    { id: 'gen', type: 'generate_document', label: 'Générer contrat', config: { prompt: 'Rédige un contrat CDI guinéen.', temperature: 0.6, maxTokens: 2000 } },
    { id: 'improve', type: 'improve', label: 'Améliorer style', config: { temperature: 0.5, maxTokens: 2500 } },
    { id: 'save', type: 'save_generation', label: 'Sauvegarder', config: { generationType: 'contract_cdi', generationTitle: 'Contrat CDI' } },
    { id: 'index', type: 'index_in_rag', label: 'Indexer RAG', config: { ragSource: 'contract_template', ragTitle: 'Contrat CDI type' } },
  ]},
  { id: 'document_analysis', name: 'Analyse document RH', description: 'Résumer → mots-clés → traduire → sauver', steps: [
    { id: 'summarize', type: 'summarize', label: 'Résumer', config: { prompt: '5 points clés', temperature: 0.4, maxTokens: 800 } },
    { id: 'keywords', type: 'extract_keywords', label: 'Mots-clés', config: { prompt: '10', temperature: 0.3, maxTokens: 300 } },
    { id: 'translate', type: 'translate', label: 'Traduire EN', config: { prompt: 'anglais', temperature: 0.4, maxTokens: 1500 } },
    { id: 'save', type: 'save_generation', label: 'Sauver', config: { generationType: 'document_analysis', generationTitle: 'Analyse document' } },
  ]},
  { id: 'policy_create', name: 'Création politique RH', description: 'Générer → améliorer → sauver → indexer', steps: [
    { id: 'gen', type: 'generate_document', label: 'Générer politique', config: { prompt: 'Rédige une politique RH complète.', temperature: 0.7, maxTokens: 2000 } },
    { id: 'improve', type: 'improve', label: 'Améliorer', config: { temperature: 0.5, maxTokens: 2500 } },
    { id: 'save', type: 'save_generation', label: 'Sauver', config: { generationType: 'policy', generationTitle: 'Politique RH' } },
    { id: 'index', type: 'index_in_rag', label: 'Indexer', config: { ragSource: 'policy', ragTitle: 'Politique RH' } },
  ]},
]

export async function executeWorkflow(companyId: string, workflow: Workflow, initialInput: string, userId?: string): Promise<{ results: WorkflowExecutionResult[]; finalOutput: string; totalDurationMs: number; totalTokens: number }> {
  const { provider, model, temperature, maxTokens } = await getDefaultProvider(companyId)
  const results: WorkflowExecutionResult[] = []
  let currentInput = initialInput
  let totalTokens = 0
  const startTotal = Date.now()
  for (const step of workflow.steps) {
    const stepStart = Date.now()
    const stepResult: WorkflowExecutionResult = { stepId: step.id, stepType: step.type, stepLabel: step.label, input: currentInput, output: '', success: false, durationMs: 0 }
    try {
      if (['generate_document', 'translate', 'summarize', 'improve', 'extract_keywords', 'custom'].includes(step.type)) {
        let systemPrompt = 'Tu es un assistant RH. Réponds en français.'
        let userPrompt = step.config.prompt || currentInput
        if (step.type === 'translate') { systemPrompt = 'Traduis le texte fourni.'; userPrompt = `Traduis en ${step.config.prompt || 'anglais'} :\n\n${currentInput}` }
        else if (step.type === 'summarize') { systemPrompt = 'Résume le texte.'; userPrompt = `Résume en ${step.config.prompt || '5 points'} :\n\n${currentInput}` }
        else if (step.type === 'improve') { systemPrompt = 'Améliore le style.'; userPrompt = `Améliore : ${currentInput}` }
        else if (step.type === 'extract_keywords') { systemPrompt = 'Extrais les mots-clés.'; userPrompt = `Extrais ${step.config.prompt || '10'} mots-clés : ${currentInput}` }
        else if (step.type === 'generate_document') { userPrompt = `${step.config.prompt || ''}\n\nContexte : ${currentInput}` }
        const result = await chat(provider.id, model, [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], { temperature: step.config.temperature ?? temperature, maxTokens: step.config.maxTokens ?? Math.min(maxTokens, 2000) })
        stepResult.output = result.content; stepResult.tokensUsed = result.usage ? { promptTokens: result.usage.promptTokens || 0, completionTokens: result.usage.completionTokens || 0, totalTokens: result.usage.totalTokens || 0 } : undefined; stepResult.success = true; totalTokens += result.usage?.totalTokens || 0; currentInput = result.content
      } else if (step.type === 'index_in_rag') {
        const { indexDocument } = await import('./rag')
        const r = await indexDocument(companyId, { source: step.config.ragSource || 'other', title: step.config.ragTitle || `Document ${new Date().toISOString()}`, content: currentInput })
        stepResult.output = `${r.chunksCreated} chunks indexés`; stepResult.metadata = r; stepResult.success = true
      } else if (step.type === 'save_generation') {
        const { saveGeneration } = await import('./generations')
        const gen = await saveGeneration({ companyId, type: step.config.generationType || 'workflow_result', title: step.config.generationTitle || `Workflow ${new Date().toLocaleString('fr-FR')}`, content: currentInput, providerId: provider.id, modelId: model })
        stepResult.output = `Sauvegardé : ${gen.id}`; stepResult.metadata = { generationId: gen.id }; stepResult.success = true
      }
    } catch (e: any) { stepResult.error = e?.message || String(e); stepResult.success = false }
    stepResult.durationMs = Date.now() - stepStart; results.push(stepResult)
  }
  return { results, finalOutput: currentInput, totalDurationMs: Date.now() - startTotal, totalTokens }
}
