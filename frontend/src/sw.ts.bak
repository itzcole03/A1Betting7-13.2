// If needed, import types from './types/serviceWorker.d.ts'

/**
 * Service Worker - 2025 Best Practices
 *
 * Advanced caching strategies without external dependencies:
 * - Precaching for shell assets
 * - Network-first for API calls
 * - Cache-first for static assets
 * - Stale-while-revalidate for images
 */

const CACHE_NAME = 'a1betting-v1';
const STATIC_CACHE = 'a1betting-static-v1';
const API_CACHE = 'a1betting-api-v1';
const IMAGE_CACHE = 'a1betting-images-v1';

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Type assertion for service worker context
const sw = self as unknown as ServiceWorkerGlobalScope;

// Install event - precache assets
sw.addEventListener('install', (event: ExtendableEvent) => {
  // console.log('[ServiceWorker] Installing with 2025 best practices');

  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );

  sw.skipWaiting();
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event: ExtendableEvent) => {
  // console.log('[ServiceWorker] Activating');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== IMAGE_CACHE
            ) {
              // console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            } else {
              return Promise.resolve(undefined);
            }
          })
        );
      })
      .then(() => {
        return sw.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
sw.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API routes - Network first with cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/mlb/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Images - Stale while revalidate
  if (request.destination === 'image') {
    event.respondWith(staleWhileRevalidateStrategy(request, IMAGE_CACHE));
    return;
  }

  // Static assets - Cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // HTML documents - Network first with cache fallback
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
    return;
  }
});

// Network first strategy
async function networkFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    // Try network first with timeout
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      ),
    ]);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // console.log('[ServiceWorker] Serving from cache:', request.url);
      return cachedResponse;
    }

    // Return generic error response
    return new Response('Network error and no cache available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Cache first strategy
async function cacheFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(cacheName).then(cache => {
            cache.put(request, response);
          });
        }
      })
      .catch(() => {
        // Ignore background update errors
      });

    return cachedResponse;
  }

  // Fetch and cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Asset not available', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidateStrategy(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cachedResponse = await caches.match(request);

  // Always try to update cache in background
  fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(cacheName).then(cache => {
          cache.put(request, response.clone());
        });
      }
    })
    .catch(() => {
      // Ignore update errors
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network if no cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Image not available', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

// Background sync for offline analytics
sw.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncOfflineAnalytics());
  }
});

async function syncOfflineAnalytics(): Promise<void> {
  try {
    // This would sync any offline analytics data
    // console.log('[ServiceWorker] Syncing offline analytics data');
  } catch (error) {
    // console.log('[ServiceWorker] Analytics sync failed:', error);
  }
}

// Handle push notifications
sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions = {
    body: data.body || 'New betting opportunity available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(sw.registration.showNotification(data.title || 'A1Betting', options));
});

// Handle notification clicks
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'view') {
    const url = event.notification.data?.url || '/';
    event.waitUntil(sw.clients.openWindow(url));
  }
});

// Handle messages from main thread
sw.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    sw.skipWaiting();
  }
});

// console.log('[ServiceWorker] A1Betting Service Worker loaded with 2025 best practices');
