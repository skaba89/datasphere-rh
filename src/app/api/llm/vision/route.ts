import { NextResponse } from 'next/server'
import { chat } from '@/lib/llm/router'
import { getProviderById } from '@/lib/llm/providers'
import { getDefaultProvider } from '@/lib/llm/settings'
import { getCompanyContext } from '@/lib/advanced/auth-helpers'

// POST /api/llm/vision
// Body: { provider?, model?, images: [{base64, mimeType}], prompt, temperature?, maxTokens? }
// Analyse une ou plusieurs images avec un modèle de vision.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider: forcedProvider, model: forcedModel, images, prompt, temperature, maxTokens } = body

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'images[] requis' }, { status: 400 })
    }
    if (!prompt) {
      return NextResponse.json({ error: 'prompt requis' }, { status: 400 })
    }

    const ctx = await getCompanyContext(request)
    if ('error' in ctx) return ctx.error

    // Détermine le provider à utiliser
    let providerId: string
    let model: string

    if (forcedProvider) {
      providerId = forcedProvider
      const provider = getProviderById(providerId)
      if (!provider) return NextResponse.json({ error: `Provider inconnu: ${providerId}` }, { status: 400 })
      model = forcedModel || provider.defaultModel
    } else {
      // Cherche un provider avec vision configuré
      const def = await getDefaultProvider(ctx.companyId)
      providerId = def.provider.id
      model = def.model
    }

    // Vérifie que le provider supporte la vision
    const provider = getProviderById(providerId)!
    const visionModels = provider.models.filter(m => m.tags?.includes('vision'))
    if (visionModels.length === 0) {
      return NextResponse.json({
        error: `Le provider ${provider.label} ne supporte pas la vision. Utilisez OpenAI (GPT-4o), Gemini, ou GLM-4V.`,
      }, { status: 400 })
    }

    // Si le modèle actuel n'est pas un modèle vision, utilise le premier modèle vision du provider
    const isVisionModel = provider.models.find(m => m.id === model)?.tags?.includes('vision')
    if (!isVisionModel) {
      model = visionModels[0].id
    }

    const result = await chat(providerId, model, [
      {
        role: 'user',
        content: prompt,
        images: images.map((img: any) => ({
          base64: img.base64,
          mimeType: img.mimeType || 'image/jpeg',
        })),
      },
    ], {
      temperature: temperature ?? 0.5,
      maxTokens: maxTokens ?? 1000,
      tracking: {
        companyId: ctx.companyId,
        endpoint: 'llm_vision',
        feature: 'vision_analysis',
        userId: ctx.user?.userId,
      },
    })

    return NextResponse.json({
      success: true,
      content: result.content,
      provider: result.provider,
      providerLabel: provider.label,
      model: result.model,
      usage: result.usage,
      durationMs: result.durationMs,
      imagesAnalyzed: images.length,
    })
  } catch (error: any) {
    console.error('POST /api/llm/vision error:', error)
    return NextResponse.json({ error: error?.message || 'Erreur lors de l\'analyse d\'image' }, { status: 500 })
  }
}
