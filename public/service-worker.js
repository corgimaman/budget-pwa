const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
  '/',
  'db.js',
  'index.js',
  'index.html',
  'styles.css'
];

// install
self.addEventListener("install", function (evt) {
    // pre cache budget data
    evt.waitUntil(
      caches.open(DATA_CACHE_NAME).then((cache) => cache.add("/api/transaction"))
      );
      
    // pre cache all static assets
    evt.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );
  
    // tell the browser to activate this service worker immediately once it
    // has finished installing
    self.skipWaiting();
});


// activate service worker and remove old data from cache
self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
});

// handle requests
self.addEventListener('fetch', function(evt) {
    if (evt.request.url.includes('/api')) {
        console.log('[Service Worker] Fetch (data)', evt.request.url);

        evt.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request).then(res => {
                    if(res.status === 200) {
                        cache.put(evt.request.url, res.clone());
                    }
                    return res;
                }).catch(err => {
                    console.log(err);
                    return cache.match(evt.request);
                })
            })
        );
        return;
    }
    // serve files from cache
    evt.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(evt.request).then(res => {
                return res || fetch(evt.request);
            })
        })
    );
});