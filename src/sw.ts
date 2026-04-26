/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute
} from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api/]
  })
)

registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

registerRoute(
  /^https:\/\/www\.gstatic\.com\/firebasejs\/.*/i,
  new CacheFirst({
    cacheName: 'firebase-sdk-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 30
      }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
)

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

onBackgroundMessage(messaging, (payload) => {
  const title = payload.data?.title ?? 'ConcertHub'
  const body = payload.data?.body ?? ''
  const concertId = payload.data?.concertId ?? ''

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { concertId },
    tag: concertId || undefined
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const concertId =
    (event.notification.data as { concertId?: string } | undefined)
      ?.concertId ?? ''
  const targetPath = concertId ? `/concert/${concertId}` : '/'
  const targetUrl = new URL(targetPath, self.location.origin).href

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      })

      const existing = allClients.find((c) => 'focus' in c)
      if (existing) {
        await existing.focus()
        if ('navigate' in existing) {
          try {
            await existing.navigate(targetUrl)
          } catch {
            /* some browsers reject cross-origin-ish navigate calls */
          }
        }
        return
      }

      await self.clients.openWindow(targetUrl)
    })()
  )
})

self.addEventListener('message', (event) => {
  const data = event.data as { type?: string } | undefined
  if (data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
