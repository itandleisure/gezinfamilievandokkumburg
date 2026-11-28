// Service worker voor pushmeldingen. Bewust géén cache: de fetch-handler hieronder vraagt eigen bestanden altijd na bij de server
// (cache: 'no-cache', dus een snelle 304 als er niets veranderd is), zodat een nieuwe versie meteen doorkomt in plaats van na 10 minuten.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== self.location.origin) return; // Supabase, weer-API's enz.: gewoon laten
  e.respondWith(fetch(r.url, { cache: 'no-cache', credentials: 'same-origin' }).catch(() => fetch(r)));
});
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Gezin', {
    body: d.body || '', tag: d.tag || 'gezin', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) { if ('focus' in c) { await c.focus(); if ('navigate' in c) await c.navigate(url).catch(() => {}); return; } }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
});
