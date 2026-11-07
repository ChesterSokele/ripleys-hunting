// Gallery: category filters + accessible full-resolution lightbox (keyboard, touch swipe, preloading).
// Grid tiles use ≤1280px renditions; the lightbox requests the 1920/2560px renditions (never the thumbnails).
export function initGallery() {
  const grid = document.querySelector('[data-gallery]');
  const lb = document.querySelector('[data-lightbox]');
  if (!grid || !lb) return;
  const root = grid.dataset.root || '';
  const items = [...grid.querySelectorAll('.g-item')];
  const status = document.querySelector('[data-filter-status]');
  const stage = lb.querySelector('[data-lb-stage]');
  const mount = lb.querySelector('[data-lb-media]');
  const cap = lb.querySelector('[data-lb-cap]');
  const count = lb.querySelector('[data-lb-count]');
  const btnClose = lb.querySelector('[data-lb-close]');
  const btnPrev = lb.querySelector('[data-lb-prev]');
  const btnNext = lb.querySelector('[data-lb-next]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- filters ----------
  document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    let n = 0;
    items.forEach(it => { const show = cat === 'all' || it.dataset.cat === cat; it.hidden = !show; if (show) n++; });
    if (!reduce.matches) grid.animate([{ opacity: 0.2, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,.8,.2,1)' });
    if (status) status.textContent = `Showing ${n} ${n === 1 ? 'item' : 'items'}`;
  }));

  // ---------- lightbox ----------
  let list = [], idx = 0, opener = null, token = 0;
  const visible = () => items.filter(i => !i.hidden);

  function buildImage(it, eager) {
    const id = it.dataset.id, ws = it.dataset.widths.split(',').map(Number), jpg = it.dataset.jpg;
    const set = ext => ws.map(w => `${root}media/img/${id}-${w}.${ext} ${w}w`).join(', ');
    const pic = document.createElement('picture');
    pic.innerHTML = `<source type="image/avif" srcset="${set('avif')}" sizes="100vw"><source type="image/webp" srcset="${set('webp')}" sizes="100vw">`;
    const img = document.createElement('img');
    img.className = 'lightbox__media'; img.alt = it.dataset.alt || it.dataset.caption || '';
    img.width = +it.dataset.w; img.height = +it.dataset.h; img.sizes = '100vw'; img.decoding = 'async'; img.draggable = false;
    if (eager) img.loading = 'eager';
    img.src = `${root}media/img/${id}-${jpg}.jpg`;
    pic.appendChild(img);
    return { node: pic, el: img };
  }
  function buildVideo(it) {
    const v = document.createElement('video');
    v.className = 'lightbox__media'; v.controls = true; v.playsInline = true; v.autoplay = true; v.loop = true;
    v.src = root + it.dataset.src; v.setAttribute('aria-label', it.dataset.caption || 'Video');
    const poster = it.querySelector('img'); if (poster) v.poster = poster.currentSrc || poster.src;
    v.style.maxHeight = '100%';
    return { node: v, el: v };
  }
  const preloadHost = document.createElement('div');
  preloadHost.setAttribute('aria-hidden', 'true'); preloadHost.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none';
  document.body.appendChild(preloadHost);
  function preload(i) {
    const it = list[(i + list.length) % list.length];
    if (!it || it.dataset.kind !== 'image') return;
    const { node } = buildImage(it, true); preloadHost.appendChild(node);
    while (preloadHost.children.length > 4) preloadHost.firstChild.remove();
  }

  function show(i, instant) {
    idx = (i + list.length) % list.length;
    const it = list[idx], my = ++token;
    const swap = () => {
      if (my !== token) return;
      mount.querySelector('video')?.pause();
      mount.replaceChildren();
      const built = it.dataset.kind === 'video' ? buildVideo(it) : buildImage(it, true);
      built.el.classList.add('is-swapping');
      mount.appendChild(built.node);
      const reveal = () => requestAnimationFrame(() => built.el.classList.remove('is-swapping'));
      if (built.el.complete || built.el.tagName === 'VIDEO') reveal(); else { built.el.addEventListener('load', reveal, { once: true }); built.el.addEventListener('error', reveal, { once: true }); }
      cap.textContent = it.dataset.caption || '';
      count.textContent = `${idx + 1} / ${list.length}`;
      preload(idx + 1); preload(idx - 1);
    };
    const cur = mount.firstElementChild?.querySelector?.('.lightbox__media') || mount.firstElementChild;
    if (instant || reduce.matches || !cur) swap();
    else { cur.classList.add('is-swapping'); setTimeout(swap, 220); }
  }

  const focusables = () => [btnClose, btnPrev, btnNext].filter(b => b && !b.hidden);
  function open(it) {
    list = visible(); opener = it; idx = list.indexOf(it);
    lb.classList.add('is-open'); lb.inert = false; document.documentElement.style.overflow = 'hidden';
    btnPrev.hidden = btnNext.hidden = list.length < 2;
    show(idx, true); btnClose.focus();
  }
  function close() {
    lb.classList.remove('is-open'); lb.inert = true; document.documentElement.style.overflow = '';
    mount.querySelector('video')?.pause(); token++;
    setTimeout(() => { if (!lb.classList.contains('is-open')) mount.replaceChildren(); }, 450);
    opener?.focus({ preventScroll: true });
  }
  lb.inert = true;
  items.forEach(it => it.addEventListener('click', () => open(it)));
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', () => show(idx - 1));
  btnNext.addEventListener('click', () => show(idx + 1));
  stage.addEventListener('click', e => { if (e.target === stage) close(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'Tab') {
      const f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Touch / pen swipe: left-right to navigate, a long downward drag to dismiss
  let sx = 0, sy = 0, tracking = false;
  stage.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse' || e.target.closest('video, button')) return; tracking = true; sx = e.clientX; sy = e.clientY; });
  stage.addEventListener('pointerup', e => {
    if (!tracking) return; tracking = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) show(idx + (dx < 0 ? 1 : -1));
    else if (dy > 110 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
  });
  stage.addEventListener('pointercancel', () => { tracking = false; });
}
