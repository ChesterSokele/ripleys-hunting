// Ripley Safaris — homepage hero slideshow
(function () {
    var slides = document.querySelectorAll('.hero-slide');
    if (!slides.length) return;
    var current = 0;
    function nextSlide() {
        slides[current] && slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current] && slides[current].classList.add('active');
    }
    setInterval(nextSlide, 6000);
})();
