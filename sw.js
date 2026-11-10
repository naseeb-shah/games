/* MindSpark service worker: offline play + fast repeat loads */
const CACHE = 'mindspark-v1';
const ASSETS = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/core.js', 'js/app.js', 'js/tutorials.js',
  'js/games/dot.js', 'js/games/water.js', 'js/games/plumber.js', 'js/games/connect.js', 'js/games/onestroke.js',
  'js/games/pattern.js', 'js/games/quicksearch.js', 'js/games/leftright.js', 'js/games/focus.js',
  'icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// network first (always fresh when online), fall back to cache when offline
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))),
  );
});
