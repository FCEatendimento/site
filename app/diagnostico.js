// Diagnóstico da consulta (FCE): roteiro de perguntas, providências, prazos, prejuízo do cliente, honorários, objeções e copiloto com IA.
(() => {
'use strict';
// ---------- utilidades ----------
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const brl = (n) => (n == null || !isFinite(n)) ? "—" : Number(n).toLocaleString("pt-BR", {style:"currency", currency:"BRL", maximumFractionDigits:0});
const pct = (n) => (n == null || !isFinite(n)) ? "—" : (Math.round(n * 10) / 10).toLocaleString("pt-BR") + "%";
const parseMoney = (s) => { if (s == null) return null; const t = String(s).replace(/[^\d,.-]/g, ""); if (!t) return null; let x = t; if (x.includes(",")) x = x.replace(/\./g, "").replace(",", "."); else if ((x.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(x)) x = x.replace(/\./g, ""); const n = Number(x); return isFinite(n) ? n : null; };
const fmtMoneyInput = (n) => n == null ? "" : Number(n).toLocaleString("pt-BR", {maximumFractionDigits:2});
const hoje = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const diasAte = (iso) => { if (!iso) return null; const d = new Date(iso + "T00:00:00"); if (isNaN(d)) return null; return Math.round((d - hoje()) / 86400000); };
const dataBR = (iso) => { if (!iso) return ""; const [y,m,d] = iso.split("-"); return d + "/" + m + "/" + y; };
const addDias = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const isoHojeMais = (n) => { const d = hoje(); d.setDate(d.getDate() + n); const z = (v) => String(v).padStart(2,"0"); return d.getFullYear() + "-" + z(d.getMonth()+1) + "-" + z(d.getDate()); };
const r50 = (n) => Math.ceil(n / 50) * 50;
const r10 = (n) => Math.ceil(n / 10) * 10;
const minus = (s) => { s = String(s || ""); return s.charAt(0).toLowerCase() + s.slice(1); };
const r100 = (n) => Math.round(n / 100) * 100;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// ---------- áreas ----------
const DEV_IMOVEL = ["af", "exec", "cond", "fiscal"];
const isDev = (a) => DEV_IMOVEL.includes(a.area);
const isVeic = (a) => a.area === "veic";
const isInv = (a) => a.area === "inv_pre" || a.area === "inv_pos";
const bloqueado = (a) => a.area === "fiscal" && a.fis_ente === "nh";
const foraPerfil = (a) => a.area === "outro";
const o = (v, l, show) => ({ v, l, show });

// ---------- etapas ----------
const ETAPAS = [
  { id: "abertura", nome: "Abertura", fala: "Obrigado pela confiança. Nos próximos minutos eu vou entender a sua situação com calma, te explicar o que pode acontecer e quais caminhos existem. No final, você sai daqui sabendo exatamente o que fazer. Posso te fazer algumas perguntas?" },
  { id: "situacao", nome: "Situação", fala: "Me conta com as suas palavras: o que está acontecendo e o que te fez procurar a gente agora?" },
  { id: "caso", nome: "Diagnóstico", fala: "Agora eu preciso de alguns detalhes técnicos. São eles que mostram onde estão as falhas do procedimento e o que ainda dá para fazer." },
  { id: "impacto", nome: "Impacto", fala: "Vamos pensar juntos no que acontece se nada for feito. Não é para assustar, é para a gente decidir com os pés no chão." },
  { id: "financeiro", nome: "Finanças", fala: "Para eu montar um plano que caiba na sua realidade, preciso entender um pouco da sua situação financeira. Fica só entre nós." },
  { id: "decisao", nome: "Decisão", fala: "Antes de eu te mostrar o caminho, duas perguntas rápidas sobre como você costuma tomar esse tipo de decisão." },
  { id: "proposta", nome: "Proposta", fala: "" }
];

// ---------- perguntas ----------
// tipo: single | multi | money | number | date | text | area | scale
const Q = [
  // Abertura
  { id: "nome", e: "abertura", t: "text", l: "Nome do cliente", ph: "Nome e sobrenome" },
  { id: "quem", e: "abertura", t: "single", l: "Quem está falando", opts: [o("dono","Proprietário(a)"), o("conjuge","Cônjuge do proprietário"), o("familiar","Familiar"), o("socio","Sócio da empresa"), o("investidor","Investidor")] },
  { id: "uf", e: "abertura", t: "single", l: "Estado do imóvel ou do bem", opts: [o("RS","RS"), o("SC","SC"), o("PR","PR"), o("SP","SP"), o("MT","MT"), o("MS","MS"), o("outro","Outro")] },
  { id: "consulta_paga", e: "abertura", t: "single", l: "A consulta de R$ 200 já foi paga?", porque: "Se foi, ela é abatida do honorário fixo.", opts: [o("sim","Sim"), o("nao","Não, contratação direta")] },

  // Situação
  { id: "relato", e: "situacao", t: "textarea", l: "Relato do cliente (anote o essencial)", fala: "O que aconteceu até aqui? Desde quando está assim?", porque: "Deixe o cliente falar sem interromper. As pessoas querem ser ouvidas." },
  { id: "area", e: "situacao", t: "single", l: "Qual é a situação?", opts: [
      o("af","Imóvel financiado ou dado em garantia (alienação fiduciária, banco e cartório)"),
      o("exec","Imóvel penhorado ou hipotecado em processo judicial"),
      o("cond","Dívida de condomínio"),
      o("fiscal","IPTU ou ITR atrasado"),
      o("veic","Veículo: atraso ou busca e apreensão"),
      o("inv_pre","Investidor: quer comprar imóvel em leilão"),
      o("inv_pos","Arrematante: já comprou em leilão"),
      o("outro","Outra área (fora do perfil)") ] },
  { id: "fis_ente", e: "situacao", t: "single", l: "Quem cobra o imposto?", show: a => a.area === "fiscal", opts: [o("nh","Município de Novo Hamburgo"), o("mun","Outro município"), o("uniao","União (ITR)")] },
  { id: "garantia_empresa", e: "situacao", t: "single", l: "A dívida é de uma empresa (o imóvel garante dívida empresarial)?", show: a => a.area === "af" || a.area === "exec", porque: "Muda a tese: bem de família dado em garantia de dívida da empresa.", opts: [o("nao","Não, dívida pessoal ou da família"), o("sim","Sim, dívida da empresa"), o("aval","Sou avalista ou fiador")] },

  // Diagnóstico — alienação fiduciária
  { id: "af_fase", e: "caso", t: "single", l: "Em que fase está?", show: a => a.area === "af", opts: [
      o("atraso","Atrasado, ainda sem intimação do cartório"),
      o("intimado","Recebeu intimação do cartório para pagar"),
      o("consolidado","Prazo passou: imóvel consolidado no nome do banco"),
      o("leilao","Leilão marcado"),
      o("arrematado","Imóvel já leiloado ou arrematado"),
      o("reintegracao","Já existe ação de desocupação ou reintegração") ] },
  { id: "af_data_intim", e: "caso", t: "date", l: "Data em que recebeu a intimação", show: a => a.area === "af" && a.af_fase === "intimado", porque: "O prazo para purgar a mora é de 15 dias." },
  { id: "data_leilao1", e: "caso", t: "date", l: "Data do 1º leilão", show: a => (a.area === "af" && ["leilao"].includes(a.af_fase)) || (a.area === "exec" && a.ex_fase === "leilao") || (a.area === "cond" && a.cond_fase === "leilao") || (a.area === "fiscal" && a.fis_fase === "leilao") },
  { id: "data_leilao2", e: "caso", t: "date", l: "Data do 2º leilão", show: a => a.area === "af" && a.af_fase === "leilao" },
  { id: "af_data_citacao", e: "caso", t: "date", l: "Data da citação na ação de reintegração", show: a => a.area === "af" && a.af_fase === "reintegracao" },
  { id: "af_contrato", e: "caso", t: "single", l: "Tipo de contrato", show: a => a.area === "af", opts: [o("sfh","Financiamento habitacional (SFH, Minha Casa)"), o("sfi","Financiamento imobiliário (SFI)"), o("homeequity","Empréstimo com o imóvel em garantia"), o("ccb","Cédula de crédito da empresa (CCB)"), o("construtora","Construtora ou loteadora"), o("consorcio","Consórcio")] },
  { id: "credor", e: "caso", t: "single", l: "Quem é o credor?", show: a => a.area === "af" || (a.area === "exec" && a.ex_tipo === "hipoteca") || a.area === "veic", opts: [o("caixa","Caixa"), o("bb","Banco do Brasil"), o("privado","Banco privado"), o("coop","Cooperativa"), o("fintech","Financeira ou fintech"), o("construtora","Construtora", a => a.area === "af")] },
  { id: "af_data_contrato", e: "caso", t: "single", l: "Quando o contrato foi assinado?", show: a => a.area === "af", porque: "Define as regras aplicáveis (Lei 13.465/2017 e Marco das Garantias, Lei 14.711/2023).", opts: [o("ate2017","Antes de jul/2017"), o("2017a2023","Entre jul/2017 e out/2023"), o("pos2023","Depois de out/2023"), o("nsei","Não sabe")] },
  { id: "af_intim_forma", e: "caso", t: "single", l: "Como a intimação foi entregue?", show: a => a.area === "af" && ["intimado","consolidado","leilao","arrematado","reintegracao"].includes(a.af_fase), fala: "Quem recebeu a carta do cartório? Foi você mesmo, em mãos?", opts: [o("pessoal","Em mãos, para o devedor"), o("terceiro","Com porteiro, parente ou vizinho"), o("horacerta","Por hora certa"), o("edital","Por edital (jornal ou internet)"), o("nao","Não recebeu nada"), o("nsei","Não lembra")] },
  { id: "af_aviso_leilao", e: "caso", t: "single", l: "Foi avisado das datas do leilão por carta ou e-mail?", show: a => a.area === "af" && ["leilao","arrematado","reintegracao"].includes(a.af_fase), porque: "A falta de comunicação das datas ao devedor é um vício frequente.", opts: [o("sim","Sim"), o("nao","Não"), o("nsei","Não sabe")] },
  { id: "af_negociou", e: "caso", t: "single", l: "Já tentou negociar com o credor?", show: a => a.area === "af" || a.area === "veic", opts: [o("nao","Não"), o("recusou","Sim, o credor recusou"), o("inviavel","Sim, proposta impossível de pagar"), o("acordo_quebrado","Fez acordo e não conseguiu cumprir")] },

  // Diagnóstico — execução judicial
  { id: "ex_tipo", e: "caso", t: "single", l: "Que processo é esse?", show: a => a.area === "exec", opts: [o("hipoteca","Execução de hipoteca pelo banco"), o("titulo","Execução de dívida (contrato, cheque, nota)"), o("sentenca","Cumprimento de sentença"), o("trabalhista","Execução trabalhista")] },
  { id: "ex_fase", e: "caso", t: "single", l: "Em que fase está o processo?", show: a => a.area === "exec", opts: [o("citado","Citado há pouco tempo"), o("prazo_passou","Prazo de defesa passou"), o("penhorado","Imóvel penhorado"), o("avaliado","Imóvel avaliado"), o("leilao","Leilão marcado"), o("arrematado","Imóvel arrematado")] },
  { id: "ex_data_citacao", e: "caso", t: "date", l: "Data da juntada do mandado de citação", show: a => a.area === "exec" && a.ex_fase === "citado", porque: "Embargos em 15 dias úteis (art. 915 do CPC)." },
  { id: "ex_bem_familia", e: "caso", t: "single", l: "É o único imóvel residencial da família?", show: a => a.area === "exec" || a.area === "cond" || a.area === "fiscal", opts: [o("sim","Sim, moram nele"), o("nao","Não")] },
  { id: "ex_avaliacao", e: "caso", t: "money", l: "Valor da avaliação judicial", show: a => a.area === "exec" && ["avaliado","leilao","arrematado"].includes(a.ex_fase) },

  // Diagnóstico — condomínio
  { id: "cond_fase", e: "caso", t: "single", l: "Em que fase está a cobrança?", show: a => a.area === "cond", opts: [o("extra","Cobrança amigável ou protesto"), o("ajuizada","Ação ajuizada"), o("penhora","Imóvel penhorado"), o("leilao","Leilão marcado")] },
  { id: "cond_meses", e: "caso", t: "number", l: "Quantos meses em atraso?", show: a => a.area === "cond" },
  { id: "cond_antigas", e: "caso", t: "single", l: "Cobram cotas com mais de 5 anos?", show: a => a.area === "cond", opts: [o("sim","Sim"), o("nao","Não"), o("nsei","Não sabe")] },

  // Diagnóstico — fiscal
  { id: "fis_fase", e: "caso", t: "single", l: "Em que fase está?", show: a => a.area === "fiscal" && a.fis_ente !== "nh", opts: [o("cobranca","Só cobrança ou protesto"), o("execucao","Execução fiscal ajuizada"), o("penhora","Imóvel penhorado"), o("leilao","Leilão marcado")] },
  { id: "fis_antigos", e: "caso", t: "single", l: "Há anos cobrados com mais de 5 anos?", show: a => a.area === "fiscal" && a.fis_ente !== "nh", opts: [o("sim","Sim"), o("nao","Não"), o("nsei","Não sabe")] },
  { id: "fis_dono", e: "caso", t: "single", l: "Ainda é o dono do imóvel?", show: a => a.area === "fiscal" && a.fis_ente !== "nh", opts: [o("sim","Sim"), o("vendeu","Vendeu, mas não transferiu")] },

  // Diagnóstico — veículo
  { id: "v_fase", e: "caso", t: "single", l: "Em que fase está?", show: a => a.area === "veic", opts: [o("atraso","Parcelas atrasadas"), o("notificado","Recebeu notificação de atraso"), o("ajuizada","Ação de busca e apreensão ajuizada"), o("liminar","Liminar deferida, veículo ainda com o cliente"), o("apreendido","Veículo já apreendido")] },
  { id: "v_data_apreensao", e: "caso", t: "date", l: "Data da apreensão", show: a => a.area === "veic" && a.v_fase === "apreendido", porque: "5 dias para pagar a dívida e reaver o veículo; 15 dias para contestar." },
  { id: "v_valor", e: "caso", t: "money", l: "Valor do veículo (tabela FIPE)", show: a => a.area === "veic" },
  { id: "v_saldo", e: "caso", t: "money", l: "Saldo devedor do financiamento", show: a => a.area === "veic" },
  { id: "v_parcela", e: "caso", t: "money", l: "Valor da parcela", show: a => a.area === "veic" },
  { id: "v_pagas", e: "caso", t: "number", l: "Parcelas já pagas", show: a => a.area === "veic" },
  { id: "v_total", e: "caso", t: "number", l: "Total de parcelas do contrato", show: a => a.area === "veic" },
  { id: "v_taxa", e: "caso", t: "single", l: "A taxa de juros parece alta?", show: a => a.area === "veic", porque: "Juros acima da média do Banco Central abrem a revisional.", opts: [o("sim","Sim, acima de 2% ao mês"), o("normal","Parece normal"), o("nsei","Não sabe")] },

  // Diagnóstico — investidor
  { id: "ip_modalidade", e: "caso", t: "single", l: "Que tipo de leilão?", show: a => a.area === "inv_pre", opts: [o("judicial","Judicial"), o("extrajudicial","Extrajudicial (banco)"), o("ambos","Ainda não escolheu")] },
  { id: "ip_escolhido", e: "caso", t: "single", l: "Já escolheu o imóvel?", show: a => a.area === "inv_pre", opts: [o("sim","Sim, um imóvel definido"), o("varios","Tem alguns em vista"), o("nao","Ainda não")] },
  { id: "ip_ocupado", e: "caso", t: "single", l: "O imóvel está ocupado?", show: a => a.area === "inv_pre" || a.area === "inv_pos", opts: [o("ocupado","Ocupado"), o("livre","Desocupado"), o("nsei","Não sabe")] },
  { id: "ip_avaliacao", e: "caso", t: "money", l: "Valor de avaliação do imóvel no edital", show: a => a.area === "inv_pre" },
  { id: "ip_lance", e: "caso", t: "money", l: "Lance que pretende dar", show: a => a.area === "inv_pre" },
  { id: "ip_objetivo", e: "caso", t: "single", l: "Objetivo com o imóvel", show: a => a.area === "inv_pre", opts: [o("revenda","Revender"), o("aluguel","Alugar"), o("morar","Morar")] },
  { id: "pos_problema", e: "caso", t: "single", l: "Qual é o problema?", show: a => a.area === "inv_pos", opts: [o("desocupacao","Desocupação do imóvel"), o("acao_exdono","Ex-dono entrou com ação"), o("registro","Registro, ITBI ou carta de arrematação"), o("dividas","Dívidas antigas de IPTU ou condomínio")] },
  { id: "pos_modalidade", e: "caso", t: "single", l: "A compra foi em leilão", show: a => a.area === "inv_pos", opts: [o("judicial","Judicial"), o("extrajudicial","Extrajudicial (banco)")] },
  { id: "pos_valor", e: "caso", t: "money", l: "Valor da arrematação", show: a => a.area === "inv_pos" },

  // Valores do imóvel (devedor)
  { id: "valor_mercado", e: "caso", t: "money", l: "Quanto vale o imóvel hoje (mercado)?", show: a => isDev(a) || a.area === "inv_pos", fala: "Se você fosse vender hoje, por quanto venderia?" },
  { id: "saldo_devedor", e: "caso", t: "money", l: "Quanto falta pagar (saldo da dívida)?", show: a => isDev(a) },
  { id: "parcela", e: "caso", t: "money", l: "Valor da parcela mensal", show: a => a.area === "af" },
  { id: "parcelas_atraso", e: "caso", t: "number", l: "Quantas parcelas estão atrasadas?", show: a => a.area === "af" },
  { id: "ja_pago", e: "caso", t: "money", l: "Quanto já pagou do imóvel (entrada + parcelas)?", show: a => a.area === "af", porque: "Mostra ao cliente o que ele já investiu e pode perder." },
  { id: "valor_leilao", e: "caso", t: "money", l: "Lance mínimo do leilão (no edital)", show: a => (a.area === "af" && a.af_fase === "leilao") || (a.area === "exec" && a.ex_fase === "leilao") },

  // Impacto
  { id: "imp_moradia", e: "impacto", t: "single", l: "O imóvel é a moradia da família?", show: a => isDev(a), opts: [o("sim","Sim"), o("investimento","Não, é investimento ou aluguel"), o("empresa","É o imóvel da empresa")] },
  { id: "imp_moradores", e: "impacto", t: "multi", l: "Quem mora no imóvel?", show: a => isDev(a) && a.imp_moradia === "sim", opts: [o("conjuge","Cônjuge"), o("filhos","Filhos menores"), o("idosos","Idosos"), o("pcd","Pessoa com deficiência"), o("sozinho","Mora sozinho(a)")] },
  { id: "imp_anos", e: "impacto", t: "number", l: "Há quantos anos mora ou tem o imóvel?", show: a => isDev(a) },
  { id: "imp_plano", e: "impacto", t: "single", l: "Se perder o imóvel, o que vai fazer?", show: a => isDev(a), fala: "Se o leilão acontecer e você precisar sair, para onde vocês vão?", porque: "Faz o cliente enxergar a consequência concreta.", opts: [o("alugar","Alugar outro"), o("parentes","Morar com parentes"), o("comprar","Comprar outro"), o("nsei","Não sabe, não pensou nisso")] },
  { id: "imp_aluguel", e: "impacto", t: "money", l: "Quanto pagaria de aluguel por um imóvel parecido?", show: a => isDev(a) && a.imp_moradia !== "investimento", fala: "Um lugar parecido, na mesma região, custaria quanto por mês?" },
  { id: "imp_mudanca", e: "impacto", t: "money", l: "Quanto custaria a mudança (frete, caução, ajustes)?", show: a => isDev(a) && a.imp_moradia !== "investimento" },
  { id: "imp_renda_aluguel", e: "impacto", t: "money", l: "Quanto o imóvel rende de aluguel por mês?", show: a => isDev(a) && a.imp_moradia === "investimento" },
  { id: "v_uso", e: "impacto", t: "single", l: "Para que usa o veículo?", show: a => isVeic(a), opts: [o("trabalho","Trabalho (renda depende dele)"), o("familia","Família e rotina"), o("ambos","Os dois")] },
  { id: "v_alternativa", e: "impacto", t: "money", l: "Quanto gastaria por mês sem o veículo (aplicativo, aluguel de carro)?", show: a => isVeic(a) },
  { id: "imp_tentou", e: "impacto", t: "single", l: "Já tentou resolver antes?", show: a => isDev(a) || isVeic(a), fala: "O que você já tentou fazer até agora? E o que aconteceu?", opts: [o("nada","Ainda não fez nada"), o("sozinho","Tentou sozinho com o credor"), o("advogado","Teve outro advogado"), o("defensoria","Foi à Defensoria")] },
  { id: "imp_significado", e: "impacto", t: "text", l: "O que esse bem representa para o cliente?", show: a => isDev(a) || isVeic(a), fala: "O que esse imóvel significa para você e para a sua família?", porque: "Anote as palavras dele: você vai usá-las no fechamento." },
  { id: "imp_nota", e: "impacto", t: "scale", l: "De 0 a 10, quanto é importante manter o bem?", show: a => isDev(a) || isVeic(a) },
  { id: "inv_meta", e: "impacto", t: "money", l: "Quanto pretende lucrar ou economizar com a operação?", show: a => a.area === "inv_pre" },
  { id: "inv_risco", e: "impacto", t: "single", l: "O que mais preocupa no investimento?", show: a => isInv(a), opts: [o("ocupacao","Demora para desocupar"), o("anulacao","Leilão ser anulado"), o("dividas","Dívidas escondidas"), o("prazo","Tempo até ter o retorno")] },

  // Financeiro
  { id: "fin_renda", e: "financeiro", t: "money", l: "Renda mensal da família", fala: "Somando todos que contribuem em casa, qual é a renda mensal?" },
  { id: "fin_tipo", e: "financeiro", t: "single", l: "De onde vem a renda?", opts: [o("clt","Salário (CLT)"), o("autonomo","Autônomo"), o("empresario","Empresário"), o("servidor","Servidor público"), o("aposentado","Aposentado"), o("sem","Sem renda no momento")] },
  { id: "fin_disponivel", e: "financeiro", t: "money", l: "Quanto consegue dispor agora, de uma vez?", fala: "Se precisasse resolver isso esta semana, quanto conseguiria juntar?" },
  { id: "fin_mensal", e: "financeiro", t: "money", l: "Quanto cabe no orçamento por mês para resolver?", porque: "Base para o parcelamento dos honorários." },
  { id: "fin_fgts", e: "financeiro", t: "single", l: "Tem saldo de FGTS?", show: a => a.area === "af" && a.af_contrato === "sfh", opts: [o("sim","Sim"), o("nao","Não"), o("nsei","Não sabe")] },
  { id: "fin_outras", e: "financeiro", t: "single", l: "Tem outras dívidas atrasadas?", opts: [o("nao","Não"), o("sim","Sim, algumas"), o("muitas","Sim, várias")] },
  { id: "fin_vender", e: "financeiro", t: "single", l: "Aceitaria vender o bem se for o melhor caminho?", show: a => isDev(a) || isVeic(a), opts: [o("nao","Não, quer manter"), o("talvez","Talvez"), o("sim","Sim")] },
  { id: "fin_forma", e: "financeiro", t: "single", l: "Como prefere pagar os honorários?", opts: [o("pix","Pix à vista"), o("boleto","Boleto parcelado"), o("cartao","Cartão de crédito")] },

  // Decisão
  { id: "dec_decisor", e: "decisao", t: "single", l: "Quem decide junto?", fala: "Essa decisão é só sua ou tem mais alguém que precisa participar?", opts: [o("sozinho","Decide sozinho(a)"), o("presente","Com o cônjuge, que está presente"), o("ausente","Com o cônjuge, que não está aqui"), o("familia","Com outro familiar")] },
  { id: "dec_outros", e: "decisao", t: "single", l: "Já consultou outro advogado?", opts: [o("nao","Não"), o("nao_fechou","Sim, mas não fechou"), o("caro","Sim, achou caro"), o("defensoria","Defensoria Pública")] },
  { id: "dec_quando", e: "decisao", t: "single", l: "Quando quer começar?", opts: [o("hoje","Hoje"), o("semana","Nesta semana"), o("pensar","Vai pensar")] },
  { id: "dec_compromisso", e: "decisao", t: "single", l: "Se o caminho couber no orçamento, começa hoje?", fala: "Se eu te mostrar um caminho viável e que caiba no seu orçamento, faz sentido começarmos hoje?", opts: [o("sim","Sim"), o("talvez","Talvez"), o("nao","Não")] }
];
const QI = Object.fromEntries(Q.map(q => [q.id, q]));
const visivel = (q, a) => !q.show || q.show(a);
const respondida = (q, a) => { const v = a[q.id]; return Array.isArray(v) ? v.length > 0 : (v != null && v !== ""); };
const rotulo = (id, v) => { const q = QI[id]; if (!q) return String(v); if (q.opts) { const arr = Array.isArray(v) ? v : [v]; return arr.map(x => (q.opts.find(p => p.v === x) || {}).l || x).join(", "); } if (q.t === "money") return brl(v); if (q.t === "date") return dataBR(v); return String(v); };

// ---------- motor do diagnóstico ----------
function prazos(a) {
  const out = []; // {nome, data, dias}
  const push = (nome, iso) => { if (iso) out.push({ nome, data: iso, dias: diasAte(iso) }); };
  if (a.area === "af") {
    if (a.af_fase === "intimado" && a.af_data_intim) push("Fim do prazo para purgar a mora (15 dias)", addDias(a.af_data_intim, 15));
    if (a.af_fase === "leilao") { push("1º leilão", a.data_leilao1); push("2º leilão (limite do direito de preferência)", a.data_leilao2); }
    if (a.af_fase === "reintegracao" && a.af_data_citacao) push("Contestação (aprox. 15 dias úteis)", addDias(a.af_data_citacao, 21));
  }
  if (a.area === "exec") {
    if (a.ex_fase === "citado" && a.ex_data_citacao) push("Embargos (aprox. 15 dias úteis)", addDias(a.ex_data_citacao, 21));
    if (a.ex_fase === "leilao") push("Leilão", a.data_leilao1);
  }
  if ((a.area === "cond" && a.cond_fase === "leilao") || (a.area === "fiscal" && a.fis_fase === "leilao")) push("Leilão", a.data_leilao1);
  if (a.area === "veic" && a.v_fase === "apreendido" && a.v_data_apreensao) {
    push("Pagar a dívida e reaver o veículo (5 dias)", addDias(a.v_data_apreensao, 5));
    push("Contestação (15 dias)", addDias(a.v_data_apreensao, 15));
  }
  return out.filter(p => p.dias != null).sort((x, y) => x.dias - y.dias);
}
function urgencia(a) {
  const p = prazos(a).filter(x => x.dias >= -1);
  const fasesQuentes = (a.area === "veic" && ["liminar","apreendido"].includes(a.v_fase)) || (a.area === "af" && ["consolidado","leilao","reintegracao"].includes(a.af_fase));
  if (p.length) {
    const d = p[0].dias;
    const nivel = d <= 7 ? "crit" : d <= 30 ? "alta" : "normal";
    const txt = d < 0 ? "Prazo vencido" : d === 0 ? "Prazo hoje" : d === 1 ? "Prazo amanhã" : d + " dias";
    return { nivel, txt: (nivel === "crit" ? "Crítico · " : nivel === "alta" ? "Alta · " : "") + txt + " — " + p[0].nome, curto: (nivel === "crit" ? "CRÍTICO · " : nivel === "alta" ? "ALTA · " : "") + txt, prazo: p[0] };
  }
  if (fasesQuentes) return { nivel: "alta", txt: "Alta · fase avançada, falta a data", curto: "ALTA · sem data", prazo: null };
  if (a.area) return { nivel: "neutro", txt: "Sem prazo informado", curto: "Sem prazo", prazo: null };
  return { nivel: "neutro", txt: "Sem prazo informado", curto: "Sem prazo", prazo: null };
}

function emJogo(a) {
  const L = []; let total = 0;
  if (isDev(a)) {
    const vm = a.valor_mercado, sd = a.saldo_devedor;
    if (vm != null) {
      const patr = Math.max(0, vm - (sd || 0));
      L.push({ k: "Patrimônio do cliente no imóvel (valor − dívida)", v: patr }); total += patr;
    }
    if (a.imp_aluguel) { const al = a.imp_aluguel * 24; L.push({ k: "Aluguel por 2 anos se perder o imóvel", v: al }); total += al; }
    if (a.imp_mudanca) { L.push({ k: "Mudança e custos de saída", v: a.imp_mudanca }); total += a.imp_mudanca; }
    if (a.imp_renda_aluguel) { const r = a.imp_renda_aluguel * 24; L.push({ k: "Renda de aluguel perdida em 2 anos", v: r }); total += r; }
    if (a.ja_pago) L.push({ k: "Já investido no imóvel (informativo)", v: a.ja_pago, info: true });
  } else if (isVeic(a)) {
    if (a.v_valor != null) { const eq = Math.max(0, a.v_valor - (a.v_saldo || 0)); L.push({ k: "Valor do veículo acima da dívida", v: eq }); total += eq; }
    if (a.v_parcela && a.v_pagas) { const pago = a.v_parcela * a.v_pagas; L.push({ k: "Já pago em parcelas (informativo)", v: pago, info: true }); }
    if (a.v_alternativa) { const al = a.v_alternativa * 12; L.push({ k: "Custo de ficar sem o veículo por 1 ano", v: al }); total += al; }
  } else if (a.area === "inv_pre") {
    if (a.ip_lance) { L.push({ k: "Capital que vai para o lance", v: a.ip_lance }); total += a.ip_lance; }
    if (a.inv_meta) L.push({ k: "Ganho esperado (informativo)", v: a.inv_meta, info: true });
  } else if (a.area === "inv_pos") {
    if (a.pos_valor) { L.push({ k: "Capital investido na arrematação", v: a.pos_valor }); total += a.pos_valor; }
    if (a.valor_mercado && a.pos_valor) L.push({ k: "Margem em jogo (mercado − arrematação)", v: Math.max(0, a.valor_mercado - a.pos_valor), info: true });
  }
  return { linhas: L, total: total || null };
}

function tabelaFixo(base) { if (base == null) return null; if (base <= 300000) return 6000; if (base <= 700000) return 9000; return r100(base * 0.015); }

function honorarios(a) {
  const H = { fixo: null, linhas: [], exito: [], nota: "", produto: "" };
  const consulta = a.consulta_paga === "sim" ? 200 : 0;
  if (bloqueado(a) || foraPerfil(a) || !a.area) return H;
  if (a.area === "af" || a.area === "exec") {
    const base = (a.area === "exec" && a.ex_avaliacao) ? a.ex_avaliacao : a.valor_mercado;
    H.produto = a.area === "af" ? "Defesa do devedor em alienação fiduciária" : "Defesa do executado";
    H.fixo = tabelaFixo(base);
    if (base != null) {
      H.exito.push({ k: "Liminar deferida (1% do valor do imóvel)", v: r100(base * 0.01) });
      H.exito.push({ k: "Êxito na sentença (1% do valor do imóvel)", v: r100(base * 0.01) });
    }
    H.nota = "Tabela: R$ 6 mil até R$ 300 mil; R$ 9 mil de R$ 300 a 700 mil; 1,5% do imóvel acima disso.";
  } else if (a.area === "cond" || a.area === "fiscal") {
    const base = a.valor_mercado; const deb = a.saldo_devedor;
    H.produto = a.area === "cond" ? "Defesa em cobrança de condomínio" : "Defesa em execução fiscal";
    const teto = tabelaFixo(base) || 6000;
    H.fixo = deb != null ? clamp(r100(deb * 0.15), 3000, teto) : 3000;
    H.exito.push({ k: "Êxito: 20% do que for reduzido da dívida", v: null });
    H.nota = "Sem tabela própria: sugestão de 15% do débito, mínimo R$ 3 mil, limitado à tabela do imóvel. Ajuste à mão.";
  } else if (a.area === "veic") {
    const soRevisional = a.v_fase === "atraso" || a.v_fase === "notificado";
    H.produto = soRevisional ? "Revisional do financiamento (preventiva)" : "Defesa na busca e apreensão + revisional";
    H.fixo = soRevisional ? 1500 : ((a.v_valor || 0) > 80000 ? 4000 : 3000);
    H.exito.push({ k: "Êxito: 20% da redução da dívida", v: null });
    H.nota = "Veículo: defesa + revisional R$ 3 mil (até R$ 80 mil) ou R$ 4 mil; só revisional R$ 1,5 mil; + 20% da redução.";
  } else if (a.area === "inv_pre") {
    const av = a.ip_avaliacao;
    H.produto = a.ip_escolhido === "sim" ? "Análise pré-lance" : "Assessoria jurídica em aquisição por leilão (6 meses)";
    if (a.ip_escolhido === "sim") {
      H.fixo = av != null ? clamp(r100(av * 0.01), 1500, 8000) : 1500;
      H.nota = "Análise pré-lance: 1% da avaliação (mín. R$ 1.500, máx. R$ 8.000), abatida se contratar o pós-arrematação.";
    } else {
      H.fixo = 2000;
      H.exito.push({ k: "5% do lance vencedor, na arrematação", v: a.ip_lance ? r100(a.ip_lance * 0.05) : null });
      H.nota = "Assessoria: entrada de R$ 2.000 (abatida do êxito) + 5% do lance vencedor.";
    }
  } else if (a.area === "inv_pos") {
    H.produto = a.pos_problema === "desocupacao" ? "Desocupação do imóvel arrematado" : a.pos_problema === "acao_exdono" ? "Defesa da arrematação" : "Regularização pós-arrematação";
    H.fixo = a.pos_valor ? clamp(r100(a.pos_valor * 0.015), 3000, 15000) : 5000;
    H.nota = "Sem tabela definida: sugestão de 1,5% da arrematação (mín. R$ 3 mil). Ajuste à mão.";
  }
  if (D.ajuste.fixo != null) H.fixo = D.ajuste.fixo;
  H.consulta = consulta;
  H.liquido = H.fixo != null ? Math.max(0, H.fixo - consulta) : null;
  return H;
}

function plano(a, H) {
  if (H.liquido == null) return null;
  const tot = H.liquido;
  if (a.fin_forma === "pix" && D.ajuste.parcelas == null) return { entrada: tot, n: 0, parcela: 0, txt: brl(tot) + " à vista no Pix" };
  let entrada = D.ajuste.entrada != null ? D.ajuste.entrada : (a.fin_disponivel != null ? Math.min(a.fin_disponivel, r50(tot * 0.35)) : r50(tot * 0.2));
  entrada = clamp(entrada, 0, tot);
  let n;
  if (D.ajuste.parcelas != null) n = D.ajuste.parcelas;
  else if (a.fin_mensal) n = clamp(Math.ceil((tot - entrada) / a.fin_mensal), 1, 10);
  else n = 10;
  if (tot - entrada <= 0) return { entrada: tot, n: 0, parcela: 0, txt: brl(tot) + " de entrada" };
  n = Math.max(1, n);
  const parcela = r10((tot - entrada) / n);
  return { entrada, n, parcela, txt: "Entrada de " + brl(entrada) + " + " + n + "x de " + brl(parcela) };
}

function providencias(a) {
  const P = []; const add = (t, urg) => P.push({ t, urg: !!urg });
  if (!a.area) return P;
  if (bloqueado(a)) { add("Declinar o caso: o escritório não atua contra o Município de Novo Hamburgo. Não indicar colega.", true); return P; }
  if (foraPerfil(a)) { add("Acolher, fazer um resumo do caso e indicar um colega de confiança da área."); return P; }
  if (a.area === "af") {
    add("Pedir: contrato, matrícula atualizada, intimação do cartório, editais ou avisos de leilão e planilha da dívida.");
    const f = a.af_fase;
    if (f === "atraso") {
      add("Negociar antes da intimação: renegociação ou incorporação das parcelas ao saldo.");
      add("Revisar o cálculo: juros, seguros, tarifas e capitalização.");
      add("Planejar a purgação da mora para não chegar à consolidação.");
    }
    if (f === "intimado") {
      add("Calcular a data-limite: 15 dias da intimação para purgar a mora (art. 26, §1º, Lei 9.514/97).", true);
      add("Conferir a validade da intimação: deve ser pessoal; hora certa e edital só nas hipóteses legais.");
      add("Avaliar purgação (atrasados + encargos) ou acordo antes do fim do prazo.");
      add("Se o valor cobrado estiver errado: ação com pedido de tutela e depósito do valor incontroverso.");
    }
    if (["consolidado", "leilao"].includes(f)) {
      add("Ação anulatória da consolidação e do leilão com tutela de urgência para suspender o leilão.", true);
      add("Verificar vícios: intimação pessoal para purgar, aviso das datas do leilão ao devedor (art. 27, §2º-A), valor de avaliação atualizado, cálculo da dívida.");
      add("Direito de preferência: recomprar pagando dívida + despesas até a data do 2º leilão (art. 27, §2º-B).");
      add("Avaliar venda do imóvel antes do leilão para preservar o patrimônio do cliente.");
    }
    if (f === "arrematado") {
      add("Verificar se o lance superou dívida + despesas: o excedente é do devedor (art. 27, §4º).", true);
      add("Avaliar anulação do leilão ou da arrematação por vício do procedimento.");
      add("Preparar defesa na desocupação (liminar com prazo de 60 dias, art. 30).");
    }
    if (f === "reintegracao") {
      add("Contestar a reintegração de posse no prazo da citação.", true);
      add("Ação anulatória conexa ou reconvenção, conforme os vícios encontrados.");
      add("Negociar prazo de desocupação se a defesa for fraca.");
    }
    if (a.af_intim_forma && ["terceiro", "nao", "edital", "horacerta"].includes(a.af_intim_forma)) add("Ponto forte: intimação possivelmente irregular (" + rotulo("af_intim_forma", a.af_intim_forma).toLowerCase() + "). Pedir a certidão do cartório.", true);
    if (a.af_aviso_leilao === "nao") add("Ponto forte: devedor não foi avisado das datas do leilão.", true);
    if (a.af_data_contrato === "ate2017") add("Contrato anterior à Lei 13.465/2017: tese de purgação da mora até a assinatura do auto de arrematação (jurisprudência do STJ).");
    if (a.af_data_contrato === "pos2023") add("Contrato sob o Marco das Garantias (Lei 14.711/2023): conferir as regras do 2º leilão e do saldo remanescente.");
    if (a.garantia_empresa === "sim" || a.garantia_empresa === "aval") add("Imóvel garante dívida da empresa: avaliar a tese do bem de família e a responsabilidade do garantidor.");
    if (a.fin_fgts === "sim") add("Verificar o uso do FGTS para abater atrasados ou o saldo (SFH).");
  }
  if (a.area === "exec") {
    add("Pedir: cópia integral do processo, matrícula, laudo de avaliação e cálculo atualizado.");
    if (a.ex_fase === "citado") {
      add("Embargos à execução em 15 dias úteis da juntada do mandado (art. 915 do CPC).", true);
      add("Avaliar o parcelamento do art. 916 do CPC (30% + 6 parcelas), só dentro do prazo dos embargos.");
    }
    if (["prazo_passou", "penhorado", "avaliado", "leilao"].includes(a.ex_fase)) add("Exceção de pré-executividade ou petição simples para matérias de ordem pública.");
    if (a.ex_bem_familia === "sim") {
      add(a.ex_tipo === "hipoteca"
        ? "Bem de família hipotecado: verificar se a dívida beneficiou a família; se garantiu dívida de terceiro ou da empresa, pode valer a impenhorabilidade (Lei 8.009/90 e STJ)."
        : "Alegar impenhorabilidade do bem de família (Lei 8.009/90); conferir as exceções do art. 3º.", true);
    }
    if (a.ex_fase === "avaliado") add("Impugnar a avaliação se estiver abaixo do mercado (art. 873 do CPC).");
    if (a.ex_fase === "leilao") {
      add("Conferir a intimação do executado sobre o leilão com 5 dias de antecedência (art. 889 do CPC).", true);
      add("Preço vil: lance abaixo de 50% da avaliação (art. 891 do CPC).");
    }
    if (a.ex_fase === "arrematado") {
      add("Impugnar a arrematação em 10 dias (art. 903, §2º, do CPC).", true);
      add("Levantar o saldo que sobrar depois de pagar o credor.");
    }
    if (a.garantia_empresa === "sim" || a.garantia_empresa === "aval") add("Dívida da empresa: separar o patrimônio pessoal e discutir os limites da garantia.");
  }
  if (a.area === "cond") {
    add("Pedir: planilha do condomínio, convenção, atas e cópia do processo.");
    add("Conferir o cálculo: multa limitada a 2% (art. 1.336, §1º, do Código Civil), juros e honorários.");
    if (a.cond_antigas !== "nao") add("Prescrição de 5 anos das cotas (art. 206, §5º, I, do Código Civil).");
    add("Propor acordo ou parcelamento com o condomínio.");
    if (a.cond_fase === "ajuizada") add("Embargos à execução em 15 dias úteis.", true);
    if (a.cond_fase === "leilao") add("Conferir intimação do leilão e preço vil; avaliar acordo para suspender o leilão.", true);
    if (a.ex_bem_familia === "sim") add("Atenção: o bem de família não protege contra dívida do próprio condomínio (art. 3º, IV, Lei 8.009/90).");
  }
  if (a.area === "fiscal") {
    add("Pedir: certidão de dívida ativa, extrato dos débitos e cópia da execução.");
    if (a.fis_ente === "uniao") add("ITR é cobrado pela União: Justiça Federal e PGFN.");
    if (a.fis_antigos !== "nao") add("Prescrição: 5 anos da constituição definitiva (art. 174 do CTN) e prescrição intercorrente (art. 40 da Lei 6.830/80).");
    add("Exceção de pré-executividade para prescrição, nulidade da CDA ou ilegitimidade (Súmula 393 do STJ).");
    if (a.fis_dono === "vendeu") add("Imóvel vendido: provar a venda e discutir a ilegitimidade.");
    add("Avaliar parcelamento ou programa de anistia do ente: suspende a execução.");
    if (["execucao", "penhora", "leilao"].includes(a.fis_fase)) add("Embargos à execução fiscal exigem garantia; prazo de 30 dias (art. 16 da Lei 6.830/80).");
    if (a.fis_fase === "leilao") add("Leilão marcado: pedir suspensão com parcelamento ou exceção.", true);
  }
  if (a.area === "veic") {
    add("Pedir: contrato, notificação de mora, extrato das parcelas e cópia da ação.");
    if (a.v_fase === "apreendido") {
      add("5 dias após a apreensão para pagar a dívida pendente e reaver o veículo (art. 3º, §2º, do DL 911/69).", true);
      add("Contestação em 15 dias da execução da liminar (art. 3º, §3º).", true);
    }
    if (a.v_fase === "liminar") add("Veículo pode ser apreendido a qualquer momento: preparar defesa e eventual pagamento.", true);
    add("Conferir a comprovação da mora: notificação válida é requisito (Súmula 72 do STJ).");
    if (a.v_taxa !== "normal") add("Revisional: juros acima da média do Banco Central, tarifas e seguros embutidos.");
    if (["atraso", "notificado"].includes(a.v_fase)) add("Negociar antes da ação ou entrar com a revisional preventiva.");
  }
  if (a.area === "inv_pre") {
    add("Analisar matrícula, edital e processo: ônus, recursos pendentes, débitos de IPTU e condomínio.");
    if (a.ip_ocupado !== "livre") add("Estimar custo e prazo da desocupação.");
    if (a.ip_modalidade !== "judicial") add("Extrajudicial: checar a regularidade da consolidação (risco de ação anulatória do ex-devedor).");
    if (a.ip_modalidade !== "extrajudicial") add("Judicial: verificar recursos e o prazo de impugnação da arrematação (art. 903 do CPC).");
    add("Simular custo total: lance, comissão do leiloeiro, ITBI, registro, dívidas e reforma.");
  }
  if (a.area === "inv_pos") {
    if (a.pos_problema === "desocupacao") add(a.pos_modalidade === "extrajudicial" ? "Reintegração de posse com liminar de desocupação em 60 dias (art. 30, Lei 9.514/97)." : "Pedir imissão na posse nos próprios autos.", true);
    if (a.pos_problema === "acao_exdono") add("Defender a arrematação na ação do ex-proprietário.", true);
    if (a.pos_problema === "registro") add("Carta de arrematação, ITBI e registro na matrícula.");
    if (a.pos_problema === "dividas") add("Conferir o edital: débitos de IPTU anteriores se sub-rogam no preço (art. 130, parágrafo único, do CTN).");
  }
  return P;
}

function conselhos(a) {
  const C = []; const add = (t) => C.push(t);
  if (!a.area) return C;
  if (bloqueado(a)) { add("Explique com gentileza que, por uma questão profissional, o escritório não atua nesse tipo de caso."); return C; }
  if (foraPerfil(a)) { add("Diga que esse assunto é de outra área e que você vai indicar alguém de confiança."); return C; }
  const u = urgencia(a);
  if (u.nivel === "crit") add("Seja claro sobre o tempo: \"Temos poucos dias. Se começarmos hoje, ainda dá para agir antes do prazo.\"");
  if (isDev(a)) {
    add("\"Existem caminhos legais mesmo com o processo avançado. Quanto antes agir, mais opções você tem.\"");
    add("\"Não assine acordo nem confissão de dívida sem a gente analisar antes.\"");
    add("\"Não ignore nenhuma carta do cartório, do banco ou da Justiça. Me mande foto de tudo.\"");
    if (a.af_fase === "arrematado") add("\"Mesmo depois do leilão, pode haver valores a receber e falhas que anulam a venda.\"");
    if (a.fin_vender === "sim" || a.fin_vender === "talvez") add("\"Se manter o imóvel não for viável, vender antes do leilão costuma preservar muito mais do seu patrimônio.\"");
    if (a.imp_moradores && a.imp_moradores.some(x => ["filhos","idosos","pcd"].includes(x))) add("A presença de filhos, idosos ou pessoa com deficiência reforça o pedido de urgência: mencione isso ao cliente.");
  }
  if (isVeic(a)) {
    add("\"Não esconda o veículo: isso piora a situação. A defesa certa é pelo processo.\"");
    if (a.v_fase === "apreendido") add("\"O prazo para reaver o carro é muito curto. Precisamos decidir hoje.\"");
  }
  if (isInv(a)) {
    add("\"Leilão é um bom negócio quando o risco jurídico é medido antes do lance, e não depois.\"");
    add("\"O preço baixo do edital não é o custo final: vamos somar tudo antes de você decidir.\"");
  }
  add("Explique cenários, nunca prometa resultado (Código de Ética da OAB).");
  return C;
}

function proximasPerguntas(a) {
  const ordem = ETAPAS.map(e => e.id);
  return Q.filter(q => visivel(q, a) && !respondida(q, a) && q.e !== "proposta")
    .sort((x, y) => ordem.indexOf(x.e) - ordem.indexOf(y.e)).slice(0, 4);
}

function resumoLinha(a) {
  if (!a.area) return "";
  const nome = a.nome || "Cliente";
  const area = rotulo("area", a.area);
  const fase = a.af_fase ? rotulo("af_fase", a.af_fase) : a.ex_fase ? rotulo("ex_fase", a.ex_fase) : a.cond_fase ? rotulo("cond_fase", a.cond_fase) : a.fis_fase ? rotulo("fis_fase", a.fis_fase) : a.v_fase ? rotulo("v_fase", a.v_fase) : a.pos_problema ? rotulo("pos_problema", a.pos_problema) : "";
  return nome + ": " + area.split(" (")[0].toLowerCase() + (fase ? ". " + fase + "." : ".");
}

// ---------- objeções ----------
function objecoes(a, H, J, PL) {
  const fixo = H.fixo, tot = J.total;
  const p = fixo && tot ? pct(fixo / tot * 100) : null;
  const meses = fixo && a.imp_aluguel ? Math.round(fixo / a.imp_aluguel * 10) / 10 : null;
  const planoTxt = PL ? PL.txt : "um parcelamento que caiba no seu orçamento";
  const L = [];
  L.push({ o: "\"Está caro.\"", r: [
    "Vamos colocar lado a lado. " + (tot ? "O que está em jogo para você é " + brl(tot) + ". " : "") + (fixo ? "O investimento na sua defesa é " + brl(fixo) + (p ? ", cerca de " + p + " disso" : "") + ". " : "") + (meses ? "É o equivalente a " + meses.toLocaleString("pt-BR") + " meses do aluguel que você pagaria se perdesse o imóvel. " : ""),
    "E dá para fazer em " + planoTxt + ". A pergunta é: quanto custa não fazer nada?" ] });
  L.push({ o: "\"Vou pensar.\"", r: [
    "Claro, é uma decisão importante. Me ajuda a entender: o que exatamente você quer pensar? É o valor, a forma de pagar ou se o caminho funciona?",
    urgencia(a).prazo ? "Só lembre que o prazo é " + dataBR(urgencia(a).prazo.data) + ". Cada dia que passa tira opções de defesa." : "Enquanto isso o procedimento continua andando, e cada etapa vencida tira opções." ] });
  L.push({ o: "\"Preciso falar com meu marido/minha esposa.\"", r: [
    "Faz todo sentido decidir junto. Que tal ligarmos agora, por vídeo, e eu explico em 5 minutos o mesmo que te expliquei?",
    "Se não der agora, marcamos para hoje à noite. Quais dúvidas você acha que ele(a) vai ter?" ] });
  L.push({ o: "\"Não tenho dinheiro agora.\"", r: [
    "Por isso montei o plano pela sua realidade: " + planoTxt + ".",
    (a.fin_disponivel != null ? "A entrada considera o que você disse que consegue juntar agora. " : "") + "O dinheiro que você economiza não fazendo nada hoje pode virar uma perda muito maior depois do leilão." ] });
  L.push({ o: "\"Outro advogado cobra menos.\"", r: [
    "Pode ser. Vale perguntar o que está incluído: análise completa do procedimento, ação com pedido de urgência, acompanhamento até o fim?",
    "Nós fazemos isso todos os dias. Em um caso com prazo, experiência no assunto faz diferença." ] });
  L.push({ o: "\"E se não der certo?\"", r: [
    "Eu nunca vou te prometer resultado: nenhum advogado sério pode. O que eu te garanto é a análise completa e a melhor estratégia para o seu caso.",
    "O honorário de êxito só existe se der certo. E mesmo nos cenários difíceis há opções: preferência na recompra, venda antes do leilão, valores a receber." ] });
  L.push({ o: "\"Vou tentar negociar direto com o banco.\"", r: [
    "Negociar é ótimo, e a gente pode fazer isso por você. A diferença é que, com uma ação e pedido de urgência, o banco passa a negociar com prazo correndo contra ele.",
    a.af_negociou && a.af_negociou !== "nao" ? "Você já tentou, e " + ({ recusou: "o credor recusou", inviavel: "a proposta foi impossível de pagar", acordo_quebrado: "o acordo não coube no orçamento" }[a.af_negociou] || "não funcionou") + ". O que mudaria tentando de novo do mesmo jeito?" : "Sem alguém olhando o contrato, você pode aceitar um acordo pior do que o que a lei já te garante." ] });
  L.push({ o: "\"A Defensoria faz de graça.\"", r: [
    "A Defensoria faz um trabalho importante e você pode procurá-la. Ela atende muita gente, e prazos curtos costumam ser o problema.",
    "Aqui o seu caso tem dedicação exclusiva e começa hoje. Se a sua renda permitir, vale comparar o risco de esperar." ] });
  if (isInv(a)) L.push({ o: "\"Eu mesmo leio o edital.\"", r: [
    "Ótimo que você leia. O risco costuma estar fora do edital: no processo, na matrícula e na forma como a consolidação foi feita.",
    "Um erro jurídico no lance custa muito mais que a análise." ] });
  return L;
}

function scriptApresentacao(a, H, J, PL) {
  const nome = (a.nome || "").split(" ")[0] || "";
  const linhas = [];
  linhas.push((nome ? nome + ", " : "") + "pelo que você me contou, " + situacaoFalada(a));
  const u = urgencia(a); if (u.prazo) linhas.push("O ponto mais urgente é o " + minus(u.prazo.nome).replace(/^o /, "") + ", em " + dataBR(u.prazo.data) + ".");
  const P = providencias(a).filter(x => x.urg).slice(0, 2);
  if (P.length) linhas.push("O que eu proponho fazer: " + P.map(x => minus(x.t.replace(/^Ponto forte: /, "").replace(/\.$/, ""))).join("; ") + ".");
  if (J.total) linhas.push("Hoje está em jogo para você cerca de " + brl(J.total) + (a.imp_significado ? ", fora o que você mesmo disse: \"" + a.imp_significado + "\"" : "") + ".");
  if (H.fixo) linhas.push("O investimento na sua defesa é de " + brl(H.fixo) + (H.consulta ? ", já descontando os " + brl(H.consulta) + " da consulta" : "") + (PL ? ", com " + minus(PL.txt) : "") + "." + (H.exito.length ? " E uma parte só se tivermos resultado: " + H.exito.map(e => minus(e.k)).join(" e ") + "." : ""));
  linhas.push("Eu não posso prometer resultado, mas posso te garantir que o seu caso vai ser analisado por inteiro e conduzido com prioridade.");
  return linhas.join("\n\n");
}
function situacaoFalada(a) {
  const base = ({ af: "o seu imóvel está como garantia do contrato com o credor, em alienação fiduciária", exec: "o seu imóvel está em risco dentro de um processo judicial", cond: "existe uma cobrança de condomínio que pode chegar ao imóvel", fiscal: "existe uma cobrança de imposto sobre o imóvel", veic: "o seu veículo está em risco por causa do financiamento", inv_pre: "você quer comprar um imóvel em leilão com segurança", inv_pos: "você já arrematou o imóvel e precisa resolver o que ficou pendente" })[a.area] || "a sua situação precisa de atenção";
  const f = a.af_fase || a.ex_fase || a.cond_fase || a.fis_fase || a.v_fase || a.pos_problema;
  const q = a.af_fase ? "af_fase" : a.ex_fase ? "ex_fase" : a.cond_fase ? "cond_fase" : a.fis_fase ? "fis_fase" : a.v_fase ? "v_fase" : "pos_problema";
  return base + (f ? ". Hoje a fase é esta: " + minus(rotulo(q, f)) + "." : ".");
}
function scriptFechamento(a, H, PL) {
  const t = [];
  if (a.dec_decisor === "ausente") t.push("Antes de fechar: vamos chamar o seu cônjuge agora por vídeo? Assim vocês decidem juntos e eu tiro as dúvidas dele(a).");
  t.push("Para começarmos ainda hoje, eu te mando o contrato para assinar pelo celular e o link do pagamento" + (PL && PL.entrada ? " da entrada de " + brl(PL.entrada) : "") + ". Assim que assinar, já começo a analisar os documentos.");
  t.push("Posso te enviar agora?");
  return t.join("\n\n");
}
function textoResumo() {
  const a = A(); const H = honorarios(a); const J = emJogo(a); const PL = plano(a, H); const u = urgencia(a);
  const L = [];
  L.push("DIAGNÓSTICO FCE · " + new Date().toLocaleDateString("pt-BR"));
  L.push(resumoLinha(a)); L.push("Urgência: " + (bloqueado(a) ? "declinar" : u.txt));
  L.push(""); L.push("FATOS");
  ETAPAS.forEach(e => Q.filter(q => q.e === e.id && visivel(q, a) && respondida(q, a)).forEach(q => L.push("- " + q.l + ": " + rotulo(q.id, a[q.id]))));
  const pr = prazos(a); if (pr.length) { L.push(""); L.push("PRAZOS"); pr.forEach(p => L.push("- " + p.nome + ": " + dataBR(p.data))); }
  L.push(""); L.push("PROVIDÊNCIAS"); providencias(a).forEach(p => L.push("- " + (p.urg ? "[URGENTE] " : "") + p.t));
  L.push(""); L.push("ORIENTAÇÃO AO CLIENTE"); conselhos(a).forEach(c => L.push("- " + c));
  if (!bloqueado(a) && !foraPerfil(a)) {
    L.push(""); L.push("PROPOSTA");
    L.push("- Em jogo para o cliente: " + brl(J.total));
    L.push("- " + (H.produto || "Serviço") + ": " + brl(H.fixo) + (H.consulta ? " (consulta de " + brl(H.consulta) + " abatida)" : ""));
    if (PL) L.push("- Pagamento: " + PL.txt);
    H.exito.forEach(e => L.push("- " + e.k + (e.v != null ? ": " + brl(e.v) : "")));
  }
  if (D.ia.analise && D.ia.analise.resumo) { L.push(""); L.push("LEITURA DA IA"); L.push(D.ia.analise.resumo); (D.ia.analise.teses || []).forEach(t => L.push("- " + (typeof t === "string" ? t : t.tese + (t.fundamento ? " — " + t.fundamento : "")))); }
  return L.join("\n");
}
function contextoCaso() {
  const a = A(); const H = honorarios(a); const J = emJogo(a); const u = urgencia(a);
  const fatos = Q.filter(q => visivel(q, a) && respondida(q, a)).map(q => "- " + q.l + ": " + rotulo(q.id, a[q.id])).join("\n");
  return "DATA DE HOJE: " + new Date().toLocaleDateString("pt-BR") + "\n\nFATOS COLETADOS:\n" + (fatos || "(nenhum)") +
    "\n\nPRAZOS: " + (prazos(a).map(p => p.nome + " em " + dataBR(p.data)).join("; ") || "nenhum") + "\nURGÊNCIA: " + u.txt +
    "\n\nPROVIDÊNCIAS JÁ SUGERIDAS PELO ROTEIRO:\n" + providencias(a).map(p => "- " + p.t).join("\n") +
    "\n\nEM JOGO PARA O CLIENTE: " + brl(J.total) + "\nHONORÁRIO SUGERIDO: " + brl(H.fixo) + " (" + (H.produto || "") + ")";
}
function esquemaPerguntas() {
  return Q.filter(q => q.t !== "textarea").map(q => {
    let tipo = q.t;
    if (q.opts) tipo = (q.t === "multi" ? "lista de " : "um de ") + q.opts.map(p => p.v + "=" + p.l).join(" | ");
    if (q.t === "money") tipo = "número em reais";
    if (q.t === "number" || q.t === "scale") tipo = "número inteiro";
    if (q.t === "date") tipo = "data AAAA-MM-DD";
    return q.id + " (" + q.l + "): " + tipo;
  }).join("\n");
}
function valida(id, v) {
  const q = QI[id]; if (!q || v == null || v === "") return undefined;
  if (q.opts) { if (q.t === "multi") { const arr = (Array.isArray(v) ? v : [v]).map(String).filter(x => q.opts.some(p => p.v === x)); return arr.length ? arr : undefined; } return q.opts.some(p => p.v === String(v)) ? String(v) : undefined; }
  if (q.t === "money") { const n = typeof v === "number" ? v : parseMoney(v); return n != null && n >= 0 ? n : undefined; }
  if (q.t === "number" || q.t === "scale") { const n = parseInt(v, 10); return isFinite(n) && n >= 0 ? (q.t === "scale" ? clamp(n, 0, 10) : n) : undefined; }
  if (q.t === "date") return /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : undefined;
  return String(v).slice(0, 300);
}

// ---------- estado do diagnóstico aberto ----------
const IA_URL = 'https://emerim.app.n8n.cloud/webhook/fce-app-diag-ia';
let D = null; // { id, caso_id, caso, A, ia, etapa, transcript, aiFilled, ajuste, tab, salvoEm }
const A = () => D.A;
const novoD = () => ({ id: null, caso_id: null, caso: null, A: { consulta_paga: 'sim' }, ia: {}, etapa: 'abertura', transcript: '', aiFilled: {}, ajuste: {}, tab: 'diag', salvoEm: '', chave: '' });
const q$ = (s, el) => (el || document).querySelector(s);

// ---------- CSS próprio (só vale dentro de .dg) ----------
(function css() {
  if (document.getElementById('dg-css')) return;
  const st = document.createElement('style'); st.id = 'dg-css';
  st.textContent = `
.dg{--dpanel:var(--surface-2);--dline:var(--line-2);--dsel:var(--navy);--crit:var(--bad);--crit-soft:var(--bad-soft);--ai:var(--info);--ai-soft:var(--info-soft);display:grid;gap:14px;margin-top:12px}
.dg .num{font-variant-numeric:tabular-nums}
.dg-top{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center}
.dg-kpi{display:flex;flex-direction:column;line-height:1.2}.dg-kpi small{font-size:11.5px;color:var(--mut)}.dg-kpi b{font-size:16px;font-variant-numeric:tabular-nums}
.dg-chip{display:inline-flex;align-items:center;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:700;white-space:nowrap}
.dg-chip.crit{background:var(--bad-soft);color:var(--bad)}.dg-chip.alta{background:var(--warn-soft);color:var(--warn)}.dg-chip.normal{background:var(--ok-soft);color:var(--ok)}.dg-chip.neutro{background:var(--surface-2);color:var(--mut)}.dg-chip.ai{background:var(--info-soft);color:var(--info)}.dg-chip.bloq{background:var(--bad);color:#fff}
.dg-etapas{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.dg-etapas button{flex:none;display:flex;align-items:center;gap:8px;border:1px solid var(--line-2);background:var(--surface);border-radius:99px;padding:6px 12px 6px 6px;cursor:pointer;font-weight:600;font-size:13.5px;color:var(--mut)}
.dg-etapas button .n{width:22px;height:22px;border-radius:50%;display:inline-grid;place-items:center;border:1px solid var(--line-2);font-size:12px}
.dg-etapas button .c{font-size:11.5px;font-weight:500}
.dg-etapas button.on{color:var(--txt);border-color:var(--gold)}.dg-etapas button.on .n{background:var(--gold);border-color:var(--gold);color:#fff}
.dg-etapas button.feita .n{border-color:var(--gold);color:var(--gold)}
.dg-grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:16px;align-items:start}
.dg-main{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0}
.dg-side{position:sticky;top:calc(var(--top) + 12px);max-height:calc(100vh - var(--top) - 24px);overflow:auto;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-content:start;min-width:0}
.dg h2{font:600 24px/1.2 var(--serif);margin:0}
.dg h3{font:600 16px/1.3 var(--serif);margin:0}
.dg-roteiro{border-left:3px solid var(--gold);background:var(--surface-2);border-radius:0 12px 12px 0;padding:12px 14px;display:grid;gap:4px}
.dg-roteiro p{margin:0;font:17px/1.45 var(--serif)}
.dg-eye{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--mut);font-weight:700}
.dg-roteiro .dg-eye{color:var(--gold)}
.dg-q{padding:14px 16px;display:grid;gap:8px}
.dg-q .lab{font-weight:600;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
.dg-q .fala{font:italic 15px/1.45 var(--serif);color:var(--mut);margin:0}
.dg-q .porque{font-size:12.5px;color:var(--mut);margin:0}
.dg-q.resp{border-color:color-mix(in srgb,var(--line-2) 50%,var(--gold))}
.dg-opts{display:flex;flex-wrap:wrap;gap:7px}
.dg-opt{border:1px solid var(--line-2);background:var(--surface);border-radius:9px;padding:7px 11px;cursor:pointer;font-size:14px;text-align:left;line-height:1.3}
.dg-opt:hover{background:var(--surface-2)}
.dg-opt.on{background:var(--dsel);border-color:var(--dsel);color:#fff;font-weight:600}
.dg-opt.esc{min-width:38px;text-align:center}
.dg .money{position:relative;max-width:260px}.dg .money::before{content:"R$";position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--mut);font-size:13px}.dg .money .inp{padding-left:34px}
.dg-hint{font-size:12.5px;color:var(--mut)}
.dg-al{border-radius:12px;padding:10px 12px;font-size:14px;display:grid;gap:3px}
.dg-al.crit{background:var(--bad-soft);border-left:3px solid var(--bad)}.dg-al.warn{background:var(--warn-soft);border-left:3px solid var(--warn)}.dg-al.info{background:var(--surface-2);border-left:3px solid var(--gold)}
.dg-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.dg-tabs{display:flex;gap:4px;background:var(--surface-2);border-radius:12px;padding:4px;border:1px solid var(--line)}
.dg-tabs button{flex:1;border:0;background:transparent;border-radius:9px;padding:7px 6px;cursor:pointer;font-weight:600;font-size:13px;color:var(--mut)}
.dg-tabs button.on{background:var(--surface);color:var(--txt);box-shadow:var(--sh)}
.dg-b{padding:12px 14px;display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-content:start}
.dg-b ul{margin:0;padding-left:18px;display:grid;gap:5px}.dg-b li{font-size:14px}.dg-b li.urg{font-weight:600}.dg-b li.urg::marker{color:var(--bad)}
.dg-l{display:flex;justify-content:space-between;gap:10px;font-size:14px;align-items:baseline}.dg-l>span:first-child{min-width:0}.dg-l .num{text-align:right;flex:none;max-width:60%}
.dg-l.tot{border-top:1px solid var(--line-2);padding-top:6px;font-weight:700}
.dg-r1{font:16px/1.45 var(--serif);margin:0}
.dg-sug{display:grid;gap:6px}.dg-sug button{text-align:left;border:1px solid var(--info-soft);background:var(--info-soft);border-radius:9px;padding:8px 10px;cursor:pointer;font-size:14px;line-height:1.35}.dg-sug button:hover{border-color:var(--info)}
.dg-ai{font-size:14px;display:grid;gap:8px}.dg-ai h4{margin:4px 0 0;font-size:11.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--info)}.dg-ai ul{margin:0;padding-left:18px;display:grid;gap:4px}.dg-ai p{margin:0}
.dg-big{font-size:28px;font-weight:600;line-height:1.1;font-variant-numeric:tabular-nums}.dg-big.ouro{color:var(--gold)}
.dg-g2{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.dg-c{padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;align-content:start}
.dg-script{background:var(--surface-2);border-radius:12px;padding:12px 14px;font:16px/1.5 var(--serif);white-space:pre-wrap}
.dg-edit{display:flex;flex-wrap:wrap;gap:10px;align-items:end}.dg-edit label{display:grid;gap:3px;font-size:12px;color:var(--mut);font-weight:600}.dg-edit .inp{width:150px}
.dg details{border:1px solid var(--line-2);border-radius:10px;padding:0 14px}
.dg details summary{cursor:pointer;padding:11px 0;font-weight:600;list-style:none;display:flex;gap:8px}
.dg details summary::before{content:"+";color:var(--gold);width:12px}.dg details[open] summary::before{content:"–"}
.dg details .resp{padding:0 0 12px;display:grid;gap:6px}.dg details .resp p{margin:0;font:16px/1.5 var(--serif)}
.dg-rec{width:9px;height:9px;border-radius:50%;background:var(--bad);display:inline-block;animation:dgp 1.2s infinite}
@keyframes dgp{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){.dg-rec{animation:none}}
.dg-lista .item .d{white-space:normal}
@media (max-width:1100px){.dg-grid{grid-template-columns:minmax(0,1fr)}.dg-side{position:static;max-height:none;overflow:visible}}
`;
  document.head.appendChild(st);
})();

// ---------- tela: lista de diagnósticos ----------
async function telaLista(forcar) {
  titulo('Diagnóstico', '<a class="btn pri sm" href="#/diagnostico/novo">' + ic('caneta', 's') + '<span class="so-desk"> Novo diagnóstico</span></a>');
  if (!S.cache.diaglista) carregando(3);
  const d = await dados('diaglista', 'diag_lista', null, forcar);
  const diags = d.diagnosticos || [], casos = d.casos || [];
  const comDiag = new Set(diags.map((x) => x.caso_id).filter(Boolean));
  const areaNome = (v) => ((QI.area.opts.find((o) => o.v === v) || {}).l || '').split(' (')[0] || 'Sem situação';
  let h = '<div class="dg" style="margin-top:12px">';
  h += '<div class="card dg-c"><h3>Roteiro da consulta</h3><p class="mut pq" style="margin:0">Perguntas que se ajustam ao caso, providências, prazos, o que está em jogo para o cliente, honorário sugerido, objeções e copiloto com IA. Abra a partir de um caso para trazer o que a Helena já levantou.</p></div>';
  h += '<div class="card"><div class="dg-c" style="padding-bottom:4px"><h3>Começar a partir de um caso</h3></div><div class="lista dg-lista">' +
    (casos.length ? casos.slice(0, 20).map((c) => '<a class="item" href="#/diagnostico/c-' + c.id + '"><div class="av">' + esc(iniciais(c.nome)) + '</div><div class="mid"><div class="t">' + esc(c.nome) + '</div><div class="d">' + esc(ETAPA[c.etapa] || c.etapa || '') + (c.perfil ? ' · ' + esc(PERFIL[c.perfil] || c.perfil) : '') + (comDiag.has(c.id) ? ' · já tem diagnóstico' : '') + '</div></div>' + ic('seta', 's') + '</a>').join('') : '<div class="vazio" style="padding:16px">Nenhum caso ativo.</div>') + '</div></div>';
  h += '<div class="card"><div class="dg-c" style="padding-bottom:4px"><h3>Diagnósticos salvos</h3></div><div class="lista dg-lista">' +
    (diags.length ? diags.map((x) => '<a class="item" href="#/diagnostico/' + x.id + '"><div class="ic-circ ouro">' + ic('balanca', 's') + '</div><div class="mid"><div class="t">' + esc(x.nome || 'Sem nome') + (x.status === 'CONCLUIDO' ? ' <span class="chip ok">concluído</span>' : '') + '</div><div class="d">' + esc(areaNome(x.area)) + ' · em jogo ' + brl(x.total_em_jogo == null ? null : Number(x.total_em_jogo)) + ' · honorário ' + brl(x.honorario == null ? null : Number(x.honorario)) + ' · ' + esc(quando(x.updated_at)) + '</div></div>' + ic('seta', 's') + '</a>').join('') : '<div class="vazio" style="padding:16px">Nenhum diagnóstico ainda.</div>') + '</div></div>';
  h += '</div>';
  $('#cont').innerHTML = h;
}

// ---------- abrir ----------
function deHelena(c) {
  const h = (c && c.helena) || {}; const a = { consulta_paga: 'sim' };
  const dt = (s) => { const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? m[3] + '-' + m[2] + '-' + m[1] : null; };
  const lw = (s) => String(s || '').toLowerCase();
  if (c && c.nome && c.nome !== 'Sem nome') a.nome = c.nome;
  const uf = String(h.cidade_uf || '').match(/\/\s*([A-Z]{2})\b/); if (uf) a.uf = ['RS', 'SC', 'PR', 'SP', 'MT', 'MS'].includes(uf[1]) ? uf[1] : 'outro';
  const relato = [c && (c.resumo_fatos || c.resumo), h.observacoes ? 'Observações da Helena: ' + h.observacoes : ''].filter(Boolean).join('\n\n'); if (relato) a.relato = relato.slice(0, 2000);
  const op = lw(h.tipo_operacao), fase = lw(h.fase);
  if (c && c.perfil === 'VEICULO' || h.veiculo) a.area = 'veic';
  else if (c && c.perfil === 'ARREMATANTE') a.area = lw(h.ja_arrematou) === 'sim' ? 'inv_pos' : 'inv_pre';
  else if (/penhora|execu|judicial/.test(op) || lw(h.tipo_leilao) === 'judicial') a.area = 'exec';
  else if (/condom/.test(op)) a.area = 'cond';
  else if (/iptu|itr/.test(op)) a.area = 'fiscal';
  else if (c && c.perfil === 'DEVEDOR') a.area = 'af';
  if (a.area === 'af') {
    if (/arremat|leiloado/.test(fase)) a.af_fase = 'arrematado'; else if (/leil/.test(fase) || dt(h.data_primeiro_leilao)) a.af_fase = 'leilao'; else if (/consolid/.test(fase)) a.af_fase = 'consolidado'; else if (/intima/.test(fase)) a.af_fase = 'intimado'; else if (/atras/.test(fase)) a.af_fase = 'atraso';
    if (dt(h.data_primeiro_leilao)) a.data_leilao1 = dt(h.data_primeiro_leilao);
    if (dt(h.data_segundo_leilao)) a.data_leilao2 = dt(h.data_segundo_leilao);
    const fi = lw(h.forma_intimacao); if (fi) a.af_intim_forma = /pessoal|m[aã]os/.test(fi) ? 'pessoal' : /porteiro|parente|vizinh|terceiro/.test(fi) ? 'terceiro' : /hora/.test(fi) ? 'horacerta' : /edital/.test(fi) ? 'edital' : /nao|não/.test(fi) ? 'nao' : undefined;
    if (/financ/.test(op)) a.af_contrato = 'sfh'; else if (/empr[eé]stimo|garantia/.test(op)) a.af_contrato = 'homeequity';
    const pa = parseInt(String(h.parcelas_atrasadas || '').replace(/\D/g, ''), 10); if (isFinite(pa)) a.parcelas_atraso = pa;
    const vp = parseMoney(h.valor_parcela); if (vp) a.parcela = vp;
    const tn = lw(h.tentou_negociar); if (tn) a.af_negociou = /recus/.test(tn) ? 'recusou' : /n[aã]o/.test(tn) ? 'nao' : 'inviavel';
  }
  if (a.area === 'exec') { if (/leil/.test(fase) && dt(h.data_primeiro_leilao)) { a.ex_fase = 'leilao'; a.data_leilao1 = dt(h.data_primeiro_leilao); } else if (/penhor/.test(fase)) a.ex_fase = 'penhorado'; else if (/cita/.test(fase)) a.ex_fase = 'citado'; }
  const cr = lw(h.credor); if (cr && (a.area === 'af' || a.area === 'veic' || a.area === 'exec')) a.credor = /caixa/.test(cr) ? 'caixa' : /brasil/.test(cr) ? 'bb' : /coop|sicredi|sicoob|cresol/.test(cr) ? 'coop' : /financeira|fintech|creditas/.test(cr) ? 'fintech' : 'privado';
  const vi = parseMoney(h.valor_imovel); if (vi) a.valor_mercado = vi;
  const vd = parseMoney(h.valor_cobrado_banco) || null; if (vd) a.saldo_devedor = vd;
  const mora = lw(h.mora_no_imovel); if (mora === 'sim') a.imp_moradia = 'sim'; else if (mora === 'nao' && a.area && DEV_IMOVEL.includes(a.area)) a.imp_moradia = 'investimento';
  const qm = lw(h.quem_mora); if (qm) { const m = []; if (/espos|marid|c[oô]njuge|companheir/.test(qm)) m.push('conjuge'); if (/filh|crian/.test(qm)) m.push('filhos'); if (/idos|m[aã]e|pai|av[oó]/.test(qm)) m.push('idosos'); if (m.length) a.imp_moradores = m; }
  const qd = lw(h.quem_decide); if (qd) a.dec_decisor = /sozinh|eu mesm/.test(qd) ? 'sozinho' : /espos|marid|c[oô]njuge/.test(qd) ? 'ausente' : 'familia';
  const adv = lw(h.advogado_atual); if (adv === 'sim') a.dec_outros = 'nao_fechou';
  Object.keys(a).forEach((k) => { if (a[k] === undefined) delete a[k]; });
  return a;
}
async function abrir(arg, forcar) {
  const chave = arg || 'novo';
  if (D && D.chave === chave && !forcar) return;
  if (D && D.sujo) await salvarAgora();
  if (chave === 'novo') { D = novoD(); D.chave = chave; return; }
  carregando(4);
  const caso_id = chave.startsWith('c-') ? chave.slice(2) : null;
  const r = await api('diag_abrir', caso_id ? { caso_id } : { id: chave });
  const nd = novoD(); nd.chave = chave; nd.caso = r.caso || null; nd.caso_id = (r.caso && r.caso.id) || caso_id || null;
  if (r.diag) {
    const g = r.diag, ia = g.ia || {};
    Object.assign(nd, { id: g.id, A: g.respostas || {}, transcript: g.transcricao || '', ia: { analise: ia.analise, escuta: ia.escuta }, aiFilled: ia.aiFilled || {}, ajuste: ia.ajuste || {}, etapa: ia.etapa || 'situacao', salvoEm: '' , status: g.status });
    nd.caso_id = g.caso_id || nd.caso_id;
  } else if (nd.caso) {
    nd.A = deHelena(nd.caso); nd.helena = Object.keys(nd.A).filter((k) => k !== 'consulta_paga'); nd.etapa = 'situacao';
  }
  D = nd;
}

// ---------- salvar ----------
let tSalvar = null, salvando = false;
function marcarSujo() { if (!D) return; D.sujo = true; clearTimeout(tSalvar); tSalvar = setTimeout(salvarAgora, 1500); mostraSalvo('Salvando…'); }
function mostraSalvo(t) { const el = q$('#dgSalvo'); if (el) el.textContent = t; }
async function salvarAgora() {
  if (!D || !D.sujo || salvando) return; clearTimeout(tSalvar);
  salvando = true; D.sujo = false;
  const a = A(); const H = honorarios(a); const J = emJogo(a);
  try {
    const r = await api('diag_salvar', { id: D.id || '', caso_id: D.caso_id || '', nome: a.nome || (D.caso && D.caso.nome) || '', area: a.area || '', respostas: a, transcricao: D.transcript || '',
      ia: { analise: D.ia.analise || null, escuta: D.ia.escuta || null, aiFilled: D.aiFilled, ajuste: D.ajuste, etapa: D.etapa }, total_em_jogo: J.total, honorario: H.fixo, status: D.status || 'RASCUNHO' });
    if (r && r.id) { if (!D.id) { D.id = r.id; if (D.chave === 'novo') { D.chave = r.id; history.replaceState(null, '', '#/diagnostico/' + r.id); rotaAtual = 'diagnostico/' + r.id; } } D.salvoEm = r.salvo_em || ''; mostraSalvo('Salvo às ' + D.salvoEm); delete S.cache.diaglista; }
  } catch (e) { D.sujo = true; mostraSalvo('Não salvou: ' + (e.message || 'erro')); }
  finally { salvando = false; if (D && D.sujo) { clearTimeout(tSalvar); tSalvar = setTimeout(salvarAgora, 3000); } }
}
window.addEventListener('beforeunload', () => { if (D && D.sujo) salvarAgora(); });
window.addEventListener('hashchange', () => { if (D && D.sujo && !/^#\/diagnostico/.test(location.hash)) salvarAgora(); });

// ---------- render do editor ----------
function etapasVisiveis() { const a = A(); return ETAPAS.filter((e) => e.id === 'proposta' || Q.some((q) => q.e === e.id && visivel(q, a))); }
function contagem(eid) { const a = A(); const qs = Q.filter((q) => q.e === eid && visivel(q, a)); return { feitas: qs.filter((q) => respondida(q, a)).length, total: qs.length }; }
function tituloEtapa(id) { return ({ abertura: 'Abertura e conexão', situacao: 'O que está acontecendo', caso: 'Diagnóstico técnico', impacto: 'Consequências e motivação', financeiro: 'Realidade financeira', decisao: 'Como ele decide', proposta: 'Proposta, objeções e fechamento' })[id]; }

function telaEditor() {
  const a = A();
  const voltar = D.caso_id ? '<a class="btn fant sm" href="#/caso/' + D.caso_id + '">' + ic('voltar', 's') + '<span class="so-desk"> Caso</span></a>' : '<a class="btn fant sm" href="#/diagnostico">' + ic('voltar', 's') + '<span class="so-desk"> Diagnósticos</span></a>';
  titulo('Diagnóstico' + (a.nome ? ' · ' + a.nome.split(' ')[0] : ''), voltar);
  $('#cont').innerHTML = '<div class="dg" id="dg"><div class="card dg-c" style="padding:12px 16px"><div class="dg-top" id="dgTop"></div></div>' +
    (D.helena && D.helena.length && !D.id ? '<div class="dg-al info" id="dgHel"><b>Respostas trazidas da conversa com a Helena.</b><span>Confira cada uma com o cliente: estão preenchidas, mas podem estar incompletas.</span></div>' : '') +
    '<div class="dg-etapas" id="dgEtapas"></div><div class="dg-grid"><div class="dg-main" id="dgMain"></div><div class="dg-side" id="dgSide"></div></div></div>';
  renderTudo();
}
function renderTudo(semMain) { renderTop(); renderEtapas(); if (!semMain) renderMain(); renderPainel(); }
function renderTop() {
  const a = A(), u = urgencia(a), J = emJogo(a), H = honorarios(a); const el = q$('#dgTop'); if (!el) return;
  el.innerHTML = '<b style="font:600 17px var(--serif)">' + esc(a.nome || 'Novo atendimento') + '</b><span class="dg-chip ' + (bloqueado(a) ? 'bloq' : u.nivel) + '">' + esc(bloqueado(a) ? 'DECLINAR' : u.curto) + '</span><span style="flex:1"></span>' +
    '<div class="dg-kpi"><small>Em jogo para o cliente</small><b>' + brl(J.total) + '</b></div><div class="dg-kpi"><small>Honorário sugerido</small><b>' + brl(H.fixo) + '</b></div>' +
    '<span class="mut pp" id="dgSalvo">' + (D.salvoEm ? 'Salvo às ' + D.salvoEm : (D.id ? 'Salvo' : 'Ainda não salvo')) + '</span>';
}
function renderEtapas() {
  const el = q$('#dgEtapas'); if (!el) return; const vis = etapasVisiveis();
  el.innerHTML = vis.map((e, i) => { const c = e.id === 'proposta' ? null : contagem(e.id); const feita = c && c.total && c.feitas === c.total;
    return '<button type="button" data-etapa="' + e.id + '" class="' + (D.etapa === e.id ? 'on ' : '') + (feita ? 'feita' : '') + '"><span class="n">' + (i + 1) + '</span>' + esc(e.nome) + (c && c.total ? '<span class="c">' + c.feitas + '/' + c.total + '</span>' : '') + '</button>'; }).join('');
}
function renderQuestion(q) {
  const a = A(); const v = a[q.id];
  const tag = D.aiFilled[q.id] ? ' <span class="dg-chip ai">IA</span>' : (D.helena && D.helena.includes(q.id) && !D.id ? ' <span class="dg-chip neutro">Helena</span>' : '');
  let ctrl = '';
  if (q.t === 'single' || q.t === 'multi') {
    ctrl = '<div class="dg-opts">' + q.opts.filter((p) => !p.show || p.show(a)).map((p) => { const on = q.t === 'multi' ? (Array.isArray(v) && v.includes(p.v)) : v === p.v;
      return '<button type="button" class="dg-opt' + (on ? ' on' : '') + '" data-q="' + q.id + '" data-v="' + esc(p.v) + '" aria-pressed="' + on + '">' + esc(p.l) + '</button>'; }).join('') + '</div>';
  } else if (q.t === 'scale') {
    ctrl = '<div class="dg-opts">' + Array.from({ length: 11 }, (_, i) => '<button type="button" class="dg-opt esc' + (v === i ? ' on' : '') + '" data-q="' + q.id + '" data-v="' + i + '" data-num="1">' + i + '</button>').join('') + '</div>';
  } else if (q.t === 'money') {
    ctrl = '<div class="money"><input class="inp" id="dq-' + q.id + '" data-q="' + q.id + '" inputmode="decimal" placeholder="0" value="' + esc(fmtMoneyInput(v)) + '"></div>';
  } else if (q.t === 'number') {
    ctrl = '<input class="inp" style="max-width:140px" id="dq-' + q.id + '" data-q="' + q.id + '" inputmode="numeric" value="' + esc(v ?? '') + '">';
  } else if (q.t === 'date') {
    const d = v ? diasAte(v) : null;
    ctrl = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><input type="date" class="inp" style="max-width:190px" id="dq-' + q.id + '" data-q="' + q.id + '" value="' + esc(v || '') + '">' + (d != null ? '<span class="dg-hint">' + (d < 0 ? 'há ' + (-d) + ' dias' : d === 0 ? 'hoje' : 'em ' + d + ' dias') + '</span>' : '') + '</div>';
  } else if (q.t === 'textarea') {
    ctrl = '<textarea class="inp" id="dq-' + q.id + '" data-q="' + q.id + '" placeholder="Palavras do cliente">' + esc(v || '') + '</textarea>';
  } else {
    ctrl = '<input class="inp" style="max-width:420px" id="dq-' + q.id + '" data-q="' + q.id + '" placeholder="' + esc(q.ph || '') + '" value="' + esc(v || '') + '">';
  }
  return '<div class="card dg-q' + (respondida(q, a) ? ' resp' : '') + '" id="dgq-' + q.id + '"><div class="lab">' + esc(q.l) + tag + '</div>' + (q.fala ? '<p class="fala">“' + esc(q.fala) + '”</p>' : '') + ctrl + (q.porque ? '<p class="porque">' + esc(q.porque) + '</p>' : '') + '</div>';
}
function renderMain() {
  const main = q$('#dgMain'); if (!main) return; const a = A();
  const vis = etapasVisiveis(); if (!vis.find((e) => e.id === D.etapa)) D.etapa = vis[0].id;
  const idx = vis.findIndex((e) => e.id === D.etapa); const et = vis[idx];
  let h = '<div style="display:grid;gap:4px"><span class="dg-eye">Etapa ' + (idx + 1) + ' de ' + vis.length + '</span><h2>' + esc(tituloEtapa(et.id)) + '</h2></div>';
  if (et.id === 'proposta') h += renderProposta();
  else {
    if (et.fala) h += '<div class="dg-roteiro"><span class="dg-eye">Diga ao cliente</span><p>“' + esc(et.fala) + '”</p></div>';
    if (bloqueado(a) && et.id !== 'abertura') h += '<div class="dg-al crit"><b>Caso a declinar.</b> O escritório não atua em causas contra o Município de Novo Hamburgo. Encerre com cordialidade e sem indicar colega.</div>';
    if (foraPerfil(a) && et.id !== 'abertura') h += '<div class="dg-al warn"><b>Fora do perfil.</b> Acolha, anote o resumo e indique um colega da área.</div>';
    h += Q.filter((q) => q.e === et.id && visivel(q, a)).map(renderQuestion).join('');
    if (et.id === 'caso' && a.area) { const u = urgencia(a); if (u.nivel === 'crit' || u.nivel === 'alta') h += '<div class="dg-al ' + (u.nivel === 'crit' ? 'crit' : 'warn') + '"><b>' + esc(u.txt) + '</b>' + (u.prazo ? '<span class="pq">Data: ' + dataBR(u.prazo.data) + '</span>' : '') + '</div>'; }
  }
  const prev = vis[idx - 1], next = vis[idx + 1];
  h += '<div class="dg-foot">' + (prev ? '<button class="btn" type="button" data-ir="' + prev.id + '">' + ic('voltar', 's') + ' ' + esc(prev.nome) + '</button>' : '<span></span>') + (next ? '<button class="btn pri" type="button" data-ir="' + next.id + '">' + esc(next.nome) + ' ' + ic('seta', 's') + '</button>' : '') + '</div>';
  main.innerHTML = h;
}
function renderProposta() {
  const a = A(); const H = honorarios(a); const J = emJogo(a); const PL = plano(a, H);
  if (!a.area) return '<div class="card dg-c"><p class="mut" style="margin:0">Escolha a situação do cliente na etapa 2 para montar a proposta.</p></div>';
  if (bloqueado(a)) return '<div class="dg-al crit"><b>Sem proposta.</b> Caso contra o Município de Novo Hamburgo: declinar, sem indicar colega.</div>';
  if (foraPerfil(a)) return '<div class="dg-al warn"><b>Sem proposta.</b> Caso de outra área: indicar um colega.</div>';
  const p = H.fixo && J.total ? H.fixo / J.total * 100 : null;
  let h = '<div class="dg-g2"><div class="card dg-c"><span class="dg-eye">O que está em jogo</span><div class="dg-big">' + brl(J.total) + '</div>' +
    (J.linhas.length ? J.linhas.map((l) => '<div class="dg-l' + (l.info ? ' mut' : '') + '"><span>' + esc(l.k) + '</span><span class="num">' + brl(l.v) + '</span></div>').join('') : '<p class="mut pq" style="margin:0">Preencha valor do bem, dívida, aluguel e mudança para calcular.</p>') + '</div>';
  h += '<div class="card dg-c"><span class="dg-eye">Proposta sugerida · ' + esc(H.produto) + '</span><div class="dg-big ouro">' + brl(H.fixo) + '</div>' + (p != null ? '<div class="pq mut">' + pct(p) + ' do que está em jogo</div>' : '') +
    (H.consulta ? '<div class="dg-l"><span>Consulta já paga (abatida)</span><span class="num">− ' + brl(H.consulta) + '</span></div>' : '') + (PL ? '<div class="dg-l tot"><span>Forma de pagamento</span><span class="num">' + esc(PL.txt) + '</span></div>' : '') +
    H.exito.map((e) => '<div class="dg-l"><span>' + esc(e.k) + '</span><span class="num">' + (e.v != null ? brl(e.v) : 'variável') + '</span></div>').join('') + '<p class="dg-hint" style="margin:0">' + esc(H.nota) + ' Respeite o mínimo da tabela da OAB do estado.</p></div></div>';
  h += '<div class="card dg-c"><h3>Ajustar a proposta</h3><div class="dg-edit"><label for="aj-fixo">Honorário fixo<div class="money"><input class="inp" id="aj-fixo" data-aj="fixo" inputmode="decimal" value="' + esc(fmtMoneyInput(H.fixo)) + '"></div></label>' +
    '<label for="aj-entrada">Entrada<div class="money"><input class="inp" id="aj-entrada" data-aj="entrada" inputmode="decimal" value="' + esc(fmtMoneyInput(PL ? PL.entrada : null)) + '"></div></label>' +
    '<label for="aj-parcelas">Parcelas<input class="inp" id="aj-parcelas" data-aj="parcelas" inputmode="numeric" style="width:90px" value="' + esc(PL ? PL.n : '') + '"></label><button class="btn sm" type="button" id="ajLimpar">Voltar à sugestão</button></div>' +
    (a.fin_mensal && PL && PL.parcela > a.fin_mensal ? '<div class="dg-al warn pq">A parcela de ' + brl(PL.parcela) + ' passa do que o cliente disse que cabe por mês (' + brl(a.fin_mensal) + ').</div>' : '') + '</div>';
  h += '<div class="card dg-c"><h3>Como apresentar</h3><div class="dg-script">' + esc(scriptApresentacao(a, H, J, PL)) + '</div><div><button class="btn sm" type="button" data-copiar="apresentacao">Copiar texto</button></div></div>';
  h += '<div class="card dg-c"><h3>Objeções e respostas</h3>' + objecoes(a, H, J, PL).map((x) => '<details><summary>' + esc(x.o) + '</summary><div class="resp">' + x.r.map((t) => '<p>' + esc(t) + '</p>').join('') + '</div></details>').join('') +
    '<label class="pq mut" for="objLivre" style="font-weight:600">O cliente disse outra coisa? Escreva a objeção e peça uma resposta</label><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="inp" id="objLivre" style="flex:1;min-width:200px" placeholder="Ex.: meu cunhado disse que é só esperar o banco desistir"><button class="btn" type="button" id="btnObj">' + ic('estrela', 's') + ' Responder com IA</button></div><div id="objOut" class="dg-ai"></div></div>';
  h += '<div class="card dg-c"><h3>Fechamento</h3><div class="dg-script">' + esc(scriptFechamento(a, H, PL)) + '</div>' + (D.caso_id ? '<div><a class="btn pri" href="' + LINKS.proposta + '" target="_blank" rel="noopener">' + ic('caneta', 's') + ' Registrar proposta</a></div>' : '') + '</div>';
  h += '<div class="card dg-c"><h3>Registro do atendimento</h3><p class="mut pq" style="margin:0">O diagnóstico fica salvo automaticamente. Você também pode copiar o resumo ou guardá-lo nas notas do caso.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" type="button" data-copiar="resumo">Copiar resumo</button>' +
    (D.caso_id ? '<button class="btn" type="button" id="btnNota">' + ic('caneta', 's') + ' Guardar nas notas do caso</button>' : '') + '<button class="btn ' + (D.status === 'CONCLUIDO' ? '' : 'pri') + '" type="button" id="btnConcluir">' + (D.status === 'CONCLUIDO' ? 'Reabrir' : ic('check', 's') + ' Marcar como concluído') + '</button></div></div>';
  return h;
}

function renderPainel() {
  const el = q$('#dgSide'); if (!el) return;
  const tabs = '<div class="dg-tabs"><button type="button" data-tab="diag" class="' + (D.tab === 'diag' ? 'on' : '') + '">Diagnóstico</button><button type="button" data-tab="ia" class="' + (D.tab === 'ia' ? 'on' : '') + '">Copiloto IA</button><button type="button" data-tab="escuta" class="' + (D.tab === 'escuta' ? 'on' : '') + '">Escuta</button></div>';
  el.innerHTML = tabs + (D.tab === 'diag' ? painelDiag() : D.tab === 'ia' ? painelIA() : painelEscuta());
  if (D.tab === 'escuta') { const t = q$('#dgTrans'); if (t) t.value = D.transcript || ''; atualizaMic(); }
}
function painelDiag() {
  const a = A();
  if (!a.area) return '<div class="card dg-b"><h3>Diagnóstico ao vivo</h3><p class="mut pq" style="margin:0">Conforme você responde, aqui aparecem o prazo, o que está em jogo, as providências e o que dizer ao cliente.</p></div>' + blocoProximas(a);
  const u = urgencia(a), J = emJogo(a), H = honorarios(a), PL = plano(a, H), P = providencias(a), C = conselhos(a), pr = prazos(a);
  let h = '<div class="card dg-b"><span class="dg-chip ' + (bloqueado(a) ? 'bloq' : u.nivel) + '" style="justify-self:start">' + esc(bloqueado(a) ? 'DECLINAR' : u.curto) + '</span><p class="dg-r1">' + esc(resumoLinha(a)) + '</p>' + pr.map((p) => '<div class="dg-l"><span>' + esc(p.nome) + '</span><span class="num">' + dataBR(p.data) + '</span></div>').join('') + '</div>';
  h += blocoProximas(a);
  if (P.length) h += '<div class="card dg-b"><h3>Providências</h3><ul>' + P.map((p) => '<li class="' + (p.urg ? 'urg' : '') + '">' + esc(p.t) + '</li>').join('') + '</ul></div>';
  if (C.length) h += '<div class="card dg-b"><h3>O que dizer ao cliente</h3><ul>' + C.map((c) => '<li>' + esc(c) + '</li>').join('') + '</ul></div>';
  if (!bloqueado(a) && !foraPerfil(a)) h += '<div class="card dg-b"><h3>Em jogo e honorário</h3>' + J.linhas.filter((l) => !l.info).map((l) => '<div class="dg-l"><span>' + esc(l.k) + '</span><span class="num">' + brl(l.v) + '</span></div>').join('') +
    '<div class="dg-l tot"><span>Total em jogo</span><span class="num">' + brl(J.total) + '</span></div><div class="dg-l"><span>Honorário fixo sugerido</span><span class="num">' + brl(H.fixo) + '</span></div>' + (PL ? '<div class="dg-l"><span>Pagamento</span><span class="num pq">' + esc(PL.txt) + '</span></div>' : '') + (H.fixo && J.total ? '<div class="dg-hint">Honorário = ' + pct(H.fixo / J.total * 100) + ' do que está em jogo.</div>' : '') + '</div>';
  return h;
}
function blocoProximas(a) { const n = proximasPerguntas(a); if (!n.length) return ''; return '<div class="card dg-b"><h3>Perguntar agora</h3><div class="dg-sug">' + n.map((q) => '<button type="button" data-irq="' + q.id + '">' + esc(q.fala || q.l) + '</button>').join('') + '</div></div>'; }
function painelIA() {
  return '<div class="card dg-b"><h3>Copiloto do caso</h3><p class="mut pq" style="margin:0">A IA lê tudo o que você preencheu e devolve teses, riscos, o que falta perguntar e como conduzir a venda.</p><div><button class="btn" type="button" id="btnAnalisar">' + ic('estrela', 's') + ' Analisar o caso</button></div><div id="iaStatus" class="mut pq"></div></div>' +
    '<div class="card dg-b dg-ai" id="iaOut">' + (D.ia.analise ? renderAnalise(D.ia.analise) : '<p class="mut pq" style="margin:0">Nenhuma análise ainda. Toque em "Analisar o caso" depois das perguntas principais.</p>') + '</div>';
}
function renderAnalise(x) {
  const lista = (t, arr) => Array.isArray(arr) && arr.length ? '<h4>' + t + '</h4><ul>' + arr.map((i) => '<li>' + esc(typeof i === 'string' ? i : (i.tese ? i.tese + (i.fundamento ? ' — ' + i.fundamento : '') : JSON.stringify(i))) + '</li>').join('') + '</ul>' : '';
  return (x.resumo ? '<h4>Leitura do caso</h4><p>' + esc(x.resumo) + '</p>' : '') + lista('Teses e caminhos', x.teses) + lista('Riscos', x.riscos) + lista('Falta perguntar', x.perguntas) + lista('Condução da venda', x.venda) + lista('Alertas', x.alertas);
}
function painelEscuta() {
  return '<div class="card dg-b"><h3>Escuta da conversa</h3><p class="mut pq" style="margin:0">Ligue o microfone (melhor no Chrome do computador) ou escreva o que o cliente diz. A IA preenche as respostas que encontrar e sugere as próximas perguntas.</p>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn" type="button" id="btnMic">Ouvir pelo microfone</button><span id="micStatus" class="mut pq"></span></div>' +
    '<textarea class="inp" id="dgTrans" style="min-height:160px" placeholder="A transcrição aparece aqui. Você também pode escrever ou ditar."></textarea>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" type="button" id="btnEscuta">' + ic('estrela', 's') + ' Ler a conversa e atualizar</button><button class="btn sm" type="button" id="btnLimparT">Limpar</button></div><div id="escStatus" class="mut pq"></div></div>' +
    '<div class="card dg-b" id="escOut">' + (D.ia.escuta ? renderEscuta(D.ia.escuta) : '<p class="mut pq" style="margin:0">As sugestões aparecem aqui.</p>') + '</div>';
}
function renderEscuta(x) {
  let h = '';
  if (x.preenchidos && x.preenchidos.length) h += '<h3>Preenchido pela IA</h3><ul>' + x.preenchidos.map((p) => '<li>' + esc(p) + '</li>').join('') + '</ul>';
  if (x.perguntas && x.perguntas.length) h += '<h3>Pergunte agora</h3><div class="dg-sug">' + x.perguntas.map((p) => '<button type="button" data-copiar-txt="' + esc(p) + '">' + esc(p) + '</button>').join('') + '</div>';
  if (x.observacao) h += '<p class="pq" style="margin:0">' + esc(x.observacao) + '</p>';
  return h || '<p class="mut pq" style="margin:0">Nada novo encontrado nesta fala.</p>';
}

// ---------- eventos (delegados, só dentro do diagnóstico) ----------
function setResp(id, v) { const a = A(); if (v === '' || v == null) delete a[id]; else a[id] = v; delete D.aiFilled[id]; if (id === 'area') D.ajuste = {}; marcarSujo(); }
document.addEventListener('click', (ev) => {
  if (!D || !q$('#dg') || !ev.target.closest('#dg')) return;
  const t = ev.target.closest('button'); if (!t) return;
  if (t.matches('.dg-opt')) {
    const id = t.dataset.q, q = QI[id]; const v = t.dataset.num ? Number(t.dataset.v) : t.dataset.v;
    if (q.t === 'multi') { const cur = Array.isArray(A()[id]) ? A()[id].slice() : []; const i = cur.indexOf(v); if (i >= 0) cur.splice(i, 1); else { if (v === 'sozinho') cur.length = 0; else { const j = cur.indexOf('sozinho'); if (j >= 0) cur.splice(j, 1); } cur.push(v); } setResp(id, cur.length ? cur : null); }
    else setResp(id, A()[id] === v ? null : v);
    const y = window.scrollY; renderTudo(); window.scrollTo(0, y); return;
  }
  if (t.dataset.etapa || t.dataset.ir) { D.etapa = t.dataset.etapa || t.dataset.ir; marcarSujo(); renderTudo(); q$('#dg').scrollIntoView({ block: 'start' }); window.scrollBy(0, -70); return; }
  if (t.dataset.irq) { const q = QI[t.dataset.irq]; D.etapa = q.e; renderTudo(); const el = document.getElementById('dgq-' + q.id); if (el) { el.scrollIntoView({ block: 'center' }); const i = el.querySelector('input,textarea,button'); if (i) i.focus({ preventScroll: true }); } return; }
  if (t.dataset.tab) { D.tab = t.dataset.tab; renderPainel(); return; }
  if (t.id === 'ajLimpar') { D.ajuste = {}; marcarSujo(); renderTudo(); return; }
  if (t.dataset.copiar) { const a = A(), H = honorarios(a); copiar(t.dataset.copiar === 'resumo' ? textoResumo() : scriptApresentacao(a, H, emJogo(a), plano(a, H))); return; }
  if (t.dataset.copiarTxt) { copiar(t.dataset.copiarTxt); return; }
  if (t.id === 'btnAnalisar') { analisar(t); return; }
  if (t.id === 'btnEscuta') { lerEscuta(t); return; }
  if (t.id === 'btnLimparT') { D.transcript = ''; const tr = q$('#dgTrans'); if (tr) tr.value = ''; marcarSujo(); return; }
  if (t.id === 'btnMic') { alternaMic(); return; }
  if (t.id === 'btnObj') { responderObjecao(t); return; }
  if (t.id === 'btnNota') { agir(t, () => api('nota', { id: D.caso_id, texto: textoResumo().slice(0, 3990) }), 'Resumo guardado nas notas do caso.').then(() => { delete S.cache['caso:' + D.caso_id]; }).catch(() => {}); return; }
  if (t.id === 'btnConcluir') { D.status = D.status === 'CONCLUIDO' ? 'RASCUNHO' : 'CONCLUIDO'; marcarSujo(); salvarAgora(); renderMain(); toast(D.status === 'CONCLUIDO' ? 'Diagnóstico concluído.' : 'Diagnóstico reaberto.'); return; }
});
document.addEventListener('input', (ev) => {
  if (!D || !ev.target.closest || !ev.target.closest('#dg')) return;
  const el = ev.target;
  if (el.id === 'dgTrans') { D.transcript = el.value; marcarSujo(); return; }
  if (el.dataset && el.dataset.q) { const q = QI[el.dataset.q]; if (q.t === 'text' || q.t === 'textarea') { setResp(q.id, el.value.trim() ? el.value : null); renderTop(); renderEtapas(); renderPainel(); const c = document.getElementById('dgq-' + q.id); if (c) c.classList.toggle('resp', respondida(q, A())); } }
});
document.addEventListener('change', (ev) => {
  if (!D || !ev.target.closest || !ev.target.closest('#dg')) return;
  const el = ev.target;
  if (el.dataset && el.dataset.q) {
    const q = QI[el.dataset.q];
    if (q.t === 'money') setResp(q.id, parseMoney(el.value));
    else if (q.t === 'number') { const n = parseInt(String(el.value).replace(/\D/g, ''), 10); setResp(q.id, isFinite(n) ? n : null); }
    else if (q.t === 'date') setResp(q.id, el.value || null);
    else return;
    const y = window.scrollY; renderTudo(); window.scrollTo(0, y); return;
  }
  if (el.dataset && el.dataset.aj) { const k = el.dataset.aj; const n = k === 'parcelas' ? parseInt(el.value, 10) : parseMoney(el.value); if (n == null || !isFinite(n)) delete D.ajuste[k]; else D.ajuste[k] = n; marcarSujo(); const y = window.scrollY; renderTudo(); window.scrollTo(0, y); }
});
document.addEventListener('keydown', (ev) => {
  if (!D || !q$('#dg')) return;
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter' && ev.target.id === 'dgTrans') { ev.preventDefault(); lerEscuta(q$('#btnEscuta')); }
  if (ev.key === 'Enter' && ev.target.id === 'objLivre') { ev.preventDefault(); responderObjecao(q$('#btnObj')); }
});
async function copiar(txt) {
  try { await navigator.clipboard.writeText(txt); toast('Copiado.'); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (x) {} ta.remove(); toast(ok ? 'Copiado.' : 'Não deu para copiar.', !ok); }
}

// ---------- IA ----------
async function pedirIA(tipo, prompt) {
  const r = await fetch(IA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-fce-token': S.token || '' }, body: JSON.stringify({ tipo, prompt, token: S.token }) });
  let j = null; try { j = await r.json(); } catch (e) {}
  if (r.status === 401 || (j && j.erro === 'sessao')) { sair(true); throw new Error('Sua sessão expirou. Entre de novo.'); }
  if (!j || !j.ok) throw new Error((j && j.erro) || 'A IA não respondeu agora.');
  return j.dados.texto;
}
const lerJSON = (t) => { const s = String(t || ''); const i = s.indexOf('{'), f = s.lastIndexOf('}'); if (i < 0 || f < i) throw new Error('A resposta veio fora do formato. Tente de novo.'); return JSON.parse(s.slice(i, f + 1)); };
async function analisar(btn) {
  const st = q$('#iaStatus'); const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = ic('att', 's gira') + ' Analisando'; if (st) st.textContent = 'Leva de 20 a 60 segundos.';
  const prompt = 'Você é um advogado brasileiro sênior, especialista em defesa de devedores em leilão de imóveis (alienação fiduciária da Lei 9.514/97 e execução judicial), execuções fiscais, condomínio, busca e apreensão de veículos e assessoria a arrematantes. Está ajudando o Dr. Fábio DURANTE uma consulta com o cliente.\n\n' + contextoCaso() +
    '\n\nTAREFA: analise o caso e responda SOMENTE com um objeto JSON neste formato:\n{"resumo": "2 a 3 frases com a leitura jurídica do caso", "teses": [{"tese": "...", "fundamento": "lei/artigo ou súmula, só se tiver segurança"}], "riscos": ["..."], "perguntas": ["perguntas que o advogado ainda deve fazer ao cliente, na linguagem do cliente"], "venda": ["como conduzir a conversa e a proposta com este cliente, usando o que ele disse"], "alertas": ["prazos ou cuidados críticos"]}\nRegras: no máximo 5 itens por lista; não invente fatos; se faltar informação, diga o que falta.';
  try { const x = lerJSON(await pedirIA('analise', prompt)); D.ia.analise = x; marcarSujo(); const out = q$('#iaOut'); if (out) out.innerHTML = renderAnalise(x); if (q$('#iaStatus')) q$('#iaStatus').textContent = 'Análise das ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '.'; }
  catch (e) { if (q$('#iaStatus')) q$('#iaStatus').textContent = e.message || 'Não deu certo.'; }
  finally { if (document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = orig; } }
}
async function lerEscuta(btn) {
  const txt = (D.transcript || '').trim(); const st = q$('#escStatus');
  if (txt.length < 15) { if (st) st.textContent = 'Grave, escreva ou dite um trecho da conversa primeiro.'; return; }
  const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = ic('att', 's gira') + ' Lendo'; if (st) st.textContent = '';
  const a = A(); const atuais = Object.keys(a).filter((k) => QI[k]).map((k) => k + ' = ' + JSON.stringify(a[k])).join('\n') || '(nenhuma)';
  const prompt = 'Abaixo estão o trecho da conversa do Dr. Fábio com o cliente, as respostas já preenchidas e a lista de campos do formulário de diagnóstico.\n\nCONVERSA (mais recente no fim):\n' + txt.slice(-7000) + '\n\nRESPOSTAS JÁ PREENCHIDAS:\n' + atuais + '\n\nCAMPOS DO FORMULÁRIO (id (pergunta): valores aceitos):\n' + esquemaPerguntas() +
    '\n\nHoje é ' + new Date().toISOString().slice(0, 10) + '.\nResponda SOMENTE com JSON: {"preencher": {"id": valor}, "perguntas": ["até 3 perguntas para o advogado fazer agora, na linguagem do cliente, priorizando o que falta para o diagnóstico e para a proposta"], "observacao": "uma frase sobre algo importante que o cliente revelou (ou vazio)"}.\nPreencha só o que o cliente disse claramente; use exatamente os códigos de valor aceitos; não repita campos já preenchidos com o mesmo valor; datas relativas viram AAAA-MM-DD.';
  try {
    const r = lerJSON(await pedirIA('escuta', prompt)); const pre = [];
    if (r && r.preencher && typeof r.preencher === 'object') for (const [k, v] of Object.entries(r.preencher)) { const val = valida(k, v); if (val !== undefined) { a[k] = val; D.aiFilled[k] = true; pre.push(QI[k].l + ': ' + rotulo(k, val)); } }
    D.ia.escuta = { preenchidos: pre, perguntas: Array.isArray(r && r.perguntas) ? r.perguntas.slice(0, 3).map(String) : [], observacao: r && r.observacao ? String(r.observacao) : '' };
    marcarSujo(); renderTudo(); const s2 = q$('#escStatus'); if (s2) s2.textContent = pre.length ? pre.length + ' resposta(s) preenchida(s). Elas aparecem nas etapas com a etiqueta IA.' : 'Nenhuma resposta nova encontrada.';
  } catch (e) { const s2 = q$('#escStatus'); if (s2) s2.textContent = e.message || 'Não deu certo.'; }
  finally { const b = q$('#btnEscuta'); if (b) { b.disabled = false; b.innerHTML = orig; } }
}
async function responderObjecao(btn) {
  const inp = q$('#objLivre'), out = q$('#objOut'); const obj = (inp.value || '').trim(); if (!obj) { inp.focus(); return; }
  const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = ic('att', 's gira') + ' Pensando'; out.innerHTML = '';
  const a = A(); const H = honorarios(a); const PL = plano(a, H);
  const prompt = 'Você é um consultor de vendas de um escritório de advocacia brasileiro, treinando o Dr. Fábio ao vivo. O cliente acabou de levantar esta objeção: "' + obj + '".\n\n' + contextoCaso() + (PL ? '\nPAGAMENTO PROPOSTO: ' + PL.txt : '') + (a.imp_significado ? '\nO cliente disse que o bem representa: ' + a.imp_significado : '') +
    '\n\nEscreva a resposta que o Dr. Fábio deve dar, em 2 a 4 frases faladas, tom calmo e seguro, usando os números do caso quando ajudar. Depois, em uma linha começando com "Pergunta de volta:", uma pergunta para manter o cliente na conversa. Não prometa resultado, não pressione de forma desleal e não fale mal de colegas ou da Defensoria. Sem markdown.';
  try { const t = await pedirIA('objecao', prompt); out.innerHTML = t.split(/\n+/).filter((p) => p.trim()).map((p) => '<p style="font:16px/1.5 var(--serif)">' + esc(p.replace(/^[#*\s]+/, '')) + '</p>').join(''); }
  catch (e) { out.innerHTML = '<p class="mut">' + esc(e.message || 'Não deu certo.') + '</p>'; }
  finally { if (document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = orig; } }
}

// ---------- microfone (Chrome no computador ou Android) ----------
let rec = null, gravando = false;
function atualizaMic() {
  const b = q$('#btnMic'), s = q$('#micStatus'); if (!b) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { b.hidden = true; if (s) s.textContent = 'Este navegador não transcreve a voz. Use o Chrome, ou o ditado do teclado dentro da caixa.'; return; }
  b.innerHTML = gravando ? '<span class="dg-rec"></span> Parar de ouvir' : 'Ouvir pelo microfone';
  if (s && gravando) s.textContent = 'Ouvindo…';
}
function alternaMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
  if (gravando && rec) { rec.continuar = false; rec.stop(); return; }
  try {
    rec = new SR(); rec.lang = 'pt-BR'; rec.continuous = true; rec.interimResults = false; rec.continuar = true;
    rec.onresult = (ev) => { let novo = ''; for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) novo += ev.results[i][0].transcript.trim() + ' '; if (novo && D) { D.transcript = ((D.transcript || '') + (D.transcript && !/\s$/.test(D.transcript) ? ' ' : '') + novo).trimStart(); const t = q$('#dgTrans'); if (t) { t.value = D.transcript; t.scrollTop = t.scrollHeight; } marcarSujo(); } };
    rec.onerror = (ev) => { const s = q$('#micStatus'); if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { rec.continuar = false; if (s) s.textContent = 'O navegador bloqueou o microfone. Libere o microfone para fceadvogados.com.br e tente de novo.'; } };
    rec.onend = () => { if (rec && rec.continuar && q$('#dg')) { try { rec.start(); return; } catch (e) {} } gravando = false; atualizaMic(); const s = q$('#micStatus'); if (s && s.textContent === 'Ouvindo…') s.textContent = ''; };
    rec.start(); gravando = true; atualizaMic();
  } catch (e) { gravando = false; atualizaMic(); const s = q$('#micStatus'); if (s) s.textContent = 'Não deu para usar o microfone aqui.'; }
}
window.addEventListener('hashchange', () => { if (gravando && rec && !/^#\/diagnostico/.test(location.hash)) { rec.continuar = false; rec.stop(); } });

// ---------- rota ----------
VIEWS.diagnostico = async (arg, forcar) => {
  if (!arg) { D = null; return telaLista(forcar); }
  await abrir(arg, forcar);
  telaEditor();
};
if (/^#\/diagnostico/.test(location.hash) && S.token) rota();

})();
