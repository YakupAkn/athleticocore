const CACHE_NAME = 'athletico-v2.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './coach.html', 
  './stats.html',
  './profile.html',
  './ayarlar.html',
  './assets/icons/ac.png'
  './js/app.js',
  './js/coach.js',
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Önbellekleniyor...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co')) {
    return; 
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});