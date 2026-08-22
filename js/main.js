// Ripley Safaris — shared behaviour: scope cursor + scroll animations
(function () {
    if (window.AOS) {
        AOS.init({ once: true, duration: 700, offset: 60 });
    }

    var cursor = document.getElementById('scopeCursor');
    var dot = document.getElementById('cursorDot');
    if (!cursor || !dot) return;
    if (window.matchMedia('(max-width: 768px)').matches) return;

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
})();
