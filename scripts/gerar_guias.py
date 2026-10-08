import json, re, os, html
import glob
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/guias/*.json')],key=lambda g:(g.get('ordem',999),g['slug']))
IDX=open(SITE+'/index.html',encoding='utf-8').read()
style=IDX[IDX.index('<style>'):IDX.index('</style>')+8]
header=IDX[IDX.index('<header class="top">'):IDX.index('</header>')+9]
tail=IDX[IDX.index('<footer>'):]
# --- Menu da área do investidor ---
INV_SLUGS=['comprar-imovel-em-leilao-checklist-do-edital','riscos-de-comprar-imovel-em-leilao','iptu-e-condominio-imovel-arrematado-quem-paga','arrematei-imovel-ocupado-desocupacao','leilao-judicial-ou-extrajudicial-diferencas']
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
  .replace('<span class="brand-tag">Leilão de<br>imóveis</span>','<span class="brand-tag">Para<br>investidores</span>')
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
TEMA_JS='''<script>(function(){try{var t=localStorage.getItem("tema");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>'''
def page(path, title, desc, canon, body, ld, tag, robots=''):
    body=body.replace('{{ATUALIZADO}}', MES_ATUAL)
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
<link rel="stylesheet" media="print" onload="this.media='all'" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700&family=Red+Hat+Text:wght@400;500;600&family=Red+Hat+Mono:wght@500&display=swap"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700&family=Red+Hat+Text:wght@400;500;600&family=Red+Hat+Mono:wght@500&display=swap"></noscript>
{style}
{ART_CSS}
<script src="/js/medicao.js" defer></script>
</head>
<body>

{_marca(fix(header_inv if tag.startswith('investidor') else header,tag),path)}

<main id="inicio">
{body}
  <section class="final">
    <div class="wrap">
      <div class="box">
        <div>
          <h2>Conte o que está acontecendo</h2>
          <p>Pelo WhatsApp, a qualquer hora. {'Se tiver a notificação, o auto de apreensão ou o contrato, já pode enviar.' if tag=='veiculo' else ('Se tiver o contrato, os aditivos ou a matrícula, já pode enviar.' if tag.startswith('empresario') else ('Se tiver o edital ou o link do leilão, já pode enviar.' if tag.startswith('investidor') else 'Se tiver a intimação, a matrícula ou o edital, já pode enviar.'))}</p>
        </div>
        <a class="btn btn-primary wa" href="https://emerim.app.n8n.cloud/webhook/fce-wa?c=site&amp;p={tag}">Conversar pelo WhatsApp</a>
      </div>
    </div>
  </section>
</main>

{fix(tail,tag)}
'''
    os.makedirs(os.path.dirname(SITE+path), exist_ok=True)
    open(SITE+path,'w',encoding='utf-8').write(h)
ORG={"@id":"https://fceadvogados.com.br/#escritorio"}
AUT={"@type":"Person","@id":"https://fceadvogados.com.br/sobre/#fabio","name":"Fábio de Castro Emerim","jobTitle":"Advogado","identifier":"OAB/RS 88.912","url":"https://fceadvogados.com.br/sobre/"}
INV_BOX='<aside class="eb-box"><p class="eyebrow">Antes do lance</p><strong>Faça a conta e confira os riscos do imóvel</strong><p>A calculadora mostra até quanto vale dar de lance para ter o retorno que você quer. O guia gratuito traz os 20 pontos para conferir no edital, na matrícula e no processo.</p><p style="display:flex;flex-wrap:wrap;gap:.6rem;margin:0"><a class="btn btn-primary" href="/investidor/calculadora/">Calcular o lance máximo</a><a class="btn btn-ghost" href="/investidor/guia/?o=TAG">Baixar o guia gratuito</a><a class="btn btn-ghost" href="/investidor/#analise">Análise pré-lance</a></p></aside>'
DEV_BOX='<aside class="eb-box"><p class="eyebrow">Imóvel em risco</p><strong>Veja quanto do seu imóvel está em jogo</strong><p>O simulador estima o patrimônio em risco em cada fase. O guia gratuito explica o caminho da intimação ao leilão, com checklist de documentos.</p><p style="display:flex;flex-wrap:wrap;gap:.6rem;margin:0"><a class="btn btn-primary" href="/calculadora/">Simular agora</a><a class="btn btn-ghost" href="/ebook/?o=TAG">Baixar o guia gratuito</a></p></aside>'
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
{'' if inv else _fases(g['slug'])}
{g["corpo"]}
      {(INV_BOX if inv else DEV_BOX).replace('TAG','guia-'+g['slug'][:40])}
      <p class="crumb">Por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656). Conteúdo informativo; não substitui a análise individual do caso.</p>
      <nav class="rel" aria-label="Outros guias"><p class="eyebrow">{'Mais guias para quem compra em leilão' if inv else 'Outros guias'}</p><ul>{outros}<li><a href="{'/investidor/' if inv else '/guia/'}">{'Área do investidor: análise pré-lance' if inv else 'Todos os guias por situação'}</a></li></ul></nav>
    </div>
  </article>'''
    bc=[("Início","https://fceadvogados.com.br/"),("Investidores","https://fceadvogados.com.br/investidor/")] if inv else [("Início","https://fceadvogados.com.br/"),("Guias","https://fceadvogados.com.br/guia/")]
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"Article","headline":g["titulo"],"description":g["desc"],"inLanguage":"pt-BR","mainEntityOfPage":url,"author":AUT,"publisher":ORG,"datePublished":g.get("data","2026-10-03"),"dateModified":g.get("atualizado",g.get("data","2026-10-03")),"image":"https://fceadvogados.com.br/img/og-fce.jpg"},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":u} for i,(n,u) in enumerate(bc+[(g["titulo"],url)])]}]}
    page(f'/guia/{g["slug"]}/index.html', g["seo"], g["desc"], url, body, ld, 'investidor-artigo' if inv else 'guia')
_card=lambda g:f'<a href="/guia/{g["slug"]}/"><strong>{html.escape(g["titulo"])}</strong><span>{html.escape(g["desc"])}</span></a>'
cards=('<h2>Para quem tem imóvel financiado em risco</h2><div class="cards">'+''.join(_card(g) for g in G if g['slug'] not in INV_SLUGS)+'</div><p style="margin-top:1rem"><a href="/calculadora/">Simule quanto do seu imóvel está em jogo</a> · <a href="/ebook/">Guia gratuito em PDF</a></p>'
      +'<h2>Para quem quer comprar imóvel em leilão</h2><div class="cards">'+''.join(_card(g) for g in GI)+'</div><p style="margin-top:1rem"><a href="/investidor/calculadora/">Calculadora do lance máximo</a> · <a href="/investidor/guia/">Guia gratuito: 20 pontos antes do lance</a> · <a href="/investidor/">Análise pré-lance</a></p>')
body=f'''  <article class="art">
    <div class="wrap">
      <p class="crumb"><a href="/">Início</a> › Guias</p>
      <p class="eyebrow">Leilão de imóveis</p>
      <h1>Guias sobre leilão de imóveis e alienação fiduciária</h1>
      <p class="lead">Explicações em linguagem simples para cada fase: da intimação do cartório à desocupação do imóvel arrematado.</p>
      {cards}
    </div>
  </article>'''
ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Guias sobre leilão de imóveis","url":"https://fceadvogados.com.br/guia/","publisher":ORG}
page('/guia/index.html','Guias sobre leilão de imóveis e alienação fiduciária | FCE Advogados','Guias da FCE Advogados sobre intimação do cartório, consolidação da propriedade, leilão extrajudicial e desocupação de imóvel arrematado.','https://fceadvogados.com.br/guia/',body,ld,'guia')
SOBRE=open(SITE+'/content/sobre.html',encoding='utf-8').read()
ldp={"@context":"https://schema.org","@graph":[{"@type":"ProfilePage","url":"https://fceadvogados.com.br/sobre/","mainEntity":{"@id":"https://fceadvogados.com.br/sobre/#fabio"}},
 {"@type":"Person","@id":"https://fceadvogados.com.br/sobre/#fabio","name":"Fábio de Castro Emerim","jobTitle":"Advogado","identifier":"OAB/RS 88.912","image":"https://fceadvogados.com.br/img/fabio.jpg","worksFor":ORG,"url":"https://fceadvogados.com.br/sobre/","sameAs":["https://www.linkedin.com/in/fabioemerimadv"],"knowsAbout":["Leilão de imóveis","Alienação fiduciária","Lei 9.514/97","Execução civil","Execução fiscal","Direito tributário"],"hasCredential":{"@type":"EducationalOccupationalCredential","credentialCategory":"Inscrição profissional","name":"OAB/RS 88.912","recognizedBy":{"@type":"Organization","name":"Ordem dos Advogados do Brasil, Seccional do Rio Grande do Sul"}},"memberOf":[{"@type":"Organization","name":"Ordem dos Advogados do Brasil, Seccional do Rio Grande do Sul"}],"hasOccupation":[{"@type":"Occupation","name":"Advogado"},{"@type":"Occupation","name":"Procurador Municipal"}],"address":{"@type":"PostalAddress","addressLocality":"Novo Hamburgo","addressRegion":"RS","addressCountry":"BR"}}]}
page('/sobre/index.html','Fábio de Castro Emerim, advogado (OAB/RS 88.912) | FCE Advogados','Fábio de Castro Emerim, advogado em Novo Hamburgo/RS, sócio da FCE Advogados: leilão de imóveis e alienação fiduciária, execução civil desde 2013 e fiscal desde 2017.','https://fceadvogados.com.br/sobre/',SOBRE,ldp,'sobre')
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
page('/ebook/index.html','Guia gratuito: parcelas atrasadas do imóvel financiado (PDF) | FCE Advogados','Baixe grátis o guia em PDF sobre parcelas atrasadas e alienação fiduciária: da intimação do cartório ao leilão, com checklist de documentos.','https://fceadvogados.com.br/ebook/',EB,lde,'ebook')
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
page('/empresario/index.html','Imóvel em garantia de empréstimo da empresa: guia gratuito (PDF) | FCE Advogados','Deu a sede, o galpão ou a casa em garantia de empréstimo da empresa? Guia gratuito sobre o que acontece se as parcelas atrasarem: cartório, aditivos e leilão.','https://fceadvogados.com.br/empresario/',EM,ldm,'empresario')
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
page('/investidor/guia/index.html','Guia gratuito: 20 pontos antes do lance no leilão de imóveis (PDF) | FCE Advogados','Baixe grátis o checklist do investidor em leilão de imóveis: edital, matrícula, dívidas, ocupação, riscos de anulação e a conta completa antes do lance.','https://fceadvogados.com.br/investidor/guia/',IG,ldg,'investidor-guia')
OBI=OB.replace('/ebook/fce-guia-parcelas-atrasadas.pdf','/investidor/guia/fce-guia-investidor-20-pontos.pdf').replace('Se preferir, comece pelo capítulo 2, “A linha do tempo”, e pelo quadro “Onde você está agora?”, na última parte.','O checklist dos 20 pontos está numa página só, no final: salve e use em cada imóvel. Para analisar um imóvel específico, veja a <a href="/investidor/">análise pré-lance</a>.')
page('/investidor/guia/obrigado/index.html','Seu guia gratuito | FCE Advogados','Download do guia gratuito para investidores em leilão de imóveis.','https://fceadvogados.com.br/investidor/guia/obrigado/',OBI,{"@context":"https://schema.org","@type":"WebPage","name":"Download do guia"},'investidor-obrigado','<meta name="robots" content="noindex">')
PR=open(SITE+'/content/privacidade.html',encoding='utf-8').read()
page('/privacidade/index.html','Política de privacidade | FCE Advogados','Como a FCE Advogados trata dados pessoais de visitantes, contatos e clientes, nos termos da LGPD.','https://fceadvogados.com.br/privacidade/',PR,{"@context":"https://schema.org","@type":"WebPage","name":"Política de privacidade","url":"https://fceadvogados.com.br/privacidade/","publisher":ORG},'privacidade')
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
page('/veiculo/index.html','Busca e apreensão de veículo: defesa e revisional | FCE Advogados','Carro, moto ou caminhão financiado com parcelas atrasadas ou apreendido? Defesa na busca e apreensão, na Justiça ou no cartório, e revisão dos juros.','https://fceadvogados.com.br/veiculo/',VH,ldv,'veiculo')
# paginas por cidade (atendimento local)
CID=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/cidades/*.json')],key=lambda c:c.get('ordem',99))
CIDN={c['slug']:c for c in CID}
for c in CID:
    url=f'https://fceadvogados.com.br/leilao-de-imoveis/{c["slug"]}/'
    nh=c['slug']=='novo-hamburgo'; sp=c['uf']=='SP'
    onde='no escritório, na Rua Araguaia, 509, Jardim Mauá' if nh else ('por videochamada' if sp else 'por videochamada ou presencialmente no escritório em Novo Hamburgo')
    faq=[
      ('Onde fica o escritório?' if nh else 'Preciso ir ao escritório em Novo Hamburgo?',
       'Na Rua Araguaia, 509, Jardim Mauá, Novo Hamburgo/RS. A consulta pode ser presencial ou por videochamada, como for melhor para você.' if nh else
       ('Não. A conversa começa pelo WhatsApp e a consulta é por videochamada. Os documentos são enviados digitalmente e os processos são eletrônicos.' if sp else
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
      {"@type":"Service","serviceType":"Advocacia em leilão de imóveis e alienação fiduciária","provider":ORG,"areaServed":{"@type":"City","name":c["nome"],"containedInPlace":{"@type":"State","name":"Rio Grande do Sul" if c["uf"]=="RS" else "São Paulo"}},"url":url},
      {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in faq]},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"https://fceadvogados.com.br/"},{"@type":"ListItem","position":2,"name":"Atendimento por cidade","item":"https://fceadvogados.com.br/leilao-de-imoveis/"},{"@type":"ListItem","position":3,"name":c["nome"],"item":url}]}]}
    page(f'/leilao-de-imoveis/{c["slug"]}/index.html', c['seo'], c['desc'], url, body, ld, 'cidade-'+c['slug'])
cards=''.join(f'<a href="/leilao-de-imoveis/{c["slug"]}/"><strong>Leilão de imóveis em {html.escape(c["nome"])}/{c["uf"]}</strong><span>{html.escape(c["desc"])}</span></a>' for c in CID)
body=f'''  <article class="art">
    <div class="wrap" style="max-width:var(--wrap)">
      <p class="crumb"><a href="/">Início</a> › Atendimento por cidade</p>
      <p class="eyebrow">Leilão de imóveis</p>
      <h1>Advogado para leilão de imóveis: atendimento por cidade</h1>
      <p class="lead">O escritório fica em Novo Hamburgo/RS e atende presencialmente na Região Metropolitana de Porto Alegre e por videochamada em todo o Brasil, com foco no Rio Grande do Sul e em São Paulo. Escolha a sua cidade para ver como funciona o caminho do leilão aí.</p>
      <div class="cards">{cards}</div>
      <p style="margin-top:1.5rem">Não encontrou a sua cidade? O atendimento online funciona do mesmo jeito: a conversa começa pelo WhatsApp, a consulta é por vídeo e os processos são eletrônicos.</p>
    </div>
  </article>'''
ldc={"@context":"https://schema.org","@type":"CollectionPage","name":"Advogado para leilão de imóveis: atendimento por cidade","url":"https://fceadvogados.com.br/leilao-de-imoveis/","publisher":ORG}
page('/leilao-de-imoveis/index.html','Advogado para leilão de imóveis por cidade (RS e SP) | FCE Advogados','Atendimento em leilão de imóveis por cidade: Porto Alegre, Novo Hamburgo, Canoas e São Paulo, presencial na Região Metropolitana e online em todo o Brasil.','https://fceadvogados.com.br/leilao-de-imoveis/',body,ldc,'cidades')
# paginas feitas a mao (calculadoras): mesmo rodape e menu do resto do site
_FCSS=IDX[IDX.index('footer .flinks{'):IDX.index('footer .aviso{')]
for _p,_hd,_tg in (('/calculadora/index.html',None,'calculadora'),('/investidor/calculadora/index.html',header_inv,'calc-investidor')):
    _s=open(SITE+_p,encoding='utf-8').read()
    _s=_s[:_s.index('<footer>')]+tail[:tail.index('</footer>')+9].replace('href="#','href="/#')+_s[_s.index('</footer>')+9:]
    if _hd:
        _h=fix(_hd,_tg).replace('href="/investidor/calculadora/">','href="/investidor/calculadora/" aria-current="page">',1)
        _s=_s[:_s.index('<header class="top">')]+_h+_s[_s.index('</header>')+9:]
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
_servico('/leilao/','Advogado para leilão de imóvel financiado: defesa do devedor | FCE Advogados','Parcelas atrasadas, intimação do cartório ou leilão marcado? Defesa do devedor na alienação fiduciária: análise do procedimento, suspensão do leilão, preferência e saldo.','Defesa do devedor na alienação fiduciária','leilao.html','leilao')
_servico('/suspensao-de-leilao/','Suspensão de leilão de imóvel: como funciona o pedido urgente | FCE Advogados','Leilão do imóvel marcado? O pedido judicial de suspensão: quando cabe, o que precisa provar, se exige depósito, prazos e o que acontece depois da liminar.','Suspensão de leilão de imóvel','suspensao.html','suspensao')
# sitemap
urls=['https://fceadvogados.com.br/','https://fceadvogados.com.br/leilao/','https://fceadvogados.com.br/suspensao-de-leilao/','https://fceadvogados.com.br/calculadora/','https://fceadvogados.com.br/sobre/','https://fceadvogados.com.br/ebook/','https://fceadvogados.com.br/blog/','https://fceadvogados.com.br/guia/']+[f'https://fceadvogados.com.br/guia/{g["slug"]}/' for g in G]+[f'https://fceadvogados.com.br/blog/{b["slug"]}/' for b in B]+['https://fceadvogados.com.br/veiculo/']+[f'https://fceadvogados.com.br/veiculo/{g["slug"]}/' for g in V]+['https://fceadvogados.com.br/empresario/','https://fceadvogados.com.br/investidor/','https://fceadvogados.com.br/investidor/guia/','https://fceadvogados.com.br/investidor/calculadora/','https://fceadvogados.com.br/leilao-de-imoveis/']+[f'https://fceadvogados.com.br/leilao-de-imoveis/{c["slug"]}/' for c in CID]+['https://fceadvogados.com.br/privacidade/']
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
        <a href="/leilao/"><strong>Imóvel financiado em risco</strong><span>Defesa do devedor na alienação fiduciária: intimação, consolidação, leilão.</span></a>
        <a href="/guia/"><strong>Guias por situação</strong><span>Explicações em linguagem simples para cada fase.</span></a>
        <a href="/calculadora/"><strong>Calculadora</strong><span>Quanto do seu imóvel está em jogo em cada fase.</span></a>
        <a href="/investidor/"><strong>Comprar imóvel em leilão</strong><span>Análise pré-lance e assessoria na arrematação.</span></a>
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
lis=''.join(f'<li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>' for g in G)
IDX2=re.sub(r'<ul class="guias-list">.*?</ul>','<ul class="guias-list">'+lis+'</ul>',IDX2,1,flags=re.S)
open(SITE+'/index.html','w',encoding='utf-8').write(IDX2)
