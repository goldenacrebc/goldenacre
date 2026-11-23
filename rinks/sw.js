const CACHE_NAME = 'goldenacre-rinks-v1';
const ASSETS = [
  '/rinks/',
  '/rinks/index.html',
  '/rinks/manifest.json',
  '/rinks/rinks-booking-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Always go to network for Supabase API calls
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
