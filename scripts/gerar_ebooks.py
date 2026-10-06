"""Gera os PDFs dos guias gratuitos (devedor, empresario, investidor) a partir de materiais/<guia>/corpo.html.
Grava "Atualizado em <mes>/<ano>" na capa e na pagina de abertura. Roda todo dia 1 pelo GitHub Actions (atualizacao-mensal.yml).
Uso: python scripts/gerar_ebooks.py   (requer: pip install playwright qrcode pypdf; python -m playwright install chromium)
"""
import os, re, base64, datetime, tempfile
from zoneinfo import ZoneInfo
import qrcode, qrcode.image.svg
from pypdf import PdfWriter, PdfReader
from playwright.sync_api import sync_playwright

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M = SITE + '/materiais'
MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
def mes_atual():
    d = datetime.datetime.now(ZoneInfo('America/Sao_Paulo'))
    return MESES[d.month - 1] + '/' + str(d.year)

GUIAS = [
  dict(pasta='devedor', saida='ebook/fce-guia-parcelas-atrasadas.pdf', titulo='Parcelas atrasadas do imóvel financiado',
       sub='O que acontece da intimação do cartório ao leilão, e o que ainda é possível fazer em cada fase', tag='Guia gratuito · Alienação fiduciária', qr=None),
  dict(pasta='empresario', saida='empresario/fce-guia-imovel-em-garantia.pdf', titulo='Imóvel dado em garantia',
       sub='O que acontece se as parcelas da empresa atrasarem, e o que ainda é possível fazer em cada fase', tag='Guia gratuito · Para empresários', qr='https://fceadvogados.com.br/calculadora/?o=guia-empresario'),
  dict(pasta='investidor', saida='investidor/guia/fce-guia-investidor-20-pontos.pdf', titulo='Leilão de imóveis sem surpresas',
       sub='20 pontos para conferir antes do lance: edital, matrícula, dívidas, ocupação e a conta completa', tag='Guia gratuito · Para investidores', qr='https://fceadvogados.com.br/investidor/?o=guia-investidor'),
]

def ff(fam, pkg, w):
    return f"@font-face{{font-family:'{fam}';font-weight:{w};src:url('file://{M}/fontes/{pkg}-latin-{w}-normal.woff2') format('woff2')}}"
fonts = '\n'.join([ff('RHD', 'red-hat-display', w) for w in (500, 700, 800)] + [ff('RHT', 'red-hat-text', w) for w in (400, 500, 600, 700)] + [ff('RHM', 'red-hat-mono', 500)])
logo_claro = open(SITE + '/img/logo-escuro.svg').read()
foto = 'data:image/jpeg;base64,' + base64.b64encode(open(SITE + '/img/fabio.jpg', 'rb').read()).decode()
BASE = '''
:root{--ink:#0E1A2B;--muted:#5A5A56;--line:#DCDCD7;--bg:#F6F6F4;--acc:#F2C200;--acc-soft:#FBF4D9;--acc-text:#7A5E00;--red:#A3372A;--red-soft:#F7E4E0}
*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:RHT,sans-serif;color:var(--ink);font-size:9.8pt;line-height:1.5}
h1,h2{font-family:RHD,sans-serif;line-height:1.15;margin:0}
'''

def montar(g, MES):
    TITULO, SUB, TAG = g['titulo'], g['sub'], g['tag']
    capa = f'''<!doctype html><html><head><meta charset="utf-8"><style>{fonts}{BASE}
    @page{{size:A5;margin:0}}
    .capa{{width:148mm;height:210mm;background:#0E1A2B;color:#ECECE8;padding:16mm 14mm 14mm;display:flex;flex-direction:column;position:relative;overflow:hidden}}
    .capa svg{{width:62mm;height:auto}}
    .capa .tag{{margin-top:34mm;font:500 8.5pt RHM,monospace;letter-spacing:.14em;text-transform:uppercase;color:#F2C200}}
    .capa h1{{font-size:30pt;font-weight:800;margin:4mm 0 6mm;color:#fff;letter-spacing:-.01em}}
    .capa p.sub{{font-size:12.5pt;line-height:1.45;color:#C9CDD3;max-width:112mm;margin:0}}
    .capa .faixa{{position:absolute;right:-14mm;bottom:52mm;display:flex;gap:4mm}}
    .capa .faixa i{{display:block;width:9mm;height:58mm;transform:skewX(-22deg)}}
    .capa .faixa i:first-child{{background:#8C8C8C}}.capa .faixa i:last-child{{background:#F2C200}}
    .capa .pe{{margin-top:auto;border-top:1px solid #22304A;padding-top:5mm;font-size:9pt;color:#A6A6A0;line-height:1.5}}
    .capa .pe strong{{color:#fff;font-family:RHD;font-size:11pt}}
    .capa .atual{{display:inline-block;margin-top:2.5mm;font:500 7.8pt RHM,monospace;letter-spacing:.12em;text-transform:uppercase;color:#F2C200}}
    </style></head><body><div class="capa">{logo_claro}
    <p class="tag">{TAG}</p>
    <h1>{TITULO}</h1><p class="sub">{SUB}</p>
    <div class="faixa"><i></i><i></i></div>
    <div class="pe"><strong>Fábio de Castro Emerim</strong><br>Advogado · OAB/RS 88.912 · FCE Advogados (OAB/RS 15.656)<br>Novo Hamburgo/RS · fceadvogados.com.br<br><span class="atual">Atualizado em {MES}</span></div></div></body></html>'''
    
    corpo = open(f"{M}/{g['pasta']}/corpo.html", encoding='utf-8').read().replace('FOTO', foto)
    if g['qr']:
        q = qrcode.make(g['qr'], image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1).to_string().decode()
        corpo = corpo.replace('QRSVG', re.sub(r'<\?xml[^>]*>', '', q))
    corpo = corpo.replace('<p class="nota">Este guia tem caráter informativo', f'<p class="nota"><strong>Atualizado em {MES}.</strong> Este guia tem caráter informativo', 1)
    miolo = f'''<!doctype html><html><head><meta charset="utf-8"><style>{fonts}{BASE}
    @page{{size:A5;margin:13mm 13mm 15mm}}
    section{{break-before:page}}section:first-child{{break-before:auto}}
    .k{{font:500 7.8pt RHM,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--acc-text);margin:0 0 2mm}}
    .num{{font:500 7.8pt RHM,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--acc-text);margin:0 0 2mm;padding-top:3mm;border-top:3pt solid var(--acc);display:inline-block}}
    h1{{font-size:17pt;font-weight:800;margin:0 0 3mm}}
    h2{{font-size:11.5pt;font-weight:700;margin:4.5mm 0 1.6mm}}
    p{{margin:0 0 3mm}}.lead{{font-size:10.6pt;color:var(--muted);margin-bottom:4mm}}
    ul,ol{{margin:0 0 3mm;padding-left:5mm}}li{{margin-bottom:1.6mm}}
    .box{{background:var(--acc-soft);border-left:3pt solid var(--acc);padding:3mm 4mm;margin:4mm 0;border-radius:0 2mm 2mm 0;break-inside:avoid}}.box p{{margin:0}}
    .box.alerta{{background:var(--red-soft);border-color:var(--red)}}
    .nota{{font-size:8.6pt;color:var(--muted)}}
    .sum-t{{margin-top:8mm}}
    .sumario{{list-style:none;padding:0;border-top:1px solid var(--line)}}
    .sumario li{{display:flex;gap:4mm;padding:2.2mm 0;border-bottom:1px solid var(--line);margin:0;font-weight:500}}
    .sumario span{{font:500 9pt RHM;color:var(--acc-text);width:5mm}}
    .tempo{{list-style:none;padding:0;margin:2mm 0 5mm;counter-reset:t}}
    .tempo li{{counter-increment:t;position:relative;padding:0 0 2.6mm 11mm;margin:0;break-inside:avoid}}
    .tempo li::before{{content:counter(t);position:absolute;left:0;top:-.5mm;width:7mm;height:7mm;border-radius:50%;background:var(--ink);color:#fff;font:700 9pt RHD;display:flex;align-items:center;justify-content:center}}
    .tempo li::after{{content:"";position:absolute;left:3.4mm;top:7mm;bottom:.5mm;width:.3mm;background:var(--line)}}
    .tempo li:last-child::after{{display:none}}
    .tempo b{{display:block;font-family:RHD;font-size:10.8pt}}.tempo span{{display:block;color:#333}}
    .erros{{list-style:none;padding:0;counter-reset:e}}
    .erros li{{counter-increment:e;padding:3mm 0 3mm 11mm;border-bottom:1px solid var(--line);position:relative;margin:0;break-inside:avoid}}
    .erros li::before{{content:counter(e);position:absolute;left:0;top:2.4mm;font:800 15pt RHD;color:var(--acc)}}
    .erros b{{display:block;font-family:RHD}}
    .check{{list-style:none;padding:0}}.check li{{padding-left:8mm;position:relative;margin-bottom:2.4mm}}
    .check li::before{{content:"";position:absolute;left:0;top:.6mm;width:3.6mm;height:3.6mm;border:1.2pt solid var(--ink);border-radius:.8mm}}
    .faq dt{{font-family:RHD;font-weight:700;margin-top:3.5mm}}.faq dd{{margin:1mm 0 0;color:#333}}
    .faq div,.faq dt{{break-after:avoid}}
    .onde{{width:100%;border-collapse:collapse;font-size:9.4pt;margin:2mm 0 5mm}}
    .onde th{{text-align:left;font:500 7.6pt RHM;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);border-bottom:1.2pt solid var(--ink);padding:2mm}}
    .onde td{{border-bottom:1px solid var(--line);padding:2.4mm 2mm;vertical-align:top}}.onde td:first-child{{font-weight:600;width:42%}}
    .qr{{display:flex;gap:5mm;align-items:center;background:var(--bg);border:1px solid var(--line);border-left:3pt solid var(--acc);border-radius:2mm;padding:4mm;margin:4mm 0;break-inside:avoid}}.qr svg{{width:28mm;height:28mm;display:block}}.qr p{{margin:0 0 1mm}}a{{color:var(--ink)}}
    .compacta td{{padding:1.3mm 2mm}}.compacta td:first-child{{width:62%}}.compacta{{margin-bottom:3mm}}.tempo.curto li{{padding-bottom:1.6mm}}
    .ficha td{{padding:3.6mm 2mm}}.ficha td:first-child{{width:62%}}.ficha td:last-child{{color:var(--muted);border-left:1px solid var(--line)}}
    .autor{{display:block}}.autor img{{width:34mm;height:34mm;object-fit:cover;border-radius:50%;margin:4mm 0 5mm}}
    .autor .contato{{margin-top:5mm;padding-top:4mm;border-top:1px solid var(--line)}}
    </style></head><body>{corpo}</body></html>'''
    
    pe = '<div style="width:100%;font:8px sans-serif;color:#8C8C8C;padding:0 14mm;display:flex;justify-content:space-between"><span>FCE Advogados · ' + TITULO + ' · atualizado em ' + MES + '</span><span class="pageNumber"></span></div>'
    return capa, miolo, pe

def main():
    MES = mes_atual()
    exe = os.environ.get('CHROMIUM_PATH') or None
    with sync_playwright() as p, tempfile.TemporaryDirectory() as tmp:
        b = p.chromium.launch(executable_path=exe)
        pg = b.new_page()
        for g in GUIAS:
            capa, miolo, pe = montar(g, MES)
            for nome, htm in (('capa', capa), ('miolo', miolo)):
                open(f'{tmp}/{nome}.html', 'w', encoding='utf-8').write(htm)
            pg.goto(f'file://{tmp}/capa.html'); pg.wait_for_timeout(400)
            pg.pdf(path=f'{tmp}/capa.pdf', format='A5', print_background=True, prefer_css_page_size=True)
            pg.goto(f'file://{tmp}/miolo.html'); pg.wait_for_timeout(400)
            pg.pdf(path=f'{tmp}/miolo.pdf', format='A5', print_background=True, prefer_css_page_size=True, display_header_footer=True, header_template='<span></span>', footer_template=pe)
            w = PdfWriter()
            for f in ('capa.pdf', 'miolo.pdf'):
                for pp in PdfReader(f'{tmp}/{f}').pages: w.add_page(pp)
            w.add_metadata({'/Title': g['titulo'] + ' | FCE Advogados', '/Author': 'Fábio de Castro Emerim, OAB/RS 88.912', '/Subject': 'Atualizado em ' + MES})
            w.write(SITE + '/' + g['saida'])
            print(g['saida'], len(w.pages), 'páginas,', MES)
        b.close()

if __name__ == '__main__':
    main()
