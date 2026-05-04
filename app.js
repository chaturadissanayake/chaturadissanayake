document.addEventListener('DOMContentLoaded', () => {
    // ── 1. INITIALIZE ICONS ──────────────────────────────────────────────
    lucide.createIcons();

    // ── 2. REMOVE LOADING STATE ───────────────────────────────────────────
    const removeLoadingState = () => {
        document.body.classList.remove('loading');
    };
    if (document.readyState === 'complete') {
        removeLoadingState();
    } else {
        window.addEventListener('load', removeLoadingState);
        setTimeout(removeLoadingState, 2000);
    }

    // ── 3. CREATIVE CURSOR (GPU ACCELERATED) ─────────────────────────────
    const cursorDot  = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    if (window.matchMedia('(pointer: fine)').matches && cursorDot && cursorRing) {
        let rx = 0, ry = 0, mx = 0, my = 0;

        document.addEventListener('mousemove', e => {
            mx = e.clientX; my = e.clientY;
            cursorDot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
        });

        (function animateCursor() {
            rx += (mx - rx) * 0.15;
            ry += (my - ry) * 0.15;
            cursorRing.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
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

    const setView = mode => {
        const isGrid = mode === 'grid';
        gridBtn?.classList.toggle('active', isGrid);
        listBtn?.classList.toggle('active', !isGrid);
        if (projWrap) projWrap.className = `projects-wrapper ${isGrid ? 'grid' : 'list'}-mode`;
    };
    gridBtn?.addEventListener('click', () => setView('grid'));
    listBtn?.addEventListener('click', () => setView('list'));

    // ── 10. PROJECT FILTERING ─────────────────────────────────────────────
    const filterBtns   = document.querySelectorAll('.filter-pill');
    const allProjCards = document.querySelectorAll('.project-card.project-trigger');
    const noProjMsg    = document.getElementById('no-projects-msg');
    let currentFilter  = 'all';

    const applyProjectFilter = () => {
        let count = 0;
        allProjCards.forEach(card => {
            const cat     = card.getAttribute('data-category') || '';
            const matches = currentFilter === 'all' || cat.split(' ').includes(currentFilter);
            card.style.display = matches ? '' : 'none';
            if (matches) count++;
        });
        if (noProjMsg) noProjMsg.style.display = count === 0 ? 'block' : 'none';
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            applyProjectFilter();
        });
    });

    // ── 11. ARTICLE SEARCH ────────────────────────────────────────────────
    const searchInput    = document.getElementById('article-search');
    const noArticlesMsg  = document.getElementById('no-articles-msg');

    searchInput?.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        let count = 0;
        document.querySelectorAll('.insight-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            const show = !q || text.includes(q);
            card.style.display = show ? '' : 'none';
            if (show) count++;
        });
        if (noArticlesMsg) noArticlesMsg.style.display = count === 0 ? 'block' : 'none';
    });

    // ── 12. PROJECT DETAIL MODAL ──────────────────────────────────────────
    const projectModal    = document.getElementById('project-detail-modal');
    const closeProjectBtn = document.getElementById('close-project-modal');

    const openModal = card => {
        document.getElementById('pm-title').textContent     = card.getAttribute('data-title')     || card.querySelector('h3')?.textContent || 'Project';
        document.getElementById('pm-challenge').textContent = card.getAttribute('data-challenge')  || '—';
        document.getElementById('pm-role').textContent      = card.getAttribute('data-role')      || '—';
        document.getElementById('pm-outcome').textContent   = card.getAttribute('data-outcome')   || '—';

        const link   = document.getElementById('pm-link');
        const href   = card.getAttribute('data-link');
        const status = card.getAttribute('data-status') || 'View Project';

        link.innerHTML = `${status} <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i>`;
        lucide.createIcons({ nameAttr: 'data-lucide', root: link });

        if (href && href !== '#') {
            link.href = href;
            link.style.display = 'inline-flex';
        } else {
            link.removeAttribute('href');
            link.style.display = 'none';
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

    // ── 13. VISUALISATIONS CAROUSEL ───────────────────────────────────────
    const vizTrack = document.querySelector('.viz-carousel-track');
    if (vizTrack) {
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

    // ── 14. LIGHTBOX ──────────────────────────────────────────────────────
    const lbModal = document.getElementById('lightbox-modal');
    const lbImg   = document.getElementById('lightbox-image');
    if (lbModal && lbImg) {
        document.querySelectorAll('.viz-lightbox-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
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

    // ── 15. SMOOTH SCROLL ─────────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const targetId = a.getAttribute('href');
            if (targetId !== '#' && document.querySelector(targetId)) {
                e.preventDefault();
                document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── 16. STAGGERED CARD REVEAL ─────────────────────────────────────────
    // Scale removed — was causing the dizzy effect. Simple fade + slide only.
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cardObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const siblings = Array.from(card.parentElement?.children || []);
                const idx = siblings.indexOf(card);
                const delay = prefersReduced ? 0 : Math.min(idx * 60, 360);
                card.style.transitionDelay = delay + 'ms';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                cardObserver.unobserve(card);
            }
        });
    }, { threshold: 0.04, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.project-card, .lab-card, .insight-card, .viz-item').forEach(card => {
        if (prefersReduced) return; // respect user OS setting
        card.style.opacity   = '0';
        card.style.transform = 'translateY(18px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        cardObserver.observe(card);
    });

    // ── 17. EXPERIENCE LIST HOVER ──────────────────────────────────────────
    document.querySelectorAll('.exp-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.paddingLeft = '8px';
            item.style.transition  = 'padding-left 0.2s ease';
        });
        item.addEventListener('mouseleave', () => {
            item.style.paddingLeft = '0';
        });
    });
});
