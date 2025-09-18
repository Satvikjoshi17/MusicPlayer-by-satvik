// A basic service worker for caching static assets

const CACHE_NAME = 'satvik-music-v1-static';
const urlsToCache = [
  '/',
  '/offline.html',
  // Add other static assets here like CSS, JS bundles if they have stable names
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only care about GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use a network-first strategy with offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        // Not in cache, fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Optional: Clone and cache the new response for future use
            // Be careful what you cache here.
            return networkResponse;
          }
        );
      })
      .catch(() => {
        // If both cache and network fail (e.g., for an image),
        // you could return a placeholder image if you have one cached.
      })
  );
});
