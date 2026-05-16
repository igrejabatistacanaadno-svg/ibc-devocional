/**
 * IBC Devocional — Service Worker
 * Estratégia: Cache First para assets estáticos, Network First para API
 */

const CACHE_NAME = 'ibc-devocional-v1'
const OFFLINE_URL = '/offline.html'

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  )
  self.skipWaiting()
})

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and chrome-extension
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  // Supabase/API calls — Network First
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  // Audio/storage files — Cache First
  if (url.pathname.includes('/storage/') || url.pathname.match(/\.(mp3|wav|webm|ogg)$/)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
        })
      )
    )
    return
  }

  // App shell / static assets — Stale While Revalidate
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const fetchPromise = fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone())
          return response
        }).catch(() => cached || new Response('Sem conexão', { status: 503 }))
        return cached || fetchPromise
      })
    )
  )
})

// ─── Push Notifications ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Nova devocional disponível', body: 'A devocional de hoje já está disponível no app da IBC.', devotionalId: null }

  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'ibc-devotional',
      renotify: true,
      data: { devotionalId: data.devotionalId, url: data.devotionalId ? `/app/devocional/${data.devotionalId}` : '/app' },
      actions: [
        { action: 'open', title: 'Abrir devocional' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    })
  )
})

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url ?? '/app'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl)
    })
  )
})
