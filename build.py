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

# the work page is split into clear groups; featured films lead each group
GROUPS = [('commercials', 'Commercials', ['Commercial']),
          ('music-videos', 'Music videos', ['Music Video']),
          ('documentary-fashion', 'Documentary & fashion', ['Documentary', 'Fashion & Art'])]
SHOW = 8  # films visible per group before "Show all"
rank = {i: n for n, i in enumerate(data['featured'])}


def card(w, hidden):
    return f'''        <li class="card{' extra' if hidden else ''}">
          <a {attrs(w)}>
            <span class="ph"><img src="img/{w["id"]}-s.jpg" alt="" loading="lazy" width="720" height="405"><span class="play" aria-hidden="true"></span></span>
            <span class="card-t"{lang(full(w))}>{e(w["title"])}{f' <em>{e(w["sub"])}</em>' if w.get("sub") else ''}</span>
          </a>
        </li>'''


tabs, groups = [], []
for gid, name, gcats in GROUPS:
    items = sorted((w for w in works if w['cat'] in gcats), key=lambda w: rank.get(w['id'], 99))
    tabs.append(f'        <a class="chip" href="#{gid}">{e(name)} <sup>{len(items)}</sup></a>')
    more = (f'\n      <button type="button" class="btn more" data-more>Show all {len(items)}</button>' if len(items) > SHOW else '')
    groups.append(f'''    <div class="group" id="{gid}">
      <div class="group-head"><h3>{e(name)}</h3><span class="group-n">{len(items)} films</span></div>
      <ul class="grid" role="list">
{chr(10).join(card(w, n >= SHOW) for n, w in enumerate(items))}
      </ul>{more}
    </div>''')

out = (ROOT / 'template.html').read_text(encoding='utf-8')
for k, v in {
    'GROUPS': '\n'.join(groups), 'TABS': '\n'.join(tabs),
    'COUNT': str(len(works)),
    'N_COMMERCIAL': str(count['Commercial']), 'N_MUSIC': str(count['Music Video']),
    'N_ART': str(count['Fashion & Art']), 'N_DOC': str(count['Documentary']),
    'VER': time.strftime('%Y%m%d%H%M'),
}.items():
    out = out.replace('{{' + k + '}}', v)
assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
(ROOT / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html built: {len(works)} films')
