// Development service worker — production uses the generated version from vite.config.ts
const CACHE_NAME = 'sprint-dev';
const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((r) => r.ok ? cache.put(url, r) : null)
            .catch(() => null)
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';
  const isAsset = url.pathname.startsWith('/assets/');

  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((r) => {
          if (r.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone()));
          return r;
        });
      })
    );
    return;
  }

  if (isNavigation) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const net = fetch(event.request)
          .then((r) => {
            if (r.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone()));
            return r;
          })
          .catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((r) => {
        if (r.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, r.clone()));
        return r;
      })
      .catch(() => caches.match(event.request))
  );
});
