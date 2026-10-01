self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
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
