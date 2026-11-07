#!/usr/bin/env python3
"""Łączy rozdziały Markdown w lokalny podręcznik HTML. Wymaga programu markdown (Discount)."""

from html import escape
from pathlib import Path
import argparse
import posixpath
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent
CHAPTERS = [ROOT / "README.md", *sorted(ROOT.glob("[0-9][0-9]-*.md"))]
PRESENTATION = ROOT / "11-scenariusz-prezentacji.md"


def speaker_blocks():
    blocks = []
    source = PRESENTATION.read_text(encoding="utf-8")
    for chunk in re.split(r"(?m)^## Slajd ", source)[1:]:
        number, title = chunk.splitlines()[0].split(" — ", 1)
        values = {}
        for key, label, quote in [
            ("speech", "Powiedz", True), ("short", "Wersja krótka", True),
            ("transition", "Przejście", False), ("question", "Profesor pyta", False),
            ("answer", "Odpowiedź", False),
        ]:
            pattern = rf"\*\*{label}:\*\*" + (r"\n\n> (.*)" if quote else r" (.*)")
            match = re.search(pattern, chunk)
            if not match:
                raise ValueError(f"Slajd {number}: brak pola {label}")
            values[key] = match.group(1)
        blocks.append(dict(number=int(number), title=title, **values))
    if [v["number"] for v in blocks] != list(range(1, 48)):
        raise ValueError("Scenariusz musi obejmować slajdy 1–47 we właściwej kolejności")
    return blocks


def annotate_presentation(source_path):
    ns = dict(p="http://schemas.openxmlformats.org/presentationml/2006/main",
              a="http://schemas.openxmlformats.org/drawingml/2006/main",
              r="http://schemas.openxmlformats.org/officeDocument/2006/relationships")
    for prefix, uri in ns.items():
        ET.register_namespace(prefix, uri)
    source_path = Path(source_path).resolve()
    destination = ROOT / "Adrian_Tur_1_z_notatkami.pptx"
    if source_path == destination.resolve():
        raise ValueError("Źródłowy PPTX i kopia z notatkami muszą być różnymi plikami")
    blocks = speaker_blocks()

    def resolve(base, target):
        return target.lstrip("/") if target.startswith("/") else posixpath.normpath(
            posixpath.join(posixpath.dirname(base), target))

    with ZipFile(source_path) as original:
        relationships = {e.attrib["Id"]: e.attrib["Target"] for e in
                         ET.fromstring(original.read("ppt/_rels/presentation.xml.rels"))}
        presentation = ET.fromstring(original.read("ppt/presentation.xml"))
        slide_paths = [resolve("ppt/presentation.xml", relationships[e.attrib[f"{{{ns['r']}}}id"]])
                       for e in presentation.findall("p:sldIdLst/p:sldId", ns)]
        if len(slide_paths) != len(blocks):
            raise ValueError("Liczba slajdów PPTX nie odpowiada scenariuszowi")
        replacements = {}
        for slide, block in zip(slide_paths, blocks):
            relpath = posixpath.join(posixpath.dirname(slide), "_rels", posixpath.basename(slide) + ".rels")
            notes = [resolve(slide, e.attrib["Target"]) for e in
                     ET.fromstring(original.read(relpath)) if e.attrib["Type"].endswith("/notesSlide")]
            if len(notes) != 1:
                raise ValueError(f"Slajd {block['number']}: brak jednoznacznego pliku notatek")
            tree = ET.fromstring(original.read(notes[0]))
            body = None
            for shape in tree.findall(".//p:sp", ns):
                placeholder = shape.find("p:nvSpPr/p:nvPr/p:ph", ns)
                if placeholder is not None and placeholder.attrib.get("type") == "body":
                    body = shape.find("p:txBody", ns)
                    break
            if body is None:
                raise ValueError(f"Slajd {block['number']}: brak pola treści notatek")
            previous = [e for e in body if e.tag == f"{{{ns['a']}}}p"]
            for paragraph in previous:
                body.remove(paragraph)
            lines = [
                (f"SLAJD {block['number']:02} — {block['title']}", True),
                ("WYPOWIEDŹ PODSTAWOWA", True), (block["speech"], False),
                ("WERSJA KRÓTKA — ZAMIAST PODSTAWOWEJ", True), (block["short"], False),
                ("PRZEJŚCIE / WSKAZÓWKA PROWADZENIA", True), (block["transition"], False),
                ("PYTANIE DO PRZYGOTOWANIA — NIE CZYTAJ W TOKU WYSTĄPIENIA", True),
                (block["question"], False), (block["answer"], False),
                ("ORYGINALNE NOTATKI ŹRÓDŁOWE", True),
            ]
            for text, bold in lines:
                paragraph = ET.SubElement(body, f"{{{ns['a']}}}p")
                run = ET.SubElement(paragraph, f"{{{ns['a']}}}r")
                ET.SubElement(run, f"{{{ns['a']}}}rPr", {"lang": "pl-PL", "sz": "1200", "b": "1" if bold else "0"})
                ET.SubElement(run, f"{{{ns['a']}}}t").text = text.replace("`", "")
            body.extend(previous)
            replacements[notes[0]] = ET.tostring(tree, encoding="utf-8", xml_declaration=True)
        temporary = destination.with_suffix(".tmp.pptx")
        try:
            with ZipFile(temporary, "w") as output:
                for entry in original.infolist():
                    output.writestr(entry, replacements.get(entry.filename, original.read(entry.filename)))
            temporary.replace(destination)
        finally:
            temporary.unlink(missing_ok=True)
    print(f"Zapisano {destination}: 47 rozszerzonych notatek, zachowane slajdy i notatki źródłowe.")


def documents(mode):
    if mode == "podrecznik":
        return [
            dict(key=p.name, anchor=f"rozdzial-{i:02}", path=p,
                 title=p.read_text(encoding="utf-8").splitlines()[0].removeprefix("# ")
                 if i else "Jak korzystać z przewodnika",
                 source=p.read_text(encoding="utf-8"))
            for i, p in enumerate(CHAPTERS)
        ]
    source = PRESENTATION.read_text(encoding="utf-8")
    if mode == "sciaga":
        rows = []
        for block in speaker_blocks():
            rows.append(f"| {block['number']:02} | {block['title']} | {block['short']} |")
        if len(rows) != 47:
            raise ValueError("Ściąga musi obejmować wszystkie 47 slajdów")
        text = """# Ściąga do prezentacji Stanowiska

Jedna wypowiedź do każdego slajdu pliku `Adrian_Tur_1.pptx`, w jego oryginalnej kolejności. To wariant skrócony; pełne wypowiedzi i pytania profesora są w [module 11](11-scenariusz-prezentacji.md) i [scenariuszu HTML](SCENARIUSZ_PREZENTACJI.html).

| Slajd | Temat | Powiedz |
| --- | --- | --- |
""" + "\n".join(rows) + """

## Pięć zdań do zapamiętania

1. Instalacja APK, nadanie Device Owner i zastosowanie polityki to osobne kroki.
2. Zapisana konfiguracja i ostatnia zastosowana konfiguracja mogą mieć różne rewizje.
3. Pojedynczą sesję kończy PIN; wyjście serwisowe pozostawia Device Owner.
4. Origin to schemat, host i port; kontrola nawigacji nie jest zaporą całej sieci.
5. Obecność kodu, budowanie i próby logiki nie zastępują testu ochrony na fizycznym urządzeniu.

Przy slajdzie 39 rozróżnij omówienie procedury od rzeczywiście wykonanej demonstracji. Przy 42–44 podaj tylko zebrane wyniki. Na końcu zatrzymaj slajd 47 i poczekaj na pytania.
"""
        path = ROOT / "SCIAGA_PREZENTACJI.md"
        path.write_text(text, encoding="utf-8")
        return [dict(key=path.name, anchor="sciaga", path=path,
                     title="Wszystkie 47 slajdów", source=text)]
    result = []
    for i, chunk in enumerate(re.split(r"(?m)(?=^## )", source)):
        if not chunk.strip():
            continue
        title = chunk.splitlines()[0].lstrip("# ")
        if i == 0:
            title = "Jak korzystać ze scenariusza"
        slide = re.match(r"Slajd (\d{2})", title)
        anchor = f"slajd-{slide.group(1)}" if slide else f"dodatek-{i:02}"
        chunk = re.sub(r"\A## ", "# ", chunk)
        result.append(dict(key=anchor, anchor=anchor, path=PRESENTATION,
                           title=title, source=chunk))
    return result


def main(mode="podrecznik"):
    renderer = shutil.which("markdown")
    if not renderer:
        raise SystemExit("Brakuje programu markdown (Discount). Źródła można czytać bezpośrednio jako Markdown.")
    inputs = documents(mode)
    settings = {
        "podrecznik": ("PRZEWODNIK.html", "Stanowisko — projekt wyjaśniony przez profesora",
                       "Stanowisko<br>Projekt wyjaśniony przez profesora",
                       "Od pomysłu i zależności po polityki Androida, PIN, WebView i zachowanie po awarii. Pytania, konkretne odpowiedzi i odnośniki do implementacji."),
        "prezentacja": ("SCENARIUSZ_PREZENTACJI.html", "Stanowisko — co mówić podczas prezentacji",
                        "Stanowisko<br>Co mówić podczas prezentacji",
                        "Gotowe wypowiedzi do 47 slajdów Adrian_Tur_1.pptx, krótkie warianty, przejścia i odpowiedzi na pytania profesora."),
        "sciaga": ("SCIAGA_PREZENTACJI.html", "Stanowisko — ściąga do prezentacji",
                   "Stanowisko<br>Ściąga do prezentacji",
                   "Krótka wypowiedź do każdego slajdu. Pełny scenariusz zawiera rozwinięcia, przejścia i pytania profesora."),
    }
    filename, page_title, heading, introduction = settings[mode]
    aside_description = "Podręcznik projektu Android" if mode == "podrecznik" else "Notatki do Adrian_Tur_1.pptx"
    search_label = "Szukaj w treści rozdziałów" if mode == "podrecznik" else "Szukaj slajdu lub zagadnienia"
    anchors = {doc["key"]: doc["anchor"] for doc in inputs}
    nav, articles = [], []
    questions = 0
    for i, doc in enumerate(inputs):
        path, source, title = doc["path"], doc["source"], doc["title"]
        questions += source.count("**Profesor pyta:")
        rendered = subprocess.run(
            [renderer, "-f", "fencedcode", "-f", "tables"],
            input=source, text=True, encoding="utf-8", capture_output=True, check=True,
        ).stdout
        # Discount otacza czasem fenced block akapitem. Usuń ten niepoprawny kontener.
        rendered = re.sub(r"<p>\s*(<pre>)", r"\1", rendered)
        rendered = re.sub(r"(</pre>)\s*</p>", r"\1", rendered)
        rendered = re.sub(r"<h1>.*?</h1>", "", rendered, count=1, flags=re.S)
        rendered = re.sub(r"<(/?)h([2-5])>", lambda m: f"<{m[1]}h{int(m[2])+1}>", rendered)

        def local_link(match):
            dest = match[1]
            if dest in anchors:
                return f'href="#{anchors[dest]}"'
            if dest == filename:
                return 'href="#poczatek"'
            return match[0]

        rendered = re.sub(r'href="([^"]+)"', local_link, rendered)

        def inline_diagram(match):
            image_path = (ROOT / match[1]).resolve()
            if image_path.parent != ROOT / "diagramy":
                raise ValueError("Nieoczekiwana ścieżka diagramu")
            svg = image_path.read_text(encoding="utf-8")
            prefix = f"diagram-{i}-{image_path.stem}-"
            svg = re.sub(r'id="([^"]+)"', lambda m: f'id="{prefix}{m[1]}"', svg)
            svg = re.sub(r'url\(#([^)]+)\)', lambda m: f'url(#{prefix}{m[1]})', svg)
            svg = re.sub(r'aria-labelledby="([^"]+)"',
                         lambda m: 'aria-labelledby="' + ' '.join(prefix + v for v in m[1].split()) + '"', svg)
            return f'<figure>{svg}<figcaption>{escape(match[2])}</figcaption></figure>'

        rendered = re.sub(r'<img src="(diagramy/[^\"]+\.svg)" alt="([^"]*)"[^>]*\s*/?>', inline_diagram, rendered)
        rendered = re.sub(r"<p>\s*(<figure>)", r"\1", rendered)
        rendered = re.sub(r"(</figure>)\s*</p>", r"\1", rendered)
        rendered = re.sub(r"(<table>.*?</table>)", r'<div class="tabela">\1</div>', rendered, flags=re.S)
        anchor = doc["anchor"]
        nav.append(f'<li><a href="#{anchor}" data-target="{anchor}">{escape(title)}</a></li>')
        articles.append(f'<article id="{anchor}"><h2>{escape(title)}</h2>{rendered}'
                        f'<p class="zrodlo"><a href="{path.name}">Źródło Markdown tego rozdziału</a></p></article>')

    diagram_count = "".join(articles).count("<svg ")
    if mode == "podrecznik":
        summary = f"{len(CHAPTERS)-1} rozdziałów · {questions} pytań profesora · {diagram_count} diagramy"
    elif mode == "prezentacja":
        summary = f"47 slajdów · gotowe wypowiedzi · {questions} pytań profesora"
    else:
        summary = "47 slajdów · krótka wypowiedź do każdego · szybka powtórka"
    css = """
    :root{color-scheme:light;--ink:#203647;--muted:#526879;--accent:#075c87;--paper:#fffefa;--line:#d9e2e7}
    *{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}
    body{margin:0;color:var(--ink);background:#eef3f6;font:17px/1.75 system-ui,sans-serif}
    a{color:var(--accent);text-decoration-thickness:1px;text-underline-offset:3px}a:hover{color:#003950}
    a:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid #d08614;outline-offset:4px}
    .layout{display:grid;grid-template-columns:290px minmax(0,1fr);max-width:1510px;margin:auto;min-height:100vh}
    aside{padding:32px 22px;position:sticky;top:0;align-self:start;max-height:100vh;overflow:auto;font-size:14px}
    .marka{font-size:19px;font-weight:800;letter-spacing:.04em;color:#15394f;margin:0 0 8px}
    .meta{font-size:13px;color:var(--muted)}label{font-size:14px;font-weight:650;display:block;margin-top:22px}
    input{width:100%;padding:11px 10px;border:1px solid #8ea8b8;border-radius:6px;font:inherit;background:white}
    button{font:inherit;padding:7px 12px;margin:8px 3px 0 0;border:1px solid #9bb1be;background:white;color:#244b63;border-radius:6px;cursor:pointer}
    #wynik{font-size:12px;min-height:24px;color:var(--muted)}nav ul{list-style:none;padding:0;margin:18px 0}
    nav li{margin:0 0 8px}nav a{display:block;padding:6px 9px;text-decoration:none;border-left:3px solid transparent}
    nav a:hover,nav a.aktualny{background:#dfeaf0;border-left-color:var(--accent)}
    main{background:var(--paper);padding:54px clamp(24px,5vw,84px) 90px;min-width:0;border-left:1px solid var(--line)}
    header{border-bottom:3px solid #0a6285;padding-bottom:30px;margin-bottom:35px}.etykieta{letter-spacing:.12em;font-size:12px;text-transform:uppercase;color:var(--accent);font-weight:750}
    h1{font-size:clamp(30px,3.3vw,49px);line-height:1.13;letter-spacing:-.03em;margin:12px 0 20px;max-width:900px}
    .wstep{font-size:20px;line-height:1.6;max-width:820px;color:#375365}
    blockquote{margin:14px 0 24px;padding:16px 21px;background:#edf5f8;border-left:4px solid #237293;border-radius:0 7px 7px 0}blockquote p:last-child{margin-bottom:0}
    .sciaga th:first-child,.sciaga td:first-child{width:42px;min-width:42px}.sciaga th:nth-child(2){width:24%}
    h2{font-size:30px;line-height:1.3;letter-spacing:-.02em;margin:0 0 27px}h3{font-size:22px;line-height:1.4;margin:37px 0 18px;color:#174b68}
    h4{font-size:19px}p{margin:0 0 19px}strong{font-weight:720}article{padding:25px 0 45px;border-bottom:1px solid var(--line);scroll-margin-top:20px}
    article>p,article>ul,article>ol{max-width:85ch}
    article p:has(>strong:first-child){margin-top:24px}.zrodlo{font-size:13px;color:var(--muted);margin-top:32px}
    ul,ol{padding-left:27px}li{padding-left:3px;margin-bottom:8px}code{font-size:.88em;background:#eaf0f3;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}
    pre{background:#112c3d;color:#e4f1f7;padding:19px 23px;overflow:auto;border-radius:8px;line-height:1.6;font-size:14px}pre code{background:none;padding:0;color:inherit;overflow-wrap:normal}
    .tabela{overflow-x:auto;margin:22px 0 28px}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.65}th,td{padding:12px 13px;text-align:left;vertical-align:top;border:1px solid var(--line);min-width:110px}th{background:#e8f0f4;color:#153e55;font-weight:750}tr:nth-child(even) td{background:#f7f9fa}
    figure{margin:25px 0 33px}figure svg{display:block;width:100%;height:auto;border:1px solid var(--line);border-radius:12px}figcaption{font-size:13px;color:var(--muted);padding-top:9px}
    [hidden]{display:none!important}.skip{position:absolute;left:-9999px}.skip:focus{left:16px;top:12px;background:white;padding:10px;z-index:10}
    .bez-wyniku{padding:30px;border:1px solid var(--line)}
    @media(max-width:900px){.layout{grid-template-columns:220px minmax(0,1fr)}aside{padding:20px 14px}main{padding:35px 24px}body{font-size:16px}h2{font-size:26px}}
    @media(max-width:650px){.layout{display:block}aside{position:static;max-height:none;padding:22px}nav ul{columns:2;column-gap:18px}nav li{break-inside:avoid}nav a{font-size:13px}main{border:0;padding:30px 19px}h1{font-size:34px}.wstep{font-size:18px}pre{padding:14px;font-size:12px}table{font-size:13px}th,td{padding:9px;min-width:130px}}
    @media print{body,main{background:white;color:#000;font-size:10pt}.layout{display:block}aside,.skip,.zrodlo,#bez-wyniku{display:none!important}main{border:0;padding:0}header{margin:0 0 25px}article[hidden]{display:block!important}article{break-before:page;border:0;padding:0}article:first-of-type{break-before:auto}article:first-of-type .tabela{break-inside:avoid}article>p,article>ul,article>ol{max-width:none}h1{font-size:27pt}h2{font-size:21pt}h3{font-size:15pt;break-after:avoid}pre{white-space:pre-wrap;color:#000;background:#f3f3f3;font-size:8pt;border:1px solid #bbb}code{color:#000;background:#eee}a{color:#000}.tabela{overflow:visible}table{font-size:8pt}th,td{min-width:0;padding:6px}tr,figure{break-inside:avoid}figure{max-width:17cm}p,li{orphans:3;widows:3}}
    @media print{.sciaga header{padding-bottom:12px;margin-bottom:12px}.sciaga h1{font-size:20pt;margin:6px 0 10px}.sciaga .wstep{font-size:11pt;margin-bottom:10px}.sciaga header .meta{display:none}.sciaga h2{font-size:14pt;margin-bottom:12px}.sciaga article:first-of-type .tabela{break-inside:auto}.sciaga .etykieta{font-size:8pt}}
    """
    js = """
    const input=document.getElementById('szukaj');
    const chapters=[...document.querySelectorAll('article')];
    const links=[...document.querySelectorAll('nav a')];
    const normalize=s=>s.toLocaleLowerCase('pl').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/ł/g,'l');
    const texts=chapters.map(a=>normalize(a.textContent));
    function filter(){const q=normalize(input.value.trim());let n=0;chapters.forEach((a,i)=>{const show=!q||texts[i].includes(q);a.hidden=!show;links[i].parentElement.hidden=!show;if(show)n++});document.getElementById('wynik').textContent=q?'Pasujące części: '+n+' z '+chapters.length:'';document.getElementById('bez-wyniku').hidden=n>0;}
    input.addEventListener('input',filter);
    document.getElementById('wyczysc').addEventListener('click',()=>{input.value='';filter();input.focus()});
    document.getElementById('drukuj').addEventListener('click',()=>window.print());
    function followHash(){const a=document.getElementById(location.hash.slice(1));if(a&&a.matches('article')&&a.hidden){input.value='';filter();a.scrollIntoView()}links.forEach(l=>l.classList.toggle('aktualny',l.hash===location.hash));}
    window.addEventListener('hashchange',followHash);followHash();
    """
    html = f'''<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="{escape(introduction)}">
<title>{escape(page_title)}</title><style>{css}</style></head>
<body id="poczatek" class="{mode}"><a class="skip" href="#tresc">Przejdź do treści</a><div class="layout">
<aside><p class="marka">STANOWISKO</p><p class="meta">{aside_description}<br>1.0.9 · bb7dd3c · 6.11.2026</p>
<label for="szukaj">{search_label}</label><input id="szukaj" type="search" placeholder="np. PIN, migracja, Lock Task" autocomplete="off">
<button id="wyczysc" type="button">Wyczyść</button><button id="drukuj" type="button">Drukuj / PDF</button><p id="wynik" role="status" aria-live="polite"></p>
<nav aria-label="Spis treści"><ul>{''.join(nav)}</ul></nav><p class="meta">Cała treść jest dostępna lokalnie. <a href="PRZEWODNIK.html">Podręcznik</a> · <a href="SCENARIUSZ_PREZENTACJI.html">Scenariusz</a> · <a href="SCIAGA_PREZENTACJI.html">Ściąga</a></p></aside>
<main id="tresc"><header><span class="etykieta">{summary}</span>
<h1>{heading}</h1><p class="wstep">{introduction}</p>
<p class="meta">Wersja kodu: 1.0.9 (11) · gałąź android · analiza i weryfikacja: 6 listopada 2026</p></header>
<p id="bez-wyniku" class="bez-wyniku" hidden>Brak rozdziałów zawierających tę frazę. Skróć zapytanie albo wybierz Wyczyść.</p>
{''.join(articles)}</main></div><script>{js}</script></body></html>'''
    destination = ROOT / filename
    destination.write_text(html, encoding="utf-8")
    print(f"Zapisano {destination}: {len(inputs)} części, {questions} pytań, {len(html.encode('utf-8'))} bajtów.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pptx", help="Oryginalna prezentacja do utworzenia osobnej kopii z notatkami")
    args = parser.parse_args()
    main()
    main("prezentacja")
    main("sciaga")
    if args.pptx:
        annotate_presentation(args.pptx)
