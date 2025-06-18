const CACHE_NAME = "prod-valedoise-rh-app-v2"; // Update the version for cache invalidation
const ASSETS_TO_CACHE = [
  "/", // Home route
  "/icons/icon-192x192.png", // App icon
  "/icons/icon-512x512.png", // App icon
  "/icons/ios/*", // ALl iOS icons
  "/icons/android/*", // All Android icons
  "/icons/windows11/*", // All Windows 11 icons
  "/build/*", // Remix app build assets
  "/img/*", // Images
  "/manifest.json", // Web app manifest
];

// Routes that should never be cached
const NEVER_CACHE_ROUTES = [
  "/check",
  "/shared-auth-login"
];

// Install event - caches static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event - cleans up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper function to check if a URL contains any of the never-cache routes
function shouldNotCache(url) {
  return NEVER_CACHE_ROUTES.some(route => url.includes(route));
}

// Fetch event - intercept network requests
self.addEventListener("fetch", (event) => {
  console.log(`[Service Worker] Fetching: ${event.request.url}`);
  
  // Skip caching for specified routes
  if (shouldNotCache(event.request.url)) {
    console.log(`[Service Worker] Bypassing cache for: ${event.request.url}`);
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(`[Service Worker] Returning cached response for: ${event.request.url}`);
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache dynamic assets if they are not in the cache
          return caches.open(CACHE_NAME).then((cache) => {
            // Cache GET requests only
            if (event.request.method === "GET") {
              console.log(`[Service Worker] Caching new resource: ${event.request.url}`);
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch((error) => {
          console.error(`[Service Worker] Fetch failed for: ${event.request.url}`, error);
          // Optional: Return a fallback page or image if needed
        });
    })
  );
});
