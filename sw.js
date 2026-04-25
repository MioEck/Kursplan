var CACHE = 'kursplan-v21';
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']);
    }).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).then(function(r) {
      var clone = r.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
      return r;
    }).catch(function() {
      return caches.match(e.request).then(function(c){ return c || caches.match('/index.html'); });
    })
  );
});
