// Aba "Atendimento bancário" (#/bancario), 22/11/2026: formulário de atendimento do cliente com dívida bancária, montado a partir do
// curso Advocacia Bancária Milionária (Dossiê Jurídico-Contábil, O Malote, Caderno de Modelos de Malotes, Pronampe, Imersão comercial,
// Qualificação do Lead). Gera: lista de documentos do cliente, plano do malote, próximos passos do método e relatório .docx.
// Aba 9: análise do contrato com IA (ilegalidades e estratégia; base do curso + anotações do Dr. Fábio).
// Ao final: tempo estimado de execução e honorários indicados (tabela de precificação do curso). Salva por caso na tabela app_atend_bancario (ações ab_lista, ab_abrir, ab_salvar da App API). Material de trabalho interno.
(function () {
const css = document.createElement('style');
css.textContent = `
.ab{margin-top:12px;display:grid;gap:12px}
.ab-c{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;box-shadow:var(--sh)}
.ab-c h3{margin:0 0 4px;font-family:var(--serif);font-size:18px}.ab-c .sub{margin:0 0 12px;color:var(--mut);font-size:13px}
.ab-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px 14px}
.ab-f{display:flex;flex-direction:column;gap:5px;font-size:13px}.ab-f>span{color:var(--mut);font-weight:600}
.ab-q{padding:12px 0;border-top:1px dashed var(--line)}.ab-q:first-of-type{border-top:0}
.ab-q .t{font-weight:600;font-size:14px;margin-bottom:3px}.ab-q .p{font-size:12px;color:var(--mut);margin-bottom:7px}
.ab-q textarea.inp{min-height:64px;max-width:none}.ab-q input.inp,.ab-q .sel{max-width:420px}
.ab-sn{display:inline-flex;gap:4px}.ab-sn button{border:1px solid var(--line-2);background:var(--surface);border-radius:9px;padding:6px 14px;font-weight:600;cursor:pointer;color:var(--txt)}
.ab-sn button.on{background:var(--navy);border-color:var(--navy);color:#fff}
.ab-div{border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:10px;background:color-mix(in srgb,var(--txt) 2%,transparent)}
.ab-div .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:700}
.ab-chips{display:flex;flex-wrap:wrap;gap:6px}.ab-chips button{border:1px solid var(--line-2);background:var(--surface);border-radius:20px;padding:5px 11px;font-size:12.5px;cursor:pointer;color:var(--txt)}
.ab-chips button.on{background:var(--gold-soft);border-color:#B8965A;color:#7a5c22;font-weight:600}
.ab-tabs{display:flex;gap:6px;flex-wrap:wrap;position:sticky;top:calc(var(--top,0px) + 6px);z-index:5;background:var(--bg);padding:6px 0}
.ab-tabs button{border:1px solid var(--line-2);background:var(--surface);border-radius:20px;padding:8px 14px;font-weight:600;cursor:pointer;color:var(--txt);font-size:13px}
.ab-tabs button.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.ab-ol{margin:6px 0 0;padding-left:20px}.ab-ol li{margin:6px 0;line-height:1.45}.ab-ol li small{display:block;color:var(--mut)}
.ab-tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:var(--info-soft);color:var(--info);margin-right:6px;vertical-align:1px}
.ab-tag.urg{background:var(--bad-soft);color:var(--bad)}.ab-tag.ok{background:var(--ok-soft);color:var(--ok)}
.ab-alerta{border-left:4px solid var(--bad);background:var(--bad-soft);border-radius:10px;padding:10px 14px;margin:6px 0;font-size:13.5px}
.ab-kpi{display:flex;gap:18px;flex-wrap:wrap;margin-top:6px}.ab-kpi div{font-size:12px;color:var(--mut)}.ab-kpi b{display:block;font-size:18px;color:var(--txt);font-family:var(--serif)}
.ab-salvo{font-size:12px;color:var(--mut)}
`;
document.head.appendChild(css);

// ---------- listas ----------
const BANCOS = ['Banco do Brasil', 'Caixa Econômica Federal', 'Itaú', 'Bradesco', 'Santander', 'Banrisul', 'Sicredi', 'Sicoob', 'Cresol', 'BTG Pactual', 'Safra', 'Nubank', 'Inter', 'C6 Bank', 'Mercantil', 'BRB', 'Banco do Nordeste', 'BNDES (repasse)', 'Creditas', 'Financeira / fintech', 'Outro'];
const MOD = [
  ['giro', 'Capital de giro'], ['contagar', 'Conta garantida / cheque especial PJ'], ['antecip', 'Antecipação de recebíveis / desconto de duplicatas'], ['pronampe', 'Pronampe'], ['peac', 'PEAC-FGI / outro com garantia de fundo'],
  ['bndes', 'BNDES / Finame / repasse'], ['leasing', 'Leasing / arrendamento'], ['cartao', 'Cartão de crédito'], ['chesp', 'Cheque especial PF'], ['pessoal', 'Crédito pessoal / CDC'], ['consig', 'Consignado'],
  ['veiculo', 'Financiamento de veículo'], ['imob', 'Financiamento imobiliário'], ['homeeq', 'Empréstimo com garantia de imóvel (home equity)'], ['rural_c', 'Crédito rural de custeio'], ['rural_i', 'Crédito rural de investimento'],
  ['cpr', 'CPR / cédula rural'], ['consorcio', 'Consórcio'], ['confissao', 'Confissão / renegociação de dívida'], ['outro', 'Outra']
];
const MODN = Object.fromEntries(MOD);
const SIT = [['emdia', 'Em dia'], ['atraso', 'Atraso até 90 dias'], ['inad', 'Inadimplente (mais de 90 dias)'], ['negat', 'Negativado / protestado'], ['exec', 'Em execução / cobrança judicial'], ['busca', 'Busca e apreensão'], ['leilao', 'Imóvel em consolidação / leilão'], ['dau', 'Inscrito em dívida ativa (FGO/União)']];
const SITN = Object.fromEntries(SIT);
const GAR = [['sem', 'Sem garantia'], ['aval', 'Aval / fiança'], ['af_imovel', 'Alienação fiduciária de imóvel'], ['af_veiculo', 'Alienação fiduciária de veículo/máquina'], ['hipoteca', 'Hipoteca'], ['penhor', 'Penhor (safra, máquinas)'], ['fundo', 'Fundo garantidor (FGO/FGI)'], ['recebiveis', 'Cessão de recebíveis / aplicação']];
const GARN = Object.fromEntries(GAR);
const TIPOS = [['pf', 'Pessoa física'], ['pj', 'Pessoa jurídica'], ['rural_pf', 'Produtor rural (CPF)'], ['rural_pj', 'Produtor rural / agro (CNPJ)']];
const FATOS = {
  pf: ['Desemprego', 'Redução de renda', 'Doença na família', 'Divórcio / separação', 'Morte do provedor', 'Acúmulo de dívidas de consumo (superendividamento)', 'Golpe ou fraude', 'Outro'],
  pj: ['Perda ou inadimplência de um grande cliente', 'Fim de contratos públicos', 'Alta da Selic sobre dívida pós-fixada', 'Obra, decreto ou interdição que parou a atividade', 'Sinistro sem cobertura', 'Ruptura na cadeia de fornecimento', 'Queda de vendas / crise do setor', 'Outro'],
  rural: ['Frustração de safra (seca, chuva em excesso, geada)', 'Queda de preço do produto', 'Dificuldade de comercialização', 'Pragas e doenças', 'Perda de qualidade da produção', 'Outro']
};
const rural = (a) => /^rural/.test(a.tipo || ''), pj = (a) => a.tipo === 'pj' || a.tipo === 'rural_pj', pf = (a) => a.tipo === 'pf' || a.tipo === 'rural_pf';
const dvs = (a) => (a.dividas || []).filter((d) => d && (d.banco || d.modalidade || d.saldo));
const tem = (a, re) => dvs(a).some((d) => re.test(d.modalidade || ''));
const temSit = (a, re) => dvs(a).some((d) => re.test(d.situacao || ''));
const temGar = (a, g) => dvs(a).some((d) => (d.garantias || []).includes(g));
const num = (v) => { const n = Number(String(v == null ? '' : v).replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : 0; };
const brl = (n) => 'R$ ' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const R = (a, k) => (a.r || {})[k];
const sim = (a, k) => R(a, k) === 'sim';
function totais(a) {
  const l = dvs(a); const saldo = l.reduce((s, d) => s + num(d.saldo), 0), parc = l.reduce((s, d) => s + num(d.parcela), 0);
  const consig = l.filter((d) => d.modalidade === 'consig').reduce((s, d) => s + num(d.parcela), 0);
  const renda = num(R(a, 'renda')); return { saldo, parc, consig, renda, comp: renda ? parc / renda : null, compConsig: renda ? consig / renda : null, bancos: [...new Set(l.map((d) => d.banco === 'Outro' ? (d.banco_outro || 'Outro') : d.banco).filter(Boolean))] };
}

// ---------- perguntas (seção, texto, por que pergunta / prova que gera, tipo, quando aparece) ----------
const Q = [
  // 1. triagem
  ['tri', 'vinculo', 'Qual é o vínculo de renda do cliente?', 'Define o caminho na árvore de qualificação do curso (servidor/CLT com consignado x empresário).', 'sel', (a) => pf(a), ['Servidor público', 'CLT', 'Aposentado / pensionista INSS', 'Autônomo / profissional liberal', 'Empresário (dívidas no CPF)', 'Outro']],
  ['tri', 'renda', 'Renda líquida mensal (PF) ou faturamento médio mensal (PJ/rural), em R$', 'Base do comprometimento de renda, do mínimo existencial e do laudo de capacidade de pagamento.', 'num'],
  ['tri', 'porte', 'Porte da empresa', 'Porte muda teses (ex.: TLA só para médio/grande porte) e o enquadramento em Pronampe.', 'sel', (a) => pj(a), ['MEI', 'ME', 'EPP', 'Médio porte', 'Grande porte']],
  ['tri', 'ativa', 'A empresa/atividade continua funcionando?', 'Empresa ativa abre plano de fluxo e recuperação extrajudicial; parada muda a estratégia.', 'sn', (a) => !pf(a) || rural(a)],
  ['tri', 'aval', 'Há avalista, fiador ou devedor solidário (sócio, cônjuge, parente)?', 'Avalista exposto aumenta a urgência e entra no quadro de partes do dossiê.', 'sn'],
  ['tri', 'aval_quem', 'Quem são os avalistas/fiadores e em quais contratos?', '', 'txt', (a) => sim(a, 'aval')],
  ['tri', 'acao', 'Já existe ação de cobrança, execução, monitória ou busca e apreensão?', 'Define prazo de defesa e se a luta já é judicial.', 'sn'],
  ['tri', 'acao_det', 'Qual ação, número do processo e data da citação/intimação?', 'Prazos correm da juntada do mandado ou da citação — conferir no eproc.', 'txt', (a) => sim(a, 'acao')],
  ['tri', 'prazo', 'Há leilão, audiência, vencimento ou prazo crítico nos próximos 30 dias? Qual data?', 'Urgência muda a ordem do trabalho.', 'txt'],
  ['tri', 'bloqueio', 'Houve bloqueio de conta, retenção de salário ou débito das parcelas na conta onde entra a renda?', 'Indica o malote de cancelamento de débito automático (DDA).', 'sn'],
  ['tri', 'golpe', 'Alguma dívida vem de golpe, fraude ou contratação que o cliente não reconhece?', 'Trilha própria de golpe e fraude (contestação, B.O., responsabilidade do banco).', 'sn'],
  ['tri', 'outro_adv', 'Já teve outro advogado neste caso? Por que trocou?', 'Sinal de alerta na triagem (troca sucessiva de advogados).', 'txt'],
  // 2. fato gerador
  ['fato', 'fato_tipo', 'Qual foi o fato que gerou o endividamento?', 'Tópico circunstancial do dossiê: o banco tem o histórico de pagamentos, mas não a explicação.', 'fato'],
  ['fato', 'fato_desc', 'Descreva o evento com nome e data (ex.: "a principal cliente pediu recuperação judicial em mar/2025")', 'Teste do curso: concreto, datado, externo e com relação clara com a queda do caixa.', 'txt'],
  ['fato', 'quando', 'Quando o caixa começou a apertar? (mês/ano)', 'Cruzar depois com o extrato.', 'linha'],
  ['fato', 'mudou', 'O que mudou naquele momento? (cliente, contrato, preço, clima, regra, pessoa)', '', 'txt'],
  ['fato', 'impacto', 'Quanto isso representava da renda/faturamento? (mesmo aproximado)', 'Confirmar com o contador; vira número no tópico circunstancial.', 'linha'],
  ['fato', 'reacao', 'O que o cliente fez para reagir? (corte de custos, venda de bem, renegociação com fornecedor)', 'Prova de gestão ativa.', 'txt'],
  ['fato', 'pagando', 'O que ele continuou pagando? (folha, tributos correntes, fornecedores, contas da casa)', 'É a prova da boa-fé.', 'txt'],
  ['fato', 'atraso1', 'Quando foi o primeiro atraso com o banco? (mês/ano)', 'Linha do tempo do crédito: liberação, renovações, inadimplência e default.', 'linha'],
  ['fato', 'provas', 'Quais documentos provam cada resposta? (rescisão, laudo, decreto, fotos, e-mails, notas, extratos)', 'O cliente sai da reunião com essa lista.', 'txt'],
  // 3. relação com o banco
  ['banco', 'procurou', 'Quando e como procurou o banco? Com quem falou (gerente, agência, superintendência)?', 'Ajuda a descobrir a alçada de quem decide do outro lado.', 'txt'],
  ['banco', 'reneg', 'Houve renegociação, confissão de dívida ou rolagem? Quantas e quando?', 'Cada renegociação que só rolou a dívida prova que o banco já conhecia a dificuldade; indica pedir o histórico de 10 anos.', 'sn'],
  ['banco', 'reneg_det', 'Detalhe as renegociações (data, valor, o que mudou nas condições)', '', 'txt', (a) => sim(a, 'reneg')],
  ['banco', 'propostas', 'Que propostas o banco já fez? (valor, parcelas, desconto, por escrito ou verbal)', 'Base para comparar com o valor recalculado e com a provisão.', 'txt'],
  ['banco', 'tem_contratos', 'O cliente tem cópia de todos os contratos, aditivos e confissões?', 'Sem contrato, o primeiro malote é o pedido de contratos e fichas gráficas.', 'sn'],
  ['banco', 'pediu_docs', 'Já pediu contratos ou extratos ao banco e não recebeu?', 'Recusa ou silêncio do banco vira prova e base para inverter o ônus.', 'sn'],
  ['banco', 'seguro', 'Paga seguro prestamista ou outro seguro junto com o empréstimo?', 'Indica o malote de estorno de seguro (venda casada).', 'sn'],
  ['banco', 'casada', 'Foram vendidos junto título de capitalização, consórcio, cesta de tarifas ou outro produto?', 'Possível venda casada.', 'sn'],
  ['banco', 'deb_auto', 'As parcelas são debitadas automaticamente na conta onde entra o salário ou o faturamento?', 'Indica o cancelamento estratégico do débito automático (DDA).', 'sn'],
  // 4. capacidade de pagamento
  ['cap', 'despesas', 'Despesas essenciais mensais (moradia, alimentação, saúde, escola), em R$', 'Mínimo existencial (PF) e projeção de fluxo de caixa.', 'num', (a) => pf(a)],
  ['cap', 'custos', 'Custos fixos mensais da operação (folha, aluguel, tributos, fornecedores), em R$', 'Projeção de fluxo de caixa com premissas.', 'num', (a) => !pf(a) || rural(a)],
  ['cap', 'parcela_possivel', 'Quanto consegue pagar por mês sem faltar o essencial? (R$)', 'Parcela máxima e dívida sustentável do tópico de capacidade de pagamento.', 'num'],
  ['cap', 'entrada', 'Teria valor para entrada ou quitação à vista? Quanto?', 'Muda a proposta e o deságio possível.', 'linha'],
  ['cap', 'bens', 'Que bens possui (imóveis, veículos, máquinas, aplicações)? Algum está em garantia?', 'Risco de penhora e garantias a proteger.', 'txt'],
  ['cap', 'outras', 'Tem dívidas fora dos bancos? (fornecedores, tributos, trabalhistas, agiotas)', 'Panorama completo do passivo.', 'txt'],
  ['cap', 'contador', 'Tem contador que possa fornecer balanço, DRE, ECF e fluxo de caixa?', 'O laudo de capacidade é assinado por contador (CRC) ou agrônomo (CREA).', 'sn', (a) => !pf(a) || rural(a)],
  ['cap', 'fiscal', 'Há débitos com a Receita ou PGFN?', 'Situação fiscal entra no tópico circunstancial e de capacidade.', 'sn', (a) => !pf(a) || rural(a)],
  // 5. específicos
  ['esp', 'pr_data', 'Pronampe: quando foi contratado? (mês/ano)', 'Marca a versão da lei aplicável e a taxa-teto vigente.', 'linha', (a) => tem(a, /pronampe|peac/)],
  ['esp', 'pr_dau', 'Pronampe: já houve cobrança judicial ou inscrição em dívida ativa?', 'Define se a luta é com o banco, com a PGFN ou em execução.', 'sn', (a) => tem(a, /pronampe|peac/)],
  ['esp', 'pr_fgo', 'Pronampe: o FGO já foi honrado?', 'Pergunta-chave do curso: define todo o resto da estratégia.', 'sel', (a) => tem(a, /pronampe|peac/), ['Sim', 'Não', 'Não sabe']],
  ['esp', 'ru_cultura', 'Rural: atividade/cultura e safra afetada', 'Laudo agronômico e tópico circunstancial do produtor.', 'linha', (a) => rural(a) || tem(a, /rural|cpr/)],
  ['esp', 'ru_seguro', 'Rural: acionou seguro rural ou Proagro? Com que resultado?', '', 'txt', (a) => rural(a) || tem(a, /rural|cpr/)],
  ['esp', 'ru_prorrog', 'Rural: pediu por escrito a prorrogação da dívida ao banco antes do vencimento?', 'Prorrogação do crédito rural é tese específica; o pedido escrito é prova.', 'sn', (a) => rural(a) || tem(a, /rural|cpr/)],
  ['esp', 've_pagas', 'Veículo: quantas parcelas já foram pagas e recebeu notificação de mora?', 'Busca e apreensão depende da comprovação da mora.', 'txt', (a) => tem(a, /veiculo/) || temGar(a, 'af_veiculo')],
  ['esp', 'im_intim', 'Imóvel em garantia: recebeu intimação do cartório para pagar ou aviso de leilão? Quando?', 'Se sim, abrir também o Diagnóstico de alienação fiduciária do app (leilão).', 'txt', (a) => tem(a, /imob|homeeq/) || temGar(a, 'af_imovel')],
  ['esp', 'se_consumo', 'Superendividamento: as dívidas são de consumo (pessoais), contraídas de boa-fé?', 'Requisito da Lei 14.181/2021 para o plano de pagamento.', 'sn', (a) => pf(a)],
  ['esp', 'go_det', 'Golpe/fraude: o que aconteceu, quando, valores, e já contestou no banco ou fez B.O.?', '', 'txt', (a) => sim(a, 'golpe')],
  // 6. decisão
  ['dec', 'decisor', 'Quem decide sobre a contratação? (sozinho, sócio, cônjuge)', 'Se houver outro decisor, marcar a reunião de proposta com os dois.', 'linha'],
  ['dec', 'expect', 'O que o cliente espera como resultado? (em palavras dele)', 'Alinhar sem prometer resultado (Provimento 205/2021).', 'txt'],
  ['dec', 'obs', 'Observações gerais do atendimento', '', 'txt']
];
const SECOES = [['cli', '1 · Cliente'], ['div', '2 · Dívidas'], ['tri', '3 · Triagem'], ['fato', '4 · Fato gerador'], ['banco', '5 · Banco'], ['cap', '6 · Capacidade'], ['esp', '7 · Específicas'], ['dec', '8 · Decisão'], ['ctr', '9 · Contrato (IA)'], ['res', 'Resultado']];
const SECN = { tri: 'Triagem e qualificação', fato: 'Fato gerador (tópico circunstancial do dossiê)', banco: 'Relação com o banco', cap: 'Capacidade de pagamento', esp: 'Perguntas específicas do caso', dec: 'Decisão e expectativa' };

// ---------- resultado: qualificação, documentos, malote, passos ----------
function qualificar(a) {
  const t = totais(a), s = []; const al = [];
  if (sim(a, 'acao') || temSit(a, /exec/)) al.push('Há ação judicial: conferir prazo de defesa (embargos à execução, contestação ou impugnação) no eproc antes de qualquer outra coisa.');
  if (temSit(a, /busca/)) al.push('Busca e apreensão: prazo curto para pagar a integralidade da dívida após a liminar ser cumprida (Decreto-Lei 911/69). Tratar como urgente.');
  if (temSit(a, /leilao/) || (R(a, 'im_intim') || '').trim()) al.push('Imóvel em garantia com intimação/leilão: abrir o Diagnóstico de alienação fiduciária do app (purgação da mora, leilões).');
  if ((R(a, 'prazo') || '').trim()) al.push('Prazo crítico informado: ' + R(a, 'prazo'));
  if (pf(a) && !rural(a)) {
    if (t.compConsig != null && t.compConsig > 0.6) s.push(['Readequação de margem do consignado + revisional sancionatória (art. 54-D CDC)', 'Consignado acima de 60% da renda.']);
    if (sim(a, 'se_consumo') && t.comp != null && t.comp > 0.3) s.push(['Superendividamento (Lei 14.181/2021): plano de pagamento', 'Dívidas de consumo de boa-fé comprometendo ' + Math.round(t.comp * 100) + '% da renda.']);
  }
  if (sim(a, 'deb_auto') || sim(a, 'bloqueio')) s.push(['Cancelamento estratégico do débito automático (DDA)', 'Parcelas debitadas na conta de renda/faturamento.']);
  if (sim(a, 'golpe')) s.push(['Golpe e fraude bancária', 'Contratação não reconhecida pelo cliente.']);
  if (tem(a, /pronampe|peac/)) s.push(['Estratégia Pronampe', 'FGO honrado: ' + (R(a, 'pr_fgo') || 'a confirmar') + '.']);
  if (rural(a) || tem(a, /rural|cpr/)) s.push(['Dívida rural: prorrogação e renegociação rural', 'Crédito rural identificado.']);
  if (temSit(a, /exec/) || sim(a, 'acao')) s.push(['Defesa do executado', 'Cobrança judicial em curso.']);
  const inad = temSit(a, /inad|negat|exec|busca|leilao|dau/);
  if (inad) s.push(['Reestruturação de passivo bancário (REPB): malote, dossiê e mesa negocial', 'Dívida inadimplente: a provisão do banco já cresce e é a alavanca da negociação.']);
  else if (dvs(a).length) s.push(['Revisional estratégica / análise de contrato', 'Dívidas em dia: verificar viabilidade jurídica antes de qualquer atraso.']);
  return { t, servicos: s, alertas: al, inad };
}
function documentos(a) {
  const d = [];
  const add = (g, x, p) => d.push([g, x, p || '']);
  add('Todos', 'Documento de identidade e CPF; comprovante de residência');
  add('Todos', 'Todos os contratos, aditivos, confissões e renegociações que tiver (CCB, cédulas, termos)');
  add('Todos', 'Extratos da conta e das operações dos últimos 12 meses');
  add('Todos', 'Registrato (SCR do Banco Central), tirado pelo gov.br — mostra todas as dívidas bancárias');
  add('Todos', 'Cartas, e-mails, mensagens e notificações de cobrança recebidas; propostas do banco por escrito');
  add('Todos', 'Prova do fato que gerou a dívida' + ((R(a, 'provas') || '').trim() ? ': ' + R(a, 'provas') : ' (rescisão, laudo, decreto, fotos, notas, e-mails)'));
  if (pf(a)) {
    add('Renda e despesas', 'Comprovantes de renda: 3 últimos holerites, extrato do INSS ou declaração de IR');
    add('Renda e despesas', 'Comprovantes das despesas essenciais (aluguel, escola, saúde, contas da casa) — base do mínimo existencial');
    const f = (R(a, 'fato_tipo') || '');
    if (/Doença/.test(f)) add('Renda e despesas', 'Laudos e atestados médicos, comprovantes de gastos com saúde');
    if (/Desemprego/.test(f)) add('Renda e despesas', 'Termo de rescisão e comprovante do seguro-desemprego');
    if (/Divórcio|Morte/.test(f)) add('Renda e despesas', 'Certidão de divórcio ou de óbito');
  }
  if (pj(a)) {
    add('Empresa', 'Contrato social e alterações, cartão CNPJ');
    add('Empresa', 'Balanço patrimonial e DRE do último exercício, ECF');
    add('Empresa', 'Fluxo de caixa dos últimos 6 a 12 meses e faturamento mês a mês');
    add('Empresa', 'Relatório de situação fiscal (Receita e PGFN) e guias dos tributos correntes pagos');
    add('Empresa', 'Certidões fiscais, trabalhistas e do FGTS');
  }
  if (sim(a, 'aval')) add('Avalistas', 'Documentos pessoais dos avalistas/fiadores e Registrato de cada um');
  if (rural(a) || tem(a, /rural|cpr/)) {
    add('Rural', 'Cédulas rurais (CCR, CPR, CCB) e aditivos');
    add('Rural', 'Livro-caixa, notas de venda da produção e projeto técnico do financiamento');
    add('Rural', 'Laudo agronômico de perda (se houve frustração de safra) e apólice de seguro rural/Proagro');
    add('Rural', 'Cópia do pedido de prorrogação feito ao banco, se houver');
  }
  if (tem(a, /pronampe|peac/)) {
    add('Pronampe', 'Contrato do Pronampe/PEAC (cópia integral) e extrato atualizado discriminado (saldo, juros, encargos, parcelas pagas)');
    add('Pronampe', 'Comprovante de honra do FGO, se houver, ou prova de que a operação ainda está com o banco');
  }
  if (tem(a, /veiculo/) || temGar(a, 'af_veiculo')) add('Veículo', 'Contrato do financiamento, comprovantes das parcelas pagas e notificação de mora recebida');
  if (tem(a, /imob|homeeq/) || temGar(a, 'af_imovel')) add('Imóvel', 'Matrícula atualizada do imóvel e intimações do cartório/avisos de leilão');
  if (sim(a, 'acao') || temSit(a, /exec|busca/)) add('Processo', 'Cópia da ação, mandado de citação e decisões já proferidas');
  if (sim(a, 'seguro')) add('Seguro', 'Apólice ou certificado do seguro prestamista e onde aparece a cobrança');
  if (sim(a, 'deb_auto') || sim(a, 'bloqueio')) add('Débito automático', 'Extrato que mostre o débito das parcelas na conta de salário/faturamento');
  if (sim(a, 'golpe')) add('Golpe/fraude', 'Boletim de ocorrência, contestação ao banco (protocolo), prints de mensagens e comprovantes das transferências');
  add('Contratação', 'Procuração e contrato de honorários assinados');
  return d;
}
function malote(a) {
  const q = qualificar(a), b = totais(a).bancos; const m = [];
  const bancos = b.length ? b.join(', ') : 'cada banco credor';
  m.push(['Informacional', 'Modelo 1 — Solicitação de contratos atuais', 'Pedir a ' + bancos + ': contratos e aditivos, ficha gráfica de cada contrato, CET, evolução do saldo, garantias e a provisão contábil por operação (Res. CMN 4.966). A recusa ou o silêncio vira prova.', true]);
  if (sim(a, 'reneg') || sim(a, 'pediu_docs')) m.push(['Informacional', 'Modelo 2 — Contratos dos últimos 10 anos', 'Houve renegociações/rolagens: pedir o histórico completo para reconstruir a cadeia de contratos.', true]);
  if (sim(a, 'deb_auto') || sim(a, 'bloqueio')) m.push(['Provocativo', 'Modelo 3 — Cancelamento de débito automático (DDA)', 'Cancelar o débito das parcelas na conta de renda/faturamento para recuperar o fôlego de caixa.', true]);
  if (sim(a, 'seguro') || sim(a, 'casada')) m.push(['Provocativo', 'Modelo 5 — Estorno de seguro prestamista (venda casada)', 'Pedir o estorno do seguro/produto vendido junto com o empréstimo.', true]);
  if (q.inad) m.push(['Provocativo', 'Modelo 4 — Solicitação de proposta de acordo', 'Forçar o banco a se manifestar e revelar a alçada, depois que os documentos chegarem.', false]);
  m.push(['Propositivo', 'Proposta ancorada em provisão + capacidade', 'Com o dossiê pronto: valor exato, dentro da capacidade de pagamento, com blindagem (baixa no SCR/SPC/Serasa e vedação de arrasto).', false]);
  m.push(['Reiteratório', 'Modelo 6 — Reiteração diante de negativa', 'Se o banco negar ou silenciar: reforçar o prazo e documentar a desídia.', false]);
  m.push(['Pré-judicial', 'Modelo 7 — Notificação extrajudicial', 'Quando a mesa não andar: notificar a ação e fixar marcos; muitas vezes traz o banco para a mesa.', false]);
  return { m, canais: ['Protocolo presencial na agência, com carimbo e foto', 'Carta com AR dos Correios (duas vias)', pf(a) ? 'Consumidor.gov.br (conta gov.br do cliente; o texto curto vai no relato, a versão do escritório em PDF anexo)' : 'Consumidor.gov.br ou e-mail formal ao gerente/superintendência, conforme o caso', 'Banco Central — RDR (registro de reclamação)', 'Ouvidoria do banco (complemento)'] };
}
function passos(a) {
  const q = qualificar(a); const p = [];
  q.alertas.forEach((x) => p.push(['URGENTE', x]));
  p.push(['1', 'Onboarding e documentos: entregar a lista de documentos por escrito hoje, de uma vez só. O tópico circunstancial do dossiê começa ao fim desta reunião.']);
  p.push(['', 'Lançar cada operação no Modelo de Mapeamento de Endividamento (score de risco e cronograma de parcelas).']);
  p.push(['2', 'Conselho jurídico: desenhar a estratégia (' + (q.servicos.map((s) => s[0]).join('; ') || 'a definir') + ').']);
  p.push(['3', 'Apresentar a estratégia e o plano de ação ao cliente (proposta apresentada na 2ª reunião, nunca enviada).']);
  p.push(['4', 'Malotes extrajudiciais pelos três canais, guardando a prova de cada envio (prazo de 15 dias úteis).']);
  p.push(['5', 'Recebimento dos contratos. Em paralelo: (a) monitorar o provisionamento de cada contrato na planilha; (b) perícia dos contratos (juros, capitalização, tarifas, seguros); (c) laudo de capacidade de pagamento' + (rural(a) ? ' ou laudo de frustração de safra' : '') + '.']);
  p.push(['6', 'Com as perícias: tópico jurídico-matemático (contábil) e tópico de capacidade de pagamento.']);
  p.push(['7', 'Vícios encontrados? Teses com e sem judicialização. Sem vícios: negociação apoiada no provisionamento.']);
  p.push(['8', 'Primeira versão do dossiê com os seis tópicos: circunstancial, capacidade, provisionamento, jurídico, contábil e conclusão.']);
  p.push(['9', 'Três passadas de revisão e leitura por outra pessoa.']);
  p.push(['10', 'Abertura da mesa negocial com quem tem alçada.']);
  p.push(['11', 'Execução da mesa: comparar a proposta do banco com o valor recalculado, a provisão e a capacidade antes de aceitar.']);
  p.push(['12', 'Acordo com cláusula de baixa no SCR/SPC/Serasa e vedação de arrasto (multicontrato).']);
  p.push(['13', 'Finalização: prestação de contas e guarda do caso. Ciclo típico do onboarding ao acordo: cerca de 12 semanas.']);
  return p;
}

// ---------- prazo estimado e honorários (curso: O Malote, Precificação, Trilha 100k e Mapeamento de ICP) ----------
function mesesDesde(txt) { const m = String(txt || '').match(/(\d{1,2})\s*\/\s*(\d{4})/); if (!m) return null; const d = new Date(Number(m[2]), Number(m[1]) - 1, 1); const n = new Date(); return (n.getFullYear() - d.getFullYear()) * 12 + n.getMonth() - d.getMonth(); }
function prazo(a) {
  const q = qualificar(a), l = [];
  const atraso = mesesDesde(R(a, 'atraso1'));
  if (q.alertas.length) l.push(['Imediato', 'Medidas urgentes (prazos judiciais, leilão, busca e apreensão) correm antes do restante, em dias.']);
  if (sim(a, 'deb_auto') || sim(a, 'bloqueio')) l.push(['15 dias úteis', 'Cancelamento do débito automático: prazo de resposta do malote.']);
  if (q.inad || dvs(a).length) {
    l.push(['Semanas 1–2', 'Onboarding, documentos do cliente e mapeamento das dívidas.']);
    l.push(['Semanas 3–4', 'Malotes ao banco e auditoria (prazo de resposta de 15 dias úteis).']);
    l.push(['Semanas 5–6', 'Perícia, recálculo e montagem do dossiê.']);
    l.push(['Semanas 7–8', 'Negociação e mesa com quem tem alçada.']);
    l.push(['Semanas 9–12', 'Acordo, baixa nos cadastros e acompanhamento.']);
  }
  const se = q.servicos.some((s) => /Superendividamento/.test(s[0])), jud = q.servicos.some((s) => /Defesa do executado|Golpe/.test(s[0]));
  let total = 'Cerca de 12 semanas na via extrajudicial, se o banco responder e houver acordo.';
  if (atraso != null && atraso >= 12) total += ' Cliente inadimplente há ' + atraso + ' meses: a operação já tende ao provisionamento integral, o que costuma encurtar a negociação.';
  const hz = [];
  hz.push('Horizonte do contrato de reestruturação: até 24 meses (horizonte de trabalho usado pelo curso na precificação).');
  if (se) hz.push('Superendividamento judicial: cerca de 12 meses (tempo médio de tramitação de 368 dias, segundo o CNJ, citado no curso).');
  if (jud) hz.push('Fase judicial (execução, revisional, golpe): depende da tramitação; sem estimativa fixa no curso.');
  if (!q.inad && dvs(a).length) hz.push('Dívidas em dia: primeiro a análise de viabilidade (2 a 4 semanas) antes de qualquer estratégia de atraso.');
  return { fases: l, total, hz };
}
const FAIXAS = [ // [até, %min, %max, entrada min, entrada max, obs] — tabela de precificação REPB do curso
  [50000, null, null, 5000, null, 'Abaixo da faixa do curso: o exemplo do curso para R$ 50 mil cobra o mínimo de R$ 5 mil. Avaliar se o caso cabe no perfil do escritório.'],
  [100000, 0.10, 0.20, 1997, 9999, 'Quanto menor a dívida, maior o percentual.'],
  [200000, 0.10, 0.15, 11000, 30000, 'Análise de risco.'],
  [500000, 0.10, 0.13, 21000, 65000, 'Personalizado.'],
  [1000000, 0.10, 0.10, 50000, 100000, 'Escala equilibrada.'],
  [10000000, 0.05, 0.10, null, null, 'Dívidas de R$ 1 a 10 milhões (Mapeamento de ICP).'],
  [Infinity, 0.03, 0.08, null, null, 'Acima de R$ 10 milhões (Mapeamento de ICP).']
];
function honorarios(a) {
  const q = qualificar(a), saldo = q.t.saldo, f = FAIXAS.find((x) => saldo <= x[0]) || FAIXAS[FAIXAS.length - 1];
  const nContr = dvs(a).length, exec = sim(a, 'acao') || temSit(a, /exec|busca|leilao/);
  const r = { saldo, linhas: [], obs: [] };
  if (!saldo) { r.obs.push('Informe o saldo das dívidas na aba 2 para calcular a faixa de honorários.'); return r; }
  let ini = f[1] != null ? [saldo * f[1], saldo * f[2]] : [f[3], f[3]];
  if (f[3] != null && f[1] != null) ini = [Math.max(ini[0], f[3]), f[4] != null ? Math.min(Math.max(ini[1], f[3]), f[4]) : ini[1]];
  const pct = f[1] != null ? Math.round(f[1] * 100) + (f[2] !== f[1] ? '–' + Math.round(f[2] * 100) : '') + '%' : 'mínimo';
  r.linhas.push(['Pró-labore (na assinatura)', brl(ini[0]) + (ini[1] !== ini[0] ? ' a ' + brl(ini[1]) : ''), pct + ' do saldo de ' + brl(saldo) + '. ' + f[5] + (nContr > 1 ? ' Com ' + nContr + ' contratos, puxe para o alto da faixa (no exemplo do curso, R$ 100 mil em 1 contrato = R$ 10 mil; em 4 contratos = R$ 12 a 15 mil).' : '')]);
  if (exec) r.linhas.push(['Adicional de urgência', '+10% na entrada', 'Execução, busca e apreensão ou leilão em andamento.']);
  r.linhas.push(['Taxa mensal (TMP)', 'R$ 1.000 a R$ 3.000/mês', 'Durante a condução do caso. No exemplo do curso para dívida de R$ 100 mil: entrada parcelada (R$ 2 mil + 10× R$ 800) e, a partir da 11ª parcela, R$ 200/mês até o fim.']);
  r.linhas.push(['Êxito', (f[1] != null ? pct : '10–20%') + ' da redução obtida', 'Sobre o proveito econômico (diferença entre o saldo cobrado e o valor do acordo ou da decisão). Nenhum cliente paga só êxito.']);
  if (exec || q.servicos.some((s) => /Defesa|Golpe/.test(s[0]))) r.linhas.push(['Liminar / medida urgente', '10% do valor bloqueado ou liberado', 'Bônus eventual quando a medida judicial libera ou protege valores.']);
  if (q.servicos.some((s) => /Superendividamento/.test(s[0]))) r.obs.push('Superendividamento: entrada de 8% a 15% (tabela do curso), com múltiplos credores.');
  if (q.servicos.some((s) => /Defesa do executado/.test(s[0]))) r.obs.push('Defesa do executado: entrada de 10% a 15% + 10% de urgência (tabela do curso).');
  r.obs.push('Fale do custo de não agir antes de falar em valor; apresente a proposta na 2ª reunião e não ofereça desconto espontâneo.');
  r.obs.push('Valores indicativos do curso: confira com a tabela da OAB/RS e a política do escritório antes de propor.');
  return r;
}

// ---------- estado ----------
let F = null, tSalvar = null; const NOMES = {};
const novo = () => ({ id: null, caso_id: null, sec: 'cli', A: { tipo: '', nome: '', doc: '', dividas: [{}], r: {} }, salvoEm: '' });
function marcarSujo() { F.sujo = true; clearTimeout(tSalvar); tSalvar = setTimeout(salvar, 1200); const s = $('#abSalvo'); if (s) s.textContent = 'salvando…'; }
async function salvar() {
  if (!F || !F.sujo) return; F.sujo = false; const meu = F;
  try { const r = await api('ab_salvar', { id: meu.id || '', caso_id: meu.caso_id || '', nome: meu.A.nome || '', dados: meu.A }); if (r && r.id) meu.id = r.id; meu.salvoEm = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    delete S.cache.ablista; const s = $('#abSalvo'); if (s && F === meu) s.textContent = 'salvo às ' + meu.salvoEm;
    if (meu.id && !/^#\/bancario\/[0-9a-f-]{36}$/.test(location.hash)) history.replaceState(null, '', '#/bancario/' + meu.id);
  } catch (e) { const s = $('#abSalvo'); if (s) s.textContent = 'não salvou: ' + e.message; }
}

// ---------- telas ----------
async function telaLista(forcar) {
  titulo('Atendimento bancário', '<button class="btn pri sm" id="abNovo">' + ic('caneta', 's') + '<span class="so-desk"> Novo sem cadastro</span></button>');
  if (!S.cache.ablista) carregando(3);
  let d = { itens: [] }; try { d = (await dados('ablista', 'ab_lista', null, forcar)) || d; } catch (e) {}
  let h = '<div class="ab"><div class="ab-c"><h3>Novo atendimento</h3><p class="sub">Escolha o cliente do cadastro. Roteiro de perguntas, documentos, malote e próximos passos do método do curso.</p>' +
    '<label class="busca">' + ic('busca', 's') + '<input id="abBusca" placeholder="Buscar cliente por nome ou telefone" autocomplete="off"></label><div class="lista" id="abRes" style="margin-top:8px"></div></div>';
  h += '<div class="ab-c"><h3>Atendimentos salvos</h3>' + ((d.itens || []).length ? '<div class="lista">' + d.itens.map((x) => '<a class="item" href="#/bancario/' + x.id + '"><div class="av">' + esc(iniciais(x.nome)) + '</div><div class="mid"><div class="t">' + esc(x.nome || 'Sem nome') + '</div><div class="d">' + esc([x.tipo ? (Object.fromEntries(TIPOS))[x.tipo] : '', x.bancos, x.saldo ? brl(x.saldo) : ''].filter(Boolean).join(' · ')) + ' · atualizado ' + esc(fmtD(x.updated_at, { dateStyle: 'short', timeStyle: 'short' })) + '</div></div>' + ic('seta', 's') + '</a>').join('') + '</div>' : '<p class="pp mut">Nenhum atendimento ainda.</p>') + '</div></div>';
  $('#cont').innerHTML = h;
  $('#abNovo').onclick = () => { F = novo(); location.hash = '#/bancario/novo'; };
  let tm; $('#abBusca').oninput = (e) => { clearTimeout(tm); const q = e.target.value.trim(); tm = setTimeout(async () => {
    if (q.length < 2) { $('#abRes').innerHTML = ''; return; }
    try { const l = await api('casos', { q, etapa: '', perfil: '' }); (l || []).forEach((c) => { NOMES[c.id] = c.nome; }); $('#abRes').innerHTML = (l || []).slice(0, 12).map((c) => '<a class="item" href="#/bancario/c-' + c.id + '"><div class="av">' + esc(iniciais(c.nome)) + '</div><div class="mid"><div class="t">' + esc(c.nome) + '</div><div class="d">' + esc(ETAPA[c.etapa] || c.etapa || '') + '</div></div>' + ic('seta', 's') + '</a>').join('') || '<p class="pp mut">Nenhum cliente encontrado.</p>'; } catch (er) { $('#abRes').innerHTML = '<p class="pp mut">' + esc(er.message) + '</p>'; }
  }, 300); };
}
async function abrir(arg) {
  if (F && F.chave === arg) return;
  if (F && F.sujo) await salvar();
  if (arg === 'novo') { if (!F || F.chave !== 'novo') { F = novo(); } F.chave = 'novo'; return; }
  carregando(3);
  const casoId = arg.startsWith('c-') ? arg.slice(2) : null;
  const r = await api('ab_abrir', casoId ? { caso_id: casoId } : { id: arg });
  F = novo(); F.chave = arg;
  if (r && r.id) { F.id = r.id; F.caso_id = r.caso_id || casoId; F.A = Object.assign(F.A, r.dados || {}); if (!F.A.r) F.A.r = {}; if (!(F.A.dividas || []).length) F.A.dividas = [{}]; }
  else { F.caso_id = casoId; F.A.nome = NOMES[casoId] || ''; }
  if (F.caso_id && !F.A.doc) { try { const c = await api('cadastro', { caso_id: F.caso_id }); const cl = (c && c.cliente) || {}; F.A.doc = cl.cpf || cl.cnpj || ''; if (!F.A.nome) F.A.nome = cl.nome || ''; } catch (e) {} }
}
function campoSN(k, v) { return '<span class="ab-sn" data-sn="' + k + '"><button type="button" data-v="sim" class="' + (v === 'sim' ? 'on' : '') + '">Sim</button><button type="button" data-v="nao" class="' + (v === 'nao' ? 'on' : '') + '">Não</button><button type="button" data-v="ns" class="' + (v === 'ns' ? 'on' : '') + '">Não sabe</button></span>'; }
function htmlPergunta(a, q) {
  const [, k, t, p, tipo, , opts] = q; const v = R(a, k) == null ? '' : R(a, k);
  let c;
  if (tipo === 'sn') c = campoSN(k, v);
  else if (tipo === 'sel') c = '<select class="sel" data-r="' + k + '"><option value="">—</option>' + opts.map((o) => '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>';
  else if (tipo === 'fato') { const l = rural(a) ? FATOS.rural : pf(a) ? FATOS.pf : FATOS.pj; c = '<div class="ab-chips" data-chip="' + k + '">' + l.map((o) => '<button type="button" class="' + (o === v ? 'on' : '') + '">' + esc(o) + '</button>').join('') + '</div>'; }
  else if (tipo === 'num') c = '<input class="inp" inputmode="decimal" data-r="' + k + '" value="' + esc(v) + '" placeholder="0,00">';
  else if (tipo === 'linha') c = '<input class="inp" data-r="' + k + '" value="' + esc(v) + '">';
  else c = '<textarea class="inp" data-r="' + k + '">' + esc(v) + '</textarea>';
  return '<div class="ab-q"><div class="t">' + esc(t) + '</div>' + (p ? '<div class="p">' + esc(p) + '</div>' : '') + c + '</div>';
}
function htmlDivida(d, i) {
  const opt = (l, v) => '<option value="">—</option>' + l.map(([k, n]) => '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
  return '<div class="ab-div" data-i="' + i + '"><div class="hd"><span>Dívida ' + (i + 1) + '</span><button type="button" class="btn fant sm" data-rm="' + i + '">Remover</button></div><div class="ab-grid">' +
    '<label class="ab-f"><span>Banco / instituição</span><select class="sel" data-d="banco">' + '<option value="">—</option>' + BANCOS.map((b) => '<option' + (b === d.banco ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select></label>' +
    (d.banco === 'Outro' ? '<label class="ab-f"><span>Qual instituição?</span><input class="inp" data-d="banco_outro" value="' + esc(d.banco_outro || '') + '"></label>' : '') +
    '<label class="ab-f"><span>Tipo de dívida / natureza</span><select class="sel" data-d="modalidade">' + opt(MOD, d.modalidade) + '</select></label>' +
    '<label class="ab-f"><span>Situação</span><select class="sel" data-d="situacao">' + opt(SIT, d.situacao) + '</select></label>' +
    '<label class="ab-f"><span>Nº do contrato</span><input class="inp" data-d="contrato" value="' + esc(d.contrato || '') + '"></label>' +
    '<label class="ab-f"><span>Data da contratação</span><input class="inp" type="date" data-d="data" value="' + esc(d.data || '') + '"></label>' +
    '<label class="ab-f"><span>Valor contratado (R$)</span><input class="inp" inputmode="decimal" data-d="valor" value="' + esc(d.valor || '') + '"></label>' +
    '<label class="ab-f"><span>Saldo devedor informado (R$)</span><input class="inp" inputmode="decimal" data-d="saldo" value="' + esc(d.saldo || '') + '"></label>' +
    '<label class="ab-f"><span>Parcela mensal (R$)</span><input class="inp" inputmode="decimal" data-d="parcela" value="' + esc(d.parcela || '') + '"></label>' +
    '<label class="ab-f"><span>Parcelas pagas / total</span><input class="inp" data-d="parcelas" value="' + esc(d.parcelas || '') + '" placeholder="ex.: 12/48"></label>' +
    '<label class="ab-f"><span>Taxa de juros (se souber)</span><input class="inp" data-d="taxa" value="' + esc(d.taxa || '') + '" placeholder="ex.: 2,9% a.m."></label>' +
    '</div><div class="ab-f" style="margin-top:10px"><span>Garantias</span><div class="ab-chips" data-gar="' + i + '">' + GAR.map(([k, n]) => '<button type="button" data-g="' + k + '" class="' + ((d.garantias || []).includes(k) ? 'on' : '') + '">' + esc(n) + '</button>').join('') + '</div></div></div>';
}
function htmlResultado(a) {
  const q = qualificar(a), t = q.t, docs = documentos(a), ml = malote(a), ps = passos(a);
  let h = '<div class="ab-c"><h3>Resumo</h3><div class="ab-kpi"><div><b>' + brl(t.saldo) + '</b>saldo informado</div><div><b>' + brl(t.parc) + '</b>parcelas por mês</div><div><b>' + (t.comp != null ? Math.round(t.comp * 100) + '%' : '—') + '</b>da renda/faturamento em parcelas</div><div><b>' + (t.bancos.length || 0) + '</b>banco(s): ' + esc(t.bancos.join(', ') || '—') + '</div></div>' +
    q.alertas.map((x) => '<div class="ab-alerta">' + esc(x) + '</div>').join('') +
    '<h3 style="margin-top:14px">Caminhos indicados</h3><ol class="ab-ol">' + (q.servicos.length ? q.servicos.map((s) => '<li><b>' + esc(s[0]) + '</b><small>' + esc(s[1]) + '</small></li>').join('') : '<li>Preencha as dívidas e a triagem.</li>') + '</ol></div>';
  const grupos = {}; docs.forEach(([g, x]) => (grupos[g] = grupos[g] || []).push(x));
  h += '<div class="ab-c"><h3>Documentos para pedir ao cliente</h3><p class="sub">Entregue a lista inteira de uma vez, por escrito (pedido fracionado prolonga a etapa).</p>' + Object.entries(grupos).map(([g, l]) => '<div style="margin-top:8px"><b>' + esc(g) + '</b><ul class="ab-ol">' + l.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') +
    '<div style="margin-top:10px"><button class="btn" type="button" id="abCopiar">' + ic('zap', 's') + ' Copiar lista para o WhatsApp</button></div></div>';
  h += '<div class="ab-c"><h3>Plano do malote</h3><p class="sub">Os três primeiros abrem e sondam; os três últimos convergem e fecham. Modelos do Caderno de Malotes do curso (versão do cliente para o Consumidor.gov/BACEN e versão do escritório em PDF anexo).</p><ol class="ab-ol">' +
    ml.m.map(([tp, n, x, agora]) => '<li><span class="ab-tag' + (agora ? ' ok' : '') + '">' + esc(tp) + (agora ? ' · enviar já' : ' · depois') + '</span><b>' + esc(n) + '</b><small>' + esc(x) + '</small></li>').join('') + '</ol>' +
    '<div style="margin-top:10px"><b>Canais (sempre pelo menos três, ao mesmo tempo)</b><ul class="ab-ol">' + ml.canais.map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul><p class="sub" style="margin-top:6px">Silêncio vira desídia documentada; resposta genérica reforça a inversão do ônus; resposta técnica leva direto à mesa. Guarde a prova de cada canal.</p></div></div>';
  h += '<div class="ab-c"><h3>Próximos passos (método do curso)</h3><ol class="ab-ol" style="list-style:none;padding-left:0">' + ps.map(([n, x]) => '<li>' + (n === 'URGENTE' ? '<span class="ab-tag urg">urgente</span>' : n ? '<span class="ab-tag">' + esc(n) + '</span>' : '<span class="ab-tag" style="opacity:.5">+</span>') + esc(x) + '</li>').join('') + '</ol></div>';
  const pz = prazo(a), hn = honorarios(a), H = a.hon || {};
  h += '<div class="ab-c"><h3>Tempo estimado de execução</h3><p class="sub">' + esc(pz.total) + '</p><ol class="ab-ol" style="list-style:none;padding-left:0">' + pz.fases.map(([n, x]) => '<li><span class="ab-tag' + (n === 'Imediato' ? ' urg' : '') + '">' + esc(n) + '</span>' + esc(x) + '</li>').join('') + '</ol><ul class="ab-ol">' + pz.hz.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>';
  h += '<div class="ab-c"><h3>Honorários indicados</h3><p class="sub">Pela tabela de precificação e pelos quatro momentos de cobrança do curso (pró-labore, taxa mensal, liminar e êxito).</p>' +
    (hn.linhas.length ? '<div class="tab-wrap"><table class="tb"><thead><tr><th style="text-align:left">Momento</th><th style="text-align:left">Indicação</th><th style="text-align:left">Como chegar ao valor</th></tr></thead><tbody>' + hn.linhas.map(([m, v, o]) => '<tr><td style="text-align:left"><b>' + esc(m) + '</b></td><td style="text-align:left;white-space:nowrap"><b>' + esc(v) + '</b></td><td style="text-align:left;white-space:normal">' + esc(o) + '</td></tr>').join('') + '</tbody></table></div>' : '') +
    '<ul class="ab-ol">' + hn.obs.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<h3 style="margin-top:14px">Proposta registrada</h3><p class="sub">O que foi efetivamente proposto ao cliente (inicial e êxito separados, como pede o CRM do curso).</p><div class="ab-grid">' +
    [['inicial', 'Honorário inicial (R$)'], ['forma', 'Forma de pagamento da entrada'], ['tmp', 'Taxa mensal (R$/mês)'], ['exito', 'Êxito (% da redução)'], ['status', 'Situação da proposta']].map(([k, n]) => '<label class="ab-f"><span>' + n + '</span>' + (k === 'status' ? '<select class="sel" data-h="status"><option value="">—</option>' + ['Apresentada', 'Em negociação', 'Aceita (contrato assinado)', 'Recusada'].map((o) => '<option' + (H.status === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select>' : '<input class="inp" data-h="' + k + '" value="' + esc(H[k] || '') + '">') + '</label>').join('') + '</div></div>';
  const ans = (a.analises || []).filter((x) => x.r);
  if (ans.length) h += '<div class="ab-c"><h3>Ilegalidades apontadas nos contratos (IA)</h3><p class="sub">Detalhe, fundamentos e estratégia na aba 9 · Contrato (IA).</p><ol class="ab-ol">' + ans.map((x) => lista(x.r.ilegalidades).map((y) => '<li><span class="ab-tag ' + (FORCA[y.forca] || FORCA.media)[1] + '">' + (FORCA[y.forca] || FORCA.media)[0] + '</span>' + esc(y.titulo) + '<small>' + esc([((x.r.contrato || {}).instituicao), y.fundamento].filter((z) => !vz(z)).join(' · ')) + '</small></li>').join('')).join('') + '</ol><button class="btn sm" type="button" data-sec="ctr">Abrir as análises</button></div>';
  h += '<div class="ab-c"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" id="abDocx">' + ic('baixar', 's') + ' Baixar relatório .docx</button>' + (F.caso_id ? '<a class="btn" href="#/caso/' + F.caso_id + '">' + ic('voltar', 's') + ' Abrir o caso</a>' : '') + '</div></div>';
  return h;
}
function render() {
  const a = F.A, sec = F.sec;
  titulo('Atendimento bancário' + (a.nome ? ' · ' + a.nome.split(' ')[0] : ''), '<span class="ab-salvo" id="abSalvo">' + (F.salvoEm ? 'salvo às ' + F.salvoEm : '') + '</span><a class="btn fant sm" href="#/bancario">' + ic('voltar', 's') + '<span class="so-desk"> Atendimentos</span></a>');
  let h = '<div class="ab"><div class="ab-tabs">' + SECOES.map(([k, n]) => '<button type="button" data-sec="' + k + '" class="' + (k === sec ? 'on' : '') + '">' + n + '</button>').join('') + '</div>';
  if (sec === 'cli') h += '<div class="ab-c"><h3>Cliente</h3><p class="sub">' + (F.caso_id ? 'Ligado ao caso do cadastro.' : 'Atendimento sem cadastro: preencha o nome.') + '</p><div class="ab-grid">' +
    '<label class="ab-f"><span>Nome / razão social</span><input class="inp" data-a="nome" value="' + esc(a.nome || '') + '"></label>' +
    '<label class="ab-f"><span>CPF / CNPJ</span><input class="inp" data-a="doc" value="' + esc(a.doc || '') + '"></label>' +
    '<label class="ab-f"><span>Atividade / profissão</span><input class="inp" data-a="atividade" value="' + esc(a.atividade || '') + '"></label>' +
    '<label class="ab-f"><span>Cidade / UF</span><input class="inp" data-a="cidade" value="' + esc(a.cidade || '') + '"></label></div>' +
    '<div class="ab-f" style="margin-top:12px"><span>Tipo de cliente</span><div class="pills" data-tipo>' + TIPOS.map(([k, n]) => '<button type="button" data-v="' + k + '" class="' + (a.tipo === k ? 'on' : '') + '">' + n + '</button>').join('') + '</div></div></div>';
  else if (sec === 'div') { const t = totais(a); h += '<div class="ab-c"><h3>Dívidas bancárias</h3><p class="sub">Uma linha por contrato. Total informado: <b>' + brl(t.saldo) + '</b> · parcelas: <b>' + brl(t.parc) + '</b>/mês.</p>' + (a.dividas || []).map(htmlDivida).join('') + '<div style="margin-top:10px"><button class="btn" type="button" id="abAddDiv">+ Adicionar dívida</button></div></div>'; }
  else if (sec === 'res') h += htmlResultado(a);
  else if (sec === 'ctr') h += htmlContrato(a);
  else { const l = Q.filter((q) => q[0] === sec && (!q[5] || q[5](a))); h += '<div class="ab-c"><h3>' + esc(SECN[sec]) + '</h3>' + (!a.tipo ? '<p class="sub">Escolha o tipo de cliente na aba 1 para ver todas as perguntas.</p>' : '') + (l.length ? l.map((q) => htmlPergunta(a, q)).join('') : '<p class="pp mut">Nenhuma pergunta específica para este caso.</p>') + '</div>'; }
  const i = SECOES.findIndex((s) => s[0] === sec);
  h += '<div style="display:flex;justify-content:space-between;gap:8px">' + (i > 0 ? '<button class="btn" type="button" data-sec="' + SECOES[i - 1][0] + '">' + ic('voltar', 's') + ' ' + SECOES[i - 1][1] + '</button>' : '<span></span>') + (i < SECOES.length - 1 ? '<button class="btn pri" type="button" data-sec="' + SECOES[i + 1][0] + '">' + SECOES[i + 1][1] + ' ' + ic('seta', 's') + '</button>' : '') + '</div></div>';
  $('#cont').innerHTML = h;
  ligar();
}
function ligar() {
  const c = $('#cont'), a = F.A;
  c.querySelectorAll('[data-sec]').forEach((b) => b.onclick = () => { F.sec = b.dataset.sec; render(); window.scrollTo(0, 0); });
  c.querySelectorAll('[data-a]').forEach((i) => i.oninput = () => { a[i.dataset.a] = i.value; marcarSujo(); });
  c.querySelectorAll('[data-tipo] button').forEach((b) => b.onclick = () => { a.tipo = b.dataset.v; marcarSujo(); render(); });
  c.querySelectorAll('[data-r]').forEach((i) => { const ev = i.tagName === 'SELECT' ? 'onchange' : 'oninput'; i[ev] = () => { a.r[i.dataset.r] = i.value; marcarSujo(); }; });
  c.querySelectorAll('[data-sn]').forEach((g) => g.querySelectorAll('button').forEach((b) => b.onclick = () => { const k = g.dataset.sn; a.r[k] = a.r[k] === b.dataset.v ? '' : b.dataset.v; marcarSujo(); render(); }));
  c.querySelectorAll('[data-chip]').forEach((g) => g.querySelectorAll('button').forEach((b) => b.onclick = () => { const k = g.dataset.chip; a.r[k] = a.r[k] === b.textContent ? '' : b.textContent; marcarSujo(); render(); }));
  c.querySelectorAll('.ab-div').forEach((box) => { const i = Number(box.dataset.i); const d = a.dividas[i];
    box.querySelectorAll('[data-d]').forEach((el) => { const ev = el.tagName === 'SELECT' ? 'onchange' : 'oninput'; el[ev] = () => { d[el.dataset.d] = el.value; marcarSujo(); if (el.dataset.d === 'banco') render(); }; });
    box.querySelectorAll('[data-g]').forEach((b) => b.onclick = () => { const g = b.dataset.g; d.garantias = d.garantias || []; d.garantias = d.garantias.includes(g) ? d.garantias.filter((x) => x !== g) : d.garantias.concat(g); marcarSujo(); render(); });
  });
  c.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { a.dividas.splice(Number(b.dataset.rm), 1); if (!a.dividas.length) a.dividas.push({}); marcarSujo(); render(); });
  const ad = $('#abAddDiv'); if (ad) ad.onclick = () => { a.dividas.push({}); marcarSujo(); render(); };
  const cp = $('#abCopiar'); if (cp) cp.onclick = async () => { const nome = (a.nome || '').split(' ')[0]; const txt = (nome ? 'Olá, ' + nome + '! ' : '') + 'Para darmos sequência à análise das suas dívidas bancárias, por favor nos envie:\n\n' + documentos(a).map(([, x]) => '• ' + x).join('\n') + '\n\nPode mandar por aqui mesmo, em foto ou PDF. Qualquer dúvida, estamos à disposição.\nFCE Advogados';
    try { await navigator.clipboard.writeText(txt); toast('Lista copiada. Cole no WhatsApp do cliente.'); } catch (e) { toast('Não foi possível copiar.', true); } };
  c.querySelectorAll('[data-h]').forEach((i) => { const ev = i.tagName === 'SELECT' ? 'onchange' : 'oninput'; i[ev] = () => { a.hon = a.hon || {}; a.hon[i.dataset.h] = i.value; marcarSujo(); }; });
  ligarContrato();
  const dx = $('#abDocx'); if (dx) dx.onclick = async () => { dx.disabled = true; try { await gerarDocx(); toast('Relatório .docx baixado.'); } catch (e) { toast(e.message || 'Não foi possível gerar o .docx.', true); } finally { dx.disabled = false; } };
}

// ---------- contrato (IA) ----------
// 22/11/2026: o advogado envia o contrato (PDF/foto ou texto colado); o workflow "Diagnóstico IA" (tipo 'contrato') analisa com a base do curso
// e as anotações do Dr. Fábio (doc claude/abm-anotacoes-fabio.md) e devolve JSON: dados do contrato, testes, ilegalidades com estratégia.
// Os arquivos não são guardados; só o resultado vai para A.analises.
const IA_URL = 'https://emerim.app.n8n.cloud/webhook/fce-app-diag-ia';
const FORCA = { forte: ['Forte', 'urg'], media: ['Média', ''], fraca: ['Fraca', 'fr'] };
let CT = { arqs: [], texto: '', div: '', rodando: false, msg: '' };
css.textContent += `
.ab-drop{border:2px dashed var(--line-2);border-radius:14px;padding:18px;text-align:center;cursor:pointer;color:var(--mut);font-size:13.5px}
.ab-drop.on{border-color:var(--navy);background:color-mix(in srgb,var(--navy) 5%,transparent)}
.ab-arq{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.ab-arq span{background:var(--info-soft);color:var(--info);border-radius:14px;padding:4px 10px;font-size:12px;font-weight:600}
.ab-arq button{border:0;background:none;color:inherit;cursor:pointer;font-weight:700;margin-left:4px}
.ab-il{border:1px solid var(--line);border-left:4px solid var(--info);border-radius:12px;padding:12px 14px;margin-top:10px}
.ab-il.forte{border-left-color:var(--bad)}.ab-il.fraca{border-left-color:var(--line-2)}
.ab-il h4{margin:0 0 6px;font-size:15px}.ab-il dl{margin:0;display:grid;grid-template-columns:150px 1fr;gap:4px 12px;font-size:13px}
.ab-il dt{color:var(--mut);font-weight:600}.ab-il dd{margin:0;line-height:1.45}
.ab-il q{font-style:italic;color:var(--txt)}
.ab-tag.fr{background:color-mix(in srgb,var(--txt) 8%,transparent);color:var(--mut)}
.ab-kv{width:100%;border-collapse:collapse;font-size:13px}.ab-kv td{padding:5px 8px;border-top:1px solid var(--line);vertical-align:top}.ab-kv td:first-child{color:var(--mut);font-weight:600;width:190px}
@media (max-width:640px){.ab-il dl{grid-template-columns:1fr}.ab-il dt{margin-top:6px}.ab-kv td:first-child{width:auto}}
`;
const vz = (x) => x == null || (typeof x === 'string' && !x.trim()) || (Array.isArray(x) && !x.filter((y) => vz(y) === false).length);
const lista = (l) => (Array.isArray(l) ? l : []).filter((x) => !vz(x));
function nomeDiv(d, i) { return 'Dívida ' + (i + 1) + ': ' + [d.banco === 'Outro' ? (d.banco_outro || 'Outro') : d.banco, MODN[d.modalidade], d.contrato ? 'nº ' + d.contrato : ''].filter(Boolean).join(' · '); }
function contextoIA(a) {
  const t = totais(a), TN = Object.fromEntries(TIPOS); const l = [];
  l.push('CONTEXTO DO ATENDIMENTO (informado pelo cliente; use só como contexto, o que vale é o documento):');
  l.push('- Cliente: ' + (TN[a.tipo] || 'tipo não informado') + (a.atividade ? ', ' + a.atividade : '') + (a.cidade ? ', ' + a.cidade : '') + '.');
  if (t.renda) l.push('- Renda/faturamento mensal informado: ' + brl(t.renda) + (t.comp != null ? '; parcelas comprometem ' + Math.round(t.comp * 100) + '%.' : '.'));
  const d = CT.div !== '' ? (a.dividas || [])[Number(CT.div)] : null;
  if (d) { l.push('- Dívida deste contrato: ' + nomeDiv(d, Number(CT.div)) + '; situação: ' + (SITN[d.situacao] || 'não informada') + '; contratado em ' + (d.data || '?') + '; valor ' + (d.valor || '?') + '; saldo ' + (d.saldo || '?') + '; parcela ' + (d.parcela || '?') + '; parcelas ' + (d.parcelas || '?') + '; taxa informada ' + (d.taxa || '?') + '; garantias: ' + ((d.garantias || []).map((g) => GARN[g]).join(', ') || 'não informadas') + '.'); }
  else if (t.bancos.length) l.push('- Bancos do cliente: ' + t.bancos.join(', ') + '.');
  [['vinculo', 'Vínculo de renda'], ['seguro', 'Paga seguro junto com o empréstimo'], ['casada', 'Produtos vendidos junto'], ['reneg', 'Houve renegociação/confissão'], ['reneg_det', 'Renegociações'], ['tem_contratos', 'Tem cópia dos contratos'], ['deb_auto', 'Débito automático na conta de renda'], ['acao', 'Ação judicial em curso'], ['fato_tipo', 'Fato gerador']].forEach(([k, n]) => { const v = R(a, k); if (v) l.push('- ' + n + ': ' + (v === 'sim' ? 'sim' : v === 'nao' ? 'não' : v === 'ns' ? 'não sabe' : v) + '.'); });
  l.push('Data de hoje: ' + new Date().toLocaleDateString('pt-BR') + '.');
  return l.join('\n');
}
// PDFs grandes (acima de ~6 MB, em geral escaneados) não passam pelo limite de envio: são convertidos aqui no navegador com o pdf.js.
// Página com texto vira texto; página só com imagem vira JPEG reduzido. Assim um contrato de 17 MB cai para 2–6 MB.
let pdfLib = null;
function carregarPdf() { if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib); if (pdfLib) return pdfLib; pdfLib = new Promise((ok, er) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; ok(window.pdfjsLib); }; s.onerror = () => { pdfLib = null; er(new Error('Não foi possível carregar o leitor de PDF.')); }; document.head.appendChild(s); }); return pdfLib; }
async function pdfReduzido(f, aviso) {
  const L = await carregarPdf(); const doc = await L.getDocument({ data: await f.arrayBuffer() }).promise;
  const out = [], textos = []; let imgs = 0; const MAXP = 80, MAXI = 40;
  for (let n = 1; n <= Math.min(doc.numPages, MAXP); n++) {
    if (aviso) aviso('Preparando ' + f.name + ': página ' + n + ' de ' + doc.numPages + '…');
    const pg = await doc.getPage(n); const tc = await pg.getTextContent(); const tx = tc.items.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim();
    if (tx.length >= 150) { textos.push('[Página ' + n + ']\n' + tx); continue; }
    if (imgs >= MAXI) { textos.push('[Página ' + n + ': imagem não enviada — limite de ' + MAXI + ' páginas escaneadas]'); continue; }
    const v1 = pg.getViewport({ scale: 1 }); const k = Math.min(2.5, 1600 / Math.max(v1.width, v1.height)); const vp = pg.getViewport({ scale: k });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, c.width, c.height);
    await pg.render({ canvasContext: cx, viewport: vp }).promise;
    out.push({ nome: f.name + ' · p. ' + n, mime: 'image/jpeg', b64: c.toDataURL('image/jpeg', 0.72).split(',')[1], pdf: f.name }); imgs++;
    textos.push('[Página ' + n + ': enviada como imagem ' + imgs + ']');
  }
  if (doc.numPages > MAXP) textos.push('[O PDF tem ' + doc.numPages + ' páginas; só as ' + MAXP + ' primeiras foram enviadas]');
  out.unshift({ nome: f.name, mime: 'text/plain', texto: 'ARQUIVO ' + f.name + ' (' + doc.numPages + ' páginas; convertido no navegador):\n' + textos.join('\n\n'), b64: '', resumo: true, paginas: doc.numPages, imgs });
  return out;
}
function lerArquivo(f) {
  return new Promise((ok, er) => {
    if (/^image\//.test(f.type) && f.size > 1500000) {
      const img = new Image(), u = URL.createObjectURL(f);
      img.onload = () => { const m = 2200, k = Math.min(1, m / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok({ nome: f.name, mime: 'image/jpeg', b64: c.toDataURL('image/jpeg', 0.85).split(',')[1] }); };
      img.onerror = () => er(new Error('Não consegui ler a imagem ' + f.name)); img.src = u; return;
    }
    const r = new FileReader(); r.onload = () => ok({ nome: f.name, mime: f.type || (/\.pdf$/i.test(f.name) ? 'application/pdf' : ''), b64: String(r.result).split(',')[1] || '' }); r.onerror = () => er(new Error('Não consegui ler ' + f.name)); r.readAsDataURL(f);
  });
}
async function addArquivos(files) {
  for (const f of files) {
    if (!(/pdf$/i.test(f.type) || /\.pdf$/i.test(f.name) || /^image\/(png|jpeg|gif|webp)$/.test(f.type))) { toast('Use PDF ou foto (JPG, PNG). ' + f.name + ' ficou de fora.', true); continue; }
    try {
      const ePdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name);
      if (ePdf && f.size > 6e6) { const m = $('#ctMsg2'); const av = (t) => { const x = $('#ctMsg2'); if (x) x.textContent = t; }; av('Preparando ' + f.name + '…');
        const l = await pdfReduzido(f, av); CT.arqs.push(...l); av(''); toast(f.name + ': ' + l[0].paginas + ' páginas preparadas (' + l[0].imgs + ' como imagem).'); }
      else { const x = await lerArquivo(f); CT.arqs.push(x); }
    } catch (e) { toast((e && e.message) || 'Não consegui ler ' + f.name, true); }
  }
  const tam = tamEnvio();
  if (tam > LIMITE) toast('Os arquivos somam ' + Math.round(tam * 0.75 / 1e6) + ' MB; o limite de envio é ~9 MB. Tire páginas que não são do contrato.', true);
}
const LIMITE = 12e6; // caracteres em base64 (~9 MB de arquivo), abaixo do limite de 16 MB do webhook do n8n
const tamEnvio = () => CT.arqs.reduce((s, x) => s + (x.b64 || '').length + (x.texto || '').length, 0);
function extrairJSON(t) { const s = String(t || ''); const i = s.indexOf('{'), j = s.lastIndexOf('}'); if (i < 0 || j <= i) return null; try { return JSON.parse(s.slice(i, j + 1)); } catch (e) { return null; } }
async function analisar() {
  const meu = F, a = F.A;
  if (!CT.arqs.length && CT.texto.trim().length < 200) { toast('Anexe o contrato (PDF ou foto) ou cole o texto completo.', true); return; }
  if (tamEnvio() > LIMITE) { toast('Os arquivos passam do limite de envio (~9 MB). Tire páginas que não são do contrato ou envie fotos menores.', true); return; }
  CT.rodando = true; CT.msg = 'A IA está lendo o contrato e aplicando o método do curso. Leva de 1 a 4 minutos; não feche esta tela.'; render();
  try {
    const r = await fetch(IA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-fce-token': S.token || '' }, body: JSON.stringify({ tipo: 'contrato', token: S.token, prompt: contextoIA(a), texto: [CT.texto].concat(CT.arqs.filter((x) => x.texto).map((x) => x.texto)).filter((x) => String(x || '').trim()).join('\n\n'), arquivos: CT.arqs.filter((x) => x.b64).map((x) => ({ nome: x.nome, mime: x.mime, b64: x.b64 })) }) });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!j && (r.status === 413 || r.status >= 500)) throw new Error('O envio foi recusado (' + r.status + '), provavelmente pelo tamanho. Tire páginas que não são do contrato e tente de novo.');
    if (!r.ok || !j || !j.ok) throw new Error(j && j.erro === 'sessao' ? 'Sua sessão expirou. Entre de novo.' : (j && j.erro) || ('A IA não respondeu (' + r.status + '). Tente de novo.'));
    let out = j.dados || {};
    if (out.job) { // a análise roda em segundo plano no n8n; consulta a cada 8 s por até 10 min
      const t0 = Date.now(); let st = { status: 'rodando' };
      while (st.status === 'rodando') {
        if (Date.now() - t0 > 600000) throw new Error('A análise está demorando mais que o normal. Tente de novo em alguns minutos.');
        await new Promise((ok) => setTimeout(ok, 8000));
        try { st = (await api('ab_job', { job: out.job })) || st; } catch (e) {}
        const seg = Math.round((Date.now() - t0) / 1000); const m = $('#ctMsg'); if (m) m.textContent = 'A IA está lendo o contrato e aplicando o método do curso (' + seg + ' s). Pode levar até 4 minutos; não feche esta tela.';
      }
      if (st.status !== 'pronto') throw new Error(st.erro || 'A IA não conseguiu concluir a análise.');
      out = { texto: st.texto, cortado: st.cortado };
    }
    const txt = out.texto || '', res = extrairJSON(txt); j.dados = out;
    a.analises = a.analises || [];
    a.analises.unshift({ id: Date.now().toString(36), em: new Date().toISOString(), arquivos: [...new Set(CT.arqs.map((x) => x.pdf || x.nome))].concat(CT.texto.trim() ? ['texto colado'] : []), div: CT.div, r: res, bruto: res ? '' : txt, cortado: !!(j.dados || {}).cortado });
    CT = { arqs: [], texto: '', div: CT.div, rodando: false, msg: '' };
    if (F === meu) marcarSujo(); else api('ab_salvar', { id: meu.id || '', caso_id: meu.caso_id || '', nome: a.nome || '', dados: a }).catch(() => {}); toast(res ? 'Análise pronta.' : 'A IA respondeu fora do formato; o texto ficou salvo.', !res);
  } catch (e) { CT.rodando = false; CT.msg = ''; toast(e.message || 'Falhou.', true); }
  if (F === meu && /^#\/bancario\//.test(location.hash)) render();
}
function htmlAnalise(x, i) {
  const r = x.r || {}, c = r.contrato || {}, est = r.estrategia_recomendada || {}, tm = r.taxa_media_bacen || {};
  let h = '<div class="ab-c" data-an="' + i + '"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap"><div><h3>' + esc([c.tipo, c.instituicao, c.numero ? 'nº ' + c.numero : ''].filter((y) => !vz(y)).join(' · ') || 'Análise do contrato') + '</h3><p class="sub">Analisado em ' + esc(fmtD(x.em, { dateStyle: 'short', timeStyle: 'short' })) + ' · ' + esc((x.arquivos || []).join(', ')) + (x.div !== '' && x.div != null && (F.A.dividas || [])[Number(x.div)] ? ' · ' + esc(nomeDiv(F.A.dividas[Number(x.div)], Number(x.div))) : '') + '</p></div><button class="btn fant sm" type="button" data-rman="' + i + '">Excluir análise</button></div>';
  if (x.cortado) h += '<div class="ab-alerta">A resposta foi cortada por tamanho; a análise pode estar incompleta. Tente enviar só as páginas do contrato.</div>';
  if (!x.r) return h + '<p class="sub">A IA respondeu fora do formato esperado. Texto recebido:</p><pre style="white-space:pre-wrap;font-size:12.5px">' + esc(x.bruto || '') + '</pre></div>';
  if (r.resumo_para_cliente) h += '<div class="ab-alerta" style="border-left-color:var(--navy);background:color-mix(in srgb,var(--navy) 6%,transparent)"><b>Em linguagem simples:</b> ' + esc(r.resumo_para_cliente) + '</div>';
  const CAMPOS = [['data', 'Data'], ['devedor', 'Devedor'], ['valor_liberado', 'Valor liberado'], ['valor_financiado', 'Valor financiado'], ['prazo', 'Prazo'], ['parcela', 'Parcela'], ['sistema_amortizacao', 'Amortização'], ['taxa_mensal', 'Taxa mensal'], ['taxa_anual', 'Taxa anual'], ['taxa_diaria', 'Taxa diária'], ['cet_mensal', 'CET mensal'], ['cet_anual', 'CET anual'], ['indexador', 'Indexador'], ['iof', 'IOF'], ['garantias', 'Garantias'], ['encargos_mora', 'Encargos de mora'], ['observacoes', 'Observações']];
  const tar = lista(c.tarifas).map((t) => [t.nome, t.valor].filter(Boolean).join(': ')).join('; '), seg = lista(c.seguros).map((t) => [t.nome, t.valor, t.seguradora].filter(Boolean).join(' · ')).join('; ');
  h += '<h3 style="margin-top:12px;font-size:16px">Dados do contrato</h3><table class="ab-kv">' + CAMPOS.filter(([k]) => !vz(c[k])).map(([k, n]) => '<tr><td>' + n + '</td><td>' + esc(c[k]) + '</td></tr>').join('') + (tar ? '<tr><td>Tarifas</td><td>' + esc(tar) + '</td></tr>' : '') + (seg ? '<tr><td>Seguros</td><td>' + esc(seg) + '</td></tr>' : '') + '</table>';
  const ts = lista(r.testes); if (ts.length) h += '<h3 style="margin-top:14px;font-size:16px">Contas e testes</h3><ol class="ab-ol">' + ts.map((t) => '<li><b>' + esc(t.teste) + ':</b> ' + esc(t.resultado || '') + (t.conta ? '<small>' + esc(t.conta) + '</small>' : '') + (t.leitura ? '<small>' + esc(t.leitura) + '</small>' : '') + '</li>').join('') + '</ol>';
  const il = lista(r.ilegalidades);
  h += '<h3 style="margin-top:14px;font-size:16px">Ilegalidades apontadas (' + il.length + ')</h3>' + (il.length ? '' : '<p class="pp mut">Nenhuma ilegalidade identificada no documento enviado.</p>');
  const ord = { forte: 0, media: 1, fraca: 2 };
  il.slice().sort((p, q) => (ord[p.forca] ?? 1) - (ord[q.forca] ?? 1)).forEach((y) => { const f = FORCA[y.forca] || FORCA.media;
    h += '<div class="ab-il ' + esc(y.forca || '') + '"><h4><span class="ab-tag ' + f[1] + '">' + f[0] + '</span>' + esc(y.titulo) + '</h4><dl>' +
      [['onde', 'Onde'], ['trecho', 'Trecho'], ['fundamento', 'Fundamento'], ['efeito', 'Efeito'], ['estrategia_extrajudicial', 'Estratégia extrajudicial'], ['estrategia_judicial', 'Estratégia judicial'], ['prova', 'Prova'], ['cautela', 'Cautela']].filter(([k]) => !vz(y[k])).map(([k, n]) => '<dt>' + n + '</dt><dd>' + (k === 'trecho' ? '<q>' + esc(y[k]) + '</q>' : esc(y[k])) + '</dd>').join('') + '</dl></div>'; });
  const ns = lista(r.nao_sao_ilegalidades); if (ns.length) h += '<h3 style="margin-top:14px;font-size:16px">O que parece abuso mas não é</h3><ul class="ab-ol">' + ns.map((y) => '<li><b>' + esc(y.ponto) + '</b><small>' + esc(y.porque || '') + '</small></li>').join('') + '</ul>';
  if (!vz(tm.modalidade_sgs)) h += '<h3 style="margin-top:14px;font-size:16px">Taxa média do BACEN (terceira taxa)</h3><p class="pp">Modalidade: <b>' + esc(tm.modalidade_sgs) + '</b>' + (tm.mes_referencia ? ' · mês da contratação: <b>' + esc(tm.mes_referencia) + '</b>' : '') + (tm.observacao ? '<br><small class="mut">' + esc(tm.observacao) + '</small>' : '') + '</p><p class="pp"><a class="btn sm" href="https://www.bcb.gov.br/estatisticas/txjuros" target="_blank" rel="noopener">Consultar taxas médias no BACEN</a> <a class="btn sm" href="https://www3.bcb.gov.br/sgspub/" target="_blank" rel="noopener">Séries históricas (SGS)</a></p>';
  if (!vz(est.resumo) || lista(est.passos).length) h += '<h3 style="margin-top:14px;font-size:16px">Estratégia recomendada</h3>' + (est.resumo ? '<p class="pp">' + esc(est.resumo) + '</p>' : '') + (lista(est.passos).length ? '<ol class="ab-ol">' + lista(est.passos).map((p) => '<li>' + esc(p) + '</li>').join('') + '</ol>' : '') +
    (lista(est.malotes).length ? '<p class="pp" style="margin-top:8px"><b>Malotes:</b> ' + esc(lista(est.malotes).join('; ')) + '</p>' : '') + (lista(est.acoes_judiciais).length ? '<p class="pp"><b>Medidas judiciais:</b> ' + esc(lista(est.acoes_judiciais).join('; ')) + '</p>' : '') + (est.efeito_na_negociacao ? '<p class="pp"><b>Na mesa de negociação:</b> ' + esc(est.efeito_na_negociacao) + '</p>' : '');
  const df = lista(r.documentos_faltantes), rs = lista(r.riscos_ao_cliente);
  if (df.length) h += '<h3 style="margin-top:14px;font-size:16px">Documentos e dados que faltam</h3><ul class="ab-ol">' + df.map((y) => '<li>' + esc(y) + '</li>').join('') + '</ul>';
  if (rs.length) h += '<h3 style="margin-top:14px;font-size:16px">Riscos ao cliente</h3><ul class="ab-ol">' + rs.map((y) => '<li>' + esc(y) + '</li>').join('') + '</ul>';
  return h + '<p class="sub" style="margin-top:12px">Análise automática de apoio. Confira cada fundamento na fonte oficial e o cálculo na perícia antes de levar à peça ou ao banco.</p></div>';
}
function htmlContrato(a) {
  const l = (a.dividas || []).map((d, i) => [i, d]).filter(([, d]) => d && (d.banco || d.modalidade || d.saldo));
  let h = '<div class="ab-c"><h3>Análise do contrato com IA</h3><p class="sub">Envie o contrato do cliente (PDF ou fotos legíveis de todas as páginas) ou cole o texto. A IA aponta as ilegalidades e a estratégia pelo método do curso e pelas suas anotações (três taxas, capitalização, Tema 28, tarifas, seguro, provisionamento). Os arquivos não ficam guardados; só a análise.</p>' +
    '<label class="ab-f" style="max-width:520px"><span>Este contrato é de qual dívida?</span><select class="sel" id="ctDiv"><option value="">Contrato avulso / não lançado</option>' + l.map(([i, d]) => '<option value="' + i + '"' + (String(i) === String(CT.div) ? ' selected' : '') + '>' + esc(nomeDiv(d, i)) + '</option>').join('') + '</select></label>' +
    '<div class="ab-drop" id="ctDrop" style="margin-top:12px">' + ic('baixar', 's') + ' <b>Arraste o PDF ou as fotos aqui</b> ou clique para escolher<input type="file" id="ctArq" accept="application/pdf,image/png,image/jpeg,image/webp" multiple hidden></div>' +
    (CT.arqs.length ? '<div class="ab-arq">' + CT.arqs.map((x, i) => x.pdf ? '' : '<span>' + esc(x.nome) + (x.resumo ? ' · ' + x.paginas + ' págs. (' + x.imgs + ' em imagem) · ' + Math.max(1, Math.round(CT.arqs.filter((y) => y.pdf === x.nome).reduce((s, y) => s + y.b64.length, x.texto.length) * 0.75 / 1024)) + ' KB' : ' · ' + Math.max(1, Math.round(x.b64.length * 0.75 / 1024)) + ' KB') + '<button type="button" data-rmarq="' + i + '" title="Tirar">×</button></span>').join('') + '</div>' : '') +
    '<div class="sub" id="ctMsg2" style="margin:6px 0 0"></div>' +
    '<label class="ab-f" style="margin-top:12px"><span>Ou cole o texto do contrato</span><textarea class="inp" id="ctTxt" style="min-height:90px;max-width:none" placeholder="Cole aqui as cláusulas, se tiver o texto">' + esc(CT.texto) + '</textarea></label>' +
    '<div style="margin-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn pri" type="button" id="ctIr"' + (CT.rodando ? ' disabled' : '') + '>' + ic('zap', 's') + (CT.rodando ? ' Analisando…' : ' Analisar contrato') + '</button>' + (CT.msg ? '<span class="sub" id="ctMsg" style="margin:0">' + esc(CT.msg) + '</span>' : '') + '</div></div>';
  (a.analises || []).forEach((x, i) => { h += htmlAnalise(x, i); });
  return h;
}
function ligarContrato() {
  const a = F.A, dz = $('#ctDrop'), inp = $('#ctArq');
  if (!dz) return;
  const sel = $('#ctDiv'); if (sel) sel.onchange = () => { CT.div = sel.value; };
  const tx = $('#ctTxt'); if (tx) tx.oninput = () => { CT.texto = tx.value; };
  dz.onclick = () => inp.click();
  inp.onchange = async () => { await addArquivos([...inp.files]); render(); };
  dz.ondragover = (e) => { e.preventDefault(); dz.classList.add('on'); }; dz.ondragleave = () => dz.classList.remove('on');
  dz.ondrop = async (e) => { e.preventDefault(); dz.classList.remove('on'); await addArquivos([...e.dataTransfer.files]); render(); };
  document.querySelectorAll('[data-rmarq]').forEach((b) => b.onclick = () => { const x = CT.arqs[Number(b.dataset.rmarq)]; CT.arqs = CT.arqs.filter((y) => y !== x && !(x.resumo && y.pdf === x.nome)); render(); });
  const ir = $('#ctIr'); if (ir) ir.onclick = analisar;
  document.querySelectorAll('[data-rman]').forEach((b) => b.onclick = () => { if (!confirm('Excluir esta análise?')) return; a.analises.splice(Number(b.dataset.rman), 1); marcarSujo(); render(); });
}
function docxAnalises(a, corpo, run, par, h1, li) {
  const an = (a.analises || []).filter((x) => x.r); if (!an.length) return;
  corpo.push(h1('Análise dos contratos (IA)'));
  corpo.push(par(run('Análise automática de apoio, feita pelo método do curso e pelas anotações do escritório. Conferir fundamentos na fonte oficial e cálculos na perícia.', { size: 16, italics: true, color: '667082' })));
  an.forEach((x) => { const r = x.r, c = r.contrato || {}, est = r.estrategia_recomendada || {};
    corpo.push(par(run([c.tipo, c.instituicao, c.numero ? 'nº ' + c.numero : ''].filter((y) => !vz(y)).join(' · ') || 'Contrato', { bold: true, size: 22, color: '1B263B' }), { spacing: { before: 200, after: 60 } }));
    [['data', 'Data'], ['valor_liberado', 'Valor liberado'], ['valor_financiado', 'Valor financiado'], ['taxa_mensal', 'Taxa mensal'], ['taxa_anual', 'Taxa anual'], ['cet_anual', 'CET anual'], ['garantias', 'Garantias']].forEach(([k, n]) => { if (!vz(c[k])) corpo.push(li(c[k], n)); });
    lista(r.testes).forEach((t) => corpo.push(li((t.resultado || '') + (t.leitura ? ' — ' + t.leitura : ''), t.teste)));
    lista(r.ilegalidades).forEach((y) => { corpo.push(par([run((FORCA[y.forca] || FORCA.media)[0].toUpperCase() + '  ', { bold: true, color: y.forca === 'forte' ? 'B5470F' : 'B0882E' }), run(y.titulo, { bold: true })], { spacing: { before: 100, after: 40 } }));
      [['onde', 'Onde'], ['trecho', 'Trecho'], ['fundamento', 'Fundamento'], ['efeito', 'Efeito'], ['estrategia_extrajudicial', 'Extrajudicial'], ['estrategia_judicial', 'Judicial'], ['prova', 'Prova'], ['cautela', 'Cautela']].forEach(([k, n]) => { if (!vz(y[k])) corpo.push(li(y[k], n)); }); });
    lista(r.nao_sao_ilegalidades).forEach((y) => corpo.push(li((y.porque || ''), 'Não é ilegalidade: ' + y.ponto)));
    if (!vz(est.resumo)) corpo.push(li(est.resumo, 'Estratégia'));
    lista(est.passos).forEach((p, i) => corpo.push(li(p, 'Passo ' + (i + 1))));
    lista(r.documentos_faltantes).forEach((y) => corpo.push(li(y, 'Falta')));
    lista(r.riscos_ao_cliente).forEach((y) => corpo.push(li(y, 'Risco')));
  });
}

// ---------- .docx ----------
let lib = null;
function carregarDocx() { if (window.docx) return Promise.resolve(window.docx); if (lib) return lib; lib = new Promise((ok, er) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js'; s.onload = () => ok(window.docx); s.onerror = () => { lib = null; er(new Error('Não foi possível carregar o gerador de .docx.')); }; document.head.appendChild(s); }); return lib; }
async function gerarDocx() {
  const X = await carregarDocx(); const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = X;
  const a = F.A, q = qualificar(a), t = q.t; const NAVY = '1B263B', GOLD = 'B0882E', GREY = '667082';
  const run = (x, o) => new TextRun(Object.assign({ text: String(x == null ? '' : x), size: 20, font: 'Calibri' }, o || {}));
  const par = (k, o) => new Paragraph(Object.assign({ children: Array.isArray(k) ? k : [k], spacing: { after: 80 } }, o || {}));
  const h1 = (x) => par(run(x, { bold: true, size: 26, color: NAVY }), { spacing: { before: 280, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, space: 3, color: GOLD } } });
  const li = (x, b) => par([run('• ' + (b ? b + ': ' : ''), { bold: !!b }), run(x)]);
  const bd = { style: BorderStyle.SINGLE, size: 4, color: 'C8CDD3' };
  const cel = (x, head) => new TableCell({ borders: { top: bd, bottom: bd, left: bd, right: bd }, shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: NAVY } : undefined, children: [par(run(x, { size: 17, bold: !!head, color: head ? 'FFFFFF' : '222A38' }))] });
  const TN = Object.fromEntries(TIPOS);
  const corpo = [
    par(run('FCE ADVOGADOS · ATENDIMENTO BANCÁRIO', { bold: true, size: 16, color: GOLD })),
    par(run(a.nome || 'Cliente', { bold: true, size: 40, color: NAVY })),
    par(run([TN[a.tipo] || '', a.doc, a.atividade, a.cidade].filter(Boolean).join(' · '), { color: GREY })),
    par(run('Gerado em ' + new Date().toLocaleString('pt-BR') + '. Material interno de trabalho; não substitui a análise do advogado responsável.', { size: 16, italics: true, color: GREY })),
    h1('Resumo'), li(brl(t.saldo), 'Saldo informado'), li(brl(t.parc) + ' por mês' + (t.comp != null ? ' (' + Math.round(t.comp * 100) + '% da renda/faturamento)' : ''), 'Parcelas'), li(t.bancos.join(', ') || '—', 'Bancos')
  ];
  q.alertas.forEach((x) => corpo.push(par(run('ATENÇÃO: ' + x, { bold: true, color: 'B5470F' }))));
  corpo.push(h1('Caminhos indicados')); q.servicos.forEach((s) => corpo.push(li(s[1], s[0])));
  corpo.push(h1('Dívidas'));
  const l = dvs(a);
  if (l.length) corpo.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ tableHeader: true, children: ['Banco', 'Tipo', 'Situação', 'Contrato', 'Saldo', 'Parcela', 'Garantias'].map((x) => cel(x, true)) })]
    .concat(l.map((d) => new TableRow({ children: [d.banco === 'Outro' ? (d.banco_outro || 'Outro') : d.banco, MODN[d.modalidade] || '', SITN[d.situacao] || '', d.contrato || '', d.saldo ? brl(num(d.saldo)) : '', d.parcela ? brl(num(d.parcela)) : '', (d.garantias || []).map((g) => GARN[g]).join(', ')].map((x) => cel(x || '—')) }))) }));
  else corpo.push(par(run('Nenhuma dívida lançada.')));
  Object.entries(SECN).forEach(([sec, nome]) => {
    const qs = Q.filter((x) => x[0] === sec && (!x[5] || x[5](a)) && String(R(a, x[1]) || '').trim());
    if (!qs.length) return; corpo.push(h1(nome));
    qs.forEach((x) => { const v = R(a, x[1]); corpo.push(par(run(x[2], { bold: true, size: 19 }), { spacing: { after: 20 } }), par(run(v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : v === 'ns' ? 'Não sabe' : v))); });
  });
  corpo.push(h1('Documentos para pedir ao cliente')); documentos(a).forEach(([g, x]) => corpo.push(li(x, g)));
  const ml = malote(a); corpo.push(h1('Plano do malote')); ml.m.forEach(([tp, n, x, ag]) => corpo.push(par([run(n + ' ', { bold: true }), run('(' + tp + (ag ? ', enviar já' : ', depois') + ') ', { color: GREY }), run(x)])));
  corpo.push(par(run('Canais: ' + ml.canais.join('; ') + '.', { size: 18, color: GREY })));
  corpo.push(h1('Próximos passos')); passos(a).forEach(([n, x]) => corpo.push(par([run((n === 'URGENTE' ? 'URGENTE' : n || '+') + '  ', { bold: true, color: n === 'URGENTE' ? 'B5470F' : GOLD }), run(x)])));
  const pz = prazo(a), hn = honorarios(a), H = a.hon || {};
  corpo.push(h1('Tempo estimado de execução'), par(run(pz.total)));
  pz.fases.forEach(([n, x]) => corpo.push(par([run(n + '  ', { bold: true, color: n === 'Imediato' ? 'B5470F' : GOLD }), run(x)])));
  pz.hz.forEach((x) => corpo.push(li(x)));
  corpo.push(h1('Honorários indicados'));
  hn.linhas.forEach(([m, v, o]) => corpo.push(par([run(m + ': ', { bold: true }), run(v + '. ', { bold: true, color: NAVY }), run(o)])));
  hn.obs.forEach((x) => corpo.push(li(x)));
  if (Object.values(H).some((v) => String(v || '').trim())) { corpo.push(par(run('Proposta registrada', { bold: true, size: 22, color: NAVY }), { spacing: { before: 160, after: 60 } }));
    [['inicial', 'Honorário inicial'], ['forma', 'Forma de pagamento'], ['tmp', 'Taxa mensal'], ['exito', 'Êxito'], ['status', 'Situação']].forEach(([k, n]) => { if (String(H[k] || '').trim()) corpo.push(li(H[k], n)); }); }
  docxAnalises(a, corpo, run, par, h1, li);
  const doc = new Document({ creator: 'FCE Advogados', title: 'Atendimento bancário', sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1247, right: 1247 } } }, children: corpo }] });
  const blob = await Packer.toBlob(doc); const el = document.createElement('a'); el.href = URL.createObjectURL(blob);
  el.download = 'atendimento_bancario_' + String(a.nome || 'cliente').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').slice(0, 40) + '.docx';
  document.body.appendChild(el); el.click(); setTimeout(() => { URL.revokeObjectURL(el.href); el.remove(); }, 1500);
}

VIEWS.bancario = async (arg, forcar) => {
  if (!arg) { if (F && F.sujo) await salvar(); return telaLista(forcar); }
  await abrir(arg); render();
};
window.addEventListener('beforeunload', () => { if (F && F.sujo) salvar(); });
})();
