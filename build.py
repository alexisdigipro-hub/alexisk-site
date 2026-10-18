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


cats = ['Commercial', 'Music Video', 'Fashion & Art', 'Documentary']
count = {c: sum(w['cat'] == c for w in works) for c in cats}
LABEL = {'Commercial': 'Commercials', 'Music Video': 'Music Videos', 'Fashion & Art': 'Fashion & Art', 'Documentary': 'Documentary'}
SHOW = 12  # tiles visible before "Show all work"

filters = ['      <button type="button" class="on" data-filter="all">All</button>']
filters += [f'      <button type="button" data-filter="{slug(c)}">{e(LABEL[c])}</button>' for c in ['Commercial', 'Music Video', 'Documentary', 'Fashion & Art']]

# featured films first, then the rest in their original order
order = data['featured'] + [w['id'] for w in works if w['id'] not in data['featured']]
tiles = []
for n, i in enumerate(order):
    w = by_id[i]
    tiles.append(f'''      <a class="tile{' extra' if n >= SHOW else ''}" data-cat="{slug(w["cat"])}" {attrs(w)}>
        <img src="img/{i}-s.jpg" alt="" loading="lazy" width="720" height="405">
        <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>
        <span class="cap"><strong{lang(full(w))}>{e(full(w))}</strong><span>{e(LABEL[w["cat"]])}</span></span>
      </a>''')

names = []
for w in works:
    if w['title'] not in names and not w['title'].startswith('#'):
        names.append(w['title'])
clients = [f'      <li{lang(x)}>{e(x)}</li>' for x in names]

out = (ROOT / 'template.html').read_text(encoding='utf-8')
for k, v in {
    'TILES': '\n'.join(tiles), 'FILTERS': '\n'.join(filters), 'CLIENTS': '\n'.join(clients),
    'COUNT': str(len(works)),
    'N_COMMERCIAL': str(count['Commercial']), 'N_MUSIC': str(count['Music Video']),
    'N_ART': str(count['Fashion & Art']), 'N_DOC': str(count['Documentary']),
    'VER': time.strftime('%Y%m%d%H%M'),
}.items():
    out = out.replace('{{' + k + '}}', v)
assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
(ROOT / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html built: {len(works)} films')
