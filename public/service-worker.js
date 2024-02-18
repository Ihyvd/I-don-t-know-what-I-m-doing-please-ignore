/**
 * Service Worker lifecycle events and caching.
 */

// Cache name for versioning
const CACHE_NAME = 'site-static-v1';
// Assets to cache (add to the list of assets to cache, for now this is fine)
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/scripts.js',
    '/images/logo.png',
    // Add more assets as needed
];

// Install event - caches assets
self.addEventListener('install', event => {
    console.log('Service Worker installing.');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker caching assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Fetch event - serves assets from cache or fetches from network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // Serve from cache
                    return response;
                }
                // Fetch from network
                return fetch(event.request).then(fetchResponse => {
                    // Optional: cache the fetched response(?)
                    if(!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }

                    // Clone the response because request is a stream and can be consumed only once
                    const responseToCache = fetchResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return fetchResponse;
                });
            })
    );
});

// Activate event - cleans up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating.');
    const cacheWhitelist = [CACHE_NAME]; // List of cache names to keep
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Delete old versions of caches
                        console.log('Service Worker deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
