"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSphereRH = exports.DataSphereRHError = void 0;
exports.createClient = createClient;
class DataSphereRHError extends Error {
    constructor(message, statusCode, body) {
        super(message);
        this.name = 'DataSphereRHError';
        this.statusCode = statusCode;
        this.body = body;
    }
}
exports.DataSphereRHError = DataSphereRHError;
class DataSphereRH {
    constructor(config) {
        if (!config.apiKey) {
            throw new Error('apiKey requis. Obtenez votre clé sur https://rh.datasphere.gn/llm-api-keys');
        }
        if (!config.apiKey.startsWith('dsrh_live_')) {
            throw new Error('Format de clé invalide. Les clés API commencent par "dsrh_live_"');
        }
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl || 'https://rh.datasphere.gn').replace(/\/$/, '');
        this.timeout = config.timeout || 60000;
    }
    /**
     * Effectue une requête HTTP vers l'API.
     */
    async request(path, body) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeout);
        try {
            const res = await fetch(`${this.baseUrl}${path}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new DataSphereRHError(data.error || `HTTP ${res.status}`, res.status, data);
            }
            return data;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    /**
     * Chat unifié multi-providers.
     *
     * @example
     * const result = await client.chat({
     *   messages: [{ role: 'user', content: 'Bonjour' }],
     * })
     */
    async chat(messages, options = {}) {
        return this.request('/api/v1/llm/chat', {
            messages,
            ...options,
        });
    }
    /**
     * Analyse d'images via modèles de vision.
     *
     * @example
     * const result = await client.vision({
     *   images: [{ base64: imageBase64, mimeType: 'image/jpeg' }],
     *   prompt: 'Extrais tout le texte visible',
     * })
     */
    async vision(params, options = {}) {
        return this.request('/api/v1/llm/vision', {
            ...params,
            ...options,
        });
    }
    /**
     * Q&A augmentée par RAG (recherche dans documents RH internes).
     *
     * @example
     * const { answer, sources } = await client.ragAsk({
     *   question: 'Combien de jours de télétravail par semaine ?',
     * })
     */
    async ragAsk(params) {
        return this.request('/api/v1/llm/rag/ask', params);
    }
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
    async runTemplate(templateId, variables) {
        return this.request('/api/v1/llm/templates/run', {
            templateId,
            variables,
        });
    }
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
    async runWorkflow(workflowId, input) {
        return this.request('/api/v1/llm/workflows/run', {
            workflowId,
            input,
        });
    }
    /**
     * Vérifie la connectivité et la validité de la clé API.
     *
     * @example
     * const { valid } = await client.ping()
     * if (!valid) console.error('Clé API invalide')
     */
    async ping() {
        try {
            // Tente un chat minimal pour valider la clé
            await this.chat([{ role: 'user', content: 'ping' }], { maxTokens: 5 });
            return { valid: true };
        }
        catch (e) {
            if (e.statusCode === 401)
                return { valid: false, error: 'Clé API invalide' };
            if (e.statusCode === 403)
                return { valid: false, error: 'Scope insuffisant (llm:chat requis)' };
            return { valid: true }; // Autre erreur = clé valide mais problème service
        }
    }
}
exports.DataSphereRH = DataSphereRH;
// ━━━ Export default pour usage direct ━━━
exports.default = DataSphereRH;
// ━━━ Helper de création rapide ━━━
/**
 * Crée un client DataSphere RH rapidement.
 *
 * @example
 * import { createClient } from '@datasphere/rh-sdk'
 * const client = createClient('dsrh_live_xxx')
 */
function createClient(apiKey, options) {
    return new DataSphereRH({ apiKey, ...options });
}
//# sourceMappingURL=index.js.map