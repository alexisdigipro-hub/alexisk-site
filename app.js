// Alex Konstantinidis · the projector light
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- clock (Greece) + year
  const clock = $('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Athens' });
  const tick = () => { if (clock) clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 15000);
  const yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- split headings into letters (screen readers keep the whole word)
  if (!calm) {
    root.classList.add('fx');
    $$('.split').forEach((el) => {
      const label = el.textContent.trim(); let i = 0;
      el.textContent = '';
      label.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) { el.append(' '); return; }
        const word = document.createElement('span'); word.className = 'w'; word.setAttribute('aria-hidden', 'true');
        for (const c of w) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', i++); word.append(s); }
        el.append(word);
      });
      el.setAttribute('aria-label', label);
    });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('play'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.split').forEach((el) => io.observe(el));
    setTimeout(() => $$('.split:not(.play)').forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('play'); }), 1400);
  }

  // ---------- hero: the projector cuts between frames, timecode runs at 25 fps
  const hero = $('.hero');
  const frames = $$('.hero-frames img');
  const frameBox = $('.hero-frames');
  const heroTitle = $('[data-hero-title]');
  const heroN = $('[data-hero-n]');
  const tc = $('[data-tc]');
  let fi = 0, heroVisible = true, lastCut = performance.now();
  const setFrame = (n) => {
    frames[fi].classList.remove('on');
    fi = (n + frames.length) % frames.length;
    const f = frames[fi];
    f.loading = 'eager';
    f.classList.add('on');
    if (heroTitle) heroTitle.textContent = f.dataset.title || '';
    if (heroN) heroN.textContent = String(fi + 1).padStart(2, '0');
    frameBox.classList.remove('cut'); void frameBox.offsetWidth; frameBox.classList.add('cut');
    frames[(fi + 1) % frames.length].loading = 'eager';
  };
  if (frames.length) {
    if (heroTitle) heroTitle.textContent = frames[0].dataset.title || '';
    // warm the next frame so the first cut never shows black
    addEventListener('load', () => { frames[1] && (frames[1].loading = 'eager'); });
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
  }
  const t0 = performance.now();
  const timecode = (ms) => {
    const f = Math.floor(ms / 40), p = (n) => String(n).padStart(2, '0');
    return `${p(Math.floor(f / 90000) % 24)}:${p(Math.floor(f / 1500) % 60)}:${p(Math.floor(f / 25) % 60)}:${p(f % 25)}`;
  };

  // projector light follows the pointer (drifts on its own on touch screens)
  let lx = 62, ly = 42, ltx = 62, lty = 42, pointerOnHero = false;
  if (hero) {
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = hero.getBoundingClientRect();
      ltx = ((e.clientX - r.left) / r.width) * 100; lty = ((e.clientY - r.top) / r.height) * 100; pointerOnHero = true;
    });
    hero.addEventListener('pointerleave', () => { pointerOnHero = false; });
  }

  // ---------- smooth scroll
  let lenis = null;
  if (!calm && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    root.classList.add('lenis');
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.6 }); else t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
  });

  // ---------- header: shows on scroll up, hides on scroll down
  const top = $('.top');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    top.classList.toggle('stuck', y > 40);
    top.classList.toggle('away', y > innerHeight * .8 && y > lastY + 2 && !player.open);
    if (y < lastY - 2) top.classList.remove('away');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  const navLinks = $$('.nav a');
  const navIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'index', 'about', 'contact'].forEach((id) => { const el = document.getElementById(id); el && navIO.observe(el); });

  // ---------- counters
  const counters = $$('[data-count]');
  if (!calm) {
    const cio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, start = performance.now();
      const step = (t) => { const p = clamp((t - start) / 1400, 0, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
      el.textContent = '0'; requestAnimationFrame(step);
    }), { threshold: .6 });
    counters.forEach((c) => cio.observe(c));
  }

  // ---------- index filters
  const chips = $$('.chip');
  const rows = $$('.row');
  const empty = $('.rows-empty');
  chips.forEach((c) => c.addEventListener('click', () => {
    const f = c.dataset.filter;
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    let k = 0;
    rows.forEach((r) => {
      const show = f === 'all' || r.dataset.cat === f;
      r.classList.toggle('off', !show);
      r.classList.remove('in');
      if (show && !calm) { void r.offsetWidth; r.style.setProperty('--k', Math.min(k++, 14)); r.classList.add('in'); }
    });
    if (empty) empty.hidden = rows.some((r) => !r.classList.contains('off'));
  }));

  // ---------- floating preview over the index
  const preview = $('.preview');
  const pimg = $('[data-preview]');
  let px = 0, py = 0, ptx = 0, pty = 0, pvel = 0;
  if (fine && preview) {
    $$('.row-a').forEach((a) => {
      a.addEventListener('pointerenter', () => {
        if (pimg.getAttribute('src') !== a.dataset.img) pimg.src = a.dataset.img;
        preview.classList.add('show');
      });
      a.addEventListener('pointerleave', () => preview.classList.remove('show'));
    });
    addEventListener('pointermove', (e) => { ptx = e.clientX; pty = e.clientY; }, { passive: true });
  }

  // ---------- cursor
  const cur = $('.cur');
  const curLabel = $('.cur-label');
  let cx = -100, cy = -100, ctx = -100, cty = -100;
  if (fine) {
    addEventListener('pointermove', (e) => {
      ctx = e.clientX; cty = e.clientY; root.classList.add('has-cur');
      const t = e.target.closest ? e.target : null;
      const lab = t && t.closest('[data-cursor]');
      root.classList.toggle('cur-big', !!lab);
      root.classList.toggle('cur-link', !lab && !!(t && t.closest('a, button')));
      if (lab) curLabel.textContent = lab.dataset.cursor;
    }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('has-cur'));
  }

  // ---------- magnetic play button
  const reelDot = $('.reel-dot');
  const mag = { x: 0, y: 0, tx: 0, ty: 0 };
  if (fine && !calm && reelDot) {
    const reel = reelDot.parentElement;
    reel.addEventListener('pointermove', (e) => { const r = reelDot.getBoundingClientRect(); mag.tx = (e.clientX - r.left - r.width / 2) * .35; mag.ty = (e.clientY - r.top - r.height / 2) * .35; });
    reel.addEventListener('pointerleave', () => { mag.tx = mag.ty = 0; });
  }

  // ---------- scroll-linked image work: aperture gates + slow zoom
  const gates = $$('.gate');
  const aboutImg = $('.about-img');
  const track = $('.marquee-track');
  let mx = 0, vel = 0;

  // ---------- player
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
  const visibleQueue = () => $$('.row:not(.off) .row-a').map((a) => ({ id: a.dataset.play, src: a.dataset.src, title: a.dataset.title, cat: a.dataset.cat }));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-play]'); if (!a || !player.showModal) return;
    e.preventDefault(); opener = a;
    if (a.dataset.play === 'showreel') {
      queue = [{ id: 'showreel', src: 'yt:kpIHiBkN5Og', title: 'Showreel', cat: 'Alex Konstantinidis' }];
      load(0);
    } else {
      queue = visibleQueue();
      let i = queue.findIndex((q) => q.id === a.dataset.play);
      if (i < 0) { queue = $$('.row-a').map((x) => ({ id: x.dataset.play, src: x.dataset.src, title: x.dataset.title, cat: x.dataset.cat })); i = queue.findIndex((q) => q.id === a.dataset.play); }
      load(Math.max(0, i));
    }
    player.showModal();
    lenis && lenis.stop();
  });
  $('[data-p-prev]').addEventListener('click', () => load(qi - 1));
  $('[data-p-next]').addEventListener('click', () => load(qi + 1));
  $('[data-p-close]').addEventListener('click', () => player.close());
  player.addEventListener('click', (e) => { if (e.target === player || e.target.classList.contains('player-screen')) player.close(); });
  player.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && queue.length > 1) load(qi + 1);
    if (e.key === 'ArrowLeft' && queue.length > 1) load(qi - 1);
  });
  player.addEventListener('close', () => { frame.innerHTML = ''; lenis && lenis.start(); opener && opener.focus({ preventScroll: true }); });

  // ---------- one loop for everything
  let running = true;
  const loop = (t) => {
    if (!running) return;
    if (lenis) lenis.raf(t);
    const vh = innerHeight;

    if (heroVisible && frames.length) {
      if (tc) tc.textContent = timecode(t - t0);
      if (!calm && frames.length > 1 && t - lastCut > 1900) { lastCut = t; setFrame(fi + 1); }
      if (!pointerOnHero) { const s = (t - t0) / 1000; ltx = 58 + Math.sin(s * .45) * 22; lty = 40 + Math.cos(s * .31) * 14; }
      lx += (ltx - lx) * .08; ly += (lty - ly) * .08;
      hero.style.setProperty('--x', lx.toFixed(2) + '%'); hero.style.setProperty('--y', ly.toFixed(2) + '%');
    }

    if (!calm) {
      for (const g of gates) {
        const r = g.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) continue;
        const p = clamp((vh - r.top) / (vh * .8), 0, 1), e = 1 - Math.pow(1 - p, 3);
        g.style.setProperty('--g', ((1 - e) * 14).toFixed(2) + '%');
        g.style.setProperty('--s', (1.22 - e * .22).toFixed(3));
      }
      if (aboutImg) {
        const r = aboutImg.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) aboutImg.style.setProperty('--s', (1.16 - clamp((vh - r.top) / (vh + r.height), 0, 1) * .16).toFixed(3));
      }
      if (track) {
        const v = lenis ? lenis.velocity : 0;
        vel += (clamp(v, -40, 40) - vel) * .1;
        mx -= .6 + Math.abs(vel) * .35;
        const w = track.scrollWidth / 2; if (w && -mx > w) mx += w;
        track.style.transform = `translate3d(${mx.toFixed(1)}px,0,0) skewX(${(-vel * .25).toFixed(2)}deg)`;
      }
      reelDot && (mag.x += (mag.tx - mag.x) * .15, mag.y += (mag.ty - mag.y) * .15, reelDot.style.translate = `${mag.x.toFixed(1)}px ${mag.y.toFixed(1)}px`);
    }

    if (fine) {
      cx += (ctx - cx) * .2; cy += (cty - cy) * .2;
      cur.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      if (preview) {
        const nx = px + (ptx - px) * .12; pvel = nx - px; px = nx; py += (pty - py) * .12;
        preview.style.transform = `translate3d(${(px + 28).toFixed(1)}px,${(py - preview.offsetHeight / 2).toFixed(1)}px,0) rotate(${clamp(pvel * .3, -6, 6).toFixed(2)}deg)`;
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(loop); });

  // hero title plays on load
  requestAnimationFrame(() => $$('.hero .split').forEach((el) => el.classList.add('play')));
})();
