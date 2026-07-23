// Backbrain service worker — offline caching for the games/tools portal.
//
// Network-first for HTML so pages are never served stale; cache-first (with a
// background refresh) for same-origin static assets so they load instantly and
// keep working offline. Cross-origin requests — Font Awesome, Google Fonts, the
// Firebase SDK, and the external game sites the cards open — are never touched;
// they always go straight to the network.
//
// Dev note: because static assets are served from cache first, editing a CSS/JS
// file locally can show one reload behind (the background refresh picks it up on
// the *next* load). Hard-reload, or unregister this worker under DevTools >
// Application > Service Workers, while actively editing.
const CACHE = "backbrain-v1";

// Small app shell precached on install, so the site opens offline even on the
// first visit to a not-yet-cached page. Everything else is cached lazily as
// it's fetched. Paths are relative to this worker's scope (the site root).
const CORE = [
  "index.html",
  "Games.html",
  "manifest.webmanifest",
  "code/CSS/shared.css",
  "code/CSS/cards.css",
  "code/CSS/tools.css",
  "code/CSS/games.css",
  "code/General%20Code/sidebar.js",
  "images/logo.png",
  "images/app-icon.svg",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      // addAll() would fail the whole install if any single file 404s; caching
      // each individually and swallowing misses keeps one renamed/removed file
      // from breaking the entire worker.
      .then(cache => Promise.all(CORE.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only ever touch our own origin.
  if (url.origin !== self.location.origin) return;

  const isHTML = req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // Network-first: newest page when online, cache (then the cached homepage)
    // as the offline fallback.
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match("index.html")))
    );
    return;
  }

  // Cache-first with background refresh (stale-while-revalidate) for assets.
  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(cache => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
