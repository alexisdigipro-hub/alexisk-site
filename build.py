#!/usr/bin/env python3
"""Builds index.html from template.html + data/works.json, with the work of themadlions.com added.
Add or edit films in data/works.json (thumbnails go in img/<id>.jpg and img/<id>-s.jpg), then run: python3 build.py

themadlions.com (Alex, 30 Oct: "what is on themadlions.com, on alexisk.gr too, and new projects there come here by
themselves"): the films Alex keeps in the site's admin (Supabase site_works) are added after his own, skipping any video
already here and Behind the Scenes. `python3 build.py --sync` reads them fresh into data/themadlions.json (a GitHub
Action does it every few hours and pushes; Plesk deploys the push); app.js also adds any newer one on the page itself.
The same rules live in app.js (TML), keep them in step."""
import html, json, pathlib, re, sys, time, urllib.request

ROOT = pathlib.Path(__file__).parent
data = json.loads((ROOT / 'data/works.json').read_text(encoding='utf-8'))
works = data['works']

# ---------- themadlions.com's work (public read, the same as themadlions.com itself uses)
TML_URL = 'https://naibamqexcqnqhbbqafa.supabase.co/rest/v1/site_works?visible=eq.true&video_id=not.is.null&select=title,client,categories,kind,video_id&order=position.asc,created_at.desc'
TML_KEY = 'sb_publishable_o1OB_ohozPq1Xr2jg2ZSHA_3GsusXFL'
TML_FILE = ROOT / 'data/themadlions.json'
# Alex's order and hidden films, set in alexisk.gr/admin/ (Alex, 30 Oct: "a backend like themadlions, to set the order")
ORDER_URL = 'https://naibamqexcqnqhbbqafa.supabase.co/rest/v1/alexisk_site?id=eq.1&select=ord,hidden'
ORDER_FILE = ROOT / 'data/order.json'
SHOW = 25  # films on the home page before "Show all work" (tml.js SHOW)


def read(url):
    req = urllib.request.Request(url, headers={'apikey': TML_KEY, 'Authorization': f'Bearer {TML_KEY}'})
    return json.loads(urllib.request.urlopen(req, timeout=30).read().decode('utf-8'))


if '--sync' in sys.argv:
    rows = read(TML_URL)
    TML_FILE.write_text(json.dumps({'from': 'themadlions.com site_works (visible, with a video), newest position first', 'rows': rows}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'themadlions.com: {len(rows)} films read')
    o = (read(ORDER_URL) or [{}])[0]
    ORDER_FILE.write_text(json.dumps({'from': 'alexisk.gr/admin/ (alexisk_site)', 'ord': o.get('ord') or [], 'hidden': o.get('hidden') or []}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'order: {len(o.get("ord") or [])} placed, {len(o.get("hidden") or [])} hidden')
tml_rows = json.loads(TML_FILE.read_text(encoding='utf-8'))['rows'] if TML_FILE.exists() else []
order_set = json.loads(ORDER_FILE.read_text(encoding='utf-8')) if ORDER_FILE.exists() else {'ord': [], 'hidden': []}


def tml_clean(t):
    """'Nikos Vertis - Koita / Νίκος Βέρτης - Κοίτα (Official Videoclip 4K)' -> ('Nikos Vertis', 'Koita')"""
    t = re.sub(r'\s+', ' ', t).strip()
    t = t.split(' / ')[0]
    t = re.sub(r'\s*\|.*$', '', t)
    t = re.sub(r'\s*\((?:official|4k)[^)]*\)', '', t, flags=re.I)
    t = re.sub(r'\s*[-–]\s*official (?:music )?video(?:clip)?\s*$', '', t, flags=re.I)
    t = re.sub(r'\s*official (?:music )?video(?:clip)?\s*$', '', t, flags=re.I).strip(' -–')
    m = re.split(r'\s+[–-]\s+', t, maxsplit=1)
    return (m[0].strip(), m[1].strip() if len(m) > 1 else '')


def tml_cat(r):
    c = r.get('categories') or []
    if 'Music Videos' in c or (not c and re.search(r'official (music )?video|videoclip', r['title'], re.I)):
        return 'Music Video'
    if 'Films' in c:
        return 'Film'
    return 'Commercial'  # commercials, corporate, events, intros, motion graphics


have = {w['src'].split(':', 1)[1] for w in works} | {data['showreel']['src'].split(':', 1)[1]}
tml = []
for r in tml_rows:
    kind, vid = r.get('kind') or 'yt', r.get('video_id')
    if not vid or kind not in ('yt', 'vm') or vid in have or 'Behind the Scenes' in (r.get('categories') or []):
        continue
    have.add(vid)
    title, sub = tml_clean(r['title'])
    tml.append({'id': f'tml-{vid}', 'title': title, 'sub': sub, 'cat': tml_cat(r), 'src': f'{kind}:{vid}',
                'thumb': f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg' if kind == 'yt' else f'https://vumbnail.com/{vid}.jpg'})
works = works + tml
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


cats = ['Commercial', 'Music Video', 'Fashion & Art', 'Documentary', 'Film']
count = {c: sum(w['cat'] == c for w in works) for c in cats}
LABEL = {'Commercial': 'Commercials', 'Music Video': 'Music Videos', 'Fashion & Art': 'Fashion & Art', 'Documentary': 'Documentary', 'Film': 'Films'}

filters = ['      <button type="button" class="on" data-filter="all">All</button>']
filters += [f'      <button type="button" data-filter="{slug(c)}">{e(LABEL[c])}</button>' for c in ['Commercial', 'Music Video', 'Documentary', 'Fashion & Art', 'Film'] if count[c]]

# featured films first, then the rest in their original order; the films list for the admin keeps that order
order = data['featured'] + [w['id'] for w in works if w['id'] not in data['featured']]
(ROOT / 'admin').mkdir(exist_ok=True)
(ROOT / 'admin/films.json').write_text(json.dumps([{k: by_id[i].get(k, '') for k in ('id', 'title', 'sub', 'cat', 'src')} | {'thumb': by_id[i].get('thumb') or f'img/{i}-s.jpg'} for i in order], ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
# Alex's order (tml.js arrange): a film he has not placed yet comes first, then his order; hidden ones stay in the page
# hidden (class gone), so the page can show one again at once when he does
at = {i: n for n, i in enumerate(order_set['ord'])}
off = set(order_set['hidden'])
if at or off:
    order = [i for i in order if i not in at and i not in off] + sorted((i for i in order if i in at and i not in off), key=at.get)
order_all = order + [i for i in by_id if i in off and i != data['showreel']['id']]
shown = len(order)
tiles = []
for n, i in enumerate(order_all):
    w = by_id[i]
    tiles.append(f'''      <a class="tile{' gone' if n >= shown else ' extra' if n >= SHOW else ''}" data-group="{slug(w["cat"])}" {attrs(w)}>
        <img src="{e(w.get('thumb') or f'img/{i}-s.jpg')}" alt="" loading="lazy" width="720" height="405">
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
    'COUNT': str(len(works)), 'SHOWN': str(shown), 'MORE_HIDDEN': ' hidden' if shown <= SHOW else '',
    'N_COMMERCIAL': str(count['Commercial']), 'N_MUSIC': str(count['Music Video']),
    'N_ART': str(count['Fashion & Art']), 'N_DOC': str(count['Documentary']),
    'VER': time.strftime('%Y%m%d%H%M'),
}.items():
    out = out.replace('{{' + k + '}}', v)
assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
(ROOT / 'index.html').write_text(out, encoding='utf-8')
print(f'index.html built: {len(works)} films')
