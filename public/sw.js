// MPSC Sarathi Service Worker — Offline Mode
const CACHE_NAME = 'mpsc-sarathi-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // API calls — network only
  if (url.pathname.startsWith('/api/')) return;
  // Supabase — network only
  if (url.hostname.includes('supabase')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Cache questions from Supabase for offline use
self.addEventListener('message', e => {
  if (e.data?.type === 'CACHE_QUESTIONS') {
    caches.open(CACHE_NAME).then(cache => {
      e.data.urls?.forEach(url => fetch(url).then(r => cache.put(url, r)).catch(() => {}));
    });
  }
});
