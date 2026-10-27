// Service worker do app FCE: a tela vem da internet (versão mais nova), com a cópia do aparelho como reserva; o resto abre do aparelho e atualiza em segundo plano.
const CACHE = 'fce-app-v27';
const ARQS = ['./', './index.html', './manifest.json', './icon-192.png', './apple.png', './fabio.jpg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/app/')) return; // API e Google passam direto
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const pagina = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html');
    const chave = pagina ? './' : e.request;
    const salvo = await c.match(chave, { ignoreSearch: true });
    const rede = fetch(e.request, pagina ? { cache: 'no-cache' } : undefined).then((r) => { if (r.ok) c.put(chave, r.clone()); return r; }).catch(() => salvo);
    // a tela do app vem sempre da internet (versão mais nova); se a rede demorar mais de 3 s ou cair, abre a cópia do aparelho
    if (pagina && salvo) return Promise.race([rede, new Promise((ok) => setTimeout(() => ok(salvo), 3000))]);
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
