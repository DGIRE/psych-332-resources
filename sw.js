// Service Worker for PSYCH 332 - Offline Access
// Cache-first strategy for HTML/CSS/JSON, Network-first for external resources

const CACHE_NAME = 'psych332-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/this-week.html',
  '/calendar.html',
  '/syllabus.html',
  '/general-information.html',
  '/module1-practicum.html',
  '/module1-tutorials.html',
  '/references-and-reading.html',
  '/hierarchical-clustering-explained.html',
  '/pca-explained.html',
  '/umap-explained.html',
  '/zscore-explained.html',
  '/Practicum1-Preparation.html',
  '/Practicum1-Analysis.html',
  '/PSYCH-332-Brain-Explorer_v1-3.html',
  '/offline.html',
  // Brain Explorer data
  '/Data/brain_structures_key.json',
  '/Data/labeled_brain_map.json',
  '/Data/metadata.json',
  '/Data/region_id_map.json',
  // Google Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install event: Cache all specified resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch((err) => {
        console.error('Cache installation failed:', err);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Implement cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Cache-first strategy for HTML, CSS, and JSON (local resources)
  if (request.destination === 'document' || request.destination === 'style' ||
      url.pathname.endsWith('.html') || url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
              return response;
            });
        })
        .catch(() => {
          return caches.match('/offline.html')
            .catch(() => {
              return new Response('You are offline. Please check your connection.');
            });
        })
    );
  }

  // Network-first strategy for external resources (fonts, images, etc.)
  else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .catch(() => {
              return new Response('Resource unavailable offline.');
            });
        })
    );
  }
});
