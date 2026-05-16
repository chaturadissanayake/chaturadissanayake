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

    // ── 3. SCROLL PROGRESS BAR ───────────────────────────────────────────
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
            l.addEventListener('click', () => {
                mobileMenu.classList.remove('is-active');
                mobileToggle.classList.remove('is-active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('modal-open');
                mobileToggle.focus();
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
            if (matches) {
                card.style.display = '';
                // If card was already revealed by the IntersectionObserver, restore visible state
                if (card.dataset.revealed === 'true') {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }
                count++;
            } else {
                card.style.display = 'none';
            }
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

    // ── 11A. CONTACT FORM FEEDBACK ────────────────────────────────────────
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
                    formStatus.textContent = 'Message sent - I\'ll be in touch soon.';
                    formStatus.classList.add('success');
                    contactForm.reset();
                } else {
                    throw new Error('server');
                }
            } catch {
                formStatus.textContent = 'Something went wrong. Email me directly at consultchatura@gmail.com';
                formStatus.classList.add('error');
            } finally {
                formSubmitBtn.disabled = false;
                formSubmitBtn.innerHTML = 'Send Message <i data-lucide="arrow-right" aria-hidden="true"></i>';
                lucide.createIcons({ nameAttr: 'data-lucide', root: formSubmitBtn });
            }
        });
    }

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
        requestAnimationFrame(() => {
            const panel = projectModal.querySelector('.modal-panel');
            if (panel) panel.scrollTop = 0;
        });
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
            if (!item) return Math.min(420, window.innerWidth * 0.72);
            const itemW = item.offsetWidth + 24;
            const viewportW = vizTrack.parentElement?.offsetWidth || window.innerWidth;
            const visibleCount = Math.max(1, Math.floor(viewportW / itemW));
            return itemW * visibleCount;
        };
        document.getElementById('viz-next-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left: scrollAmt(), behavior: 'smooth' })
        );
        document.getElementById('viz-prev-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left: -scrollAmt(), behavior: 'smooth' })
        );

        // ── 13B. CAROUSEL DOTS ────────────────────────────────────────────
        const vizDots = document.querySelectorAll('.viz-dot');
        if (vizDots.length) {
            const syncDots = () => {
                const items = vizTrack.querySelectorAll('.viz-item');
                if (!items.length) return;
                const itemW = items[0].offsetWidth + 20;
                const activeIdx = Math.min(
                    Math.round(vizTrack.scrollLeft / itemW),
                    items.length - 1
                );
                vizDots.forEach((d, i) => d.classList.toggle('active', i === activeIdx));
            };
            vizTrack.addEventListener('scroll', syncDots, { passive: true });
            vizDots.forEach((dot, i) => {
                dot.addEventListener('click', () => {
                    const items = vizTrack.querySelectorAll('.viz-item');
                    if (items[i]) {
                        vizTrack.scrollTo({ left: items[i].offsetLeft, behavior: 'smooth' });
                    }
                });
            });
        }
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
                
                // Remove stagger delay entirely on mobile so scrolling feels fast
                const isMobile = window.innerWidth < 640;
                const delay = (prefersReduced || isMobile) ? 0 : Math.min(idx * 60, 360);
                
                card.style.transitionDelay = delay + 'ms';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
                card.dataset.revealed = 'true';
                cardObserver.unobserve(card);
            }
        });
    }, { threshold: 0.04, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.project-card, .lab-card, .insight-card, .viz-item, .service-card').forEach(card => {
        if (prefersReduced) return; // respect user OS setting
        card.style.opacity   = '0';
        card.style.transform = 'translateY(18px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        cardObserver.observe(card);
    });
});

// ── 18. P5.JS INTERACTIVE DATA CONSTELLATION ─────────────────────────
// This sketch runs in instance mode to prevent global variable pollution
const sketch = (p) => {
    let particles = [];
    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 35 : 80; // Scale density for mobile performance
    const interactionRadius = isMobile ? 80 : 120; // Smaller touch radius
    const connectionRadius = isMobile ? 80 : 100;  // Closer connections to save rendering

    let canvasWidth = window.innerWidth;

    p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('p5-hero-canvas');
        
        // Initialize data points
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    };

    p.draw = () => {
        p.clear(); // Transparent background to let CSS gradient show
        
        // Update and display particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].reactToInteraction();
            particles[i].display();
            
            // Check connections with other particles
            for (let j = i + 1; j < particles.length; j++) {
                let d = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                if (d < connectionRadius) {
                    // Map distance to line opacity
                    let alpha = p.map(d, 0, connectionRadius, 100, 0);
                    p.stroke(26, 68, 128, alpha); // var(--accent) in RGB
                    p.strokeWeight(1);
                    p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                }
            }
        }
    };

    p.windowResized = () => {
        // Prevent constant resizing on mobile when URL bar hides/shows
        if (p.windowWidth !== canvasWidth) {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            canvasWidth = p.windowWidth;
        }
    };

    // Particle Class
    class Particle {
        constructor() {
            this.x = p.random(p.width);
            this.y = p.random(p.height);
            this.vx = p.random(-0.5, 0.5);
            this.vy = p.random(-0.5, 0.5);
            this.baseRadius = p.random(2, 4);
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Soft boundaries
            if (this.x < -50) this.x = p.width + 50;
            if (this.x > p.width + 50) this.x = -50;
            if (this.y < -50) this.y = p.height + 50;
            if (this.y > p.height + 50) this.y = -50;
        }

        reactToInteraction() {
            // Handle both Mouse and Touch inputs
            let inputX = p.touches.length > 0 ? p.touches[0].x : p.mouseX;
            let inputY = p.touches.length > 0 ? p.touches[0].y : p.mouseY;

            let d = p.dist(this.x, this.y, inputX, inputY);
            if (d < interactionRadius && inputX > 0 && inputX < p.width && inputY > 0 && inputY < p.height) {
                let force = p.map(d, 0, interactionRadius, 3, 0);
                let angle = p.atan2(this.y - inputY, this.x - inputX);
                this.x += p.cos(angle) * force;
                this.y += p.sin(angle) * force;
            }
        }

        display() {
            p.noStroke();
            p.fill(59, 130, 246, 150); // Accent blue with slight transparency
            p.circle(this.x, this.y, this.baseRadius * 2);
        }
    }
};

// Initialize the P5 instance only if the container exists
if (document.getElementById('p5-hero-canvas')) {
    new p5(sketch);
}
