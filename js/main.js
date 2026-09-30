// Ripley Safaris — shared behaviour: scope cursor + scroll animations
(function () {
    if (window.AOS) {
        AOS.init({ once: true, duration: 700, offset: 60 });
    }

    // Hero video: page paints instantly on the CSS gradient + text; the video
    // loads quietly in the background and only crossfades in once it can
    // actually play, so visitors never stare at a blank/black hero.
    var heroVideo = document.getElementById('heroVideo');
    if (heroVideo) {
        var revealHero = function () {
            heroVideo.classList.add('is-ready');
            heroVideo.removeEventListener('canplay', revealHero);
            heroVideo.removeEventListener('playing', revealHero);
        };
        if (heroVideo.readyState >= 3) {
            revealHero();
        } else {
            heroVideo.addEventListener('canplay', revealHero);
            heroVideo.addEventListener('playing', revealHero);
        }
    }

    var nav = document.querySelector('nav');
    if (nav) {
        var toggleNav = function () {
            if (window.scrollY > 40) { nav.classList.add('scrolled'); }
            else { nav.classList.remove('scrolled'); }
        };
        toggleNav();
        document.addEventListener('scroll', toggleNav, { passive: true });
    }

    var cursor = document.getElementById('scopeCursor');
    var dot = document.getElementById('cursorDot');
    if (!cursor || !dot) return;
    if (window.matchMedia('(max-width: 900px)').matches) return;

    var raf = null;
    document.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            dot.style.left = e.clientX + 'px';
            dot.style.top = e.clientY + 'px';
            raf = null;
        });
    });

    // Signature interaction: the reticle opens and reveals "VIEW" over any
    // photograph or clickable card; it tightens over a booking CTA. Otherwise
    // it stays small and quiet — precision, not decoration.
    var VIEW_SELECTOR = '.animal-card, .accommodation-card, .gallery-item, .card-image';
    var CTA_SELECTOR = '.book-btn, .cta-btn, .get-quote-btn, .card-view-btn';
    document.addEventListener('mouseover', function (e) {
        if (e.target.closest && e.target.closest(CTA_SELECTOR)) {
            cursor.classList.add('is-cta');
            cursor.classList.remove('is-view');
        } else if (e.target.closest && e.target.closest(VIEW_SELECTOR)) {
            cursor.classList.add('is-view');
            cursor.classList.remove('is-cta');
            dot.classList.add('is-hidden');
        }
    });
    document.addEventListener('mouseout', function (e) {
        if (e.target.closest && e.target.closest(VIEW_SELECTOR + ', ' + CTA_SELECTOR)) {
            cursor.classList.remove('is-view', 'is-cta');
            dot.classList.remove('is-hidden');
        }
    });
})();
