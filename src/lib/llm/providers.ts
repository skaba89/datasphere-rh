export type ApiStyle = 'openai' | 'anthropic' | 'gemini' | 'zai'
export interface LlmModel { id: string; label: string; contextWindow?: number; inputPricePer1M?: number; outputPricePer1M?: number; tags?: string[] }
export interface LlmProvider { id: string; label: string; envVar: string; baseUrl: string; defaultModel: string; models: LlmModel[]; apiStyle: ApiStyle; docsUrl: string; description: string; color: string }

export const LLM_PROVIDERS: LlmProvider[] = [
  { id: 'zai', label: 'Z.ai (GLM)', envVar: 'ZAI_API_KEY', baseUrl: 'https://api.z.ai/api/paas/v4', defaultModel: 'glm-4.6', models: [
    { id: 'glm-4.6', label: 'GLM-4.6', contextWindow: 128000, tags: ['flagship'] },
    { id: 'glm-4-flash', label: 'GLM-4 Flash', contextWindow: 128000, tags: ['fast', 'cheap'] },
    { id: 'glm-4v', label: 'GLM-4V (vision)', contextWindow: 8000, tags: ['vision'] },
  ], apiStyle: 'zai', docsUrl: 'https://docs.z.ai', description: 'Z.ai — GLM models', color: '#2563eb' },
  { id: 'openai', label: 'OpenAI', envVar: 'OPENAI_API_KEY', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', models: [
    { id: 'gpt-4o', label: 'GPT-4o', contextWindow: 128000, tags: ['flagship'] },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', contextWindow: 128000, tags: ['fast', 'cheap'] },
  ], apiStyle: 'openai', docsUrl: 'https://platform.openai.com/docs', description: 'OpenAI GPT', color: '#10a37f' },
  { id: 'anthropic', label: 'Anthropic Claude', envVar: 'ANTHROPIC_API_KEY', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-5-sonnet-20241022', models: [
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', contextWindow: 200000, tags: ['flagship'] },
  ], apiStyle: 'anthropic', docsUrl: 'https://docs.anthropic.com', description: 'Anthropic Claude', color: '#d97706' },
  { id: 'groq', label: 'Groq', envVar: 'GROQ_API_KEY', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', models: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', contextWindow: 128000, tags: ['flagship'] },
    { id: 'llama-3.2-11b-vision-preview', label: 'Llama 3.2 11B Vision', contextWindow: 128000, tags: ['vision'] },
  ], apiStyle: 'openai', docsUrl: 'https://console.groq.com/docs', description: 'Groq — ultra-rapide', color: '#f55036' },
  { id: 'gemini', label: 'Google Gemini', envVar: 'GEMINI_API_KEY', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-1.5-flash', models: [
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', contextWindow: 2000000, tags: ['flagship'] },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', contextWindow: 1000000, tags: ['fast', 'cheap'] },
  ], apiStyle: 'gemini', docsUrl: 'https://ai.google.dev/gemini-api/docs', description: 'Google Gemini', color: '#4285f4' },
  { id: 'openrouter', label: 'OpenRouter', envVar: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini', models: [
    { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini (via OpenRouter)', tags: ['cheap'] },
  ], apiStyle: 'openai', docsUrl: 'https://openrouter.ai/docs', description: 'OpenRouter — 200+ modèles', color: '#8b5cf6' },
  { id: 'mistral', label: 'Mistral AI', envVar: 'MISTRAL_API_KEY', baseUrl: 'https://api.mistral.ai/v1', defaultModel: 'mistral-large-latest', models: [
    { id: 'mistral-large-latest', label: 'Mistral Large', contextWindow: 128000, tags: ['flagship'] },
  ], apiStyle: 'openai', docsUrl: 'https://docs.mistral.ai', description: 'Mistral AI', color: '#ff7000' },
  { id: 'deepseek', label: 'DeepSeek', envVar: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', models: [
    { id: 'deepseek-chat', label: 'DeepSeek V3', contextWindow: 64000, tags: ['cheap', 'flagship'] },
  ], apiStyle: 'openai', docsUrl: 'https://api-docs.deepseek.com', description: 'DeepSeek — économique', color: '#4d6bfe' },
  { id: 'cohere', label: 'Cohere', envVar: 'COHERE_API_KEY', baseUrl: 'https://api.cohere.com/v2', defaultModel: 'command-r-plus-08-2024', models: [
    { id: 'command-r-plus-08-2024', label: 'Command R+', contextWindow: 128000, tags: ['flagship'] },
  ], apiStyle: 'openai', docsUrl: 'https://docs.cohere.com', description: 'Cohere', color: '#39594d' },
  { id: 'together', label: 'Together AI', envVar: 'TOGETHER_API_KEY', baseUrl: 'https://api.together.xyz/v1', defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', models: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Turbo', tags: ['flagship'] },
  ], apiStyle: 'openai', docsUrl: 'https://docs.together.ai', description: 'Together AI', color: '#0f6fff' },
  { id: 'ollama', label: 'Ollama (local)', envVar: 'OLLAMA_BASE_URL', baseUrl: 'http://localhost:11434/v1', defaultModel: 'llama3.2', models: [
    { id: 'llama3.2', label: 'Llama 3.2' },
  ], apiStyle: 'openai', docsUrl: 'https://ollama.com', description: 'Ollama — local, privé', color: '#22c55e' },
]

export function getProviderById(id: string): LlmProvider | undefined { return LLM_PROVIDERS.find(p => p.id === id) }
export function isProviderConfigured(provider: LlmProvider): boolean { if (provider.id === 'ollama') return true; return !!process.env[provider.envVar] }
export function getConfiguredProviders(): LlmProvider[] { return LLM_PROVIDERS.filter(isProviderConfigured) }
