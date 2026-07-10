// DataSphere RH — Service Worker (PWA)
const CACHE_VERSION = 'datasphere-rh-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(['/', '/manifest.json'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (!url.origin.includes(self.location.origin)) return

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((r) => { const c = r.clone(); caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, c)); return r }).catch(() => caches.match(event.request)))
    return
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icon-')) {
    event.respondWith(caches.match(event.request).then((c) => c || fetch(event.request).then((r) => { const c2 = r.clone(); caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, c2)); return r })))
    return
  }
})

self.addEventListener('push', (event) => {
  let data = { title: 'DataSphere RH', body: 'Notification' }
  try { data = JSON.parse(event.data.text()) } catch {}
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: '/icon-192.png', data: { url: data.url || '/' } }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then((clients) => {
    for (const client of clients) { if ('focus' in client) return client.focus() }
    if (self.clients.openWindow) return self.clients.openWindow(event.notification.data.url || '/')
  }))
})
