// Offline support. Network first, so a new release shows up right away; the cache when offline.
// tools/build.mjs stamps CACHE with the build, so each release starts a fresh cache.
importScripts('/shared/drills.js');

const CACHE = 'music-academy-dev';
const SHARED = ['edition', 'theory', 'glyphs', 'staff', 'audio', 'input', 'keyboard', 'ui', 'chordinput', 'drills'].map(f => `/shared/${f}.js`);
const CORE = [
  '/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png',
  '/shared/app.css', ...SHARED,
  ...self.DRILLS.map(d => '/' + d.path),
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // one by one, so one missing file doesn't stop the install
    await Promise.all(CORE.map(url => cache.add(new Request(url, { cache: 'no-cache' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match(url.pathname.endsWith('/') ? url.pathname : url.pathname + '/')) || (await cache.match('/'));
      throw e;
    }
  })());
});
