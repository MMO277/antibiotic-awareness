/* Antibiotic Awareness — minimal, privacy-safe service worker.
   - Caches ONLY same-origin, static, content-hashed build assets (/assets/*) and offline.html.
   - Never touches Firebase / Firestore / Auth / any cross-origin request.
   - Never caches HTML pages (index.html is always fetched fresh), so no user data or stale app shell is stored. */
const CACHE_PREFIX = 'aa-static-'; // every cache owned by this app starts with this prefix
const CACHE = CACHE_PREFIX + 'v1';
const OFFLINE_URL = './offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(OFFLINE_URL)));
  // No skipWaiting(): a new version activates only after the app is closed (avoids mid-session breakage).
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, Google Fonts, APIs: untouched

  // Page navigations: network only; show generic offline page if the network fails.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.open(CACHE).then((c) => c.match(OFFLINE_URL))));
    return;
  }

  // Static hashed build assets only: cache-first.
  const scopePath = new URL(self.registration.scope).pathname;
  if (url.pathname.startsWith(scopePath + 'assets/')) {
    event.respondWith(
      caches.open(CACHE).then((c) => c.match(req)).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }))
    );
  }
  // Everything else: default browser behavior.
});
