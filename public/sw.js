/* Antibiotic Awareness — High-Speed Multi-Layer Cache Service Worker (v2).
   - App Shell & Navigations: Stale-While-Revalidate (opens in 0ms from cache while refreshing in background).
   - Hashed Build Assets (/assets/*): Cache-First Immutable (0ms disk load).
   - Google Fonts & Static Media (icons, images, audio): Cache-First with background refresh.
   - Never caches Firebase / Firestore / Auth / Gemini API requests (handled by Firestore IndexedDB cache). */

const CACHE_PREFIX = 'aa-speed-cache-';
const STATIC_CACHE = CACHE_PREFIX + 'static-v2';
const SHELL_CACHE = CACHE_PREFIX + 'shell-v2';
const MEDIA_FONT_CACHE = CACHE_PREFIX + 'media-fonts-v2';
const ACTIVE_CACHES = [STATIC_CACHE, SHELL_CACHE, MEDIA_FONT_CACHE];

const OFFLINE_URL = './offline.html';
const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './favicon.svg',
  './favicon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(new Request(u, { cache: 'reload' }))))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) =>
                (k.startsWith(CACHE_PREFIX) || k.startsWith('aa-static-')) &&
                !ACTIVE_CACHES.includes(k)
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Google Fonts (fonts.gstatic.com & fonts.googleapis.com): Cache-First / Stale-While-Revalidate
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.open(MEDIA_FONT_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const networkFetch = fetch(req)
            .then((res) => {
              if (res && res.status === 200) {
                cache.put(req, res.clone());
              }
              return res;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Never intercept cross-origin APIs (Firebase, Firestore, Auth, Google Translate, Gemini)
  if (url.origin !== self.location.origin) return;

  // 2. Page Navigations (index.html / App Shell): Stale-While-Revalidate for instant 0ms startup
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then((cache) =>
        cache.match('./index.html').then((cachedShell) => {
          const networkPromise = fetch(req)
            .then((res) => {
              if (res && res.status === 200 && res.type === 'basic') {
                cache.put('./index.html', res.clone());
              }
              return res;
            })
            .catch(() => cachedShell || cache.match(OFFLINE_URL));

          // Return cached shell immediately if available while updating cache in background
          return cachedShell || networkPromise;
        })
      )
    );
    return;
  }

  const scopePath = new URL(self.registration.scope).pathname;

  // 3. Content-Hashed Build Assets (/assets/*): Cache-First (Immutable)
  if (url.pathname.startsWith(scopePath + 'assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res && res.status === 200 && res.type === 'basic') {
                cache.put(req, res.clone());
              }
              return res;
            })
        )
      )
    );
    return;
  }

  // 4. Same-Origin Icons, Images, Audio & Manifest: Stale-While-Revalidate
  if (/\.(png|svg|ico|jpg|jpeg|webp|wav|mp3|webmanifest)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_FONT_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const fetchPromise = fetch(req)
            .then((res) => {
              if (res && res.status === 200 && res.type === 'basic') {
                cache.put(req, res.clone());
              }
              return res;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
  }
});
