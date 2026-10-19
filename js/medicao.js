/* FCE Advogados: medição de anúncios (Google Ads + Meta) com consentimento (LGPD).
   - Google: Consent Mode v2, tudo negado até a pessoa aceitar.
   - Meta: o pixel só é carregado depois do aceite.
   - Eventos: clique no WhatsApp, cadastro nas calculadoras, download de guia. */
(function () {
  var AW = 'AW-18482066769';
  var CONV = {
    whatsapp: AW + '/SkfpCIX36ZMdENHq9-xE',
    'calc-devedor': AW + '/oNGiCIj36ZMdENHq9-xE',
    'calc-investidor': AW + '/eoc-CIv36ZMdENHq9-xE',
    guia: AW + '/4xTaCI736ZMdENHq9-xE'
  };
  var PIXEL = '1379856267251058';
  var CHAVE = 'fce_consent';

  function ler() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch (e) {} }

  // Google tag com consentimento negado por padrão
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', wait_for_update: 500 });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);
  gtag('js', new Date());
  gtag('config', AW);
  var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW;
  document.head.appendChild(s);

  var pixelOk = false;
  function carregarPixel() {
    if (pixelOk) return; pixelOk = true;
    !function (f, b, e, v, n, t, x) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; x = b.getElementsByTagName(e)[0]; x.parentNode.insertBefore(t, x) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL);
    fbq('track', 'PageView');
  }
  function aceitar() {
    gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    gtag('set', 'ads_data_redaction', false);
    carregarPixel();
  }
  if (ler() === 'sim') aceitar();

  // Eventos
  function meta(evento, dados) { if (pixelOk && window.fbq) fbq('track', evento, dados || {}); }
  // Camada de eventos (dataLayer): nomes estáveis para um futuro GA4/GTM, sem dados pessoais.
  function camada(evento) { try { window.dataLayer.push({ event: evento, pagina: location.pathname }); } catch (e) {} }
  function conversao(tipo) {
    camada(tipo === 'whatsapp' ? 'fce_whatsapp_clique' : (tipo === 'contato' ? 'fce_triagem_conclusao' : 'fce_lead_' + tipo));
    if (CONV[tipo]) gtag('event', 'conversion', { send_to: CONV[tipo], transport_type: 'beacon' });
    if (tipo === 'whatsapp') meta('Contact');
    else meta('Lead', { content_name: tipo });
  }
  // Origem do anúncio (gclid/utm): guarda na sessão ao chegar e leva para TODOS os botões de WhatsApp,
  // mesmo que a pessoa navegue por outras páginas antes de clicar. Assim o clique fica ligado ao anúncio.
  var ORIG = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid'];
  function origem() {
    var m = {};
    try { m = JSON.parse(sessionStorage.getItem('fce_utm') || '{}') || {}; } catch (e) { m = {}; }
    try {
      var q = new URLSearchParams(location.search), novo = {};
      ORIG.forEach(function (k) { var v = q.get(k); if (v) novo[k] = v.slice(0, 150); });
      if (Object.keys(novo).length) { m = novo; try { sessionStorage.setItem('fce_utm', JSON.stringify(m)); } catch (e) {} }
    } catch (e) {}
    return m;
  }
  var ORIGEM = origem();
  function marcarLink(a) {
    try {
      var u = new URL(a.href), src = String(ORIGEM.utm_source || '').toLowerCase();
      ORIG.forEach(function (k) { if (ORIGEM[k] && !u.searchParams.get(k)) u.searchParams.set(k, ORIGEM[k]); });
      if (!u.searchParams.get('c') || u.searchParams.get('c') === 'site') {
        if (ORIGEM.gclid || ORIGEM.gbraid || ORIGEM.wbraid || src === 'google') u.searchParams.set('c', 'google-ads');
        else if (ORIGEM.fbclid || /^(facebook|instagram|meta|fb|ig)$/.test(src)) u.searchParams.set('c', 'meta-ads');
      }
      a.href = u.toString();
    } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="/webhook/fce-wa"]');
    if (a) { marcarLink(a); conversao('whatsapp'); }
  }, true);
  window.addEventListener('fce:lead', function (e) { conversao(String(e.detail || '')); });
  if (/\/obrigado\/$/.test(location.pathname)) {
    var k = 'fce_conv_' + location.pathname;
    var ja = false; try { ja = sessionStorage.getItem(k) === '1'; sessionStorage.setItem(k, '1'); } catch (e) {}
    // /contato/obrigado/ = triagem concluída (sem rótulo de conversão do Google Ads próprio); demais = download de guia
    if (!ja) conversao(/^\/contato\//.test(location.pathname) ? 'contato' : 'guia');
  }

  // Aviso de cookies
  function aviso(forcar) {
    if (!forcar && ler()) return;
    if (document.getElementById('fce-cookies')) return;
    var css = document.createElement('style');
    css.textContent = '#fce-cookies{position:fixed;left:16px;right:16px;bottom:16px;z-index:60;max-width:34rem;margin-left:auto;background:var(--surface,#fff);color:var(--ink,#111);border:1px solid var(--line,#ddd);border-left:4px solid var(--accent,#f2c200);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:1rem 1.1rem;font:400 .92rem/1.5 var(--body,system-ui,sans-serif)}' +
      '#fce-cookies p{margin:0 0 .8rem}#fce-cookies a{color:inherit}#fce-cookies .b{display:flex;gap:.6rem;flex-wrap:wrap}' +
      '#fce-cookies button{font:600 .9rem/1 var(--body,system-ui,sans-serif);padding:.7rem 1.1rem;border-radius:999px;cursor:pointer;border:1.5px solid var(--line,#ccc);background:transparent;color:inherit}' +
      '#fce-cookies button.ok{background:var(--accent,#f2c200);border-color:var(--accent,#f2c200);color:var(--accent-ink,#111)}' +
      '@media (max-width:760px){#fce-cookies{bottom:calc(5rem + env(safe-area-inset-bottom,0px))}}';
    document.head.appendChild(css);
    var d = document.createElement('div');
    d.id = 'fce-cookies'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Aviso de cookies');
    d.innerHTML = '<p>Usamos cookies do Google e da Meta para medir quais anúncios trazem contatos e para mostrar anúncios do escritório a quem já visitou o site. O que você digita nos formulários não é compartilhado. <a href="/privacidade/">Saiba mais</a>.</p>' +
      '<div class="b"><button type="button" class="ok">Aceitar</button><button type="button" class="no">Recusar</button></div>';
    document.body.appendChild(d);
    d.querySelector('.ok').onclick = function () { gravar('sim'); aceitar(); d.remove(); };
    d.querySelector('.no').onclick = function () {
      gravar('nao'); d.remove();
      gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
      if (pixelOk && window.fbq) fbq('consent', 'revoke');
    };
  }
  function iniciar() {
    aviso(false);
    document.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('[data-cookies]');
      if (c) { e.preventDefault(); aviso(true); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
