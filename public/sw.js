/* FlipCheck service worker — minimal, safe.
 * Precaches the app shell + icons; network-first for pages (never serve a stale scan),
 * cache-first for static assets. Required for installability; NEVER caches /api/. */
const CACHE = 'fc-v1';
const SHELL = ['/scan', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // never cache scans/joins

  // Static assets: cache-first
  if (/\.(png|ico|webmanifest|svg|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Pages: network-first, fall back to cached shell when offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && url.pathname === '/scan') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('/scan')))
  );
});
