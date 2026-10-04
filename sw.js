// La Poste MNA : notifications + ouverture sans réseau
const C='pm-shell-v2';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-180.png','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!=C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!='GET')return;
 const u=new URL(r.url);
 if(u.hostname.endsWith('supabase.co'))return;                     // les données ne sont jamais mises en cache
 if(!(u.origin==location.origin||u.hostname=='cdn.jsdelivr.net'))return;
 e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})
  .catch(()=>caches.match(r).then(m=>m||(r.mode=='navigate'?caches.match('index.html').then(x=>x||caches.match('./')):Response.error()))));
});
self.addEventListener('push',e=>{
 let d={title:'La Poste MNA',body:'Nouveau contenu',url:'./'};
 try{d={...d,...e.data.json()}}catch{}
 e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'icon-192.png',badge:'icon-192.png',tag:d.tag,data:{url:d.url}}));
});
self.addEventListener('notificationclick',e=>{
 e.notification.close();
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
  for(const c of l){if('focus' in c)return c.focus()}
  return self.clients.openWindow(e.notification.data?.url||'./');
 }));
});
