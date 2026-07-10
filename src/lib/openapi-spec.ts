/**
 * Spécification OpenAPI 3.0 pour l'API publique DataSphere RH v1.
 *
 * Cette spec décrit tous les endpoints /api/v1/* accessibles via clé API.
 * L'UI Swagger est disponible sur /api-docs.
 */

export const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'DataSphere RH API',
    version: '1.0.0',
    description: 'API publique du SIRH DataSphere RH Guinée — IA multi-providers (GLM, OpenAI, Claude, Gemini, Groq, Mistral, DeepSeek), RAG, Vision, Workflows IA.',
    contact: {
      name: 'DataSphere SARL',
      email: 'contact@datasphere.gn',
      url: 'https://rh.datasphere.gn',
    },
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
  },
  servers: [
    { url: 'https://rh.datasphere.gn', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Développement' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'dsrh_live_xxx',
        description: 'Clé API au format dsrh_live_xxxxxxxx. Obtenez votre clé sur /llm-api-keys',
      },
    },
    schemas: {
      ChatMessage: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: { type: 'string', enum: ['system', 'user', 'assistant'] },
          content: { type: 'string' },
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL publique de l\'image' },
                base64: { type: 'string', description: 'Image encodée en base64 (sans prefix data:)' },
                mimeType: { type: 'string', example: 'image/jpeg' },
              },
            },
          },
        },
      },
      ChatRequest: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
          provider: { type: 'string', description: 'ID du provider (zai, openai, anthropic, groq, gemini, openrouter, mistral, deepseek, cohere, together, ollama)' },
          model: { type: 'string', description: 'ID du modèle (ex: glm-4.6, gpt-4o-mini)' },
          temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
          maxTokens: { type: 'integer', minimum: 1, maximum: 8000, default: 1000 },
        },
      },
      ChatResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          content: { type: 'string' },
          model: { type: 'string' },
          provider: { type: 'string' },
          usage: {
            type: 'object',
            properties: {
              promptTokens: { type: 'integer' },
              completionTokens: { type: 'integer' },
              totalTokens: { type: 'integer' },
            },
          },
          durationMs: { type: 'integer' },
        },
      },
      VisionRequest: {
        type: 'object',
        required: ['images', 'prompt'],
        properties: {
          images: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                base64: { type: 'string' },
                mimeType: { type: 'string', default: 'image/jpeg' },
              },
            },
          },
          prompt: { type: 'string', description: 'Question/instruction pour l\'analyse' },
          provider: { type: 'string' },
          model: { type: 'string' },
        },
      },
      RagAskRequest: {
        type: 'object',
        required: ['question'],
        properties: {
          question: { type: 'string' },
          source: { type: 'string', enum: ['policy', 'contract_template', 'faq', 'manual', 'law', 'other'] },
          limit: { type: 'integer', default: 5, maximum: 10 },
        },
      },
      RagAskResponse: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          sources: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                source: { type: 'string' },
                score: { type: 'number' },
              },
            },
          },
          contextFound: { type: 'boolean' },
          chunksRetrieved: { type: 'integer' },
        },
      },
      TemplateRunRequest: {
        type: 'object',
        required: ['templateId', 'variables'],
        properties: {
          templateId: {
            type: 'string',
            enum: ['contrat_cdi_resume', 'avenant_contrat', 'synthese_evaluation', 'feedback_360', 'annonce_promotion', 'annonce_depart', 'lettre_avertissement', 'analyse_turnover', 'synthese_paie', 'plan_onboarding', 'mediation_conflit'],
          },
          variables: { type: 'object', description: 'Variables à remplir dans le template' },
        },
      },
      WorkflowRunRequest: {
        type: 'object',
        required: ['input'],
        properties: {
          workflowId: { type: 'string', description: 'ID du workflow prédéfini (contract_pipeline, document_analysis, policy_create) ou custom' },
          input: { type: 'string', description: 'Texte d\'entrée pour la première étape' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/api/v1/llm/chat': {
      post: {
        summary: 'Chat unifié multi-providers',
        description: 'Envoie une requête de chat au LLM. Supporte 11 providers (ZAI, OpenAI, Claude, Gemini, Groq, etc.) avec fallback automatique.',
        tags: ['LLM Chat'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatRequest' } } } },
        responses: {
          '200': { description: 'Réponse du LLM', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatResponse' } } } },
          '401': { description: 'Clé API invalide', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '403': { description: 'Scope insuffisant', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '429': { description: 'Rate limit dépassé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/llm/vision': {
      post: {
        summary: 'Analyse d\'images (Vision IA)',
        description: 'Analyse une ou plusieurs images via un modèle de vision (GPT-4o, Gemini, GLM-4V, Llama Vision).',
        tags: ['LLM Vision'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VisionRequest' } } } },
        responses: {
          '200': { description: 'Analyse réussie', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatResponse' } } } },
          '400': { description: 'Provider ne supporte pas la vision', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/v1/llm/rag/ask': {
      post: {
        summary: 'Q&A augmentée par RAG',
        description: 'Pose une question et reçoit une réponse basée sur les documents RH internes indexés (politiques, FAQ, manuels, textes de loi).',
        tags: ['RAG'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RagAskRequest' } } } },
        responses: {
          '200': { description: 'Réponse avec sources', content: { 'application/json': { schema: { $ref: '#/components/schemas/RagAskResponse' } } } },
        },
      },
    },
    '/api/v1/llm/templates/run': {
      post: {
        summary: 'Exécuter un template de prompt RH',
        description: 'Exécute un des 11 templates RH prédéfinis avec les variables fournies.',
        tags: ['Templates'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TemplateRunRequest' } } } },
        responses: {
          '200': { description: 'Contenu généré', content: { 'application/json': { schema: { $ref: '#/components/schemas/ChatResponse' } } } },
        },
      },
    },
    '/api/v1/llm/workflows/run': {
      post: {
        summary: 'Exécuter un workflow IA',
        description: 'Exécute un workflow multi-étapes (générer → améliorer → indexer → sauver). Workflows prédéfinis ou custom.',
        tags: ['Workflows'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WorkflowRunRequest' } } } },
        responses: {
          '200': { description: 'Résultat du workflow', content: { 'application/json': { schema: { type: 'object' } } } },
        },
      },
    },
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Vérifie l\'état de l\'application (DB, Redis, providers LLM).',
        tags: ['System'],
        security: [],
        responses: {
          '200': { description: 'Application opérationnelle' },
          '503': { description: 'Service dégradé' },
        },
      },
    },
  },
  tags: [
    { name: 'LLM Chat', description: 'Chat unifié multi-providers' },
    { name: 'LLM Vision', description: 'Analyse d\'images' },
    { name: 'RAG', description: 'Q&A sur documents RH' },
    { name: 'Templates', description: 'Templates de prompts RH' },
    { name: 'Workflows', description: 'Workflows IA multi-étapes' },
    { name: 'System', description: 'Endpoints système' },
  ],
}
