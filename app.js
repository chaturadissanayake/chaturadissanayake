document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;
    const mainHeader = document.querySelector('.main-header');
    const bodyEl = document.body;

    // --- Feature 0: Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    const updateTheme = (theme) => {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Toggle to light theme' : 'Toggle to dark theme');
    };

    updateTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        requestAnimationFrame(() => {
            updateTheme(newTheme);
        });
    });

    // --- Feature: Mobile Slide-Down Navigation ---
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');
    const mobileNavLinks = document.querySelectorAll('#mobile-nav-menu .nav-link');

    const openMobileMenu = () => {
        mobileMenuToggle.classList.add('is-active');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        mobileNavMenu.classList.add('is-active');
        bodyEl.classList.add('menu-is-active');
    };

    const closeMobileMenu = () => {
        mobileMenuToggle.classList.remove('is-active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileNavMenu.classList.remove('is-active');
        bodyEl.classList.remove('menu-is-active');
    };

    if (mobileMenuToggle && mobileNavMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            if (mobileNavMenu.classList.contains('is-active')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNavMenu.classList.contains('is-active')) {
                closeMobileMenu();
            }
        });
    }


    // --- Feature: Smooth Scrolling (Works for all links) ---
    const scrollLinks = document.querySelectorAll('.nav-link, .scroll-to-top, .nav-logo, .hero-link, .about-content .link-arrow');
    scrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    const headerOffset = mainHeader?.offsetHeight || 0;
                    const elementPosition = targetSection.offsetTop;
                    const offsetPosition = elementPosition - headerOffset - 24; 
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    // --- Feature: Active Nav Link Highlighting (Works for BOTH menus) ---
    const sections = document.querySelectorAll('section[id]');
    const allNavLinks = document.querySelectorAll('.nav-links-desktop .nav-link, .mobile-nav-menu .nav-link');

    const navObserverOptions = {
        rootMargin: '-80px 0px -50% 0px',
        threshold: 0
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                allNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, navObserverOptions);

    sections.forEach(section => {
        if (section) {
            navObserver.observe(section);
        }
    });

    
    // --- Feature: Show/Hide Scroll-to-Top Button ---
    const scrollTopButton = document.querySelector('.scroll-to-top');
    const onScrollForButton = () => {
        if (scrollTopButton) {
            if (window.scrollY > window.innerHeight * 0.6) { 
                scrollTopButton.classList.add('visible');
            } else {
                scrollTopButton.classList.remove('visible');
            }
        }
    };
    
    // --- Feature: Header Scroll Effect ---
    const handleHeaderScroll = () => {
        if (mainHeader) {
            if (window.scrollY > 10) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        }
    };


    // --- Feature: Fade-in Sections on Scroll ---
    const fadeSections = document.querySelectorAll('.section-fade-in');
    const observerOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeSections.forEach(section => {
        if (section) { 
             observer.observe(section);
        }
    });

    // --- Feature: Lightbox for Visualisation Carousel ---
    const modal = document.getElementById('lightbox-modal');
    if (modal) {
        const modalImg = document.getElementById('lightbox-image');
        const closeBtn = document.querySelector('.lightbox-close');
        const vizLightboxTrigger = document.getElementById('viz-lightbox-trigger');
        const mainVizImage = document.getElementById('viz-image');

        const openModal = (e) => {
            e.preventDefault(); // Stop the <a> tag from following the href
            if (mainVizImage) {
                modal.style.display = 'flex';
                modalImg.src = mainVizImage.src; // Get src from the *visible* image
                modalImg.alt = mainVizImage.alt; // Get alt from the *visible* image
                bodyEl.style.overflow = 'hidden';
            }
        };

        const closeModal = () => {
            modal.style.display = 'none';
            modalImg.src = '';
            if (!bodyEl.classList.contains('menu-is-active')) {
                bodyEl.style.overflow = '';
            }
        };

        if (vizLightboxTrigger) {
            vizLightboxTrigger.addEventListener('click', openModal);
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeModal();
            }
        });
    }

    // --- NEW: Visualisation Carousel ---
    const vizDataSourceEl = document.getElementById('viz-data-source');
    if (vizDataSourceEl) {
        // Get all the elements
        const vizImage = document.getElementById('viz-image');
        const vizViewport = document.getElementById('viz-lightbox-trigger');
        const vizTitle = document.getElementById('viz-title');
        const vizText = document.getElementById('viz-text');
        const vizDesc = document.getElementById('viz-description');
        const prevBtn = document.getElementById('viz-prev-btn');
        const nextBtn = document.getElementById('viz-next-btn');

        // Parse the data from the hidden <ul>
        const vizData = Array.from(vizDataSourceEl.querySelectorAll('li')).map(item => ({
            title: item.dataset.title,
            description: item.dataset.description,
            imgSrc: item.dataset.imgSrc,
            imgAlt: item.dataset.imgAlt
        }));

        let currentIndex = 0;
        const totalItems = vizData.length;

        const updateCarousel = (index) => {
            if (index < 0 || index >= totalItems) {
                return; // Index out of bounds
            }
            currentIndex = index;
            const data = vizData[currentIndex];

            // Add fading class to trigger fade-out
            vizDesc.classList.add('is-changing');
            vizViewport.classList.add('is-changing');

            // Wait for fade-out, then update content
            setTimeout(() => {
                // Update image, title, and text
                vizImage.src = data.imgSrc;
                vizImage.alt = data.imgAlt;
                vizTitle.textContent = data.title;
                vizText.textContent = data.description;

                // Remove fading class to trigger fade-in
                vizDesc.classList.remove('is-changing');
                vizViewport.classList.remove('is-changing');
            }, 150); // This delay should be half of the CSS transition duration

            // Update button disabled states
            prevBtn.disabled = (currentIndex === 0);
            nextBtn.disabled = (currentIndex === totalItems - 1);
        };

        // Add event listeners to buttons
        nextBtn.addEventListener('click', () => updateCarousel(currentIndex + 1));
        prevBtn.addEventListener('click', () => updateCarousel(currentIndex - 1));
        
        // Set initial button state (item 0 is pre-loaded by the HTML)
        prevBtn.disabled = true;
        nextBtn.disabled = (totalItems <= 1);
    }
    

    // --- Feature: Enhanced Form Handling (in Footer) ---
    const contactForm = document.querySelector('.lead-capture-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            contactForm.classList.add('loading');
            try {
                const formData = new FormData(contactForm);
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    contactForm.reset();
                    alert('Thanks for your message! I\'ll get back to you soon.');
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Form submission failed');
                }
            } catch (error) {
                console.error('Form Error:', error);
                alert('Sorry, there was a problem sending your message. Please try again.');
            } finally {
                contactForm.classList.remove('loading');
            }
        });
    }

    // --- Capabilities Accordion (Skill Bar Animation) ---
    const accordion = document.getElementById('capabilities-accordion');
    if (accordion) {
        const items = accordion.querySelectorAll('.capability-item');

        items.forEach(item => {
            const header = item.querySelector('.capability-header');
            const content = item.querySelector('.capability-content');
            const skillBars = content.querySelectorAll('.skill-bar');

            header.addEventListener('click', () => {
                const isExpanded = header.getAttribute('aria-expanded') === 'true';

                // Close all other items
                items.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherHeader = otherItem.querySelector('.capability-header');
                        const otherContent = otherItem.querySelector('.capability-content');
                        otherHeader.setAttribute('aria-expanded', 'false');
                        otherContent.setAttribute('hidden', '');
                        otherContent.style.maxHeight = null;
                        
                        // Reset other skill bars
                        otherContent.querySelectorAll('.skill-bar').forEach(bar => {
                            bar.style.width = '0%';
                        });
                    }
                });

                // Toggle the clicked item
                if (isExpanded) {
                    header.setAttribute('aria-expanded', 'false');
                    content.setAttribute('hidden', '');
                    content.style.maxHeight = null;
                    // Reset this item's skill bars
                    skillBars.forEach(bar => {
                        bar.style.width = '0%';
                    });
                } else {
                    header.setAttribute('aria-expanded', 'true');
                    content.removeAttribute('hidden');
                    // Set max-height for smooth animation
                    content.style.maxHeight = content.scrollHeight + 'px';
                    
                    // Animate skill bars
                    // Use a short delay to ensure the transition plays
                    setTimeout(() => {
                        skillBars.forEach(bar => {
                            const targetWidth = bar.getAttribute('data-width');
                            if (targetWidth) {
                                bar.style.width = targetWidth;
                            }
                        });
                    }, 50); // 50ms delay
                }
            });

            // Recalculate max-height on resize
            window.addEventListener('resize', () => {
                if (header.getAttribute('aria-expanded') === 'true') {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    }

    // --- Combined scroll event listeners ---
    window.addEventListener('scroll', () => {
        onScrollForButton();
        handleHeaderScroll();
    }, { passive: true });
    
    // --- Run once on load to set initial state ---
    onScrollForButton();
    handleHeaderScroll();
    
});