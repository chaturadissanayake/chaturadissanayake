document.addEventListener('DOMContentLoaded', () => {
    const siteLoader = document.getElementById('site-loader');
    const siteLoaderType = document.getElementById('site-loader-type');
    const loaderText = 'Chatura Dissanayake';
    const prefersReducedMotionLoader = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The loader's typing animation and the page's actual readiness used to
    // run on two independent timers: on a fast/cached load the content was
    // ready and revealed underneath while the loader kept typing away for no
    // reason, and on a slow load the loader could disappear before the page
    // was actually ready, leaving a blank flash. Gate the reveal on both
    // conditions together so loader-hide and content-reveal happen as one step.
    let typingDone = false;
    let pageReady = false;

    const revealContent = () => {
        if (!typingDone || !pageReady) return;
        document.body.classList.remove('loading');
        if (siteLoader) {
            siteLoader.classList.add('is-hidden');
            setTimeout(() => {
                if (siteLoader.parentNode) siteLoader.parentNode.removeChild(siteLoader);
            }, 500);
        }
    };

    if (siteLoader && siteLoaderType) {
        if (prefersReducedMotionLoader) {
            siteLoaderType.textContent = loaderText;
            typingDone = true;
        } else {
            let loaderCharIndex = 0;
            const typeLoaderChar = () => {
                if (loaderCharIndex < loaderText.length) {
                    siteLoaderType.textContent += loaderText.charAt(loaderCharIndex);
                    loaderCharIndex++;
                    setTimeout(typeLoaderChar, 45);
                } else {
                    typingDone = true;
                    revealContent();
                }
            };
            typeLoaderChar();
        }
    } else {
        typingDone = true;
    }

    if (document.readyState === 'complete') {
        pageReady = true;
    } else {
        window.addEventListener('load', () => { pageReady = true; revealContent(); });
    }
    // Fallback so a slow-loading page can't hold the loader up indefinitely.
    setTimeout(() => { pageReady = true; revealContent(); }, 2500);

    if (typingDone && pageReady) revealContent();

    SiteUtils.initIcons();

    console.log('%cChatura Dissanayake', 'font-size:22px;font-weight:bold;color:#111;');
    console.log('%cThis site design and code are original work by Chatura Dissanayake (chaturadissanayake.vercel.app). Copying or reusing this template without permission is not permitted.', 'font-size:13px;color:#555;');

    document.addEventListener('contextmenu', e => {
        if (e.target.closest('img')) {
            e.preventDefault();
        }
    });

    document.addEventListener('dragstart', e => {
        if (e.target.closest('img')) {
            e.preventDefault();
        }
    });

    document.addEventListener('click', e => {
        const anchor = e.target.closest('a[href^="/#"]');
        if (anchor && !anchor.classList.contains('mobile-link')) {
            const targetId = anchor.getAttribute('href').split('#')[1];
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: SiteUtils.getScrollBehavior() });
                history.pushState(null, '', '#' + targetId);
            }
        }
    });


    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.section-fade-in').forEach(s => observer.observe(s));

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const proofNums = document.querySelectorAll('.proof-num[data-count-to]');

    const animateCountUp = (el) => {
        const target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
        const suffix = el.getAttribute('data-suffix') || '';

        if (prefersReducedMotion) {
            el.textContent = target.toLocaleString('en-US') + suffix;
            return;
        }

        const duration = 1400;
        const startTime = performance.now();

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);

            el.textContent = current.toLocaleString('en-US') + suffix;

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    };

    if (proofNums.length) {
        const proofObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCountUp(entry.target);
                    proofObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        proofNums.forEach(el => proofObserver.observe(el));
    }

    const aboutContent = document.querySelector('.about-philosophy');
    const aboutReadMoreBtn = document.getElementById('about-read-more-btn');
    if (aboutContent && aboutReadMoreBtn) {
        if (window.innerWidth <= 640) {
            aboutContent.classList.add('is-collapsed-mobile');
        }
        aboutReadMoreBtn.addEventListener('click', () => {
            aboutContent.classList.toggle('is-collapsed-mobile');
            aboutReadMoreBtn.innerHTML = aboutContent.classList.contains('is-collapsed-mobile') 
                ? 'Read more <i data-lucide="chevron-down" style="width:14px;height:14px;margin-left:4px;"></i>' 
                : 'Show less <i data-lucide="chevron-up" style="width:14px;height:14px;margin-left:4px;"></i>';
            if (window.lucide) lucide.createIcons({ root: aboutReadMoreBtn });
        });
    }

    const contactForm   = document.getElementById('contact-form');
    const formStatus    = document.getElementById('form-status');
    const formSubmitBtn = document.getElementById('form-submit-btn');

    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();
            formSubmitBtn.disabled = true;
            formSubmitBtn.textContent = 'Sending…';
            formStatus.textContent = '';
            formStatus.className = 'form-status';

            try {
                const res = await fetch(contactForm.action, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    contactForm.innerHTML = '<div class="system-message form-success-state"><strong>Message received.</strong><span>I\'ll follow up within 1–2 business days.</span></div>';
                } else {
                    throw new Error('server');
                }
            } catch (error) {
                console.error('Contact form submission error:', error);
                formStatus.textContent = 'Message not sent, something went wrong. Try again or email directly at consultchatura@gmail.com';
                formStatus.classList.add('error');
            } finally {
                if (document.contains(formSubmitBtn)) {
                    formSubmitBtn.disabled = false;
                    formSubmitBtn.innerHTML = 'Send message <i data-lucide="send" aria-hidden="true"></i>';
                    if (window.lucide) {
                        lucide.createIcons({ nameAttr: 'data-lucide', root: formSubmitBtn });
                    }
                }
            }
        });
    }

    document.querySelectorAll('.media-item img').forEach(img => {
        const handleLoad = () => img.classList.add('img-loaded');
        if (img.complete && img.naturalHeight !== 0) {
            handleLoad();
        } else {
            img.addEventListener('load', handleLoad);
            img.addEventListener('error', handleLoad);
        }
    });

    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    if (cookieBanner && !localStorage.getItem('cookieConsent')) {
        cookieBanner.style.display = 'block';
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'granted');
            cookieBanner.style.display = 'none';
            if (typeof window.loadGA === 'function') window.loadGA();
        });
    }

    if (declineBtn) {
        declineBtn.addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'denied');
            cookieBanner.style.display = 'none';
        });
    }
    const mapContainer = document.querySelector('.map-image-inner');
    const mapTooltip = document.getElementById('map-tooltip');

    if (mapContainer && mapTooltip) {
        fetch('assets/world-map.svg')
            .then(response => {
                if (!response.ok) throw new Error('SVG not found');
                return response.text();
            })
            .then(svgData => {
                mapContainer.innerHTML = svgData;

                const svg = mapContainer.querySelector('svg');
                if (svg) {
                    svg.classList.add('clients-map-img');
                    svg.style.width = '100%';
                    svg.style.height = 'auto';
                }

                const interactiveElements = mapContainer.querySelectorAll('.cls-1, .cls-2, [data-info]');

                interactiveElements.forEach(el => {
                    el.style.cursor = 'pointer';
                    el.style.transition = 'opacity 0.2s ease';

                    el.addEventListener('mouseenter', () => {
                        el.style.opacity = '0.6';
                        const infoText = el.getAttribute('data-info');
                        if (infoText) {
                            mapTooltip.textContent = infoText;
                            mapTooltip.classList.add('is-visible');
                        }
                    });

                    el.addEventListener('mousemove', (e) => {
                        mapTooltip.style.left = `${e.clientX}px`;
                        mapTooltip.style.top = `${e.clientY}px`;
                    });

                    el.addEventListener('mouseleave', () => {
                        el.style.opacity = '1';
                        mapTooltip.classList.remove('is-visible');
                    });
                });
            })
            .catch(err => {
                console.error('Map loading error:', err);
                mapContainer.innerHTML = '<div class="system-message error-state"><p>Map unavailable right now.</p></div>';
            });
    }
});