/**
 * DataSphere RH SDK — Client JavaScript/TypeScript pour l'API publique v1.
 *
 * Installation :
 *   npm install @datasphere/rh-sdk
 *   # ou
 *   yarn add @datasphere/rh-sdk
 *
 * Usage :
 *   import { DataSphereRH } from '@datasphere/rh-sdk'
 *
 *   const client = new DataSphereRH({ apiKey: 'dsrh_live_xxx' })
 *
 *   // Chat
 *   const { content } = await client.chat({
 *     messages: [{ role: 'user', content: 'Bonjour' }],
 *   })
 *
 *   // Vision
 *   const { content } = await client.vision({
 *     images: [{ base64: '...', mimeType: 'image/jpeg' }],
 *     prompt: 'Extrais le texte de ce document',
 *   })
 *
 *   // RAG
 *   const { answer, sources } = await client.ragAsk({
 *     question: 'Combien de jours de télétravail par semaine ?',
 *   })
 *
 *   // Templates
 *   const { content } = await client.runTemplate('contrat_cdi_resume', {
 *     poste: 'Développeur',
 *     salaire: '1500000',
 *   })
 *
 *   // Workflows
 *   const { finalOutput } = await client.runWorkflow('contract_pipeline', {
 *     employeeName: 'Mariama Camara',
 *   })
 */
export interface DataSphereRHConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: Array<{
        url?: string;
        base64?: string;
        mimeType?: string;
    }>;
}
export interface ChatOptions {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface ChatResult {
    success: boolean;
    content: string;
    model: string;
    provider: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    durationMs: number;
}
export interface VisionOptions {
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export interface VisionResult extends ChatResult {
    imagesAnalyzed: number;
}
export interface RagAskOptions {
    source?: string;
    limit?: number;
}
export interface RagAskResult {
    answer: string;
    sources: Array<{
        title: string;
        source: string;
        score: number;
    }>;
    provider: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    contextFound: boolean;
    chunksRetrieved?: number;
}
export interface WorkflowRunResult {
    success: boolean;
    workflowId: string;
    workflowName: string;
    steps: number;
    successCount: number;
    finalOutput: string;
    results: any[];
    totalDurationMs: number;
    totalTokens: number;
}
export interface TemplateRunResult {
    success: boolean;
    content: string;
    template: {
        id: string;
        title: string;
        category: string;
    };
    provider: string;
    model: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
    durationMs: number;
    generationId?: string;
}
export declare class DataSphereRHError extends Error {
    statusCode: number;
    body: any;
    constructor(message: string, statusCode: number, body?: any);
}
export declare class DataSphereRH {
    private apiKey;
    private baseUrl;
    private timeout;
    constructor(config: DataSphereRHConfig);
    /**
     * Effectue une requête HTTP vers l'API.
     */
    private request;
    /**
     * Chat unifié multi-providers.
     *
     * @example
     * const result = await client.chat({
     *   messages: [{ role: 'user', content: 'Bonjour' }],
     * })
     */
    chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;
    /**
     * Analyse d'images via modèles de vision.
     *
     * @example
     * const result = await client.vision({
     *   images: [{ base64: imageBase64, mimeType: 'image/jpeg' }],
     *   prompt: 'Extrais tout le texte visible',
     * })
     */
    vision(params: {
        images: Array<{
            base64?: string;
            url?: string;
            mimeType?: string;
        }>;
        prompt: string;
    }, options?: VisionOptions): Promise<VisionResult>;
    /**
     * Q&A augmentée par RAG (recherche dans documents RH internes).
     *
     * @example
     * const { answer, sources } = await client.ragAsk({
     *   question: 'Combien de jours de télétravail par semaine ?',
     * })
     */
    ragAsk(params: {
        question: string;
    } & RagAskOptions): Promise<RagAskResult>;
    /**
     * Exécute un template de prompt RH prédéfini.
     *
     * Templates disponibles : contrat_cdi_resume, avenant_contrat, synthese_evaluation,
     * feedback_360, annonce_promotion, annonce_depart, lettre_avertissement,
     * analyse_turnover, synthese_paie, plan_onboarding, mediation_conflit
     *
     * @example
     * const result = await client.runTemplate('contrat_cdi_resume', {
     *   poste: 'Développeur',
     *   salaire: '1500000',
     *   date_embauche: '2026-01-15',
     * })
     */
    runTemplate(templateId: string, variables: Record<string, string>): Promise<TemplateRunResult>;
    /**
     * Exécute un workflow IA multi-étapes.
     *
     * Workflows prédéfinis : contract_pipeline, document_analysis, policy_create
     * Ou utilisez l'ID d'un workflow custom créé via l'interface.
     *
     * @example
     * const { finalOutput } = await client.runWorkflow('contract_pipeline', {
     *   employeeName: 'Mariama Camara',
     *   poste: 'Cheffe de projet',
     * })
     */
    runWorkflow(workflowId: string, input: string): Promise<WorkflowRunResult>;
    /**
     * Vérifie la connectivité et la validité de la clé API.
     *
     * @example
     * const { valid } = await client.ping()
     * if (!valid) console.error('Clé API invalide')
     */
    ping(): Promise<{
        valid: boolean;
        error?: string;
    }>;
}
export default DataSphereRH;
/**
 * Crée un client DataSphere RH rapidement.
 *
 * @example
 * import { createClient } from '@datasphere/rh-sdk'
 * const client = createClient('dsrh_live_xxx')
 */
export declare function createClient(apiKey: string, options?: Partial<DataSphereRHConfig>): DataSphereRH;
//# sourceMappingURL=index.d.ts.map