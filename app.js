// Alex Konstantinidis · clear edition: filters, show more, video player
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- header gets a solid background once you scroll
  const top = $('.top');
  const navLinks = $$('.nav a');
  const sections = ['work', 'about', 'contact'].map((id) => document.getElementById(id));
  const onScroll = () => {
    top.classList.toggle('solid', scrollY > 30);
    // the active link is the last section whose top has passed the upper third of the screen
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    let cur = atEnd ? 'contact' : '';
    if (!cur) sections.forEach((s) => { if (s.getBoundingClientRect().top < innerHeight * .35) cur = s.id; });
    navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
  };
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  // ---------- work: filters + show all
  const grid = $('.grid');
  const cards = $$('.card');
  const chips = $$('.chip');
  const more = $('[data-more]');
  const animate = (list) => { if (calm) return; list.forEach((c, k) => { c.classList.remove('in'); void c.offsetWidth; c.style.setProperty('--k', Math.min(k, 12)); c.classList.add('in'); }); };
  chips.forEach((c) => c.addEventListener('click', () => {
    const f = c.dataset.filter;
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    // a category shows all of its films; "All" goes back to the short list
    grid.classList.toggle('all', f !== 'all');
    cards.forEach((card) => card.classList.toggle('off', f !== 'all' && card.dataset.cat !== f));
    animate(cards.filter((card) => card.offsetParent));
  }));
  if (more) more.addEventListener('click', () => {
    grid.classList.add('all');
    animate(cards.filter((card) => card.classList.contains('extra') && card.offsetParent));
  });

  // ---------- video player
  const player = $('.player');
  const frame = $('[data-p-frame]');
  const pTitle = $('[data-p-title]');
  const pCat = $('[data-p-cat]');
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
    pTitle.textContent = it.title; pCat.textContent = it.cat;
    frame.innerHTML = '';
    const f = document.createElement('iframe');
    f.src = embed(it.src); f.title = it.title; f.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    frame.append(f);
    $('[data-p-prev]').hidden = $('[data-p-next]').hidden = queue.length < 2;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-play]'); if (!a || !player.showModal) return;
    e.preventDefault(); opener = a;
    if (a.dataset.play === 'showreel') {
      queue = [{ id: 'showreel', src: 'yt:kpIHiBkN5Og', title: 'Showreel', cat: 'Alex Konstantinidis' }];
      load(0);
    } else {
      queue = cards.filter((c) => c.offsetParent).map((c) => { const x = $('a', c); return { id: x.dataset.play, src: x.dataset.src, title: x.dataset.title, cat: x.dataset.cat }; });
      load(Math.max(0, queue.findIndex((q) => q.id === a.dataset.play)));
    }
    player.showModal();
  });
  $('[data-p-prev]').addEventListener('click', () => load(qi - 1));
  $('[data-p-next]').addEventListener('click', () => load(qi + 1));
  $('[data-p-close]').addEventListener('click', () => player.close());
  player.addEventListener('click', (e) => { if (e.target === player || e.target.classList.contains('player-screen')) player.close(); });
  player.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && queue.length > 1) load(qi + 1);
    if (e.key === 'ArrowLeft' && queue.length > 1) load(qi - 1);
  });
  player.addEventListener('close', () => { frame.innerHTML = ''; opener && opener.focus({ preventScroll: true }); });
})();
