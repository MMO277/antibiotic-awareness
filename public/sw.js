/* Antibiotic Awareness — Ultra-Fast Full Offline Service Worker (v3).
   - Automatically reads ./precache-manifest.json generated at build time and caches 100% of
     compiled JS & CSS chunks so EVERY clinical tool, page, drug directory, dose tracker, and
     assistant opens in 0ms offline (Airplane Mode) even if never visited before.
   - App Shell & Navigations: Stale-While-Revalidate (opens in 0ms from cache while refreshing in background).
   - Hashed Build Assets (/assets/*): Cache-First Immutable (0ms disk load).
   - Google Fonts & Static Media (icons, images, audio): Cache-First with background refresh. */

const CACHE_PREFIX = 'aa-speed-cache-';
const STATIC_CACHE = CACHE_PREFIX + 'static-v3';
const SHELL_CACHE = CACHE_PREFIX + 'shell-v3';
const MEDIA_FONT_CACHE = CACHE_PREFIX + 'media-fonts-v3';
const ACTIVE_CACHES = [STATIC_CACHE, SHELL_CACHE, MEDIA_FONT_CACHE];

const OFFLINE_URL = './offline.html';
const PRECACHE_SHELL_URLS = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './favicon.svg',
  './favicon-192.png',
  './favicon-48.png',
  './apple-touch-icon.png',
];

async function warmupFromPrecacheManifest() {
  try {
    const res = await fetch('./precache-manifest.json', { cache: 'no-store' });
    if (!res || !res.ok) return;
    const manifest = await res.json();
    const staticCache = await caches.open(STATIC_CACHE);

    const coreAssets = Array.isArray(manifest.coreAssets) ? manifest.coreAssets : [];
    // Batch-cache all core clinical JS & CSS chunks for instant 0ms offline navigation
    await Promise.allSettled(
      coreAssets.map(async (assetUrl) => {
        const existing = await staticCache.match(assetUrl);
        if (!existing) {
          const assetRes = await fetch(assetUrl, { cache: 'force-cache' });
          if (assetRes && assetRes.ok) {
            await staticCache.put(assetUrl, assetRes);
          }
        }
      })
    );

    // Then warm up 3D game chunks in low-priority background pass
    const deferred3D = Array.isArray(manifest.deferred3DAssets) ? manifest.deferred3DAssets : [];
    for (const assetUrl of deferred3D) {
      try {
        const existing = await staticCache.match(assetUrl);
        if (!existing) {
          const assetRes = await fetch(assetUrl, { cache: 'force-cache' });
          if (assetRes && assetRes.ok) {
            await staticCache.put(assetUrl, assetRes);
          }
        }
      } catch {
        /* ignore offline during background warmup */
      }
    }
  } catch {
    /* ignore if offline during install */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_SHELL_URLS.map((u) => cache.add(new Request(u, { cache: 'reload' })))
        )
      )
      .then(() => warmupFromPrecacheManifest())
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
      .then(() => warmupFromPrecacheManifest())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WARMUP_OFFLINE_CACHE') {
    event.waitUntil(warmupFromPrecacheManifest());
  }
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

  // Never intercept cross-origin APIs or live version check manifests
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("app-version.json") || url.pathname.endsWith("precache-manifest.json")) return;

  // 2. Page Navigations (index.html / App Shell): Stale-While-Revalidate for instant 0ms offline startup
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cachedShell =
          (await cache.match('./index.html')) ||
          (await cache.match('./')) ||
          (await caches.match('./index.html'));

        const networkPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200 && res.type === 'basic') {
              cache.put('./index.html', res.clone());
            }
            return res;
          })
          .catch(async () => {
            return cachedShell || (await cache.match(OFFLINE_URL));
          });

        return cachedShell || networkPromise;
      })
    );
    return;
  }

  // 3. Content-Hashed Build Assets (/assets/* or *.js / *.css): Cache-First (0ms disk load)
  if (url.pathname.includes('/assets/') || /\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit =
          (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
        if (hit) return hit;

        try {
          const res = await fetch(req);
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(req, res.clone());
          }
          return res;
        } catch (err) {
          const fallbackHit = await caches.match(req, { ignoreSearch: true });
          if (fallbackHit) return fallbackHit;
          throw err;
        }
      })
    );
    return;
  }

  // 4. Same-Origin Icons, Images, Audio & Manifest: Stale-While-Revalidate
  if (/\.(png|svg|ico|jpg|jpeg|webp|wav|mp3|webmanifest|json)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(MEDIA_FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
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
    );
  }
});
