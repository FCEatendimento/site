// ---------- Processos > Prazos: painel de prazos por urgência ou por etapa da peça ----------
(function () {
  // dias úteis forenses (estimativa): sem sáb/dom, feriados nacionais, Carnaval, Sexta-feira Santa, Corpus Christi e recesso de 20/12 a 20/01 (art. 220 CPC)
  const FIXOS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
  const cacheFer = {};
  function pascoa(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(y, mes - 1, dia, 12));
  }
  function feriados(y) {
    if (cacheFer[y]) return cacheFer[y];
    const s = new Set(FIXOS.map((m) => y + '-' + m)), p = pascoa(y);
    [-48, -47, -2, 60].forEach((n) => { const d = new Date(p); d.setUTCDate(d.getUTCDate() + n); s.add(d.toISOString().slice(0, 10)); });
    return (cacheFer[y] = s);
  }
  const util = (k) => { const w = new Date(k + 'T12:00:00Z').getUTCDay(), md = k.slice(5); return w !== 0 && w !== 6 && md < '12-20' && md > '01-20' && !feriados(+k.slice(0, 4)).has(k); };
  function uteis(alvo, hoje) {
    if (alvo <= hoje) return 0;
    let n = 0; const d = new Date(hoje + 'T12:00:00Z');
    for (let i = 0; i < 800; i++) { d.setUTCDate(d.getUTCDate() + 1); const k = d.toISOString().slice(0, 10); if (util(k)) n++; if (k >= alvo) break; }
    return n;
  }
  window.diasUteisAte = uteis;

  const ETP = [['A_FAZER', 'A fazer'], ['ELABORANDO', 'Em elaboração'], ['REVISAO', 'Em revisão'], ['PRONTO', 'Pronto p/ protocolo'], ['PROTOCOLADO', 'Protocolado']];
  const ETP_NOME = Object.fromEntries(ETP);
  window.ETAPA_PRAZO = ETP_NOME;
  const FAIXAS = [
    ['vencido', 'Vencidos', 'bad', 'Data final já passou e não está marcado como protocolado'],
    ['hoje', 'Vencem hoje', 'bad', ''],
    ['critico', 'Até 3 dias úteis', 'warn', ''],
    ['semana', 'Até 7 dias úteis', 'ouro', ''],
    ['quinzena', 'Até 15 dias úteis', 'info', ''],
    ['depois', 'Mais adiante', '', '']
  ];
  const faixaDe = (c, hoje) => {
    const dia = String(c.data).slice(0, 10);
    if (dia < hoje) return 'vencido';
    if (dia === hoje) return 'hoje';
    const u = uteis(dia, hoje);
    return u <= 3 ? 'critico' : u <= 7 ? 'semana' : u <= 15 ? 'quinzena' : 'depois';
  };
  const semana = (k) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(k + 'T12:00:00Z')).replace('.', '');
  const mesC = (k) => new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(new Date(k + 'T12:00:00Z')).replace('.', '');

  function contagem(c, hoje) {
    const dia = String(c.data).slice(0, 10), corr = diasEntre(dia, hoje);
    if (c.concluido) return '<div class="pz-cont ok"><b>' + ic('check', 's') + '</b><span>protocolado</span></div>';
    if (corr < 0) return '<div class="pz-cont bad"><b>' + (-corr) + '</b><span>dia' + (corr === -1 ? '' : 's') + ' vencido</span></div>';
    if (corr === 0) return '<div class="pz-cont bad"><b>HOJE</b><span>até 23:59</span></div>';
    const u = uteis(dia, hoje);
    return '<div class="pz-cont ' + (u <= 3 ? 'warn' : '') + '"><b>' + u + '</b><span>dia' + (u === 1 ? '' : 's') + ' út' + (u === 1 ? 'il' : 'eis') + '</span><i>' + corr + ' corrido' + (corr === 1 ? '' : 's') + '</i></div>';
  }
  function cartao(c, hoje, kb) {
    const dia = String(c.data).slice(0, 10), f = faixaDe(c, hoje), et = c.etapa || (c.concluido ? 'PROTOCOLADO' : 'A_FAZER');
    const idx = ETP.findIndex((x) => x[0] === et), t = (TIPO_COMP[c.tipo] || TIPO_COMP.OUTRO);
    return '<div class="pz-card' + (c.concluido ? ' feito' : ' f-' + f) + '" data-pz="' + c.id + '">' +
      '<div class="pz-data"><b>' + dia.slice(8, 10) + '</b><span>' + esc(mesC(dia)) + '</span><em>' + esc(semana(dia)) + '</em></div>' +
      '<div class="pz-mid">' +
        '<div class="pz-t">' + (c.tipo !== 'PRAZO' ? '<span class="chip ' + t[1] + '">' + t[0] + '</span> ' : '') + esc(c.titulo) + (c.hora ? ' <span class="mut">· ' + esc(c.hora) + '</span>' : '') + '</div>' +
        '<div class="pz-cli">' + esc(c.cliente || '') + (c.parte_contraria && !kb ? ' <span class="mut">× ' + esc(c.parte_contraria) + '</span>' : '') + '</div>' +
        '<div class="pz-meta">' + logoTrib(c.tribunal, 'xs') + '<span>' + esc(c.tribunal || '') + '</span>' +
          (c.numero ? '<button class="pz-cnj" data-pz-cnj="' + esc(c.numero) + '" title="Copiar número">' + esc(c.numero) + '</button>' : '') +
          (c.orgao && !kb ? '<span class="mut">' + esc(c.orgao) + '</span>' : '') + '</div>' +
        (c.tipo === 'PRAZO' && kb ? '<select class="sel pz-sel" data-pz-sel aria-label="Mover para a etapa">' + ETP.map(([k, n]) => '<option value="' + k + '"' + (k === et ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' : '') +
        (c.tipo === 'PRAZO' && !kb ? '<div class="pz-etapas" role="group" aria-label="Etapa da peça">' + ETP.map(([k, n], i) => '<button data-pz-et="' + k + '" class="' + (i < idx ? 'antes' : '') + (i === idx ? ' on' : '') + '">' + (i < idx ? ic('check', 's') : '') + n + '</button>').join('') + '</div>' : '') +
        (c.obs && !kb ? '<details class="pz-obs"><summary>Detalhes e providência</summary><p>' + esc(c.obs) + '</p></details>' : '') +
      '</div>' +
      '<div class="pz-dir">' + contagem(c, hoje) +
        '<div class="pz-acts"><a class="btn fant sm" href="#/processo/' + c.processo_id + '">' + (kb ? ic('seta', 's') : 'Processo') + '</a><button class="btn fant sm" data-pz-ed>' + ic('caneta', 's') + '</button></div></div>' +
    '</div>';
  }

  window.desenharPrazos = function (d, hoje) {
    const F = S.procFiltro;
    F.pzAgr = F.pzAgr || 'urg'; F.pzTipo = F.pzTipo || 'PRAZO'; F.pzQ = F.pzQ || '';
    const recarregar = () => { delete S.cache.proc; return VIEWS.processos(null, true); };
    const todos = (d.compromissos || []).filter((c) => (F.pzTipo === 'todos' || c.tipo === 'PRAZO') && (!F.trib || c.tribunal === F.trib));
    const q = F.pzQ.toLowerCase().trim(), qd = q.replace(/\D/g, '');
    const casa = (c) => !q || [c.titulo, c.cliente, c.parte_contraria, c.orgao, c.numero, c.obs].join(' ').toLowerCase().includes(q) || (qd.length > 3 && String(c.numero || '').replace(/\D/g, '').includes(qd));
    const abertos = todos.filter((c) => !c.concluido && casa(c)).sort((a, b) => (String(a.data) + (a.hora || '')).localeCompare(String(b.data) + (b.hora || '')));
    const lim30 = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    const feitos = todos.filter((c) => c.concluido && casa(c) && String(c.etapa_em || c.data).slice(0, 10) >= lim30).sort((a, b) => String(b.etapa_em || b.data).localeCompare(String(a.etapa_em || a.data)));
    const porF = {}; abertos.forEach((c) => { const f = faixaDe(c, hoje); (porF[f] = porF[f] || []).push(c); });
    const nEt = (k) => abertos.filter((c) => (c.etapa || 'A_FAZER') === k).length;
    const tile = (rot, n, cor, sub, alvo) => '<button class="pz-tile' + (n ? ' ' + cor : ' zero') + '"' + (alvo ? ' data-pz-ir="' + alvo + '"' : '') + '><b>' + n + '</b><span>' + rot + '</span>' + (sub ? '<i>' + sub + '</i>' : '') + '</button>';
    let h = '<div class="pz-tiles">' +
      tile('Vencidos', (porF.vencido || []).length, 'bad', 'sem protocolo', 'vencido') +
      tile('Hoje', (porF.hoje || []).length, 'bad', '', 'hoje') +
      tile('Até 3 dias úteis', (porF.critico || []).length, 'warn', '', 'critico') +
      tile('Peças em andamento', nEt('ELABORANDO') + nEt('REVISAO') + nEt('PRONTO'), 'info', nEt('A_FAZER') + ' ainda a fazer', '') +
      tile('Protocolados', feitos.length, 'ok', 'últimos 30 dias', 'feitos') + '</div>';
    h += '<div class="pz-bar"><div class="filtros" style="margin:0">' +
      '<button data-pz-agr="urg"' + (F.pzAgr === 'urg' ? ' class="on"' : '') + '>Por urgência</button><button data-pz-agr="etapa"' + (F.pzAgr === 'etapa' ? ' class="on"' : '') + '>Por etapa da peça</button>' +
      '<span class="fsep"></span><button data-pz-tipo="PRAZO"' + (F.pzTipo === 'PRAZO' ? ' class="on"' : '') + '>Só prazos</button><button data-pz-tipo="todos"' + (F.pzTipo === 'todos' ? ' class="on"' : '') + '>Com audiências e perícias</button>' +
      (F.trib ? '<button data-limpa class="on">' + esc(F.trib) + ' ' + ic('x', 's') + '</button>' : '') + '</div>' +
      '<input class="inp" id="pzQ" type="search" placeholder="Buscar cliente, número ou providência" value="' + esc(F.pzQ) + '"></div>' +
      '<div class="pz-acoes"><button class="btn sm pri" id="bPzNovo">' + ic('mais2', 's') + ' Novo prazo</button><button class="btn sm" id="bPzCopiar">' + ic('lista', 's') + ' Copiar pauta de prazos</button>' +
      '<span class="pp mut">Dias úteis estimados: sem fins de semana, feriados nacionais e recesso de 20/12 a 20/01. Feriados locais não entram — confira no eproc.</span></div>';
    if (!todos.length) h += '<div class="card" style="margin-top:14px"><div class="vazio">' + ic('cal') + '<div>Nenhum prazo cadastrado.</div><div class="pq mut">Cadastre pelo botão "Novo prazo" ou dentro de cada processo.</div></div></div>';
    else if (F.pzAgr === 'etapa') {
      h += '<div class="pz-kanban">' + ETP.map(([k, n]) => {
        const cs = k === 'PROTOCOLADO' ? feitos : abertos.filter((c) => (c.etapa || 'A_FAZER') === k);
        return '<div class="pz-col"><div class="pz-col-t">' + n + '<span>' + cs.length + '</span></div>' + (cs.length ? cs.map((c) => cartao(c, hoje, true)).join('') : '<div class="pz-vazio">Nada aqui</div>') + '</div>';
      }).join('') + '</div>';
    } else {
      FAIXAS.forEach(([k, n, cor, dica]) => {
        const cs = porF[k] || []; if (!cs.length) return;
        h += '<div class="sec-tit pz-sec ' + cor + '" id="pzf-' + k + '"><i class="pz-dot"></i>' + n + (dica ? '<span class="mut pp" style="text-transform:none;letter-spacing:0;font-weight:500">· ' + dica + '</span>' : '') + '<span class="mut pp" style="margin-left:auto;text-transform:none;letter-spacing:0">' + cs.length + '</span></div><div class="pz-lista">' + cs.map((c) => cartao(c, hoje)).join('') + '</div>';
      });
      if (!abertos.length) h += '<div class="card" style="margin-top:14px"><div class="vazio">' + ic('check') + '<div>Nenhum prazo em aberto' + (q ? ' com essa busca' : '') + '.</div></div></div>';
      if (feitos.length) h += '<details class="pz-feitos" id="pzf-feitos"><summary class="sec-tit"><i class="pz-dot"></i>Protocolados nos últimos 30 dias<span class="mut pp" style="margin-left:auto;text-transform:none;letter-spacing:0">' + feitos.length + '</span></summary><div class="pz-lista">' + feitos.map((c) => cartao(c, hoje)).join('') + '</div></details>';
    }
    $('#procLista').innerHTML = h;

    const achar = (id) => (d.compromissos || []).find((c) => c.id === id);
    $$('[data-pz-agr]').forEach((b) => b.onclick = () => { F.pzAgr = b.dataset.pzAgr; desenharPrazos(d, hoje); });
    $$('[data-pz-tipo]').forEach((b) => b.onclick = () => { F.pzTipo = b.dataset.pzTipo; desenharPrazos(d, hoje); });
    const lp = $('#procLista [data-limpa]'); if (lp) lp.onclick = () => { F.trib = ''; VIEWS.processos(); };
    $('#pzQ').oninput = (e) => { F.pzQ = e.target.value; const pos = e.target.selectionStart; desenharPrazos(d, hoje); const i = $('#pzQ'); i.focus(); try { i.setSelectionRange(pos, pos); } catch (er) {} };
    $$('[data-pz-ir]').forEach((b) => b.onclick = () => {
      if (F.pzAgr !== 'urg') { F.pzAgr = 'urg'; desenharPrazos(d, hoje); }
      const alvo = $('#pzf-' + b.dataset.pzIr); if (!alvo) return;
      if (alvo.tagName === 'DETAILS') alvo.open = true;
      alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $$('[data-pz-cnj]').forEach((b) => b.onclick = async (e) => {
      e.stopPropagation(); const n = b.dataset.pzCnj;
      try { await navigator.clipboard.writeText(n); toast('Número copiado'); } catch (er) { const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Número selecionado — copie com Ctrl+C'); }
    });
    $$('[data-pz] [data-pz-ed]').forEach((b) => b.onclick = () => editarCompromisso(achar(b.closest('[data-pz]').dataset.pz), d, recarregar));
    const mudar = async (c, et) => {
      if (!c || (c.etapa || 'A_FAZER') === et) return desenharPrazos(d, hoje);
      if (et === 'PROTOCOLADO' && !(await confirmar('Marcar como protocolado?', c.titulo + ' — ' + (c.cliente || '') + '. O prazo sai da lista de abertos (só no app; nada é enviado ao eproc).', 'Marcar protocolado'))) return desenharPrazos(d, hoje);
      const antes = c.etapa, antesF = c.concluido;
      c.etapa = et; c.concluido = et === 'PROTOCOLADO'; c.etapa_em = new Date().toISOString();
      desenharPrazos(d, hoje);
      try { await api('processo_prazo_etapa', { id: c.id, etapa: et }); toast(ETP_NOME[et]); }
      catch (e) { c.etapa = antes; c.concluido = antesF; desenharPrazos(d, hoje); toast(e.message, true); }
    };
    $$('[data-pz] [data-pz-et]').forEach((b) => b.onclick = () => mudar(achar(b.closest('[data-pz]').dataset.pz), b.dataset.pzEt));
    $$('[data-pz] [data-pz-sel]').forEach((sl) => sl.onchange = () => mudar(achar(sl.closest('[data-pz]').dataset.pz), sl.value));
    $('#bPzNovo').onclick = () => {
      if (!(d.itens || []).length) return toast('Cadastre um processo primeiro.', true);
      editarCompromisso({ tipo: 'PRAZO', data: '', processo_id: (d.itens || [])[0].id }, d, recarregar);
    };
    $('#bPzCopiar').onclick = async () => {
      const linhas = abertos.map((c) => { const dia = String(c.data).slice(0, 10); return dataBR(dia) + ' (' + semana(dia) + ') — ' + c.titulo + ' — ' + (c.cliente || '') + (c.numero ? ' — ' + c.numero : '') + ' [' + (ETP_NOME[c.etapa || 'A_FAZER'] || '') + ']'; });
      const txt = 'Prazos em aberto — ' + dataBR(hoje) + '\n\n' + (linhas.join('\n') || 'Nenhum.');
      try { await navigator.clipboard.writeText(txt); toast('Pauta copiada (' + linhas.length + ' prazo' + (linhas.length === 1 ? '' : 's') + ')'); }
      catch (e) { modal({ titulo: 'Pauta de prazos', corpo: '<textarea class="inp" rows="10" style="width:100%">' + esc(txt) + '</textarea>', botoes: [{ t: 'Fechar', c: 'pri', v: true }] }); }
    };
  };
})();
