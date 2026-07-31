const CACHE='kims-margin-v2';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const isHTML=e.request.mode==='navigate'||e.request.destination==='document'||e.request.destination==='';
  const req=isHTML?new Request(e.request.url,{cache:'reload',credentials:'same-origin'}):e.request;
  e.respondWith(
    fetch(req).then(r=>{
      const cp=r.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp));
      return r;
    }).catch(()=>caches.match(e.request))
  );
});
