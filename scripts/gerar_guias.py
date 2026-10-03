import json, re, os, html
import glob
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G=sorted([json.load(open(f,encoding='utf-8')) for f in glob.glob(SITE+'/content/guias/*.json')],key=lambda g:(g.get('ordem',999),g['slug']))
IDX=open(SITE+'/index.html',encoding='utf-8').read()
style=IDX[IDX.index('<style>'):IDX.index('</style>')+8]
header=IDX[IDX.index('<header class="top">'):IDX.index('</header>')+9]
tail=IDX[IDX.index('<footer>'):]
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
</style>'''
def fix(s, tag):
    s=s.replace('href="#inicio"','href="/"')
    s=re.sub(r'href="#([a-z]+)"', r'href="/#\1"', s)
    s=s.replace('p=home', 'p='+tag)
    return s
def page(path, title, desc, canon, body, ld, tag):
    h=f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="icon" href="/img/logo.svg">
<link rel="canonical" href="{canon}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="FCE Advogados">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{canon}">
<meta property="og:image" content="https://fceadvogados.com.br/img/whatsapp-perfil.jpg">
<meta property="og:locale" content="pt_BR">
<script type="application/ld+json">{json.dumps(ld,ensure_ascii=False)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" media="print" onload="this.media='all'" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700;800&family=Red+Hat+Text:wght@400;500;600;700&family=Red+Hat+Mono:wght@500&display=swap"><noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@500;600;700;800&family=Red+Hat+Text:wght@400;500;600;700&family=Red+Hat+Mono:wght@500&display=swap"></noscript>
{style}
{ART_CSS}
</head>
<body>

{fix(header,tag)}

<main id="inicio">
{body}
  <section class="final">
    <div class="wrap">
      <div class="box">
        <div>
          <h2>Conte o que está acontecendo</h2>
          <p>Pelo WhatsApp, a qualquer hora. Se tiver a intimação, a matrícula ou o edital, já pode enviar.</p>
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
for g in G:
    url=f'https://fceadvogados.com.br/guia/{g["slug"]}/'
    outros=''.join(f'<li><a href="/guia/{o["slug"]}/">{html.escape(o["titulo"])}</a></li>' for o in G if o is not g)
    body=f'''  <article class="art">
    <div class="wrap">
      <p class="crumb"><a href="/">Início</a> › <a href="/guia/">Guias</a></p>
      <p class="eyebrow">{g["eyebrow"]}</p>
      <h1>{html.escape(g["titulo"])}</h1>
      <p class="lead">{g["lead"]}</p>
{g["corpo"]}
      <p><a href="/calculadora/">Simule quanto do seu imóvel está em jogo</a> ou fale com o escritório pelo WhatsApp.</p>
      <p class="crumb">Por <a href="/sobre/">Fábio de Castro Emerim</a>, advogado (OAB/RS 88.912), sócio da FCE Advogados (OAB/RS 15.656). Conteúdo informativo; não substitui a análise individual do caso.</p>
      <nav class="rel" aria-label="Outros guias"><p class="eyebrow">Outros guias</p><ul>{outros}</ul></nav>
    </div>
  </article>'''
    ld={"@context":"https://schema.org","@graph":[
      {"@type":"Article","headline":g["titulo"],"description":g["desc"],"inLanguage":"pt-BR","mainEntityOfPage":url,"author":AUT,"publisher":ORG,"datePublished":g.get("data","2026-10-03"),"dateModified":g.get("data","2026-10-03"),"image":"https://fceadvogados.com.br/img/whatsapp-perfil.jpg"},
      {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Início","item":"https://fceadvogados.com.br/"},{"@type":"ListItem","position":2,"name":"Guias","item":"https://fceadvogados.com.br/guia/"},{"@type":"ListItem","position":3,"name":g["titulo"],"item":url}]}]}
    page(f'/guia/{g["slug"]}/index.html', g["seo"], g["desc"], url, body, ld, 'guia')
cards=''.join(f'<a href="/guia/{g["slug"]}/"><strong>{html.escape(g["titulo"])}</strong><span>{html.escape(g["desc"])}</span></a>' for g in G)
body=f'''  <article class="art">
    <div class="wrap">
      <p class="crumb"><a href="/">Início</a> › Guias</p>
      <p class="eyebrow">Leilão de imóveis</p>
      <h1>Guias sobre leilão de imóveis e alienação fiduciária</h1>
      <p class="lead">Explicações em linguagem simples para cada fase: da intimação do cartório à desocupação do imóvel arrematado.</p>
      <div class="cards">{cards}</div>
    </div>
  </article>'''
ld={"@context":"https://schema.org","@type":"CollectionPage","name":"Guias sobre leilão de imóveis","url":"https://fceadvogados.com.br/guia/","publisher":ORG}
page('/guia/index.html','Guias sobre leilão de imóveis e alienação fiduciária | FCE Advogados','Guias da FCE Advogados sobre intimação do cartório, consolidação da propriedade, leilão extrajudicial e desocupação de imóvel arrematado.','https://fceadvogados.com.br/guia/',body,ld,'guia')
SOBRE=open(SITE+'/content/sobre.html',encoding='utf-8').read()
ldp={"@context":"https://schema.org","@graph":[{"@type":"ProfilePage","url":"https://fceadvogados.com.br/sobre/","mainEntity":{"@id":"https://fceadvogados.com.br/sobre/#fabio"}},
 {"@type":"Person","@id":"https://fceadvogados.com.br/sobre/#fabio","name":"Fábio de Castro Emerim","jobTitle":"Advogado","identifier":"OAB/RS 88.912","image":"https://fceadvogados.com.br/img/fabio.jpg","worksFor":ORG,"url":"https://fceadvogados.com.br/sobre/","sameAs":["https://www.linkedin.com/in/fabioemerimadv"],"knowsAbout":["Leilão de imóveis","Alienação fiduciária","Execução civil","Execução fiscal","Direito tributário"],"address":{"@type":"PostalAddress","addressLocality":"Novo Hamburgo","addressRegion":"RS","addressCountry":"BR"}}]}
page('/sobre/index.html','Fábio de Castro Emerim, advogado (OAB/RS 88.912) | FCE Advogados','Fábio de Castro Emerim, advogado em Novo Hamburgo/RS, sócio da FCE Advogados. Atuação em leilões de imóveis, execuções cíveis desde 2013 e execução fiscal desde 2017.','https://fceadvogados.com.br/sobre/',SOBRE,ldp,'sobre')
# sitemap
urls=['https://fceadvogados.com.br/','https://fceadvogados.com.br/calculadora/','https://fceadvogados.com.br/sobre/','https://fceadvogados.com.br/guia/']+[f'https://fceadvogados.com.br/guia/{g["slug"]}/' for g in G]
open(SITE+'/sitemap.xml','w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{u}</loc><lastmod>2026-10-03</lastmod></url>\n' for u in urls)+'</urlset>\n')
print('ok')

import re
IDX2=open(SITE+'/index.html',encoding='utf-8').read()
lis=''.join(f'<li><a href="/guia/{g["slug"]}/">{html.escape(g["titulo"])}</a></li>' for g in G)
IDX2=re.sub(r'<ul class="guias-list">.*?</ul>','<ul class="guias-list">'+lis+'</ul>',IDX2,1,flags=re.S)
open(SITE+'/index.html','w',encoding='utf-8').write(IDX2)
