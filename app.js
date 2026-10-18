// Alex Konstantinidis · Eclipse
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- letters rise into place (screen readers keep the whole word)
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
      if (!el.closest('[aria-hidden="true"]')) el.setAttribute('aria-label', label);
    });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('play'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.split').forEach((el) => io.observe(el));
    setTimeout(() => $$('.split:not(.play)').forEach((el) => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('play'); }), 1600);

    // statement: wrap words so they can light up one by one
    $$('[data-light]').forEach((el) => {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(/\s+/).map((w) => `<span class="wd" aria-hidden="true">${w}</span>`).join(' ');
    });
  }
  const words = $$('.state .wd');

  // ---------- smooth scroll
  let lenis = null;
  if (!calm && window.Lenis) { lenis = new Lenis({ lerp: 0.09, smoothWheel: true }); root.classList.add('lenis'); }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { duration: 1.6 }); else t.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
  });

  // ---------- header hides on the way down, returns on the way up
  const top = $('.top');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (y > innerHeight * .9 && y > lastY + 2) top.classList.add('away');
    else if (y < lastY - 2 || y < 80) top.classList.remove('away');
    lastY = y;
  }, { passive: true });
  const navLinks = $$('.nav a');
  const navIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['films', 'index', 'about', 'contact'].forEach((id) => { const el = document.getElementById(id); el && navIO.observe(el); });

  // ---------- films strip: drag with momentum, wheel scrolls it sideways
  const strip = $('[data-strip]');
  const bar = $('[data-strip-bar]');
  let sv = 0, dragging = false, moved = 0, sx = 0, sl = 0, lastX = 0;
  if (strip) {
    if (fine) {
      strip.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        dragging = true; moved = 0; sx = lastX = e.clientX; sl = strip.scrollLeft; sv = 0;
      });
      addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
        if (moved > 6) strip.classList.add('dragging');
        strip.scrollLeft = sl - dx; sv = lastX - e.clientX; lastX = e.clientX;
      });
      addEventListener('pointerup', () => { if (!dragging) return; dragging = false; setTimeout(() => strip.classList.remove('dragging'), 0); });
      strip.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    }
    strip.setAttribute('data-lenis-prevent-wheel', '');
    strip.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = strip.scrollWidth - strip.clientWidth;
      if ((e.deltaY > 0 && strip.scrollLeft >= max - 1) || (e.deltaY < 0 && strip.scrollLeft <= 0)) { lenis && lenis.scrollTo(scrollY + e.deltaY, { immediate: true }); return; }
      e.preventDefault(); strip.scrollLeft += e.deltaY;
    }, { passive: false });
    strip.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { strip.scrollBy({ left: strip.clientWidth * .6, behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { strip.scrollBy({ left: -strip.clientWidth * .6, behavior: 'smooth' }); e.preventDefault(); }
    });
  }

  // ---------- index filters
  const chips = $$('.chip');
  const rows = $$('.row');
  chips.forEach((c) => c.addEventListener('click', () => {
    const f = c.dataset.filter; let k = 0;
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    rows.forEach((r) => {
      const show = f === 'all' || r.dataset.cat === f;
      r.classList.toggle('off', !show); r.classList.remove('in');
      if (show && !calm) { void r.offsetWidth; r.style.setProperty('--k', Math.min(k++, 14)); r.classList.add('in'); }
    });
  }));

  // ---------- circular preview over the index
  const preview = $('.preview');
  const pimg = $('[data-preview]');
  let px = -500, py = -500, ptx = -500, pty = -500;
  if (fine && preview) {
    $$('.row-a').forEach((a) => {
      a.addEventListener('pointerenter', (e) => {
        if (!preview.classList.contains('show')) { px = e.clientX; py = e.clientY; }
        if (pimg.getAttribute('src') !== a.dataset.img) pimg.src = a.dataset.img;
        preview.classList.add('show');
      });
      a.addEventListener('pointerleave', () => preview.classList.remove('show'));
    });
  }

  // ---------- cursor
  const cur = $('.cur');
  const curLabel = $('.cur-label');
  let cx = -100, cy = -100, ctx = -100, cty = -100;
  const contact = $('.contact');
  if (fine) {
    addEventListener('pointermove', (e) => {
      ctx = ptx = e.clientX; cty = pty = e.clientY; root.classList.add('has-cur');
      const t = e.target.closest ? e.target : null;
      const lab = t && t.closest('[data-cursor]');
      root.classList.toggle('cur-big', !!lab && !strip.classList.contains('dragging'));
      root.classList.toggle('cur-link', !lab && !!(t && t.closest('a, button')));
      if (lab) curLabel.textContent = lab.dataset.cursor;
    }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('has-cur'));
    contact.addEventListener('pointerenter', () => contact.classList.add('lit'));
    contact.addEventListener('pointerleave', () => contact.classList.remove('lit'));
  }
  let gx = 50, gy = 60;

  // ---------- player
  const player = $('.player');
  const frame = $('[data-p-frame]');
  const pTitle = $('[data-p-title]');
  const pCat = $('[data-p-cat]');
  let queue = [], qi = 0, opener = null;
  const item = (a) => ({ id: a.dataset.play, src: a.dataset.src, title: a.dataset.title, cat: a.dataset.cat });
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
      const group = a.closest('[data-strip]') ? $$('[data-strip] .frame') : $$('.row:not(.off) .row-a');
      queue = group.map(item);
      load(Math.max(0, queue.findIndex((q) => q.id === a.dataset.play)));
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
  const hero = $('.hero');
  const orb = $('.about-orb');
  let running = true, heroSp = 0;
  const loop = (t) => {
    if (!running) return;
    if (lenis) lenis.raf(t);
    const vh = innerHeight;

    if (!calm) {
      // hero: the name opens around the face as you leave
      const sp = clamp(scrollY / (vh * .9), 0, 1);
      if (Math.abs(sp - heroSp) > .0005) { heroSp = sp; hero.style.setProperty('--sp', sp.toFixed(4)); }
      // statement words light up with reading position
      if (words.length) {
        const first = words[0].getBoundingClientRect().top, last = words[words.length - 1].getBoundingClientRect().top;
        if (first < vh && last > -50) {
          const p = clamp((vh * .82 - first) / Math.max(1, (last - first) + vh * .35), 0, 1);
          const n = Math.round(p * words.length);
          words.forEach((w, i) => w.classList.toggle('lit', i < n));
        }
      }
      if (orb) {
        const r = orb.getBoundingClientRect();
        if (r.bottom > 0 && r.top < vh) orb.style.setProperty('--s', (1.2 - clamp((vh - r.top) / (vh + r.height), 0, 1) * .2).toFixed(3));
      }
      // strip momentum after a drag
      if (strip && !dragging && Math.abs(sv) > .3) { strip.scrollLeft += sv; sv *= .94; }
    }
    if (strip && bar) {
      const max = strip.scrollWidth - strip.clientWidth;
      const vis = strip.clientWidth / strip.scrollWidth;
      bar.style.width = (vis * 100).toFixed(2) + '%';
      bar.style.transform = `translateX(${(max ? strip.scrollLeft / max : 0) * (1 / vis - 1) * 100}%)`;
    }
    if (fine) {
      cx += (ctx - cx) * .2; cy += (cty - cy) * .2;
      cur.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      if (preview) { px += (ptx - px) * .14; py += (pty - py) * .14; preview.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0)`; }
      if (contact.classList.contains('lit')) {
        const r = contact.getBoundingClientRect();
        gx += (((ctx - r.left) / r.width) * 100 - gx) * .12; gy += (((cty - r.top) / r.height) * 100 - gy) * .12;
        contact.style.setProperty('--x', gx.toFixed(2) + '%'); contact.style.setProperty('--y', gy.toFixed(2) + '%');
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(loop); });

  requestAnimationFrame(() => $$('.hero .split').forEach((el) => el.classList.add('play')));
})();
