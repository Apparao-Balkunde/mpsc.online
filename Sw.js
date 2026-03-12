// MPSC सारथी Service Worker
const CACHE_NAME = 'mpsc-sarathi-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Static assets: Cache First
// - Supabase API: Network First, fallback cache
// - Everything else: Network First
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isSupabase = url.hostname.includes('supabase');
  const isStatic = e.request.destination === 'script' || e.request.destination === 'style' || e.request.destination === 'font';

  if (isStatic) {
    // Cache First for JS/CSS/fonts
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }))
    );
    return;
  }

  if (isSupabase) {
    // Network First for API — offline fallback
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request) || new Response(
          JSON.stringify({ error: 'Offline — कृपया internet connection तपासा' }),
          { headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // Default: Network First
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Background sync for offline bookmarks
self.addEventListener('sync', e => {
  if (e.tag === 'sync-bookmarks') {
    console.log('[SW] Background sync: bookmarks');
  }
});
