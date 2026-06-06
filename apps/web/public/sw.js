const CACHE = "healthbook-v2"
const API_CACHE = "healthbook-api-v2"
const STATIC_CACHE = "healthbook-static-v2"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => ![CACHE, API_CACHE, STATIC_CACHE].includes(k)).map((k) => caches.delete(k)),
      ),
    ),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return

  const url = new URL(event.request.url)

  // Network-first for API calls: try network, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request)
          if (response.status === 200) cache.put(event.request, response.clone())
          return response
        } catch {
          const cached = await cache.match(event.request)
          return cached || new Response(JSON.stringify({ success: false, message: "Offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
        }
      }),
    )
    return
  }

  // Cache-first for static assets (images, fonts, icons)
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|css|js)$/i) ||
    url.origin === self.location.origin
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const response = await fetch(event.request)
        if (response.status === 200) cache.put(event.request, response.clone())
        return response
      }),
    )
    return
  }
})

self.addEventListener("push", (event) => {
  let data = { title: "HealthBook", body: "", url: "/feed" }
  try {
    data = event.data?.json() ?? data
  } catch {}

  const { title, body, url } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: { url },
      vibrate: [200, 100, 200],
      tag: "healthbook-notification",
      renotify: true,
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/feed"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url) {
          client.focus()
          return
        }
      }
      return clients.openWindow(url)
    }),
  )
})
