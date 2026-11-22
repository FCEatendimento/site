// Aba "Radar bancário" (#/radar), 22/11/2026 — funções do skill "monitoramento-bancario" aplicadas ao app:
// SOMENTE fontes públicas oficiais (BACEN SGS, BACEN IF.data OData e CVM Dados Abertos IPE). Os números chegam prontos do fluxo
// "Pautas | Noticias" (nós "Radar: ..."); aqui só se formata. Campo sem dado na fonte = "—", nunca estimado.
// Entregas: painel na tela, "Baixar painel (.html)" e "Baixar relatório (.docx)" (biblioteca docx carregada só ao baixar).
(function () {
const css = document.createElement('style');
css.textContent = `
.rd-meta{margin:12px 2px 0;font-size:13px;color:var(--mut)}.rd-meta b{color:var(--txt)}
.rd-sub{margin:2px 2px 10px;font-size:12.5px;color:var(--mut)}
.rd-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
.rd-stat{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-sm);padding:14px 16px;box-shadow:var(--sh)}
.rd-stat .l{font-size:12px;color:var(--mut);min-height:30px}.rd-stat .v{font-family:var(--serif);font-size:24px;font-weight:700;font-variant-numeric:tabular-nums}
.rd-stat .r{font-size:11.5px;color:var(--gold, #B38A45);margin-top:4px}
.d-up{color:#C26A2B;font-weight:600}.d-down{color:#2A8C7E;font-weight:600}.d-flat{color:var(--mut)}
.rd-banks{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:12px}
.rd-bank{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:14px 18px;box-shadow:var(--sh)}
.rd-bank .hd{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:6px}
.rd-bank .nm{font-family:var(--serif);font-size:17px;font-weight:700}
.rd-tick{font-size:11px;letter-spacing:.08em;background:var(--gold-soft);color:#8a6a2c;padding:3px 8px;border-radius:20px;font-weight:700}
.rd-coop{font-size:11px;color:#2A8C7E;border:1px solid #2A8C7E;padding:2px 8px;border-radius:20px}
.rd-bank .ln{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed var(--line);font-size:13.5px}
.rd-bank .ln:last-child{border-bottom:0}.rd-bank .ln span:first-child{color:var(--mut)}.rd-bank .ln span:last-child{font-weight:600;font-variant-numeric:tabular-nums}
.rd-vazio{border:1px dashed var(--line);border-radius:var(--r-sm);padding:16px 18px;color:var(--mut);font-size:13.5px;background:var(--surface)}
.rd-aviso{margin-top:14px;font-size:12.5px;color:var(--warn);background:var(--warn-soft);border-radius:var(--r-sm);padding:10px 12px}
`;
document.head.appendChild(css);

const MESES = ['', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const ok = (v) => v !== null && v !== undefined && isFinite(Number(v));
const br = (x, c) => { const s = Number(x).toLocaleString('pt-BR', { minimumFractionDigits: c, maximumFractionDigits: c }); return s.startsWith('-') ? '−' + s.slice(1) : s; };
const money = (v, c) => { if (!ok(v)) return '—'; const a = Math.abs(v), d = c == null ? 1 : c;
  return a >= 1e12 ? 'R$ ' + br(v / 1e12, d) + ' tri' : a >= 1e9 ? 'R$ ' + br(v / 1e9, d) + ' bi' : a >= 1e6 ? 'R$ ' + br(v / 1e6, d) + ' mi' : a >= 1e3 ? 'R$ ' + br(v / 1e3, d) + ' mil' : 'R$ ' + br(v, 0); };
const pct = (v, c) => ok(v) ? br(v, c == null ? 2 : c) + '%' : '—';
const mesAno = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})/); return m ? MESES[Number(m[2])] + '/' + m[1] : '—'; };
const dataBr = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : '—'; };
const refMacro = (x) => { if (!x.data) return '—'; const hoje = new Date().toISOString().slice(0, 10); return x.tipo === 'brl4' || x.chave === 'selic' || x.chave === 'cdi' ? (x.data > hoje ? 'vigente' : dataBr(x.data)) : mesAno(x.data); };
const baseLabel = (am) => { const m = String(am || '').match(/^(\d{4})(\d{2})$/); if (!m) return '—'; const mm = Number(m[2]); return MESES[mm] + '/' + m[1] + ' (' + Math.ceil(mm / 3) + 'º tri)'; };
const ARROW = { up: '▲', down: '▼', flat: '—' };

// mesma preparação do gerar_relatorio.py: cartões macro, linhas de crédito com ▲/▼ vs. mês anterior, cartões dos bancos e provisão
function preparar(d) {
  const macro = (d.macro || []).map((x) => ({ l: x.nome, v: !ok(x.valor) ? '—' : x.tipo === 'brl4' ? 'R$ ' + br(x.valor, 4) : pct(x.valor), r: ok(x.valor) ? refMacro(x) : '—', f: 'SGS ' + x.cod }));
  const cred = (d.credito || []).filter((x) => ok(x.valor)).map((x) => {
    const pv = ok(x.anterior) ? x.anterior : x.valor, delta = x.valor - pv;
    let val, dl;
    if (x.tipo === 'money_mn') { val = money(x.valor * 1e6, 1); const chg = pv ? (delta / pv) * 100 : 0; dl = (delta >= 0 ? '+' : '−') + br(Math.abs(chg), 2) + '%'; }
    else if (x.tipo === 'pp') { val = br(x.valor, 2) + ' p.p.'; dl = (delta >= 0 ? '+' : '−') + br(Math.abs(delta), 2) + ' p.p.'; }
    else { val = pct(x.valor); dl = (delta >= 0 ? '+' : '−') + br(Math.abs(delta), 2) + ' p.p.'; }
    return { l: x.nome, ref: mesAno(x.data), val, delta: ok(x.anterior) ? dl : '—', dir: !ok(x.anterior) ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat', f: 'SGS ' + x.cod };
  });
  const bancos = (d.bancos || []).map((b) => ({ tk: b.id, nome: b.nome, coop: b.coop, lucro: money(b.lucro_liquido), pl: money(b.patrimonio_liquido), ativo: money(b.ativo_total), carteira: money(b.carteira_credito),
    provisao: money(b.perda_esperada_credito), basileia: ok(b.indice_basileia) ? pct(b.indice_basileia * 100) : '—', total: money(b.perda_esperada_total), cobertura: ok(b.cobertura) ? pct(b.cobertura * 100) : '—', matched: b.matched }));
  return { gen: d.gerado_em, base: baseLabel((d.ifdata || {}).base), macro, cred, bancos, ipe: d.ipe || { fatos: [] }, avisos: d.avisos || [], fontes: d.fontes || [] };
}

function corpoHtml(D) {
  let h = '<div class="sec-tit">Cenário macroeconômico · indicadores de referência</div><p class="rd-sub">Sistema Gerenciador de Séries Temporais (SGS/BACEN).</p><div class="rd-stats">' +
    D.macro.map((m) => '<div class="rd-stat"><div class="l">' + esc(m.l) + '</div><div class="v">' + esc(m.v) + '</div><div class="r">' + esc(m.r) + ' · ' + esc(m.f) + '</div></div>').join('') + '</div>';
  h += '<div class="sec-tit">Crédito no SFN · variação mensal</div><p class="rd-sub">Nota de Estatísticas Monetárias e de Crédito (BACEN). Seta = direção frente ao mês anterior (direção, não mérito).</p>' +
    '<div class="card tab-wrap"><table class="tb"><thead><tr><th>Indicador</th><th>Referência</th><th>Valor</th><th>vs. mês anterior</th></tr></thead><tbody>' +
    D.cred.map((x) => '<tr><td><b>' + esc(x.l) + '</b><div class="pp mut" style="font-size:11px">' + esc(x.f) + '</div></td><td>' + esc(x.ref) + '</td><td><b>' + esc(x.val) + '</b></td><td class="d-' + x.dir + '">' + ARROW[x.dir] + ' ' + esc(x.delta) + '</td></tr>').join('') +
    '</tbody></table></div><p class="rd-sub" style="margin-top:6px">Legenda: <span class="d-up">▲ alta</span> · <span class="d-down">▼ queda</span> vs. mês anterior.</p>';
  h += '<div class="sec-tit">Instituições monitoradas · resumo por banco · ' + esc(D.base) + '</div><p class="rd-sub">Conglomerado prudencial (IF.data/BACEN).</p><div class="rd-banks">' +
    D.bancos.map((b) => '<div class="rd-bank"><div class="hd"><div class="nm">' + esc(b.nome) + '</div>' + (b.coop ? '<span class="rd-coop">cooperativa</span>' : '<span class="rd-tick">' + esc(b.tk) + '</span>') + '</div>' +
      [['Lucro líquido', b.lucro], ['Patrimônio líquido', b.pl], ['Ativo total', b.ativo], ['Carteira de crédito', b.carteira], ['Provisão (perda esperada)', b.provisao], ['Índice de Basileia', b.basileia]]
        .map(([k, v]) => '<div class="ln"><span>' + k + '</span><span>' + esc(v) + '</span></div>').join('') + '</div>').join('') + '</div>';
  h += '<div class="sec-tit">Res. CMN 4.966 · provisionamento por banco</div><p class="rd-sub">IF.data, relatório Ativo. Sob a Res. CMN 4.966 a <b>provisão constituída é a própria perda esperada</b> (estoque). "Crédito" = provisão sobre operações de crédito (maior componente); "Total" = soma de todos os componentes de perda esperada (não inclui perda incorrida). "Cobertura" = provisão de crédito ÷ carteira de crédito: quanto da carteira o banco já provisionou, base para discutir deságio.</p>' +
    '<div class="card tab-wrap"><table class="tb"><thead><tr><th>Banco</th><th>Provisão — crédito</th><th>Provisão — total</th><th>Cobertura da carteira</th></tr></thead><tbody>' +
    D.bancos.map((b) => '<tr><td><b>' + esc(b.nome) + '</b></td><td>' + esc(b.provisao) + '</td><td>' + esc(b.total) + '</td><td><b>' + esc(b.cobertura) + '</b></td></tr>').join('') + '</tbody></table></div>';
  const ipe = D.ipe; const fatos = ipe.fatos || [];
  h += '<div class="sec-tit">CVM · IPE · fatos relevantes e comunicados (últimos 90 dias)</div><p class="rd-sub">Portal de Dados Abertos da CVM (Fato Relevante, Comunicado ao Mercado, Press-release, Dados Econômico-Financeiros).</p>';
  if (fatos.length) h += '<div class="card tab-wrap"><table class="tb"><thead><tr><th>Data</th><th style="text-align:left">Banco</th><th style="text-align:left">Categoria</th><th style="text-align:left">Assunto</th><th>Documento</th></tr></thead><tbody>' +
    fatos.map((f) => '<tr><td>' + esc(dataBr(f.data)) + '</td><td style="text-align:left">' + esc(f.banco_nome) + '</td><td style="text-align:left">' + esc(f.categoria) + '</td><td style="text-align:left;white-space:normal">' + esc(String(f.assunto || '').slice(0, 120)) + '</td><td>' + (f.link ? '<a href="' + esc(f.link) + '" target="_blank" rel="noopener">abrir ↗</a>' : '—') + '</td></tr>').join('') + '</tbody></table></div>';
  else { const ult = Object.entries(ipe.ultimo_por_banco || {}).map(([k, v]) => ((D.bancos.find((b) => b.tk === k) || {}).nome || k) + ': ' + dataBr(v)).join('; ') || '—';
    h += '<div class="rd-vazio"><p><b>Nenhum documento no período (últimos 90 dias, desde ' + esc(dataBr(ipe.corte)) + ').</b></p><p>Documento mais recente por banco nas categorias monitoradas: ' + esc(ult) + '.</p><p style="font-size:12.5px">Instituições sem ações registradas na CVM (cooperativas, bancos 100% públicos ou emissores no exterior) normalmente não apresentam fatos relevantes na IPE.</p></div>'; }
  if (D.avisos.length) h += '<div class="rd-aviso"><b>Fontes que não responderam nesta coleta</b> (campos ficam "—", nada é estimado): ' + D.avisos.map(esc).join(' · ') + '</div>';
  h += '<p class="pp mut" style="margin:16px 2px 0">Dados exclusivamente de fontes públicas oficiais: ' + D.fontes.map((f) => '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.nome) + '</a>').join(', ') + '. Sicoob e Sicredi: conglomerado prudencial do banco cooperativo central de cada sistema. Material informativo; não constitui recomendação de investimento. Atualizado todo dia às 6h23. Uso interno.</p>';
  return h;
}

// ---------- painel HTML autônomo (dashboard escuro, para guardar ou enviar) ----------
function painelHtml(D) {
  const st = `:root{--bg:#0a0e17;--panel:#131b2b;--panel2:#182236;--line:#243149;--ink:#e8edf6;--sub:#93a1b8;--gold:#c9a24b;--gold2:#e3c078;--teal:#3fb6a8;--amber:#e0863f;--surface:#131b2b;--mut:#93a1b8;--txt:#e8edf6;--r:14px;--r-sm:12px;--serif:Georgia,serif;--sh:none;--gold-soft:#e3c078;--warn:#e0863f;--warn-soft:#2a1f14}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(1200px 600px at 20% -10%,#16203a 0%,var(--bg) 55%) fixed,var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;line-height:1.5}
.wrap{max-width:1180px;margin:0 auto;padding:36px 16px 60px}header{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:10px}
.brand{font-size:13px;letter-spacing:.28em;text-transform:uppercase;color:var(--gold);font-weight:600}h1{font-family:Georgia,serif;font-size:32px;margin:10px 0 6px}
.sec-tit{font-family:Georgia,serif;font-size:20px;margin:36px 0 4px}.pp{font-size:13px}.mut{color:var(--sub)}a{color:var(--gold2)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px}.tab-wrap{overflow-x:auto}
table.tb{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}table.tb th{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--sub);padding:12px 14px;background:#0f1626;border-bottom:1px solid var(--line);text-align:right}
table.tb td{padding:11px 14px;border-bottom:1px solid #1a2437;text-align:right;white-space:nowrap}table.tb th:first-child,table.tb td:first-child{text-align:left}
.rd-tick{color:#0a0e17;background:var(--gold2)}.rd-coop{color:var(--teal);border-color:var(--teal)}.d-up{color:var(--amber)}.d-down{color:var(--teal)}
footer{margin-top:44px;border-top:1px solid var(--line);padding-top:16px;color:#61708a;font-size:12px}` + css.textContent;
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Painel de Monitoramento Bancário</title><style>' + st + '</style></head><body><div class="wrap">' +
    '<header><div class="brand">FCE Advogados · Inteligência Bancária</div><h1>Painel de Monitoramento Bancário</h1><div class="pp mut">Gerado em <b>' + esc(fmtD(D.gen, { dateStyle: 'long', timeStyle: 'short' })) + '</b> · Base regulatória IF.data: <b>' + esc(D.base) + '</b> · Fontes oficiais: BACEN (SGS · IF.data) e CVM (IPE)</div></header>' +
    corpoHtml(D) + '<footer>Relatório automático · FCE Advogados. Dados de fontes públicas oficiais (BACEN SGS, BACEN IF.data OData, CVM Dados Abertos IPE). Material informativo; não constitui recomendação de investimento.</footer></div></body></html>';
}
function baixar(blob, nome) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

// ---------- relatório .docx (mesmas seções) ----------
let docxLib = null;
function carregarDocx() {
  if (window.docx) return Promise.resolve(window.docx);
  if (docxLib) return docxLib;
  docxLib = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js'; s.onload = () => res(window.docx); s.onerror = () => { docxLib = null; rej(new Error('Não foi possível carregar o gerador de .docx.')); }; document.head.appendChild(s); });
  return docxLib;
}
async function gerarDocx(D) {
  const X = await carregarDocx();
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, BorderStyle, ExternalHyperlink } = X;
  const NAVY = '1B263B', GOLD = 'B0882E', GREY = '667082', AMBER = 'B55E1F', TEAL = '1E7A6E';
  const run = (t, o) => new TextRun(Object.assign({ text: String(t), size: 20, font: 'Calibri' }, o || {}));
  const par = (kids, o) => new Paragraph(Object.assign({ children: Array.isArray(kids) ? kids : [kids] }, o || {}));
  const h1 = (t) => par(run(t, { bold: true, size: 28, color: NAVY }), { spacing: { before: 320, after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, space: 3, color: GOLD } } });
  const sub = (t) => par(run(t, { size: 17, color: GREY, italics: true }), { spacing: { after: 160 } });
  const bd = { style: BorderStyle.SINGLE, size: 4, color: 'C8CDD3' };
  const cel = (t, o) => new TableCell({ borders: { top: bd, bottom: bd, left: bd, right: bd }, shading: o && o.head ? { type: ShadingType.CLEAR, color: 'auto', fill: NAVY } : undefined,
    children: [par(o && o.link ? new ExternalHyperlink({ link: o.link, children: [run(t, { size: 18, color: GOLD, underline: {} })] }) : run(t, { size: o && o.head ? 17 : 18, bold: !!(o && (o.head || o.bold)), color: o && o.head ? 'FFFFFF' : (o && o.color) || '222A38' }),
      { alignment: o && o.right ? AlignmentType.RIGHT : AlignmentType.LEFT })] });
  const tab = (cab, linhas, dir) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ tableHeader: true, children: cab.map((c, i) => cel(c, { head: true, right: dir && dir[i] })) })].concat(linhas.map((l) => new TableRow({ children: l.map((c, i) => cel(c.t != null ? c.t : c, Object.assign({ right: dir && dir[i] }, c.t != null ? c : {}))) }))) });
  const corpo = [
    par(run('FCE ADVOGADOS · INTELIGÊNCIA BANCÁRIA', { bold: true, size: 16, color: GOLD })),
    par(run('Relatório de Monitoramento Bancário', { bold: true, size: 44, color: NAVY }), { spacing: { after: 40 } }),
    par(run('Gerado em ' + fmtD(D.gen, { dateStyle: 'long', timeStyle: 'short' }) + '  ·  Base regulatória IF.data: ' + D.base, { size: 19 })),
    par(run('Fontes oficiais: BACEN (SGS e IF.data OData) e CVM (Portal de Dados Abertos — IPE).', { size: 18, color: GREY }), { spacing: { after: 120 } }),
    h1('1. Cenário macroeconômico'), sub('Sistema Gerenciador de Séries Temporais (SGS/BACEN).'),
    tab(['Indicador', 'Valor', 'Referência'], D.macro.map((m) => [{ t: m.l, bold: true }, { t: m.v, bold: true, color: NAVY }, { t: m.r, color: GOLD }]), [0, 1, 1]),
    h1('2. Indicadores de crédito — variação mensal'), sub('Nota de Estatísticas Monetárias e de Crédito (BACEN). Seta indica a direção frente ao mês anterior.'),
    tab(['Indicador', 'Ref.', 'Valor', 'vs. mês ant.'], D.cred.map((x) => [{ t: x.l, bold: true }, { t: x.ref, color: GOLD }, { t: x.val, bold: true, color: NAVY }, { t: ARROW[x.dir] + ' ' + x.delta, bold: true, color: x.dir === 'up' ? AMBER : x.dir === 'down' ? TEAL : GREY }]), [0, 1, 1, 1]),
    h1('3. Resumo por banco — ' + D.base), sub('Conglomerado prudencial (IF.data/BACEN): lucro, PL, ativo, carteira, provisão e Índice de Basileia.'),
    tab(['Banco', 'Lucro líq.', 'Patrim. líq.', 'Ativo total', 'Carteira créd.', 'Provisão (PE)', 'Basileia'], D.bancos.map((b) => [{ t: b.nome, bold: true }, b.lucro, b.pl, b.ativo, b.carteira, b.provisao, b.basileia]), [0, 1, 1, 1, 1, 1, 1]),
    h1('4. Provisionamento por banco — Res. CMN 4.966'), sub('IF.data, relatório Ativo. Sob a Res. CMN 4.966 a provisão constituída é a própria perda esperada (estoque). "Crédito" = provisão sobre operações de crédito (maior componente); "Total" = soma de todos os componentes de perda esperada (não inclui perda incorrida). "Cobertura" = provisão de crédito ÷ carteira de crédito.'),
    tab(['Banco', 'Provisão — crédito', 'Provisão — total', 'Cobertura da carteira'], D.bancos.map((b) => [{ t: b.nome, bold: true }, b.provisao, b.total, { t: b.cobertura, bold: true, color: NAVY }]), [0, 1, 1, 1]),
    h1('5. Fatos relevantes e comunicados — últimos 90 dias'), sub('Portal de Dados Abertos da CVM (Fato Relevante, Comunicado ao Mercado, Press-release, Dados Econômico-Financeiros).')
  ];
  const ipe = D.ipe, fatos = ipe.fatos || [];
  if (fatos.length) corpo.push(tab(['Data', 'Banco', 'Categoria', 'Assunto', 'Link'], fatos.map((f) => [dataBr(f.data), { t: f.banco_nome, bold: true }, f.categoria, String(f.assunto || '').slice(0, 110), f.link ? { t: 'abrir', link: f.link } : '—'])));
  else { const ult = Object.entries(ipe.ultimo_por_banco || {}).map(([k, v]) => ((D.bancos.find((b) => b.tk === k) || {}).nome || k) + ': ' + dataBr(v)).join('; ') || '—';
    corpo.push(par(run('Nenhum documento no período (últimos 90 dias, desde ' + dataBr(ipe.corte) + ').', { bold: true, color: NAVY })), par(run('Documento mais recente por banco nas categorias monitoradas: ' + ult + '.', { size: 19 })),
      par(run('Instituições sem ações registradas na CVM (cooperativas, bancos 100% públicos ou emissores no exterior) normalmente não apresentam fatos relevantes na IPE.', { size: 17, color: GREY, italics: true }))); }
  if (D.avisos.length) { corpo.push(h1('Fontes que não responderam nesta coleta')); D.avisos.forEach((a) => corpo.push(par(run('• ' + a, { size: 18 })))); }
  corpo.push(par(run(''), {}), par(run('Relatório automático · FCE Advogados. Dados exclusivamente de fontes públicas oficiais (BACEN SGS, BACEN IF.data OData e CVM Dados Abertos IPE). Material informativo; não constitui recomendação de investimento.', { size: 16, color: GREY, italics: true })));
  const doc = new Document({ creator: 'FCE Advogados', title: 'Relatório de Monitoramento Bancário', sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1247, right: 1247 } } }, children: corpo }] });
  return Packer.toBlob(doc);
}

VIEWS.radar = async (_, forcar) => {
  titulo('Radar bancário', '<button class="btn sm" id="rdDocx">' + ic('baixar', 's') + '<span class="so-desk"> Relatório .docx</span></button><button class="btn sm fant" id="rdHtml">' + ic('baixar', 's') + '<span class="so-desk"> Painel .html</span></button>');
  if (!S.cache.radar) carregando(4);
  const d = await dados('radar', 'radar', null, forcar);
  if (!d) { $('#cont').innerHTML = '<div class="card" style="margin-top:14px"><div class="vazio">' + ic('grafico') + '<div>O radar ainda não foi gerado. A coleta roda todo dia às 6h23.</div></div></div>'; return; }
  const D = preparar(d);
  $('#cont').innerHTML = '<p class="rd-meta">Gerado em <b>' + esc(fmtD(D.gen, { dateStyle: 'long', timeStyle: 'short' })) + '</b> · Base regulatória IF.data: <b>' + esc(D.base) + '</b> · Fontes oficiais: BACEN (SGS · IF.data) e CVM (IPE)</p>' + corpoHtml(D);
  const dia = String(D.gen || '').slice(0, 10);
  const bD = $('#rdDocx'); if (bD) bD.onclick = async () => { bD.disabled = true; try { baixar(await gerarDocx(D), 'relatorio_monitoramento_bancario_' + dia + '.docx'); toast('Relatório .docx baixado.'); } catch (e) { toast(e.message || 'Não foi possível gerar o .docx.', true); } finally { bD.disabled = false; } };
  const bH = $('#rdHtml'); if (bH) bH.onclick = () => { baixar(new Blob([painelHtml(D)], { type: 'text/html;charset=utf-8' }), 'painel_monitoramento_bancario_' + dia + '.html'); toast('Painel .html baixado.'); };
};
})();
