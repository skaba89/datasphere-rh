import ZAI from 'z-ai-web-dev-sdk'
import { getProviderById, type LlmProvider } from './providers'

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; images?: Array<{ url?: string; base64?: string; mimeType?: string }> }
export interface ChatOptions { temperature?: number; maxTokens?: number; tracking?: { companyId: string; endpoint: string; feature?: string; userId?: string } }
export interface ChatResult { content: string; model: string; provider: string; usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }; finishReason?: string; durationMs: number }

export async function chat(providerId: string, model: string, messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResult> {
  const provider = getProviderById(providerId)
  if (!provider) throw new Error(`Provider inconnu: ${providerId}`)
  const start = Date.now()
  try {
    switch (provider.apiStyle) {
      case 'zai': return await chatWithZai(provider, model, messages, options, start)
      case 'openai': return await chatWithOpenAICompatible(provider, model, messages, options, start)
      case 'anthropic': return await chatWithAnthropic(provider, model, messages, options, start)
      case 'gemini': return await chatWithGemini(provider, model, messages, options, start)
      default: throw new Error(`Style non supporté: ${provider.apiStyle}`)
    }
  } catch (e: any) { throw e }
}

async function chatWithZai(provider: LlmProvider, model: string, messages: ChatMessage[], options: ChatOptions, start: number): Promise<ChatResult> {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({ model, messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 1000 })
  return { content: completion.choices[0]?.message?.content || '', model, provider: provider.id, usage: completion.usage ? { promptTokens: completion.usage.prompt_tokens, completionTokens: completion.usage.completion_tokens, totalTokens: completion.usage.total_tokens } : undefined, finishReason: completion.choices[0]?.finish_reason, durationMs: Date.now() - start }
}

async function chatWithOpenAICompatible(provider: LlmProvider, model: string, messages: ChatMessage[], options: ChatOptions, start: number): Promise<ChatResult> {
  const apiKey = process.env[provider.envVar]
  if (!apiKey && provider.id !== 'ollama') throw new Error(`Clé API manquante pour ${provider.label}`)
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  const formattedMessages = messages.map(m => m.images?.length ? { role: m.role, content: [{ type: 'text', text: m.content }, ...m.images.map(img => ({ type: 'image_url', image_url: { url: img.url || `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}` } }))] } : { role: m.role, content: m.content })
  const res = await fetch(`${provider.baseUrl}/chat/completions`, { method: 'POST', headers, body: JSON.stringify({ model, messages: formattedMessages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens ?? 1000 }), signal: AbortSignal.timeout(60000) })
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${provider.label} API ${res.status}: ${t.slice(0, 200)}`) }
  const data = await res.json()
  return { content: data.choices?.[0]?.message?.content || '', model: data.model || model, provider: provider.id, usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined, finishReason: data.choices?.[0]?.finish_reason, durationMs: Date.now() - start }
}

async function chatWithAnthropic(provider: LlmProvider, model: string, messages: ChatMessage[], options: ChatOptions, start: number): Promise<ChatResult> {
  const apiKey = process.env[provider.envVar]
  if (!apiKey) throw new Error(`Clé API manquante pour ${provider.label}`)
  const systemMsgs = messages.filter(m => m.role === 'system')
  const chatMsgs = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
  const res = await fetch(`${provider.baseUrl}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, messages: chatMsgs, max_tokens: options.maxTokens ?? 1000, ...(systemMsgs.length ? { system: systemMsgs.map(m => m.content).join('\n\n') } : {}), ...(options.temperature !== undefined ? { temperature: options.temperature } : {}) }), signal: AbortSignal.timeout(60000) })
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${provider.label} API ${res.status}: ${t.slice(0, 200)}`) }
  const data = await res.json()
  return { content: data.content?.[0]?.text || '', model: data.model || model, provider: provider.id, usage: data.usage ? { promptTokens: data.usage.input_tokens, completionTokens: data.usage.output_tokens, totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0) } : undefined, finishReason: data.stop_reason, durationMs: Date.now() - start }
}

async function chatWithGemini(provider: LlmProvider, model: string, messages: ChatMessage[], options: ChatOptions, start: number): Promise<ChatResult> {
  const apiKey = process.env[provider.envVar]
  if (!apiKey) throw new Error(`Clé API manquante pour ${provider.label}`)
  const systemMsgs = messages.filter(m => m.role === 'system')
  const contents = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const res = await fetch(`${provider.baseUrl}/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents, generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.maxTokens ?? 1000 }, ...(systemMsgs.length ? { systemInstruction: { parts: [{ text: systemMsgs.map(m => m.content).join('\n\n') }] } } : {}) }), signal: AbortSignal.timeout(60000) })
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${provider.label} API ${res.status}: ${t.slice(0, 200)}`) }
  const data = await res.json()
  return { content: data.candidates?.[0]?.content?.parts?.[0]?.text || '', model, provider: provider.id, usage: data.usageMetadata ? { promptTokens: data.usageMetadata.promptTokenCount, completionTokens: data.usageMetadata.candidatesTokenCount, totalTokens: data.usageMetadata.totalTokenCount } : undefined, finishReason: data.candidates?.[0]?.finishReason, durationMs: Date.now() - start }
}
