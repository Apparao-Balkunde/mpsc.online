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

// ── Push Notification Handler ──────────────────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: '🎯 MPSC Sarathi', body: 'आजचा अभ्यास सुरू करा! 📚', icon: '/icon128.png' };
  try { if (e.data) data = { ...data, ...e.data.json() }; } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:  data.body,
      icon:  data.icon  || '/icon128.png',
      badge: '/icon72.png',
      vibrate: [200, 100, 200],
      data:  { url: data.url || '/' },
      actions: [
        { action: 'open',    title: '📚 अभ्यास करा' },
        { action: 'dismiss', title: '⏰ नंतर' },
      ],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});

// ── Schedule-based reminder (localStorage-based fallback) ──────────────────
self.addEventListener('message', e => {
  if (e.data?.type === 'CACHE_QUESTIONS') {
    caches.open('mpsc-sarathi-v1').then(cache => {
      (e.data.urls || []).forEach(url => fetch(url).then(r => cache.put(url, r)).catch(() => {}));
    });
  }
  if (e.data?.type === 'SCHEDULE_REMINDER') {
    // Store reminder time for background sync (best-effort)
    self._reminderTime = e.data.time;
  }
});
