// Motion — GSAP (core) + one IntersectionObserver. Replaces AOS.
// Principles: transform/opacity only, one easing family, nothing hidden for long, nothing needed for function.
// With prefers-reduced-motion, ?nomotion, or if this file never loads, every element simply stays visible.
// (ScrollTrigger was deliberately dropped: ~120 triggers cost ~600 ms of main-thread time on mid-range phones;
//  one IntersectionObserver does the same job for a fraction of the cost.)
import { gsap } from 'gsap';

export function initMotion() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches || document.documentElement.classList.contains('no-motion')) return;
  gsap.defaults({ ease: 'power3.out' });
  const $$ = s => Array.from(document.querySelectorAll(s));
  const vh = window.innerHeight;

  // Only elements that start below the fold are prepared for reveal: anything already visible stays untouched.
  const below = el => el.getBoundingClientRect().top > vh * 0.92;
  const jobs = new Map();
  const queue = [];
  const add = (el, prep, play) => queue.push({ el, prep, play });

  $$('[data-reveal="stagger"]').forEach(el => {
    const kids = Array.from(el.children);
    add(el, () => gsap.set(kids, { opacity: 0, y: 34 }), () => gsap.to(kids, { opacity: 1, y: 0, duration: 1.05, stagger: 0.11, clearProps: 'all' }));
  });
  $$('[data-reveal="fade"]').forEach(el => add(el, () => gsap.set(el, { opacity: 0, y: 22 }), () => gsap.to(el, { opacity: 1, y: 0, duration: 1, clearProps: 'all' })));
  $$('[data-reveal="card"]').forEach(el => add(el, () => gsap.set(el, { opacity: 0, y: 46 }), () => gsap.to(el, { opacity: 1, y: 0, duration: 1.1, clearProps: 'all' })));
  $$('.index__row').forEach(el => add(el, () => gsap.set(el, { opacity: 0, y: 18 }), () => gsap.to(el, { opacity: 1, y: 0, duration: 0.8, clearProps: 'all' })));
  // Image reveals: an upward wipe while the photograph settles from a slight scale.
  $$('[data-reveal="image"], [data-reveal="image-card"]').forEach(el => {
    const inner = el.querySelector('img');
    add(el, () => { gsap.set(el, { clipPath: 'inset(0 0 100% 0)' }); if (inner) gsap.set(inner, { scale: 1.14 }); }, () => {
      gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.25, ease: 'power4.inOut', clearProps: 'clipPath' });
      if (inner) gsap.to(inner, { scale: 1, duration: 1.8, clearProps: 'transform' });
    });
  });

  // all layout reads first, then all style writes (no layout thrashing)
  const flags = queue.map(q => below(q.el));
  queue.forEach((q, i) => { if (flags[i]) { q.prep(); jobs.set(q.el, q.play); } });

  if (jobs.size) {
    const io = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io.unobserve(en.target);
        jobs.get(en.target)?.(); jobs.delete(en.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    jobs.forEach((_, el) => io.observe(el));
  }

  // Subtle hero parallax: one passive scroll listener, one rAF, transform only (tablet/desktop).
  const heroImg = document.querySelector('.hero__media img');
  if (heroImg && window.matchMedia('(min-width: 48rem)').matches) {
    const host = heroImg.closest('.hero, .page-hero');
    gsap.set(heroImg, { scale: 1.1, transformOrigin: '50% 40%' });
    let ticking = false;
    const update = () => {
      const h = host.offsetHeight;
      if (window.scrollY <= h) gsap.set(heroImg, { yPercent: (window.scrollY / h) * 4.5 });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  // Page exit: a short fade when following an internal link. Skipped for new tabs, modifier clicks and hash jumps.
  document.addEventListener('click', e => {
    const a = e.target instanceof Element && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (/^(mailto|tel):/.test(a.getAttribute('href'))) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname === location.pathname) return;
    e.preventDefault();
    gsap.to('main, .site-footer', { opacity: 0, y: -8, duration: 0.28, ease: 'power2.in', onComplete: () => { location.href = a.href; } });
  });
  window.addEventListener('pageshow', e => { if (e.persisted) gsap.set('main, .site-footer', { clearProps: 'all' }); });
}
