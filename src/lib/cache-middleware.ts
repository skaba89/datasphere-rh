import { NextResponse } from 'next/server'

/**
 * Utilitaires de cache HTTP pour les APIs GET.
 *
 * Usage dans une route :
 * ```ts
 * import { withCache } from '@/lib/cache-middleware'
 *
 * export const GET = withCache(async (request) => {
 *   // votre code
 *   return NextResponse.json(data)
 * }, { ttl: 60 }) // cache 60 secondes
 * ```
 */

interface CacheOptions {
  ttl?: number // durée en secondes (défaut: 60)
  swr?: number // stale-while-revalidate (défaut: 0)
}

/**
 * Wrapper qui ajoute les headers Cache-Control à une réponse GET.
 * Le cache est désactivé si l'utilisateur est authentifié (cookie de session présent).
 */
export function withCache(
  handler: (request: Request) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (request: Request): Promise<NextResponse> => {
    const response = await handler(request)

    // Ne pas cacher si l'utilisateur est authentifié (données personnelles)
    const cookieHeader = request.headers.get('cookie') || ''
    if (cookieHeader.includes('dsrh-session')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }

    // Ne pas cacher les réponses d'erreur
    if (response.status >= 400) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }

    // Appliquer le cache
    const ttl = options.ttl ?? 60
    const swr = options.swr ?? 0
    response.headers.set(
      'Cache-Control',
      swr > 0
        ? `public, s-maxage=${ttl}, stale-while-revalidate=${swr}`
        : `public, s-maxage=${ttl}`
    )

    return response
  }
}

/**
 * Cache court (30 secondes) — pour les données qui changent peu.
 */
export function withShortCache(handler: (request: Request) => Promise<NextResponse>) {
  return withCache(handler, { ttl: 30, swr: 60 })
}

/**
 * Cache moyen (5 minutes) — pour les données de référence.
 */
export function withMediumCache(handler: (request: Request) => Promise<NextResponse>) {
  return withCache(handler, { ttl: 300, swr: 600 })
}

/**
 * Cache long (1 heure) — pour les données statiques.
 */
export function withLongCache(handler: (request: Request) => Promise<NextResponse>) {
  return withCache(handler, { ttl: 3600, swr: 3600 })
}
