// HomeFix AI — Service Worker
// Strategy:
//   - App shell (pages, fonts, icons): Cache-first → fast loads, works offline
//   - API routes (/api/*): Network-first → always fresh data, fallback to cache
//   - Supabase/external: Network-only → never cache auth or DB calls

const CACHE_VERSION = 'homefix-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE   = `${CACHE_VERSION}-api`;

// App shell resources to pre-cache on install
const SHELL_URLS = [
  '/',
  '/dashboard',
  '/cases/new',
  '/login',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/manifest.json',
];

// ── Install: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      // addAll fails silently per resource — don't block install on a miss
      return Promise.allSettled(SHELL_URLS.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(k => k.startsWith('homefix-') && k !== SHELL_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route-based caching strategy ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests (Supabase, Anthropic, etc.)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API routes: network-first, short cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Next.js static chunks (_next/static): cache-first, long-lived
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // App pages: stale-while-revalidate — show cached instantly, update in bg
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? offlineFallback();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached ?? (await fetchPromise) ?? offlineFallback();
}

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>HomeFix AI — Offline</title>
    <style>
      body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;
           align-items:center;justify-content:center;min-height:100vh;margin:0;
           background:#F4F7FB;color:#1E293B;text-align:center;padding:2rem}
      h1{font-size:2rem;margin-bottom:.5rem}
      p{color:#64748B;margin-bottom:2rem}
      button{background:#1E2761;color:white;border:none;padding:.75rem 2rem;
             border-radius:.5rem;font-size:1rem;cursor:pointer}
    </style></head>
    <body>
      <div style="font-size:4rem">🏠</div>
      <h1>You're offline</h1>
      <p>HomeFix AI needs a connection to triage issues and dispatch vendors.</p>
      <button onclick="window.location.reload()">Try Again</button>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// ── Push Notifications (future-ready) ────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'HomeFix AI', {
      body: data.body ?? '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag ?? 'homefix',
      data: { url: data.url ?? '/dashboard' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url ?? '/dashboard')
  );
});
