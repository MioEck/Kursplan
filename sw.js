const CACHE='kp-v118';
const STATIC=['/Kursplan/manifest.json','/Kursplan/icon-192.png','/Kursplan/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)));});
self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // HTML immer frisch aus dem Netz (neueste App-Version) – bei Offline: Cache-Fallback
  if(u.pathname.endsWith('/')||u.pathname.endsWith('.html')){
    e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
    return;
  }
  // Fahrplandaten: network-first mit Cache-Fallback (wie HTML)
  if(u.pathname.endsWith('kursplan-data.json')){
    e.respondWith(fetch(e.request).then(function(r){var c=r.clone();caches.open(CACHE).then(function(cache){cache.put(e.request,c);});return r;}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
