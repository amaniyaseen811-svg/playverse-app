/*  PlayVerse Service Worker
    ----------------------------------
    Strategy:
      - On install: pre-cache the "app shell" (menu + icons + manifest)
      - On fetch:   cache-first, then network; successful responses are
                    added to the runtime cache automatically.
      - This means when Amani adds new game files (e.g. smurfs.html),
        she just uploads them to the repo + adds a tile in index.html.
        They get cached the first time the student opens them online,
        and are available offline afterwards.
      - Bump CACHE_VERSION whenever you change the shell or want to
        force all clients to refresh.
*/

const CACHE_VERSION = 'playverse-v6';
const RUNTIME_CACHE = 'playverse-runtime-v6';

// Files to pre-cache on install (the app shell)
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  // ألعاب نُونا وسالي — تتحمّل كاملة من أول مرة حتى تشتغل بدون إنترنت
  './pvkit.js', './universal-game-system.js',
  './noona.html', './noona-translations.js', './noona-cover.jpg', './noona-intro.mp4', './noona-music.mp3',
  './noona-cover1.mp4', './noona-cover2.mp4', './noona-cover3.mp4',
  './sally.html', './sally-translations.js', './sally_intro.mp4',
  './sally-cover-1.mp4', './sally-cover-2.mp4', './sally-cover-3.mp4', './sally-cover-4.mp4',
  // خليج الأبطال وقرية الوئام
  './khaleej_alabtal.html', './khaleej-alabtal-translations.js', './khaleej-cover.jpg', './khaleej-cover-1.mp4',
  './wiam.html', './wiam-cover.jpg', './wiam-cover.mp4'
];

// --- install: pre-cache shell ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// --- activate: clean up old caches ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// --- fetch: cache-first, network fallback, runtime caching ---
self.addEventListener('fetch', event => {
  const request = event.request;

  // Only handle GET requests from our own origin
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        // Only cache valid basic responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Clone — response body can only be consumed once
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        // Offline + not cached — for navigations, return the cached menu
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
