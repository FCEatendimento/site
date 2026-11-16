// Aba "Teses": situações em que o devedor chega ao escritório, com teses de defesa, ações a ajuizar,
// estratégias extrajudiciais e prazos. Material de trabalho interno (16/11/2026). Conferir a jurisprudência atual antes de peticionar.
(function () {
const FORCA = {
  consolidada: ['Consolidada', 'Súmula, repetitivo ou texto expresso de lei'],
  boa: ['Boa', 'Jurisprudência majoritária a favor'],
  caso: ['Caso a caso', 'Depende da prova e do tribunal'],
  fraca: ['Fraca', 'Tribunais costumam rejeitar; use só como reforço']
};
const SIT = [
  {
    id: 'af', titulo: 'Imóvel em alienação fiduciária', sub: 'Financiamento ou empréstimo com o imóvel em garantia (Lei 9.514/97)',
    chega: ['"Recebi uma carta do cartório para pagar em 15 dias."', '"O imóvel foi para o nome do banco."', '"Vi meu imóvel num site de leilão."', '"O arrematante quer que eu saia."'],
    prazos: [
      'Purgar a mora: 15 dias da intimação do cartório (art. 26, § 1º).',
      'Depois da consolidação (Lei 13.465/2017 em diante): só o direito de preferência até a data do 2º leilão (art. 27, § 2º-B). O marco é a data da consolidação (STJ, Tema 1.288).',
      '1º leilão em até 60 dias da consolidação (art. 27, caput).',
      'Reintegração de posse: liminar para desocupar em 60 dias (art. 30).'
    ],
    defesas: [
      { t: 'Nulidade da intimação para purgar a mora', f: 'boa', fund: 'Lei 9.514/97, art. 26, §§ 1º, 3º, 3º-A e 4º; STJ: intimação por edital só depois de esgotados os meios de localizar o devedor.', quando: 'Intimação entregue a terceiro sem os requisitos da hora certa, edital sem tentativas reais, devedor ou cônjuge coproprietário não intimados, notificação sem o valor ou com valor errado.', prova: 'Certidão do cartório com as diligências, AR, matrícula atualizada.' },
      { t: 'Falta de comunicação das datas dos leilões ao devedor', f: 'consolidada', fund: 'Lei 9.514/97, art. 27, § 2º-A (correspondência, inclusive e-mail, no endereço do contrato); STJ reconhece a nulidade do leilão sem esse aviso.', quando: 'Cliente não recebeu carta ou e-mail com as datas e o local dos leilões.', prova: 'Pedido ao banco/leiloeiro do comprovante de envio; edital; declaração do cliente.' },
      { t: 'Falta de notificação: exceção que impede a posse do arrematante', f: 'consolidada', fund: 'Lei 9.514/97, art. 30, parágrafo único (redação da Lei 14.711/2023): vícios contratuais e procedimentais viram perdas e danos e não impedem a reintegração, EXCETO a exigência de notificação do devedor.', quando: 'Imóvel já arrematado; a defesa precisa atacar a intimação/notificação para discutir a posse.', prova: 'Mesma prova da nulidade da intimação.' },
      { t: 'Preço vil no leilão extrajudicial', f: 'boa', fund: 'Lei 9.514/97, art. 27, § 2º (2º leilão: no mínimo metade do valor de avaliação, Lei 14.711/2023); STJ (3ª Turma, 2024) aplica as normas contra preço vil ao leilão da alienação fiduciária.', quando: 'Arrematação abaixo de 50% do valor de avaliação ou avaliação defasada.', prova: 'Laudo ou parecer de avaliação, anúncios de imóveis parecidos, edital.' },
      { t: 'Valor mínimo do 1º leilão abaixo do exigido', f: 'boa', fund: 'Lei 9.514/97, art. 24, VI e parágrafo único: o valor do imóvel para o leilão não pode ser inferior à base de cálculo do ITBI.', quando: 'Edital com valor de 1º leilão menor que o valor do contrato atualizado ou a base do ITBI.', prova: 'Edital, guia do ITBI da consolidação, contrato.' },
      { t: 'Purgação da mora depois da consolidação (consolidações anteriores à Lei 13.465/2017)', f: 'consolidada', fund: 'STJ, Tema 1.288 (REsp 2.126.726, 2ª Seção, 10/12/2025): consolidação anterior à lei admite purgar e desfazer a consolidação; posterior, só direito de preferência.', quando: 'Consolidação averbada antes de 11/07/2017.', prova: 'Matrícula com a data da averbação.' },
      { t: 'Contrato de alienação fiduciária não registrado', f: 'boa', fund: 'Lei 9.514/97, art. 23: a propriedade fiduciária se constitui com o registro. Sem registro, não cabe execução extrajudicial; STJ, Tema 1.095, só afasta o CDC quando a garantia está registrada.', quando: 'Compra com construtora ou loteadora, ou contrato particular sem averbação na matrícula.', prova: 'Matrícula atualizada.' },
      { t: 'Revisão do contrato (juros, capitalização, seguros, tarifas)', f: 'caso', fund: 'STJ, REsp 1.061.530 (juros acima da média do Banco Central); Temas 618, 958 e 972 (tarifas e seguro); Súmulas 539 e 541 (capitalização).', quando: 'Para reduzir o saldo e, com depósito do incontroverso, pedir tutela. Sozinha não suspende o leilão.', prova: 'Contrato, extrato de evolução da dívida, cálculo pericial.' },
      { t: 'Devolução da sobra do leilão e prestação de contas', f: 'consolidada', fund: 'Lei 9.514/97, art. 27, § 4º: o credor entrega ao devedor o que sobrar em 5 dias.', quando: 'Imóvel vendido por mais que a dívida e as despesas, sem repasse ou com despesas infladas.', prova: 'Auto de arrematação, planilha do banco.' },
      { t: 'Taxa de ocupação cobrada a mais', f: 'boa', fund: 'Lei 9.514/97, art. 37-A: 1% ao mês só a partir da consolidação até a imissão na posse.', quando: 'Cobrança de período anterior à consolidação ou base de cálculo errada.', prova: 'Matrícula, valor do contrato e do ITBI.' },
      { t: 'Bem de família', f: 'fraca', fund: 'STJ, EREsp 1.559.370 (2ª Seção, 2023): o bem de família pode ser dado em alienação fiduciária; quem ofereceu voluntariamente, em regra, não pode alegar impenhorabilidade.', quando: 'Só como reforço (ex.: pequena propriedade rural, garantia prestada sem benefício à família).', prova: '—' },
      { t: 'Adimplemento substancial', f: 'fraca', fund: 'STJ rejeita a tese na alienação fiduciária de veículos (REsp 1.622.555) e os tribunais tendem a estender ao imóvel.', quando: 'Só como argumento de equidade, nunca como tese principal.', prova: '—' }
    ],
    acoes: [
      { t: 'Ação anulatória da consolidação e/ou do leilão com tutela de urgência', fund: 'CPC, art. 300; Lei 9.514/97, arts. 26, 27 e 30.', quando: 'Vício de intimação, de aviso dos leilões ou preço vil. Pedir a suspensão do leilão ou do registro da arrematação; o juiz pode exigir caução ou depósito.' },
      { t: 'Ação revisional com depósito do valor incontroverso', fund: 'CPC, art. 330, §§ 2º e 3º; Lei 10.931/2004, art. 50.', quando: 'Contrato com encargos abusivos; manter o pagamento do incontroverso evita a mora.' },
      { t: 'Ação de cobrança ou prestação de contas da sobra', fund: 'Lei 9.514/97, art. 27, § 4º.', quando: 'Banco não devolveu o que sobrou do leilão.' },
      { t: 'Indenização por perdas e danos', fund: 'Lei 9.514/97, art. 30, parágrafo único.', quando: 'Arrematação consumada com vício procedimental que não impede a posse.' }
    ],
    extra: [
      'Pedir ao banco a planilha atualizada da dívida e o valor exato para purgar a mora; conferir encargos.',
      'Negociar a purgação, a incorporação das parcelas ao saldo ou novo prazo; propor por escrito, com prazo de resposta.',
      'FGTS para amortizar ou quitar parcelas (financiamento pelo SFH).',
      'Vender o imóvel antes da consolidação ou do leilão para preservar o patrimônio; portabilidade ou refinanciamento.',
      'Exercer o direito de preferência até o 2º leilão (dívida + despesas + ITBI), inclusive com comprador ou investidor parceiro.',
      'Reclamação no Banco Central e no consumidor.gov.br para destravar negociação.'
    ],
    cuidado: ['Superendividamento NÃO alcança financiamento imobiliário nem crédito com garantia real (CDC, art. 104-A, § 1º).', 'A revisional sem depósito não impede o leilão.']
  },
  {
    id: 'planta', titulo: 'Compra na planta, construtora ou loteadora', sub: 'Atraso, distrato e cobrança da construtora',
    chega: ['"Não consigo mais pagar o apartamento na planta."', '"A loteadora quer retomar o lote."'],
    prazos: ['Loteamento: notificação com 30 dias para pagar antes da rescisão (Lei 6.766/79, art. 32).'],
    defesas: [
      { t: 'Retenção limitada no distrato', f: 'consolidada', fund: 'Lei 13.786/2018: até 25% do valor pago (50% com patrimônio de afetação), mais comissão; antes da lei, Súmula 543 do STJ.', quando: 'Construtora quer reter mais ou devolver em prazo maior.', prova: 'Contrato, recibos.' },
      { t: 'Alienação fiduciária não registrada: aplica o CDC', f: 'boa', fund: 'STJ, Tema 1.095: a Lei 9.514/97 prevalece só com a garantia registrada.', quando: 'Construtora tenta leilão extrajudicial sem registro da garantia.', prova: 'Matrícula.' },
      { t: 'Atraso na entrega: multa contratual (ou lucros cessantes) e inversão da cláusula penal', f: 'consolidada', fund: 'STJ, Temas 970 (multa moratória não se soma a lucros cessantes) e 971 (multa só contra o comprador pode ser invertida contra a construtora).', quando: 'Obra atrasada além da tolerância de 180 dias.', prova: 'Contrato, habite-se.' }
    ],
    acoes: [{ t: 'Ação de rescisão com devolução das parcelas', fund: 'Lei 13.786/2018; CDC, art. 53.', quando: 'Cliente quer sair do negócio.' }],
    extra: ['Propor distrato amigável com cálculo da retenção legal.', 'Cessão do contrato a terceiro, com anuência da construtora.']
  },
  {
    id: 'veic', titulo: 'Veículo financiado: busca e apreensão', sub: 'Decreto-Lei 911/69',
    chega: ['"O banco entrou com busca e apreensão do meu carro."', '"Levaram o carro."', '"Estou com parcelas atrasadas do carro."'],
    prazos: ['5 dias da execução da liminar para pagar a dívida integral e reaver o veículo (art. 3º, § 2º; STJ, Tema 722).', '15 dias para contestar (art. 3º, § 3º).'],
    defesas: [
      { t: 'Encargos abusivos no período da normalidade descaracterizam a mora', f: 'consolidada', fund: 'STJ, REsp 1.061.530 (repetitivo): juros remuneratórios ou capitalização abusivos afastam a mora e, sem mora, não cabe busca e apreensão.', quando: 'Taxa muito acima da média do Banco Central para o mês do contrato.', prova: 'Contrato e série histórica de taxas do Banco Central.' },
      { t: 'Notificação enviada a endereço diverso do contrato', f: 'caso', fund: 'STJ, Tema 1.132: basta o envio ao endereço do contrato, sem prova de recebimento. A defesa só funciona se o envio foi a outro endereço ou não houve envio.', quando: 'Notificação para endereço errado ou inexistente.', prova: 'Notificação juntada pelo banco, contrato.' },
      { t: 'Venda do veículo por preço vil e prestação de contas', f: 'boa', fund: 'DL 911/69, art. 2º (venda e aplicação do preço com prestação de contas).', quando: 'Banco vende muito abaixo da FIPE e cobra saldo.', prova: 'Tabela FIPE, comprovante de venda.' },
      { t: 'Multa de 50% do valor financiado em caso de improcedência', f: 'consolidada', fund: 'DL 911/69, art. 3º, § 6º.', quando: 'Ação improcedente e veículo já alienado pelo banco.', prova: '—' },
      { t: 'Adimplemento substancial', f: 'fraca', fund: 'STJ, REsp 1.622.555 (2ª Seção, 2017) afastou a tese no DL 911/69.', quando: 'Só como argumento de equidade.', prova: '—' }
    ],
    acoes: [{ t: 'Ação revisional com consignação das parcelas', fund: 'STJ, REsp 1.061.530; CPC, art. 330, § 2º.', quando: 'Antes da busca e apreensão, para afastar a mora com depósito.' }],
    extra: ['Negociar antes da apreensão: incorporar parcelas, alongar prazo.', 'Venda do veículo com quitação ou transferência da dívida com anuência do banco.', 'Entrega amigável para reduzir custos de remoção e pátio, se o cliente não quiser manter.', 'Busca e apreensão extrajudicial pelo cartório (Lei 14.711/2023): conferir requisitos e a situação no STF antes de orientar.']
  },
  {
    id: 'exec', titulo: 'Execução bancária e cobrança judicial', sub: 'CCB, contrato, cheque, nota promissória, aval e fiança',
    chega: ['"Fui citado numa execução do banco."', '"Bloquearam minha conta."', '"Sou avalista da empresa e estão me cobrando."'],
    prazos: ['Embargos à execução: 15 dias úteis da juntada do mandado de citação (CPC, arts. 915 e 231).', 'Parcelamento do art. 916 (30% + até 6 parcelas): no prazo dos embargos.', 'Impugnar penhora de valores (Sisbajud): 5 dias (CPC, art. 854, § 3º).'],
    defesas: [
      { t: 'Excesso de execução', f: 'consolidada', fund: 'CPC, art. 917, III e § 3º (indicar o valor correto e apresentar cálculo).', quando: 'Juros, multa ou encargos acima do contrato ou cumulação indevida.', prova: 'Memória de cálculo.' },
      { t: 'Comissão de permanência cumulada com outros encargos', f: 'consolidada', fund: 'STJ, Súmula 472.', quando: 'Contrato prevê comissão de permanência junto com juros moratórios ou multa.', prova: 'Contrato e planilha.' },
      { t: 'Juros remuneratórios acima da média do Banco Central', f: 'boa', fund: 'STJ, REsp 1.061.530 (repetitivo) e Súmula 530.', quando: 'Taxa muito acima da média de mercado da época.', prova: 'Série do Banco Central.' },
      { t: 'Tarifas e seguro cobrados indevidamente', f: 'consolidada', fund: 'STJ, Temas 618 (TAC/TEC), 958 (serviços de terceiros, registro, avaliação) e 972 (seguro prestamista imposto).', quando: 'Contratos com tarifas sem serviço prestado ou seguro de seguradora do próprio banco sem escolha.', prova: 'Contrato.' },
      { t: 'Prescrição', f: 'consolidada', fund: 'Cheque: 6 meses após a apresentação para executar (Lei 7.357/85, art. 59); monitória em 5 anos (Súmula 503). Nota promissória: 3 anos (LUG, art. 70); monitória em 5 anos (Súmula 504). Contratos: 5 anos (CC, art. 206, § 5º, I). Intercorrente: CPC, art. 921, §§ 4º e 5º.', quando: 'Título antigo ou processo parado.', prova: 'Datas do título e andamentos.' },
      { t: 'Impenhorabilidades', f: 'boa', fund: 'CPC, art. 833 (salário, até 40 salários mínimos em poupança, ferramentas de trabalho); Lei 8.009/90 (bem de família). O STJ admite penhora parcial de salário para dívida não alimentar se preservada a subsistência (EREsp 1.874.222).', quando: 'Bloqueio de conta salário ou de reserva; penhora do imóvel residencial.', prova: 'Extratos, holerites, comprovante de residência.' },
      { t: 'Fiança sem outorga do cônjuge', f: 'consolidada', fund: 'STJ, Súmula 332: ineficácia total da garantia.', quando: 'Fiador casado sem assinatura do cônjuge (exceto separação absoluta).', prova: 'Contrato, certidão de casamento.' },
      { t: 'Exceção de pré-executividade', f: 'consolidada', fund: 'STJ, Súmula 393: matérias de ordem pública sem dilação probatória.', quando: 'Prazo dos embargos perdido; prescrição, nulidade do título, ilegitimidade.', prova: 'Documental.' },
      { t: 'Preço vil e nulidades do leilão judicial', f: 'consolidada', fund: 'CPC, art. 891 (abaixo de 50% da avaliação, salvo outro mínimo fixado), art. 889 (intimação do executado com 5 dias) e art. 903, § 2º (10 dias para alegar).', quando: 'Imóvel penhorado indo a leilão.', prova: 'Edital, laudo, intimações.' }
    ],
    acoes: [{ t: 'Ação revisional ou declaratória de inexigibilidade', fund: 'CDC; STJ, REsp 1.061.530; Súmula 297 (CDC aplica-se a bancos).', quando: 'Antes de ser executado ou para dívidas ainda não cobradas.' }, { t: 'Repetição do indébito em dobro', fund: 'CDC, art. 42, parágrafo único; STJ, EAREsp 676.608 (independe de má-fé para cobranças após 30/03/2021).', quando: 'Valores pagos a mais.' }],
    extra: ['Proposta de acordo com desconto (feirões, Desenrola e campanhas dos bancos), por escrito e com prazo.', 'Parcelamento do art. 916 do CPC quando o valor estiver certo.', 'Oferecer bem à penhora menos gravoso (CPC, art. 805) para liberar conta ou imóvel residencial.', 'Remição da execução pagando o valor atualizado antes da arrematação (CPC, art. 826).']
  },
  {
    id: 'bancario', titulo: 'Juros abusivos: cartão, cheque especial e empréstimos', sub: 'Cliente ainda não executado, mas a dívida não para de crescer',
    chega: ['"Pego empréstimo para pagar o cartão."', '"A dívida do cheque especial dobrou."'],
    prazos: [],
    defesas: [
      { t: 'Rotativo do cartão: encargos limitados a 100% da dívida', f: 'consolidada', fund: 'Lei 14.690/2023 (juros e encargos do rotativo e parcelamento da fatura não podem passar do valor original, desde 01/2024); Res. CMN 4.549/2017 (rotativo por no máximo um ciclo).', quando: 'Fatura que mais que dobrou só com encargos.', prova: 'Faturas.' },
      { t: 'Cheque especial acima do teto', f: 'consolidada', fund: 'Res. CMN 4.765/2019: juros do cheque especial limitados a 8% ao mês.', quando: 'Contratos com taxa maior a partir de 2020.', prova: 'Extratos.' },
      { t: 'Juros acima da média e capitalização não pactuada', f: 'boa', fund: 'STJ, REsp 1.061.530; Súmulas 530, 539 e 541.', quando: 'Empréstimo pessoal, CDC, crediário.', prova: 'Contrato, série do Banco Central.' },
      { t: 'Dívida prescrita não pode ser cobrada nem fora da Justiça', f: 'boa', fund: 'STJ, REsp 2.088.100 (3ª Turma, 2023).', quando: 'Cobranças de dívidas com mais de 5 anos (Serasa Limpa Nome, assessorias).', prova: 'Data do vencimento.' }
    ],
    acoes: [{ t: 'Ação revisional com repetição em dobro', fund: 'CDC, arts. 6º, V, e 42; STJ, EAREsp 676.608.', quando: 'Encargos acima dos limites.' }],
    extra: ['Pedir ao banco a migração do rotativo para parcelamento com juros menores (obrigatória).', 'Portabilidade de crédito para taxa menor.', 'Montar o mapa de dívidas e priorizar as com garantia (imóvel, carro).']
  },
  {
    id: 'consignado', titulo: 'Consignado, cartão consignado (RMC/RCC) e descontos no benefício', sub: 'Servidor, aposentado e pensionista do INSS',
    chega: ['"Descontam do meu benefício um cartão que nunca usei."', '"Não sobra nada do salário."'],
    prazos: [],
    defesas: [
      { t: 'Margem consignável estourada', f: 'consolidada', fund: 'Lei 14.431/2022: 45% (35% empréstimo, 5% cartão consignado, 5% cartão benefício) para INSS e servidores federais; conferir a lei de cada ente.', quando: 'Descontos somam mais que a margem.', prova: 'Extrato de empréstimos do INSS ou contracheque.' },
      { t: 'Cartão consignado (RMC) contratado como se fosse empréstimo', f: 'boa', fund: 'CDC, arts. 6º, III, e 39; tribunais convertem em empréstimo consignado comum e mandam devolver o excesso.', quando: 'Cliente queria empréstimo e recebeu cartão com desconto mínimo eterno.', prova: 'Contrato, faturas, histórico de créditos.' },
      { t: 'Descontos não autorizados (associações, seguros)', f: 'boa', fund: 'CDC, art. 42, parágrafo único; responsabilidade do INSS e da entidade.', quando: 'Descontos sem autorização no benefício.', prova: 'Extrato do benefício (Meu INSS).' },
      { t: 'Mínimo existencial', f: 'caso', fund: 'Decreto 11.150/2022 (R$ 600); STF (ADPFs 1005, 1006 e 1097, abr/2026) manteve o valor, incluiu o consignado no cálculo e mandou revisar todo ano. Conferir o valor vigente.', quando: 'Dentro do processo de superendividamento.', prova: 'Renda e despesas básicas.' }
    ],
    acoes: [{ t: 'Ação declaratória com conversão do RMC e repetição em dobro', fund: 'CDC.', quando: 'Cartão consignado não desejado.' }, { t: 'Ação de limitação dos descontos à margem', fund: 'Lei 14.431/2022.', quando: 'Margem estourada.' }],
    extra: ['Pedir devolução de descontos de associações pelo Meu INSS ou telefone 135.', 'Bloquear o benefício para novas consignações (Meu INSS).', 'Portabilidade do consignado para taxa menor.']
  },
  {
    id: 'superend', titulo: 'Superendividamento', sub: 'Várias dívidas de consumo que comprometem o básico (CDC, arts. 54-A a 54-G e 104-A a 104-C)',
    chega: ['"Ganho e já está tudo comprometido."', '"Tenho dívida em cinco bancos."'],
    prazos: [],
    defesas: [
      { t: 'Repactuação: plano único em até 5 anos', f: 'consolidada', fund: 'CDC, art. 104-A: audiência de conciliação com todos os credores; credor que falta sem justificativa sofre suspensão da cobrança e entra no plano (§ 2º).', quando: 'Dívidas de consumo de boa-fé (cartão, empréstimos, crediário, contas).', prova: 'Lista de dívidas, renda, despesas básicas.' },
      { t: 'Plano judicial compulsório', f: 'consolidada', fund: 'CDC, art. 104-B: sem acordo, o juiz revisa e integra os contratos num plano obrigatório.', quando: 'Credores não aceitaram o plano.', prova: '—' },
      { t: 'Crédito concedido sem análise ou com assédio', f: 'boa', fund: 'CDC, arts. 54-C e 54-D, parágrafo único: redução de juros, dilação de prazo e indenização.', quando: 'Crédito oferecido a idoso, por telefone, sem avaliar a capacidade de pagamento.', prova: 'Gravações, mensagens, contratos.' }
    ],
    acoes: [{ t: 'Ação de repactuação por superendividamento', fund: 'CDC, arts. 104-A e 104-B.', quando: 'Comprometimento alto da renda com dívidas de consumo.' }],
    extra: ['Núcleos de superendividamento (Procon e CEJUSC) para a fase conciliatória.', 'Mapa de dívidas com prioridade para as que têm garantia.'],
    cuidado: ['Ficam de fora: financiamento imobiliário, crédito com garantia real, crédito rural e dívidas contraídas sem intenção de pagar (art. 104-A, § 1º).']
  },
  {
    id: 'cond', titulo: 'Condomínio em atraso', sub: 'Cobrança, execução e leilão por cotas condominiais',
    chega: ['"O condomínio entrou na Justiça e penhorou meu apartamento."'],
    prazos: ['Embargos à execução: 15 dias úteis (CPC, art. 915).'],
    defesas: [
      { t: 'Prescrição de 5 anos das cotas', f: 'consolidada', fund: 'STJ, REsp 1.483.930 (repetitivo, Tema 949); CC, art. 206, § 5º, I.', quando: 'Cobrança de cotas antigas.', prova: 'Planilha do condomínio.' },
      { t: 'Multa acima de 2% e encargos indevidos', f: 'consolidada', fund: 'CC, art. 1.336, § 1º (multa de até 2%; juros de 1% ao mês se não convencionados). Multa por inadimplência reiterada exige deliberação (CC, art. 1.337).', quando: 'Planilha com multa maior, honorários extrajudiciais embutidos, correção dupla.', prova: 'Convenção, atas, planilha.' },
      { t: 'Ilegitimidade passiva', f: 'boa', fund: 'STJ, REsp 1.345.331 (repetitivo): responde quem tem a posse e a relação com o condomínio, conforme a ciência do condomínio sobre a venda.', quando: 'Imóvel vendido ou prometido à venda com posse transferida.', prova: 'Contrato de venda, comunicação ao condomínio.' },
      { t: 'Preço vil e nulidades do leilão judicial', f: 'consolidada', fund: 'CPC, arts. 889, 891 e 903.', quando: 'Leilão marcado.', prova: 'Edital, laudo.' }
    ],
    acoes: [{ t: 'Ação declaratória ou consignatória', fund: 'CPC, art. 539.', quando: 'Condomínio recusa receber ou cobra valores indevidos.' }],
    extra: ['Acordo com a administradora com parcelamento aprovado pelo síndico.', 'Parcelamento do art. 916 do CPC na execução.', 'Remição pagando a dívida antes da arrematação (CPC, art. 826).'],
    cuidado: ['Bem de família NÃO protege contra cotas do próprio imóvel (Lei 8.009/90, art. 3º, IV).']
  },
  {
    id: 'fiscal', titulo: 'IPTU e execução fiscal (outros municípios)', sub: 'Cobrança de IPTU, taxas e execução fiscal com penhora do imóvel',
    alerta: 'Município de Novo Hamburgo: o escritório não atua. Declinar sem indicar colega.',
    chega: ['"A prefeitura vai leiloar meu imóvel por IPTU."'],
    prazos: ['Embargos à execução fiscal: 30 dias da garantia do juízo (Lei 6.830/80, art. 16).'],
    defesas: [
      { t: 'Prescrição do crédito e prescrição intercorrente', f: 'consolidada', fund: 'CTN, art. 174; STJ, Súmula 397 (IPTU constituído com o envio do carnê); Lei 6.830/80, art. 40, e STJ, Tema 566 (intercorrente).', quando: 'Exercícios com mais de 5 anos até o despacho que ordenou a citação, ou processo parado.', prova: 'CDA, andamentos.' },
      { t: 'Execução fiscal de baixo valor', f: 'consolidada', fund: 'STF, Tema 1.184; CNJ, Res. 547/2024: extinção de execuções de até R$ 10 mil sem movimentação útil há mais de 1 ano, e exigência de tentativa de conciliação ou protesto antes de ajuizar.', quando: 'Execução pequena e parada.', prova: 'Andamentos.' },
      { t: 'Nulidade da CDA', f: 'boa', fund: 'Lei 6.830/80, art. 2º, § 5º; STJ, Súmula 392 (não se troca o sujeito passivo).', quando: 'CDA sem origem, fundamento ou cálculo; executado errado.', prova: 'CDA.' },
      { t: 'Exceção de pré-executividade', f: 'consolidada', fund: 'STJ, Súmula 393.', quando: 'Prescrição, nulidade, ilegitimidade sem precisar de prova.', prova: 'Documental.' },
      { t: 'Ilegitimidade de quem vendeu o imóvel', f: 'caso', fund: 'STJ, Tema 122: promitente vendedor e comprador podem ser cobrados juntos; ilegitimidade só se a venda foi registrada antes do fato gerador.', quando: 'Venda antiga com escritura registrada.', prova: 'Matrícula.' },
      { t: 'Isenções e erros de lançamento', f: 'caso', fund: 'Lei municipal (isenção de aposentados, imóvel único etc.).', quando: 'Cliente que teria direito a isenção ou área/padrão errados.', prova: 'Ficha cadastral do imóvel.' }
    ],
    acoes: [{ t: 'Ação anulatória do lançamento', fund: 'CTN; CPC.', quando: 'Lançamento indevido e sem execução.' }],
    extra: ['REFIS ou parcelamento municipal (suspende a exigibilidade: CTN, art. 151, VI).', 'Revisão administrativa do lançamento.'],
    cuidado: ['Bem de família NÃO protege contra IPTU do próprio imóvel (Lei 8.009/90, art. 3º, IV).']
  },
  {
    id: 'negativ', titulo: 'Nome negativado e cobranças abusivas', sub: 'Serasa, SPC, protesto e assédio de cobrança',
    chega: ['"Meu nome está sujo por uma dívida que já paguei."', '"Ligam o dia todo cobrando."'],
    prazos: ['Inscrição no cadastro: no máximo 5 anos (CDC, art. 43, § 1º; STJ, Súmula 323).'],
    defesas: [
      { t: 'Inscrição sem notificação prévia', f: 'consolidada', fund: 'STJ, Súmula 359 (cabe ao órgão mantenedor notificar).', quando: 'Cliente não recebeu aviso antes da negativação.', prova: 'Consulta ao cadastro.' },
      { t: 'Negativação indevida: dano moral', f: 'consolidada', fund: 'CDC, art. 14; dano presumido. Súmula 385: se já havia outra inscrição legítima, não há dano moral.', quando: 'Dívida paga, inexistente ou fraude.', prova: 'Comprovantes, consulta ao cadastro.' },
      { t: 'Cobrança vexatória ou abusiva', f: 'boa', fund: 'CDC, arts. 42 e 71.', quando: 'Ligações excessivas, contato com terceiros, ameaças.', prova: 'Prints, gravações.' }
    ],
    acoes: [{ t: 'Ação declaratória de inexistência de débito com dano moral e tutela para retirar o nome', fund: 'CDC; CPC, art. 300.', quando: 'Negativação indevida.' }],
    extra: ['Pedir a baixa ao credor e ao cadastro com prova do pagamento.', 'Registrato do Banco Central para mapear dívidas e contas em nome do cliente.']
  },
  {
    id: 'particular', titulo: 'Dívida com particular ou agiota', sub: 'Juros acima do permitido e garantias disfarçadas',
    chega: ['"Peguei dinheiro com um conhecido e passei o imóvel no nome dele."'],
    prazos: [],
    defesas: [
      { t: 'Juros acima do limite legal (usura)', f: 'boa', fund: 'Decreto 22.626/33; CC, arts. 406 e 591; MP 2.172-32/2001, art. 3º (inversão do ônus da prova).', quando: 'Empréstimo entre particulares com juros acima do permitido.', prova: 'Mensagens, comprovantes de transferências.' },
      { t: 'Venda simulada como garantia (pacto comissório)', f: 'boa', fund: 'CC, arts. 167 (simulação) e 1.428 (pacto comissório vedado).', quando: 'Escritura de compra e venda para garantir empréstimo.', prova: 'Mensagens, valor muito abaixo do mercado, permanência na posse.' }
    ],
    acoes: [{ t: 'Ação declaratória de nulidade com revisão dos juros', fund: 'CC; Decreto 22.626/33.', quando: 'Garantia disfarçada ou juros extorsivos.' }],
    extra: ['Reunir provas de pagamentos antes de qualquer contato.', 'Avaliar com cuidado: usura pode ser crime (Lei 1.521/51, art. 4º); orientar o cliente sobre segurança.']
  },
  {
    id: 'bets', titulo: 'Dívidas por apostas (bets) e ludopatia', sub: 'Endividamento causado por jogo compulsivo',
    chega: ['"Meu marido perdeu tudo em aposta e pegou empréstimos."'],
    prazos: [],
    defesas: [
      { t: 'Responsabilidade da operadora por falha no dever de jogo responsável', f: 'caso', fund: 'Lei 14.790/2023; Portaria SPA/MF 1.231/2024; CDC, art. 14. Decisões nos dois sentidos; ver o ebook FCE de ludopatia.', quando: 'Perdas após autoexclusão, sinais claros de compulsão ou apostas de menor.', prova: 'Extratos, histórico de apostas, laudo médico.' },
      { t: 'Curatela do pródigo ou tomada de decisão apoiada', f: 'caso', fund: 'CC, arts. 4º, IV, 1.767 e 1.783-A.', quando: 'Proteger o patrimônio da família.', prova: 'Laudo, histórico de gastos.' }
    ],
    acoes: [{ t: 'Ação de restituição e indenização contra a operadora', fund: 'CDC; regulação da SPA/MF.', quando: 'Perdas relevantes com prova da compulsão.' }],
    extra: ['Autoexclusão na plataforma centralizada do governo.', 'Encaminhar para tratamento (CAPS, SUS).', 'Repactuação das dívidas de consumo por superendividamento.'],
    cuidado: ['A MP 1.394/2026 proibiu as apostas de quota fixa e está suspensa/questionada no STF: conferir a situação antes de peticionar.']
  }
];

const css = `.tz-top{display:grid;gap:10px;margin-top:12px}.tz-chips{display:flex;gap:6px;flex-wrap:wrap}.tz-chips button{border:1px solid var(--line-2);background:var(--surface);border-radius:999px;padding:7px 12px;font:600 13px/1 inherit;cursor:pointer;color:var(--txt)}
.tz-chips button.on{background:var(--txt);color:var(--surface);border-color:var(--txt)}
.tz-cab{display:grid;gap:4px}.tz-cab h2{margin:0;font:600 22px/1.2 var(--serif)}.tz-sec{display:grid;gap:8px;margin-top:16px}.tz-sec>h3{margin:0;font-size:12px;letter-spacing:.07em;text-transform:uppercase;color:var(--gold)}
.tz-it{border:1px solid var(--line-2);border-radius:12px;background:var(--surface);padding:12px 14px;display:grid;gap:6px}.tz-it .tl{display:flex;gap:8px;align-items:baseline;justify-content:space-between;flex-wrap:wrap}.tz-it b{font-size:15px}
.tz-it p{margin:0;font-size:14px;line-height:1.5}.tz-it p span{color:var(--mut);font-weight:600}.tz-f{font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:999px;white-space:nowrap}
.tz-f.consolidada{background:var(--ok-soft);color:var(--ok)}.tz-f.boa{background:var(--info-soft);color:var(--info)}.tz-f.caso{background:var(--warn-soft);color:var(--warn)}.tz-f.fraca{background:var(--bad-soft);color:var(--bad)}
.tz-l{margin:0;padding-left:20px;display:grid;gap:6px;font-size:14px;line-height:1.5}.tz-chega{font-style:italic;color:var(--mut)}.tz-cop{justify-self:start}.tz-leg{display:flex;gap:8px;flex-wrap:wrap;font-size:12.5px;color:var(--mut)}
.tz-res{display:grid;gap:8px}.tz-res .tz-it small{color:var(--mut);font-weight:600}`;
function estilo() { if (document.getElementById('tz-css')) return; const s = document.createElement('style'); s.id = 'tz-css'; s.textContent = css; document.head.appendChild(s); }
const fbadge = (f) => '<span class="tz-f ' + f + '" title="' + esc(FORCA[f][1]) + '">' + FORCA[f][0] + '</span>';
function textoTese(x, s) { return x.t + (s ? ' (' + s.titulo + ')' : '') + '\nFundamento: ' + (x.fund || '') + (x.quando ? '\nQuando usar: ' + x.quando : '') + (x.prova && x.prova !== '—' ? '\nProva: ' + x.prova : ''); }
function cardTese(x, i, s, tipo) {
  return '<div class="tz-it"><div class="tl"><b>' + esc(x.t) + '</b>' + (x.f ? fbadge(x.f) : '') + '</div>' +
    '<p><span>Fundamento:</span> ' + esc(x.fund || '') + '</p>' + (x.quando ? '<p><span>Quando usar:</span> ' + esc(x.quando) + '</p>' : '') + (x.prova && x.prova !== '—' ? '<p><span>Prova:</span> ' + esc(x.prova) + '</p>' : '') +
    '<button class="btn sm fant tz-cop" type="button" data-tzcop="' + s.id + '|' + tipo + '|' + i + '">Copiar</button></div>';
}
function renderSit(s) {
  let h = '<div class="tz-cab" style="margin-top:16px"><span class="dg-eye" style="color:var(--gold)">Situação</span><h2>' + esc(s.titulo) + '</h2><div class="pq mut">' + esc(s.sub) + '</div></div>';
  if (s.alerta) h += '<div class="card" style="margin-top:10px;padding:10px 14px;border-left:3px solid var(--bad)"><b>' + esc(s.alerta) + '</b></div>';
  if (s.chega && s.chega.length) h += '<div class="tz-sec"><h3>Como chega ao escritório</h3><div class="tz-chega pq">' + s.chega.map(esc).join(' · ') + '</div></div>';
  if (s.prazos && s.prazos.length) h += '<div class="tz-sec"><h3>Prazos que mandam no caso</h3><ul class="tz-l">' + s.prazos.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>';
  h += '<div class="tz-sec"><h3>Teses de defesa</h3>' + s.defesas.map((x, i) => cardTese(x, i, s, 'd')).join('') + '</div>';
  if (s.acoes && s.acoes.length) h += '<div class="tz-sec"><h3>Ações que podemos ajuizar</h3>' + s.acoes.map((x, i) => cardTese(x, i, s, 'a')).join('') + '</div>';
  if (s.extra && s.extra.length) h += '<div class="tz-sec"><h3>Estratégias extrajudiciais</h3><ul class="tz-l">' + s.extra.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>';
  if (s.cuidado && s.cuidado.length) h += '<div class="tz-sec"><h3>Cuidado</h3><ul class="tz-l">' + s.cuidado.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>';
  return h;
}
function busca(q) {
  const n = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const qq = n(q); const out = [];
  SIT.forEach((s) => [['d', s.defesas], ['a', s.acoes || []]].forEach(([tp, L]) => L.forEach((x, i) => { if (n([x.t, x.fund, x.quando, x.prova].join(' ')).includes(qq)) out.push({ s, x, i, tp }); })));
  return out;
}
VIEWS.teses = async () => {
  estilo(); titulo('Teses');
  S.tzSit = S.tzSit || 'af'; S.tzQ = S.tzQ || '';
  const desenha = () => {
    const q = S.tzQ.trim();
    let h = '<div class="tz-top"><label class="busca">' + ic('busca', 's') + '<input id="tzQ" placeholder="Buscar tese, lei ou súmula (ex.: preço vil, Súmula 472, margem)" value="' + esc(S.tzQ) + '" autocomplete="off"></label>' +
      '<div class="tz-chips" role="tablist">' + SIT.map((s) => '<button type="button" data-tzs="' + s.id + '" class="' + (!q && S.tzSit === s.id ? 'on' : '') + '">' + esc(s.titulo) + '</button>').join('') + '</div>' +
      '<div class="tz-leg">' + Object.keys(FORCA).map((k) => fbadge(k) + ' ' + esc(FORCA[k][1])).join(' · ') + '</div>' +
      '<p class="pq mut" style="margin:0">Material interno de trabalho, atualizado até 16/11/2026. Confira a redação da lei e a jurisprudência atual antes de peticionar.</p></div>';
    if (q.length >= 2) { const r = busca(q); h += '<div class="tz-sec"><h3>' + r.length + ' resultado(s)</h3><div class="tz-res">' + (r.length ? r.map((o) => '<div><small class="pq mut">' + esc(o.s.titulo) + '</small>' + cardTese(o.x, o.i, o.s, o.tp) + '</div>').join('') : '<div class="card"><div class="vazio">Nada encontrado.</div></div>') + '</div></div>'; }
    else h += renderSit(SIT.find((s) => s.id === S.tzSit) || SIT[0]);
    $('#cont').innerHTML = h;
    const inp = $('#tzQ'); inp.oninput = () => { S.tzQ = inp.value; const pos = inp.selectionStart; desenha(); const i2 = $('#tzQ'); i2.focus(); try { i2.setSelectionRange(pos, pos); } catch (e) {} };
    $$('[data-tzs]').forEach((b) => b.onclick = () => { S.tzSit = b.dataset.tzs; S.tzQ = ''; desenha(); window.scrollTo(0, 0); });
    $$('[data-tzcop]').forEach((b) => b.onclick = async () => { const [sid, tp, i] = b.dataset.tzcop.split('|'); const s = SIT.find((x) => x.id === sid); const x = (tp === 'd' ? s.defesas : s.acoes)[Number(i)];
      try { await navigator.clipboard.writeText(textoTese(x, s)); toast('Tese copiada.'); } catch (e) { toast('Não consegui copiar.', true); } });
  };
  desenha();
};
window.TESES_FCE = SIT;
})();
