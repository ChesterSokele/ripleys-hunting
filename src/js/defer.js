// Deferred imagery: <img data-src> / <source data-srcset> start downloading only once the page has finished loading
// and then only as they approach the viewport. Keeps the hero photograph (the LCP element) from competing for bandwidth
// and saves data for photographs the visitor never scrolls to. A <noscript> copy exists for every one.
export function initDeferred() {
  const imgs = [...document.querySelectorAll('img[data-src]')];
  if (!imgs.length) return;
  const hydrate = img => {
    img.parentElement.querySelectorAll('source[data-srcset]').forEach(s => { s.srcset = s.dataset.srcset; s.removeAttribute('data-srcset'); });
    img.src = img.dataset.src; img.removeAttribute('data-src');
  };
  const start = () => {
    if (!('IntersectionObserver' in window)) return imgs.forEach(hydrate);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); hydrate(e.target); } }), { rootMargin: '700px 0px' });
    imgs.forEach(i => io.observe(i));
  };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', () => setTimeout(start, 0), { once: true });
}
