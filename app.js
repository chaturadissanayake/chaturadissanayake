document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const modal = document.getElementById('lightbox-modal');
    const mainHeader = document.querySelector('.main-header'); 

    // =================================================================================
    // --- Theme Toggle ---
    // =================================================================================
    const themeToggles = document.querySelectorAll('.theme-toggle'); 
    const savedTheme = localStorage.getItem('theme') || 'dark';

    const updateTheme = (theme) => {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggles.forEach(toggle => {
            // MODIFIED: Ensure aria-label reflects the *next* theme it will switch to
            toggle.setAttribute('aria-label', theme === 'dark' ? 'Toggle to light theme' : 'Toggle to dark theme');
        });
    };

    updateTheme(savedTheme); 

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            requestAnimationFrame(() => {
                updateTheme(newTheme);
            });
        });
    });

    // =================================================================================
    // --- Mobile Slide-Down Navigation (with Focus Trap) ---
    // =================================================================================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');
    const mobileNavLinks = document.querySelectorAll('#mobile-nav-menu .nav-link');

    const focusableElementsSelector = 'a[href], button:not(:disabled), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    let firstFocusableEl, lastFocusableEl;

    const menuFocusTrap = (e) => {
        if (e.key !== 'Tab') return;
        
        // Find current focusable elements inside the open menu
        const focusableElements = mobileNavMenu.querySelectorAll(focusableElementsSelector);
        firstFocusableEl = focusableElements[0];
        lastFocusableEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
            if (document.activeElement === firstFocusableEl) {
                e.preventDefault();
                lastFocusableEl.focus();
            }
        } else { // Tab
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

        // Re-find focusable elements *before* focusing
        const focusableElements = mobileNavMenu.querySelectorAll(focusableElementsSelector);
        if (focusableElements.length > 0) {
            firstFocusableEl = focusableElements[0];
            lastFocusableEl = focusableElements[focusableElements.length - 1];
            firstFocusableEl.focus(); // Set focus to the first element
        }
        
        mobileNavMenu.addEventListener('keydown', menuFocusTrap);
    };

    const closeMobileMenu = () => {
        mobileMenuToggle.classList.remove('is-active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileNavMenu.classList.remove('is-active');
        bodyEl.classList.remove('menu-is-active');
        
        mobileNavMenu.removeEventListener('keydown', menuFocusTrap);
        if (modal && modal.style.display !== 'flex') {
            bodyEl.style.overflow = '';
        }
        mobileMenuToggle.focus(); // Return focus to the toggle button
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
            // Fix: Add focus management after click
            link.addEventListener('click', () => {
                closeMobileMenu();
                // If it's a hash link, focus on the target section for screen readers
                setTimeout(() => {
                    const targetId = link.getAttribute('href');
                    if (targetId.startsWith('#')) {
                        const targetEl = document.querySelector(targetId);
                        if (targetEl) {
                            targetEl.setAttribute('tabindex', '-1');
                            targetEl.focus();
                            targetEl.removeAttribute('tabindex');
                        }
                    }
                }, 400); // Delay slightly longer than CSS transition
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileNavMenu.classList.contains('is-active')) {
                closeMobileMenu();
            }
        });
    }

    // =================================================================================
    // --- Smooth Scrolling (A-01: Supports keyboard accessibility) ---
    // =================================================================================
    const scrollLinks = document.querySelectorAll('.nav-link, .scroll-to-top, .nav-logo, .about-buttons .cta-button-secondary[href^="#"], .cta-section .cta-button[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href); 
                
                if (targetSection) {
                    const headerOffset = mainHeader ? mainHeader.offsetHeight : 72;
                    const elementPosition = targetSection.getBoundingClientRect().top + window.scrollY;
                    // MODIFIED: Changed 24px magic number to a more standard 16px offset
                    const offsetPosition = elementPosition - headerOffset - 16; 

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            }
        });
    });

    // =================================================================================
    // --- Active Nav Link Highlighting ---
    // =================================================================================
    const sections = document.querySelectorAll('section[id]');
    const allNavLinks = document.querySelectorAll('.nav-links-desktop .nav-link, .mobile-nav-menu .nav-link');

    const navObserverOptions = {
        rootMargin: '-80px 0px -50% 0px', // 80px top margin for sticky header
        threshold: 0
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                // Temporarily disable the check for mobile nav links to fix the redundant
                // list of links that point to the same section (e.g., #about)
                allNavLinks.forEach(link => {
                    link.classList.remove('active');
                    const linkHref = link.getAttribute('href');
                    if (linkHref === `#${id}`) {
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

    
    // =================================================================================
    // --- Show/Hide Scroll-to-Top Button ---
    // =================================================================================
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
    
    // =================================================================================
    // --- Header Scroll Effect ---
    // =================================================================================
    const handleHeaderScroll = () => {
        if (mainHeader) { 
            if (window.scrollY > 10) {
                mainHeader.classList.add('scrolled');
            } else {
                mainHeader.classList.remove('scrolled');
            }
        }
    };

    // =================================================================================
    // --- Fade-in Sections on Scroll ---
    // =================================================================================
    const fadeSections = document.querySelectorAll('.section-fade-in');
    const observerOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.1
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

    // =================================================================================
    // --- Lightbox (with Focus Trap) ---
    // =================================================================================
    let lastFocusedElement; // For returning focus

    const lightboxFocusTrap = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault(); // Only one focusable element (close)
            closeBtn.focus();
        }
    };

    if (modal) {
        const modalImg = document.getElementById('lightbox-image');
        const closeBtn = document.querySelector('.lightbox-close');
        const vizLightboxTriggers = document.querySelectorAll('.viz-lightbox-trigger');

        const openModal = (e) => {
            e.preventDefault();
            lastFocusedElement = document.activeElement; // Store focus
            const trigger = e.currentTarget;
            const image = trigger.querySelector('img');
            
            if (image) {
                modal.style.display = 'flex';
                modalImg.src = image.src;
                modalImg.alt = image.alt;
                bodyEl.style.overflow = 'hidden';
                
                modal.addEventListener('keydown', lightboxFocusTrap);
                closeBtn.focus(); // Move focus to close button
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
                lastFocusedElement.focus(); // Return focus
            }
        };

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
    // --- MODIFIED: Reusable Carousel (Refactored for stability) ---
    // =================================================================================
    let activeCarousels = [];

    /**
     * Initializes a swipeable carousel.
     * @returns {object|null} An object with a 'destroy' method, or null.
     */
    function initializeCarousel(options) {
        const viewport = document.querySelector(options.viewportSelector);
        const track = document.querySelector(options.trackSelector);
        if (!viewport || !track) return null;

        // If this carousel should be a grid on desktop, check screen width and stop
        if (options.desktopGridOn && window.innerWidth >= 1024) {
            return null; // Do not initialize carousel, let CSS grid take over
        }

        const prevBtn = document.querySelector(options.prevBtnSelector);
        const nextBtn = document.querySelector(options.nextBtnSelector);
        const paginationContainer = document.querySelector(options.paginationSelector);
        const liveRegion = document.getElementById(options.liveRegionId); // For screen readers
        const slides = Array.from(track.children);
        
        if (slides.length <= 1) {
            const controls = viewport.closest('.testimonial-carousel-container, .viz-carousel-container').querySelector('.carousel-controls');
            if(controls) controls.style.display = 'none';
            return null; // No carousel needed for one slide
        }
        
        // Ensure controls are visible if re-initializing
        const controls = viewport.closest('.testimonial-carousel-container, .viz-carousel-container').querySelector('.carousel-controls');
        if (controls) controls.style.display = 'flex';


        const paginationBtns = [];
        const dotClickListeners = [];
        let currentIndex = 0;

        // 1. Create Pagination & Listeners
        slides.forEach((slide, index) => {
            slide.setAttribute('tabindex', '-1'); // Make slide programmatically focusable
            
            const btn = document.createElement('button');
            btn.className = 'carousel-pagination-btn';
            btn.setAttribute('aria-label', `Go to slide ${index + 1}`);
            btn.setAttribute('role', 'tab');
            if (slide.id) btn.setAttribute('aria-controls', slide.id);

            if (index === 0) {
                btn.classList.add('is-active');
                btn.setAttribute('aria-selected', 'true');
            }
            
            const listener = () => scrollToSlide(index);
            btn.addEventListener('click', listener);
            dotClickListeners.push({ btn, listener }); // Store for removal

            paginationContainer.appendChild(btn);
            paginationBtns.push(btn);
        });

        // 2. Scroll Function
        const scrollToSlide = (index) => {
            if (!slides[index]) return;
            const scrollLeft = slides[index].offsetLeft - (viewport.clientWidth - slides[index].clientWidth) / 2;
            
            viewport.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
            // Move focus for accessibility, preventScroll stops page jump
            slides[index].focus({ preventScroll: true }); 
        };

        // 3. Arrow Button Listeners
        const prevListener = () => scrollToSlide(currentIndex - 1);
        const nextListener = () => scrollToSlide(currentIndex + 1);
        prevBtn.addEventListener('click', prevListener);
        nextBtn.addEventListener('click', nextListener);

        // 4. Observer to update UI (dots and buttons)
        const carouselObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const intersectingSlide = entry.target;
                    const newIndex = slides.indexOf(intersectingSlide);
                    
                    // Check if the intersecting element is the main one in the viewport center
                    const viewportRect = viewport.getBoundingClientRect();
                    const slideRect = intersectingSlide.getBoundingClientRect();
                    const isCentered = (slideRect.left >= viewportRect.left - slideRect.width * 0.1) &&
                                       (slideRect.right <= viewportRect.right + slideRect.width * 0.1);
                                       
                    if (isCentered) {
                        currentIndex = newIndex;

                        // Update dots
                        paginationBtns.forEach((btn, index) => {
                            btn.classList.toggle('is-active', index === newIndex);
                            btn.setAttribute('aria-selected', index === newIndex);
                        });

                        // Update prev/next buttons
                        prevBtn.disabled = (currentIndex === 0);
                        nextBtn.disabled = (currentIndex === slides.length - 1);
                        
                        // ACCESSIBILITY: Announce slide change
                        if (liveRegion) {
                            liveRegion.textContent = `Slide ${newIndex + 1} of ${slides.length}`;
                        }
                    }
                }
            });
        }, { 
            root: viewport,
            threshold: 0.51 // Slide must be >50% visible to be "active"
        });

        slides.forEach(slide => carouselObserver.observe(slide));
        prevBtn.disabled = true;

        // 5. Create Destroy Function
        const destroy = () => {
            carouselObserver.disconnect();
            prevBtn.removeEventListener('click', prevListener);
            nextBtn.removeEventListener('click', nextListener);
            dotClickListeners.forEach(item => {
                item.btn.removeEventListener('click', item.listener);
            });
            paginationContainer.innerHTML = '';
            // Show controls again in case they were hidden
            if (controls && options.desktopGridOn) controls.style.display = 'none';
        };
        
        return { destroy }; // Return cleanup function
    }
    
    // --- NEW: Function to set up carousels (called on load and resize) ---
    function setupCarousels() {
        // 1. Destroy all active carousels
        activeCarousels.forEach(c => c.destroy());
        activeCarousels = [];

        // 2. Initialize Data Viz Carousel (Always on, but different behavior on desktop)
        const vizCarousel = initializeCarousel({
            viewportSelector: '.viz-carousel-viewport',
            trackSelector: '#viz-carousel-track',
            prevBtnSelector: '#viz-prev-btn',
            nextBtnSelector: '#viz-next-btn',
            paginationSelector: '#viz-pagination',
            liveRegionId: 'viz-live-region', // For screen reader
            desktopGridOn: false
        });
        if (vizCarousel) activeCarousels.push(vizCarousel);

        // 3. Initialize Testimonial Carousel (Mobile/Tablet only)
        const testimonialCarousel = initializeCarousel({
            viewportSelector: '.testimonial-carousel-viewport',
            trackSelector: '#testimonial-carousel-track',
            prevBtnSelector: '#testimonial-prev-btn',
            nextBtnSelector: '#testimonial-next-btn',
            paginationSelector: '#testimonial-pagination',
            liveRegionId: 'testimonial-live-region', // For screen reader
            desktopGridOn: true // This turns into a grid at 1024px
        });
        if (testimonialCarousel) activeCarousels.push(testimonialCarousel);
    }
    
    // --- Initial call on load ---
    setupCarousels();

    // --- Throttled resize handler to fix race conditions ---
    let resizeTimer;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        // Only trigger setupCarousels if we cross a desktop/mobile threshold
        if (Math.abs(window.innerWidth - lastWidth) > 200 || 
            (lastWidth < 1024 && window.innerWidth >= 1024) ||
            (lastWidth >= 1024 && window.innerWidth < 1024)) {
            
            lastWidth = window.innerWidth;
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(setupCarousels, 250);
        }
    });


    // =================================================================================
    // --- MODIFIED: Footer Contact Form (with Inline Validation) ---
    // (Addresses critical issues UX-01: Cryptic errors, lost data, no inline validation)
    // =================================================================================
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const formStatus = document.getElementById('form-status');

        const showError = (input, message) => {
            const errorSpan = document.getElementById(`${input.id}-error`);
            input.setAttribute('aria-invalid', 'true');
            errorSpan.textContent = message;
            errorSpan.classList.add('is-visible');
            
            // ACCESSIBILITY: Set focus to the first invalid field
            if (document.querySelector('.form-input[aria-invalid="true"]:first-of-type') === input) {
                input.focus();
            }
        };

        const clearError = (input) => {
            const errorSpan = document.getElementById(`${input.id}-error`);
            input.setAttribute('aria-invalid', 'false');
            errorSpan.textContent = '';
            errorSpan.classList.remove('is-visible');
        };

        const showFormStatus = (message, isSuccess) => {
            formStatus.textContent = message;
            formStatus.className = 'form-status'; // Reset classes
            formStatus.classList.add(isSuccess ? 'is-success' : 'is-error');
            // Show status
            formStatus.style.display = 'block'; 
        };

        const validateEmail = (email) => {
            // Simple regex for email validation
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        };

        const validateForm = () => {
            let isValid = true;
            // Clear all previous errors and status
            formStatus.style.display = 'none';
            clearError(nameInput);
            clearError(emailInput);
            clearError(messageInput);

            if (nameInput.value.trim() === '') {
                showError(nameInput, 'Please enter your name.');
                isValid = false;
            }
            // MODIFIED: Validate email only if something is entered
            if (emailInput.value.trim() === '') {
                showError(emailInput, 'Please enter your email address.');
                isValid = false;
            } else if (!validateEmail(emailInput.value.trim())) {
                showError(emailInput, 'Please enter a valid email address.');
                isValid = false;
            }
            if (messageInput.value.trim() === '') {
                showError(messageInput, 'Please enter a message.');
                isValid = false;
            }
            return isValid;
        };
        
        // Real-time validation listeners (improves UX by clearing errors as user types)
        nameInput.addEventListener('input', () => {
            if (nameInput.value.trim() !== '') clearError(nameInput);
        });
        emailInput.addEventListener('input', () => {
            if (emailInput.value.trim() !== '' && validateEmail(emailInput.value.trim())) clearError(emailInput);
        });
        messageInput.addEventListener('input', () => {
            if (messageInput.value.trim() !== '') clearError(messageInput);
        });
        
        // ACCESSIBILITY: Add validation listeners on blur for improved guidance
        nameInput.addEventListener('blur', () => {
            if (nameInput.value.trim() === '') showError(nameInput, 'Please enter your name.');
            else clearError(nameInput);
        });
        emailInput.addEventListener('blur', () => {
            if (emailInput.value.trim() === '') showError(emailInput, 'Please enter your email address.');
            else if (!validateEmail(emailInput.value.trim())) showError(emailInput, 'Please enter a valid email address.');
            else clearError(emailInput);
        });
        messageInput.addEventListener('blur', () => {
            if (messageInput.value.trim() === '') showError(messageInput, 'Please enter a message.');
            else clearError(messageInput);
        });


        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validateForm()) {
                // validation failed, focus is set in showError
                return; 
            }

            const submitButton = contactForm.querySelector('.submit-button');
            const oldButtonText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            showFormStatus('', true); // Clear status

            try {
                const formData = new FormData(contactForm);
                // Note: formspree action URL is a placeholder and may fail, 
                // but the client-side logic demonstrates correct error handling.
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                
                if (response.ok) {
                    // Success: Clear form and show success message
                    contactForm.reset();
                    showFormStatus('Thanks for your message! I\'ll get back to you soon.', true);
                } else {
                    // Failure: Attempt to read a specific error message
                    const errorData = await response.json().catch(() => ({ error: 'Form submission failed (Server Error)' }));
                    throw new Error(errorData.error || 'Form submission failed (Unknown Error)');
                }
            } catch (error) {
                console.error('Form Error:', error);
                // Show a generic, user-friendly error message
                showFormStatus('Sorry, there was a problem sending your message. Please check your inputs and try again.', false);
                // On submission failure, re-validate and focus the first invalid field
                validateForm(); 
            } finally {
                submitButton.textContent = oldButtonText;
                submitButton.disabled = false;
            }
        });
    }

    // =================================================================================
    // --- UPDATED: Accordion Logic ---
    // =================================================================================
    // This logic only enforces "close-others-on-open" for the FAQ.
    
    const faqAccordion = document.querySelector('.faq-accordion');
    
    if (faqAccordion) {
        const faqItems = faqAccordion.querySelectorAll('.faq-item'); // <details>

        faqItems.forEach(item => {
            const summary = item.querySelector('.faq-question'); // <summary>

            if (summary) {
                summary.addEventListener('click', (e) => {
                    // Check if the item is NOT currently open (meaning it's about to open)
                    if (!item.open) {
                        // If it is, close all *other* items in this accordion
                        faqItems.forEach(otherItem => {
                            if (otherItem !== item) {
                                otherItem.open = false;
                            }
                        });
                    }
                });
            }
        });
    }

    
    // =================================================================================
    // --- Performance optimization for scroll events ---
    // =================================================================================
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                onScrollForButton();
                handleHeaderScroll(); 
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
    
    // Run once on load to set initial state
    onScrollForButton();
    handleHeaderScroll();

});
