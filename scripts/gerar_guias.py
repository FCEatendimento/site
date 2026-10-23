import json, re, os, html
import glob
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/guias/*.json')],key=lambda g:(g.get('ordem',999),g['slug']))
IDX=open(SITE+'/index.html',encoding='utf-8').read()
style=IDX[IDX.index('<style>'):IDX.index('</style>')+8]
header=IDX[IDX.index('<header class="top">'):IDX.index('</header>')+9]
tail=IDX[IDX.index('<footer>'):]
# --- Menu da área do investidor ---
INV_SLUGS=['comprar-imovel-em-leilao-checklist-do-edital','riscos-de-comprar-imovel-em-leilao','iptu-e-condominio-imovel-arrematado-quem-paga','arrematei-imovel-ocupado-desocupacao','arrematacao-carta-registro-matricula','antigo-dono-pede-anulacao-do-leilao','arrematei-e-nao-consigo-pagar-o-lance']  # leilao-judicial-ou-extrajudicial-diferencas passou à área do devedor (penhora e leilão judicial)
GI=[g for s in INV_SLUGS for g in G if g['slug']==s]
_nav0=header[header.index('<nav aria-label="Seções">'):header.index('<button class="menu-btn"')]
_INV_NAV=('<nav aria-label="Área do investidor">\n'
  '      <a href="/investidor/#analise">Análise pré-lance</a>\n'
  '      <a href="/investidor/calculadora/">Calculadora do lance</a>\n'
  '      <a href="/investidor/guia/">Guia gratuito</a>\n'
  '      <a href="/investidor/#guias">Guias</a>\n'
  '      <a href="/investidor/#perguntas">Perguntas</a>\n      ')
_i=header.index('<ul class="wrap">'); _pan0=header[_i:header.index('</ul>',_i)+5]
_INV_PAN=('<ul class="wrap">\n'
  '      <li><a href="/investidor/">Início da área do investidor</a></li>\n'
  '      <li><a href="/investidor/#analise">Análise pré-lance</a></li>\n'
  '      <li><a href="/investidor/#assessoria">Assessoria na arrematação</a></li>\n'
  '      <li><a href="/investidor/#como-funciona">Como funciona</a></li>\n'
  '      <li><a href="/investidor/#o-que-conferimos">O que conferimos antes do lance</a></li>\n'
  '      <li><a href="/investidor/calculadora/">Calculadora do lance máximo</a></li>\n'
  '      <li><a href="/investidor/guia/">Guia gratuito: 20 pontos antes do lance</a></li>\n'
  +''.join(f'      <li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>\n' for g in GI)+
  '      <li><a href="/investidor/#perguntas">Perguntas frequentes</a></li>\n'
  '      <li><a href="/sobre/">Sobre o advogado</a></li>\n'
  '      <li><a href="/">Tem imóvel em risco? Área do devedor</a></li>\n    </ul>')
header_inv=(header.replace(_nav0,_INV_NAV).replace(_pan0,_INV_PAN)
  .replace('<span class="brand-tag">Dívidas, garantias<br>e leilões de imóveis</span>','<span class="brand-tag">Para<br>investidores</span>')
  .replace('href="#inicio" aria-label="FCE Advogados, início"','href="/investidor/" aria-label="FCE Advogados, área do investidor"'))
_NAVCSS=IDX[IDX.index('.top nav a[aria-current="page"]'):IDX.index('.top nav a{white-space:nowrap}')]
ART_CSS='''<style>
.art{padding-block:clamp(2rem,5vw,3.5rem)}
.art .wrap{max-width:calc(var(--read) + 4rem)}
.art h1{text-transform:none;font-weight:700;font-size:clamp(1.7rem,4vw,2.4rem);margin:.6rem 0 1rem}
.art .lead{font-size:1.15rem;color:var(--muted);margin-bottom:2rem}
.art h2{font-size:clamp(1.3rem,2.6vw,1.6rem);margin:2.2rem 0 .8rem}
.art p,.art li{line-height:1.65}
.art p{margin:0 0 1rem}
.art ol,.art ul{padding-left:1.3rem;margin:0 0 1rem;display:grid;gap:.45rem}
.crumb{font-size:.85rem;color:var(--muted)}
.crumb a{color:inherit}
.rel{border-top:1px solid var(--line);margin-top:2.5rem;padding-top:1.5rem}
.rel ul{list-style:none;padding:0}
.rel a{color:var(--ink);font-weight:600}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem}
.cards a{display:grid;gap:.5rem;padding:1.25rem;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);text-decoration:none}
.cards a:hover{border-color:var(--ink)}
.cards span{color:var(--muted);font-size:.95rem}
.cards time{font:500 .78rem var(--mono);color:var(--muted);letter-spacing:.06em;text-transform:uppercase}
.eb-grid{display:grid;grid-template-columns:1.2fr 1fr;column-gap:clamp(1.5rem,4vw,3rem);align-items:start}.eb-int{grid-column:1;grid-row:1}.eb-det{grid-column:1;grid-row:2}.eb-form{grid-column:2;grid-row:1/span 2}
.eb .wrap{max-width:var(--wrap)}
.eb-capa{width:min(220px,60%);height:auto;border-radius:4px;box-shadow:0 10px 30px rgba(0,0,0,.2);margin:.5rem 0 1rem}
.eb-form{position:sticky;top:5.5rem;display:grid;gap:.9rem;padding:clamp(1.25rem,3vw,1.75rem);border:1px solid var(--line);border-top:4px solid var(--accent);border-radius:8px;background:var(--surface)}
.eb-form h2{margin:0 0 .25rem;font-size:1.35rem}
.eb-form label{display:grid;gap:.35rem;font-weight:600;font-size:.95rem}
.eb-form label span{font-weight:400;color:var(--muted)}
.eb-form input,.eb-form select{font:inherit;font-weight:400;padding:.75rem .85rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);width:100%}
.eb-form input:focus,.eb-form select:focus{outline:2px solid var(--accent);outline-offset:1px}
.eb-form .eb-ok{display:flex;gap:.6rem;align-items:flex-start;font-weight:400;font-size:.88rem;line-height:1.45}
.eb-form .eb-ok input{width:1.1rem;height:1.1rem;flex:none;margin-top:.15rem}
.eb-form .eb-ok span{color:var(--ink)}
.eb-form .btn{justify-content:center}
.eb-nota{font-size:.82rem;color:var(--muted);margin:0}
.eb-erro{background:var(--prazo-soft);color:var(--prazo);padding:.7rem .85rem;border-radius:6px;margin:0;font-size:.92rem}
.eb-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
@media (max-width:820px){.eb-grid{grid-template-columns:1fr;row-gap:1.5rem}.eb-int,.eb-det,.eb-form{grid-column:1;grid-row:auto}.eb-form{order:2}.eb-det{order:3}.eb-form{position:static}}
.eb-box{margin-top:2rem;padding:1.25rem;border:1px solid var(--line);border-left:4px solid var(--accent);border-radius:8px;background:var(--surface)}
.eb-box p{margin:.3rem 0 .9rem;color:var(--muted)}
.art table{width:100%;border-collapse:collapse;margin:0 0 1.2rem;font-size:.95rem}.art th,.art td{text-align:left;padding:.55rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}.art th{font-family:var(--display);font-weight:700}
.fases{margin:0 0 1.5rem;padding:1rem 1.25rem;border:1px solid var(--line);border-radius:8px;background:var(--surface)}.fases p{margin:0 0 .5rem;font-weight:600}.fases ol{margin:0;padding-left:1.2rem;gap:.3rem}.fases a{color:var(--ink)}.fases li.atual a{font-weight:700;text-decoration:none;border-bottom:2px solid var(--accent)}
.revisado{font-size:.85rem;color:var(--muted);margin:-1.2rem 0 1.5rem}
.dl{display:grid;gap:1rem;justify-items:start}
.vei-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.5rem,4vw,3rem);margin:1rem 0 2rem}
@media (max-width:820px){.vei-grid{grid-template-columns:1fr}}
.vei-fases{list-style:none;padding:0;counter-reset:f;display:grid;gap:.9rem}
.vei-fases li{counter-increment:f;position:relative;padding-left:2.6rem}
.vei-fases li::before{content:counter(f);position:absolute;left:0;top:0;width:1.8rem;height:1.8rem;border-radius:50%;background:var(--ink);color:var(--bg);font:700 .95rem var(--display);display:flex;align-items:center;justify-content:center}
.vei-fases b{display:block;font-family:var(--display)}.vei-fases span{color:var(--muted)}
.vei-faq details{border-bottom:1px solid var(--line);padding:.9rem 0}.vei-faq summary{font-weight:600;cursor:pointer}.vei-faq p{margin:.6rem 0 0;color:var(--muted)}
.ct-linha{display:grid;grid-template-columns:1fr 6.5rem;gap:.75rem}
.eb-form textarea{font:inherit;font-weight:400;padding:.75rem .85rem;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);width:100%;resize:vertical}
.eb-form textarea:focus{outline:2px solid var(--accent);outline-offset:1px}
.sobre-foto{margin:0 0 1.5rem}.sobre-foto img{width:min(100%,18rem);height:auto;border-radius:8px;border:1px solid var(--line);display:block}
.eb-form label[hidden]{display:none}
.guia-cat{margin-top:2.5rem;padding-block:0}.guia-cat>p{color:var(--muted);margin:-.4rem 0 1rem}
.guia-sec{margin-top:3rem;padding:1.5rem 0 0;border-top:1px solid var(--line)}
.art .cards a.pg{border-left:3px solid var(--accent)}
.frase-fabio{margin:1.4rem 0 1.8rem;padding:1rem 1.2rem;border-left:4px solid var(--accent);background:var(--surface);border-radius:0 8px 8px 0}
.frase-fabio p{font:600 1.15rem/1.45 var(--display);margin:0 0 .5rem!important;color:var(--ink)}
.frase-fabio footer{font-size:.9rem;color:var(--muted);border:0;padding:0;margin:0;background:none;display:block}
.caso{padding-block:clamp(2rem,5vw,3rem)}
.caso-box{max-width:calc(var(--read) + 4rem);margin-inline:auto;padding:clamp(1.4rem,4vw,2.2rem);border-radius:10px;background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(0,0,0,.10)),repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 1px,rgba(0,0,0,.04) 1px 2px,transparent 2px 4px),#5A626B;color:#fff;border-top:4px solid #D1AE6C}
.caso-box h2{margin:0 0 .9rem;font-size:clamp(1.35rem,3vw,1.75rem);color:#fff;text-transform:none}
.caso-box p,.caso-box li{color:#E6E9EE;line-height:1.6}
.caso-box p{margin:0 0 .9rem}
.caso-box .caso-dest{font-family:var(--display);font-weight:700;color:#E6CF9C;font-size:1.08rem}
.caso-box ul{margin:.2rem 0 1rem;padding-left:1.2rem;display:grid;gap:.35rem}
.caso-box .caso-acoes{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem 1.2rem;margin:1.2rem 0 0}
.caso-box .btn-primary{background:#D1AE6C;color:#1C2025;border-color:#D1AE6C}
.caso-box .caso-sec{color:#E6E9EE;font-size:.95rem;text-decoration:underline;text-underline-offset:3px}
.caso-box a:focus-visible{outline:3px solid #D1AE6C;outline-offset:3px}
</style>'''
def fix(s, tag):
    s=s.replace('href="#inicio"','href="/"')
    s=re.sub(r'href="#([a-z]+)"', r'href="/#\1"', s)
    s=s.replace('p=home', 'p='+tag)
    return s
import datetime as _dt
from zoneinfo import ZoneInfo as _ZI
_MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
_d=_dt.datetime.now(_ZI('America/Sao_Paulo'))
MES_ATUAL=_MESES[_d.month-1]+'/'+str(_d.year)  # 'Atualizado em' dos guias em PDF (ver gerar_ebooks.py)

def _marca(h, path):
    u=path[:-len('index.html')] if path.endswith('index.html') else path
    return h.replace(f'<a href="{u}">', f'<a href="{u}" aria-current="page">', 1)

# Bloco final de conversão (aprovado pelo Dr. Fábio em 17/10/2026): guias e páginas de serviço
_CASO_DET={
 'padrao':'o que está escrito no seu contrato, a data de cada intimação, se o credor cumpriu cada etapa como a lei exige e o que ainda cabe fazer no prazo que resta',
 'leilao':'a data de cada intimação e a do edital, se o credor cumpriu cada etapa como a lei exige e o que ainda cabe fazer no prazo que resta. É isso que mostra se o leilão pode ser discutido',
 'fianca':'o que você assinou, o que diz o contrato de locação e o que ainda cabe fazer no prazo que resta',
 'condominio':'o cálculo cobrado, cada etapa da execução e o que ainda cabe fazer no prazo que resta',
 'fiscal':'a certidão de dívida ativa, as datas e cada etapa da execução fiscal',
 'bancaria':'o contrato, as garantias e a forma como a cobrança foi feita',
 'veiculo':'a notificação, o contrato e as datas da apreensão',
 'garantia':'o que está escrito no contrato e nos aditivos, a garantia que você deu e se o credor cumpriu cada etapa como a lei exige',
 'penhora':'a data da citação e da penhora, a avaliação do bem e cada etapa da execução',
}
_GCAT={}
for _g in G: _GCAT[_g['slug']]=str(_g.get('categoria') or _g.get('eyebrow') or '').split('·')[0].strip().lower()
def _caso_tema(path):
    s=path.lower()
    for k,t in (('vou-atrasar','padrao'),('renegociar','padrao'),('condominio','condominio'),('iptu','fiscal'),('itr','fiscal'),('execucao-fiscal','fiscal'),('veiculo','veiculo'),('busca-e-apreensao','veiculo'),('sisbajud','bancaria'),('bancari','bancaria'),('cedula-de-credito','bancaria'),('fiador','fianca'),('fianca','fianca'),('avalista','garantia'),('suspensao-de-leilao','leilao'),('/leilao/','leilao'),('leilao-de-imoveis','leilao'),('penhor','penhora'),('execucao','penhora'),('imovel-em-garantia','garantia'),('garantia','garantia'),('hipoteca','garantia'),('parcelas-em-dia','padrao')):
        if k in s: return t
    m=re.match(r'/guia/([^/]+)/',path)
    if m:
        c=_GCAT.get(m.group(1),'')
        if 'garantias' in c: return 'garantia'
        if 'fiança' in c or 'fianca' in c: return 'fianca'
        if 'penhora' in c: return 'penhora'
        if c in ('financiamento imobiliário','alienação fiduciária','consolidação da propriedade','leilão extrajudicial','direitos após o leilão'): return 'leilao'
    return 'padrao'
_CASO_PREF=('/guia/','/imovel-em-garantia/','/penhora-de-imovel/','/divida-bancaria/','/parcelas-em-dia/','/leilao/','/suspensao-de-leilao/','/veiculo/','/leilao-de-imoveis/')
def _caso_bloco(path, tag):
    if path=='/guia/index.html' or not path.startswith(_CASO_PREF): return ''
    m=re.match(r'/guia/([^/]+)/',path)
    if m and m.group(1) in INV_SLUGS: return ''
    p=('guia-'+m.group(1)[:40]) if m else tag
    det=_CASO_DET[_caso_tema(path)]
    return f'''  <section class="caso" aria-labelledby="caso-t">
    <div class="wrap">
      <div class="caso-box">
        <h2 id="caso-t">A lei é o ponto de partida. O que decide é o seu caso.</h2>
        <p>Agora você conhece as regras gerais. Mas o desfecho de um caso depende de detalhes que nenhum guia mostra: {det}.</p>
        <p class="caso-dest">Advocacia, para nós, é buscar a saída e pensar fora da caixa — não só repetir o que está na lei.</p>
        <p>Só a análise dos seus documentos mostra:</p>
        <ul><li>se cada passo da cobrança foi feito do jeito certo;</li><li>quanto tempo você realmente tem para cada providência;</li><li>quais caminhos fazem sentido para você: negociar, discutir, ganhar tempo ou se organizar.</li></ul>
        <p>Na consulta, o Dr. Fábio lê os seus documentos e mostra o que existe de concreto no seu caso — inclusive o que não vale a pena tentar.</p>
        <p class="caso-acoes"><a class="btn btn-primary wa" href="https://emerim.app.n8n.cloud/webhook/fce-wa?c=site&amp;p={p}">Quero entender o meu caso →</a><a class="caso-sec" href="/#triagem">ou salve sua análise</a></p>
      </div>
    </div>
  </section>'''
def _final(tag):
    return f'''  <section class="final">
    <div class="wrap">
      <div class="box">
        <div>
          <h2>Conte o que está acontecendo</h2>
          <p>Pelo WhatsApp, a qualquer hora. {'Se tiver a notificação, o auto de apreensão ou o contrato, já pode enviar.' if tag=='veiculo' else ('Se tiver o contrato, os aditivos ou a matrícula, já pode enviar.' if tag.startswith('empresario') else ('Se tiver o edital ou o link do leilão, já pode enviar.' if tag.startswith('investidor') else 'Se tiver a intimação, a matrícula ou o edital, já pode enviar.'))}</p>
        </div>
        <a class="btn btn-primary wa" href="https://emerim.app.n8n.cloud/webhook/fce-wa?c=site&amp;p={tag}">Conversar pelo WhatsApp</a>
      </div>
    </div>
  </section>'''
TEMA_JS='''<script>(function(){try{var t=localStorage.getItem("tema");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>'''
_BC_NOMES={'/guia/':'Guias','/blog/':'Blog','/leilao-de-imoveis/':'Atendimento por cidade','/imovel-em-garantia/':'Imóvel em garantia','/penhora-de-imovel/':'Penhora de imóvel','/divida-bancaria/':'Dívida bancária','/veiculo/':'Veículo','/investidor/':'Investidor','/ferramentas/':'Ferramentas'}
def _addbc(ld, path, title):
    # SEO: toda página indexável recebe BreadcrumbList (se ainda não tiver).
    if 'BreadcrumbList' in json.dumps(ld): return ld
    u=path[:-len('index.html')] if path.endswith('index.html') else path
    parts=[x for x in u.strip('/').split('/') if x]
    if not parts: return ld
    itens=[]; acc=''
    for i,x in enumerate(parts):
        acc+='/'+x
        if i==len(parts)-1: nm=re.sub(r'\s*[|·]\s*FCE Advogados$','',title)
        else: nm=_BC_NOMES.get(acc+'/', x.replace('-',' ').capitalize())
        itens.append((nm,'https://fceadvogados.com.br'+acc+'/'))
    bc={"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":uu} for i,(n,uu) in enumerate([("Início","https://fceadvogados.com.br/")]+itens)]}
    if isinstance(ld,dict) and '@graph' in ld:
        return {**ld,"@graph":list(ld["@graph"])+[bc]}
    if isinstance(ld,dict):
        base={k:v for k,v in ld.items() if k!='@context'}
        return {"@context":"https://schema.org","@graph":[base,bc]}
    return ld
def page(path, title, desc, canon, body, ld, tag, robots=''):
    body=body.replace('{{ATUALIZADO}}', MES_ATUAL)
    # SEO: títulos acima de ~62 caracteres são cortados pelo Google; nesses casos a marca sai do <title> (o Google já mostra o nome do site).
    for _suf in (' | FCE Advogados',' · FCE Advogados'):
        if len(title)>62 and title.endswith(_suf): title=title[:-len(_suf)]
    if 'noindex' not in robots and path not in ('/index.html','/404.html'): ld=_addbc(ld, path, title)
    h=f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
{TEMA_JS}
<meta name="description" content="{html.escape(desc)}">
<link rel="icon" href="/img/logo.svg">
<link rel="canonical" href="{canon}">{robots}
<meta property="og:type" content="article">
<meta property="og:site_name" content="FCE Advogados">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="https://fceadvogados.com.br/img/og-fce.jpg">
<meta property="og:locale" content="pt_BR">
<script type="application/ld+json">{json.dumps(ld,ensure_ascii=False)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" media="print" onload="this.media='all'" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=Archivo:wght@800&display=swap"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=Inter:wght@400;500;600;700&family=Archivo:wght@800&display=swap"></noscript>
{style}
{ART_CSS}
<script src="/js/medicao.js" defer></script>
</head>
<body>

{_marca(fix(header_inv if tag.startswith('investidor') else header,tag),path)}

<main id="inicio">
{body}
{(_caso_bloco(path,tag) or _final(tag))}
</main>

{fix(tail,tag)}
'''
    os.makedirs(os.path.dirname(SITE+path), exist_ok=True)
    open(SITE+path,'w',encoding='utf-8').write(h)
ORG={"@id":"https://fceadvogados.com.br/#escritorio"}
AUT={"@type":"Person","@id":"https://fceadvogados.com.br/sobre/#fabio","name":"Fábio de Castro Emerim","jobTitle":"Advogado","identifier":"OAB/RS 88.912","url":"https://fceadvogados.com.br/sobre/"}
INV_BOX='<aside class="eb-box"><p class="eyebrow">Antes do lance</p><strong>Faça a conta e confira os riscos do imóvel</strong><p>A calculadora mostra até quanto vale dar de lance para ter o retorno que você quer. O guia gratuito traz os 20 pontos para conferir no edital, na matrícula e no processo.</p><p style="display:flex;flex-wrap:wrap;gap:.6rem;margin:0"><a class="btn btn-primary" href="/investidor/calculadora/">Calcular o lance máximo</a><a class="btn btn-ghost" href="/investidor/guia/?o=TAG">Baixar o guia gratuito</a><a class="btn btn-ghost" href="/investidor/#analise">Análise pré-lance</a></p></aside>'
DEV_BOX='<aside class="eb-box"><p class="eyebrow">Imóvel em risco</p><strong>Veja em que fase está o seu caso</strong><p>A linha do tempo mostra a fase atual do imóvel financiado e o que costuma vir depois. O simulador estima o patrimônio em risco, e o guia em PDF, sem cadastro, traz o checklist de documentos.</p><p style="display:flex;flex-wrap:wrap;gap:.6rem;margin:0"><a class="btn btn-primary" href="/ferramentas/linha-do-tempo/">Ver a linha do tempo</a><a class="btn btn-ghost" href="/calculadora/">Simular o patrimônio em risco</a><a class="btn btn-ghost" href="/ebook/fce-guia-parcelas-atrasadas.pdf" data-guia="TAG">Baixar o guia em PDF</a></p></aside>'
CTA_B='<aside class="eb-box"><p class="eyebrow">Conversa inicial</p><strong>Quer entender a sua situação?</strong><p>Descreva o caso pelo formulário de contato ou pelo WhatsApp. O advogado responsável identifica a fase e os prazos e explica os caminhos possíveis.</p><p style="display:flex;flex-wrap:wrap;gap:.6rem;margin:0"><a class="btn btn-primary" href="/contato/?o=TAG">Explicar minha situação</a><a class="btn btn-ghost wa" href="https://emerim.app.n8n.cloud/webhook/fce-wa?c=site&amp;p=home">Conversar pelo WhatsApp</a></p></aside>'
ASSINATURA_B='<p class="crumb" style="margin-top:2rem">Por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656). Conteúdo informativo, conforme o Código de Ética e Disciplina da OAB e o Provimento 205/2021; não substitui a análise individual do caso e não representa promessa de resultado.</p>'
REVISAO_B='2026-10-16'
REVISAO_PAG={'/divida-bancaria/':'2026-10-17','/divida-bancaria/execucao/':'2026-10-17','/parcelas-em-dia/':'2026-10-17','/penhora-de-imovel/divida-de-condominio/':'2026-10-17','/penhora-de-imovel/iptu/':'2026-10-17','/penhora-de-imovel/itr/':'2026-10-17','/penhora-de-imovel/':'2026-10-17'}
# Páginas de serviço e problemas jurídicos (núcleos B e penhora): (caminho, arquivo, title, description, nome, pai)
PAGINAS_B=[
 ('/imovel-em-garantia/','garantia/imovel-em-garantia.html','Imóvel dado em garantia de dívida: riscos e direitos | FCE Advogados','Imóvel em garantia de empréstimo, fiança ou aval: o que pode acontecer se a dívida não for paga, a proteção do bem de família e o que pode ser analisado.','Imóvel dado em garantia de dívida',None),
 ('/imovel-em-garantia/divida-da-empresa/','garantia/divida-da-empresa.html','Casa em garantia de dívida da empresa: posso perder? | FCE Advogados','Deu a casa em garantia de empréstimo da empresa? Como a cobrança funciona na alienação fiduciária e na hipoteca, o bem de família e a recuperação judicial.','Casa em garantia de dívida da empresa','/imovel-em-garantia/'),
 ('/imovel-em-garantia/fiador/','garantia/fiador.html','Fiador pode perder o único imóvel? O que diz a lei | FCE Advogados','Fiador de aluguel residencial ou comercial pode ter o imóvel penhorado? A Lei 8.009/90, o Tema 1.127 do STF, a exoneração da fiança e o que conferir.','Fiador pode perder o único imóvel?','/imovel-em-garantia/'),
 ('/imovel-em-garantia/bem-de-familia/','garantia/bem-de-familia.html','Bem de família: quando o imóvel pode ser penhorado | FCE Advogados','A Lei 8.009/90 protege o imóvel residencial, com exceções: financiamento, IPTU, condomínio, hipoteca e fiança locatícia. Entenda cada uma e o que o STJ decide.','Bem de família','/imovel-em-garantia/'),
 ('/imovel-em-garantia/execucao-contra-garantidor/','garantia/execucao-contra-garantidor.html','Execução contra fiador, avalista ou garantidor | FCE Advogados','Foi citado como fiador, avalista ou garantidor de uma dívida? Prazos, embargos, parcelamento, penhora de bens e o que pode ser discutido na execução.','Execução contra fiador, avalista ou garantidor','/imovel-em-garantia/'),
 ('/imovel-em-garantia/responsabilidade-dos-socios/','garantia/responsabilidade-dos-socios.html','Sócio responde com bens pessoais por dívida da empresa? | FCE Advogados','Quando o patrimônio do sócio pode ser atingido por dívida da empresa: garantias assinadas, desconsideração da personalidade jurídica e o que a lei exige.','Responsabilidade dos sócios por dívida da empresa','/imovel-em-garantia/'),
 ('/imovel-em-garantia/antes-de-assinar/','garantia/antes-de-assinar.html','Antes de dar o imóvel em garantia: o que conferir | FCE Advogados','Vai oferecer a casa em garantia de empréstimo ou de dívida da empresa? Os pontos do contrato que merecem atenção antes de assinar.','Antes de oferecer o imóvel em garantia','/imovel-em-garantia/'),
 ('/penhora-de-imovel/','penhora.html','Imóvel penhorado por dívida: o que fazer | FCE Advogados','Seu imóvel foi penhorado em processo judicial? Como funcionam a penhora, a avaliação e o leilão judicial, os prazos e o que pode ser analisado.','Imóvel penhorado por dívida',None),
 ('/penhora-de-imovel/divida-de-condominio/','garantia/condominio.html','Dívida de condomínio: o imóvel pode ser penhorado? | FCE Advogados','Condomínio atrasado pode levar à penhora até do único imóvel. Como funciona a execução, prazos, prescrição de 5 anos, multa de 2%, parcelamento e acordo.','Dívida de condomínio e penhora do imóvel','/penhora-de-imovel/'),
 ('/penhora-de-imovel/iptu/','garantia/iptu.html','Dívida de IPTU: execução fiscal e penhora do imóvel | FCE Advogados','IPTU atrasado pode levar à penhora do imóvel, mesmo o de moradia. Execução fiscal, prescrição, embargos, exceção de pré-executividade e parcelamento.','Dívida de IPTU e execução fiscal','/penhora-de-imovel/'),
 ('/penhora-de-imovel/itr/','garantia/itr.html','Dívida de ITR: execução fiscal do imóvel rural | FCE Advogados','ITR atrasado: execução fiscal da Fazenda Nacional, penhora da área rural, pequena gleba, áreas excluídas do cálculo, prescrição e transação tributária.','Dívida de ITR do imóvel rural','/penhora-de-imovel/'),
 ('/divida-bancaria/','garantia/divida-bancaria.html','Dívida bancária atrasada ou nome negativado: o que fazer | FCE Advogados','Empréstimo, cédula de crédito, cheque especial ou cartão em atraso: o que costuma vir depois, o que conferir no contrato e como agir cedo para evitar prejuízos.','Dívida bancária atrasada ou nome negativado',None),
 ('/divida-bancaria/execucao/','garantia/execucao-bancaria.html','Execução de dívida bancária: citação, penhora e bloqueio | FCE Advogados','Banco entrou com execução de empréstimo ou cédula de crédito? Prazos de 3 e 15 dias, bloqueio de conta, o que é impenhorável, parcelamento e acordo.','Execução de dívida bancária','/divida-bancaria/'),
 ('/parcelas-em-dia/','garantia/parcelas-em-dia.html','Parcelas em dia, mas sem conseguir pagar as próximas | FCE Advogados','Ainda não atrasou, mas sabe que não vai conseguir pagar? Como se antecipar no imóvel financiado, no veículo ou máquina, na dívida da empresa e no empréstimo.','Parcelas em dia, mas sem conseguir pagar as próximas',None),
]
# Conexões temáticas exibidas no fim de cada guia
RELACIONADOS={
 'o-banco-pode-leiloar-minha-casa':[('/imovel-em-garantia/bem-de-familia/','Bem de família: quando a lei protege o imóvel'),('/leilao/','Financiamento atrasado e leilão extrajudicial')],
 'alienacao-fiduciaria-fase-a-fase':[('/leilao/','Defesa do devedor na alienação fiduciária'),('/imovel-em-garantia/divida-da-empresa/','Imóvel em garantia de dívida da empresa')],
 'leilao-judicial-ou-extrajudicial-diferencas':[('/penhora-de-imovel/','Imóvel penhorado: avaliação e leilão judicial'),('/imovel-em-garantia/execucao-contra-garantidor/','Execução contra fiador, avalista ou garantidor')],
 'intimacao-do-cartorio-parcelas-atrasadas':[('/leilao/','Defesa do devedor na alienação fiduciária'),('/imovel-em-garantia/divida-da-empresa/','Imóvel em garantia de dívida da empresa')],
 'propriedade-consolidada-no-nome-do-banco':[('/suspensao-de-leilao/','Leilão marcado: quando cabe a suspensão'),('/leilao/','Defesa do devedor na alienação fiduciária')],
 'como-saber-se-meu-imovel-vai-a-leilao':[('/penhora-de-imovel/','Imóvel penhorado em processo judicial'),('/contato/','Explicar a sua situação ao escritório')],
 'direito-de-preferencia-recomprar-imovel-antes-do-leilao':[('/suspensao-de-leilao/','Leilão marcado: quando cabe a suspensão')],
 'imovel-leiloado-o-que-ainda-e-possivel':[('/guia/saldo-do-leilao-como-receber/','Como receber o saldo do leilão')],
 'saldo-do-leilao-como-receber':[('/imovel-em-garantia/divida-da-empresa/','Saldo remanescente nas garantias empresariais')],
 'purgacao-da-mora-apos-consolidacao-tema-1288':[('/guia/direito-de-preferencia-recomprar-imovel-antes-do-leilao/','Direito de preferência antes do 2º leilão')],
 'leilao-extrajudicial-caixa':[('/leilao/','Defesa do devedor na alienação fiduciária')],
}
for _g in G:
    if _g.get('relacionados') and _g['slug'] not in RELACIONADOS: RELACIONADOS[_g['slug']]=[tuple(x) for x in _g['relacionados']]
def _rel(slug):
    it=RELACIONADOS.get(slug)
    if not it: return ''
    return '<nav class="rel" aria-label="Temas relacionados"><p class="eyebrow">Temas relacionados</p><ul>'+''.join(f'<li><a href="{u}">{html.escape(t)}</a></li>' for u,t in it)+'</ul></nav>'
_MB=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
def _dbr(d):
    y,m,dd=map(int,d.split('-')); return f'{dd} de {_MB[m-1]} de {y}'
FASES=[('Parcelas atrasadas','como-saber-se-meu-imovel-vai-a-leilao'),('Intimação do cartório','intimacao-do-cartorio-parcelas-atrasadas'),('Propriedade consolidada','propriedade-consolidada-no-nome-do-banco'),('Leilão marcado','direito-de-preferencia-recomprar-imovel-antes-do-leilao'),('Imóvel leiloado','imovel-leiloado-o-que-ainda-e-possivel')]
def _fases(slug):
    AT=' class="atual"'
    return '<nav class="fases" aria-label="Em que fase você está?"><p>Em que fase você está?</p><ol>'+''.join(f'<li{AT if sl==slug else ""}><a href="/guia/{sl}/">{n}</a></li>' for n,sl in FASES)+'</ol></nav>'
for g in G:
    url=f'https://fceadvogados.com.br/guia/{g["slug"]}/'
    inv=g['slug'] in INV_SLUGS
    ordem=[o for o in G if o is not g and (o['slug'] in INV_SLUGS)==inv]+[o for o in G if o is not g and (o['slug'] in INV_SLUGS)!=inv]
    outros=''.join(f'<li><a href="/guia/{o["slug"]}/">{html.escape(o["titulo"])}</a></li>' for o in ordem)
    body=f'''  <article class="art">
    <div class="wrap">
      <p class="crumb">{'<a href="/">Início</a> › <a href="/investidor/">Investidores</a> › <a href="/investidor/#guias">Guias</a>' if inv else '<a href="/">Início</a> › <a href="/guia/">Guias</a>'}</p>
      <p class="eyebrow">{g["eyebrow"]}</p>
      <h1>{html.escape(g["titulo"])}</h1>
      <p class="lead">{g["lead"]}</p>
      <p class="revisado">Revisado por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), em <time datetime="{g.get('atualizado',g.get('data','2026-10-03'))}">{_dbr(g.get('atualizado',g.get('data','2026-10-03')))}</time>.</p>
{'' if (inv or not g.get('fases', g.get('categoria') in (None,'Financiamento imobiliário','Alienação fiduciária','Consolidação da propriedade','Leilão extrajudicial','Direitos após o leilão'))) else _fases(g['slug'])}
{g["corpo"]}
      {(CTA_B.replace('p=home','p=guia-'+g['slug'][:40]) if g.get('cta')=='b' else (INV_BOX if inv else DEV_BOX)).replace('TAG','guia-'+g['slug'][:40])}
      <p class="crumb">Por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656). Conteúdo informativo; não substitui a análise individual do caso.</p>
      {_rel(g['slug'])}
      <nav class="rel" aria-label="Outros guias"><p class="eyebrow">{'Mais guias para quem compra em leilão' if inv else 'Outros guias'}</p><ul>{outros}<li><a href="{'/investidor/' if inv else '/guia/'}">{'Área do investidor: análise pré-lance' if inv else 'Todos os guias por situação'}</a></li></ul></nav>
    </div>
  </article>'''
    bc=[("Início","https://fceadvogados.com.br/"),("Investidores","https://fceadvogados.com.br/investidor/")] if inv else [("Início","https://fceadvogados.com.br/"),("Guias","https://fceadvogados.com.br/guia/")]
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"Article","headline":g["titulo"],"description":g["desc"],"inLanguage":"pt-BR","mainEntityOfPage":url,"author":AUT,"publisher":ORG,"datePublished":g.get("data","2026-10-03"),"dateModified":g.get("atualizado",g.get("data","2026-10-03")),"image":"https://fceadvogados.com.br/img/og-fce.jpg"},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":u} for i,(n,u) in enumerate(bc+[(g["titulo"],url)])]}]}
    _fq=[{"@type":"Question","name":html.unescape(re.sub('<[^>]+>','',m.group(1))),"acceptedAnswer":{"@type":"Answer","text":html.unescape(re.sub('<[^>]+>','',m.group(2)))}} for m in re.finditer(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',g["corpo"],re.S)]
    if _fq: ld["@graph"].append({"@type":"FAQPage","mainEntity":_fq})
    page(f'/guia/{g["slug"]}/index.html', g["seo"], g["desc"], url, body, ld, 'investidor-artigo' if inv else 'guia')
_card=lambda g:f'<a href="/guia/{g["slug"]}/"><strong>{html.escape(g["titulo"])}</strong><span>{html.escape(g["desc"])}</span></a>'
GS={g['slug']:g for g in G}
def _pcard(u,t,d): return f'<a class="pg" href="{u}"><strong>{html.escape(t)}</strong><span>{html.escape(d)}</span></a>'
PB={x[0]:x for x in PAGINAS_B}
def _pb(u,d): return _pcard(u,PB[u][4],d)
CATEGORIAS=[
 ('Financiamento imobiliário','Parcelas atrasadas e os primeiros sinais de que o imóvel pode ir a leilão.',[GS['o-banco-pode-leiloar-minha-casa'],GS['como-saber-se-meu-imovel-vai-a-leilao'],GS['leilao-extrajudicial-caixa']],[]),
 ('Alienação fiduciária','Como funciona a cobrança pelo cartório e as regras de cada estado.',[GS['alienacao-fiduciaria-fase-a-fase'],GS['intimacao-do-cartorio-parcelas-atrasadas'],GS['alienacao-fiduciaria-no-rio-grande-do-sul'],GS['leilao-extrajudicial-em-sao-paulo']],[_pcard('/leilao/','Defesa do devedor na alienação fiduciária','O que o escritório analisa em cada fase do procedimento.')]),
 ('Consolidação da propriedade','Quando o imóvel passa para o nome do credor na matrícula.',[GS['propriedade-consolidada-no-nome-do-banco'],GS['purgacao-da-mora-apos-consolidacao-tema-1288']],[]),
 ('Leilão extrajudicial','Datas, direito de preferência e suspensão do leilão.',[GS['direito-de-preferencia-recomprar-imovel-antes-do-leilao']],[_pcard('/suspensao-de-leilao/','Suspensão de leilão de imóvel','Quando a suspensão pode ser pedida e o que precisa ser demonstrado.')]),
 ('Direitos após o leilão','O que ainda pode ser verificado depois da venda.',[GS['imovel-leiloado-o-que-ainda-e-possivel'],GS['saldo-do-leilao-como-receber']],[]),
 ('Penhora e execução','Imóvel penhorado em processo judicial e leilão determinado pelo juiz.',[GS['leilao-judicial-ou-extrajudicial-diferencas']],[_pb('/penhora-de-imovel/','Penhora, avaliação, leilão judicial e os prazos de defesa.'),_pb('/imovel-em-garantia/execucao-contra-garantidor/','Prazos depois da citação e o que pode ser discutido.'),_pb('/penhora-de-imovel/divida-de-condominio/','Condomínio atrasado, execução e a penhora da própria unidade.'),_pb('/penhora-de-imovel/iptu/','Execução fiscal do município, prescrição e defesa.'),_pb('/penhora-de-imovel/itr/','ITR do imóvel rural, pequena gleba e negociação com a Fazenda Nacional.')]),
 ('Garantias empresariais','Quando o imóvel pessoal garante uma dívida da empresa.',[],[_pb('/imovel-em-garantia/','As diferenças entre alienação fiduciária, hipoteca, fiança e aval.'),_pb('/imovel-em-garantia/divida-da-empresa/','O que acontece quando a empresa atrasa.'),_pb('/imovel-em-garantia/responsabilidade-dos-socios/','Quando o patrimônio do sócio pode ser atingido.'),_pb('/imovel-em-garantia/antes-de-assinar/','O que conferir no contrato antes da assinatura.'),_pcard('/empresario/','Guia gratuito para empresários (PDF)','Imóvel dado em garantia de empréstimo da empresa.')]),
 ('Fiança e bem de família','A proteção do imóvel residencial e a situação do fiador.',[],[_pb('/imovel-em-garantia/fiador/','O que a lei e o STF dizem sobre o fiador de locação.'),_pb('/imovel-em-garantia/bem-de-familia/','A regra, as exceções e o que o STJ tem decidido.')]),
]
_usados={g['slug'] for c in CATEGORIAS for g in c[2]}
_falta=[g for g in G if g['slug'] not in INV_SLUGS and g['slug'] not in _usados]
_NOMES={c[0].lower():c for c in CATEGORIAS}
for _g in _falta: _NOMES.get(str(_g.get('categoria') or _g.get('eyebrow') or '').split('·')[0].strip().lower(),CATEGORIAS[0])[2].append(_g)  # guia novo vai para a categoria do JSON (campo categoria ou eyebrow); sem correspondência, Financiamento imobiliário
cards=''.join(f'<section class="guia-cat" aria-labelledby="cat-{i}"><h2 id="cat-{i}">{n}</h2><p>{d}</p><div class="cards">'+''.join(extra)+''.join(_card(g) for g in gs)+'</div></section>' for i,(n,d,gs,extra) in enumerate(CATEGORIAS))
cards+=('<section class="guia-sec"><h2>Para quem compra imóvel em leilão</h2><p style="color:var(--muted)">Conteúdos para arrematantes e investidores.</p><ul>'+''.join(f'<li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>' for g in GI)+'<li><a href="/investidor/">Análise jurídica antes do lance</a></li></ul></section>'
      +'<p style="margin-top:1.5rem"><a href="/calculadora/">Simule quanto do seu imóvel está em jogo</a> · <a href="/ebook/">Guia gratuito em PDF: parcelas atrasadas</a></p>')
body=f'''  <article class="art">
    <div class="wrap">
      <p class="crumb"><a href="/">Início</a> › Guias</p>
      <p class="eyebrow">Dívidas, garantias e leilões de imóveis</p>
      <h1>Guias jurídicos sobre imóveis ameaçados por dívidas</h1>
      <p class="lead">Explicações em linguagem simples, organizadas por situação: do financiamento atrasado ao leilão, das garantias empresariais à penhora. A sequência da alienação fiduciária é intimação, consolidação, leilão, direito de preferência e o que ainda é possível depois.</p>
      {cards}
    </div>
  </article>'''
ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Guias sobre dívidas, garantias e leilões de imóveis","url":"https://fceadvogados.com.br/guia/","publisher":ORG}
page('/guia/index.html','Guias sobre dívidas, garantias e leilões de imóveis | FCE Advogados','Guias por situação: financiamento atrasado, alienação fiduciária, consolidação, leilão, penhora, garantias empresariais, fiança e bem de família.','https://fceadvogados.com.br/guia/',body,ld,'guia')
SOBRE=open(SITE+'/content/sobre.html',encoding='utf-8').read()
ldp={"@context":"https://schema.org","@graph":[{"@type":"ProfilePage","url":"https://fceadvogados.com.br/sobre/","mainEntity":{"@id":"https://fceadvogados.com.br/sobre/#fabio"}},
 {"@type":"Person","@id":"https://fceadvogados.com.br/sobre/#fabio","name":"Fábio de Castro Emerim","jobTitle":"Advogado","identifier":"OAB/RS 88.912","image":"https://fceadvogados.com.br/img/fabio.jpg","worksFor":ORG,"url":"https://fceadvogados.com.br/sobre/","sameAs":["https://www.linkedin.com/in/fabioemerimadv","https://www.instagram.com/adv.fabioemerim/"],"knowsAbout":["Dívidas e garantias imobiliárias","Alienação fiduciária","Leilão de imóveis","Fiança","Bem de família","Penhora de imóvel","Execução civil"],"hasCredential":{"@type":"EducationalOccupationalCredential","credentialCategory":"Inscrição profissional","name":"OAB/RS 88.912","recognizedBy":{"@type":"Organization","name":"Ordem dos Advogados do Brasil, Seccional do Rio Grande do Sul"}},"memberOf":[{"@type":"Organization","name":"Ordem dos Advogados do Brasil, Seccional do Rio Grande do Sul"}],"hasOccupation":[{"@type":"Occupation","name":"Advogado"}],"address":{"@type":"PostalAddress","addressLocality":"Novo Hamburgo","addressRegion":"RS","addressCountry":"BR"}}]}
page('/sobre/index.html','Fábio Emerim: dívidas, garantias e leilões de imóveis | FCE Advogados','Fábio de Castro Emerim (OAB/RS 88.912), sócio da FCE Advogados: dívidas, garantias e leilões de imóveis. Execução civil desde 2013 e fiscal desde 2017.','https://fceadvogados.com.br/sobre/',SOBRE,ldp,'sobre')
# blog
import datetime
MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
def dbr(d):
    y,m,dd=map(int,d.split('-')); return f'{dd} de {MESES[m-1]} de {y}'
B=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/blog/*.json')],key=lambda b:(b.get('data',''),b['slug']),reverse=True)
EBOX='<aside class="eb-box"><p class="eyebrow">Guia gratuito em PDF</p><strong>Parcelas atrasadas do imóvel financiado: o que acontece e o que ainda é possível fazer</strong><p>Da intimação do cartório ao leilão, com checklist de documentos e os erros mais comuns.</p><a class="btn btn-primary" href="/ebook/?o=TAG">Baixar o guia gratuito</a></aside>'
for b in B:
    url=f'https://fceadvogados.com.br/blog/{b["slug"]}/'
    outros=''.join(f'<li><a href="/blog/{o["slug"]}/">{html.escape(o["titulo"])}</a></li>' for o in B if o is not b)[:6000]
    guias=''.join(f'<li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>' for g in G[:4])
    body=f'''  <article class="art">
    <div class="wrap">
      <p class="crumb"><a href="/">Início</a> › <a href="/blog/">Blog</a></p>
      <p class="eyebrow">{b["eyebrow"]}</p>
      <h1>{html.escape(b["titulo"])}</h1>
      <p class="crumb"><time datetime="{b["data"]}">{dbr(b["data"])}</time> · Por <a href="/sobre/">Fábio de Castro Emerim</a></p>
      <p class="lead">{b["lead"]}</p>
{b["corpo"]}
      <p class="crumb">Fábio de Castro Emerim, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656). Conteúdo informativo; não substitui a análise individual do caso.</p>
      {EBOX.replace('TAG','blog-'+b['slug'][:40])}
      <nav class="rel" aria-label="Leia também"><p class="eyebrow">Leia também</p><ul>{outros}{guias}</ul></nav>
    </div>
  </article>'''
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"BlogPosting","headline":b["titulo"],"description":b["desc"],"inLanguage":"pt-BR","mainEntityOfPage":url,"author":AUT,"publisher":ORG,"datePublished":b["data"],"dateModified":b.get("atualizado",b["data"]),"image":"https://fceadvogados.com.br/img/og-fce.jpg"},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"https://fceadvogados.com.br/"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://fceadvogados.com.br/blog/"},{"@type":"ListItem","position":3,"name":b["titulo"],"item":url}]}]}
    page(f'/blog/{b["slug"]}/index.html', b["seo"] if 'FCE' in b["seo"] else b["seo"]+' | FCE Advogados', b["desc"], url, body, ld, 'blog')
cards=''.join(f'<a href="/blog/{b["slug"]}/"><time datetime="{b["data"]}">{dbr(b["data"])}</time><strong>{html.escape(b["titulo"])}</strong><span>{html.escape(b["desc"])}</span></a>' for b in B) or '<p>Em breve, os primeiros artigos.</p>'
body=f'''  <article class="art">
    <div class="wrap" style="max-width:var(--wrap)">
      <p class="crumb"><a href="/">Início</a> › Blog</p>
      <p class="eyebrow">Leilão de imóveis</p>
      <h1>Blog da FCE Advogados</h1>
      <p class="lead">Artigos sobre leilão de imóveis, alienação fiduciária e arrematação: novidades, alertas e explicações para quem tem imóvel em risco e para quem quer comprar em leilão. Procurando a explicação de uma fase específica? Veja os <a href="/guia/">guias por situação</a>.</p>
      <div class="cards">{cards}</div>
      {EBOX.replace('TAG','blog')}
    </div>
  </article>'''
ld={"@context":"https://schema.org","@type":"Blog","name":"Blog da FCE Advogados","url":"https://fceadvogados.com.br/blog/","publisher":ORG,"inLanguage":"pt-BR","blogPost":[{"@type":"BlogPosting","headline":b["titulo"],"url":f'https://fceadvogados.com.br/blog/{b["slug"]}/',"datePublished":b["data"]} for b in B]}
page('/blog/index.html','Blog sobre leilão de imóveis e alienação fiduciária | FCE Advogados','Artigos da FCE Advogados sobre leilão de imóveis, alienação fiduciária, arrematação e golpes: novidades e alertas em linguagem simples.','https://fceadvogados.com.br/blog/',body,ld,'blog')
# e-book e privacidade
EB=open(SITE+'/content/ebook.html',encoding='utf-8').read()
lde={"@context":"https://schema.org","@type":"WebPage","name":"Guia gratuito: parcelas atrasadas do imóvel financiado","url":"https://fceadvogados.com.br/ebook/","publisher":ORG,"author":AUT}
page('/ebook/index.html','Guia grátis: parcelas atrasadas do imóvel financiado | FCE Advogados','Baixe grátis o guia em PDF sobre parcelas atrasadas e alienação fiduciária: da intimação do cartório ao leilão, com checklist de documentos.','https://fceadvogados.com.br/ebook/',EB,lde,'ebook')
OB='''  <article class="art">
    <div class="wrap">
      <p class="eyebrow">Pronto</p>
      <h1>O seu guia está aqui</h1>
      <p class="lead">Obrigado. Baixe o PDF agora e guarde no celular para consultar quando precisar.</p>
      <div class="dl">
        <a class="btn btn-primary" href="/ebook/fce-guia-parcelas-atrasadas.pdf" download>Baixar o guia em PDF</a>
        <p>Se preferir, comece pelo capítulo 2, “A linha do tempo”, e pelo quadro “Onde você está agora?”, na última parte.</p>
        <p>Enquanto isso, veja também os <a href="/guia/">guias por situação</a> e o <a href="/blog/">blog</a>.</p>
      </div>
    </div>
  </article>'''
page('/ebook/obrigado/index.html','Seu guia gratuito | FCE Advogados','Download do guia gratuito sobre parcelas atrasadas do imóvel financiado.','https://fceadvogados.com.br/ebook/obrigado/',OB,{"@context":"https://schema.org","@type":"WebPage","name":"Download do guia"},'ebook-obrigado','<meta name="robots" content="noindex">')
# guia do empresario
EM=open(SITE+'/content/empresario.html',encoding='utf-8').read()
ldm={"@context":"https://schema.org","@type":"WebPage","name":"Guia gratuito para empresários: imóvel dado em garantia","url":"https://fceadvogados.com.br/empresario/","publisher":ORG,"author":AUT}
page('/empresario/index.html','Imóvel em garantia da empresa: guia gratuito (PDF) | FCE Advogados','Deu a sede, o galpão ou a casa em garantia de empréstimo da empresa? Guia gratuito sobre o que acontece se as parcelas atrasarem: cartório, aditivos e leilão.','https://fceadvogados.com.br/empresario/',EM,ldm,'empresario')
OBM=OB.replace('/ebook/fce-guia-parcelas-atrasadas.pdf','/empresario/fce-guia-imovel-em-garantia.pdf').replace('comece pelo capítulo 2, “A linha do tempo”','comece pelo capítulo 3, “A linha do tempo”')
page('/empresario/obrigado/index.html','Seu guia gratuito | FCE Advogados','Download do guia gratuito para empresários sobre imóvel dado em garantia.','https://fceadvogados.com.br/empresario/obrigado/',OBM,{"@context":"https://schema.org","@type":"WebPage","name":"Download do guia"},'empresario-obrigado','<meta name="robots" content="noindex">')
# area do investidor
IV=open(SITE+'/content/investidor.html',encoding='utf-8').read().replace('{{GUIAS}}',''.join(f'<a href="/guia/{g["slug"]}/"><strong>{html.escape(g["titulo"])}</strong><span>{html.escape(g["desc"])}</span></a>' for g in GI))
faqi=[{"@type":"Question","name":html.unescape(m.group(1)),"acceptedAnswer":{"@type":"Answer","text":html.unescape(m.group(2))}} for m in re.finditer(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',IV,re.S)]
def _bci(*itens): return {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":u} for i,(n,u) in enumerate((("Início","https://fceadvogados.com.br/"),)+itens)]}
ldi={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"Comprar imóvel em leilão com segurança jurídica","url":"https://fceadvogados.com.br/investidor/","publisher":ORG,"author":AUT},{"@type":"FAQPage","mainEntity":faqi},_bci(("Investidores","https://fceadvogados.com.br/investidor/"))]}
page('/investidor/index.html','Advogado para comprar imóvel em leilão: análise pré-lance | FCE Advogados','Análise jurídica antes do lance e assessoria na compra de imóvel em leilão: edital, matrícula, dívidas, ocupação, riscos e a conta completa. Todo o Brasil.','https://fceadvogados.com.br/investidor/',IV,ldi,'investidor')
IG=open(SITE+'/content/investidor-guia.html',encoding='utf-8').read()
ldg={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"Guia gratuito: 20 pontos para conferir antes do lance","url":"https://fceadvogados.com.br/investidor/guia/","publisher":ORG,"author":AUT},_bci(("Investidores","https://fceadvogados.com.br/investidor/"),("Guia gratuito","https://fceadvogados.com.br/investidor/guia/"))]}
page('/investidor/guia/index.html','Guia: 20 pontos antes do lance em leilão (PDF) | FCE Advogados','Baixe grátis o checklist do investidor em leilão de imóveis: edital, matrícula, dívidas, ocupação, riscos de anulação e a conta completa antes do lance.','https://fceadvogados.com.br/investidor/guia/',IG,ldg,'investidor-guia')
OBI=OB.replace('/ebook/fce-guia-parcelas-atrasadas.pdf','/investidor/guia/fce-guia-investidor-20-pontos.pdf').replace('Se preferir, comece pelo capítulo 2, “A linha do tempo”, e pelo quadro “Onde você está agora?”, na última parte.','O checklist dos 20 pontos está numa página só, no final: salve e use em cada imóvel. Para analisar um imóvel específico, veja a <a href="/investidor/">análise pré-lance</a>.')
page('/investidor/guia/obrigado/index.html','Seu guia gratuito | FCE Advogados','Download do guia gratuito para investidores em leilão de imóveis.','https://fceadvogados.com.br/investidor/guia/obrigado/',OBI,{"@context":"https://schema.org","@type":"WebPage","name":"Download do guia"},'investidor-obrigado','<meta name="robots" content="noindex">')
PR=open(SITE+'/content/privacidade.html',encoding='utf-8').read()
page('/privacidade/index.html','Política de privacidade e LGPD do site | FCE Advogados','Como a FCE Advogados trata os dados pessoais de visitantes do site, contatos e clientes, com base na LGPD: finalidades, prazos de guarda e direitos do titular.','https://fceadvogados.com.br/privacidade/',PR,{"@context":"https://schema.org","@type":"WebPage","name":"Política de privacidade","url":"https://fceadvogados.com.br/privacidade/","publisher":ORG},'privacidade')
# veiculo
V=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/veiculo/*.json')],key=lambda g:(g.get('ordem',999),g['slug']))
for g in V:
    url=f'https://fceadvogados.com.br/veiculo/{g["slug"]}/'
    outros=''.join(f'<li><a href="/veiculo/{o["slug"]}/">{html.escape(o["titulo"])}</a></li>' for o in V if o is not g)
    body=f'''  <article class="art">
    <div class="wrap">
      <p class="crumb"><a href="/">Início</a> › <a href="/veiculo/">Veículo</a></p>
      <p class="eyebrow">{g["eyebrow"]}</p>
      <h1>{html.escape(g["titulo"])}</h1>
      <p class="lead">{g["lead"]}</p>
{g["corpo"]}
      <p class="crumb">Por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656). Conteúdo informativo; não substitui a análise individual do caso.</p>
      <nav class="rel" aria-label="Outros guias"><p class="eyebrow">Outros guias sobre veículo</p><ul>{outros}<li><a href="/veiculo/">Busca e apreensão de veículo: visão geral</a></li></ul></nav>
    </div>
  </article>'''
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"Article","headline":g["titulo"],"description":g["desc"],"inLanguage":"pt-BR","mainEntityOfPage":url,"author":AUT,"publisher":ORG,"datePublished":g.get("data","2026-10-03"),"dateModified":g.get("data","2026-10-03"),"image":"https://fceadvogados.com.br/img/og-fce.jpg"},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"https://fceadvogados.com.br/"},{"@type":"ListItem","position":2,"name":"Veículo","item":"https://fceadvogados.com.br/veiculo/"},{"@type":"ListItem","position":3,"name":g["titulo"],"item":url}]}]}
    page(f'/veiculo/{g["slug"]}/index.html', g["seo"] if 'FCE' in g["seo"] else g["seo"]+' | FCE Advogados', g["desc"], url, body, ld, 'veiculo')
VH=open(SITE+'/content/veiculo.html',encoding='utf-8').read().replace('{{GUIAS}}',''.join(f'<a href="/veiculo/{g["slug"]}/"><strong>{html.escape(g["titulo"])}</strong><span>{html.escape(g["desc"])}</span></a>' for g in V))
faq=[]
for m in re.finditer(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',VH,re.S):
    faq.append({"@type":"Question","name":html.unescape(m.group(1)),"acceptedAnswer":{"@type":"Answer","text":html.unescape(m.group(2))}})
ldv={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"Busca e apreensão de veículo financiado","url":"https://fceadvogados.com.br/veiculo/","publisher":ORG,"author":AUT},{"@type":"FAQPage","mainEntity":faq},
  {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"https://fceadvogados.com.br/"},{"@type":"ListItem","position":2,"name":"Veículo","item":"https://fceadvogados.com.br/veiculo/"}]}]}
VH+='\n  <section class="art" style="padding-block:0 1rem"><div class="wrap"><nav class="rel" aria-label="Guias sobre este tema"><p class="eyebrow">Guias sobre este tema</p><ul><li><a href="/guia/busca-e-apreensao-veiculo-maquina-prazos/">Busca e apreensão de veículo ou máquina: os prazos depois da apreensão</a></li><li><a href="/parcelas-em-dia/#veiculo">Parcelas em dia, mas sem conseguir pagar as próximas</a></li></ul></nav></div></section>'
page('/veiculo/index.html','Busca e apreensão de veículo: defesa e revisional | FCE Advogados','Carro, moto, caminhão ou máquina financiados com parcelas atrasadas ou apreendidos? Defesa na busca e apreensão, na Justiça ou no cartório, e revisão dos juros.','https://fceadvogados.com.br/veiculo/',VH,ldv,'veiculo')
# paginas por cidade (atendimento local)
CID=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/cidades/*.json')],key=lambda c:c.get('ordem',99))
CIDN={c['slug']:c for c in CID}
for c in CID:
    url=f'https://fceadvogados.com.br/leilao-de-imoveis/{c["slug"]}/'
    nh=c['slug']=='novo-hamburgo'; sp=c['uf']!='RS'  # fora do RS: online, presencial quando combinado
    onde='no escritório, na Rua Araguaia, 509, Jardim Mauá' if nh else ('por videochamada ou, quando combinado com você, presencialmente' if sp else 'por videochamada ou presencialmente no escritório em Novo Hamburgo')
    faq=[
      ('Onde fica o escritório?' if nh else 'Preciso ir ao escritório em Novo Hamburgo?',
       'Na Rua Araguaia, 509, Jardim Mauá, Novo Hamburgo/RS. A consulta pode ser presencial ou por videochamada, como for melhor para você.' if nh else
       ('Não é necessário. A conversa começa pelo WhatsApp e a consulta é por videochamada; quando combinado com o cliente, o atendimento também pode ser presencial. Os documentos são enviados digitalmente e os processos são eletrônicos.' if sp else
        'Não é obrigatório. A conversa começa pelo WhatsApp e a consulta pode ser por videochamada ou presencial, em Novo Hamburgo. Os documentos são enviados digitalmente.')),
      (f'O financiamento é da Caixa. Vocês atendem casos assim em {c["nome"]}?',
       'Sim. A Caixa é a instituição que mais leiloa imóveis financiados. Quando é preciso ir à Justiça contra ela, a ação corre na Justiça Federal, com processo eletrônico.'),
      ('Quanto tempo tenho depois da intimação do cartório?',
       'Pela Lei 9.514/97, o prazo para pagar as parcelas atrasadas e os encargos é de 15 dias a partir da intimação. Depois disso, o banco pode pedir a consolidação da propriedade. Por isso, vale buscar orientação logo que a intimação chegar.')]
    faqh=''.join(f'<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>' for q,a in faq)
    outras=''.join(f'<li><a href="/leilao-de-imoveis/{o["slug"]}/">Leilão de imóveis em {o["nome"]}</a></li>' for o in CID if o is not c)
    body=f'''  <article class="art">
    <div class="wrap" style="max-width:var(--wrap)">
      <p class="crumb"><a href="/">Início</a> › <a href="/leilao-de-imoveis/">Atendimento por cidade</a> › {html.escape(c["nome"])}</p>
      <p class="eyebrow">Leilão de imóveis · {html.escape(c["nome"])}/{c["uf"]}</p>
      <h1>{html.escape(c.get("h1",f'Advogado para leilão de imóveis em {c["nome"]}'))}</h1>
      <p class="lead">{c["lead"]}</p>

      <h2 id="devedor">Imóvel financiado em risco em {html.escape(c["nome"])}</h2>
      <p>Na alienação fiduciária, o imóvel fica em garantia do banco até a última parcela. Se as parcelas atrasam, o banco pode retomá-lo pelo cartório, sem processo judicial, e cada fase tem prazo curto:</p>
      <ol class="vei-fases">
        <li><b>Intimação do cartório</b><span>O Registro de Imóveis intima para pagar as parcelas atrasadas em 15 dias. <a href="/guia/intimacao-do-cartorio-parcelas-atrasadas/">Entenda a intimação</a>.</span></li>
        <li><b>Consolidação da propriedade</b><span>Sem pagamento, o imóvel passa para o nome do banco na matrícula. <a href="/guia/propriedade-consolidada-no-nome-do-banco/">O que ainda é possível</a>.</span></li>
        <li><b>Leilões</b><span>O banco faz até dois leilões. Até o segundo, o antigo dono tem preferência para recomprar. <a href="/guia/direito-de-preferencia-recomprar-imovel-antes-do-leilao/">Direito de preferência</a>.</span></li>
        <li><b>Depois do leilão</b><span>Se o imóvel for vendido por mais do que a dívida, a diferença é do antigo dono. <a href="/guia/saldo-do-leilao-como-receber/">Saldo do leilão</a>.</span></li>
      </ol>
      <p>{c["registro"]}</p>
      <p>{c["justica"]}</p>
{c.get("extra","")}
      {DEV_BOX.replace('TAG','cidade-'+c['slug'])}

      <h2 id="investidor">Para quem quer comprar imóvel em leilão em {html.escape(c["nome"])}</h2>
      <p>{c["invest"]}</p>
      <p>A FCE faz a <a href="/investidor/#analise">análise pré-lance</a> do imóvel que você escolheu (edital, matrícula, processo, dívidas, ocupação e a conta completa) e a <a href="/investidor/#assessoria">assessoria na arrematação</a>, do lance ao registro e à posse.</p>
      {INV_BOX.replace('TAG','cidade-'+c['slug'])}

      <h2 id="atendimento">Como funciona o atendimento</h2>
      <ul>
        <li>Você chama pelo WhatsApp, a qualquer hora, e já pode enviar a intimação, a matrícula ou o edital.</li>
        <li>A consulta com o advogado é {onde}.</li>
        <li>Os documentos são enviados digitalmente, e os processos são eletrônicos, acompanhados a distância.</li>
      </ul>
      <p>Também atendemos <a href="/veiculo/">busca e apreensão de veículo financiado</a> e <a href="/empresario/">empresas com imóvel dado em garantia</a>.</p>

      <h2 id="perguntas">Perguntas frequentes</h2>
      <div class="vei-faq">{faqh}</div>

      <p class="crumb" style="margin-top:2rem">Fábio de Castro Emerim, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656), com escritório em Novo Hamburgo/RS. Conteúdo informativo; não substitui a análise individual do caso.</p>
      <nav class="rel" aria-label="Outras cidades"><p class="eyebrow">Atendimento em outras cidades</p><ul>{outras}<li><a href="/leilao-de-imoveis/">Todas as cidades</a></li><li><a href="/guia/">Guias por situação</a></li></ul></nav>
    </div>
  </article>'''
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"WebPage","name":c.get("h1",f'Advogado para leilão de imóveis em {c["nome"]}'),"url":url,"inLanguage":"pt-BR","publisher":ORG,"author":AUT},
      {"@type":"Service","serviceType":"Advocacia em leilão de imóveis e alienação fiduciária","provider":ORG,"areaServed":{"@type":"City","name":c["nome"],"containedInPlace":{"@type":"State","name":{"RS":"Rio Grande do Sul","SP":"São Paulo","SC":"Santa Catarina","PR":"Paraná","MT":"Mato Grosso","MS":"Mato Grosso do Sul"}.get(c["uf"],c["uf"])}},"url":url},
      {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"https://fceadvogados.com.br/"},{"@type":"ListItem","position":2,"name":"Atendimento por cidade","item":"https://fceadvogados.com.br/leilao-de-imoveis/"},{"@type":"ListItem","position":3,"name":c["nome"],"item":url}]}]}
    page(f'/leilao-de-imoveis/{c["slug"]}/index.html', c['seo'], c['desc'], url, body, ld, 'cidade-'+c['slug'])
cards=''.join(f'<a href="/leilao-de-imoveis/{c["slug"]}/"><strong>Leilão de imóveis em {html.escape(c["nome"])}/{c["uf"]}</strong><span>{html.escape(c["desc"])}</span></a>' for c in CID)
body=f'''  <article class="art">
    <div class="wrap" style="max-width:var(--wrap)">
      <p class="crumb"><a href="/">Início</a> › Atendimento por cidade</p>
      <p class="eyebrow">Leilão de imóveis</p>
      <h1>Advogado para leilão de imóveis: atendimento por cidade</h1>
      <p class="lead">O escritório fica em Novo Hamburgo/RS e atende por videochamada em todo o Brasil e presencialmente na Região Metropolitana de Porto Alegre; nas demais cidades, o atendimento presencial pode ser combinado com o cliente, com páginas para capitais e cidades do Rio Grande do Sul, de Santa Catarina, do Paraná, de São Paulo, de Mato Grosso e de Mato Grosso do Sul. Escolha a sua cidade para ver como funciona o caminho do leilão aí.</p>
      <div class="cards">{cards}</div>
      <p style="margin-top:1.5rem">Não encontrou a sua cidade? O atendimento online funciona do mesmo jeito: a conversa começa pelo WhatsApp, a consulta é por vídeo e os processos são eletrônicos. Quando combinado com o cliente, o atendimento também pode ser presencial.</p>
    </div>
  </article>'''
ldc={"@context":"https://schema.org","@type":"CollectionPage","name":"Advogado para leilão de imóveis: atendimento por cidade","url":"https://fceadvogados.com.br/leilao-de-imoveis/","publisher":ORG}
page('/leilao-de-imoveis/index.html','Advogado para leilão de imóveis por cidade | FCE Advogados','Advogado para leilão de imóveis em Porto Alegre, Novo Hamburgo, São Paulo, Florianópolis, Curitiba, Cuiabá e Campo Grande. Online e, se combinado, presencial.','https://fceadvogados.com.br/leilao-de-imoveis/',body,ldc,'cidades')
# paginas feitas a mao (calculadoras): mesmo rodape e menu do resto do site
_FCSS=IDX[IDX.index('footer .flinks{'):IDX.index('footer .aviso{')]
for _p,_hd,_tg in (('/calculadora/index.html',header,'calculadora'),('/investidor/calculadora/index.html',header_inv,'calc-investidor')):
    _s=open(SITE+_p,encoding='utf-8').read()
    _s=_s[:_s.index('<footer>')]+tail[:tail.index('</footer>')+9].replace('href="#','href="/#')+_s[_s.index('</footer>')+9:]
    if _hd:
        _h=fix(_hd,_tg).replace('href="/investidor/calculadora/">','href="/investidor/calculadora/" aria-current="page">',1)
        _s=_s[:_s.index('<header class="top">')]+_h+_s[_s.index('</header>')+9:]
    if '.menu-panel li.mp-k{' not in _s and '.menu-panel li.mp-k{' in IDX: _s=_s.replace('</style>',IDX[IDX.index('.menu-panel li.mp-k{'):IDX.index('}',IDX.index('.menu-panel li.mp-k{'))+1]+'\n</style>',1)
    if 'footer .flinks{' not in _s: _s=_s.replace('footer .aviso{',_FCSS+'footer .aviso{',1)
    _MB=tail[tail.index('<div class="mbar">'):tail.index('</div>',tail.index('<div class="mbar">'))+6]
    _MBCSS=IDX[IDX.index('/* Barra fixa no celular */'):IDX.index('/* Topo no celular')]
    if 'localStorage.getItem("tema")' not in _s: _s=_s.replace('</title>','</title>\n'+TEMA_JS,1)
    if '.tema-btn{' not in _s: _s=_s.replace('</style>','\n'+IDX[IDX.index('.tema-btn{'):IDX.index('.menu-btn{display:none;')]+'</style>',1)
    if '/* Tema claro/escuro */' not in _s: _s=_s.replace('</body>',IDX[IDX.index('<script>\n/* Tema claro/escuro */'):IDX.index('</script>',IDX.index('/* Tema claro/escuro */'))+9]+'\n</body>',1)
    if 'data-tema' not in _s: _s=_s.replace('<a class="btn btn-primary wa"',IDX[IDX.index('<button class="tema-btn"'):IDX.index('</button>',IDX.index('<button class="tema-btn"'))+9]+'\n      <a class="btn btn-primary wa"',1)
    if 'class="mbar"' not in _s: _s=_s.replace('</footer>','</footer>\n'+fix(_MB,_tg),1).replace('</style>','\n'+_MBCSS+'</style>',1)
    _u='https://fceadvogados.com.br'+_p[:-len('index.html')]
    _nm='Calculadora do lance máximo em leilão de imóveis' if 'investidor' in _p else 'Calculadora: quanto do seu imóvel está em jogo'
    _ldc=json.dumps({"@context":"https://schema.org","@graph":[{"@type":"WebApplication","name":_nm,"url":_u,"applicationCategory":"FinanceApplication","operatingSystem":"Web","inLanguage":"pt-BR","isAccessibleForFree":True,"offers":{"@type":"Offer","price":"0","priceCurrency":"BRL"},"publisher":ORG,"author":AUT},_bci(*((("Investidores","https://fceadvogados.com.br/investidor/"),(_nm,_u)) if 'investidor' in _p else ((_nm,_u),)))]},ensure_ascii=False)
    import re as _re
    _s=_re.sub(r'<script type="application/ld\+json">\{"@context": ?"https://schema.org", ?"@graph": ?\[\{"@type": ?"WebApplication".*?</script>\n','',_s,flags=_re.S)
    _s=_s.replace('</head>',f'<script type="application/ld+json">{_ldc}</script>\n</head>',1)
    open(SITE+_p,'w',encoding='utf-8').write(_s)
# paginas de servico: /leilao/ (defesa do devedor) e /suspensao-de-leilao/
def _servico(path, title, desc, nome, content, tag):
    url='https://fceadvogados.com.br'+path
    H=open(SITE+'/content/'+content,encoding='utf-8').read()
    fq=[{"@type":"Question","name":html.unescape(m.group(1)),"acceptedAnswer":{"@type":"Answer","text":html.unescape(re.sub('<[^>]+>','',m.group(2)))}} for m in re.finditer(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',H,re.S)]
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"WebPage","name":nome,"url":url,"inLanguage":"pt-BR","publisher":ORG,"author":AUT},
      {"@type":"Service","name":nome,"serviceType":nome,"provider":ORG,"areaServed":[{"@type":"State","name":"Rio Grande do Sul"},{"@type":"State","name":"São Paulo"},{"@type":"Country","name":"BR"}],"url":url},
      {"@type":"FAQPage","mainEntity":fq},
      _bci((nome,url))]}
    page(path+'index.html', title, desc, url, H, ld, tag)
_servico('/leilao/','Leilão de imóvel financiado: defesa do devedor | FCE Advogados','Parcelas atrasadas, intimação do cartório ou leilão marcado? Defesa do devedor na alienação fiduciária: procedimento, suspensão, preferência e saldo.','Defesa do devedor na alienação fiduciária','leilao.html','leilao')
_servico('/suspensao-de-leilao/','Suspensão de leilão de imóvel: quando é possível pedir | FCE Advogados','Leilão do imóvel marcado? O pedido judicial de suspensão: quando cabe, o que precisa provar, se exige depósito, prazos e o que acontece depois da liminar.','Suspensão de leilão de imóvel','suspensao.html','suspensao')
# páginas novas: núcleo de garantias e penhora
_MESES_B=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
def _dbr_b(d):
    y,m,dd=map(int,d.split('-')); return f'{dd} de {_MESES_B[m-1]} de {y}'
def _pagina(path, arquivo, title, desc, nome, pai):
    url='https://fceadvogados.com.br'+path
    H=open(SITE+'/content/'+arquivo,encoding='utf-8').read()
    tag=path.strip('/').replace('/','-')[:40]
    REVISAO_B=REVISAO_PAG.get(path, globals()['REVISAO_B'])
    _gl=[g for g in G if any(x[0]==path for x in (g.get('relacionados') or []))]
    _gn=('<nav class="rel" aria-label="Guias sobre este tema"><p class="eyebrow">Guias sobre este tema</p><ul>'+''.join(f'<li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>' for g in _gl)+'</ul></nav>\n      ') if _gl else ''
    H=H.replace('{{CTA}}',CTA_B.replace('TAG',tag)).replace('{{ASSINATURA}}',_gn+ASSINATURA_B).replace('{{REVISADO}}',f'<p class="revisado">Revisado por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), em <time datetime="{REVISAO_B}">{_dbr_b(REVISAO_B)}</time>.</p>')
    fq=[{"@type":"Question","name":html.unescape(m.group(1)),"acceptedAnswer":{"@type":"Answer","text":html.unescape(re.sub('<[^>]+>','',m.group(2)))}} for m in re.finditer(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',H,re.S)]
    itens=((PB[pai][4],'https://fceadvogados.com.br'+pai),) if pai else ()
    grafo=[{"@type":"WebPage","name":nome,"description":desc,"url":url,"inLanguage":"pt-BR","publisher":ORG,"author":AUT,"dateModified":REVISAO_B},
      _bci(*(itens+((nome,url),)))]
    if fq: grafo.append({"@type":"FAQPage","mainEntity":fq})
    if not pai: grafo.append({"@type":"Service","name":nome,"serviceType":nome,"provider":ORG,"areaServed":{"@type":"Country","name":"Brasil"},"url":url})
    page(path+'index.html', title, desc, url, H, {"@context":"https://schema.org","@graph":grafo}, tag)
for _x in PAGINAS_B: _pagina(*_x)
# Ferramentas interativas (sem cadastro) e "Minha análise" (página pessoal, fora do índice)
FERRAMENTAS=[
 ('/ferramentas/','ferramentas/index.html','Ferramentas: entenda a fase do seu caso | FCE Advogados','Ferramentas gratuitas e sem cadastro: linha do tempo do imóvel financiado, verificador de bem de família, checklist antes de assinar a garantia e calculadora.','Ferramentas'),
 ('/ferramentas/linha-do-tempo/','ferramentas/linha-do-tempo.html','Linha do tempo da alienação fiduciária: em que fase estou? | FCE Advogados','Marque o que já aconteceu, da intimação do cartório ao 2º leilão, e veja a fase atual do imóvel financiado, o que costuma vir depois e os prazos da lei.','Linha do tempo do imóvel financiado'),
 ('/ferramentas/bem-de-familia/','ferramentas/bem-de-familia.html','Bem de família: meu imóvel pode ser penhorado? Verificador | FCE Advogados','Responda 4 perguntas e veja como a Lei 8.009/1990 trata o imóvel onde você mora: a regra, as exceções do art. 3º e as súmulas 364, 486 e 549 do STJ.','Verificador de bem de família'),
 ('/ferramentas/antes-de-assinar/','ferramentas/antes-de-assinar.html','Antes de assinar a garantia: checklist para empresários | FCE Advogados','Vai dar imóvel em garantia, aval ou fiança em empréstimo da empresa? Dez perguntas mostram os pontos do contrato que merecem atenção antes de assinar.','Antes de assinar a garantia'),
]
for _p,_a,_t,_dsc,_n in FERRAMENTAS:
    _u='https://fceadvogados.com.br'+_p
    _it=((('Ferramentas','https://fceadvogados.com.br/ferramentas/'),) if _p!='/ferramentas/' else ())+((_n,_u),)
    _g=[{"@type":"WebPage","name":_n,"description":_dsc,"url":_u,"inLanguage":"pt-BR","publisher":ORG,"author":AUT},_bci(*_it)]
    if _p!='/ferramentas/': _g.append({"@type":"WebApplication","name":_n,"url":_u,"applicationCategory":"UtilitiesApplication","operatingSystem":"Web","isAccessibleForFree":True,"inLanguage":"pt-BR","provider":ORG})
    page(_p+"index.html",_t,_dsc,_u,open(SITE+'/content/'+_a,encoding='utf-8').read(),{"@context":"https://schema.org","@graph":_g},_p.strip('/').replace('/','-'))
page('/minha-analise/index.html','Minha análise | FCE Advogados','Página pessoal da análise salva no site da FCE Advogados.','https://fceadvogados.com.br/minha-analise/',open(SITE+'/content/ferramentas/minha-analise.html',encoding='utf-8').read(),{"@context":"https://schema.org","@type":"WebPage","name":"Minha análise"},'minha-analise','\n<meta name="robots" content="noindex, nofollow">\n<meta name="referrer" content="no-referrer">')
CT=open(SITE+'/content/contato.html',encoding='utf-8').read()
page('/contato/index.html','Contato: explique a sua situação | FCE Advogados','Descreva a situação do seu imóvel: financiamento atrasado, garantia, fiança ou penhora. O escritório retorna pelo WhatsApp. Atendimento em todo o Brasil.','https://fceadvogados.com.br/contato/',CT,{"@context":"https://schema.org","@graph":[{"@type":"ContactPage","name":"Contato","url":"https://fceadvogados.com.br/contato/","publisher":ORG},_bci(("Contato","https://fceadvogados.com.br/contato/"))]},'contato')
CO=open(SITE+'/content/contato-obrigado.html',encoding='utf-8').read()
page('/contato/obrigado/index.html','Contato recebido | FCE Advogados','Recebemos o seu relato. O escritório retorna pelo WhatsApp informado.','https://fceadvogados.com.br/contato/obrigado/',CO,{"@context":"https://schema.org","@type":"WebPage","name":"Contato recebido"},'contato-obrigado','<meta name="robots" content="noindex">')
# sitemap
urls=['https://fceadvogados.com.br/','https://fceadvogados.com.br/leilao/','https://fceadvogados.com.br/suspensao-de-leilao/','https://fceadvogados.com.br/calculadora/','https://fceadvogados.com.br/sobre/','https://fceadvogados.com.br/ebook/','https://fceadvogados.com.br/blog/','https://fceadvogados.com.br/guia/']+[f'https://fceadvogados.com.br/guia/{g["slug"]}/' for g in G]+[f'https://fceadvogados.com.br/blog/{b["slug"]}/' for b in B]+[f'https://fceadvogados.com.br{x[0]}' for x in PAGINAS_B]+[f'https://fceadvogados.com.br{x[0]}' for x in FERRAMENTAS]+['https://fceadvogados.com.br/contato/']+['https://fceadvogados.com.br/veiculo/']+[f'https://fceadvogados.com.br/veiculo/{g["slug"]}/' for g in V]+['https://fceadvogados.com.br/empresario/','https://fceadvogados.com.br/investidor/','https://fceadvogados.com.br/investidor/guia/','https://fceadvogados.com.br/investidor/calculadora/','https://fceadvogados.com.br/leilao-de-imoveis/']+[f'https://fceadvogados.com.br/leilao-de-imoveis/{c["slug"]}/' for c in CID]+['https://fceadvogados.com.br/privacidade/']
import subprocess as _sp
_HOJE=_d.strftime('%Y-%m-%d')
def _lastmod(u):
    # data do conteudo-fonte (git) ou de hoje quando o arquivo mudou e ainda nao foi commitado
    rel=u.replace('https://fceadvogados.com.br','').strip('/')
    # conteudo com data propria (JSON): usa 'atualizado' ou 'data'
    for pre,lst in (('guia/',G),('blog/',B),('veiculo/',V)):
        if rel.startswith(pre):
            for x in lst:
                if x['slug']==rel.split('/')[1]: return x.get('atualizado',x.get('data',_HOJE))
    cand=[]
    if rel=='': cand=['index.html']
    elif rel.startswith('guia/'): cand=['content/guias/'+rel.split('/')[1]+'.json']
    elif rel.startswith('blog/'): cand=['content/blog/'+rel.split('/')[1]+'.json']
    elif rel.startswith('veiculo/'): cand=['content/veiculo/'+rel.split('/')[1]+'.json']
    elif rel.startswith('leilao-de-imoveis/'): cand=['content/cidades/'+rel.split('/')[1]+'.json']
    elif rel in ('sobre','ebook','empresario','privacidade','veiculo','investidor'): cand=['content/'+rel+'.html']
    elif rel=='investidor/guia': cand=['content/investidor-guia.html']
    elif rel=='leilao': cand=['content/leilao.html']
    elif rel=='suspensao-de-leilao': cand=['content/suspensao.html']
    elif ('/'+rel+'/') in [x[0] for x in PAGINAS_B]: cand=['content/'+[x[1] for x in PAGINAS_B if x[0]=='/'+rel+'/'][0]]
    elif rel=='contato': cand=['content/contato.html']
    elif ('/'+rel+'/') in [x[0] for x in FERRAMENTAS]: cand=['content/'+[x[1] for x in FERRAMENTAS if x[0]=='/'+rel+'/'][0]]
    else: cand=[rel+'/index.html']
    f=cand[0]
    try:
        if _sp.run(['git','-C',SITE,'status','--porcelain','--',f],capture_output=True,text=True).stdout.strip(): return _HOJE
        d=_sp.run(['git','-C',SITE,'log','-1','--format=%cs','--',f],capture_output=True,text=True).stdout.strip()
        return d or _HOJE
    except Exception: return _HOJE
open(SITE+'/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{u}</loc><lastmod>{_lastmod(u)}</lastmod></url>\n' for u in urls)+'</urlset>\n')

# 404 (GitHub Pages serve /404.html automaticamente)
NF='''  <article class="art">
    <div class="wrap">
      <p class="eyebrow">Erro 404</p>
      <h1>Esta página não existe</h1>
      <p class="lead">O endereço pode ter sido digitado errado ou a página mudou de lugar. Veja abaixo os caminhos mais procurados.</p>
      <div class="cards">
        <a href="/leilao/"><strong>Financiamento atrasado</strong><span>Defesa do devedor na alienação fiduciária: intimação, consolidação, leilão.</span></a>
        <a href="/guia/"><strong>Guias por situação</strong><span>Explicações em linguagem simples para cada fase.</span></a>
        <a href="/contato/"><strong>Contato</strong><span>Explique a sua situação ao escritório.</span></a>
        <a href="/imovel-em-garantia/"><strong>Imóvel dado em garantia</strong><span>Casa em garantia de dívida da empresa, fiança e bem de família.</span></a>
        <a href="/penhora-de-imovel/"><strong>Imóvel penhorado</strong><span>Penhora, avaliação e leilão judicial.</span></a>
        <a href="/penhora-de-imovel/divida-de-condominio/"><strong>Dívida de condomínio, IPTU ou ITR</strong><span>Quando a dívida do próprio imóvel leva à penhora.</span></a>
        <a href="/blog/"><strong>Blog</strong><span>Novidades e alertas sobre leilão de imóveis.</span></a>
        <a href="/"><strong>Página inicial</strong><span>Comece pelo início.</span></a>
      </div>
    </div>
  </article>'''
page('/404.html','Página não encontrada | FCE Advogados','A página que você procura não existe. Veja os guias, a calculadora e o atendimento da FCE Advogados.','https://fceadvogados.com.br/',NF,{"@context":"https://schema.org","@type":"WebPage","name":"Página não encontrada"},'404','<meta name="robots" content="noindex">')
_nf=open(SITE+'/404.html',encoding='utf-8').read().replace('<link rel="canonical" href="https://fceadvogados.com.br/">','')
open(SITE+'/404.html','w',encoding='utf-8').write(_nf)
print('ok')

import re
IDX2=open(SITE+'/index.html',encoding='utf-8').read()
DESTAQUE=['como-saber-se-meu-imovel-vai-a-leilao','intimacao-do-cartorio-parcelas-atrasadas','propriedade-consolidada-no-nome-do-banco','direito-de-preferencia-recomprar-imovel-antes-do-leilao','o-banco-pode-leiloar-minha-casa','saldo-do-leilao-como-receber']
lis=''.join(f'<li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>' for sl in DESTAQUE for g in G if g['slug']==sl)+''.join(f'<li><a href="{x[0]}">{html.escape(x[4])}</a></li>' for x in PAGINAS_B if x[0] in ('/imovel-em-garantia/bem-de-familia/','/imovel-em-garantia/fiador/','/penhora-de-imovel/','/penhora-de-imovel/divida-de-condominio/','/penhora-de-imovel/iptu/'))
IDX2=re.sub(r'<ul class="guias-list">.*?</ul>','<ul class="guias-list">'+lis+'</ul>',IDX2,1,flags=re.S)
open(SITE+'/index.html','w',encoding='utf-8').write(IDX2)
