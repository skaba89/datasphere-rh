import fs from 'fs'
import path from 'path'
import os from 'os'
import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null
let initPromise: Promise<typeof zaiInstance> | null = null
let initError: string | null = null

/**
 * Initialise le SDK Z.ai en écrivant le fichier de config depuis les variables d'environnement.
 * Le SDK z-ai-web-dev-sdk lit la config depuis .z-ai-config (pas depuis process.env directement).
 *
 * Variables d'environnement attendues :
 * - ZAI_API_KEY : la clé API Z.ai
 * - ZAI_BASE_URL : (optionnel) URL de base, défaut https://api.z.ai/api/paas/v4
 */
async function ensureConfigFile(): Promise<void> {
  const apiKey = process.env.ZAI_API_KEY
  if (!apiKey) {
    throw new Error('ZAI_API_KEY environment variable is not set. Add it in Netlify → Site settings → Environment variables. Get your key at https://z.ai')
  }
  const baseUrl = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4'

  const config = JSON.stringify({ baseUrl, apiKey })

  // Try multiple writable locations
  const candidates = [
    path.join(process.cwd(), '.z-ai-config'),
    path.join(os.tmpdir(), '.z-ai-config'),
    path.join(os.homedir(), '.z-ai-config'),
  ]

  for (const filePath of candidates) {
    try {
      // Check if already exists with correct content
      try {
        const existing = await fs.promises.readFile(filePath, 'utf-8')
        if (existing === config) return
      } catch {
        // File doesn't exist or can't be read, try to write it
      }
      await fs.promises.writeFile(filePath, config, { mode: 0o600 })
      return
    } catch {
      // Continue to next candidate
    }
  }
  throw new Error('Could not write .z-ai-config to any writable location')
}

/**
 * Get the ZAI singleton instance.
 * The SDK reads config from a .z-ai-config file, so we write it from env vars on first call.
 *
 * Returns null if ZAI_API_KEY is not configured — callers should fall back to a template.
 */
export async function getZAI() {
  if (initError) throw new Error(initError)
  if (zaiInstance) return zaiInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      await ensureConfigFile()
      zaiInstance = await ZAI.create()
      return zaiInstance
    } catch (err: any) {
      initError = err?.message || 'ZAI initialization failed'
      throw err
    }
  })()

  return initPromise
}

/**
 * Check if ZAI is configured (without throwing).
 * Use this to decide whether to call AI or use a fallback template.
 */
export function isZAIConfigured(): boolean {
  return !!process.env.ZAI_API_KEY
}

