/**
 * Utilitaires de sécurité pour DataSphere RH
 */
import { db } from '@/lib/db'

/**
 * Constantes de rate limiting
 */
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
export const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute

export interface RateLimitResult {
  allowed: boolean
  remainingAttempts: number
  lockoutExpiresAt: Date | null
  reason?: string
}

/**
 * Vérifie le rate limiting pour un email et une IP donnés.
 * Règles :
 * - Maximum 5 tentatives par email dans les 15 dernières minutes
 * - Maximum 10 tentatives par IP dans la dernière minute
 * - Après 5 échecs par email, verrouillage 15 minutes
 */
export async function checkRateLimit(email: string, ipAddress: string | null): Promise<RateLimitResult> {
  const now = new Date()
  const lockoutCutoff = new Date(now.getTime() - LOCKOUT_DURATION_MS)
  const rateLimitCutoff = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS)

  // 1. Compter les tentatives échouées par email dans les 15 dernières minutes
  const failedByEmail = await db.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      success: false,
      createdAt: { gt: lockoutCutoff },
    },
  })

  // 2. Compter les tentatives par IP dans la dernière minute
  let failedByIp = 0
  if (ipAddress) {
    failedByIp = await db.loginAttempt.count({
      where: {
        ipAddress,
        createdAt: { gt: rateLimitCutoff },
      },
    })
  }

  // 3. Vérifier le verrouillage par email
  if (failedByEmail >= MAX_LOGIN_ATTEMPTS) {
    // Trouver la dernière tentative pour calculer l'expiration du lockout
    const lastAttempt = await db.loginAttempt.findFirst({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gt: lockoutCutoff },
      },
      orderBy: { createdAt: 'desc' },
    })

    const lockoutExpiresAt = lastAttempt
      ? new Date(lastAttempt.createdAt.getTime() + LOCKOUT_DURATION_MS)
      : new Date(now.getTime() + LOCKOUT_DURATION_MS)

    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutExpiresAt,
      reason: `Compte temporairement verrouillé. Réessayez après ${lockoutExpiresAt.toLocaleTimeString('fr-FR')}.`,
    }
  }

  // 4. Vérifier le rate limiting par IP (10 tentatives/min)
  if (failedByIp >= 10) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutExpiresAt: null,
      reason: 'Trop de tentatives depuis cette adresse. Réessayez dans 1 minute.',
    }
  }

  return {
    allowed: true,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - failedByEmail,
    lockoutExpiresAt: null,
  }
}

/**
 * Enregistre une tentative de connexion (succès ou échec).
 */
export async function recordLoginAttempt(
  email: string,
  ipAddress: string | null,
  success: boolean,
  userAgent: string | null
): Promise<void> {
  try {
    await db.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress,
        success,
        userAgent,
      },
    })
  } catch (error) {
    console.error('recordLoginAttempt error:', error)
  }
}

/**
 * Nettoie les anciennes tentatives de connexion (> 24h).
 */
export async function cleanupOldLoginAttempts(): Promise<number> {
  try {
    const result = await db.loginAttempt.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    return result.count
  } catch {
    return 0
  }
}

/**
 * Extrait l'adresse IP d'une requête.
 */
export function getIpAddress(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || null
}

/**
 * Vérifie la force d'un mot de passe selon la politique de sécurité.
 * Règles :
 * - Minimum 8 caractères
 * - Au moins 1 majuscule
 * - Au moins 1 minuscule
 * - Au moins 1 chiffre
 * - Au moins 1 caractère spécial (!@#$%^&*...)
 */
export interface PasswordValidation {
  valid: boolean
  errors: string[]
  score: number // 0-5 (nombre de critères remplis)
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  } else {
    score++
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule')
  } else {
    score++
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule')
  } else {
    score++
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  } else {
    score++
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...)')
  } else {
    score++
  }

  return {
    valid: errors.length === 0,
    errors,
    score,
  }
}

/**
 * Génère un mot de passe aléatoire fort (12 caractères).
 */
export function generateStrongPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%^&*'
  const all = uppercase + lowercase + numbers + special

  let password = ''
  // Au moins 1 de chaque type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  // Remplir le reste
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }
  // Mélanger
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Vérifie si le NEXTAUTH_SECRET est configuré et suffisamment long.
 */
export function checkNextAuthSecret(): { valid: boolean; message: string } {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    return {
      valid: false,
      message: 'NEXTAUTH_SECRET n\'est pas configuré. Ajoutez-le dans les variables d\'environnement Netlify.',
    }
  }
  if (secret.length < 32) {
    return {
      valid: false,
      message: `NEXTAUTH_SECRET trop court (${secret.length} caractères). Minimum 32 caractères recommandé.`,
    }
  }
  return { valid: true, message: 'NEXTAUTH_SECRET configuré correctement' }
}

/**
 * Génère un secret aléatoire de 64 caractères (pour NEXTAUTH_SECRET).
 */
export function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let secret = ''
  for (let i = 0; i < 64; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)]
  }
  return secret
}
