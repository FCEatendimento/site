import json, re, os, html
import glob
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/guias/*.json')],key=lambda g:(g.get('ordem',999),g['slug']))
IDX=open(SITE+'/index.html',encoding='utf-8').read()
style=IDX[IDX.index('<style>'):IDX.index('</style>')+8]
header=IDX[IDX.index('<header class="top">'):IDX.index('</header>')+9]
tail=IDX[IDX.index('<footer>'):]
# --- Menu da área do investidor ---
INV_SLUGS=['comprar-imovel-em-leilao-checklist-do-edital','iptu-e-condominio-imovel-arrematado-quem-paga','arrematei-imovel-ocupado-desocupacao','leilao-judicial-ou-extrajudicial-diferencas']
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
def page(path, title, desc, canon, body, ld, tag, robots=''):
    body=body.replace('{{ATUALIZADO}}', MES_ATUAL)
    h=f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
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
<link rel="stylesheet" media="print" onload="this.media='all'" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700;800&family=Red+Hat+Text:wght@400;500;600;700&family=Red+Hat+Mono:wght@500&display=swap"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700;800&family=Red+Hat+Text:wght@400;500;600;700&family=Red+Hat+Mono:wght@500&display=swap"></noscript>
{style}
{ART_CSS}
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
{g["corpo"]}
      {(INV_BOX if inv else DEV_BOX).replace('TAG','guia-'+g['slug'][:40])}
      <p class="crumb">Por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656). Conteúdo informativo; não substitui a análise individual do caso.</p>
      <nav class="rel" aria-label="Outros guias"><p class="eyebrow">{'Mais guias para quem compra em leilão' if inv else 'Outros guias'}</p><ul>{outros}<li><a href="{'/investidor/' if inv else '/guia/'}">{'Área do investidor: análise pré-lance' if inv else 'Todos os guias por situação'}</a></li></ul></nav>
    </div>
  </article>'''
    bc=[("Início","https://fceadvogados.com.br/"),("Investidores","https://fceadvogados.com.br/investidor/")] if inv else [("Início","https://fceadvogados.com.br/"),("Guias","https://fceadvogados.com.br/guia/")]
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"Article","headline":g["titulo"],"description":g["desc"],"inLanguage":"pt-BR","mainEntityOfPage":url,"author":AUT,"publisher":ORG,"datePublished":g.get("data","2026-10-03"),"dateModified":g.get("data","2026-10-03"),"image":"https://fceadvogados.com.br/img/og-fce.jpg"},
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
 {"@type":"Person","@id":"https://fceadvogados.com.br/sobre/#fabio","name":"Fábio de Castro Emerim","jobTitle":"Advogado","identifier":"OAB/RS 88.912","image":"https://fceadvogados.com.br/img/fabio.jpg","worksFor":ORG,"url":"https://fceadvogados.com.br/sobre/","sameAs":["https://www.linkedin.com/in/fabioemerimadv"],"knowsAbout":["Leilão de imóveis","Alienação fiduciária","Execução civil","Execução fiscal","Direito tributário"],"address":{"@type":"PostalAddress","addressLocality":"Novo Hamburgo","addressRegion":"RS","addressCountry":"BR"}}]}
page('/sobre/index.html','Fábio de Castro Emerim, advogado (OAB/RS 88.912) | FCE Advogados','Fábio de Castro Emerim, advogado em Novo Hamburgo/RS, sócio da FCE Advogados. Atuação em leilões de imóveis, execuções cíveis desde 2013 e execução fiscal desde 2017.','https://fceadvogados.com.br/sobre/',SOBRE,ldp,'sobre')
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
page('/empresario/index.html','Imóvel dado em garantia de empréstimo da empresa: guia gratuito (PDF) | FCE Advogados','Deu a sede, o galpão ou a casa em garantia de um empréstimo da empresa? Guia gratuito sobre o que acontece se as parcelas atrasarem: cartório, aditivos, recuperação judicial e leilão.','https://fceadvogados.com.br/empresario/',EM,ldm,'empresario')
OBM=OB.replace('/ebook/fce-guia-parcelas-atrasadas.pdf','/empresario/fce-guia-imovel-em-garantia.pdf').replace('comece pelo capítulo 2, “A linha do tempo”','comece pelo capítulo 3, “A linha do tempo”')
page('/empresario/obrigado/index.html','Seu guia gratuito | FCE Advogados','Download do guia gratuito para empresários sobre imóvel dado em garantia.','https://fceadvogados.com.br/empresario/obrigado/',OBM,{"@context":"https://schema.org","@type":"WebPage","name":"Download do guia"},'empresario-obrigado','<meta name="robots" content="noindex">')
# area do investidor
IV=open(SITE+'/content/investidor.html',encoding='utf-8').read().replace('{{GUIAS}}',''.join(f'<a href="/guia/{g["slug"]}/"><strong>{html.escape(g["titulo"])}</strong><span>{html.escape(g["desc"])}</span></a>' for g in GI))
faqi=[{"@type":"Question","name":html.unescape(m.group(1)),"acceptedAnswer":{"@type":"Answer","text":html.unescape(m.group(2))}} for m in re.finditer(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>',IV,re.S)]
def _bci(*itens): return {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":i+1,"name":n,"item":u} for i,(n,u) in enumerate((("Início","https://fceadvogados.com.br/"),)+itens)]}
ldi={"@context":"https://schema.org","@graph":[{"@type":"WebPage","name":"Comprar imóvel em leilão com segurança jurídica","url":"https://fceadvogados.com.br/investidor/","publisher":ORG,"author":AUT},{"@type":"FAQPage","mainEntity":faqi},_bci(("Investidores","https://fceadvogados.com.br/investidor/"))]}
page('/investidor/index.html','Advogado para comprar imóvel em leilão: análise pré-lance | FCE Advogados','Análise jurídica antes do lance e assessoria na compra de imóvel em leilão: edital, matrícula, dívidas, ocupação, riscos e a conta completa. Atendimento em todo o Brasil.','https://fceadvogados.com.br/investidor/',IV,ldi,'investidor')
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
page('/veiculo/index.html','Busca e apreensão de veículo: defesa e revisional | FCE Advogados','Carro, moto ou caminhão financiado com parcelas atrasadas ou apreendido? Defesa na busca e apreensão, na Justiça ou no cartório, e revisão dos juros do financiamento.','https://fceadvogados.com.br/veiculo/',VH,ldv,'veiculo')
# paginas feitas a mao (calculadoras): mesmo rodape e menu do resto do site
_FCSS=IDX[IDX.index('footer .flinks{'):IDX.index('footer .aviso{')]
for _p,_hd,_tg in (('/calculadora/index.html',None,'calculadora'),('/investidor/calculadora/index.html',header_inv,'calc-investidor')):
    _s=open(SITE+_p,encoding='utf-8').read()
    _s=_s[:_s.index('<footer>')]+tail[:tail.index('</footer>')+9].replace('href="#','href="/#')+_s[_s.index('</footer>')+9:]
    if _hd:
        _h=fix(_hd,_tg).replace('href="/investidor/calculadora/">','href="/investidor/calculadora/" aria-current="page">',1)
        _s=_s[:_s.index('<header class="top">')]+_h+_s[_s.index('</header>')+9:]
    if 'footer .flinks{' not in _s: _s=_s.replace('footer .aviso{',_FCSS+'footer .aviso{',1)
    if '.top nav a[aria-current' not in _s: _s=_s.replace('</style>',_NAVCSS+'</style>',1)
    open(SITE+_p,'w',encoding='utf-8').write(_s)
# sitemap
urls=['https://fceadvogados.com.br/','https://fceadvogados.com.br/calculadora/','https://fceadvogados.com.br/sobre/','https://fceadvogados.com.br/ebook/','https://fceadvogados.com.br/blog/','https://fceadvogados.com.br/guia/']+[f'https://fceadvogados.com.br/guia/{g["slug"]}/' for g in G]+[f'https://fceadvogados.com.br/blog/{b["slug"]}/' for b in B]+['https://fceadvogados.com.br/veiculo/']+[f'https://fceadvogados.com.br/veiculo/{g["slug"]}/' for g in V]+['https://fceadvogados.com.br/empresario/','https://fceadvogados.com.br/investidor/','https://fceadvogados.com.br/investidor/guia/','https://fceadvogados.com.br/investidor/calculadora/','https://fceadvogados.com.br/privacidade/']
open(SITE+'/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{u}</loc><lastmod>2026-10-03</lastmod></url>\n' for u in urls)+'</urlset>\n')
print('ok')

import re
IDX2=open(SITE+'/index.html',encoding='utf-8').read()
lis=''.join(f'<li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>' for g in G)
IDX2=re.sub(r'<ul class="guias-list">.*?</ul>','<ul class="guias-list">'+lis+'</ul>',IDX2,1,flags=re.S)
open(SITE+'/index.html','w',encoding='utf-8').write(IDX2)
