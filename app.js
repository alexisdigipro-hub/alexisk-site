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
    tiles.forEach((t) => t.classList.toggle('off', f !== 'all' && t.dataset.cat !== f));
    animate(tiles.filter((t) => t.offsetParent));
  }));
  const more = $('[data-more]');
  if (more) more.addEventListener('click', () => { grid.classList.add('all'); animate(tiles.filter((t) => t.classList.contains('extra'))); });

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
