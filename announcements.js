document.addEventListener('DOMContentLoaded', function () {
    const announcementTriggers = document.querySelectorAll('.announcement-trigger');

    announcementTriggers.forEach(trigger => {
        trigger.addEventListener('click', function () {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            const contentId = this.getAttribute('aria-controls');
            const content = document.getElementById(contentId);

            // Toggle the expanded state
            this.setAttribute('aria-expanded', !isExpanded);
            content.setAttribute('aria-hidden', isExpanded);

            // Close other announcements
            announcementTriggers.forEach(otherTrigger => {
                if (otherTrigger !== trigger) {
                    const otherId = otherTrigger.getAttribute('aria-controls');
                    const otherContent = document.getElementById(otherId);
                    otherTrigger.setAttribute('aria-expanded', 'false');
                    otherContent.setAttribute('aria-hidden', 'true');
                }
            });
        });
    });

    // Winners Carousel
    const carousel = document.getElementById('winnersCarousel');
    if (carousel) {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dots = carousel.querySelectorAll('.carousel-dot');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        let currentIndex = 0;

        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            currentIndex = (index + slides.length) % slides.length;
            slides[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');
        }

        prevBtn.addEventListener('click', () => showSlide(currentIndex - 1));
        nextBtn.addEventListener('click', () => showSlide(currentIndex + 1));
        dots.forEach(dot => {
            dot.addEventListener('click', () => showSlide(parseInt(dot.dataset.index)));
        });
    }
});
