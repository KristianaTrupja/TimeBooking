/* eslint-disable no-restricted-globals */
const CACHE_NAME = "worktime-pwa-v2";
const APP_SHELL = ["/", "/login", "/offline", "/manifest.json", "/offline.html", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiRequest = isSameOrigin && url.pathname.startsWith("/api/");

  // Never cache API responses (especially auth/session endpoints).
  if (isApiRequest) return;

  // Documents: network-first so auth/pages stay fresh; fallback to offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isSameOrigin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (await caches.match("/offline")) || caches.match("/offline.html");
        })
    );
    return;
  }

  // Same-origin assets/API: stale-while-revalidate.
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
});
