/**
 * Utilitaires de sécurité pour DataSphere RH
 */

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
