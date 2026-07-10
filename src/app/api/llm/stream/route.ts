import { getProviderById, type LlmProvider } from '@/lib/llm/providers'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'
import { getDefaultProvider } from '@/lib/llm/settings'
import { trackUsage } from '@/lib/llm/usage'

// POST /api/llm/stream
// Body: { provider?, model?, messages: [{role, content}], temperature?, maxTokens? }
// Streaming SSE — envoie les chunks au fur et à mesure de la génération.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider: forcedProvider, model: forcedModel, messages, temperature, maxTokens } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages[] requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const ctx = await getCompanyContext(request)
    if ('error' in ctx) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    // Récupère le provider à utiliser
    let provider: LlmProvider
    let model: string
    if (forcedProvider) {
      const p = getProviderById(forcedProvider)
      if (!p) return new Response(JSON.stringify({ error: `Provider inconnu: ${forcedProvider}` }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      provider = p
      model = forcedModel || p.defaultModel
    } else {
      const def = await getDefaultProvider(ctx.companyId)
      provider = def.provider
      model = forcedModel || def.model
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const start = Date.now()
        let totalContent = ''
        let promptTokens = 0
        let completionTokens = 0
        let finishReason: string | null = null
        let errorMsg: string | null = null

        try {
          // Pour le streaming, on utilise directement fetch sur l'API du provider
          // (z-ai-web-dev-sdk ne supporte pas le streaming natif de la même manière,
          // donc on fait un appel non-streaming et on découpe la réponse en chunks)
          const result = await streamFromProvider(provider, model, messages, {
            temperature,
            maxTokens,
            onChunk: (chunk: string) => {
              totalContent += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`))
            },
          })
          promptTokens = result.promptTokens || 0
          completionTokens = result.completionTokens || 0
          finishReason = result.finishReason

          // Envoie l'événement final
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            content: totalContent,
            provider: provider.id,
            providerLabel: provider.label,
            model,
            usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
            durationMs: Date.now() - start,
          })}\n\n`))
        } catch (e: any) {
          errorMsg = e?.message || String(e)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`))
        } finally {
          // Tracking (succès ou échec)
          await trackUsage({
            companyId: ctx.companyId,
            providerId: provider.id,
            modelId: model,
            endpoint: 'llm_stream',
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            durationMs: Date.now() - start,
            success: !errorMsg,
            errorMsg,
            feature: 'streaming_chat',
            userId: ctx.user?.userId,
          })
          controller.enqueue(encoder.encode(': done\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: any) {
    console.error('POST /api/llm/stream error:', error)
    return new Response(JSON.stringify({ error: error?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ━━━ Streaming par provider ━━━

interface StreamResult {
  promptTokens: number
  completionTokens: number
  finishReason: string | null
}

async function streamFromProvider(
  provider: LlmProvider,
  model: string,
  messages: any[],
  options: {
    temperature?: number
    maxTokens?: number
    onChunk: (chunk: string) => void
  }
): Promise<StreamResult> {
  switch (provider.apiStyle) {
    case 'zai':
      return streamFromZai(provider, model, messages, options)
    case 'openai':
      return streamFromOpenAICompatible(provider, model, messages, options)
    case 'anthropic':
      return streamFromAnthropic(provider, model, messages, options)
    case 'gemini':
      return streamFromGemini(provider, model, messages, options)
    default:
      throw new Error(`Streaming non supporté pour ${provider.apiStyle}`)
  }
}

// ZAI — utilisation du SDK non-streaming, on découpe en chunks pour simuler
async function streamFromZai(provider: LlmProvider, model: string, messages: any[], options: any): Promise<StreamResult> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1000,
  })

  const content = completion.choices[0]?.message?.content || ''
  // Découpe en mots pour simuler le streaming
  const words = content.split(/(\s+)/)
  for (const word of words) {
    options.onChunk(word)
    // Petit délai pour effet streaming (10ms par mot)
    await new Promise(r => setTimeout(r, 10))
  }

  return {
    promptTokens: completion.usage?.prompt_tokens || 0,
    completionTokens: completion.usage?.completion_tokens || 0,
    finishReason: completion.choices[0]?.finish_reason || null,
  }
}

// OpenAI-compatible — true streaming via SSE
async function streamFromOpenAICompatible(provider: LlmProvider, model: string, messages: any[], options: any): Promise<StreamResult> {
  const apiKey = process.env[provider.envVar]
  if (!apiKey && provider.id !== 'ollama') {
    throw new Error(`Clé API manquante pour ${provider.label}`)
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'https://datasphererh.gn'
    headers['X-Title'] = 'DataSphere RH'
  }

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      stream: true,
      stream_options: { include_usage: true },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${provider.label} API ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let promptTokens = 0, completionTokens = 0
  let finishReason: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) options.onChunk(delta)
        if (parsed.choices?.[0]?.finish_reason) finishReason = parsed.choices[0].finish_reason
        if (parsed.usage) {
          promptTokens = parsed.usage.prompt_tokens || 0
          completionTokens = parsed.usage.completion_tokens || 0
        }
      } catch {}
    }
  }

  return { promptTokens, completionTokens, finishReason }
}

// Anthropic — streaming via SSE
async function streamFromAnthropic(provider: LlmProvider, model: string, messages: any[], options: any): Promise<StreamResult> {
  const apiKey = process.env[provider.envVar]
  if (!apiKey) throw new Error(`Clé API manquante pour ${provider.label}`)

  const systemMessages = messages.filter((m: any) => m.role === 'system')
  const chatMessages = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({ role: m.role, content: m.content }))
  const systemPrompt = systemMessages.map((m: any) => m.content).join('\n\n')

  const res = await fetch(`${provider.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      messages: chatMessages,
      max_tokens: options.maxTokens ?? 1000,
      stream: true,
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(systemPrompt ? { system: systemPrompt } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${provider.label} API ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let promptTokens = 0, completionTokens = 0
  let finishReason: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const parsed = JSON.parse(line.slice(6))
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          options.onChunk(parsed.delta.text)
        }
        if (parsed.type === 'message_delta' && parsed.usage) {
          completionTokens = parsed.usage.output_tokens || completionTokens
        }
        if (parsed.type === 'message_start' && parsed.message?.usage) {
          promptTokens = parsed.message.usage.input_tokens || 0
        }
        if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
          finishReason = parsed.delta.stop_reason
        }
      } catch {}
    }
  }

  return { promptTokens, completionTokens, finishReason }
}

// Gemini — streaming via SSE
async function streamFromGemini(provider: LlmProvider, model: string, messages: any[], options: any): Promise<StreamResult> {
  const apiKey = process.env[provider.envVar]
  if (!apiKey) throw new Error(`Clé API manquante pour ${provider.label}`)

  const systemMessages = messages.filter((m: any) => m.role === 'system')
  const systemPrompt = systemMessages.map((m: any) => m.content).join('\n\n')
  const contents = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const url = `${provider.baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1000,
      },
      ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${provider.label} API ${res.status}: ${text.slice(0, 200)}`)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let promptTokens = 0, completionTokens = 0
  let finishReason: string | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const parsed = JSON.parse(line.slice(6))
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) options.onChunk(text)
        if (parsed.candidates?.[0]?.finishReason) finishReason = parsed.candidates[0].finishReason
        if (parsed.usageMetadata) {
          promptTokens = parsed.usageMetadata.promptTokenCount || promptTokens
          completionTokens = parsed.usageMetadata.candidatesTokenCount || completionTokens
        }
      } catch {}
    }
  }

  return { promptTokens, completionTokens, finishReason }
}
