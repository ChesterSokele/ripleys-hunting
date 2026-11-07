// Theme: the inline boot script in <head> already applied the right theme (OS preference or saved choice)
// before first paint. This wires up the manual switch and follows OS changes until the visitor chooses.
const KEY = 'rs-theme';
const root = document.documentElement;
const mq = window.matchMedia('(prefers-color-scheme: light)');

function apply(theme) {
  root.setAttribute('data-theme', theme);
  document.querySelectorAll('[data-theme-toggle]').forEach(b => {
    b.setAttribute('aria-pressed', String(theme === 'light'));
    b.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  });
}
const saved = () => {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
};

export function initTheme() {
  apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* private mode: choice just won't persist */ }
  }));
  mq.addEventListener?.('change', e => { if (!saved()) apply(e.matches ? 'light' : 'dark'); });
}
