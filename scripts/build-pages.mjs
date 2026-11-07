// Ripley Safaris — static page generator.
// Produces index.html, packages.html, gallery.html and animals/*.html from /data so that every page shares one
// header/footer and every photograph is emitted as a correct responsive <picture> (AVIF/WebP/JPEG + srcset + dimensions).
// Run:  npm run pages        (also runs automatically before `npm run build`)
import fs from 'fs';
import path from 'path';
import { icons } from 'lucide';
import * as S from '../data/site.mjs';

const manifest = JSON.parse(fs.readFileSync('data/media-manifest.json', 'utf8'));
const speciesRaw = JSON.parse(fs.readFileSync('data/species.raw.json', 'utf8'));
const galleryRaw = JSON.parse(fs.readFileSync('data/gallery.raw.json', 'utf8'));
const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const FORM_ENDPOINT_NOTE = 'VITE_FORM_ENDPOINT';

const slug = s => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = s => decode(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// ---------- icons (Lucide, inlined at build time: no icon font, no runtime JS) ----------
const pascal = n => n.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
function icon(name, cls = '') {
  const node = icons[pascal(name)];
  if (!node) throw new Error('Unknown Lucide icon: ' + name);
  const inner = node.map(([tag, a]) => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
  return `<svg class="icon ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}

// ---------- photographs ----------
function img(id) {
  const m = manifest.images[id];
  if (!m) throw new Error('Image not in manifest: ' + id);
  return m;
}
/** Responsive <picture>. `rel` is the path prefix back to the site root ('' or '../'). */
function picture(id, { rel, sizes, alt, eager = false, priority = false, maxW }) {
  const m = img(id);
  const ws = maxW ? m.widths.filter(w => w <= maxW) : m.widths;
  const set = ext => ws.map(w => `${rel}media/img/${id}-${w}.${ext} ${w}w`).join(', ');
  const fall = `${rel}media/img/${id}-${m.jpg}.jpg`;
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${fall}" alt="${attr(alt)}" width="${m.w}" height="${m.h}" sizes="${sizes}"${eager ? ' loading="eager" decoding="async"' : ' loading="lazy" decoding="async" fetchpriority="low"'}${priority ? ' fetchpriority="high"' : ''}></picture>`;
}
/** Same as picture(), but the browser only starts downloading it after the page has loaded (see src/js/defer.js).
 *  Used for non-critical imagery so it can never compete with the hero photograph. A <noscript> copy keeps it working without JS. */
function deferredPicture(id, o) {
  const html = picture(id, o);
  const d = html.replace(/ srcset=/g, ' data-srcset=').replace(/ src=/g, ' data-src=').replace(' loading="lazy"', '').replace(' fetchpriority="low"', '');
  return d + '<noscript>' + html + '</noscript>';
}
/** Photograph in a fixed-ratio frame. */
function ph(id, o) {
  const m = img(id);
  const style = `--ph-bg:${m.bg}${o.pos ? `;--pos:${o.pos}` : ''}`;
  return `<div class="ph${o.ratio ? ' ph--' + o.ratio : ''}${o.cls ? ' ' + o.cls : ''}" style="${style}"${o.reveal === false ? '' : ' data-reveal="image"'}>${picture(id, o)}</div>`;
}
const smallest = (id, min = 480) => { const m = img(id); return m.widths.find(w => w >= min) || m.widths.at(-1); };

/** <link rel=preload> for the hero photograph (LCP) — rel is the path prefix back to the site root */
function preloadHero(id, rel = '', sizes = '100vw', media = '') { const m = img(id); return `<link rel="preload" as="image" type="image/avif" fetchpriority="high"${media ? ` media="${media}"` : ''} imagesrcset="${m.widths.map(w => `${rel}media/img/${id}-${w}.avif ${w}w`).join(', ')}" imagesizes="${sizes}">`; }

// ---------- page chrome ----------
const NAV = [
  ['home', 'Home', 'index.html'], ['species', 'Species', 'index.html#species'], ['packages', 'Packages', 'packages.html'],
  ['gallery', 'Gallery', 'gallery.html'], ['about', 'About', 'index.html#about'], ['contact', 'Contact', 'index.html#contact'],
];
const navLinks = (rel, active) => NAV.map(([k, label, href]) => `<a href="${rel}${href}"${k === active ? ' aria-current="page"' : ''}>${label}</a>`).join('');

function header(rel, active) {
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header" data-header>
  <div class="container site-header__inner">
    <a class="brand" href="${rel}index.html" aria-label="RIPLEY Safaris home">
      <span class="brand__mark" style="-webkit-mask-image:url(${rel}logo-mark.png);mask-image:url(${rel}logo-mark.png)" aria-hidden="true"></span>
      <span class="brand__word"><span class="brand__name">RIPLEY</span> <span class="brand__sub">Safaris</span></span>
    </a>
    <nav class="nav" aria-label="Primary">${navLinks(rel, active)}</nav>
    <div class="header-actions">
      <button type="button" class="icon-btn theme-toggle" data-theme-toggle aria-label="Switch colour theme" aria-pressed="false">${icon('sun', 'i-sun')}${icon('moon', 'i-moon')}</button>
      <a class="btn btn--small btn--ghost" href="${rel}index.html#contact">Book a Hunt</a>
      <button type="button" class="icon-btn menu-btn" data-menu-toggle aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon('menu', 'i-menu')}${icon('x', 'i-close')}</button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" data-menu>
  <nav aria-label="Mobile">${navLinks(rel, active)}</nav>
  <div class="mobile-menu__foot">
    <a class="btn" href="${rel}index.html#contact">Book a Hunt ${icon('arrow-right')}</a>
    <a href="${S.business.phoneHref}">${S.business.phone}</a>
    <a href="mailto:${S.business.email}">${S.business.email}</a>
  </div>
</div>`;
}

function footer(rel) {
  const b = S.business;
  return `<footer class="site-footer on-photo">
  <div class="container">
    <div class="footer__top">
      <div class="footer__lead"><p class="kicker" style="color:var(--photo-bronze)">Plan your safari</p><h2 style="margin-top:1.2rem">Leave your <em>footprint</em> in Africa</h2>
        <a class="btn" href="${rel}index.html#contact">Request a quote ${icon('arrow-right')}</a></div>
      <p style="max-width:42ch;color:rgba(244,237,220,.78)">Fair-chase hunting in the North West bushveld, with cross-border safaris into Namibia available on request.</p>
    </div>
    <div class="footer__grid">
      <div class="footer__brand">
        <a class="brand" href="${rel}index.html" aria-label="RIPLEY Safaris home"><span class="brand__mark" style="-webkit-mask-image:url(${rel}logo-mark.png);mask-image:url(${rel}logo-mark.png)" aria-hidden="true"></span><span class="brand__word"><span class="brand__name">RIPLEY</span> <span class="brand__sub">Safaris</span></span></a>
        <p>The North West's dedicated fair-chase outfitter — a privately run reserve once owned by President Paul Kruger.</p>
      </div>
      <div class="footer__col"><h3>Explore</h3><ul>
        <li><a href="${rel}index.html">Home</a></li><li><a href="${rel}index.html#species">Species</a></li><li><a href="${rel}packages.html">Packages</a></li>
        <li><a href="${rel}gallery.html">Gallery</a></li><li><a href="${rel}index.html#about">About</a></li><li><a href="${rel}index.html#contact">Contact</a></li></ul></div>
      <div class="footer__col"><h3>Contact</h3><ul>
        <li>${icon('phone')}<a href="${b.phoneHref}">${b.phone}</a></li>
        <li>${icon('mail')}<a href="mailto:${b.email}">${b.email}</a></li>
        <li>${icon('message-circle')}<a href="${b.whatsapp}" rel="noopener">WhatsApp</a></li>
        <li>${icon('map-pin')}<a href="${b.mapsHref}" rel="noopener" target="_blank">${b.address.line}, ${b.address.locality}, ${b.address.region} ${b.address.postal}, ${b.address.country}</a></li></ul></div>
      <div class="footer__col"><h3>Enquire about</h3><ul><li>Trophy Animals · RW/SCI</li><li>Bow Hunting</li><li>Fishing</li><li>Videographer</li><li>Cross-border · Namibia</li></ul></div>
    </div>
    <div class="footer__bottom"><span>© ${new Date().getFullYear()} Ripley Safaris · Rustenburg, North West, South Africa</span><a href="${rel}index.html#top">Back to top ↑</a></div>
  </div>
</footer>`;
}

const scopeMarkup = `<div class="scope" id="scope" aria-hidden="true"><span class="scope__ring"><i class="scope__outer"></i><i class="scope__lens"></i><i class="scope__h"></i><i class="scope__v"></i></span><span class="scope__dot"></span><span class="scope__label">View</span></div>`;

const themeBoot = `(function(){var d=document.documentElement;d.classList.add('js');if(/[?&]nomotion/.test(location.search))d.classList.add('no-motion');try{var t=localStorage.getItem('rs-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.setAttribute('data-theme',t)}catch(e){d.setAttribute('data-theme','dark')}})();`;

function page({ file, rel = '', title, description, active, body, hero, jsonld = [], ogImage = 'og-image.jpg', preload = '' }) {
  const url = SITE ? `${SITE}/${file === 'index.html' ? '' : file}` : '';
  const og = SITE ? `${SITE}/${ogImage}` : `${rel}${ogImage}`;
  const ld = jsonld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n  ');
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${attr(title)}</title>
  <meta name="description" content="${attr(description)}">
  <meta name="theme-color" content="#0b0f0c" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#f6f1e5" media="(prefers-color-scheme: light)">
  <script>${themeBoot}</script>
  ${url ? `<link rel="canonical" href="${url}">` : ''}
  <meta property="og:type" content="website"><meta property="og:site_name" content="Ripley Safaris">
  <meta property="og:title" content="${attr(title)}"><meta property="og:description" content="${attr(description)}">
  ${url ? `<meta property="og:url" content="${url}">` : ''}<meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${rel}favicon.png" type="image/png"><link rel="apple-touch-icon" href="${rel}apple-touch-icon.png">
  ${preload}
  <script type="module" src="${rel}src/js/main.js"></script>
  ${ld}
</head>
<body id="top" data-page="${active}">
${header(rel, active)}
<main id="main" tabindex="-1">
${body}
</main>
${footer(rel)}
${scopeMarkup}
</body>
</html>
`;
}

const businessLd = () => ({
  '@context': 'https://schema.org', '@type': 'LocalBusiness', name: S.business.name,
  description: 'Fair-chase plains game hunting safaris on a privately run reserve near Rustenburg, North West, South Africa, with cross-border hunts into Namibia.',
  telephone: S.business.phone, email: S.business.email, ...(SITE ? { url: SITE, image: `${SITE}/og-image.jpg` } : {}),
  address: { '@type': 'PostalAddress', streetAddress: S.business.address.line, addressLocality: S.business.address.locality, addressRegion: S.business.address.region, postalCode: S.business.address.postal, addressCountry: S.business.address.countryCode },
  areaServed: ['South Africa', 'Namibia'],
});

// ---------- shared fragments ----------
const sectionHead = (kicker, h2, lede = '', extra = '') => `<div class="section-head${extra}" data-reveal="stagger"><div style="display:grid;gap:1.2rem"><span class="kicker">${kicker}</span><h2>${h2}</h2></div>${lede ? `<p class="lede">${lede}</p>` : ''}</div>`;

function ctaBand(rel, { title, text, imgId = 'image00259', pos = '50% 60%' }) {
  return `<section class="cta-band on-photo" aria-labelledby="cta-h">
  <div class="ph ph--fill" style="--ph-bg:${img(imgId).bg};--pos:${pos}">${deferredPicture(imgId, { rel, sizes: '(max-width:40rem) 480px, 100vw', alt: '', maxW: 1920 })}</div>
  <div class="container cta-band__inner" data-reveal="stagger">
    <h2 id="cta-h">${title}</h2><p>${text}</p>
    <div class="cta-band__btns"><a class="btn" href="${rel}index.html#contact">Get a quote ${icon('arrow-right')}</a><a class="btn btn--ghost" href="${S.business.whatsapp}" rel="noopener">${icon('message-circle')} WhatsApp us</a><a class="btn btn--ghost" href="${rel}gallery.html">View gallery</a></div>
  </div></section>`;
}

function chips(name, list) {
  return `<div class="chips">${list.map(o => `<label class="chip"><input type="checkbox" name="${name}" value="${attr(o)}"><span>${o}</span></label>`).join('')}</div>`;
}

function enquiryForm() {
  const b = S.business;
  return `<form class="enquiry" id="enquiry" action="mailto:${b.email}" method="post" enctype="text/plain" novalidate data-endpoint-env="${FORM_ENDPOINT_NOTE}">
  <div class="row">
    <div class="field"><label for="f-first">First name <span class="req" aria-hidden="true">*</span></label><input class="input" id="f-first" name="first_name" autocomplete="given-name" required aria-describedby="e-first"><span class="field-error" id="e-first" role="alert"></span></div>
    <div class="field"><label for="f-last">Last name</label><input class="input" id="f-last" name="last_name" autocomplete="family-name"></div>
  </div>
  <div class="row">
    <div class="field"><label for="f-tel">Mobile number</label><input class="input" id="f-tel" name="mobile" type="tel" autocomplete="tel" inputmode="tel" aria-describedby="e-tel"><span class="field-error" id="e-tel" role="alert"></span></div>
    <div class="field"><label for="f-email">Email <span class="req" aria-hidden="true">*</span></label><input class="input" id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="e-email"><span class="field-error" id="e-email" role="alert"></span></div>
  </div>
  <div class="field"><label for="f-country">Country of origin</label><input class="input" id="f-country" name="country" autocomplete="country-name"></div>
  <fieldset class="fieldset"><legend>What are you interested in?</legend>${chips('interested_in', S.formOptions.interest)}</fieldset>
  <fieldset class="fieldset"><legend>Which package interests you?</legend>${chips('package', S.formOptions.package)}</fieldset>
  <fieldset class="fieldset"><legend>What type of hunting are you interested in?</legend>${chips('hunting_type', S.formOptions.hunt)}</fieldset>
  <div class="row">
    <div class="field"><label for="f-dates">Approximate dates you're looking at?</label><input class="input" id="f-dates" name="dates" placeholder="e.g. June 2027, 8 days"></div>
    <div class="field"><label for="f-guests">Number of guests</label><input class="input" id="f-guests" name="guests" type="number" value="1" min="1" inputmode="numeric"></div>
  </div>
  <div class="field"><label for="f-overview">Give us an overview of what you have in mind</label><textarea class="input" id="f-overview" name="overview" rows="4" placeholder="Caliber preferences, trophy goals, anything else we should know…"></textarea></div>
  <fieldset class="fieldset"><legend>How did you hear about us?</legend>${chips('heard_from', S.formOptions.source)}</fieldset>
  <input type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px" data-honeypot>
  <div class="enquiry__actions"><button class="btn" type="submit">Send enquiry ${icon('arrow-right')}</button><a class="link-arrow" href="${b.whatsapp}" rel="noopener">Or message us on WhatsApp ${icon('arrow-right')}</a></div>
  <p class="form-status" role="status" aria-live="polite" data-form-status></p>
</form>`;
}

function contactSection(rel) {
  const b = S.business;
  return `<section class="section" id="contact" aria-labelledby="contact-h"><div class="container contact">
  <div class="contact__form-wrap" data-reveal="stagger">
    <span class="kicker">Enquiries</span><h2 id="contact-h">Let's plan your <em>safari</em></h2>
    <p class="lede">Tell us a little about the hunt you have in mind and our team will be in touch with a tailored quote.</p>
    ${enquiryForm()}
  </div>
  <aside class="contact__card on-photo" data-reveal="fade" aria-label="Contact details">
    <h3>Leave your footprint <em>in Africa</em></h3>
    <p style="color:rgba(241,234,217,.82)">Fair chase hunting in the North West bushveld, with cross-border safaris into Namibia available on request.</p>
    <ul class="contact__list">
      <li>${icon('phone')}<div><small>Call</small><a href="${b.phoneHref}">${b.phone}</a></div></li>
      <li>${icon('mail')}<div><small>Email</small><a href="mailto:${b.email}">${b.email}</a></div></li>
      <li>${icon('map-pin')}<div><small>Find us</small><a href="${b.mapsHref}" target="_blank" rel="noopener">${b.address.line},<br>${b.address.locality}, ${b.address.region} ${b.address.postal},<br>${b.address.country}</a></div></li>
    </ul>
    <a class="btn" href="${b.whatsapp}" rel="noopener">${icon('message-circle')} Book now on WhatsApp</a>
    <ul class="contact__points"><li>${icon('badge-check')}Ethical selection</li><li>${icon('compass')}Dedicated professional hunter</li></ul>
  </aside></div></section>`;
}

// ======================================================================================
// SPECIES DATA
// ======================================================================================
const species = speciesRaw.map(s => {
  const photo = S.speciesPhotos[s.slug] || { id: 'sp-' + slug(path.basename(s.img)), alt: s.title, pos: '50% 50%' };
  const m = img(photo.id);
  const por = s.price === 'POR';
  return { ...s, photo, native: m.w < 1280, nativeW: m.w, por, feeText: por ? 'On request' : s.price, level: s.difficulty.split('–')[0].trim(), note: (s.difficulty.split('–')[1] || '').trim() };
}).sort((a, b) => a.title.localeCompare(b.title));


// ======================================================================================
// HOME
// ======================================================================================
function home() {
  const rel = '';
  const heroId = 'image00245';
  const preload = `<link rel="preload" as="image" type="image/avif" fetchpriority="high" imagesrcset="media/hero/poster-720.avif 720w, media/hero/poster-1080.avif 1080w" imagesizes="100vw">`;
  // Every species as a photo card. Species with a high-resolution original lead; the rest follow (shown at ≤ native size, 3:2 so a 363×225 file is never stretched).
  const ordered = [...species.filter(s => !s.native), ...species.filter(s => s.native)];
  const cards = ordered.map(s => `
    <a class="sp-card" href="animals/${s.slug}.html" data-cursor="view" data-reveal="card" aria-label="${attr(s.title)} — ${attr(s.level)}, ${s.por ? 'trophy fee on request' : 'trophy fee ' + attr(s.feeText)}">
      ${ph(s.photo.id, { rel, sizes: '(min-width:64rem) 20rem, (min-width:40rem) 33vw, 50vw', alt: s.photo.alt, ratio: '3x2', pos: s.photo.pos, reveal: false, maxW: 1280 })}
      <div class="sp-card__body"><div><h3>${s.title}</h3><span class="sp-card__level">${s.level}</span></div>
        <div class="sp-card__fee"><small>${s.por ? 'Trophy fee' : 'Trophy fee'}</small><b>${s.por ? 'On request' : s.feeText}</b></div></div>
    </a>`).join('');
  const pkgs = S.packages.map(p => `
    <article class="pkg${p.featured ? ' pkg--featured' : ''}" data-reveal="card">
      <span class="pkg__badge">${p.badge}</span><h3>${p.name}</h3>
      <p class="pkg__days">${icon('calendar-days')}${p.days}</p>
      <p class="pkg__price">${p.price}</p>
      <div class="pkg__list"><span class="pkg__animals-label">Includes</span><p class="pkg__animals">${p.animals}</p></div>
      <p class="pkg__desc">${p.desc}</p>
      <a class="btn" href="index.html#contact">Enquire now ${icon('arrow-right')}</a>
    </article>`).join('');
  const lodgeCards = S.lodge.map(l => `<article class="lodge-card" data-reveal="card">${ph(l.img, { rel, sizes: '(min-width:52rem) 30vw, 100vw', alt: l.alt, ratio: l.ratio, pos: l.pos })}<h3>${l.title}</h3><p>${l.text}</p></article>`).join('');
  const mosaicIds = [
    ['image00236', 'A family beside their impala trophy under a deep blue sky', '45% 60%'], ['image00247', 'Burchell\'s zebra standing in long grass', '40% 50%'],
    ['image00259', 'Giraffes above the bushveld canopy', '80% 50%'], ['image00005', 'Hunter with rifle and zebra trophy in the bushveld', '50% 50%'], ['image00244', 'Waterbuck bull in green grassland', '65% 50%'],
  ];
  const mosaic = mosaicIds.map(([id, alt, pos]) => `<a href="gallery.html" data-cursor="view" aria-label="Open gallery: ${attr(alt)}">${ph(id, { rel, sizes: '(min-width:52rem) 40vw, 50vw', alt, pos, maxW: 1280 })}</a>`).join('');
  const film = manifest.videos['gallery/full/dji_fly_20240617_165402_0954_1718735153005_video.mov'];

  const body = `
<section class="hero on-photo" aria-label="Welcome">
  <div class="hero__film is-paused" data-film data-after-load>
    <picture><source type="image/avif" srcset="media/hero/poster-720.avif 720w, media/hero/poster-1080.avif 1080w" sizes="100vw"><source type="image/webp" srcset="media/hero/poster-720.webp 720w, media/hero/poster-1080.webp 1080w" sizes="100vw"><img class="hero__poster" src="media/hero/poster-1080.jpg" width="1080" height="1920" alt="" fetchpriority="high" decoding="async"></picture>
    <video muted loop playsinline preload="none" data-src="media/hero/hero-720.mp4" data-src-lg="media/hero/hero-1080.mp4" aria-label="Footage from the reserve: a nyala in the bush, a young giraffe and a spaniel on a hunting vehicle"></video>
    <button type="button" class="film__toggle" data-film-toggle aria-label="Play or pause the hero video">${icon('pause', 'i-pause')}${icon('play', 'i-play')}</button>
  </div>
  <div class="container hero__inner">
    <div>
      <p class="kicker" data-hero="fade">Ripley Safaris · South Africa</p>
      <h1 aria-label="Leave your footprint in Africa"><span class="line"><span data-hero="line">Leave your</span></span><span class="line"><span data-hero="line"><em>footprint</em> in</span></span><span class="line"><span data-hero="line">Africa</span></span></h1>
      <p class="hero__lede" data-hero="fade">Professional guided hunting safaris in South Africa's North West province.</p>
      <div class="hero__cta" data-hero="fade"><a class="btn" href="#contact">Book a hunt ${icon('arrow-right')}</a><a class="btn btn--ghost" href="packages.html">View packages</a></div>
    </div>
  </div>
</section>

<div class="band"><div class="container"><ul class="band__list" role="list" data-reveal="stagger">
      <li><b>Plains game</b><span>Fair-chase, ethical selection</span></li>
      <li><b>Rustenburg</b><span>Privately run reserve, North West</span></li>
      <li><b>Namibia</b><span>Cross-border safaris on request</span></li>
    </ul></div></div>

<section class="section" id="about" aria-labelledby="about-h"><div class="container about">
  <div class="about__text prose" data-reveal="stagger">
    <span class="kicker">About Ripley Safaris</span>
    <h2 id="about-h">Where history meets <em>the bushveld</em></h2>
    ${S.about.map(p => `<p>${p}</p>`).join('\n    ')}
    <div class="about__note">${icon('passport' in icons ? 'passport' : 'globe')}<p>${S.crossBorder}</p></div>
  </div>
  <figure class="about__media">${ph('lodge-night-entrance', { rel, sizes: '(min-width:62rem) 40vw, 100vw', alt: 'The lodge entrance glowing at night among the trees', ratio: '4x5', pos: '50% 50%' })}<figcaption class="ph-caption">The lodge entrance at night</figcaption></figure>
</div></section>

<section class="section section--alt" id="species" aria-label="Species"><div class="container">
  ${sectionHead('South Africa', 'The <em>animals</em>', 'Twenty species across the North West bushveld. Open any species for the trophy fee, difficulty and field notes from our professional hunters.', ' section-head--split')}
  <div class="sp-grid">${cards}</div>
</div></section>

<section class="section" aria-labelledby="pk-h"><div class="container">
  ${sectionHead('Hunting packages', 'Choose your <em>safari</em>', 'Three fixed-price safaris, or let us build a custom itinerary around the trophies you want most.', ' section-head--split')}
  <div class="pkg-grid">${pkgs}</div>
  <p style="margin-top:3rem" data-reveal="fade"><a class="link-arrow" href="packages.html">Daily rates, inclusions &amp; exclusions ${icon('arrow-right')}</a></p>
</div></section>

<section class="section section--alt" aria-labelledby="film-h"><div class="container film">
  <div class="film__frame" data-film>
    <img class="film__poster" src="${film.poster.replace(/^\//, '')}" alt="" width="405" height="720" loading="lazy" decoding="async">
    <video muted loop playsinline preload="none" aria-label="Drone footage over the reserve at sunset" data-src="${film.mp4.replace(/^\//, '')}"></video>
    <button type="button" class="film__toggle" data-film-toggle aria-label="Play or pause video">${icon('pause', 'i-pause')}${icon('play', 'i-play')}</button>
  </div>
  <div class="film__text prose" data-reveal="stagger"><span class="kicker">From the air</span><h2 id="film-h">The reserve, <em>from above</em></h2>
    <p>Drone footage across the property — open bushveld, giraffe at sunset and the land that makes every hunt feel like an expedition.</p>
    <p style="margin-top:2rem"><a class="link-arrow" href="gallery.html">More photography &amp; film ${icon('arrow-right')}</a></p></div>
</div></section>

<section class="section" aria-labelledby="lodge-h"><div class="container">
  ${sectionHead('The Lodge', 'The place <em>between</em> the hunt', 'Thatch and stone-built lodging, a traditional boma and a reserve with more than a century of history around it.', ' section-head--split')}
  <div class="lodge-grid">${lodgeCards}</div>
</div></section>

<section class="section section--alt" aria-labelledby="mosaic-h"><div class="container">
  ${sectionHead('Gallery', 'Moments <em>afield</em>')}
  <h3 id="mosaic-h" class="sr-only">Photo highlights</h3>
  <div class="mosaic" data-reveal="stagger">${mosaic}</div>
  <p style="margin-top:3rem"><a class="link-arrow" href="gallery.html">See the full gallery ${icon('arrow-right')}</a></p>
</div></section>

${contactSection(rel)}`;
  return page({ file: 'index.html', title: 'Ripley Safaris | Fair-Chase Hunting Safaris, Rustenburg, South Africa', description: 'Fair-chase plains game hunting safaris on a privately run reserve near Rustenburg, North West, South Africa — with cross-border hunts into Namibia. Thatch-and-stone lodge, dedicated professional hunter.', active: 'home', body, preload, jsonld: [businessLd()] });
}

// ======================================================================================
// PACKAGES
// ======================================================================================
function packagesPage() {
  const rel = '';
  const pkgs = S.packages.map(p => `
    <article class="pkg${p.featured ? ' pkg--featured' : ''}" data-reveal="card">
      <span class="pkg__badge">${p.badge}</span><h3>${p.name}</h3>
      <p class="pkg__days">${icon('calendar-days')}${p.days}</p>
      <p class="pkg__price">${p.price}</p>
      <div class="pkg__list"><span class="pkg__animals-label">Includes</span><p class="pkg__animals">${p.animals}</p></div>
      <p class="pkg__desc">${p.desc}</p>
      <a class="btn" href="index.html#contact">Enquire now ${icon('arrow-right')}</a>
    </article>`).join('');
  const body = `
<section class="page-hero" aria-labelledby="h1"><div class="hero__media" style="--pos:75% 55%">${picture('image00244', { rel, sizes: '100vw', alt: 'Waterbuck bull standing in green grassland', eager: true, priority: true })}</div>
  <div class="container page-hero__inner"><p class="kicker" data-hero="fade">Hunting packages</p><h1 id="h1" data-hero="fade">Safari hunting <em>packages</em></h1>
  <p data-hero="fade">Book to leave your footprint in Africa. Choose a package below, or contact us to build a custom itinerary around the trophies you want most.</p></div></section>

<section class="section"><div class="container">
  ${sectionHead('Featured packages', 'Three ways to <em>hunt</em>')}
  <div class="pkg-grid">${pkgs}</div>
</div></section>

<section class="section section--alt" aria-labelledby="rates-h"><div class="container">
  ${sectionHead('Daily rates', '<span id="rates-h">Daily <em>rates</em></span>', 'For custom safaris, daily rates apply per day on the reserve.')}
  <div class="rates" data-reveal="stagger">${S.rates.map(r => `<div class="rate"><span class="rate__label">${r.label}</span><span class="rate__value">${r.value}</span><span class="rate__sub">${r.sub}</span></div>`).join('')}</div>
</div></section>

<section class="section" aria-labelledby="ie-h"><div class="container">
  ${sectionHead("What's included", '<span id="ie-h">Inclusive &amp; <em>exclusive</em></span>')}
  <div class="ie">
    <div data-reveal="fade"><h3>${icon('circle-check')}Inclusive</h3><ul role="list">${S.inclusive.map(i => `<li>${icon('check')}<span>${i}</span></li>`).join('')}</ul></div>
    <div class="ie--ex" data-reveal="fade"><h3>${icon('circle-x')}Exclusive</h3><ul role="list">${S.exclusive.map(i => `<li>${icon('x')}<span>${i}</span></li>`).join('')}</ul></div>
  </div>
</div></section>

<section class="section section--alt" aria-labelledby="enq-h"><div class="container"><div class="about" style="align-items:center">
  <div class="prose" data-reveal="stagger"><span class="kicker">Enquire about</span><h2 id="enq-h" style="margin-block:1.2rem 2rem">Beyond the <em>packages</em></h2>
    <div class="tags">${S.enquireTags.map(t => `<span class="tag">${t}</span>`).join('')}</div></div>
  <div class="about__note" style="margin:0">${icon('globe')}<p><strong>Cross-border hunting:</strong> in addition to our South African safaris, we arrange cross-border hunting trips into Namibia for hunters wanting access to a wider range of species and terrain. Speak to our team about combining both destinations in a single itinerary.</p></div>
</div></div></section>

${ctaBand(rel, { title: 'Ready to book your <em>safari?</em>', text: "Get in touch and we'll help you choose the right package or build a custom trophy list.", imgId: 'image00245', pos: '40% 60%' })}`;
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Ripley Safaris hunting packages', itemListElement: S.packages.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: p.name, description: `${p.days}. ${p.desc}`, offers: { '@type': 'Offer', priceCurrency: 'USD', price: p.price.replace(/[^0-9.]/g, '') } } })) };
  return page({ file: 'packages.html', title: 'Hunting Packages & Daily Rates | Ripley Safaris, South Africa', description: 'Ripley Safaris hunting packages, daily rates and inclusions — 6, 8 and 10 day plains game safaris near Rustenburg, South Africa, plus cross-border Namibia hunts.', active: 'packages', body, preload: preloadHero('image00244'), jsonld: [ld, businessLd()] });
}

// ======================================================================================
// GALLERY
// ======================================================================================
function galleryPage() {
  const rel = '';
  const items = galleryRaw.map(it => {
    const file = it.full.split('/').pop();
    const base = { ...it, file, cap: it.caption || it.alt };
    if (it.media === 'video') { const v = manifest.videos[it.full]; if (!v) throw new Error('video missing ' + it.full); return { ...base, v }; }
    const id = slug(file);
    return { ...base, id, m: img(id) };
  });
  const counts = c => items.filter(i => c === 'all' || i.category === c).length;
  const cats = [['all', 'All'], ['hunting', 'Hunting'], ['wildlife', 'Wildlife'], ['lodge', 'Lodge & Suites'], ['reserve', 'On the Reserve']];
    const tiles = items.map(it => {
    if (it.v) {
      const poster = it.v.poster.replace(/^\//, '');
      return `<button type="button" class="g-item" data-cat="${it.category}" data-kind="video" data-src="${it.v.mp4.replace(/^\//, '')}" data-caption="${attr(it.cap)}" data-cursor="view" style="--ar:9/16"><div class="ph" style="--ph-bg:#10150f"><img src="${poster}" alt="${attr(it.alt)} (video)" width="405" height="720" loading="lazy" decoding="async"></div><span class="g-play">${icon('play')}</span><span class="g-cap">${it.cap}</span></button>`;
    }
    const sizes = '(min-width:64rem) 33vw, (min-width:36rem) 50vw, 100vw';
    return `<button type="button" class="g-item" data-cat="${it.category}" data-kind="image" data-id="${it.id}" data-widths="${it.m.widths.join(',')}" data-jpg="${it.m.jpg}" data-w="${it.m.w}" data-h="${it.m.h}" data-caption="${attr(it.cap)}" data-alt="${attr(it.alt)}" data-cursor="view" style="--ar:${it.m.w}/${it.m.h}"><div class="ph" style="--ph-bg:${it.m.bg}">${deferredPicture(it.id, { rel, sizes, alt: it.alt, maxW: 1280 })}</div><span class="g-cap">${it.cap}</span></button>`;
  }).join('\n');
  const body = `
<section class="page-hero" aria-labelledby="h1"><div class="hero__media" style="--pos:75% 50%">${picture('image00259', { rel, sizes: '100vw', alt: 'Giraffes rising above the bushveld canopy beneath misty hills', eager: true, priority: true })}</div>
  <div class="container page-hero__inner"><p class="kicker" data-hero="fade">Gallery</p><h1 id="h1" data-hero="fade">Wildlife, lodge &amp; <em>the reserve</em></h1>
  <p data-hero="fade">Wildlife, lodge life, and the reserve at Ripley Safaris — Rustenburg, North West, South Africa.</p></div></section>

<section class="section"><div class="container">
  <div class="filters" role="group" aria-label="Filter the gallery" data-filters>${cats.map(([k, l], i) => `<button type="button" class="filter" data-filter="${k}" aria-pressed="${i === 0}">${l}<small>${counts(k)}</small></button>`).join('')}</div>
  <p class="sr-only" role="status" aria-live="polite" data-filter-status></p>
  <div class="masonry" data-gallery data-root="${rel}">${tiles}</div>
</div></section>

${ctaBand(rel, { title: 'See it for <em>yourself</em>', text: 'Photographs only tell part of the story. Talk to our team about your own safari on the reserve.', imgId: 'image00245', pos: '40% 60%' })}

<div class="lightbox on-photo" id="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" data-lightbox>
  <div class="lightbox__bar"><span data-lb-count aria-live="polite"></span><button type="button" class="icon-btn" data-lb-close aria-label="Close viewer">${icon('x')}</button></div>
  <div class="lightbox__stage" data-lb-stage>
    <button type="button" class="icon-btn lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Previous">${icon('chevron-left')}</button>
    <div data-lb-media style="display:contents"></div>
    <button type="button" class="icon-btn lightbox__nav lightbox__nav--next" data-lb-next aria-label="Next">${icon('chevron-right')}</button>
  </div>
  <p class="lightbox__cap" data-lb-cap></p>
</div>`;
  return page({ file: 'gallery.html', title: 'Gallery | Ripley Safaris — Wildlife, Lodge & Reserve, South Africa', description: 'Photo and film gallery of Ripley Safaris — wildlife, hunting moments, the lodge and the reserve near Rustenburg, North West, South Africa.', active: 'gallery', body, preload: preloadHero('image00259'), jsonld: [businessLd()] });
}

// ======================================================================================
// SPECIES PAGES
// ======================================================================================
function speciesPage(s, i) {
  const rel = '../';
  const prev = species[(i - 1 + species.length) % species.length], next = species[(i + 1) % species.length];
  const m = img(s.photo.id);
  const native = s.native ? `--native:${m.w}px` : '';
  const sentence = decode(s.about).split(/(?<=\.)\s/)[0];
  const desc = `${s.title} hunting at Ripley Safaris, Rustenburg, South Africa. ${sentence}`.slice(0, 300);
  const body = `
<section class="species-hero"><div class="container species-hero__inner">
  <div>
    <ol class="crumbs" aria-label="Breadcrumb"><li><a href="${rel}index.html">Home</a></li><li><a href="${rel}index.html#species">Species</a></li><li aria-current="page">${s.title}</li></ol>
    <p class="kicker" data-hero="fade">${icon('map-pin')} ${s.badge}</p>
    <h1 data-hero="fade">${s.title}</h1>
    <p class="difficulty" data-hero="fade">${icon('target')}<span>${s.difficulty.replace('–', '—')}</span></p>
  </div>
  <figure class="species-photo" style="${native}" data-hero="fade">${ph(s.photo.id, { rel, sizes: '(min-width:62rem) 50vw, 100vw', alt: s.photo.alt, ratio: s.native ? '' : '3x2', pos: s.photo.pos, cls: s.native ? 'ph--native' : '', eager: true, priority: true, reveal: false })}</figure>
</div></section>

<section class="section"><div class="container species-body">
  <aside class="species-aside" aria-label="Trophy fee and facts">
    <div class="fee"><small>${s.priceLabel}</small><span class="fee__value">${s.por ? 'On request' : s.price}</span><p>${s.priceSub}</p></div>
    <dl class="facts">${s.stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  </aside>
  <div class="prose" data-reveal="stagger">
    <h2>${s.aboutTitle}</h2><p>${s.about}</p>
    <h2 style="margin-top:3rem">Hunting tips</h2>
    <ol class="tips" role="list">${s.tips.map(t => `<li><span>${t}</span></li>`).join('')}</ol>
  </div>
</div></section>

<nav class="pager" aria-label="More species"><a href="${prev.slug}.html" rel="prev"><small>← Previous species</small><span>${prev.title}</span></a><a class="next" href="${next.slug}.html" rel="next"><small>Next species →</small><span>${next.title}</span></a></nav>

${ctaBand(rel, { title: `Ready to hunt the <em>${s.title}?</em>`, text: s.ctaText, imgId: 'image00245', pos: '40% 60%' })}`;
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', 'index.html'], ['Species', 'index.html#species'], [s.title, `animals/${s.slug}.html`]].map(([n, h], k) => ({ '@type': 'ListItem', position: k + 1, name: n, ...(SITE ? { item: `${SITE}/${h}` } : {}) })) };
  return page({ file: `animals/${s.slug}.html`, rel, title: `${s.title} Hunting | Ripley Safaris, South Africa`, description: desc, active: 'species', body, preload: preloadHero(s.photo.id, rel, '(min-width:62rem) 50vw, 100vw'), jsonld: [ld], ogImage: 'og-image.jpg' });
}

// ======================================================================================
fs.mkdirSync('animals', { recursive: true });
const out = { 'index.html': home(), 'packages.html': packagesPage(), 'gallery.html': galleryPage() };
species.forEach((s, i) => { out[`animals/${s.slug}.html`] = speciesPage(s, i); });
for (const [f, html] of Object.entries(out)) fs.writeFileSync(f, html);
fs.writeFileSync('data/pages.json', JSON.stringify(Object.keys(out)));
console.log('pages generated:', Object.keys(out).length);

// sitemap + robots (need an absolute site URL — pass SITE_URL=https://your-domain when building)
if (SITE) {
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(out).map(f => `  <url><loc>${SITE}/${f === 'index.html' ? '' : f}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  console.log('sitemap.xml + robots.txt written for', SITE);
} else if (!fs.existsSync('public/robots.txt')) {
  fs.writeFileSync('public/robots.txt', 'User-agent: *\nAllow: /\n');
  console.log('robots.txt written (no SITE_URL set, so no sitemap — see README)');
}
