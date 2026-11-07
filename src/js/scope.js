// The signature rifle-scope cursor.
// · Fine pointers only (mouse / trackpad). Touch and coarse-pointer devices keep the native cursor.
// · One requestAnimationFrame loop, transform-only updates, no layout reads inside the loop.
// · The centre dot follows the pointer exactly (aim stays accurate); the lens glides a hair behind it.
// · pointer-events: none — it can never intercept a click.
// · Keyboard navigation (Tab) hands the cursor back to the system so focus is never confused with aim.
export function initScope() {
  const el = document.getElementById('scope');
  if (!el) return;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ring = el.querySelector('.scope__ring');
  const dot = el.querySelector('.scope__dot');
  const label = el.querySelector('.scope__label');
  const root = document.documentElement;

  let tx = -100, ty = -100, rx = tx, ry = ty, active = false, raf = 0;
  const LINK = 'a[href], button, [role="button"], summary, label.chip, select';
  const IMAGE = '.hero, .page-hero, .species-photo, .cta-band, .contact__card, .site-footer, .lightbox, .feature, .film__frame, .g-item, .mosaic a, .pkg--featured';
  const TEXT = 'input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';

  const frame = () => {
    const k = reduce.matches ? 1 : 0.22; // reduced motion: no easing, lens sits exactly on the pointer
    rx += (tx - rx) * k; ry += (ty - ry) * k;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
    dot.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    label.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) translate(-50%,-50%)`;
    raf = (Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1) ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const show = () => { active = true; root.classList.add('has-scope'); el.classList.add('is-visible'); };
  const hide = () => { active = false; root.classList.remove('has-scope'); el.classList.remove('is-visible'); };

  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') { if (active) hide(); return; }
    if (!active) { rx = tx = e.clientX; ry = ty = e.clientY; show(); } else { tx = e.clientX; ty = e.clientY; }
    kick();
  }, { passive: true });
  document.addEventListener('mouseleave', () => el.classList.remove('is-visible'));
  document.addEventListener('mouseenter', () => active && el.classList.add('is-visible'));
  window.addEventListener('keydown', e => { if (e.key === 'Tab') hide(); });

  let last = null;
  document.addEventListener('pointerover', e => {
    const t = e.target;
    if (!(t instanceof Element) || t === last) return;
    last = t;
    const view = t.closest('[data-cursor="view"]');
    el.classList.toggle('is-text', !!t.closest(TEXT));
    el.classList.toggle('is-view', !!view);
    el.classList.toggle('is-link', !!t.closest(LINK) && !view);
    el.classList.toggle('on-image', !!t.closest(IMAGE));
  }, { passive: true });
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));
}
