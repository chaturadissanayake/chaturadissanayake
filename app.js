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
        setTimeout(removeLoadingState, 400);
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
                document.body.style.overflow = '';
                mobileToggle.focus();
            })
        );
        // Safety valve: if the user somehow scrolls while menu is open (e.g. two-finger
        // scroll on some Android versions), close the menu so the page isn't locked
        let menuScrollTimer;
        window.addEventListener('scroll', () => {
            if (!mobileMenu.classList.contains('is-active')) return;
            clearTimeout(menuScrollTimer);
            menuScrollTimer = setTimeout(() => {
                mobileMenu.classList.remove('is-active');
                mobileToggle.classList.remove('is-active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('modal-open');
            }, 80);
        }, { passive: true });
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

    // ── 9. VIEW TOGGLE (Removed per UX Hick's Law) ───────────────────────
    // (Feature removed)

    // ── 12B. FETCH JSON, BUILD CARDS & DYNAMIC FILTERS ────────────────────
    const projWrap = document.getElementById('projects-container');
    const noProjMsg = document.getElementById('no-projects-msg');
    const filterGroup = document.getElementById('dynamic-filter-group');
    let currentFilter = 'all';
    let allProjCards = [];

    const applyProjectFilter = () => {
        let count = 0;
        allProjCards.forEach(card => {
            const cat = card.getAttribute('data-category') || '';
            // Exact match based on the JSON category
            const matches = currentFilter === 'all' || cat === currentFilter;
            
            if (matches) {
                card.style.display = '';
                count++;
            } else {
                card.style.display = 'none';
            }
        });
        if (noProjMsg) noProjMsg.style.display = count === 0 ? 'block' : 'none';
    };

    const initProjects = async () => {
        if (!projWrap) return;
        try {
            const res = await fetch('data/projects.json');
            const projects = await res.json();
            
            projWrap.innerHTML = ''; 
            const categories = new Set(); // To collect unique categories
            
            projects.forEach(proj => {
                if (proj.category) categories.add(proj.category);
                
                const tagsHTML = proj.tags.map(tag => `<span>${tag}</span>`).join('');
                const descSnippet = proj.challenge.length > 120 
                    ? proj.challenge.substring(0, 120) + '...' 
                    : proj.challenge;

                const cardHTML = `
                    <article class="project-card project-trigger" 
                        data-category="${proj.category}"
                        data-title="${proj.title}"
                        data-challenge="${proj.challenge}"
                        data-role="${proj.role}"
                        data-outcome="${proj.outcome}"
                        data-link="${proj.link}" 
                        data-status="${proj.status}" 
                        data-tags="${proj.tags.join(',')}">
                        <div class="card-inner">
                            <div class="card-image">
                                <img src="${proj.thumbnail}" alt="${proj.title}" loading="lazy">
                                <div class="card-overlay">
                                    <span class="card-open-label">View Case Study <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i></span>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="card-meta">
                                    <span class="card-cat">${proj.tags[0]}</span>
                                    <span class="card-date">${proj.date}</span>
                                </div>
                                <div class="card-title-wrap">
                                    <h3 class="card-title">${proj.title}</h3>
                                    <p class="card-desc">${descSnippet}</p>
                                </div>
                                <div class="card-tags">${tagsHTML}</div>
                            </div>
                        </div>
                    </article>
                `;
                projWrap.insertAdjacentHTML('beforeend', cardHTML);
            });

            allProjCards = document.querySelectorAll('.project-card.project-trigger');
            
            // Build Dynamic Filters
            if (filterGroup) {
                let filterHTML = `<button type="button" class="filter-pill active" data-filter="all">All Work</button>`;
                categories.forEach(cat => {
                    filterHTML += `<button type="button" class="filter-pill" data-filter="${cat}">${cat}</button>`;
                });
                filterGroup.innerHTML = filterHTML;

                const filterBtns = document.querySelectorAll('.filter-pill');
                filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        filterBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        currentFilter = btn.getAttribute('data-filter');
                        applyProjectFilter();
                    });
                });
            }

            lucide.createIcons({ root: projWrap });

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
            
            applyProjectFilter();

        } catch (error) {
            console.error('Failed to load projects:', error);
            if (noProjMsg) {
                noProjMsg.textContent = 'Unable to load projects at this time.';
                noProjMsg.style.display = 'block';
            }
        }
    };
    
    initProjects();

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
    let lastFocusedElement = null;

    const focusableSelectors = 'a, button, [tabindex]:not([tabindex="-1"])';
    const trapFocus = e => {
        if (!projectModal.classList.contains('active')) return;
        const focusable = [...projectModal.querySelectorAll(focusableSelectors)];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };

    const openModal = card => {
        lastFocusedElement = document.activeElement;
        const titleText = card.getAttribute('data-title') || card.querySelector('h3')?.textContent || 'Project';
        document.getElementById('pm-title').textContent = titleText;
        document.getElementById('pm-challenge').textContent = card.getAttribute('data-challenge')  || '—';
        document.getElementById('pm-role').textContent      = card.getAttribute('data-role')      || '—';
        document.getElementById('pm-outcome').textContent   = card.getAttribute('data-outcome')   || '—';

        history.pushState(null, '', '#' + titleText.toLowerCase().replace(/\s+/g, '-'));

        const link   = document.getElementById('pm-link');
        const href   = card.getAttribute('data-link');
        const status = card.getAttribute('data-status') || 'View Project';

        link.innerHTML = `${status} <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i>`;
        lucide.createIcons({ nameAttr: 'data-lucide', root: link });

        if (status === 'Report in Final Review' || status === 'Active Development') {
            link.textContent = status;
            link.removeAttribute('href');
            link.style.opacity = '0.45';
            link.style.pointerEvents = 'none';
            link.style.display = 'inline-flex';
        } else if (href && href !== '#') {
            link.href = href;
            link.target = href.startsWith('http') ? '_blank' : '_self';
            link.style.display = 'inline-flex';
            link.style.opacity = '1';
            link.style.pointerEvents = 'auto';
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
        projectModal.addEventListener('keydown', trapFocus);
        requestAnimationFrame(() => {
            const panel = projectModal.querySelector('.modal-panel');
            if (panel) panel.scrollTop = 0;
        });
    };

    const closeModal = () => {
        projectModal?.classList.remove('active');
        document.body.classList.remove('modal-open');
        projectModal.removeEventListener('keydown', trapFocus);
        history.pushState(null, '', '#projects');
        if (lastFocusedElement) lastFocusedElement.focus();
    };

    closeProjectBtn?.addEventListener('click', closeModal);
    projectModal?.addEventListener('click', e => {
        if (e.target === projectModal) closeModal();
    });
    document.querySelector('.modal-panel')?.addEventListener('click', e => {
        e.stopPropagation();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && projectModal?.classList.contains('active')) closeModal();
    });

    // ── 13. VISUALISATIONS CAROUSEL ───────────────────────────────────────
    const vizTrack = document.querySelector('.viz-carousel-track');
    if (vizTrack) {
        const vizCount = document.querySelectorAll('.viz-item').length;
        const vizCountEl = document.querySelector('.viz-count');
        if (vizCountEl && vizCount > 0) vizCountEl.textContent = vizCount;

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

        // ── 13B. CAROUSEL COUNTER ─────────────────────────────────────────
        const vizCounter = document.getElementById('viz-counter');
        if (vizCounter) {
            const syncCounter = () => {
                const items = vizTrack.querySelectorAll('.viz-item');
                if (!items.length) return;
                const itemW = items[0].offsetWidth + 20;
                const activeIdx = Math.min(
                    Math.round(vizTrack.scrollLeft / itemW),
                    items.length - 1
                );
                vizCounter.textContent = `${activeIdx + 1} / ${items.length}`;
            };
            vizTrack.addEventListener('scroll', syncCounter, { passive: true });
            syncCounter();
        }
    }

    // ── LIGHTBOX ──────────────────────────────────────────────────────────
    const lightboxModal  = document.getElementById('lightbox-modal');
    const lightboxImg    = document.getElementById('lightbox-image');
    const lightboxClose  = lightboxModal?.querySelector('.lightbox-close');
    const lightboxPrev   = document.getElementById('lightbox-prev');
    const lightboxNext   = document.getElementById('lightbox-next');
    const vizTriggers    = Array.from(document.querySelectorAll('.viz-lightbox-trigger'));
    let lightboxIdx      = 0;

    const openLightboxAt = (idx) => {
        if (!lightboxModal || !vizTriggers[idx]) return;
        if (lightboxModal.style.display !== 'flex') lastFocusedElement = document.activeElement;
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
        if (lastFocusedElement) lastFocusedElement.focus();
    };

    vizTriggers.forEach((item, idx) => {
        item.addEventListener('click', () => openLightboxAt(idx));
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', (e) => { e.stopPropagation(); openLightboxAt((lightboxIdx - 1 + vizTriggers.length) % vizTriggers.length); });
    lightboxNext?.addEventListener('click', (e) => { e.stopPropagation(); openLightboxAt((lightboxIdx + 1) % vizTriggers.length); });
    
    lightboxModal?.addEventListener('click', e => {
        if (e.target === lightboxModal) closeLightbox();
    });

    document.addEventListener('keydown', e => {
        if (!lightboxModal || lightboxModal.style.display !== 'flex') return;
        if (e.key === 'Escape')     { closeLightbox(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); openLightboxAt((lightboxIdx + 1) % vizTriggers.length); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); openLightboxAt((lightboxIdx - 1 + vizTriggers.length) % vizTriggers.length); }
    // ── HERO WORD CYCLE ───────────────────────────────────────────────────
    const heroCycleWord = document.getElementById('hero-cycle-word');
    if (heroCycleWord) {
        const heroWords = ['understood', 'designed', 'visualised', 'readable', 'navigated', 'decoded'];
        let heroWordIdx = 0;
        const cycleHeroWord = () => {
            heroCycleWord.classList.add('hero-word-exit');
            setTimeout(() => {
                heroWordIdx = (heroWordIdx + 1) % heroWords.length;
                heroCycleWord.textContent = heroWords[heroWordIdx];
                heroCycleWord.classList.remove('hero-word-exit');
                heroCycleWord.classList.add('hero-word-enter');
                setTimeout(() => heroCycleWord.classList.remove('hero-word-enter'), 500);
            }, 320);
        };
        setInterval(cycleHeroWord, 2800);
    }

<<<<<<< Updated upstream
});

// ── 18. P5.JS THE MULTILINGUAL SEMANTIC LENS ──────────────────────────
// A Pentagram-level generative typographic piece.
// Spring physics snap chaotic multilingual noise into structured personal data.
// Easter egg: hover to uncover Chatura Dissanayake's story in three scripts.

const sketch = (p) => {
    let cells = [];
    let cols, rows, scl;
    let canvasWidth = window.innerWidth;
    let time = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Physics — high-tension springs for tactile "snap and settle"
    const STIFFNESS = 0.25;
    const DAMPING   = 0.70;

    // ── Ambient noise character pools (all three scripts) ─────────────
const sinhala = ['අ','ආ','ඇ','ඈ','ඉ','ඊ','උ','ඌ','එ','ඒ','ඔ','ඕ','ක','ග','ච','ජ','ට','ඩ','ත','ද','න','ප','බ','ම','ය','ර','ල','ව','ස','හ','ළ','ෆ'];
const tamil   = ['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','க','ச','ஞ','ட','ண','த','ந','ப','ம','ய','ர','ல','வ','ழ','ள','ற','ன'];
    const latin   = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1'];
    const allChars = [].concat(sinhala, tamil, latin);

    // ── Easter egg vocabulary ─────────────────────────────────────────
    // Rows cycle EN → SI → TA. Hovering the lens peels back the noise
    // to reveal structured personal data about Chatura in three languages.
    //
    //  lang:'en'  →  professional pillars       (Policy Blue   #1A4480)
    //  lang:'si'  →  Sinhala personal data      (Warm Amber    #BE8214)
    //  lang:'ta'  →  Tamil personal data        (Deep Crimson  #A0284A)
    //
const vocabRows = [
    { text: "C L A R I T Y          ", lang:'en', rR:26,  rG:68,  rB:128 },
    { text: "ච  ත  ර               ", lang:'si', rR:190, rG:130, rB:20  },
    { text: "ச  த  ர               ", lang:'ta', rR:160, rG:40,  rB:74  },
    { text: "N A R R A T I V E      ", lang:'en', rR:26,  rG:68,  rB:128 },
    { text: "ල  ක                   ", lang:'si', rR:190, rG:130, rB:20  },
    { text: "இ  ல  க               ", lang:'ta', rR:160, rG:40,  rB:74  },
    { text: "E V I D E N C E        ", lang:'en', rR:26,  rG:68,  rB:128 },
    { text: "ද  ත                   ", lang:'si', rR:190, rG:130, rB:20  },
    { text: "த  ர  வ               ", lang:'ta', rR:160, rG:40,  rB:74  },
    { text: "S Y S T E M S          ", lang:'en', rR:26,  rG:68,  rB:128 },
    { text: "ස  ත  ය               ", lang:'si', rR:190, rG:130, rB:20  },
    { text: "உ  ண  ம               ", lang:'ta', rR:160, rG:40,  rB:74  },
    { text: "I M P A C T            ", lang:'en', rR:26,  rG:68,  rB:128 },
    { text: "ක  ථ                   ", lang:'si', rR:190, rG:130, rB:20  },
    { text: "க  த                   ", lang:'ta', rR:160, rG:40,  rB:74  },
    { text: "S T R U C T U R E      ", lang:'en', rR:26,  rG:68,  rB:128 },
    { text: "ප  හ  ද  ල            ", lang:'si', rR:190, rG:130, rB:20  },
    { text: "த  ள  வ               ", lang:'ta', rR:160, rG:40,  rB:74  },
];

    // Discovery hint — fades to 0 the moment non-English text is first revealed
    let hintOpacity = 40;
    let hasDiscoveredMultilingual = false;

    p.setup = () => {
        let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
        canvas.parent('p5-hero-canvas');
        p.textAlign(p.CENTER, p.CENTER);
        // system-ui ensures correct Sinhala + Tamil glyph rendering
        p.textFont("'Noto Sans Sinhala', 'Noto Sans Tamil', 'Inter', system-ui, sans-serif");
        initGrid();
    };

    function initGrid() {
        cells = [];
        scl = p.windowWidth < 768 ? 26 : 34;
        cols = p.floor(p.width / scl) + 2;
        rows = p.floor(p.height / scl) + 2;

        for (let y = 0; y < rows; y++) {
            let row = vocabRows[y % vocabRows.length];
            for (let x = 0; x < cols; x++) {
                let trueChar = row.text.charAt(x % row.text.length);
                cells.push({
                    baseX: x * scl,   baseY: y * scl,
                    trueChar,
                    lang: row.lang,
                    rR: row.rR, rG: row.rG, rB: row.rB,
                    randomOffset: p.random(1000),
                    curX: x * scl,    curY: y * scl,
                    vx: 0, vy: 0,
                    curSize: 4,       vSize: 0,
                    curAlpha: 0,
                    r: 120, g: 130,   b: 140
                });
            }
        }
    }

    p.draw = () => {
        p.clear();

        let isTouch    = p.touches.length > 0;
        let mX         = isTouch ? p.touches[0].x : p.mouseX;
        let mY         = isTouch ? p.touches[0].y : p.mouseY;
        let interacting = isTouch || (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height);
        let radius      = p.windowWidth < 768 ? 130 : 220;

        for (let i = 0; i < cells.length; i++) {
            let c = cells[i];

            // ── A. Ambient: chaotic multilingual noise ────────────────
            let noiseVal = p.noise(c.baseX * 0.004 + time, c.baseY * 0.004);
            let driftX   = reducedMotion ? 0 : p.map(noiseVal, 0, 1, -scl * 1.5, scl * 1.5);
            let driftY   = reducedMotion ? 0 : p.map(p.noise(c.baseX * 0.004, c.baseY * 0.004 + time), 0, 1, -scl * 1.5, scl * 1.5);

            let targetX     = c.baseX + driftX;
            let targetY     = c.baseY + driftY;
            let targetSize  = scl * 0.35;
            let targetAlpha = 25;
            let displayChar = allChars[p.floor(p.noise(c.randomOffset + time * 2) * allChars.length)];
            let cR = 140, cG = 150, cB = 160;

            // ── B. Lens: reveal structured personal data ──────────────
            if (interacting) {
                let d = p.dist(c.baseX, c.baseY, mX, mY);
                if (d < radius) {
                    let intensity = p.pow(p.map(d, 0, radius, 1, 0), 1.5);

                    targetX = p.lerp(targetX, c.baseX, intensity);
                    targetY = p.lerp(targetY, c.baseY, intensity);

                    if (c.trueChar !== ' ') {
                        displayChar  = c.trueChar;
                        targetSize   = p.lerp(targetSize, scl * 0.75, intensity);
                        targetAlpha  = p.lerp(targetAlpha, 255, intensity);

                        // Language-aware reveal colour
                        cR = p.lerp(cR, c.rR, intensity);
                        cG = p.lerp(cG, c.rG, intensity);
                        cB = p.lerp(cB, c.rB, intensity);

                        // Trigger hint fade the first time a non-English row is uncovered
                        if (c.lang !== 'en' && !hasDiscoveredMultilingual && intensity > 0.5) {
                            hasDiscoveredMultilingual = true;
                        }
                    } else {
                        // Spaces carve clean negative space around the revealed word
                        targetSize  = p.lerp(targetSize, 0, intensity);
                        targetAlpha = p.lerp(targetAlpha, 0, intensity);
                    }
                }
            }

            // ── C. Spring physics ─────────────────────────────────────
            let forceX = (targetX - c.curX) * STIFFNESS;
            c.vx += forceX; c.vx *= DAMPING; c.curX += c.vx;

            let forceY = (targetY - c.curY) * STIFFNESS;
            c.vy += forceY; c.vy *= DAMPING; c.curY += c.vy;

            let forceSize = (targetSize - c.curSize) * STIFFNESS;
            c.vSize += forceSize; c.vSize *= DAMPING; c.curSize += c.vSize;

            // Colour + alpha lerp (smooth enough without springs)
            c.curAlpha = p.lerp(c.curAlpha, targetAlpha, 0.2);
            c.r = p.lerp(c.r, cR, 0.2);
            c.g = p.lerp(c.g, cG, 0.2);
            c.b = p.lerp(c.b, cB, 0.2);

            // ── D. Render ─────────────────────────────────────────────
            if (c.curSize > 0.5 && c.curAlpha > 1) {
                p.fill(c.r, c.g, c.b, c.curAlpha);
                p.textSize(Math.max(0.1, c.curSize));
                p.text(displayChar, c.curX, c.curY);
            }
        }

        // ── E. Discovery hint (ස · த · A) ────────────────────────────
        // Quietly invites exploration; disappears once multilingual text is found.
        if (hintOpacity > 0.5) {
            if (hasDiscoveredMultilingual) {
                hintOpacity = p.lerp(hintOpacity, 0, 0.04);
            }
            p.push();
            p.textSize(10);
            p.textAlign(p.RIGHT, p.BOTTOM);
            p.fill(120, 130, 140, hintOpacity);
            p.noStroke();
            p.text('ස · த · A — Hover to explore', p.width - 18, p.height - 18);
            p.pop();
        }

        time += reducedMotion ? 0 : 0.003;
    };

    p.windowResized = () => {
        if (p.abs(p.windowWidth - canvasWidth) > 50) {
            p.resizeCanvas(p.windowWidth, p.windowHeight);
            canvasWidth = p.windowWidth;
            initGrid();
        }
    };
};

if (document.getElementById('p5-hero-canvas')) {
    new p5(sketch);
}
=======
>>>>>>> Stashed changes
});