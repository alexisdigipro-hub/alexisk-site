// Alex Konstantinidis · bar, filters, show all, the brief, the film player
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- the bar turns solid (and shows the name) once the opening is behind you
  const bar = $('#bar');
  const onScroll = () => bar.classList.toggle('solid', scrollY > innerHeight * .6);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  // ---------- work: filters and "Show all work"
  const grid = $('.grid');
  const tiles = $$('.tile');
  const animate = (list) => { if (calm) return; list.forEach((t, k) => { t.classList.remove('in'); void t.offsetWidth; t.style.setProperty('--k', Math.min(k, 14)); t.classList.add('in'); }); };
  $$('.filters button').forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    $$('.filters button').forEach((x) => x.classList.toggle('on', x === b));
    grid.classList.toggle('all', f !== 'all');   // a category shows all of its films
    tiles.forEach((t) => t.classList.toggle('off', f !== 'all' && t.dataset.group !== f));
    animate(tiles.filter((t) => t.offsetParent));
  }));
  const more = $('[data-more]');
  if (more) more.addEventListener('click', () => { grid.classList.add('all'); animate(tiles.filter((t) => t.classList.contains('extra'))); });

  // ---------- themadlions.com's newest work, on the page at once (Alex, 30 Oct: "new projects there come here by
  // themselves"). build.py puts them in the page every few hours; this adds any film added since, with the same rules
  // (build.py tml_clean / tml_cat), after everything else. Nothing changes when it cannot be reached.
  const TML = 'https://naibamqexcqnqhbbqafa.supabase.co/rest/v1/site_works?visible=eq.true&video_id=not.is.null&select=title,categories,kind,video_id&order=position.asc,created_at.desc';
  const TML_KEY = 'sb_publishable_o1OB_ohozPq1Xr2jg2ZSHA_3GsusXFL';
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
  if (grid && window.fetch) fetch(TML, { headers: { apikey: TML_KEY, Authorization: `Bearer ${TML_KEY}` } })
    .then((r) => (r.ok ? r.json() : []))
    .then((rows) => {
      const have = new Set([...$$('[data-src]')].map((a) => a.dataset.src.split(':')[1]));
      let added = 0;
      for (const r of rows) {
        const kind = r.kind || 'yt', vid = r.video_id;
        if (!vid || !['yt', 'vm'].includes(kind) || have.has(vid) || (r.categories || []).includes('Behind the Scenes')) continue;
        have.add(vid);
        const [title, sub] = clean(r.title), cat = catOf(r), full = title + (sub ? ' · ' + sub : '');
        const a = document.createElement('a');
        a.className = 'tile extra';
        Object.assign(a.dataset, { group: slug(cat), play: `tml-${vid}`, src: `${kind}:${vid}`, title: full, cat });
        a.href = kind === 'yt' ? `https://www.youtube.com/watch?v=${vid}` : `https://vimeo.com/${vid}`;
        a.target = '_blank'; a.rel = 'noopener';
        const img = document.createElement('img');
        img.src = kind === 'yt' ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : `https://vumbnail.com/${vid}.jpg`;
        img.alt = ''; img.loading = 'lazy'; img.width = 720; img.height = 405;
        const play = document.createElement('span'); play.className = 'play'; play.setAttribute('aria-hidden', 'true');
        play.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg>';
        const cap = document.createElement('span'); cap.className = 'cap';
        const strong = document.createElement('strong'); strong.textContent = full;
        if (/[\u0370-\u03ff\u1f00-\u1fff]/.test(full)) strong.lang = 'el';
        const lab = document.createElement('span'); lab.textContent = LABEL[cat];
        cap.append(strong, lab); a.append(img, play, cap);
        grid.append(a); tiles.push(a); added++;
        // a category the page did not have yet gets its filter
        if (!$(`.filters [data-filter="${slug(cat)}"]`)) {
          const b = document.createElement('button'); b.type = 'button'; b.dataset.filter = slug(cat); b.textContent = LABEL[cat];
          $('.filters').append(b);
          b.addEventListener('click', () => {
            $$('.filters button').forEach((x) => x.classList.toggle('on', x === b));
            grid.classList.add('all');
            tiles.forEach((t) => t.classList.toggle('off', t.dataset.group !== b.dataset.filter));
            animate(tiles.filter((t) => t.offsetParent));
          });
        }
      }
      if (added && more) more.textContent = more.textContent.replace(/\d+/, String(tiles.length));
    })
    .catch(() => {});

  // ---------- contact: pick a type, write a line, it opens the email app ready to send
  const brief = $('[data-brief]');
  if (brief) {
    const choices = $$('.choices button', brief);
    choices.forEach((c) => c.addEventListener('click', () => choices.forEach((x) => x.classList.toggle('on', x === c))));
    brief.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = (choices.find((c) => c.classList.contains('on')) || {}).textContent || 'Project';
      const name = brief.elements.name.value.trim(), msg = brief.elements.msg.value.trim();
      location.href = `mailto:alexisk@outlook.com?subject=${encodeURIComponent(`${type}: ${name}`)}&body=${encodeURIComponent(`${msg}\n\n${name}`)}`;
    });
  }

  // ---------- the film, full screen
  const player = $('.player');
  const frame = $('[data-p-frame]');
  const pTitle = $('[data-p-title]');
  const prev = $('[data-p-prev]'), next = $('[data-p-next]');
  let queue = [], qi = 0, opener = null;
  const embed = (src) => {
    const [kind, id] = src.split(':');
    return kind === 'yt'
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
      : `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`;
  };
  const load = (i) => {
    qi = (i + queue.length) % queue.length;
    const it = queue[qi];
    pTitle.textContent = it.title + (it.cat ? '  ·  ' + it.cat : '');
    frame.innerHTML = '';
    const f = document.createElement('iframe');
    f.src = embed(it.src); f.title = it.title; f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    frame.append(f);
    prev.hidden = next.hidden = queue.length < 2;
  };
  const open = () => { player.hidden = false; requestAnimationFrame(() => player.classList.add('open')); document.body.style.overflow = 'hidden'; $('[data-p-close]').focus(); };
  const close = () => {
    player.classList.remove('open'); document.body.style.overflow = '';
    setTimeout(() => { player.hidden = true; frame.innerHTML = ''; }, 350);
    opener && opener.focus({ preventScroll: true });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-play]'); if (!a) return;
    e.preventDefault(); opener = a;
    if (a.dataset.play === 'showreel') queue = [{ id: 'showreel', src: 'yt:kpIHiBkN5Og', title: 'Showreel', cat: '' }];
    else queue = tiles.filter((t) => t.offsetParent).map((t) => ({ id: t.dataset.play, src: t.dataset.src, title: t.dataset.title, cat: t.dataset.cat }));
    load(Math.max(0, queue.findIndex((q) => q.id === a.dataset.play)));
    open();
  });
  prev.addEventListener('click', () => load(qi - 1));
  next.addEventListener('click', () => load(qi + 1));
  $('[data-p-close]').addEventListener('click', close);
  player.addEventListener('click', (e) => { if (e.target === player) close(); });
  document.addEventListener('keydown', (e) => {
    if (player.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && queue.length > 1) load(qi + 1);
    if (e.key === 'ArrowLeft' && queue.length > 1) load(qi - 1);
  });
})();
