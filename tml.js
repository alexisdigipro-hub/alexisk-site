// What alexisk.gr reads from THEMADLIONS Hub's database, shared by the page (app.js) and the admin (admin/):
// themadlions.com's films (Alex, 30 Oct: "new projects there come here by themselves") and the order and hidden films
// Alex sets in alexisk.gr/admin/ (table alexisk_site). The same rules live in build.py (tml_clean / tml_cat / the order),
// keep them in step. Public reads with the hub's publishable key, public by design.
window.ALEXISK = (() => {
  'use strict';
  const BASE = 'https://naibamqexcqnqhbbqafa.supabase.co';
  const KEY = 'sb_publishable_o1OB_ohozPq1Xr2jg2ZSHA_3GsusXFL';
  const TML = `${BASE}/rest/v1/site_works?visible=eq.true&video_id=not.is.null&select=title,categories,kind,video_id&order=position.asc,created_at.desc`;
  const ORDER = `${BASE}/rest/v1/alexisk_site?id=eq.1&select=ord,hidden`;
  const SHOW = 25; // films on the home page before "Show all work"
  const LABEL = { 'Commercial': 'Commercials', 'Music Video': 'Music Videos', 'Fashion & Art': 'Fashion & Art', 'Documentary': 'Documentary', 'Film': 'Films' };
  const slug = (c) => c.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  const clean = (t) => {
    t = t.replace(/\s+/g, ' ').trim().split(' / ')[0].replace(/\s*\|.*$/, '').replace(/\s*\((?:official|4k)[^)]*\)/gi, '')
      .replace(/\s*[-–]\s*official (?:music )?video(?:clip)?\s*$/i, '').replace(/\s*official (?:music )?video(?:clip)?\s*$/i, '').replace(/^[\s–-]+|[\s–-]+$/g, '');
    const m = t.split(/\s+[–-]\s+/);
    return [m[0].trim(), m.slice(1).join(' - ').trim()];
  };
  const catOf = (r) => {
    const c = r.categories || [];
    if (c.includes('Music Videos') || (!c.length && /official (music )?video|videoclip/i.test(r.title))) return 'Music Video';
    if (c.includes('Films')) return 'Film';
    return 'Commercial';
  };
  const get = (url) => fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  // themadlions.com's films whose video is not in `have` (a Set of video ids), as alexisk.gr's films
  const tmlFilms = (have) => get(TML).then((rows) => {
    const out = [];
    for (const r of rows) {
      const kind = r.kind || 'yt', vid = r.video_id;
      if (!vid || !['yt', 'vm'].includes(kind) || have.has(vid) || (r.categories || []).includes('Behind the Scenes')) continue;
      have.add(vid);
      const [title, sub] = clean(r.title);
      out.push({ id: `tml-${vid}`, title, sub, cat: catOf(r), src: `${kind}:${vid}`,
        thumb: kind === 'yt' ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : `https://vumbnail.com/${vid}.jpg` });
    }
    return out;
  });
  const order = () => get(ORDER).then((rows) => ({ ord: (rows[0] && rows[0].ord) || [], hidden: (rows[0] && rows[0].hidden) || [] }));
  // the films in Alex's order: a film he has not placed yet (new on themadlions.com) comes first, hidden ones go
  const arrange = (films, { ord, hidden }) => {
    if (!ord.length && !hidden.length) return films;
    const at = new Map(ord.map((id, i) => [id, i])), off = new Set(hidden);
    const fresh = films.filter((f) => !at.has(f.id) && !off.has(f.id));
    const placed = films.filter((f) => at.has(f.id) && !off.has(f.id)).sort((a, b) => at.get(a.id) - at.get(b.id));
    return [...fresh, ...placed];
  };
  return { BASE, KEY, SHOW, LABEL, slug, clean, catOf, tmlFilms, order, arrange };
})();
