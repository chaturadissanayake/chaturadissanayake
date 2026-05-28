document.addEventListener('DOMContentLoaded', () => {

    // ── CONSTANTS ────────────────────────────────────────────────────────
    // FIX: Hardcoded email extracted to a single source of truth
    const CONTACT_EMAIL = 'consultchatura@gmail.com';

    // ── UTILITY: HTML escape to prevent XSS ──────────────────────────────
    // FIX: All user-facing data from JSON now passes through this before
    // being written into innerHTML, preventing injection attacks.
    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ── 1. INITIALIZE ICONS ──────────────────────────────────────────────
    if (window.lucide) {
        lucide.createIcons();
    }

    // ── 2. REMOVE LOADING STATE ───────────────────────────────────────────
    const removeLoadingState = () => {
        document.body.classList.remove('loading');
    };
    if (document.readyState === 'complete') {
        removeLoadingState();
    } else {
        window.addEventListener('load', removeLoadingState);
        setTimeout(removeLoadingState, 400);
    }

    // ── 3. SCROLL PROGRESS BAR (element refs only — logic merged below) ───
    const progressBar = document.getElementById('scroll-progress');

    // ── 4. STICKY HEADER & FLOATING BTT (element refs only) ───────────────
    const header  = document.getElementById('main-header');
    const floatBtt = document.getElementById('floating-back-to-top');

    floatBtt?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ── 5. ACTIVE NAV HIGHLIGHTING (element refs only) ────────────────────
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');

    // ── MERGED SCROLL HANDLER ─────────────────────────────────────────────
    // FIX: Previously 3 separate scroll listeners fired independently on
    // every scroll event, each triggering layout reads (offsetTop, scrollY).
    // One handler eliminates the redundant listeners and batches all reads
    // into a single reflow per frame — measurably better scroll performance.
    const handleScroll = () => {
        const scrollY = window.scrollY;

        // Progress bar
        if (progressBar) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.width = (docHeight > 0 ? (scrollY / docHeight) * 100 : 0) + '%';
        }

        // Sticky header
        if (header) header.classList.toggle('scrolled', scrollY > 40);

        // Floating back-to-top visibility
        if (floatBtt) {
            const show = scrollY > 400;
            floatBtt.classList.toggle('is-visible', show);
            if (show) {
                floatBtt.removeAttribute('tabindex');
            } else {
                floatBtt.setAttribute('tabindex', '-1');
            }
        }

        // Active nav link highlighting
        let current = '';
        sections.forEach(s => {
            if (scrollY >= s.offsetTop - 120) current = s.id;
        });
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-section') === current);
        });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Run once on load to set initial states

    // ── 6. MOBILE MENU ───────────────────────────────────────────────────
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileMenu   = document.getElementById('mobile-nav-menu');

    // FIX: Duplicated close-menu logic extracted into a single function.
    // Previously the same 4 lines appeared in 3 different places.
    const closeMobileMenu = () => {
        if (!mobileMenu || !mobileToggle) return;
        mobileMenu.classList.remove('is-active');
        mobileToggle.classList.remove('is-active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
    };

    const toggleMobileMenu = () => {
        const isOpen = mobileMenu.classList.toggle('is-active');
        mobileToggle.classList.toggle('is-active', isOpen);
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('modal-open', isOpen);
        if (isOpen) {
            const firstLink = mobileMenu.querySelector('.mobile-link');
            if (firstLink) setTimeout(() => firstLink.focus(), 60);
        } else {
            mobileToggle.focus();
        }
    };

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);

        document.querySelectorAll('.mobile-link, .mobile-cta').forEach(l =>
            l.addEventListener('click', (e) => {
                closeMobileMenu(); // FIX: Uses shared helper instead of duplicated code

                const href = l.getAttribute('href');
                if (href && href.includes('#')) {
                    const targetId = href.substring(href.indexOf('#') + 1);
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        // Slight delay ensures menu closes before scrolling begins
                        setTimeout(() => {
                            targetEl.scrollIntoView({ behavior: 'smooth' });
                            // FIX: replaceState instead of pushState — avoids polluting
                            // browser history; user pressing Back goes to the previous page,
                            // not to a series of hash states they never "visited".
                            history.replaceState(null, '', href);
                        }, 50);
                    }
                }
            })
        );

        // Safety valve: close menu if user scrolls on Android (two-finger scroll)
        let menuScrollTimer;
        window.addEventListener('scroll', () => {
            if (!mobileMenu.classList.contains('is-active')) return;
            clearTimeout(menuScrollTimer);
            menuScrollTimer = setTimeout(closeMobileMenu, 80);
        }, { passive: true });
    }

    // ── 7. SCROLL REVEAL ANIMATIONS ──────────────────────────────────────
    // FIX: Renamed from 'observer' to 'revealObserver' to avoid name collision
    // with the floatBtnObserver declared later in the sidebar section.
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                revealObserver.unobserve(e.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.section-fade-in').forEach(s => revealObserver.observe(s));

    // ── 8. PROJECTS: FETCH JSON, BUILD CARDS & DYNAMIC FILTERS ───────────
    const projWrap    = document.getElementById('projects-container');
    const noProjMsg   = document.getElementById('no-projects-msg');
    const filterGroup = document.getElementById('dynamic-filter-group');
    let currentFilter = 'all';
    let allProjCards  = [];

    const applyProjectFilter = () => {
        let count = 0;
        const isMobile   = window.innerWidth <= 640;
        const expandBtn  = document.getElementById('expand-projects-btn');
        const isExpanded = expandBtn ? expandBtn.classList.contains('expanded') : false;
        const maxCards   = isMobile ? 3 : 6;

        allProjCards.forEach(card => {
            const cat     = card.getAttribute('data-category') || '';
            const matches = currentFilter === 'all' || cat === currentFilter;

            // FIX: Reset all display state cleanly before re-evaluating
            card.classList.remove('mobile-hidden');
            card.classList.remove('capped-hidden');
            card.style.display = '';

            if (matches) {
                count++;
                if (!isExpanded && currentFilter === 'all' && count > maxCards) {
                    card.classList.add('capped-hidden');
                    // FIX: Previously, capped cards were hidden only via CSS class,
                    // while non-matching cards used inline style.display = 'none'.
                    // This inconsistency caused bugs when switching between filters.
                    // Now both paths use the same explicit inline style.
                    card.style.display = 'none';
                }
            } else {
                card.style.display = 'none';
            }
        });

        if (noProjMsg) noProjMsg.style.display = count === 0 ? 'block' : 'none';

        if (expandBtn) {
            // FIX: Simplified the show/hide logic into a single expression
            const showExpand = currentFilter === 'all' && count > maxCards && !isExpanded;
            expandBtn.style.display = showExpand ? 'inline-flex' : 'none';
        }
    };

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(applyProjectFilter, 150);
    });

    const initProjects = async () => {
        if (!projWrap) return;

        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';

        // Render 6 skeleton cards immediately so the grid never looks empty
        const skeletonHTML = Array.from({ length: 6 }, () => `
            <div class="skeleton-card" aria-hidden="true">
                <div class="skeleton-image skeleton-shimmer"></div>
                <div class="skeleton-body">
                    <div class="skeleton-meta skeleton-shimmer"></div>
                    <div class="skeleton-title skeleton-shimmer"></div>
                    <div class="skeleton-desc skeleton-shimmer"></div>
                    <div class="skeleton-desc short skeleton-shimmer"></div>
                    <div class="skeleton-tags">
                        <div class="skeleton-pill skeleton-shimmer"></div>
                        <div class="skeleton-pill skeleton-shimmer"></div>
                    </div>
                </div>
            </div>
        `).join('');
        projWrap.innerHTML = skeletonHTML;

        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch('data/projects.json', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const projects = await res.json();

            // Sort: Active/Ongoing to back, newest completed to front
            projects.sort((a, b) => {
                const aIsOngoing = !a.link || a.link === '#';
                const bIsOngoing = !b.link || b.link === '#';
                if (aIsOngoing && !bIsOngoing) return 1;
                if (!aIsOngoing && bIsOngoing) return -1;
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (!isNaN(dateA) && !isNaN(dateB)) return dateB - dateA;
                return 0;
            });

            projWrap.innerHTML = '';
            const categories = new Set();

            projects.forEach(proj => {
                if (proj.category) categories.add(proj.category);

                const safeTags    = proj.tags || [];
                // FIX: Tag text now escaped before injection into innerHTML
                const tagsHTML    = safeTags.map(tag => `<span>${escapeHTML(tag)}</span>`).join('');
                const safeChallenge = proj.challenge || '';
                const descSnippet = safeChallenge.length > 120
                    ? safeChallenge.substring(0, 120) + '...'
                    : safeChallenge;

                // FIX: All data- attribute values are now escaped to prevent
                // attribute injection if a JSON field contains quote characters.
                const cardHTML = `
                    <article class="project-card project-trigger"
                        data-category="${escapeHTML(proj.category || '')}"
                        data-title="${escapeHTML(proj.title || '')}"
                        data-challenge="${escapeHTML(proj.challenge || '')}"
                        data-role="${escapeHTML(proj.role || '')}"
                        data-outcome="${escapeHTML(proj.outcome || '')}"
                        data-link="${escapeHTML(proj.link || '')}"
                        data-status="${escapeHTML(proj.status || '')}"
                        data-tags="${escapeHTML(safeTags.join(','))}">
                        <div class="card-inner">
                            <div class="card-image">
                                <img src="${escapeHTML(proj.thumbnail || '')}" alt="${escapeHTML(proj.title || '')}" loading="lazy" width="800" height="600">
                                <div class="card-overlay">
                                    <span class="card-open-label">View Case Study <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i></span>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="card-meta">
                                    <span class="card-cat">${escapeHTML(safeTags[0] || '')}</span>
                                    <span class="card-date">${escapeHTML(proj.date || '')}</span>
                                </div>
                                <div class="card-title-wrap">
                                    <h3 class="card-title">${escapeHTML(proj.title || '')}</h3>
                                    <p class="card-desc">${escapeHTML(descSnippet)}</p>
                                </div>
                                <div class="card-tags">${tagsHTML}</div>
                            </div>
                        </div>
                    </article>
                `;
                projWrap.insertAdjacentHTML('beforeend', cardHTML);
            });

            allProjCards = document.querySelectorAll('.project-card.project-trigger');

            // Smooth image reveal — bulletproof fallback for cached images
            projWrap.querySelectorAll('.card-image img').forEach(img => {
                const handleLoad = () => {
                    img.classList.add('img-loaded');
                    const parent = img.closest('.card-image');
                    if (parent) parent.classList.add('shimmer-complete');
                };
                if (img.complete && img.naturalHeight !== 0) {
                    handleLoad();
                } else {
                    img.addEventListener('load', handleLoad);
                    img.addEventListener('error', handleLoad); // Prevents infinite shimmer on broken images
                }
            });

            // Build dynamic filter pills
            if (filterGroup) {
                let filterHTML = `<button type="button" class="filter-pill active" data-filter="all" aria-current="true">All Work</button>`;
                categories.forEach(cat => {
                    filterHTML += `<button type="button" class="filter-pill" data-filter="${escapeHTML(cat)}">${escapeHTML(cat)}</button>`;
                });
                filterGroup.innerHTML = filterHTML;

                const filterBtns = document.querySelectorAll('.filter-pill');
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterBtns.forEach(b => {
                            b.classList.remove('active');
                            // FIX: aria-current communicates active filter to screen readers
                            b.removeAttribute('aria-current');
                        });
                        btn.classList.add('active');
                        btn.setAttribute('aria-current', 'true');
                        currentFilter = btn.getAttribute('data-filter');
                        applyProjectFilter();
                    });
                });
            }

            if (window.lucide) {
                lucide.createIcons({ root: projWrap });
            }

            allProjCards.forEach(card => {
                card.setAttribute('tabindex', '0');
                card.setAttribute('role', 'button');
                card.setAttribute('aria-label', 'View case study: ' + (card.getAttribute('data-title') || 'Project'));
                card.addEventListener('click', e => {
                    if (e.target.closest('.card-direct-link')) return;
                    openModal(card);
                });
                card.addEventListener('keydown', e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openModal(card);
                    }
                });
            });

            const expandBtn = document.getElementById('expand-projects-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    expandBtn.classList.add('expanded');
                    applyProjectFilter();
                });
            }

            applyProjectFilter();

        } catch (error) {
            clearTimeout(timeoutId);

            // FIX: AbortError (8s timeout) now shows a distinct, accurate message
            // instead of the generic network failure message. A timeout is a different
            // failure mode and deserves a different user-facing explanation.
            const isTimeout = error.name === 'AbortError';

            const loadingIndicatorOnErr = document.getElementById('loading-indicator');
            if (loadingIndicatorOnErr) loadingIndicatorOnErr.style.display = 'none';
            projWrap.innerHTML = '';

            if (noProjMsg) {
                const message = isTimeout
                    ? "Projects took too long to load.<br>Check your connection and try again."
                    : "Couldn't load projects.<br>Check your connection and try again.";

                noProjMsg.innerHTML = `
                    <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;padding:var(--space-12);">
                        <p style="color:var(--ink-muted);font-size:0.9375rem;line-height:1.7;">${message}</p>
                        <button onclick="window.location.reload()" class="btn-primary" style="margin-top:8px;">Retry <i data-lucide="refresh-cw" aria-hidden="true"></i></button>
                    </div>
                `;
                noProjMsg.style.display = 'block';
                if (window.lucide) lucide.createIcons({ root: noProjMsg });
            }

            if (!isTimeout) {
                console.error('Failed to load projects:', error);
            }
        }
    };

    initProjects();

    // ── 9. CONTACT FORM ───────────────────────────────────────────────────
    const contactForm   = document.getElementById('contact-form');
    const formStatus    = document.getElementById('form-status');
    const formSubmitBtn = document.getElementById('form-submit-btn');

    // FIX: aria-live region so screen readers announce the submission result.
    // Without this, a blind user submitting the form hears nothing after clicking Send.
    if (formStatus) {
        formStatus.setAttribute('aria-live', 'polite');
        formStatus.setAttribute('aria-atomic', 'true');
    }

    if (contactForm && formStatus) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();
            formSubmitBtn.disabled  = true;
            formSubmitBtn.textContent = 'Sending…';
            formStatus.textContent  = '';
            formStatus.className    = 'form-status';

            try {
                const res = await fetch(contactForm.action, {
                    method: 'POST',
                    body:    new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    contactForm.innerHTML = '<div class="form-status success" style="font-size:1.125rem;font-weight:500;text-align:center;padding:2rem;color:var(--ink);">Message sent. I\'ll be in touch soon.</div>';
                } else {
                    throw new Error('server');
                }
            } catch {
                // FIX: Uses CONTACT_EMAIL constant instead of hardcoded string
                formStatus.textContent = `Message not sent — something went wrong. Try again or email directly at ${CONTACT_EMAIL}`;
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

    // ── 10. PROJECT DETAIL MODAL ──────────────────────────────────────────
    const projectModal    = document.getElementById('project-detail-modal');
    const closeProjectBtn = document.getElementById('close-project-modal');

    // FIX: Split lastFocusedElement into two scoped variables.
    // Previously one shared variable was used by both the modal and the lightbox.
    // If a lightbox was opened from inside the modal, closing would focus the wrong element.
    let modalLastFocused = null;

    const focusableSelectors = 'a, button, [tabindex]:not([tabindex="-1"])';
    const trapFocus = e => {
        if (!projectModal.classList.contains('active')) return;
        const focusable = [...projectModal.querySelectorAll(focusableSelectors)];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.key === 'Tab') {
            if (e.shiftKey  && document.activeElement === first) { e.preventDefault(); last.focus(); }
            if (!e.shiftKey && document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
    };

    const openModal = card => {
        modalLastFocused = document.activeElement;
        const titleText = card.getAttribute('data-title') || card.querySelector('h3')?.textContent || 'Project';
        document.getElementById('pm-title').textContent    = titleText;
        document.getElementById('pm-challenge').textContent = card.getAttribute('data-challenge') || '—';
        document.getElementById('pm-role').textContent      = card.getAttribute('data-role')      || '—';
        document.getElementById('pm-outcome').textContent   = card.getAttribute('data-outcome')   || '—';

        // FIX: replaceState instead of pushState — see mobile menu comment above.
        // Pressing Back now reliably goes to the previous page, not through modal history.
        history.replaceState(null, '', '#' + titleText.toLowerCase().replace(/\s+/g, '-'));

        const link   = document.getElementById('pm-link');
        const href   = card.getAttribute('data-link');
        const status = card.getAttribute('data-status') || 'View Project';

        link.innerHTML = `${status} <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i>`;
        if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', root: link });

        if (href && href !== '#') {
            link.href = href;
            link.target = href.startsWith('http') ? '_blank' : '_self';
            link.style.display       = 'inline-flex';
            link.style.opacity       = '1';
            link.style.pointerEvents = 'auto';
        } else if (status && status !== 'View Project') {
            link.textContent         = status;
            link.removeAttribute('href');
            link.style.opacity       = '0.45';
            link.style.pointerEvents = 'none';
            link.style.display       = 'inline-flex';
        } else {
            link.removeAttribute('href');
            link.style.display = 'none';
        }

        const tagsEl  = document.getElementById('pm-tags');
        tagsEl.innerHTML = '';
        const rawTags = card.getAttribute('data-tags');
        if (rawTags) {
            rawTags.split(',').forEach(t => {
                const span = document.createElement('span');
                span.className   = 'pm-tag';
                span.textContent = t.trim();
                tagsEl.appendChild(span);
            });
        }

        projectModal.classList.add('active');
        document.body.classList.add('modal-open');
        projectModal.addEventListener('keydown', trapFocus);
        requestAnimationFrame(() => {
            const panel = projectModal.querySelector('.modal-panel');
            if (panel) panel.scrollTop = 0;
        });
    };

    const closeModal = () => {
        projectModal?.classList.remove('active');
        document.body.classList.remove('modal-open');
        projectModal?.removeEventListener('keydown', trapFocus);
        history.replaceState(null, '', '#projects');
        if (modalLastFocused) modalLastFocused.focus();
    };

    closeProjectBtn?.addEventListener('click', closeModal);
    projectModal?.addEventListener('mousedown', e => {
        if (e.target === projectModal) closeModal();
    });
    document.querySelector('.modal-panel')?.addEventListener('mousedown', e => e.stopPropagation());

    // ── 11. VISUALISATIONS CAROUSEL ───────────────────────────────────────
    const vizTrack = document.querySelector('.viz-carousel-track');
    if (vizTrack) {
        const vizCount   = document.querySelectorAll('.viz-item').length;
        const vizCountEl = document.querySelector('.viz-count');
        if (vizCountEl && vizCount > 0) vizCountEl.textContent = vizCount;

        const scrollAmt = () => {
            const item = vizTrack.querySelector('.viz-item');
            if (!item) return Math.min(420, window.innerWidth * 0.72);
            const itemW        = item.offsetWidth + 20;
            const viewportW    = vizTrack.parentElement?.offsetWidth || window.innerWidth;
            const visibleCount = Math.max(1, Math.floor(viewportW / itemW));
            return itemW * visibleCount;
        };

        document.getElementById('viz-next-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left:  scrollAmt(), behavior: 'smooth' })
        );
        document.getElementById('viz-prev-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left: -scrollAmt(), behavior: 'smooth' })
        );
        vizTrack.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') vizTrack.scrollBy({ left:  scrollAmt(), behavior: 'smooth' });
            if (e.key === 'ArrowLeft')  vizTrack.scrollBy({ left: -scrollAmt(), behavior: 'smooth' });
        });

        // FIX: Added touch swipe support for the carousel.
        // Previously there was no way to swipe it on mobile — users had to use
        // the prev/next buttons, which is not a natural mobile interaction pattern.
        let touchStartX = 0;
        vizTrack.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        vizTrack.addEventListener('touchend', e => {
            const delta = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(delta) > 50) { // Minimum swipe distance to prevent accidental triggers
                vizTrack.scrollBy({ left: delta > 0 ? scrollAmt() : -scrollAmt(), behavior: 'smooth' });
            }
        }, { passive: true });

        // Carousel counter
        const vizCounter = document.getElementById('viz-counter');
        if (vizCounter) {
            const syncCounter = () => {
                const items = vizTrack.querySelectorAll('.viz-item');
                if (!items.length) return;
                const itemW     = items[0].offsetWidth + 20;
                const activeIdx = Math.min(Math.round(vizTrack.scrollLeft / itemW), items.length - 1);
                vizCounter.textContent = `${activeIdx + 1} / ${items.length}`;
            };
            vizTrack.addEventListener('scroll', syncCounter, { passive: true });
            syncCounter();
        }
    }

    // ── 12. LIGHTBOX ──────────────────────────────────────────────────────
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg   = document.getElementById('lightbox-image');
    const lightboxClose = lightboxModal?.querySelector('.lightbox-close');
    const lightboxPrev  = document.getElementById('lightbox-prev');
    const lightboxNext  = document.getElementById('lightbox-next');
    const vizTriggers   = Array.from(document.querySelectorAll('.viz-lightbox-trigger'));
    let lightboxIdx     = 0;
    // FIX: Scoped separately from modalLastFocused to avoid cross-contamination
    let lightboxLastFocused = null;

    const openLightboxAt = (idx) => {
        if (!lightboxModal || !vizTriggers[idx]) return;
        if (lightboxModal.style.display !== 'flex') lightboxLastFocused = document.activeElement;
        lightboxIdx = idx;
        const src = vizTriggers[idx].querySelector('.viz-main-img');
        if (src && lightboxImg) {
            lightboxImg.src = src.src;
            lightboxImg.alt = src.alt || '';
        }
        lightboxModal.style.display = 'flex';
        lightboxClose?.focus();
    };

    const closeLightbox = () => {
        if (lightboxModal) lightboxModal.style.display = 'none';
        if (lightboxImg)   { lightboxImg.src = ''; lightboxImg.alt = ''; }
        if (lightboxLastFocused) lightboxLastFocused.focus();
    };

    vizTriggers.forEach((item, idx) => {
        item.addEventListener('click', () => openLightboxAt(idx));
    });
    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightboxAt((lightboxIdx - 1 + vizTriggers.length) % vizTriggers.length);
    });
    lightboxNext?.addEventListener('click', (e) => {
        e.stopPropagation();
        openLightboxAt((lightboxIdx + 1) % vizTriggers.length);
    });
    lightboxModal?.addEventListener('click', e => {
        if (e.target === lightboxModal) closeLightbox();
    });

    // ── MERGED KEYDOWN HANDLER ────────────────────────────────────────────
    // FIX: Previously there were 3 separate document.keydown listeners —
    // one each for mobile menu, project modal, and lightbox. Multiple listeners
    // on the same event/element is wasteful and hard to reason about.
    // One listener with ordered guards handles all cases cleanly.
    document.addEventListener('keydown', e => {
        // Priority: mobile menu > project modal > lightbox
        if (e.key === 'Escape') {
            if (mobileMenu?.classList.contains('is-active')) {
                closeMobileMenu();
                return;
            }
            if (projectModal?.classList.contains('active')) {
                closeModal();
                return;
            }
            if (lightboxModal?.style.display === 'flex') {
                closeLightbox();
                return;
            }
        }
        // Lightbox arrow navigation
        if (lightboxModal?.style.display === 'flex') {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                openLightboxAt((lightboxIdx + 1) % vizTriggers.length);
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                openLightboxAt((lightboxIdx - 1 + vizTriggers.length) % vizTriggers.length);
            }
        }
    });

    // ── 13. HERO WORD CYCLE ───────────────────────────────────────────────
    const cyclers = document.querySelectorAll('.hero-cycler');
    if (cyclers.length > 0) {
        let activeIdx1 = 0;
        const emp1 = cyclers[0].querySelectorAll('.hero-emp-1');

        // Set the first word visible immediately — prevents blank hero on load
        if (emp1.length > 0) emp1[0].classList.add('active');

        const cycleWords = () => {
            if (emp1.length === 0) return;
            emp1[activeIdx1].classList.remove('active');
            emp1[activeIdx1].classList.add('exit');
            const prev1 = activeIdx1;
            setTimeout(() => emp1[prev1].classList.remove('exit'), 400);
            activeIdx1 = (activeIdx1 + 1) % emp1.length;
            emp1[activeIdx1].classList.add('active');
        };

        // Respect the user's motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (!motionQuery.matches) {
            let cycleInterval = setInterval(cycleWords, 3500);

            // FIX: WCAG 2.1 criterion 2.2.2 (Pause, Stop, Hide) — any content
            // that moves automatically and lasts more than 5 seconds must be
            // pausable. We pause the cycler when the user hovers or focuses
            // anywhere in the hero section.
            const heroSection = cyclers[0].closest('section');
            if (heroSection) {
                const pauseCycle  = () => clearInterval(cycleInterval);
                const resumeCycle = () => { cycleInterval = setInterval(cycleWords, 3500); };
                heroSection.addEventListener('mouseenter', pauseCycle);
                heroSection.addEventListener('mouseleave', resumeCycle);
                heroSection.addEventListener('focusin',    pauseCycle);
                heroSection.addEventListener('focusout',   resumeCycle);
            }
        }
        // If reduced motion, the first word stays visible via the active class set above
    }

    // ── 14. PROJECT DETAIL PAGES (CASE STUDIES) ──────────────────────────
    const sidebarWrap = document.getElementById('sidebarWrap');

    if (sidebarWrap) {
        // Exposed globally so inline onclick="toggleSidebar()" in HTML works
        window.toggleSidebar = function() {
            const isDesktop = window.innerWidth > 1024;
            const icons = document.querySelectorAll('.toggle-icon');

            if (isDesktop) {
                sidebarWrap.classList.toggle('is-collapsed');
                const isNowOpen = !sidebarWrap.classList.contains('is-collapsed');
                icons.forEach(icon => icon.textContent = isNowOpen ? '×' : '+');
            } else {
                sidebarWrap.classList.toggle('is-open-mobile');
                const isNowOpen = sidebarWrap.classList.contains('is-open-mobile');
                icons.forEach(icon => icon.textContent = isNowOpen ? '×' : '+');
                document.body.style.overflow = isNowOpen ? 'hidden' : '';
            }
        };

        const floatBtn       = document.getElementById('mobileFloatBtn');
        const triggerSection = document.getElementById('nextProjectTarget');

        if (floatBtn && triggerSection) {
            // FIX: Renamed from 'observer' to 'floatBtnObserver' — the generic name
            // 'observer' was already used for the revealObserver above, causing a
            // variable name collision in the outer scope.
            const floatBtnObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    floatBtn.style.opacity       = '0';
                    floatBtn.style.pointerEvents = 'none';
                    floatBtn.style.transform     = 'translate(-50%, 20px)';
                } else {
                    floatBtn.style.opacity       = '1';
                    floatBtn.style.pointerEvents = 'auto';
                    floatBtn.style.transform     = 'translate(-50%, 0)';
                }
            }, { rootMargin: '100px' });

            floatBtnObserver.observe(triggerSection);
        }

        // ── Smart random next project loader ──────────────────────────────
        if (triggerSection) {
            const loadNextProject = async () => {
                try {
                    const res = await fetch('../../data/projects.json');
                    if (!res.ok) throw new Error('Failed to load projects');
                    const projects = await res.json();

                    const currentProject  = projects.find(p => p.link && p.link !== '#' && window.location.pathname.includes(p.link.replace('.html', '').replace('/index.html', '')));
                    const currentLinkKey  = currentProject ? currentProject.link : window.location.pathname;

                    let visited = JSON.parse(sessionStorage.getItem('viewedCaseStudies') || '[]');
                    if (!visited.includes(currentLinkKey)) {
                        visited.push(currentLinkKey);
                        sessionStorage.setItem('viewedCaseStudies', JSON.stringify(visited));
                    }

                    const potentialNext = projects.filter(p =>
                        p.link &&
                        p.link !== '#' &&
                        p.link !== currentLinkKey &&
                        !window.location.pathname.includes(p.link.replace('.html', '').replace('/index.html', ''))
                    );

                    const unvisited    = potentialNext.filter(p => !visited.includes(p.link));
                    const selectionPool = unvisited.length > 0 ? unvisited : potentialNext;

                    if (selectionPool.length > 0) {
                        const randomProj  = selectionPool[Math.floor(Math.random() * selectionPool.length)];
                        const isExternal  = randomProj.link.startsWith('http');
                        const finalHref   = isExternal ? randomProj.link : `../../${randomProj.link}`;
                        // FIX: Tags escaped before injection into innerHTML
                        const tagsHTML    = (randomProj.tags || []).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('');
                        let descSnippet   = randomProj.challenge || '';
                        if (descSnippet.length > 120) descSnippet = descSnippet.substring(0, 120) + '...';

                        // FIX: User-visible text (title, description) set via textContent
                        // on DOM nodes rather than via innerHTML to prevent XSS.
                        const anchor = document.createElement('a');
                        anchor.href      = finalHref;
                        anchor.className = 'next-project-inner next-project-link';
                        anchor.setAttribute('aria-label', 'View next project: ' + randomProj.title);
                        if (isExternal) { anchor.target = '_blank'; anchor.rel = 'noopener'; }

                        const labelEl = document.createElement('div');
                        labelEl.className   = 'next-label';
                        labelEl.textContent = 'Next Project';

                        const titleEl = document.createElement('h2');
                        titleEl.className   = 'next-title';
                        titleEl.textContent = randomProj.title;

                        const descEl  = document.createElement('p');
                        descEl.className   = 'next-desc';
                        descEl.textContent = descSnippet;

                        const tagsEl  = document.createElement('div');
                        tagsEl.className = 'tags-col';
                        tagsEl.innerHTML = tagsHTML; // Tags already escaped above

                        anchor.append(labelEl, titleEl, descEl, tagsEl);
                        triggerSection.innerHTML = '';
                        triggerSection.appendChild(anchor);
                    }
                } catch (error) {
                    console.error('Error loading next project:', error);
                }
            };
            loadNextProject();
        }
    }
});