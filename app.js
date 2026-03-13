document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // 1. Core Variables
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const mainHeader = document.querySelector('.main-header');
    const scrollProgress = document.getElementById('scroll-progress');

    // Set blurred background images for data storytelling slides securely
    document.querySelectorAll('.viz-lightbox-trigger').forEach(trigger => {
        const img = trigger.querySelector('img');
        const blurDiv = trigger.querySelector('.viz-bg-blur');
        if (img && blurDiv) {
            blurDiv.style.backgroundImage = `url(${img.src})`;
        }
    });

    // 2. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    const updateTheme = (theme) => {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };
    
    updateTheme(savedTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            updateTheme(newTheme);
        });
    }

    // 3. Mobile Navigation Menu
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileMenu = document.getElementById('mobile-nav-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    const toggleMobileMenu = () => {
        mobileToggle.classList.toggle('is-active');
        mobileMenu.classList.toggle('is-active');
        bodyEl.classList.toggle('menu-is-active');
    };

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
        mobileLinks.forEach(link => link.addEventListener('click', toggleMobileMenu));
    }

    // 4. Smooth Scrolling Logic & Active States
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 90; 
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // 5. Scroll Events (Header, Active Link, Progress Bar)
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentScroll = window.scrollY;
                
                // Header Shrink
                if (currentScroll > 50) {
                    mainHeader.classList.add('scrolled');
                } else {
                    mainHeader.classList.remove('scrolled');
                }

                // Scroll Progress Bar
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progressWidth = (currentScroll / totalHeight) * 100;
                if(scrollProgress) scrollProgress.style.width = `${progressWidth}%`;

                // Active Navigation Highlight
                let currentSection = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - 150;
                    const sectionHeight = section.clientHeight;
                    if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
                        currentSection = section.getAttribute('id');
                    }
                });

                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentSection}`) {
                        link.classList.add('active');
                    }
                });
                
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // 6. Extended Gallery Toggle 
    const showMoreBtn = document.getElementById('show-more-btn');
    const extendedWork = document.getElementById('extended-work');

    if (showMoreBtn && extendedWork) {
        showMoreBtn.addEventListener('click', () => {
            const isShowing = extendedWork.classList.contains('show');
            if (!isShowing) {
                extendedWork.classList.add('show');
                showMoreBtn.querySelector('span').textContent = 'Hide Extended Gallery';
                showMoreBtn.querySelector('i').style.transform = 'rotate(180deg)';
            } else {
                extendedWork.classList.remove('show');
                showMoreBtn.querySelector('span').textContent = 'Show Extended Gallery';
                showMoreBtn.querySelector('i').style.transform = 'rotate(0deg)';
                document.getElementById('projects').scrollIntoView({behavior: 'smooth'});
            }
        });
    }

    // 7. FAQ Accordion Logic
    const faqAccordions = document.querySelectorAll('.faq-item');
    faqAccordions.forEach(item => {
        const summary = item.querySelector('summary');
        if (summary) {
            summary.addEventListener('click', () => {
                const parentGroup = item.parentElement;
                const siblings = parentGroup.querySelectorAll('details');
                
                siblings.forEach(sibling => {
                    if (sibling !== item && sibling.open) {
                        sibling.open = false;
                    }
                });
            });
        }
    });

    // 8. Visualisations Lightbox
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-image');
    const closeBtn = document.querySelector('.lightbox-close');

    if (modal) {
        document.querySelectorAll('.viz-lightbox-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const img = trigger.querySelector('img');
                if (img) {
                    modal.style.display = 'flex';
                    modalImg.src = img.src;
                    modalImg.alt = img.alt;
                    bodyEl.style.overflow = 'hidden';
                }
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            bodyEl.style.overflow = '';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target === closeBtn.querySelector('i')) {
                modal.style.display = 'none';
                bodyEl.style.overflow = '';
            }
        });
    }

    // 9. Visualisations Simple Carousel Controls
    const vizViewport = document.querySelector('.viz-carousel-viewport');
    const btnNext = document.getElementById('viz-next-btn');
    const btnPrev = document.getElementById('viz-prev-btn');

    if (vizViewport && btnNext && btnPrev) {
        btnNext.addEventListener('click', () => {
            vizViewport.scrollBy({ left: Math.min(600, window.innerWidth * 0.8), behavior: 'smooth' });
        });
        btnPrev.addEventListener('click', () => {
            vizViewport.scrollBy({ left: -Math.min(600, window.innerWidth * 0.8), behavior: 'smooth' });
        });
    }

    // 10. Fade In on Scroll
    const fadeSections = document.querySelectorAll('.section-fade-in');
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    fadeSections.forEach(section => fadeInObserver.observe(section));

    // Final Setup
    setTimeout(() => {
        document.body.classList.remove('loading');
        fadeSections.forEach(section => {
            if (section.getBoundingClientRect().top < window.innerHeight) {
                section.classList.add('is-visible');
            }
        });
    }, 100);
});
