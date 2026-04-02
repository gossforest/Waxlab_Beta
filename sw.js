// WaxLab Service Worker
// Strategy:
//   App shell (index.html, config.js, icons) — cache-first, update in background
//   Netlify functions / API calls — network-only (never cache)
//   Everything else — network-first with cache fallback

const CACHE_VERSION = 'waxlab-v1';
const SHELL_ASSETS  = ['/', '/index.html', '/config.js', '/manifest.json',
                        '/icons/icon-192.png', '/icons/icon-512.png'];

// ── Install: pre-cache the app shell ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: routing logic ───────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept: Netlify functions, Supabase, Anthropic, external APIs
  if (url.pathname.startsWith('/.netlify/functions/') ||
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('anthropic.com') ||
      url.hostname.includes('open-meteo.com') ||
      url.hostname.includes('nominatim.openstreetmap.org') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    return; // fall through to network
  }

  // App shell assets — cache-first
  if (SHELL_ASSETS.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          // Return cached immediately, then update in background
          const networkFetch = fetch(event.request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_VERSION)
                  .then(cache => cache.put(event.request, response.clone()));
              }
              return response;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
    );
    return;
  }

  // Everything else — network-first, cache as fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && event.request.method === 'GET') {
          caches.open(CACHE_VERSION)
            .then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
