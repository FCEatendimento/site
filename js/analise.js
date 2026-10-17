/* FCE Advogados: "Minha análise" e ferramentas interativas.
   - Salvar a análise: nome, WhatsApp, e-mail opcional e autorização (LGPD). O escritório devolve um link pessoal.
   - Página /minha-analise/: resumo, linha do tempo da fase, documentos para reunir e envio de documentos.
   Conteúdo informativo (Provimento OAB 205/2021): não calcula prazos do caso e não substitui a análise individual. */
(function () {
  'use strict';
  var API = 'https://emerim.app.n8n.cloud/webhook/fce-analise';
  var WA = 'https://emerim.app.n8n.cloud/webhook/fce-wa';
  var CHAVE = 'fce_analise';

  // Dívidas da triagem da home
  var DIV = {
    financiamento: 'Financiamento do imóvel', bancaria: 'Dívida bancária', garantia: 'Imóvel em garantia de dívida da empresa',
    fianca: 'Fiança ou aval', veiculo: 'Busca e apreensão de carro ou máquina', condominio: 'Condomínio atrasado', iptu: 'IPTU',
    itr: 'ITR', penhora: 'Dívida com penhora do imóvel', comprar: 'Compra de imóvel em leilão'
  };

  // Linhas do tempo educativas: [chave da situação, fase, o que é]. Prazos citados são os previstos em lei, sem cálculo para o caso.
  var FISCAL_IMP = function (nome, embargos) {
    return [
      ['cobranca', 'Cobrança e dívida ativa', 'O débito de ' + nome + ' é cobrado, pode ser protestado e inscrito em dívida ativa.'],
      ['processo', 'Execução fiscal', 'A citação abre prazo para pagar ou garantir a dívida. ' + embargos],
      ['penhora', 'Penhora do imóvel', 'A dívida do próprio imóvel é uma das exceções à proteção do bem de família.'],
      ['leilao', 'Avaliação e leilão judicial', 'O imóvel é avaliado e o leilão é marcado por edital. Até a arrematação, pagar ou parcelar ainda pode ser possível.']
    ];
  };
  var EMB_FISCAL = 'Os embargos dependem de garantia e têm prazo de 30 dias contados dela.';
  var TL = {
    financiamento: [
      ['emdia', 'Parcelas em dia', 'Ainda não houve atraso. É a fase com mais opções de renegociação.'],
      ['atraso', 'Parcelas atrasadas', 'Com o atraso, o banco pode pedir ao cartório de imóveis a intimação para pagamento.'],
      ['intimacao', 'Intimação do cartório', 'Abre o prazo de 15 dias para pagar as parcelas vencidas e os encargos.'],
      ['consolidado', 'Consolidação da propriedade', 'Sem o pagamento, o banco registra o imóvel no próprio nome, na matrícula.'],
      ['leilao', 'Leilões', 'O 1º leilão deve acontecer em até 60 dias do registro da consolidação; o 2º, nos 15 dias seguintes. O antigo dono tem preferência para recomprar até o 2º leilão.'],
      ['depois', 'Depois do leilão', 'Se o lance passar da dívida, a diferença é do antigo dono. Depois vem a desocupação do imóvel.']
    ],
    garantia: [
      ['assinar', 'Contrato e garantia', 'O valor garantido, o prazo e o vencimento antecipado definem o risco do imóvel.'],
      ['emdia', 'Parcelas em dia', 'A empresa ainda paga. Dá para entender o contrato e negociar antes do atraso.'],
      ['atraso', 'Atraso da empresa', 'O contrato pode prever o vencimento antecipado de toda a dívida.'],
      ['citado', 'Cobrança da garantia', 'Na alienação fiduciária, a cobrança segue pelo cartório; na hipoteca e no aval, pela Justiça.'],
      ['leilao', 'Penhora ou leilão', 'Com o imóvel penhorado ou consolidado, vem o leilão, judicial ou extrajudicial.']
    ],
    fianca: [
      ['assinar', 'Pedido para ser fiador ou avalista', 'Fiança e aval têm regras diferentes. A outorga do cônjuge costuma ser exigida.'],
      ['cobranca', 'Cobrança da dívida de outra pessoa', 'Quem garante responde nos limites do que assinou.'],
      ['citado', 'Processo de execução', 'A citação abre prazo para pagar ou apresentar defesa.'],
      ['penhora', 'Penhora do imóvel', 'Na fiança de locação, o imóvel do fiador pode ser penhorado mesmo sendo bem de família.'],
      ['leilao', 'Avaliação e leilão judicial', 'O imóvel é avaliado e vai a leilão. Até a arrematação, pagar ainda pode ser possível.']
    ],
    condominio: [
      ['cobranca', 'Cobrança do condomínio', 'As cotas atrasadas são cobradas com multa de até 2% e juros. É o melhor momento para negociar.'],
      ['processo', 'Execução do condomínio', 'Na execução, o prazo para pagar é de 3 dias e o dos embargos, de 15 dias.'],
      ['penhora', 'Penhora do imóvel', 'A dívida de condomínio é uma das exceções à proteção do bem de família.'],
      ['leilao', 'Avaliação e leilão judicial', 'O imóvel é avaliado e o leilão é marcado por edital. Até a arrematação, pagar ainda pode ser possível.']
    ],
    iptu: FISCAL_IMP('IPTU', EMB_FISCAL),
    itr: FISCAL_IMP('ITR', EMB_FISCAL),
    bancaria: [
      ['emdia', 'Parcelas em dia', 'Ainda não houve atraso. Conferir o contrato e os juros abre mais opções.'],
      ['atraso', 'Atraso ou negativação', 'O banco cobra, negativa e pode levar a dívida à Justiça.'],
      ['judicial', 'Execução ou cobrança judicial', 'Na execução, o prazo para pagar é de 3 dias e o dos embargos, de 15 dias.'],
      ['penhora', 'Penhora ou bloqueio', 'Contas e bens podem ser atingidos. Há valores e bens que a lei protege.'],
      ['leilao', 'Avaliação e leilão', 'O bem penhorado é avaliado e vai a leilão.']
    ],
    veiculo: [
      ['emdia', 'Parcelas em dia', 'Ainda não houve atraso. Dá para conferir o contrato e negociar.'],
      ['atraso', 'Parcelas atrasadas', 'Com o atraso, o banco pode notificar o devedor.'],
      ['notificacao', 'Notificação', 'A notificação costuma anteceder o pedido de busca e apreensão, na Justiça ou pelo cartório.'],
      ['apreendido', 'Apreensão', 'Depois da apreensão, os prazos para pagar ou apresentar defesa são curtos.'],
      ['depois', 'Venda do bem', 'Sem pagamento, o banco pode vender o bem e cobrar eventual diferença.']
    ],
    penhora: [
      ['processo', 'Citação na execução', 'A citação abre prazo para pagar ou apresentar defesa.'],
      ['penhora', 'Penhora do imóvel', 'A penhora é registrada na matrícula. A proteção do bem de família entra na análise.'],
      ['avaliacao', 'Avaliação', 'A avaliação define a base do leilão e pode ser questionada dentro do prazo.'],
      ['leilao', 'Leilão judicial', 'O leilão é marcado por edital. Pagar a dívida antes da arrematação ainda pode ser possível.']
    ],
    comprar: [
      ['avaliando', 'Análise do imóvel', 'Edital, matrícula, dívidas e ocupação definem o risco.'],
      ['lance', 'Lance', 'A conta inclui comissão, impostos, dívidas, desocupação e reforma.'],
      ['arrematei', 'Arrematação', 'Depois vêm a carta ou o registro, as dívidas anteriores e a posse.'],
      ['depois', 'Registro e posse', 'Com o registro, o imóvel passa ao seu nome. Se estiver ocupado, vem a desocupação.']
    ]
  };

  // Documentos para reunir em cada situação
  var DOCS = {
    financiamento: ['Contrato de financiamento', 'Extrato ou planilha da dívida', 'Intimação do cartório, se recebeu', 'Matrícula atualizada do imóvel', 'Comprovantes das parcelas pagas', 'Edital ou aviso do leilão, se houver', 'Propostas e conversas com o banco'],
    garantia: ['Contrato do empréstimo e aditivos', 'Escritura ou registro da garantia', 'Matrícula atualizada do imóvel', 'Notificações, intimações ou citação', 'Extrato da dívida da empresa', 'Contrato social da empresa'],
    fianca: ['Contrato em que consta a fiança ou o aval', 'Aditivos e renovações', 'Notificações ou citação recebidas', 'Matrícula do seu imóvel', 'Comprovante de que mora no imóvel'],
    condominio: ['Boletos ou planilha do débito', 'Notificações ou citação', 'Propostas de acordo do condomínio', 'Matrícula atualizada do imóvel'],
    iptu: ['Carnês ou certidão da dívida ativa', 'Notificações ou citação', 'Número do processo, se houver', 'Matrícula atualizada do imóvel'],
    itr: ['Notificações ou certidão da dívida ativa', 'Número do processo, se houver', 'Documentos do imóvel rural (CCIR, CAR, declarações do ITR)', 'Matrícula atualizada do imóvel'],
    bancaria: ['Contrato ou cédula de crédito', 'Extratos e planilha da dívida', 'Notificações ou citação', 'Lista dos bens dados em garantia, se houver'],
    veiculo: ['Contrato de financiamento', 'Notificação do banco ou do cartório', 'Comprovantes das parcelas pagas', 'Auto de apreensão ou número do processo, se houver', 'Documento do veículo ou da máquina'],
    penhora: ['Citação e número do processo', 'Auto ou termo de penhora', 'Laudo de avaliação, se houver', 'Matrícula atualizada do imóvel', 'Edital do leilão, se houver'],
    comprar: ['Edital do leilão ou link do lote', 'Matrícula do imóvel', 'Número do processo, se for judicial', 'Informações sobre ocupação', 'Débitos de IPTU e condomínio']
  };

  // Página indicada pela triagem para cada situação (usada quando a análise não traz o destino)
  var PAGINA = {
    financiamento: ['/leilao/', 'Financiamento atrasado e leilão'], garantia: ['/imovel-em-garantia/', 'Imóvel dado em garantia'],
    fianca: ['/imovel-em-garantia/fiador/', 'Fiança e aval'], condominio: ['/penhora-de-imovel/divida-de-condominio/', 'Dívida de condomínio'],
    iptu: ['/penhora-de-imovel/iptu/', 'Dívida de IPTU'], itr: ['/penhora-de-imovel/itr/', 'Dívida de ITR'],
    bancaria: ['/divida-bancaria/', 'Dívida bancária'], veiculo: ['/veiculo/', 'Veículo financiado'],
    penhora: ['/penhora-de-imovel/', 'Imóvel penhorado'], comprar: ['/investidor/', 'Compra em leilão']
  };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ev(n, o) { try { if (window.gtag) window.gtag('event', n, o || {}); } catch (e) {} }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function utm() {
    var q = new URLSearchParams(location.search), mem = {}, out = {};
    try { mem = JSON.parse(sessionStorage.getItem('fce_utm') || '{}') || {}; } catch (e) {}
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) { var v = q.get(k) || mem[k]; if (v) out[k] = String(v).slice(0, 150); });
    return out;
  }
  function post(corpo) {
    return fetch(API, { method: 'POST', body: corpo, credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j || {} }; }); });
  }
  function waLink(p, extra) {
    var u = WA + '?c=site&p=' + encodeURIComponent(p || 'minha-analise');
    Object.keys(extra || {}).forEach(function (k) { if (extra[k]) u += '&' + k + '=' + encodeURIComponent(extra[k]); });
    return u;
  }
  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Z"/></svg>';

  /* ---------- Formulário "Salvar minha análise" ---------- */
  var n = 0;
  function formulario(titulo, texto) {
    n++;
    var id = 'fa' + n;
    return '<form class="fa-form" novalidate data-fa="' + id + '">' +
      '<h3 class="fa-t" tabindex="-1">' + esc(titulo || 'Salvar minha análise') + '</h3>' +
      '<p class="fa-txt">' + esc(texto || 'Você recebe um link pessoal com o resumo das respostas, a linha do tempo da sua fase, os documentos para reunir e um espaço para enviar documentos ao escritório.') + '</p>' +
      '<p class="fa-erro" role="alert" hidden></p>' +
      '<label for="' + id + 'n">Nome</label><input id="' + id + 'n" name="nome" required autocomplete="name" maxlength="120">' +
      '<label for="' + id + 'w">WhatsApp com DDD</label><input id="' + id + 'w" name="whatsapp" type="tel" inputmode="tel" required autocomplete="tel" placeholder="(51) 99999-9999" maxlength="20">' +
      '<label for="' + id + 'e">E-mail <span>(opcional)</span></label><input id="' + id + 'e" name="email" type="email" autocomplete="email" maxlength="160">' +
      '<input type="text" name="site" tabindex="-1" autocomplete="off" class="fa-hp" aria-hidden="true">' +
      '<label class="fa-ok"><input type="checkbox" name="aceite" value="sim" required> <span>Autorizo a FCE Advogados a usar estes dados para guardar a minha análise e responder ao meu contato, conforme a <a href="/privacidade/">Política de Privacidade</a>.</span></label>' +
      '<button class="btn btn-primary fa-btn" type="submit">Salvar minha análise</button>' +
      '<p class="fa-nota">Os dados ficam com o escritório e seus fornecedores de tecnologia, só para guardar a análise e responder ao seu contato. Você pode pedir a exclusão a qualquer momento. Salvar não cria contratação nem garante a aceitação do caso.</p>' +
      '</form>';
  }
  // ligar(form, () => respostas, pagina para o WhatsApp)
  function ligar(form, respostas, paginaWa) {
    if (!form || form.dataset.ligado) return; form.dataset.ligado = '1';
    var erro = form.querySelector('.fa-erro'), btn = form.querySelector('button[type=submit]');
    function falha(msg, campo) {
      erro.textContent = msg; erro.hidden = false;
      var el = campo && form.elements[campo]; if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); } else erro.focus && erro.focus();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      Array.prototype.forEach.call(form.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid'); });
      erro.hidden = true;
      var f = form.elements, tel = f.whatsapp.value.replace(/\D/g, '');
      if (f.nome.value.trim().length < 2) return falha('Informe o seu nome.', 'nome');
      if (tel.length < 10 || tel.length > 13) return falha('Informe o WhatsApp com DDD, só com números.', 'whatsapp');
      if (f.email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.value.trim())) return falha('Confira o e-mail ou deixe o campo em branco.', 'email');
      if (!f.aceite.checked) return falha('Para salvar, marque a autorização de uso dos dados.', 'aceite');
      var r = respostas(); r.utm = utm(); r.pagina = location.pathname;
      var corpo = new URLSearchParams({ acao: 'criar', nome: f.nome.value.trim(), whatsapp: f.whatsapp.value, email: f.email.value.trim(), aceite: 'sim', site: f.site.value, respostas: JSON.stringify(r) });
      btn.disabled = true; btn.textContent = 'Salvando…';
      post(corpo).then(function (res) {
        if (res.j && res.j.ok && res.j.token) {
          ls(CHAVE, JSON.stringify({ t: res.j.token, c: res.j.codigo, em: Date.now() }));
          ev('analise_salva', { ferramenta: r.ferramenta || 'triagem' });
          sucesso(form, res.j, paginaWa, r);
        } else if (res.j && res.j.ok) {
          form.innerHTML = '<p class="fa-txt">Recebido.</p>';
        } else if (res.status === 429) {
          falha('Muitas análises salvas a partir desta conexão na última hora. Tente mais tarde ou fale pelo WhatsApp.');
        } else if (res.j && res.j.erro === 'dados') {
          var c = (res.j.campos || [])[0];
          falha(c === 'whatsapp' ? 'Confira o WhatsApp com DDD.' : (c === 'email' ? 'Confira o e-mail.' : (c === 'aceite' ? 'Marque a autorização de uso dos dados.' : (c === 'respostas' ? 'Responda as perguntas antes de salvar.' : 'Confira os campos.'))), c === 'respostas' ? null : c);
        } else falha('Não foi possível salvar agora. Tente de novo em instantes ou fale pelo WhatsApp.');
      }).catch(function () {
        falha('Sem conexão com o escritório agora. Confira a internet e tente de novo.');
      }).then(function () { if (btn.isConnected) { btn.disabled = false; btn.textContent = 'Salvar minha análise'; } });
    });
  }
  function sucesso(form, j, paginaWa, r) {
    var link = '/minha-analise/#t=' + j.token;
    var div = document.createElement('div');
    div.className = 'fa-form fa-salva';
    div.innerHTML = '<h3 class="fa-t" tabindex="-1">Análise salva</h3>' +
      '<p class="fa-cod">Código <strong>' + esc(j.codigo) + '</strong></p>' +
      '<p class="fa-txt">O link abaixo é pessoal: por ele você volta ao resumo, vê a linha do tempo e envia documentos ao escritório. Guarde-o nos favoritos ou envie para você mesmo.</p>' +
      '<div class="fa-acts"><a class="btn btn-primary" href="' + link + '">Abrir minha análise</a>' +
      '<a class="btn btn-ghost wa" href="' + waLink(paginaWa || 'minha-analise', { d: r.d, s: r.s, quem: r.quem, quer: r.quer, an: j.codigo }) + '">' + ICON_WA + 'Conversar pelo WhatsApp</a></div>';
    form.parentNode.replaceChild(div, form);
    var h = div.querySelector('.fa-t'); if (h) h.focus();
  }

  /* ---------- Linha do tempo ---------- */
  // fases: lista [chave, nome, texto]; atual: índice; opções: {links:{chave:[url, texto]}}
  function linha(fases, atual, op) {
    op = op || {};
    var h = '<ol class="tl" aria-label="' + esc(op.rotulo || 'Linha do tempo') + '">';
    fases.forEach(function (f, i) {
      var cls = i < atual ? 'tl-pass' : (i === atual ? 'tl-agora' : 'tl-prox');
      var et = i < atual ? 'Fase anterior' : (i === atual ? 'Você está aqui' : (i === atual + 1 ? 'Costuma vir depois' : 'Mais adiante'));
      var lk = op.links && op.links[f[0]];
      h += '<li class="' + cls + '"' + (i === atual ? ' aria-current="step"' : '') + '><span class="tl-et">' + et + '</span>' +
        '<strong>' + esc(f[1]) + '</strong><span class="tl-tx">' + esc(f[2]) + '</span>' +
        (lk ? '<a class="tl-lk" href="' + esc(lk[0]) + '">' + esc(lk[1]) + '</a>' : '') + '</li>';
    });
    return h + '</ol>';
  }

  window.FCEA = { API: API, WA: WA, DIV: DIV, TL: TL, DOCS: DOCS, PAGINA: PAGINA, esc: esc, ev: ev, ls: ls, utm: utm, post: post, waLink: waLink, ICON_WA: ICON_WA, formulario: formulario, ligar: ligar, linha: linha };

  /* ---------- Página /minha-analise/ ---------- */
  var box = document.getElementById('ma');
  if (!box) return;
  var token = '';
  try { token = (new URLSearchParams(location.hash.slice(1))).get('t') || sessionStorage.getItem('fce_ma_t') || ''; } catch (e) {}
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) token = '';
  var aviso = document.getElementById('ma-aviso');
  function anunciar(t) { if (aviso) aviso.textContent = t; }

  function semLink(msg) {
    box.innerHTML = '<div class="ma-vazio"><h2>' + esc(msg || 'Abra a análise pelo link que você recebeu') + '</h2>' +
      '<p>A página da análise abre pelo link pessoal gerado quando você salva as respostas do guia. Se ainda não fez isso, comece pelo guia: são 4 perguntas.</p>' +
      '<p class="fa-acts"><a class="btn btn-primary" href="/#triagem">Começar pelo guia</a><a class="btn btn-ghost" href="/ferramentas/">Ver as ferramentas</a></p></div>';
  }
  if (!token) {
    var mem = null; try { mem = JSON.parse(ls(CHAVE) || 'null'); } catch (e) {}
    if (mem && mem.t) { location.replace('/minha-analise/#t=' + mem.t); token = mem.t; }
    else { semLink(); return; }
  }
  try { sessionStorage.setItem('fce_ma_t', token); } catch (e) {}

  function kb(b) { b = Number(b) || 0; return b > 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  var dados = null;
  function render() {
    var R = dados.respostas || {}, d = R.d || '', itens = R.itens || [];
    var fases = TL[d] || null, idx = -1;
    if (fases) for (var i = 0; i < fases.length; i++) if (fases[i][0] === R.s) idx = i;
    if (R.fase_idx !== undefined && fases) idx = Number(R.fase_idx);
    var pag = R.destino ? [R.destino, R.destino_titulo || 'Página do seu caso'] : (PAGINA[d] || null);
    var docs = DOCS[d] || ['Documentos que você recebeu (notificação, intimação, citação ou edital)', 'Contrato da dívida', 'Matrícula atualizada do imóvel'];
    var marc = {}; try { marc = JSON.parse(ls('fce_ma_docs_' + dados.codigo) || '{}') || {}; } catch (e) {}
    var wa = waLink('minha-analise', { d: d, s: R.s, quem: R.quem, quer: R.quer, an: dados.codigo });
    var nomeF = { 'triagem': 'Guia da sua situação', 'linha-do-tempo': 'Linha do tempo da alienação fiduciária', 'bem-de-familia': 'Verificador de bem de família', 'antes-de-assinar': 'Checklist antes de assinar a garantia' }[dados.ferramenta] || 'Guia da sua situação';

    var h = '<header class="ma-top"><p class="crumb"><a href="/">Início</a> › Minha análise</p>' +
      '<h1 tabindex="-1">' + (dados.primeiro_nome ? 'Olá, ' + esc(dados.primeiro_nome) + '. Esta é a sua análise' : 'Sua análise') + '</h1>' +
      '<p class="ma-meta">Código <strong>' + esc(dados.codigo) + '</strong>, salva em ' + esc(dados.criada_em) + ' a partir do ' + esc(nomeF.charAt(0).toLowerCase() + nomeF.slice(1)) + '.' +
      (dados.em_atendimento ? ' O escritório já vinculou esta análise ao seu atendimento.' : '') + '</p></header>';

    h += '<section class="ma-sec ma-resumo" aria-labelledby="ma-r"><h2 id="ma-r">O que você respondeu</h2><dl>' +
      itens.map(function (x) { return '<div><dt>' + esc(x.p) + '</dt><dd>' + esc(x.r) + '</dd></div>'; }).join('') + '</dl>' +
      (pag ? '<p><a class="ma-lk" href="' + esc(pag[0]) + '">Ler a página indicada: ' + esc(pag[1]) + '</a></p>' : '') + '</section>';

    if (fases) {
      h += '<section class="ma-sec" aria-labelledby="ma-l"><h2 id="ma-l">Onde você está e o que costuma vir depois</h2>' +
        '<p class="ma-nota">A linha do tempo mostra a ordem habitual das fases e os prazos previstos em lei. Ela não calcula prazos do seu caso: as datas dependem dos documentos.</p>' +
        linha(fases, idx < 0 ? 0 : idx, { rotulo: 'Fases de ' + (DIV[d] || 'sua situação') }) + '</section>';
    }

    h += '<section class="ma-sec" aria-labelledby="ma-d"><h2 id="ma-d">Documentos para reunir</h2>' +
      '<p class="ma-nota">Marque o que você já tem. A marcação fica só neste aparelho.</p><ul class="ma-docs">' +
      docs.map(function (x, i) { var k = 'd' + i; return '<li><label><input type="checkbox" data-doc="' + k + '"' + (marc[k] ? ' checked' : '') + '> <span>' + esc(x) + '</span></label></li>'; }).join('') + '</ul></section>';

    var lista = dados.documentos || [];
    h += '<section class="ma-sec ma-env" aria-labelledby="ma-e"><h2 id="ma-e">Enviar documentos ao escritório</h2>' +
      '<p>PDF ou foto (JPG, PNG, WEBP ou HEIC), até 8 MB cada, no máximo 10 arquivos. Os arquivos vão direto para o sistema do escritório e ficam ligados a esta análise.</p>' +
      '<form class="ma-up" novalidate><label class="ma-drop" for="ma-arq"><strong>Escolher arquivo</strong><span>ou arraste o arquivo para cá</span></label>' +
      '<input id="ma-arq" name="arquivo" type="file" accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple>' +
      '<p class="ma-st" role="status" aria-live="polite"></p></form>' +
      '<h3 class="ma-h3">Recebidos pelo escritório</h3>' +
      (lista.length ? '<ul class="ma-rec">' + lista.map(function (x) { return '<li><span>' + esc(x.nome) + '</span><small>' + esc(kb(x.tamanho)) + ', ' + esc(x.em) + '</small></li>'; }).join('') + '</ul>' : '<p class="ma-nota ma-rec0">Nenhum documento enviado ainda.</p>') +
      '<p class="ma-nota">Receber o documento não significa que ele já foi analisado. A análise acontece no atendimento. Evite enviar documentos de terceiros que não tenham relação com o caso.</p></section>';

    h += '<section class="ma-sec ma-prox caso-box" aria-labelledby="ma-p"><h2 id="ma-p">A lei é o ponto de partida. O que decide é o seu caso.</h2>' +
      '<p class="caso-dest">Advocacia, para nós, é buscar a saída e pensar fora da caixa — não só repetir o que está na lei.</p>' +
      '<p>Fale com o escritório pelo WhatsApp: a mensagem já leva o código da análise, e o atendimento começa a partir das suas respostas, sem repetir perguntas.</p>' +
      '<p class="caso-acoes"><a class="btn btn-primary wa" href="' + wa + '">Quero entender o meu caso →</a>' +
      '<a class="caso-sec" href="' + wa + '" data-consulta="1">Marcar uma consulta</a></p>' +
      '<p>A consulta é marcada pelo WhatsApp, com os horários livres da agenda. Os honorários são informados por escrito antes de qualquer providência.</p></section>';
    box.innerHTML = h;
    var h1 = box.querySelector('h1'); if (h1) h1.focus({ preventScroll: true });
    ligarUp();
    box.querySelector('.ma-docs').addEventListener('change', function (e) {
      var k = e.target.getAttribute('data-doc'); if (!k) return;
      marc[k] = e.target.checked; ls('fce_ma_docs_' + dados.codigo, JSON.stringify(marc));
    });
    var cons = box.querySelector('[data-consulta]');
    if (cons) cons.addEventListener('click', function () { ev('analise_consulta', {}); });
  }

  var MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  function tipoDe(f) {
    var t = String(f.type || '').toLowerCase();
    if (!t && /\.(heic|heif)$/i.test(f.name)) t = 'image/heic';
    return t;
  }
  function ligarUp() {
    var form = box.querySelector('.ma-up'), inp = form.querySelector('input[type=file]'), st = form.querySelector('.ma-st'), drop = form.querySelector('.ma-drop');
    function enviar(arqs) {
      arqs = Array.prototype.slice.call(arqs || []);
      if (!arqs.length) return;
      var fila = arqs.slice(0, 10), ok = 0, msgs = [];
      function prox() {
        if (!fila.length) {
          st.textContent = (ok ? (ok === 1 ? '1 arquivo enviado.' : ok + ' arquivos enviados.') : '') + (msgs.length ? ' ' + msgs.join(' ') : '');
          inp.value = '';
          if (ok) carregar(true);
          return;
        }
        var f = fila.shift(), t = tipoDe(f);
        if (MIMES.indexOf(t) < 0) { msgs.push('“' + f.name + '” não foi enviado: use PDF ou foto.'); return prox(); }
        if (f.size > 8 * 1024 * 1024) { msgs.push('“' + f.name + '” passa de 8 MB.'); return prox(); }
        st.textContent = 'Enviando “' + f.name + '”…';
        var fd = new FormData(); fd.append('acao', 'documento'); fd.append('t', token);
        fd.append('arquivo', t === f.type ? f : new Blob([f], { type: t }), f.name);
        post(fd).then(function (r) {
          if (r.j && r.j.ok) { ok++; ev('analise_documento', {}); }
          else if (r.j && r.j.erro === 'limite_documentos') { msgs.push('O limite de 10 documentos foi atingido. Envie os demais pelo WhatsApp.'); fila = []; }
          else if (r.j && (r.j.erro === 'tipo' || r.j.erro === 'tamanho')) msgs.push('“' + f.name + '” foi recusado: ' + (r.j.erro === 'tamanho' ? 'passa de 8 MB.' : 'o conteúdo não é PDF nem foto.'));
          else if (r.status === 404) { msgs.push('Esta análise não está mais disponível.'); fila = []; }
          else msgs.push('“' + f.name + '” não foi enviado. Tente de novo.');
        }).catch(function () { msgs.push('“' + f.name + '” não foi enviado: sem conexão.'); }).then(prox);
      }
      prox();
    }
    inp.addEventListener('change', function () { enviar(inp.files); });
    ['dragenter', 'dragover'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.add('on'); }); });
    ['dragleave', 'drop'].forEach(function (n) { drop.addEventListener(n, function (e) { e.preventDefault(); drop.classList.remove('on'); }); });
    drop.addEventListener('drop', function (e) { if (e.dataTransfer) enviar(e.dataTransfer.files); });
  }

  function carregar(depoisEnvio) {
    if (!depoisEnvio) box.innerHTML = '<p class="ma-carr">Abrindo a sua análise…</p>';
    post(new URLSearchParams({ acao: 'ler', t: token })).then(function (r) {
      if (r.j && r.j.ok) {
        var st = depoisEnvio && box.querySelector('.ma-st') ? box.querySelector('.ma-st').textContent : '';
        dados = r.j; if (typeof dados.respostas === 'string') { try { dados.respostas = JSON.parse(dados.respostas); } catch (e) { dados.respostas = {}; } }
        render();
        if (st) { var s2 = box.querySelector('.ma-st'); s2.textContent = st; var env = document.getElementById('ma-e'); if (env) env.scrollIntoView({ block: 'start' }); }
        anunciar(depoisEnvio ? st : 'Análise ' + dados.codigo + ' aberta.');
      } else if (r.status === 404 || r.status === 400) {
        ls(CHAVE, null); try { sessionStorage.removeItem('fce_ma_t'); } catch (e) {}
        semLink('Este link de análise não foi encontrado');
      } else {
        box.innerHTML = '<div class="ma-vazio"><h2>Não foi possível abrir a análise agora</h2><p>Tente de novo em instantes. Se preferir, fale com o escritório pelo WhatsApp.</p><p class="fa-acts"><button class="btn btn-primary" type="button" id="ma-de-novo">Tentar de novo</button></p></div>';
        document.getElementById('ma-de-novo').addEventListener('click', function () { carregar(false); });
      }
    }).catch(function () {
      box.innerHTML = '<div class="ma-vazio"><h2>Sem conexão com o escritório</h2><p>Confira a internet e tente de novo.</p><p class="fa-acts"><button class="btn btn-primary" type="button" id="ma-de-novo">Tentar de novo</button></p></div>';
      document.getElementById('ma-de-novo').addEventListener('click', function () { carregar(false); });
    });
  }
  carregar(false);
})();
