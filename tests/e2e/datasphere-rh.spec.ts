import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test('Page d\'accueil se charge', async ({ page }) => {
  await page.goto(BASE_URL)
  await expect(page).toHaveTitle(/DataSphere RH/)
})

test('PWA manifest accessible', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/manifest.json`)
  expect(response.ok()).toBeTruthy()
  const manifest = await response.json()
  expect(manifest.name).toBe('DataSphere RH')
})

test('PWA service worker accessible', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/sw.js`)
  expect(response.ok()).toBeTruthy()
  const content = await response.text()
  expect(content).toContain('install')
  expect(content).toContain('push')
})

test('API health check', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/healthz`)
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.status).toBe('healthy')
})

test('API metrics Prometheus', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/metrics`)
  expect(response.status()).toBeLessThan(500)
})

test('API security audit', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/api/security-audit`)
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.score).toBeGreaterThan(0)
  expect(data.grade).toMatch(/^[A-D]$/)
})

test('API v1 sans clé → 401 ou 404', async ({ request }) => {
  const response = await request.post(`${BASE_URL}/api/v1/llm/chat`, {
    data: { messages: [{ role: 'user', content: 'test' }] },
  })
  expect([401, 404]).toContain(response.status())
})
