import type { WebhookPayload } from './webhook'

/**
 * Détecte si une URL est un webhook Slack entrant.
 * Slack URLs : https://hooks.slack.com/services/T.../B.../...
 */
export function isSlackWebhookUrl(url: string): boolean {
  return url.includes('hooks.slack.com/services/')
}

/**
 * Détecte si une URL est un webhook Discord (qui supporte aussi les embeds).
 */
export function isDiscordWebhookUrl(url: string): boolean {
  return url.includes('discord.com/api/webhooks/')
}

/**
 * Détecte si une URL est un webhook Teams.
 */
export function isTeamsWebhookUrl(url: string): boolean {
  return url.includes('office.com/webhook/') || url.includes('webhook.office.com/')
}

export type WebhookProvider = 'slack' | 'discord' | 'teams' | 'generic'

export function detectProvider(url: string): WebhookProvider {
  if (isSlackWebhookUrl(url)) return 'slack'
  if (isDiscordWebhookUrl(url)) return 'discord'
  if (isTeamsWebhookUrl(url)) return 'teams'
  return 'generic'
}

// ━━━ Couleurs par type d'événement ━━━

const EVENT_COLORS: Record<string, string> = {
  'contract.renewed': '#10b981',     // vert
  'contract.expiring': '#f59e0b',    // orange
  'certificate.revoked': '#dc2626',  // rouge
  'model.trained': '#8b5cf6',        // violet
  'webhook.test': '#0ea5e9',         // bleu
}

const EVENT_EMOJIS: Record<string, string> = {
  'contract.renewed': '✅',
  'contract.expiring': '⚠️',
  'certificate.revoked': '🚫',
  'model.trained': '🤖',
  'webhook.test': '🧪',
}

const EVENT_TITLES: Record<string, string> = {
  'contract.renewed': 'Contrat renouvelé',
  'contract.expiring': 'Contrat expirant bientôt',
  'certificate.revoked': 'Certificat révoqué',
  'model.trained': 'Modèle IA ré-entraîné',
  'webhook.test': 'Test de connectivité',
}

// ━━━ Formatters par provider ━━━

/**
 * Formate le payload pour Slack (Block Kit avec carte).
 * https://api.slack.com/messaging/webhooks
 */
export function formatForSlack(payload: WebhookPayload): any {
  const emoji = EVENT_EMOJIS[payload.event] || '🔔'
  const title = EVENT_TITLES[payload.event] || payload.event
  const color = EVENT_COLORS[payload.event] || '#27698a'

  const fields: any[] = []
  for (const [key, value] of Object.entries(payload.data || {})) {
    if (value === null || value === undefined) continue
    const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    if (displayValue.length > 100) continue // skip long values
    fields.push({
      title: key,
      value: displayValue,
      short: displayValue.length < 30,
    })
  }

  return {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `${emoji} ${title}` },
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `*Module:* ${payload.module} · *Timestamp:* ${new Date(payload.timestamp).toLocaleString('fr-FR')}` },
            ],
          },
          ...(fields.length > 0 ? [{
            type: 'section',
            fields: fields.slice(0, 10).map(f => ({
              type: 'mrkdwn',
              text: `*${f.title}:*\n${f.value}`,
            })),
          }] : []),
          {
            type: 'divider',
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: '🔔 DataSphere RH · Webhook avancé' },
            ],
          },
        ],
      },
    ],
  }
}

/**
 * Formate le payload pour Discord (embed).
 * https://discord.com/developers/docs/resources/webhook
 */
export function formatForDiscord(payload: WebhookPayload): any {
  const emoji = EVENT_EMOJIS[payload.event] || '🔔'
  const title = EVENT_TITLES[payload.event] || payload.event
  const color = parseInt((EVENT_COLORS[payload.event] || '#27698a').replace('#', ''), 16)

  const fields: any[] = []
  for (const [key, value] of Object.entries(payload.data || {})) {
    if (value === null || value === undefined) continue
    const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    if (displayValue.length > 100) continue
    fields.push({
      name: key,
      value: displayValue,
      inline: displayValue.length < 30,
    })
  }

  return {
    username: 'DataSphere RH',
    embeds: [
      {
        title: `${emoji} ${title}`,
        color,
        fields: fields.slice(0, 25),
        footer: { text: `Module: ${payload.module}` },
        timestamp: payload.timestamp,
      },
    ],
  }
}

/**
 * Formate le payload pour Microsoft Teams (Adaptive Card simplifiée).
 */
export function formatForTeams(payload: WebhookPayload): any {
  const emoji = EVENT_EMOJIS[payload.event] || '🔔'
  const title = EVENT_TITLES[payload.event] || payload.event

  const facts: any[] = []
  for (const [key, value] of Object.entries(payload.data || {})) {
    if (value === null || value === undefined) continue
    const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    if (displayValue.length > 100) continue
    facts.push({ name: key, value: displayValue })
  }

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.2',
          body: [
            {
              type: 'TextBlock',
              text: `${emoji} ${title}`,
              size: 'Medium',
              weight: 'Bolder',
            },
            {
              type: 'TextBlock',
              text: `Module: ${payload.module} · ${new Date(payload.timestamp).toLocaleString('fr-FR')}`,
              isSubtle: true,
              spacing: 'Small',
            },
            ...(facts.length > 0 ? [{
              type: 'FactSet',
              facts: facts.slice(0, 10),
            }] : []),
          ],
        },
      },
    ],
  }
}

/**
 * Formate le payload selon le provider détecté.
 * Si generic, retourne le payload original.
 */
export function formatPayload(url: string, payload: WebhookPayload): any {
  const provider = detectProvider(url)
  switch (provider) {
    case 'slack': return formatForSlack(payload)
    case 'discord': return formatForDiscord(payload)
    case 'teams': return formatForTeams(payload)
    default: return payload
  }
}

/**
 * Retourne un label lisible du provider pour l'UI.
 */
export function getProviderLabel(url: string): string {
  const provider = detectProvider(url)
  const labels: Record<WebhookProvider, string> = {
    slack: 'Slack',
    discord: 'Discord',
    teams: 'Microsoft Teams',
    generic: 'Générique (JSON)',
  }
  return labels[provider]
}
