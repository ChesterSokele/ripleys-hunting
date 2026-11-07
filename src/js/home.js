// Film panels: the hero film and the "from the air" film.
// Videos load only when allowed: never on data-saver / 2G connections or with reduced motion (the poster stays, with a play button).
// The hero film waits for the page's load event so it can never compete with the first paint.
export function initHome() {
  const conn = navigator.connection || {};
  const constrained = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-film]').forEach(frame => {
    const video = frame.querySelector('video');
    const toggle = frame.querySelector('[data-film-toggle]');
    if (!video) return;
    const load = () => { if (!video.src) video.src = video.dataset.src; };
    const setPaused = p => frame.classList.toggle('is-paused', p);
    setPaused(true);
    const play = () => { load(); video.play().then(() => { setPaused(false); frame.classList.add('has-played'); }).catch(() => setPaused(true)); };
    const pause = () => { video.pause(); setPaused(true); };
    let userPaused = false;

    toggle?.addEventListener('click', () => { if (video.paused) { userPaused = false; play(); } else { userPaused = true; pause(); } });
    if (constrained || reduce || !('IntersectionObserver' in window)) return;

    const watch = () => new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { if (!userPaused && video.paused) play(); } else if (!video.paused) pause();
    }, { threshold: 0.35 }).observe(frame);
    if (frame.hasAttribute('data-after-load') && document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(watch, 0), { once: true });
    else watch();
  });
}
