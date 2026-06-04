const CACHE = "healthbook-v1"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
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
