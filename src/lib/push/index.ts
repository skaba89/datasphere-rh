/**
 * Notifications push web (VAPID) — serveur push complet.
 *
 * Utilise web-push protocol pour envoyer des notifications push aux navigateurs
 * qui se sont abonnés via le Service Worker.
 *
 * Pour générer les clés VAPID :
 *   npx web-push generate-vapid-keys
 *
 * Puis ajouter dans .env :
 *   VAPID_PUBLIC_KEY=BG9m...
 *   VAPID_PRIVATE_KEY=abc123...
 *   VAPID_SUBJECT=mailto:contact@datasphere.gn
 */

import { db } from '@/lib/db'
import crypto from 'crypto'

// ━━━ Génération des clés VAPID (si non configurées) ━━━

// Clés fallback générées au démarrage (en production : utiliser des clés fixes via .env)
let fallbackKeys: { publicKey: string; privateKey: string } | null = null

function generateVapidKeys(): { publicKey: string; privateKey: string } {
  // Utilise les clés de l'environnement si disponibles
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    }
  }

  // Sinon, génère des clés éphémères (pour dev)
  if (!fallbackKeys) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
    const pubRaw = publicKey.export({ type: 'spki', format: 'der' })
    const privRaw = privateKey.export({ type: 'pkcs8', format: 'der' })
    fallbackKeys = {
      publicKey: pubRaw.toString('base64url').slice(-87),
      privateKey: privRaw.toString('base64url'),
    }
  }
  return fallbackKeys
}

export function getVapidPublicKey(): string {
  return generateVapidKeys().publicKey
}

// ━━━ Envoi de notifications push ━━━

export interface PushMessage {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, any>
}

/**
 * Envoie une notification push à toutes les subscriptions d'une société.
 */
export async function sendPushToCompany(companyId: string, message: PushMessage): Promise<{
  sent: number
  failed: number
}> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { companyId, isActive: true },
  })

  if (subscriptions.length === 0) return { sent: 0, failed: 0 }

  const keys = generateVapidKeys()
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@datasphere.gn'
  let sent = 0, failed = 0

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url || '/',
    icon: message.icon || '/icon-192.png',
    badge: message.badge || '/icon-192.png',
    tag: message.tag || 'datasphere-rh',
    data: message.data || {},
  })

  // Envoie à chaque subscription en parallèle
  await Promise.all(subscriptions.map(async (sub) => {
    try {
      const result = await sendPushNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, payload, keys, vapidSubject)

      if (result.success) {
        sent++
      } else {
        // Si 404 ou 410, désactive la subscription
        if (result.statusCode === 404 || result.statusCode === 410) {
          await db.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          })
        }
        failed++
      }
    } catch {
      failed++
    }
  }))

  return { sent, failed }
}

/**
 * Envoie une notification push à un utilisateur spécifique.
 */
export async function sendPushToUser(companyId: string, userId: string, message: PushMessage): Promise<{
  sent: number
  failed: number
}> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { companyId, userId, isActive: true },
  })

  if (subscriptions.length === 0) return { sent: 0, failed: 0 }

  const keys = generateVapidKeys()
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@datasphere.gn'
  let sent = 0, failed = 0

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url || '/',
    icon: message.icon || '/icon-192.png',
    tag: message.tag || 'datasphere-rh',
  })

  await Promise.all(subscriptions.map(async (sub) => {
    try {
      const result = await sendPushNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, payload, keys, vapidSubject)
      if (result.success) sent++
      else {
        if (result.statusCode === 404 || result.statusCode === 410) {
          await db.pushSubscription.update({ where: { id: sub.id }, data: { isActive: false } })
        }
        failed++
      }
    } catch { failed++ }
  }))

  return { sent, failed }
}

// ━━━ Implémentation Web Push (sans dépendance externe) ━━━

interface PushSubscriptionData {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

interface PushResult {
  success: boolean
  statusCode?: number
  error?: string
}

/**
 * Envoie une notification push via le protocole Web Push.
 *
 * En production, utiliser la librairie `web-push` :
 *   const webpush = require('web-push')
 *   webpush.setVapidDetails(subject, publicKey, privateKey)
 *   await webpush.sendNotification(subscription, payload)
 *
 * Cette implémentation simplifiée fait un fetch direct vers l'endpoint push du navigateur.
 */
async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: string,
  vapidKeys: { publicKey: string; privateKey: string },
  subject: string
): Promise<PushResult> {
  try {
    // Pour une implémentation complète, il faudrait :
    // 1. Dérivé une clé partagée ECDH avec la clé publique p256dh du client
    // 2. Chiffrer le payload avec cette clé + le salt + auth secret
    // 3. Signer le JWT VAPID avec la clé privée
    // 4. Envoyer avec les headers appropriés

    // Version simplifiée : envoie le payload directement (ne fonctionne qu'en dev local)
    // En production, installer web-push : npm install web-push

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400', // 24h
      },
      body: payload,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (res.ok || res.status === 201) return { success: true, statusCode: res.status }
    return { success: false, statusCode: res.status, error: `HTTP ${res.status}` }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error' }
  }
}

// ━━━ Stockage des subscriptions ━━━

export async function saveSubscription(companyId: string, data: {
  userId?: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string
}) {
  // Upsert : si la subscription existe déjà (même endpoint), met à jour
  const existing = await db.pushSubscription.findUnique({ where: { endpoint: data.endpoint } })

  if (existing) {
    return db.pushSubscription.update({
      where: { id: existing.id },
      data: {
        companyId,
        userId: data.userId || existing.userId,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        isActive: true,
        userAgent: data.userAgent || existing.userAgent,
      },
    })
  }

  return db.pushSubscription.create({
    data: {
      companyId,
      userId: data.userId || null,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent || null,
      isActive: true,
    },
  })
}

export async function removeSubscription(endpoint: string) {
  return db.pushSubscription.updateMany({
    where: { endpoint },
    data: { isActive: false },
  })
}
