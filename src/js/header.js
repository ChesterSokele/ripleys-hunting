// Header: transparent over the hero, solid after scrolling; accessible mobile menu with focus management.
export function initHeader() {
  const header = document.querySelector('[data-header]');
  const menu = document.querySelector('[data-menu]');
  const btn = document.querySelector('[data-menu-toggle]');
  if (!header) return;

  let ticking = false;
  const update = () => { header.classList.toggle('is-solid', window.scrollY > 60); ticking = false; };
  update();
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });

  if (!menu || !btn) return;
  const root = document.documentElement;
  const links = () => [...menu.querySelectorAll('a')];
  const setOpen = open => {
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.inert = !open;
    if (open) links()[0]?.focus({ preventScroll: true });
  };
  menu.inert = true;
  btn.addEventListener('click', () => setOpen(!root.classList.contains('menu-open')));
  links().forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', e => {
    if (!root.classList.contains('menu-open')) return;
    if (e.key === 'Escape') { setOpen(false); btn.focus(); }
    if (e.key === 'Tab') { // keep focus inside the open menu (+ its toggle button)
      const f = [btn, ...links()];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 64rem)').addEventListener('change', e => { if (e.matches) setOpen(false); });
}
