/**
 * Jiku's service worker.
 *
 * Deliberately small. The panel is a live view of an agenda that other people
 * are changing, so almost nothing here is worth serving from a cache: what this
 * buys is a real screen when the network drops, and static assets that do not
 * travel twice.
 */

// Bumped whenever this file changes. The old cache is deleted on activate, so a
// stale bundle cannot outlive a deploy — the previous version was pinned at
// "jiku-v1" forever and every entry it ever wrote stayed there.
const CACHE_NAME = "jiku-v2";

const OFFLINE_URL = "/sin-conexion";

// The PNG is not here on purpose: it exists for the PWA install icon, which the
// browser fetches once if someone installs the app. Precaching it made every
// first-time visitor download it whether or not they ever installed anything.
const PRECACHE = ["/jiku-logo.svg", OFFLINE_URL];

/** Static assets only. Anything else is either private or changes constantly. */
const CACHEABLE_ASSET = /\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?)$/;

/** Entries kept in the asset cache before the oldest are dropped. */
const MAX_ASSETS = 60;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Keeps the cache from growing without bound on a long-lived install. */
async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ASSETS) return;
  await Promise.all(keys.slice(0, keys.length - MAX_ASSETS).map((key) => cache.delete(key)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Only our own origin: a cross-origin response is not ours to cache.
  if (url.origin !== self.location.origin) return;

  // Never the API or the auth endpoints. Both are per-person and per-moment,
  // and a cached answer to either is a wrong answer.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate") {
    // Network-first, and the fallback is a page that explains itself rather
    // than the browser's error screen. Successful navigations are deliberately
    // NOT cached: the panel's HTML is personalised, and on a shared device a
    // cached copy is one person's agenda shown to the next.
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(OFFLINE_URL)) ?? Response.error();
      })
    );
    return;
  }

  if (CACHEABLE_ASSET.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Only a real, complete response. Caching an error or an opaque
            // partial is how a broken asset becomes permanent.
            if (response.ok && response.type === "basic") {
              const copy = response.clone();
              caches.open(CACHE_NAME).then(async (cache) => {
                await cache.put(request, copy);
                await trimCache(cache);
              });
            }
            return response;
          })
      )
    );
  }
});
