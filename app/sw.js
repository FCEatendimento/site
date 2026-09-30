// Service worker do app FCE: abre a tela na hora a partir do aparelho e atualiza em segundo plano.
const CACHE = 'fce-app-v8';
const ARQS = ['./', './index.html', './manifest.json', './icon-192.png', './apple.png', './fabio.jpg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/app/')) return; // API e Google passam direto
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const chave = u.pathname.endsWith('/') ? './' : e.request;
    const salvo = await c.match(chave, { ignoreSearch: true });
    const rede = fetch(e.request).then((r) => { if (r.ok) c.put(chave, r.clone()); return r; }).catch(() => salvo);
    return salvo || rede;
  }));
});
// Toque na notificação de mensagem: abre (ou foca) o app direto na conversa do caso.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    const c = cs.find((x) => x.url.startsWith(self.registration.scope));
    if (c) { c.navigate ? c.navigate(alvo).catch(() => {}) : null; return c.focus(); }
    return self.clients.openWindow(alvo);
  }));
});
