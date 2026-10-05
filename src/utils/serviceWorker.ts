export function generateServiceWorker(cacheName:string, assets:string[], offline:boolean):string {
  return `const CACHE_NAME=${JSON.stringify(cacheName)};
const ASSETS=${JSON.stringify(assets)};
const OFFLINE=${JSON.stringify(offline)};
const PATHS=new Set(ASSETS.map(path=>new URL(path,self.registration.scope).pathname));
self.addEventListener('install',event=>{event.waitUntil((OFFLINE?caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)):Promise.resolve()).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith('appify-pwa-')&&name!==CACHE_NAME).map(name=>caches.delete(name)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!PATHS.has(url.pathname))return;
  event.respondWith((async()=>{
    try {
      const response=await fetch(event.request,{cache:'no-cache'});
      if(OFFLINE&&response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)));}
      return response;
    } catch(error) {
      if(OFFLINE){const cached=await caches.match(event.request,{ignoreSearch:true});if(cached)return cached;}
      throw error;
    }
  })());
});`;
}
