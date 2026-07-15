/**
 * Module d'initialisation Sentry (optionnel).
 *
 * Pour activer le monitoring d'erreurs en production :
 *
 * 1. Créez un compte gratuit sur https://sentry.io (5K erreurs/mois gratuit)
 * 2. Créez un projet Next.js
 * 3. Récupérez le DSN (format: https://xxx@sentry.io/123)
 * 4. Ajoutez dans Netlify → Environment variables :
 *    NEXT_PUBLIC_SENTRY_DSN = https://xxx@sentry.io/123
 * 5. Installez le package : npm install @sentry/nextjs
 * 6. Décommentez le code ci-dessous
 *
 * Sans sentry installé, ce module ne fait rien (no-op).
 * Cela permet de ne pas casser le build si sentry n'est pas configuré.
 */

export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    // Sentry non configuré — mode silencieux
    return false
  }

  // Si @sentry/nextjs est installé, l'initialiser
  try {
    // Dynamic import pour éviter l'erreur si le package n'est pas installé
    // const Sentry = require('@sentry/nextjs')
    // Sentry.init({
    //   dsn,
    //   tracesSampleRate: 0.1,
    //   environment: process.env.NODE_ENV,
    //   release: process.env.npm_package_version,
    // })
    console.log('[Sentry] DSN configuré mais package @sentry/nextjs non installé')
    return false
  } catch {
    return false
  }
}

/**
 * Capture manuelle d'une erreur (no-op si Sentry non configuré).
 */
export function captureError(error: Error, context?: Record<string, any>) {
  console.error('[Error captured]', error, context)
  // Si Sentry est configuré :
  // const Sentry = require('@sentry/nextjs')
  // Sentry.captureException(error, { extra: context })
}

/**
 * Capture d'un message d'info (no-op si Sentry non configuré).
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (level === 'error') {
    console.error(`[${level}] ${message}`)
  } else if (level === 'warning') {
    console.warn(`[${level}] ${message}`)
  }
  // Si Sentry est configuré :
  // const Sentry = require('@sentry/nextjs')
  // Sentry.captureMessage(message, level)
}
