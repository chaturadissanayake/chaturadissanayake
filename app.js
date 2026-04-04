document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // 1. Core Variables
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const mainHeader = document.querySelector('.main-header');

    // Set blurred background images for data storytelling slides securely
    document.querySelectorAll('.viz-lightbox-trigger').forEach(trigger => {
        const img = trigger.querySelector('img');
        const blurDiv = trigger.querySelector('.viz-bg-blur');
        if (img && blurDiv) {
            blurDiv.style.backgroundImage = `url(${img.src})`;
        }
    });

    // 2. Theme Toggle Logic (Default set to Light Mode)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

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
    const sections = document.querySelectorAll('section[id]');
    
    // Select all navigation links across both desktop and mobile
    const allNavLinks = document.querySelectorAll('.nav-link, .mobile-link');

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

    // 5. Scroll Events (Header, Active Link)
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentScroll = window.scrollY;
                
                // Header Shrink logic
                if (currentScroll > 50) {
                    mainHeader.classList.add('scrolled');
                } else {
                    mainHeader.classList.remove('scrolled');
                }

                // Active Navigation Highlight
                let currentSection = '';
                sections.forEach(section => {
                    const sectionTop = section.offsetTop - 150;
                    const sectionHeight = section.clientHeight;
                    if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
                        currentSection = section.getAttribute('id');
                    }
                });

                allNavLinks.forEach(link => {
                    // Do not override the default Say Hello highlight logic in the menu unless active
                    if (!link.classList.contains('highlight')) {
                        link.classList.remove('active');
                    }
                    if (link.getAttribute('href') === `#${currentSection}`) {
                        link.classList.add('active');
                    }
                });
                
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // 6. Fluid View Toggle Logic (Grid/List with cross-fade animation)
    const gridBtn = document.getElementById('grid-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    const projectsContainer = document.getElementById('projects-container');
    const extendedWork = document.getElementById('extended-work');

    const toggleFluidView = (mode) => {
        if (mode === 'grid' && gridBtn.classList.contains('active')) return;
        if (mode === 'list' && listBtn.classList.contains('active')) return;

        // Start fade out
        projectsContainer.classList.add('fade-out-transition');
        if (extendedWork && extendedWork.classList.contains('show')) {
            extendedWork.classList.add('fade-out-transition');
        }

        setTimeout(() => {
            if (mode === 'grid') {
                gridBtn.classList.add('active');
                listBtn.classList.remove('active');
                
                projectsContainer.classList.remove('list-mode');
                projectsContainer.classList.add('grid-mode');
                
                if (extendedWork) {
                    extendedWork.classList.remove('list-mode');
                    extendedWork.classList.add('grid-mode');
                }
            } else {
                listBtn.classList.add('active');
                gridBtn.classList.remove('active');
                
                projectsContainer.classList.remove('grid-mode');
                projectsContainer.classList.add('list-mode');
                
                if (extendedWork) {
                    extendedWork.classList.remove('grid-mode');
                    extendedWork.classList.add('list-mode');
                }
            }
            
            // Fade back in
            projectsContainer.classList.remove('fade-out-transition');
            if (extendedWork) extendedWork.classList.remove('fade-out-transition');
            
        }, 300); // Wait for CSS opacity transition
    };

    if (gridBtn && listBtn && projectsContainer) {
        gridBtn.addEventListener('click', () => toggleFluidView('grid'));
        listBtn.addEventListener('click', () => toggleFluidView('list'));
    }

    // 7. Extended Gallery Toggle 
    const showMoreBtn = document.getElementById('show-more-btn');

    if (showMoreBtn && extendedWork) {
        showMoreBtn.addEventListener('click', () => {
            const isShowing = extendedWork.classList.contains('show');
            if (!isShowing) {
                extendedWork.classList.add('show');
                showMoreBtn.querySelector('span').textContent = 'Hide Extended Gallery';
                showMoreBtn.querySelector('i').style.transform = 'rotate(180deg)';
                
                // Set initial view state based on current toggle
                if(listBtn.classList.contains('active')) {
                    extendedWork.classList.remove('grid-mode');
                    extendedWork.classList.add('list-mode');
                } else {
                    extendedWork.classList.add('grid-mode');
                    extendedWork.classList.remove('list-mode');
                }
            } else {
                extendedWork.classList.remove('show');
                showMoreBtn.querySelector('span').textContent = 'Show Extended Gallery';
                showMoreBtn.querySelector('i').style.transform = 'rotate(0deg)';
                document.getElementById('projects').scrollIntoView({behavior: 'smooth'});
            }
        });
    }

    // 8. FAQ Accordion Logic
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

    // 9. Visualisations Lightbox
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

    // 10. Visualisations Simple Carousel Controls
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

    // 11. Fade In on Scroll
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
