const CACHE_NAME = 'melodystream-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('PWA: Some assets failed to pre-cache during install', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Let audio range requests, external APIs, and hot-reload/websocket requests bypass the service worker entirely
  if (
    url.includes('/audio/') || 
    url.includes('.mp3') || 
    url.includes('itunes.apple.com') ||
    url.includes('googleapis.com') ||
    url.includes('/api/') ||
    url.includes('localhost') ||
    url.includes('127.0.0.1')
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Dynamic stale-while-revalidate update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => { /* Offline fallback */ });
        return cachedResponse;
      }
      
      // Not in cache, fetch from network and cache it dynamically if same-origin and successful
      return fetch(event.request).then((networkResponse) => {
        // Only cache valid GET responses from the same origin to avoid caching opaque third-party scripts or errors
        if (
          networkResponse && 
          networkResponse.status === 200 && 
          networkResponse.type === 'basic' &&
          event.request.method === 'GET'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      // Return offline index.html shell for page-level navigation failures
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});
