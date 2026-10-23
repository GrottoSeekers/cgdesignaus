// Service worker for CG Design & Co. — makes the site installable and keeps
// it usable offline. Bump VERSION to drop old caches after a big release.
const VERSION = "v1";
const STATIC_CACHE = `cgd-static-${VERSION}`;
const RUNTIME_CACHE = `cgd-runtime-${VERSION}`;

// App shell: fetched and cached on install so the home page opens offline.
const PRECACHE = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/logo-full.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("cgd-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Never touch form submissions (Web3Forms) or other non-GET requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Pages: network-first so content is always fresh, cached copy when offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Hashed build assets, images and Google Fonts: serve fast from cache,
  // refresh in the background.
  if (sameOrigin || FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match("/")) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((response) => {
      // opaque (status 0) responses come from cross-origin font files.
      if (response.ok || response.type === "opaque") cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || network;
}
