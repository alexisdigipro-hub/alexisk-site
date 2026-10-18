#!/usr/bin/env python3
"""Builds index.html from template.html + data/works.json.
Add or edit films in data/works.json (thumbnails go in img/<id>.jpg and img/<id>-s.jpg), then run: python3 build.py"""
import html, json, pathlib, re, time

ROOT = pathlib.Path(__file__).parent
data = json.loads((ROOT / 'data/works.json').read_text(encoding='utf-8'))
works = data['works']
by_id = {w['id']: w for w in works}
by_id[data['showreel']['id']] = {**data['showreel'], 'sub': '', 'cat': 'Showreel'}
e = lambda s: html.escape(s, quote=True)
GR = re.compile('[\u0370-\u03ff\u1f00-\u1fff]')
lang = lambda s: ' lang="el"' if GR.search(s) else ''
slug = lambda c: re.sub(r'[^a-z]+', '-', c.lower()).strip('-')


def href(src):
    kind, vid = src.split(':', 1)
    return f'https://www.youtube.com/watch?v={vid}' if kind == 'yt' else f'https://vimeo.com/{vid}'


def full(w):
    return w['title'] + (f' · {w["sub"]}' if w.get('sub') else '')


def attrs(w):
    return (f'href="{href(w["src"])}" target="_blank" rel="noopener" data-play="{w["id"]}" '
            f'data-src="{w["src"]}" data-title="{e(full(w))}" data-cat="{e(w["cat"])}"')


strip = []
for n, i in enumerate(data['featured']):
    w = by_id[i]
    strip.append(f'''      <a class="frame" {attrs(w)} data-cursor="Play" draggable="false">
        <span class="ph"><img src="img/{i}.jpg" alt="Still from {e(full(w))}" loading="lazy" width="1600" height="900" draggable="false"></span>
        <span class="frame-cap"><span class="frame-t"{lang(full(w))}>{e(full(w))}</span><span class="mono">{n + 1:02d} / {len(data["featured"]):02d}</span></span>
      </a>''')

cats = ['Commercial', 'Music Video', 'Fashion & Art', 'Documentary']
count = {c: sum(w['cat'] == c for w in works) for c in cats}
filters = [f'        <button type="button" class="chip" data-filter="all" aria-pressed="true">All <sup>{len(works)}</sup></button>']
filters += [f'        <button type="button" class="chip" data-filter="{slug(c)}" aria-pressed="false">{e(c)} <sup>{count[c]}</sup></button>' for c in cats]

rows = []
for n, w in enumerate(works):
    rows.append(f'''      <li class="row" data-cat="{slug(w["cat"])}">
        <a class="row-a" {attrs(w)} data-img="img/{w["id"]}-s.jpg" data-cursor="Play">
          <span class="row-n mono">{n + 1:02d}</span>
          <span class="row-thumb"><img src="img/{w["id"]}-s.jpg" alt="" loading="lazy" width="720" height="405"></span>
          <span class="row-t"{lang(full(w))}>{e(w["title"])}{f' <em>{e(w["sub"])}</em>' if w.get("sub") else ''}</span>
          <span class="row-c mono">{e(w["cat"])}</span>
        </a>
      </li>''')

clients = []
for w in works:
    if w['title'] not in clients and not w['title'].startswith('#'):
        clients.append(w['title'])
marquee = ''.join(f'<span>{e(c)}</span><i>✦</i>' for c in clients)

out = (ROOT / 'template.html').read_text(encoding='utf-8')
for k, v in {
    'STRIP': '\n'.join(strip), 'FILTERS': '\n'.join(filters), 'ROWS': '\n'.join(rows),
    'COUNT': str(len(works)),
    'N_COMMERCIAL': str(count['Commercial']), 'N_MUSIC': str(count['Music Video']),
    'N_ART': str(count['Fashion & Art']), 'N_DOC': str(count['Documentary']),
    'VER': time.strftime('%Y%m%d%H%M'),
}.items():
    out = out.replace('{{' + k + '}}', v)
assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
(ROOT / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html built: {len(works)} films')
