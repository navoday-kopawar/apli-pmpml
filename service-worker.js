const CACHE_NAME = 'apli-pmpml-v1.0.1786812306954';

const STATIC_ASSETS = [
  './',
  './index.html',
  './bus-ticket.html',
  './daily-pass.html',
  './help.html',
  './location.html',
  './notifications.html',
  './profile.html',
  './route-timetable.html',
  './search.html',
  './share.html',
  './show-all.html',
  './ticketBooking.html',
  './view-pass.html',
  './view-ticket.html',
  './offline.html',
  './styles.css',
  './bookingScript.js',
  './location-guard.js',
  './pwa-app.js',
  './manifest.json',
  './assets/PMPML-LOGO.png',
  './assets/Camera-icon.png',
  './assets/Female-icon.png',
  './assets/Info-icon.png',
  './assets/Location-icon.png',
  './assets/Male-icon.png',
  './assets/Mark-icon.png',
  './assets/Others-icon.png',
  './assets/PayUsing-icon.png',
  './assets/Setting-icon.png',
  './assets/amazon-icon.png',
  './assets/back-arrow-icon.png',
  './assets/bus-icon.png',
  './assets/bus-ticket-icon.png',
  './assets/buses-icon.png',
  './assets/chart-icon.png',
  './assets/complaints-icon.png',
  './assets/daily-pass-icon.png',
  './assets/direction-icon.png',
  './assets/edit-icon.png',
  './assets/filter-icon.png',
  './assets/gpay-icon.png',
  './assets/green-bus-icon.png',
  './assets/help-icon.png',
  './assets/home-icon.png',
  './assets/instagram-icon.png',
  './assets/location.png',
  './assets/metro-ticket-icon.png',
  './assets/my-location.png',
  './assets/myticket-icon.png',
  './assets/notification-icon.png',
  './assets/phonepay-icon.png',
  './assets/profile-icon.png',
  './assets/profile-name-icon.png',
  './assets/public-icon.png',
  './assets/rateus-icon.png',
  './assets/recent-location.png',
  './assets/route-timetable-icon.png',
  './assets/search-icon.png',
  './assets/shareapp-icon.png',
  './assets/validation-icon.png',
  './assets/view-pass-icon.png',
  './assets/view-ticket-icon.png',
  './assets/x-icon.png',
  './assets/youtube-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

// Real-time API endpoints or sensitive paths that MUST NOT be cached
const NETWORK_ONLY_PATTERNS = [
  /\/api\//i,
  /version\.json/i,
  /live-tracking/i,
  /bus-location/i,
  /booking-transaction/i,
  /payment/i,
  /auth/i,
  /login/i
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'no-cache' })).catch((err) => {
            console.warn(`[Service Worker] Failed to cache asset during install: ${url}`, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Purge old caches & claim all open clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Purging obsolete cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED', cacheName: CACHE_NAME });
        });
      });
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Bypass cache for real-time / sensitive API calls & version.json
  const url = new URL(request.url);
  const isNetworkOnly = NETWORK_ONLY_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isNetworkOnly) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests (HTML pages): Network-First with no-cache header & Offline fallback
  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
  if (isNavigation) {
    event.respondWith(
      fetch(new Request(request.url, { cache: 'no-cache' }))
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to offline page
            return caches.match('./offline.html');
          });
        })
    );
    return;
  }

  // Static Assets (CSS, JS, Images, Fonts): Cache-First with background revalidation
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Background update for freshness
        fetch(new Request(request.url, { cache: 'no-cache' })).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {/* Ignore background refresh failures when offline */});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          if (request.destination === 'image') {
            return caches.match('./assets/PMPML-LOGO.png');
          }
        });
    })
  );
});

// Handle Message Event (Skip Waiting)
self.addEventListener('message', (event) => {
  if (event.data && (event.data === 'SKIP_WAITING' || event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});
