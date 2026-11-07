// Ripley Safaris — entry point (shared by every page)
import '@fontsource-variable/jost/wght.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '../css/main.css';

import { initTheme } from './theme.js';
import { initHeader } from './header.js';
import { initScope } from './scope.js';
import { initForm } from './form.js';
import { initDeferred } from './defer.js';

initTheme();
initHeader();
initScope();
initForm();
initDeferred();

// Page-specific / heavier modules load on demand so they never block first paint.
const has = sel => document.querySelector(sel);
if (has('[data-gallery]')) import('./gallery.js').then(m => m.initGallery());
if (has('[data-film]')) import('./home.js').then(m => m.initHome());

// Motion (GSAP) loads once the page is idle. Content is fully visible without it.
const startMotion = () => import('./motion.js').then(m => m.initMotion());
if ('requestIdleCallback' in window) requestIdleCallback(startMotion, { timeout: 800 });
else setTimeout(startMotion, 1);
