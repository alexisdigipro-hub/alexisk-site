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


hero = '\n'.join(
    f'      <img src="img/{i}.jpg" alt="" width="1600" height="900" data-title="{e(full(by_id[i]))}"'
    + (' fetchpriority="high"' if n == 0 else ' loading="lazy"') + (' class="on"' if n == 0 else '') + '>'
    for n, i in enumerate(data['hero']))

featured = []
for n, i in enumerate(data['featured']):
    w = by_id[i]
    featured.append(f'''    <article class="feat{' feat-r' if n % 2 else ''}">
      <a class="feat-media" {attrs(w)} data-cursor="Play">
        <span class="gate"><img src="img/{i}.jpg" alt="Still from {e(full(w))}" loading="lazy" width="1600" height="900"></span>
      </a>
      <div class="feat-cap">
        <span class="mono feat-n">{n + 1:02d}</span>
        <h3 class="feat-t"{lang(full(w))}>{e(w["title"])}{f' <em>{e(w["sub"])}</em>' if w.get("sub") else ''}</h3>
        <span class="mono feat-c">{e(w["cat"])}</span>
      </div>
    </article>''')

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
          <span class="row-go mono" aria-hidden="true">Play ↗</span>
        </a>
      </li>''')

clients = []
for w in works:
    if w['title'] not in clients and not w['title'].startswith('#'):
        clients.append(w['title'])
marquee = ''.join(f'<span>{e(c)}</span><i>✦</i>' for c in clients)

out = (ROOT / 'template.html').read_text(encoding='utf-8')
for k, v in {
    'HERO0': data['hero'][0], 'HERO': hero, 'HEROCOUNT': f'{len(data["hero"]):02d}',
    'FEATURED': '\n'.join(featured), 'FILTERS': '\n'.join(filters), 'ROWS': '\n'.join(rows),
    'MARQUEE': marquee, 'CLIENTS': e(', '.join(clients)), 'COUNT': str(len(works)),
    'N_COMMERCIAL': str(count['Commercial']), 'N_MUSIC': str(count['Music Video']),
    'N_ART': str(count['Fashion & Art']), 'N_DOC': str(count['Documentary']),
    'VER': time.strftime('%Y%m%d%H%M'),
}.items():
    out = out.replace('{{' + k + '}}', v)
assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
(ROOT / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html built: {len(works)} films')
