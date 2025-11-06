document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // --- Global Variables & DOM Elements ---
    // =================================================================================
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const modal = document.getElementById('lightbox-modal');
    const mainHeader = document.querySelector('.main-header');
    
    // Performance tracking
    let ticking = false;
    let resizeTimer;
    let lastWidth = window.innerWidth;

    // =================================================================================
    // --- Utility Functions ---
    // =================================================================================
    
    /**
     * Debounce function to limit how often a function can be called
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Throttle function to ensure a function is only called at most once per frame
     */
    const throttle = (func) => {
        return (...args) => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    func(...args);
                    ticking = false;
                });
                ticking = true;
            }
        };
    };

    /**
     * Check if element is in viewport
     */
    const isInViewport = (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
            rect.bottom >= 0
        );
    };

    // =================================================================================
    // --- Theme Toggle ---
    // =================================================================================
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    const updateTheme = (theme) => {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update all theme toggle buttons
        themeToggles.forEach(toggle => {
            const isDark = theme === 'dark';
            toggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
            toggle.setAttribute('aria-pressed', !isDark);
        });

        // Dispatch custom event for any theme-dependent components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    };

    // Initialize theme
    updateTheme(savedTheme);

    // Theme toggle event listeners
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            updateTheme(newTheme);
        });
    });

    // =================================================================================
    // --- Mobile Navigation with Focus Trap ---
    // =================================================================================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');
    const mobileNavLinks = document.querySelectorAll('#mobile-nav-menu .nav-link');

    let firstFocusableEl, lastFocusableEl;

    const initFocusTrap = () => {
        const focusableElements = mobileNavMenu.querySelectorAll(
            'a[href], button:not(:disabled), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            firstFocusableEl = focusableElements[0];
            lastFocusableEl = focusableElements[focusableElements.length - 1];
        }
    };

    const handleFocusTrap = (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusableEl) {
                e.preventDefault();
                lastFocusableEl.focus();
            }
        } else {
            if (document.activeElement === lastFocusableEl) {
                e.preventDefault();
                firstFocusableEl.focus();
            }
        }
    };

    const openMobileMenu = () => {
        mobileMenuToggle.classList.add('is-active');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        mobileNavMenu.classList.add('is-active');
        bodyEl.classList.add('menu-is-active');
        bodyEl.style.overflow = 'hidden';

        // Initialize and set up focus trap
        initFocusTrap();
        if (firstFocusableEl) {
            firstFocusableEl.focus();
        }
        
        mobileNavMenu.addEventListener('keydown', handleFocusTrap);
    };

    const closeMobileMenu = () => {
        mobileMenuToggle.classList.remove('is-active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileNavMenu.classList.remove('is-active');
        bodyEl.classList.remove('menu-is-active');
        
        mobileNavMenu.removeEventListener('keydown', handleFocusTrap);
        
        // Only restore overflow if lightbox isn't open
        if (!modal || modal.style.display !== 'flex') {
            bodyEl.style.overflow = '';
        }
        
        // Return focus to toggle button
        mobileMenuToggle.focus();
    };

    // Mobile menu event listeners
    if (mobileMenuToggle && mobileNavMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            const isActive = mobileNavMenu.classList.contains('is-active');
            if (isActive) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // Close menu when clicking on links
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // We let the smooth scroll handler take care of e.preventDefault()
                closeMobileMenu();
                
                // We need to manually trigger the scroll here for mobile links
                const targetId = link.getAttribute('href');
                if (targetId.startsWith('#')) {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        // Delay to allow menu to close, then scroll
                        setTimeout(() => {
                            scrollToElement(targetEl, 0); 
                        }, 300); // Wait for menu close animation
                    }
                }
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNavMenu.classList.contains('is-active')) {
                closeMobileMenu();
            }
        });

        // Close menu when clicking outside
        mobileNavMenu.addEventListener('click', (e) => {
            if (e.target === mobileNavMenu) {
                closeMobileMenu();
            }
        });
    }

    // =================================================================================
    // --- Smooth Scrolling with Offset ---
    // =================================================================================
    const scrollLinks = document.querySelectorAll(
        '.nav-link, .scroll-to-top, .nav-logo, .about-buttons .cta-button[href^="#"], .cta-section .cta-button[href^="#"]'
    );

    const scrollToElement = (element, delay = 0) => {
        setTimeout(() => {
            const headerOffset = mainHeader ? mainHeader.offsetHeight : 72;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - headerOffset - 16;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            // Focus the target for accessibility
            element.setAttribute('tabindex', '-1');
            element.focus({ preventScroll: true });
            
            // Remove tabindex after focus
            setTimeout(() => element.removeAttribute('tabindex'), 1000);
        }, delay);
    };

    scrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Only handle hash links
            if (href && href.startsWith('#')) {
                // We only prevent default for non-mobile-menu links
                // The mobile menu handler does its own logic
                if (!link.closest('.mobile-nav-menu')) {
                    e.preventDefault();
                    const targetSection = document.querySelector(href);
                
                    if (targetSection) {
                        scrollToElement(targetSection);
                    }
                }
            }
        });
    });

    // =================================================================================
    // --- Active Navigation Link Highlighting ---
    // =================================================================================
    const sections = document.querySelectorAll('section[id]');
    // Updated selector to grab all nav links from both menus
    const allNavLinks = document.querySelectorAll('.nav-links-desktop .nav-link, .menu-nav-links-mobile .nav-link');

    const updateActiveNavLink = () => {
        let currentSection = '';
        const scrollPosition = window.scrollY + (mainHeader ? mainHeader.offsetHeight + 100 : 100);

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        // Special case for 'about' which is at the top
        if (window.scrollY < window.innerHeight / 2) {
             currentSection = 'about';
        }

        allNavLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            if (linkHref === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    };

    // =================================================================================
    // --- Scroll-to-Top Button ---
    // =================================================================================
    const scrollTopButton = document.querySelector('.scroll-to-top');
    
    const toggleScrollToTop = () => {
        if (scrollTopButton) {
            const scrollThreshold = window.innerHeight * 0.5;
            if (window.scrollY > scrollThreshold) {
                scrollTopButton.classList.add('visible');
            } else {
                scrollTopButton.classList.remove('visible');
            }
        }
    };

    // =================================================================================
    // --- Header Scroll Effect ---
    // =================================================================================
    const handleHeaderScroll = () => {
        if (mainHeader) {
            const scrolled = window.scrollY > 10;
            mainHeader.classList.toggle('scrolled', scrolled);
        }
    };

    // =================================================================================
    // --- Fade-in Animations on Scroll ---
    // =================================================================================
    const fadeSections = document.querySelectorAll('.section-fade-in');
    
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    fadeSections.forEach(section => {
        if (section) {
            fadeInObserver.observe(section);
        }
    });

    // =================================================================================
    // --- Lightbox with Focus Trap ---
    // =================================================================================
    let lastFocusedElement;

    const lightboxFocusTrap = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.querySelector('.lightbox-close').focus();
        }
    };

    if (modal) {
        const modalImg = document.getElementById('lightbox-image');
        const closeBtn = document.querySelector('.lightbox-close');
        const vizLightboxTriggers = document.querySelectorAll('.viz-lightbox-trigger');

        const openModal = (e) => {
            e.preventDefault();
            lastFocusedElement = document.activeElement;
            const trigger = e.currentTarget;
            
            // Use href for the image source, fallback to img src
            const imgSrc = trigger.getAttribute('href') || trigger.querySelector('img')?.src;
            const imgAlt = trigger.querySelector('img')?.alt || trigger.getAttribute('aria-label') || 'Enlarged image';
            
            if (imgSrc) {
                modal.style.display = 'flex';
                modalImg.src = imgSrc;
                modalImg.alt = imgAlt;
                bodyEl.style.overflow = 'hidden';
                
                modal.addEventListener('keydown', lightboxFocusTrap);
                closeBtn.focus();
            }
        };

        const closeModal = () => {
            modal.style.display = 'none';
            modalImg.src = '';
            modal.removeEventListener('keydown', lightboxFocusTrap);
            
            if (!bodyEl.classList.contains('menu-is-active')) {
                bodyEl.style.overflow = '';
            }
            
            if (lastFocusedElement) {
                lastFocusedElement.focus();
            }
        };

        // Event listeners for lightbox
        vizLightboxTriggers.forEach(trigger => {
            trigger.addEventListener('click', openModal);
        });
        
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

    // =================================================================================
    // --- Enhanced Carousel System (with LOOPING) ---
    // =================================================================================
    let activeCarousels = [];

    class Carousel {
        constructor(options) {
            this.options = options;
            this.viewport = document.querySelector(options.viewportSelector);
            this.track = document.querySelector(options.trackSelector);
            this.prevBtn = document.querySelector(options.prevBtnSelector);
            this.nextBtn = document.querySelector(options.nextBtnSelector);
            this.paginationContainer = document.querySelector(options.paginationSelector);
            this.liveRegion = document.getElementById(options.liveRegionId);
            
            if (!this.viewport || !this.track) {
                console.warn('Carousel viewport or track not found:', options);
                return;
            }

            this.slides = Array.from(this.track.children);
            
            this.currentIndex = 0;
            this.paginationBtns = [];
            this.observers = [];
            
            this.init();
        }

        init() {
            if (!this.viewport || !this.track || this.slides.length === 0) {
                this.hideControls();
                return;
            }

            // Hide controls if only one slide
            if (this.slides.length <= 1) {
                this.hideControls();
                return;
            }

            // Check if we should disable carousel for desktop grid
            const isDesktop = window.innerWidth >= 1024;
            if (this.options.desktopGridOn && isDesktop) {
                this.hideControls();
                return;
            }
            
            this.showControls();
            this.createPagination();
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.updateControls();
            
            // Initial active slide for 3D carousel
            if (this.options.is3D && !isDesktop) { // Only apply 3D logic if not desktop
                this.updateActiveSlideClass();
            }
        }

        createPagination() {
            if (!this.paginationContainer) return;
            
            this.paginationContainer.innerHTML = ''; // Clear existing
            
            this.slides.forEach((slide, index) => {
                slide.setAttribute('tabindex', '-1');
                
                const btn = document.createElement('button');
                btn.className = 'carousel-pagination-btn';
                btn.setAttribute('aria-label', `Go to slide ${index + 1}`);
                btn.setAttribute('role', 'tab');
                if (slide.id) btn.setAttribute('aria-controls', slide.id);

                if (index === 0) {
                    btn.classList.add('is-active');
                    btn.setAttribute('aria-selected', 'true');
                }
                
                btn.addEventListener('click', () => this.scrollToSlide(index));
                this.paginationContainer.appendChild(btn);
                this.paginationBtns.push(btn);
            });
        }

        setupEventListeners() {
            if (this.prevBtn) {
                this.prevBtn.addEventListener('click', () => this.scrollToSlide(this.currentIndex - 1));
            }
            
            if (this.nextBtn) {
                this.nextBtn.addEventListener('click', () => this.scrollToSlide(this.currentIndex + 1));
            }

            // Keyboard navigation
            this.viewport.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.scrollToSlide(this.currentIndex - 1);
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    this.scrollToSlide(this.currentIndex + 1);
                }
            });

            // Touch/swipe support
            let startX = 0;
            let endX = 0;

            this.viewport.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            }, { passive: true });

            this.viewport.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                this.handleSwipe(startX, endX);
            }, { passive: true });
        }

        handleSwipe(startX, endX) {
            const swipeThreshold = 50;
            const diff = startX - endX;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    this.scrollToSlide(this.currentIndex + 1);
                } else {
                    this.scrollToSlide(this.currentIndex - 1);
                }
            }
        }

        setupIntersectionObserver() {
            const threshold = 0.51; 
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
                        const newIndex = this.slides.indexOf(entry.target);
                        this.updateCurrentIndex(newIndex);
                    }
                });
            }, {
                root: this.viewport,
                threshold: threshold
            });

            this.slides.forEach(slide => observer.observe(slide));
            this.observers.push(observer);
        }

        scrollToSlide(index) {
            // *** NEW LOOPING LOGIC ***
            if (index < 0) {
                index = this.slides.length - 1;
            } else if (index >= this.slides.length) {
                index = 0;
            }
            // *** END NEW LOGIC ***

            if (!this.slides[index]) return; // Failsafe
            
            const slide = this.slides[index];
            
            // Calculate scroll position to center the slide
            const scrollLeft = slide.offsetLeft - (this.viewport.clientWidth - slide.clientWidth) / 2;
            
            this.viewport.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });

            // Manually update index and controls since observer can be slow
            this.updateCurrentIndex(index);
            
            // Update focus for accessibility
            slide.focus({ preventScroll: true });
        }

        updateCurrentIndex(newIndex) {
            if (newIndex === this.currentIndex) return; // Prevent redundant updates

            this.currentIndex = newIndex;
            this.updateControls();
            
            // CSS handles 3D effect, but JS still toggles 'is-active' for it
            if (this.options.is3D) {
                this.updateActiveSlideClass();
            }
            
            // Announce slide change for screen readers
            if (this.liveRegion) {
                this.liveRegion.textContent = `Slide ${newIndex + 1} of ${this.slides.length}`;
            }
        }
        
        updateActiveSlideClass() {
            this.slides.forEach((slide, index) => {
                slide.classList.toggle('is-active', index === this.currentIndex);
            });
        }

        updateControls() {
            // Update pagination buttons
            if (this.paginationBtns.length > 0) {
                this.paginationBtns.forEach((btn, index) => {
                    const isActive = index === this.currentIndex;
                    btn.classList.toggle('is-active', isActive);
                    btn.setAttribute('aria-selected', isActive);
                });
            }

            // *** REMOVED disabled logic for prev/next buttons to allow looping ***
        }

        showControls() {
            const controls = this.viewport.closest('.testimonial-carousel-container, .viz-carousel-container')
                ?.querySelector('.carousel-controls');
            if (controls) {
                controls.style.display = 'flex';
            }
        }

        hideControls() {
            const controls = this.viewport.closest('.testimonial-carousel-container, .viz-carousel-container')
                ?.querySelector('.carousel-controls');
            if (controls) {
                controls.style.display = 'none';
            }
        }



        destroy() {
            // Clean up observers
            this.observers.forEach(observer => observer.disconnect());
            
            // Clean up event listeners (basic removal)
            if (this.prevBtn) {
                this.prevBtn.replaceWith(this.prevBtn.cloneNode(true));
            }
            if (this.nextBtn) {
                this.nextBtn.replaceWith(this.nextBtn.cloneNode(true));
            }
            
            // Clean up pagination
            if (this.paginationContainer) {
                this.paginationContainer.innerHTML = '';
            }
            
            // Show controls if needed (for desktop grid)
            if (this.options.desktopGridOn) {
                this.showControls();
            }
        }
    }

    // Carousel initialization
    function setupCarousels() {
        // Clean up existing carousels
        activeCarousels.forEach(carousel => carousel.destroy());
        activeCarousels = [];

        // Initialize Data Viz Carousel (now finds all 9 slides)
        const vizCarousel = new Carousel({
            viewportSelector: '.viz-carousel-viewport',
            trackSelector: '#viz-carousel-track',
            prevBtnSelector: '#viz-prev-btn',
            nextBtnSelector: '#viz-next-btn',
            paginationSelector: '#viz-pagination',
            liveRegionId: 'viz-live-region',
            desktopGridOn: false,
            is3D: false
        });
        activeCarousels.push(vizCarousel);

        // Initialize Testimonial Carousel
        const testimonialCarousel = new Carousel({
            viewportSelector: '.testimonial-carousel-viewport',
            trackSelector: '#testimonial-carousel-track',
            prevBtnSelector: '#testimonial-prev-btn',
            nextBtnSelector: '#testimonial-next-btn',
            paginationSelector: '#testimonial-pagination',
            liveRegionId: 'testimonial-live-region',
            desktopGridOn: true, // This will disable it on desktop
            is3D: true // This adds the 'is-active' class for CSS to handle
        });
        activeCarousels.push(testimonialCarousel);
    }

    // Initial carousel setup
    setupCarousels();

    // =================================================================================
    // --- Enhanced Contact Form with Real-time Validation ---
    // =================================================================================
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const formStatus = document.getElementById('form-status');

        // Form validation functions
        const showError = (input, message) => {
            const errorSpan = document.getElementById(`${input.id}-error`);
            input.setAttribute('aria-invalid', 'true');
            errorSpan.textContent = message;
            errorSpan.classList.add('is-visible');
            
            // Add error class to input
            input.classList.add('error');
            
            // Focus first invalid field
            if (!document.querySelector('.form-input[aria-invalid="true"]:first-of-type')) {
                input.focus();
            }
        };

        const clearError = (input) => {
            const errorSpan = document.getElementById(`${input.id}-error`);
            input.setAttribute('aria-invalid', 'false');
            errorSpan.textContent = '';
            errorSpan.classList.remove('is-visible');
            input.classList.remove('error');
        };

        const showFormStatus = (message, isSuccess) => {
            formStatus.textContent = message;
            formStatus.className = 'form-status';
            formStatus.classList.add(isSuccess ? 'is-success' : 'is-error');
            formStatus.style.display = 'block';
            
            // Scroll to status message
            formStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

        const validateEmail = (email) => {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        };

        const validateField = (input) => {
            const value = input.value.trim();
            
            switch (input.type) {
                case 'text':
                    if (value === '') {
                        showError(input, 'This field is required');
                        return false;
                    }
                    break;
                    
                case 'email':
                    if (value === '') {
                        showError(input, 'Email address is required');
                        return false;
                    } else if (!validateEmail(value)) {
                        showError(input, 'Please enter a valid email address');
                        return false;
                    }
                    break;
                    
                default:
                    if (value === '') {
                        showError(input, 'This field is required');
                        return false;
                    }
            }
            
            clearError(input);
            return true;
        };

        const validateForm = () => {
            let isValid = true;
            
            // Clear previous status and errors
            formStatus.style.display = 'none';
            [nameInput, emailInput, messageInput].forEach(input => clearError(input));

            // Validate each field
            if (!validateField(nameInput)) isValid = false;
            if (!validateField(emailInput)) isValid = false;
            if (!validateField(messageInput)) isValid = false;

            return isValid;
        };

        // Real-time validation
        [nameInput, emailInput, messageInput].forEach(input => {
            input.addEventListener('input', () => {
                if (input.value.trim() !== '') {
                    validateField(input);
                }
            });
            
            input.addEventListener('blur', () => {
                validateField(input);
            });
        });

        // Form submission
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }

            const submitButton = contactForm.querySelector('.submit-button');
            const originalText = submitButton.textContent;
            
            // Show loading state
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            showFormStatus('', true);

            try {
                const formData = new FormData(contactForm);
                
                // API call to Formspree
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    // Success
                    contactForm.reset();
                    [nameInput, emailInput, messageInput].forEach(input => clearError(input));
                    showFormStatus('Thank you for your message! I\'ll get back to you soon.', true);
                    
                    // Reset form after success
                    setTimeout(() => {
                        formStatus.style.display = 'none';
                    }, 5000);
                } else {
                    // Handle Formspree or other service errors
                    const data = await response.json();
                    if (data.errors) {
                        showFormStatus(data.errors.map(err => err.message).join(', '), false);
                    } else {
                        throw new Error('Server error');
                    }
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showFormStatus('Sorry, there was a problem sending your message. Please try again or email me directly.', false);
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // =================================================================================
    // --- Enhanced Accordion Functionality ---
    // =================================================================================
    const faqAccordion = document.querySelector('.faq-accordion');
    const capabilitiesAccordion = document.querySelector('.capabilities-accordion');

    const handleAccordion = (accordionContainer) => {
        if (!accordionContainer) return;
        
        const items = accordionContainer.querySelectorAll('details');

        items.forEach(item => {
            const summary = item.querySelector('summary');

            if (summary) {
                summary.addEventListener('click', (e) => {
                    // Prevent default toggle to manage it manually
                    e.preventDefault();
                    
                    const wasOpen = item.open;

                    // Close all other items
                    items.forEach(otherItem => {
                        if (otherItem !== item && otherItem.open) {
                            otherItem.open = false;
                        }
                    });

                    // Toggle the clicked item
                    item.open = !wasOpen;
                });
            }
        });
    };

    handleAccordion(faqAccordion);
    handleAccordion(capabilitiesAccordion);
    
    // =================================================================================
    // --- Typing Animation for Hero Section ---
    // =================================================================================
    const initHeroAnimation = () => {
        const heroTitle = document.querySelector('.hero-title');
        if (!heroTitle) return;
        
        const highlightSpan = heroTitle.querySelector('.hero-highlight');
        
        if (highlightSpan) {
            // Use opacity for a simple, clean fade-in
            highlightSpan.style.opacity = '0';
            
            setTimeout(() => {
                highlightSpan.style.transition = 'opacity 0.5s ease';
                highlightSpan.style.opacity = '1';
            }, 500);
        }
    };

    // =================================================================================
    // --- Timeline Animation (REVISED) ---
    // =================================================================================
    const initTimelineAnimation = () => {
        const timelineItems = document.querySelectorAll('.timeline-item');
        
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible'); // Use class
                    timelineObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Add 'is-hidden' class via JS to prevent flash of unstyled content
        timelineItems.forEach((item, index) => {
            item.classList.add('is-hidden'); // Use class
            item.style.transitionDelay = `${index * 0.1}s`;
            timelineObserver.observe(item);
        });
    };

    // =================================================================================
    // --- Performance Optimized Scroll & Resize Handlers ---
    // =================================================================================
    const handleScroll = throttle(() => {
        updateActiveNavLink();
        toggleScrollToTop();
        handleHeaderScroll();
    });

    const handleResize = debounce(() => {
        // Only reinitialize carousels if we cross a significant breakpoint
        const currentWidth = window.innerWidth;
        const breakpointCrossed = 
            (lastWidth < 1024 && currentWidth >= 1024) ||
            (lastWidth >= 1024 && currentWidth < 1024);
        
        if (breakpointCrossed || Math.abs(currentWidth - lastWidth) > 50) { 
            lastWidth = currentWidth;
            setupCarousels();
        }
    }, 250);

    // Event listeners with performance optimizations
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // =================================================================================
    // --- Initialize on Load ---
    // =================================================================================
    const init = () => {
        // Set initial states
        updateActiveNavLink();
        toggleScrollToTop();
        handleHeaderScroll();
        
        // Initialize animations and interactions
        initHeroAnimation();
        initTimelineAnimation();
        
        // Add loading class for any initial animations
        bodyEl.classList.add('loaded');
        
        console.log('Portfolio initialized successfully');
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

});