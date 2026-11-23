// Aba "Comercial" (#/comercial), 22/11/2026 — conteúdo da planilha Gestao_Comercial (metas, funil, CAC/LTV, time, rituais, precificação REPB),
// do mapa "Qualificação do Lead" e do fluxo do setor jurídico (extrajudicial). Material interno de trabalho: calculadoras e roteiros.
// Não grava nada no banco e não chama a API: os números digitados ficam só na tela (checklist em localStorage).
(function () {
const css = document.createElement('style');
css.textContent = `
.cm{margin-top:12px;display:grid;gap:12px}
.cm-c{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;box-shadow:var(--sh)}
.cm-c h3{margin:0 0 4px;font-family:var(--serif);font-size:18px}.cm-c .sub{margin:0 0 12px;color:var(--mut);font-size:13px}
.cm-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px 14px}
.cm-f{display:flex;flex-direction:column;gap:5px;font-size:13px}.cm-f>span{color:var(--mut);font-weight:600}
.cm-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}
.cm-kpi div{background:color-mix(in srgb,var(--txt) 3%,transparent);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:12px;color:var(--mut)}
.cm-kpi b{display:block;font-size:20px;color:var(--txt);font-family:var(--serif);font-variant-numeric:tabular-nums}
.cm-kpi div.ok b{color:var(--ok)}.cm-kpi div.bad b{color:var(--bad)}.cm-kpi div.gold b{color:var(--gold)}
.cm-t{width:100%;border-collapse:collapse;font-size:13.5px}
.cm-t th{text-align:left;font-size:11.5px;letter-spacing:.06em;color:var(--mut);padding:6px 8px;border-bottom:1px solid var(--line)}
.cm-t td{padding:8px;border-bottom:1px dashed var(--line);vertical-align:top}.cm-t tr:last-child td{border-bottom:0}
.cm-t td.n{font-variant-numeric:tabular-nums;white-space:nowrap}
.cm-tw{overflow-x:auto}
.cm-chip{display:inline-block;font-size:12px;font-weight:700;padding:2px 10px;border-radius:10px;background:var(--info-soft);color:var(--info)}
.cm-chip.repb{background:var(--ok-soft);color:var(--ok)}.cm-chip.se{background:var(--warn-soft);color:var(--warn)}.cm-chip.sepb{background:var(--gold-soft);color:var(--gold)}
.cm-chip.bad{background:var(--bad-soft);color:var(--bad)}
.cm-fase{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:12px}
.cm-fase .cm-c{padding:14px 16px}.cm-fase h4{margin:0 0 8px;font-size:15px;display:flex;gap:8px;align-items:center}
.cm-fase h4 i{font-style:normal;width:24px;height:24px;border-radius:50%;background:var(--navy);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:12px}
.cm-fase ul{margin:0;padding-left:18px}.cm-fase li{margin:5px 0;line-height:1.4;font-size:13.5px}
.cm-ck{display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-bottom:1px dashed var(--line);font-size:13.5px;cursor:pointer}
.cm-ck:last-child{border-bottom:0}.cm-ck input{margin-top:3px}
.cm-aviso{font-size:12.5px;color:var(--mut);margin:8px 2px 0}
`;
document.head.appendChild(css);

const br = (v, c) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: c || 0, maximumFractionDigits: c || 0 });
const R = (v) => 'R$ ' + br(v, 0);
const num = (id) => { const e = document.getElementById(id); const v = e ? parseFloat(String(e.value).replace(/\./g, '').replace(',', '.')) : NaN; return isFinite(v) ? v : 0; };
const campo = (id, rot, val, extra) => '<label class="cm-f"><span>' + esc(rot) + '</span><input class="inp" id="' + id + '" inputmode="decimal" value="' + esc(val) + '" ' + (extra || '') + '></label>';
const tabela = (cab, linhas) => '<div class="cm-tw"><table class="cm-t"><thead><tr>' + cab.map((c) => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
  linhas.map((l) => '<tr>' + l.map((c, i) => '<td' + (i && /^[R$\d]/.test(String(c)) && String(c).length < 22 ? ' class="n"' : '') + '>' + (typeof c === 'object' ? c.h : esc(c)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const chip = (t, k) => ({ h: '<span class="cm-chip ' + (k || '') + '">' + esc(t) + '</span>' });
const card = (t, sub, corpo) => '<div class="cm-c"><h3>' + esc(t) + '</h3>' + (sub ? '<p class="sub">' + esc(sub) + '</p>' : '') + corpo + '</div>';

// ---------- 1. Metas e funil ----------
function abaFunil() {
  const conv = [['Lead → Agendamento', 40], ['Agendamento → Atendimento', 70], ['Atendimento → Proposta', 80], ['Proposta → Fechamento', 30]];
  return card('Quanto preciso gerar para bater a meta', 'Regra de 3 de baixo para cima: meta de receita ÷ ticket médio = contratos; depois divide pelas taxas de conversão de cada etapa. Números de partida da planilha; altere à vontade.',
    '<div class="cm-g">' + campo('cmMeta', 'Meta de receita (R$)', '200000') + campo('cmTk', 'Ticket médio (R$)', '13997') +
    conv.map((c, i) => campo('cmC' + i, c[0] + ' (%)', String(c[1]))).join('') + '</div><div class="cm-kpi" id="cmFunOut"></div>' +
    '<p class="cm-aviso">A etapa com a menor taxa realizada é o gargalo do funil: é nela que o time deve focar primeiro. Os números reais do mês estão em Indicadores.</p>');
}
function calcFunil() {
  const meta = num('cmMeta'), tk = num('cmTk'), c = [0, 1, 2, 3].map((i) => num('cmC' + i) / 100);
  const o = $('#cmFunOut'); if (!o) return;
  if (!meta || !tk || c.some((x) => x <= 0)) { o.innerHTML = '<div>Preencha meta, ticket e as quatro taxas.</div>'; return; }
  const ct = Math.ceil(meta / tk), pr = Math.ceil(ct / c[3]), at = Math.ceil(pr / c[2]), ag = Math.ceil(at / c[1]), ld = Math.ceil(ag / c[0]);
  o.innerHTML = [['Contratos a fechar', ct, 'ok'], ['Propostas a enviar', pr], ['Atendimentos a realizar', at], ['Agendamentos a marcar', ag], ['Leads a gerar (topo)', ld, 'gold']].map((x) => '<div class="' + (x[2] || '') + '">' + x[0] + '<b>' + br(x[1]) + '</b></div>').join('');
}

// ---------- 2. CAC, LTV e time ----------
const RITUAIS = [['Daily de vendas', 'Diária', '15 min', 'Foco do dia e bloqueios'], ['Revisão de pipeline', 'Semanal', '45 min', 'Onde está cada negócio e qual a próxima ação'], ['1:1 individual', 'Semanal', '30 min', 'Metas e desenvolvimento de cada pessoa'], ['Role-play de objeção', 'Semanal', '30 min', 'Treino das objeções mais comuns'], ['Reunião de resultado', 'Mensal', '1 h', 'Números do mês e etapa-gargalo']];
const TIME = [['SDR', 'Reuniões qualificadas por mês', '40'], ['Closer', 'Taxa de fechamento', '30%'], ['Closer', 'Contratos fechados por mês', '10'], ['Gestor', 'Receita do time', 'R$ 200.000'], ['CS / Pós-venda', 'Indicações por cliente', '2']];
const CHECK = ['Todo lead entra no CRM no mesmo dia', 'Cada negócio tem etapa e próxima ação', 'Conversão medida por etapa', 'Follow-up para 100% das propostas', 'Meta individual clara para cada pessoa', 'Pipeline revisado semanalmente', 'Motivo de cada "não" registrado', 'Indicação pedida a todo cliente satisfeito'];
function abaCac() {
  let marc = {}; try { marc = JSON.parse(localStorage.getItem('fce_cm_check') || '{}'); } catch (e) {}
  return card('CAC e LTV', 'CAC = investimento ÷ clientes ganhos. LTV = ticket médio × contratos por cliente. Saudável: LTV ÷ CAC maior ou igual a 3.',
    '<div class="cm-g">' + campo('cmInv', 'Investimento no período (R$)', '7000') + campo('cmCli', 'Clientes ganhos', '12') + campo('cmTk2', 'Ticket médio (R$)', '12000') + campo('cmCtr', 'Contratos por cliente', '1') + '</div><div class="cm-kpi" id="cmCacOut"></div>') +
    card('Metas do time por função', 'Estrutura da planilha: uma métrica principal por função.', tabela(['Função', 'Métrica principal', 'Meta'], TIME)) +
    card('Rituais de gestão', 'Cadência que mantém o time olhando para o mesmo número.', tabela(['Ritual', 'Frequência', 'Duração', 'Para quê'], RITUAIS)) +
    card('Checklist de gestão de vendas', 'Marque o que já está em dia (fica salvo neste aparelho).', CHECK.map((t, i) => '<label class="cm-ck"><input type="checkbox" data-cmck="' + i + '"' + (marc[i] ? ' checked' : '') + '><span>' + esc(t) + '</span></label>').join(''));
}
function calcCac() {
  const o = $('#cmCacOut'); if (!o) return;
  const inv = num('cmInv'), cli = num('cmCli'), tk = num('cmTk2'), ct = num('cmCtr');
  if (!cli) { o.innerHTML = '<div>Informe os clientes ganhos.</div>'; return; }
  const cac = inv / cli, ltv = tk * (ct || 1), r = cac ? ltv / cac : 0;
  o.innerHTML = '<div>CAC<b>' + R(cac) + '</b></div><div>LTV<b>' + R(ltv) + '</b></div><div class="' + (r >= 3 ? 'ok' : 'bad') + '">LTV ÷ CAC<b>' + br(r, 1) + 'x</b>' + (r >= 3 ? 'saudável' : 'abaixo de 3x') + '</div>';
}

// ---------- 3. Honorários REPB ----------
const FAIXAS = [[0, 15, 7500, 1997, 697], [75000, 10, 9997, 2997, 797], [115000, 11, 13997, 3997, 997]];
function abaHon() {
  return card('Calculadora de honorários (REPB)', 'Busca a faixa pelo saldo devedor e soma o êxito sobre o proveito econômico. Referência da planilha; confira com a política do escritório e a tabela da OAB/RS.',
    '<div class="cm-g">' + campo('cmSd', 'Saldo devedor do cliente (R$)', '130000') + campo('cmPe', 'Proveito econômico estimado (R$)', '60000') + campo('cmEx', 'Honorário de êxito (%)', '20') + '</div><div class="cm-kpi" id="cmHonOut"></div>') +
    card('Tabela de referência REPB (por saldo devedor)', 'Parcelamento da entrada + 10 parcelas.', tabela(['A partir de', '% inicial', 'À vista', 'Entrada', '10 parcelas'], FAIXAS.map((f) => [R(f[0]), f[1] + '%', R(f[2]), R(f[3]), R(f[4])]))) +
    card('Inadimplente: faixas de percentual', 'Iniciais sobre o saldo devedor e proveito sobre a redução obtida.', tabela(['Faixa de saldo devedor', 'Percentual'], [['R$ 50 mil – 100 mil', '10% – 20%'], ['R$ 110 mil – 200 mil', '10% – 15%'], ['R$ 210 mil – 500 mil', '10% – 13%'], ['R$ 500 mil – 1 milhão', '10%'], ['R$ 1 milhão – 10 milhões', '5% – 10%'], ['Acima de R$ 10 milhões', '3% – 8%']]) +
      '<p class="cm-aviso">Já existe execução: análise de risco + adicional de urgência + 10% na entrada. Sem execução: precificação padrão. Todas as carteiras podem ser trabalhadas; exceção: SFH, salvo em caso de leilão.</p>') +
    card('Adimplente', 'Elegibilidade pela classe do contrato e honorários.', tabela(['Classe', 'Elegibilidade'], [['C1 e C2', 'Baixa'], ['C3', 'Intermediária'], ['C4', 'Alta'], ['C5', 'Alta (exceção: cartão de crédito)']]) +
      tabela(['Item', 'Regra'], [['Iniciais contratuais', '10% do passivo bancário'], ['Êxito contratuais', '20% do proveito econômico'], ['Perícia contratual', 'Havendo risco de inadimplência, migra para a tabela do inadimplente'], ['Malote de auditoria', 'R$ 1.000 por banco'], ['Malote DDA', 'Valor do DDA (ex.: desconto de R$ 5.000 = honorários R$ 5.000)']])) +
    card('Campanha: cliente que não contratou REPB', 'Gatilhos de meta para reabrir a conversa de preço.', tabela(['Gatilho', 'Quando', 'Ação na precificação'], [['Metinha batida ou prestes a bater', 'Última quinzena', 'Baixar ao valor mínimo da tabela'], ['Meta batida ou prestes a bater a supermeta', 'Última semana', 'Desconto de 5% sobre a tabela'], ['Supermeta batida', '—', 'Manter a precificação']]));
}
function calcHon() {
  const o = $('#cmHonOut'); if (!o) return;
  const sd = num('cmSd'), pe = num('cmPe'), ex = num('cmEx') / 100;
  if (!sd) { o.innerHTML = '<div>Informe o saldo devedor.</div>'; return; }
  let f = FAIXAS[0]; FAIXAS.forEach((x) => { if (sd >= x[0]) f = x; });
  const exito = pe * ex, vista = f[2];
  o.innerHTML = '<div>% inicial da faixa<b>' + f[1] + '%</b></div><div class="gold">Inicial à vista<b>' + R(vista) + '</b></div><div>Entrada + 10x<b>' + R(f[3]) + ' + 10x ' + R(f[4]) + '</b></div><div>Inicial (saldo × %)<b>' + R(sd * f[1] / 100) + '</b></div><div>Êxito previsto<b>' + R(exito) + '</b></div><div class="ok">Potencial total (à vista + êxito)<b>' + R(vista + exito) + '</b></div>';
}

// ---------- 4. Qualificação do lead ----------
function abaQual() {
  const rs = { REPB: 'repb', SE: 'se', 'SE + REPB': 'sepb' };
  const C = (t) => chip(t, rs[t] || '');
  const serv = [
    ['Dívidas consignadas + pessoais', 'Análise segmentada: acima de 60% (SE + DDA)', C('SE + REPB'), 'Depende do estado'],
    ['', 'Acima de 60% (SE + DDA)', 'Revisional (sanção) + readequação de margem + REPB', 'Por conta da decisão do STF'],
    ['', 'Abaixo de 60% (DDA)', C('REPB'), ''],
    ['Dívidas consignadas', 'Acima de 60%: readequação de margem', C('SE'), 'Depende do estado'],
    ['', 'Acima de 60%: readequação de margem', 'Revisional (sanção, art. 54-D do CDC) + readequação de margem', 'Por conta da decisão do STF'],
    ['Dívidas pessoais', '—', C('REPB'), '']];
  const emp = [
    ['Em dia', 'Verificar viabilidade jurídica', 'Revisional estratégica', ''],
    ['Em dia', 'Analisar o contrato', '', ''],
    ['Inadimplente', 'Valor da dívida', 'Não é preciso analisar o contrato para fechar', ''],
    ['Inadimplente, análise de risco', 'Execução', '', ''],
    ['', 'Instituição financeira', 'Cooperativa', chip('Margem de negociação menor', 'bad')],
    ['', 'Instituição financeira', 'Bradesco (ex.: capitalização diária)', chip('Margem de negociação melhor', 'repb')],
    ['', 'Tipo de contrato', 'Pronampe', chip('Margem de negociação menor', 'bad')],
    ['', 'Tipo de contrato', 'Capital de giro sem garantia', chip('Margem de negociação melhor', 'repb')],
    ['', 'Tipo de contrato', 'Cartão de crédito + cheque especial', chip('Margem de negociação melhor', 'repb')],
    ['Inadimplente, serviço jurídico', '', '', C('REPB')]];
  return card('Servidor público ou CLT', 'Caminho conforme o tipo de dívida.', tabela(['Tipo de dívida', 'Análise', 'Caminho', 'Observação'], serv)) +
    card('Empresário', 'Caminho conforme a situação do contrato.', tabela(['Situação', 'Fator', 'Detalhe', 'Resultado'], emp)) +
    '<p class="cm-aviso">SE e DDA estão como no mapa original. Para atender um cliente com dívida bancária e ver os caminhos calculados a partir das respostas, abra <a href="#/bancario">Atendimento bancário</a>.</p>';
}

// ---------- 5. Fluxo do jurídico ----------
const FASES = [
  ['Dossiê circunstancial', ['Extrajudicial: contrato adimplente ou inadimplente', 'Cadastro da senha GOV, certificado digital e autenticação de máquina', 'Fatos que geraram o endividamento', 'Documento do kickoff e do conselho']],
  ['Levantamento de documentação', ['Contratos entregues: início do monitoramento do provisionamento', 'Não entregues: cliente com contrato sobe no lastro; sem contrato, malote informacional', 'Parcialmente entregues: malote informacional e upload no lastro']],
  ['Malotes e prazos', ['Malote informacional: CET, contratos, fichas gráficas, saldo financeiro', '10 dias úteis: documentos entregues, segue para a perícia', '15 dias úteis: não entregues, malote probatório', 'Sem recebimento: setor judicial e conselho jurídico (ação de exibição, pedido antecipado de provas ou pedido incidental)']],
  ['Perícia', ['Por perito: informar orçamento, perícia parcial ou total, pagamento e início', 'Por IA (interno): subir contratos no lastro, baixar planilha de cálculo, anexar laudo no Drive', 'Resultado: laudo entregue']],
  ['Laudo e abusividade', ['Taxa de juros: desvantagem exagerada, descumprimento contratual, juros abusivos (Tema 28 do STJ)', 'Capitalização: periodicidade pactuada e regra do duodécuplo', 'Seguro: verificar apólice; sem apólice, venda casada', 'Tarifa: regular e comprovada, ou irregular (venda casada)', 'Sem abusividade: permanece o monitoramento. Com abusividade: recálculo do saldo devedor']],
  ['Dossiê jurídico-contábil', ['Construção do dossiê', 'Início da perícia dos contratos remanescentes', 'Malote provocativo: revela vícios e vira munição para a mesa', 'Segue para o monitoramento de janela']],
  ['Monitoramento e negociação', ['Provisionamento: valor do passivo, data do contrato, data do último pagamento, banco (S1 a S5) e carteira (C1 a C5)', 'Relatório do valor provisionado enviado ao cliente todo mês, por e-mail', 'Janelas (podem ser cumulativas): sentença favorável, frustração de execução, campanha do banco, pré-sentença, RJ/extrajudicial, falência, balanço do banco, liminar, 100% de provisão, estágio 3', 'Reunião com o cliente (alçada): ativo ou passivo; verificar atualização do dossiê e iniciar a mesa']],
  ['Acordo e encerramento', ['Com alçada: minuta recebida, validada ou corrigida, e acordo', 'Sem alçada: análise de riscos do judicial', 'Pagamento: com processo, informar o juízo, acompanhar a homologação e informar o cliente', 'Sem processo: registro do acordo no lastro']]];
function abaFluxo() {
  return '<div class="cm-fase">' + FASES.map((f, i) => '<div class="cm-c"><h4><i>' + (i + 1) + '</i>' + esc(f[0]) + '</h4><ul>' + f[1].map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') + '</div>' +
    card('Canais de envio do malote (nesta ordem)', 'Se já foi feito pelo consumidor.gov, ir para Bacen ou AR, observando se é PF ou PJ.',
      tabela(['Ordem', 'Canal'], [['1', 'App do banco'], ['2', 'Consumidor.gov (PF)'], ['2', 'BACEN (PJ); PF faz segunda tentativa'], ['3', 'AR por correio'], ['4', 'AR por e-mail']])) +
    '<p class="cm-aviso">Roteiro de trabalho do setor jurídico (extrajudicial). Prazos e peças judiciais continuam sendo conferidos no eproc pelo Dr. Fábio.</p>';
}

const ABAS = [['funil', 'Metas e funil', abaFunil, calcFunil], ['cac', 'CAC, LTV e time', abaCac, calcCac], ['hon', 'Honorários REPB', abaHon, calcHon], ['qual', 'Qualificação do lead', abaQual, null], ['fluxo', 'Fluxo do jurídico', abaFluxo, null]];

VIEWS.comercial = async () => {
  titulo('Comercial');
  S.cmAba = S.cmAba || 'funil';
  const a = ABAS.find((x) => x[0] === S.cmAba) || ABAS[0];
  $('#cont').innerHTML = '<div class="abas" role="tablist">' + ABAS.map((x) => '<button type="button" data-cma="' + x[0] + '" class="' + (x[0] === a[0] ? 'on' : '') + '">' + esc(x[1]) + '</button>').join('') + '</div><div class="cm">' + a[2]() + '</div>';
  $$('[data-cma]').forEach((b) => b.onclick = () => { S.cmAba = b.dataset.cma; VIEWS.comercial(); window.scrollTo(0, 0); });
  if (a[3]) { $$('#cont input.inp').forEach((i) => i.oninput = a[3]); a[3](); }
  $$('[data-cmck]').forEach((c) => c.onchange = () => { let m = {}; try { m = JSON.parse(localStorage.getItem('fce_cm_check') || '{}'); } catch (e) {} m[c.dataset.cmck] = c.checked; try { localStorage.setItem('fce_cm_check', JSON.stringify(m)); } catch (e) {} });
};
FUNDOS.comercial = 'saguao';
})();
