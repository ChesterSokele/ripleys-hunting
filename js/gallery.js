// Ripley Safaris — gallery filtering + lightbox
(function () {
    var grid = document.querySelector('.gallery-grid');
    if (!grid) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll('.gallery-item'));
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var lightboxCaption = document.getElementById('lightboxCaption');
    var closeBtn = document.getElementById('lightboxClose');
    var prevBtn = document.getElementById('lightboxPrev');
    var nextBtn = document.getElementById('lightboxNext');

    var visibleItems = items.slice();
    var currentIndex = 0;

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var cat = btn.getAttribute('data-filter');
            items.forEach(function (item) {
                var match = cat === 'all' || item.getAttribute('data-category') === cat;
                item.style.display = match ? '' : 'none';
            });
        });
    });

    function openLightbox(index) {
        visibleItems = items.filter(function (item) { return item.style.display !== 'none'; });
        currentIndex = visibleItems.indexOf(items[index]);
        if (currentIndex === -1) currentIndex = 0;
        showCurrent();
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function showCurrent() {
        var item = visibleItems[currentIndex];
        if (!item) return;
        var full = item.getAttribute('data-full');
        var caption = item.getAttribute('data-caption');
        lightboxImg.src = full;
        lightboxImg.alt = caption || '';
        lightboxCaption.textContent = caption || '';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        lightboxImg.src = '';
    }

    function step(delta) {
        if (!visibleItems.length) return;
        currentIndex = (currentIndex + delta + visibleItems.length) % visibleItems.length;
        showCurrent();
    }

    items.forEach(function (item, index) {
        var btn = item.querySelector('button');
        if (btn) btn.addEventListener('click', function () { openLightbox(index); });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
    if (lightbox) {
        lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });
    }
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
    });
})();
