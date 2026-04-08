document.addEventListener('DOMContentLoaded', () => {
    // ── 1. INITIALIZE ICONS ──────────────────────────────────────────────
    lucide.createIcons();

    // ── 2. REMOVE LOADING STATE (Updated for better UX) ──────────────────
    // Wait for actual assets to load to prevent layout shifts, with a fallback
    const removeLoadingState = () => {
        document.body.classList.remove('loading');
    };
    if (document.readyState === 'complete') {
        removeLoadingState();
    } else {
        window.addEventListener('load', removeLoadingState);
        // Fallback just in case a third-party script hangs
        setTimeout(removeLoadingState, 2000);
    }

    // ── 3. CUSTOM CURSOR (DESKTOP ONLY) ──────────────────────────────────
    const cursorDot  = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    if (window.matchMedia('(pointer: fine)').matches && cursorDot && cursorRing) {
        let rx = 0, ry = 0, mx = 0, my = 0;

        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            cursorDot.style.left  = mx + 'px';
            cursorDot.style.top   = my + 'px';
        });

        (function animateCursor() {
            // 0.14 Lerp factor keeps it snappy but smooth
            rx += (mx - rx) * 0.14;
            ry += (my - ry) * 0.14;
            cursorRing.style.left = rx + 'px';
            cursorRing.style.top  = ry + 'px';
            requestAnimationFrame(animateCursor);
        })();

        const hoverEls = 'a, button, .project-card, .card-hitbox, .viz-item, input, textarea';
        document.querySelectorAll(hoverEls).forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }

    // ── 4. SCROLL PROGRESS BAR ───────────────────────────────────────────
    const progressBar = document.getElementById('scroll-progress');
    const updateProgress = () => {
        const scrollTop  = window.scrollY;
        const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) progressBar.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });

    // ── 5. STICKY HEADER ─────────────────────────────────────────────────
    const header = document.getElementById('main-header');
    window.addEventListener('scroll', () => {
        if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    // ── 6. ACTIVE NAV HIGHLIGHTING ───────────────────────────────────────
    const sections  = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('.nav-link[data-section]');

    const activateNav = () => {
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - 120) current = s.id;
        });
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-section') === current);
        });
    };
    window.addEventListener('scroll', activateNav, { passive: true });
    activateNav();

    // ── 7. MOBILE MENU ───────────────────────────────────────────────────
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileMenu   = document.getElementById('mobile-nav-menu');

    const toggleMobileMenu = () => {
        const isOpen = mobileMenu.classList.toggle('is-active');
        mobileToggle.classList.toggle('is-active', isOpen);
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('modal-open', isOpen);
    };

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
        
        document.querySelectorAll('.mobile-link, .mobile-cta').forEach(l =>
            l.addEventListener('click', () => {
                mobileMenu.classList.remove('is-active');
                mobileToggle.classList.remove('is-active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('modal-open');
            })
        );
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && mobileMenu?.classList.contains('is-active')) {
            toggleMobileMenu();
        }
    });

    // ── 8. SCROLL REVEAL ANIMATIONS ──────────────────────────────────────
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('is-visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.section-fade-in').forEach(s => observer.observe(s));

    // ── 9. VIEW TOGGLE (Grid / List) ─────────────────────────────────────
    const gridBtn  = document.getElementById('grid-view-btn');
    const listBtn  = document.getElementById('list-view-btn');
    const projWrap = document.getElementById('projects-container');
    const extWrap  = document.getElementById('extended-work');

    const setView = mode => {
        const isGrid = mode === 'grid';
        gridBtn?.classList.toggle('active', isGrid);
        listBtn?.classList.toggle('active', !isGrid);

        if (projWrap) projWrap.className = `projects-wrapper ${isGrid ? 'grid' : 'list'}-mode`;
        if (extWrap) {
            const wasShowing = extWrap.classList.contains('show');
            extWrap.className = `extended-work ${isGrid ? 'grid' : 'list'}-mode${wasShowing ? ' show' : ''}`;
        }
    };
    gridBtn?.addEventListener('click', () => setView('grid'));
    listBtn?.addEventListener('click', () => setView('list'));

    // ── 10. EXTENDED GALLERY (Show / Hide Logic) ─────────────────────────
    const showMoreBtn = document.getElementById('show-more-btn');
    if (showMoreBtn && extWrap) {
        showMoreBtn.addEventListener('click', () => {
            const isShowing = extWrap.classList.toggle('show');
            
            // Swap the text dynamically
            const textSpan = showMoreBtn.querySelector('span:not(.btn-icon-wrap)');
            if (textSpan) {
                textSpan.textContent = isShowing ? 'Hide Extended Gallery' : 'Show Extended Gallery';
            }
            
            // Smoothly scroll back to the main projects section if hiding
            if (!isShowing) {
                document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
            }
            applyProjectFilter();
        });
    }

    // ── 11. PROJECT FILTERING ─────────────────────────────────────────────
    const filterBtns   = document.querySelectorAll('.filter-pill');
    const allProjCards = document.querySelectorAll('.project-card.project-trigger');
    const noProjMsg    = document.getElementById('no-projects-msg');
    let currentFilter  = 'all';

    const applyProjectFilter = () => {
        const extendedVisible = extWrap?.classList.contains('show');
        let count = 0;

        allProjCards.forEach(card => {
            const isExtended = card.closest('#extended-work') !== null;
            const cat = card.getAttribute('data-category');
            const matches = currentFilter === 'all' || cat === currentFilter;

            if (matches) {
                card.style.display = '';
                if (!isExtended || extendedVisible) count++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noProjMsg) noProjMsg.style.display = count === 0 ? 'block' : 'none';
    };

    filterBtns.forEach(btn => btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        applyProjectFilter();
    }));
    applyProjectFilter();

    // ── 12. INSIGHTS SEARCH (Updated Logic) ───────────────────────────────
    const insightSearch = document.getElementById('article-search');
    const insightCards  = document.querySelectorAll('.insight-card');
    const noArticlesMsg = document.getElementById('no-articles-msg');

    insightSearch?.addEventListener('input', e => {
        const term = e.target.value.toLowerCase().trim();
        let count = 0;
        
        insightCards.forEach(card => {
            // Now checks both title and description for matches
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
            
            const visible = title.includes(term) || desc.includes(term);
            card.style.display = visible ? '' : 'none';
            if (visible) count++;
        });
        
        if (noArticlesMsg) noArticlesMsg.style.display = count === 0 ? 'block' : 'none';
    });

    // ── 13. PROJECT DETAIL MODAL ──────────────────────────────────────────
    const projectModal    = document.getElementById('project-detail-modal');
    const closeProjectBtn = document.getElementById('close-project-modal');

    const openModal = card => {
        document.getElementById('pm-title').textContent    = card.getAttribute('data-title')    || card.querySelector('h3')?.textContent || 'Project';
        document.getElementById('pm-challenge').textContent = card.getAttribute('data-challenge') || '—';
        document.getElementById('pm-role').textContent     = card.getAttribute('data-role')     || '—';
        document.getElementById('pm-outcome').textContent  = card.getAttribute('data-outcome')  || '—';

        const link   = document.getElementById('pm-link');
        const href   = card.getAttribute('data-link');
        const status = card.getAttribute('data-status') || 'View Project';
        
        // Re-inject icon cleanly so Lucide can process it
        link.innerHTML = `${status} <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i>`;
        lucide.createIcons({ nameAttr: 'data-lucide', root: link });

        if (href && href !== '#') {
            link.href = href;
            link.style.display = 'inline-flex';
        } else {
            link.removeAttribute('href');
            link.style.display = href === '#' ? 'none' : 'inline-flex';
        }

        const tagsEl = document.getElementById('pm-tags');
        tagsEl.innerHTML = '';
        const rawTags = card.getAttribute('data-tags');
        if (rawTags) {
            rawTags.split(',').forEach(t => {
                const span = document.createElement('span');
                span.className = 'pm-tag';
                span.textContent = t.trim();
                tagsEl.appendChild(span);
            });
        }

        projectModal.classList.add('active');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        projectModal?.classList.remove('active');
        document.body.classList.remove('modal-open');
    };

    document.querySelectorAll('.project-trigger').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('.card-direct-link')) return;
            openModal(card);
        });
    });

    closeProjectBtn?.addEventListener('click', closeModal);
    projectModal?.addEventListener('click', e => {
        if (e.target === projectModal) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && projectModal?.classList.contains('active')) closeModal();
    });

    // ── 14. VISUALISATIONS CAROUSEL ───────────────────────────────────────
    const vizTrack = document.querySelector('.viz-carousel-track');
    if (vizTrack) {
        // Dynamically calculate scroll based on card width + CSS gap (approx 24px)
        const scrollAmt = () => {
            const item = vizTrack.querySelector('.viz-item');
            return item ? item.offsetWidth + 24 : Math.min(420, window.innerWidth * 0.72);
        };
        
        document.getElementById('viz-next-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left: scrollAmt(), behavior: 'smooth' })
        );
        document.getElementById('viz-prev-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left: -scrollAmt(), behavior: 'smooth' })
        );
    }

    // ── 15. LIGHTBOX ──────────────────────────────────────────────────────
    const lbModal = document.getElementById('lightbox-modal');
    const lbImg   = document.getElementById('lightbox-image');
    if (lbModal && lbImg) {
        document.querySelectorAll('.viz-lightbox-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                // Ensure we grab the sharp foreground image, NOT the blurred background
                const img = trigger.querySelector('.viz-main-img') || trigger.querySelector('img');
                if (!img) return;
                lbImg.src = img.src;
                lbImg.alt = img.alt;
                lbModal.style.display = 'flex';
                document.body.classList.add('modal-open');
            });
        });

        const closeLightbox = () => {
            lbModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        };

        lbModal.addEventListener('click', e => {
            if (e.target === lbModal || e.target.closest('.lightbox-close')) closeLightbox();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && lbModal.style.display === 'flex') closeLightbox();
        });
    }

    // ── 16. SMOOTH SCROLL (Hash Links & Back To Top) ──────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const targetId = a.getAttribute('href');
            // Prevent default only if the target is a valid section on this page
            if (targetId !== '#' && document.querySelector(targetId)) {
                e.preventDefault();
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Dedicated listener for the explicit back-to-top button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── 17. STAGGERED CARD REVEAL ──────────────────────────────────────────
    const cardObserver = new IntersectionObserver(entries => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                entry.target.style.transitionDelay = `${i * 60}ms`;
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                cardObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    // Added .viz-item so the visual archive cards get the same elegant fade-in
    document.querySelectorAll('.project-card, .lab-card, .insight-card, .viz-item').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        cardObserver.observe(card);
    });
});
