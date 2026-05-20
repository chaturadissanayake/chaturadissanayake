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

    // ── 10. DYNAMIC PROJECTS & FILTERING ──────────────────────────────────
    const filterBtns   = document.querySelectorAll('.filter-pill');
    const projWrap     = document.getElementById('projects-container');
    const noProjMsg    = document.getElementById('no-projects-msg');
    let currentFilter  = 'all';
    let allProjCards   = []; // Populated after fetch

    const applyProjectFilter = () => {
        let count = 0;
        allProjCards.forEach(card => {
            const cat     = card.getAttribute('data-category') || '';
            const matches = currentFilter === 'all' || cat.split(' ').includes(currentFilter);
            if (matches) {
                card.style.display = '';
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

    // ── 12B. FETCH JSON AND BUILD CARDS ───────────────────────────────────
    const initProjects = async () => {
        if (!projWrap) return;
        try {
            const res = await fetch('data/projects.json');
            const projects = await res.json();
            
            projWrap.innerHTML = ''; 
            
            projects.forEach(proj => {
                const tagsHTML = proj.tags.map(tag => `<span>${tag}</span>`).join('');
                
                // Truncate the challenge description for the card preview
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

            // Update variables now that the DOM has cards
            allProjCards = document.querySelectorAll('.project-card.project-trigger');
            lucide.createIcons({ root: projWrap }); // Render the arrows

            // Attach the click event that opens the modal
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
            
            // Run initial filter so cards display correctly
            applyProjectFilter();

        } catch (error) {
            console.error('Failed to load projects:', error);
            if (noProjMsg) {
                noProjMsg.textContent = 'Unable to load projects at this time.';
                noProjMsg.style.display = 'block';
            }
        }
    };
    
    initProjects(); // Start the process

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
    });

    // ── HERO ALTERNATING SLOT CYCLE (CSS Grid Version) ────────────────────
    const cyclers = document.querySelectorAll('.hero-cycler');
    if (cyclers.length === 2) {
        const slot1Words = cyclers[0].querySelectorAll('.hero-emp-1');
        const slot2Words = cyclers[1].querySelectorAll('.hero-emp-2');
        
        let s1Idx = 0;
        let s2Idx = 0;
        let toggleSlot = true;
        
        const cycleSlots = () => {
            if (toggleSlot) {
                const current = slot1Words[s1Idx];
                s1Idx = (s1Idx + 1) % slot1Words.length;
                const next = slot1Words[s1Idx];
                
                current.classList.remove('active');
                current.classList.add('exit');
                next.classList.remove('exit');
                next.classList.add('active');
            } else {
                const current = slot2Words[s2Idx];
                s2Idx = (s2Idx + 1) % slot2Words.length;
                const next = slot2Words[s2Idx];
                
                current.classList.remove('active');
                current.classList.add('exit');
                next.classList.remove('exit');
                next.classList.add('active');
            }
            toggleSlot = !toggleSlot;
        };
        
        setInterval(cycleSlots, 2500);
    }

});

// ── 18. VANILLA TYPOGRAPHIC SEMANTIC ENGINE ──────────────────────────
// High-performance vanilla HTML5 Canvas implementation replacing p5.js overhead.
// Manages precise spatial interactions, cross-device touch/mouse telemetry,
// high-DPI pixel buffers, and localized multilingual typography systems.

const initHeroCanvas = () => {
    const container = document.getElementById('p5-hero-canvas');
    if (!container) return;

    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d', { alpha: true });

    let cells = [];
    let cols = 0, rows = 0, scl = 34;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let time = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const STIFFNESS = 0.25;
    const DAMPING = 0.70;

    let mX = -1000, mY = -1000;
    let isInteracting = false;
    let hintOpacity = 40;
    let hasDiscoveredMultilingual = false;

    const sinhala = ['අ','ආ','ඇ','ඈ','ඉ','ඊ','උ','ඌ','එ','ඒ','ඔ','ඕ','ක','ග','ච','ජ','ට','ඩ','ත','ද','න','ප','බ','ම','ය','ර','ල','ව','ස','හ','ළ','ෆ'];
    const tamil = ['அ','ஆ','இ','ஈ','உ','ஊ','எ','ஏ','ஐ','ஒ','ஓ','க','ச','ஞ','ட','ண','த','ந','ப','ம','ய','ர','ல','வ','ழ','ள','ற','ன'];
    const latin = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1'];
    const allChars = sinhala.concat(tamil, latin);

    const vocabRows = [
        { text: "C L A R I T Y   C L A R I T Y   C L A R I T Y   ", lang: 'en', rR: 56, rG: 189, rB: 248 },
        { text: "ච ත ර   ච ත ර   ච ත ර   ච ත ර   ච ත ර   ච ත ර   ", lang: 'si', rR: 244, rG: 114, rB: 182 },
        { text: "ச த ர   ச த ர   ச த ர   ச த ர   ச த ர   ச த ர   ", lang: 'ta', rR: 245, rG: 158, rB: 11 },
        { text: "N A R R A T I V E   N A R R A T I V E           ", lang: 'en', rR: 56, rG: 189, rB: 248 },
        { text: "ල ක   ල ක   ල ක   ල ක   ල ක   ල ක   ල ක   ල ක   ", lang: 'si', rR: 244, rG: 114, rB: 182 },
        { text: "இ ล க   இ ล க   இ ล க   இ ล க   இ ล க   இ ล க   ", lang: 'ta', rR: 245, rG: 158, rB: 11 },
        { text: "E V I D E N C E   E V I D E N C E               ", lang: 'en', rR: 56, rG: 189, rB: 248 },
        { text: "ද ත   ද ත   ද ත   ද ත   ද ත   ද ත   ද ත   ද ත   ", lang: 'si', rR: 244, rG: 114, rB: 182 },
        { text: "த ர வ   த ர வ   த ர வ   த ர வ   த ர வ   த ர வ   ", lang: 'ta', rR: 245, rG: 158, rB: 11 },
        { text: "S Y S T E M S   S Y S T E M S   S Y S T E M S   ", lang: 'en', rR: 56, rG: 189, rB: 248 },
        { text: "ස ත ය   ස ත ය   ස ත ය   ස ත ය   ස ත ය   ස ත ය   ", lang: 'si', rR: 244, rG: 114, rB: 182 },
        { text: "உ ண ම   உ ண ම   உ ண ම   உ ண ම   உ ண ම   உ ண ම   ", lang: 'ta', rR: 245, rG: 158, rB: 11 },
        { text: "I M P A C T   I M P A C T   I M P A C T         ", lang: 'en', rR: 56, rG: 189, rB: 248 },
        { text: "ක ථ   ක ථ   ක ථ   ක ථ   ක ථ   ක ථ   ක ථ   ක ථ   ", lang: 'si', rR: 244, rG: 114, rB: 182 },
        { text: "க த   க த   க த   க த   க த   க த   க த   க த   ", lang: 'ta', rR: 245, rG: 158, rB: 11 },
        { text: "S T R U C T U R E   S T R U C T U R E           ", lang: 'en', rR: 56, rG: 189, rB: 248 },
        { text: "ප හ ද ල   ප හ ද ල   ප හ ද ල   ප හ ද ල           ", lang: 'si', rR: 244, rG: 114, rB: 182 },
        { text: "த ள வ   த ள வ   த ள வ   த ள வ   த ள வ   த ள வ   ", lang: 'ta', rR: 245, rG: 158, rB: 11 }
    ];

    const initGrid = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        scl = width < 768 ? 26 : 34;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        cols = Math.floor(width / scl) + 2;
        rows = Math.floor(height / scl) + 2;
        cells = [];

        for (let y = 0; y < rows; y++) {
            const row = vocabRows[y % vocabRows.length];
            for (let x = 0; x < cols; x++) {
                const trueChar = row.text.charAt(x % row.text.length);
                cells.push({
                    baseX: x * scl,
                    baseY: y * scl,
                    trueChar: trueChar,
                    lang: row.lang,
                    rR: row.rR, rG: row.rG, rB: row.rB,
                    randomOffset: Math.random() * 1000,
                    curX: x * scl,
                    curY: y * scl,
                    vx: 0, vy: 0,
                    curSize: 4, vSize: 0,
                    curAlpha: 0,
                    r: 120, g: 130, b: 140
                });
            }
        }
    };

    const updateAndRender = () => {
        ctx.clearRect(0, 0, width, height);
        const radius = width < 768 ? 130 : 220;

        for (let i = 0; i < cells.length; i++) {
            const c = cells[i];

            const nwX = (c.baseX * 0.004) + time;
            const nwY = (c.baseY * 0.004) + time;
            const noiseVal1 = (Math.sin(nwX * 2.0) + Math.cos(nwY * 1.5) + Math.sin(time * 0.5)) / 3.0 + 0.5;
            const noiseVal2 = (Math.cos(nwX * 1.2) + Math.sin(nwY * 2.2) + Math.cos(time * 0.7)) / 3.0 + 0.5;

            const driftX = reducedMotion ? 0 : (noiseVal1 - 0.5) * scl * 3.0;
            const driftY = reducedMotion ? 0 : (noiseVal2 - 0.5) * scl * 3.0;

            let targetX = c.baseX + driftX;
            let targetY = c.baseY + driftY;
            let targetSize = scl * 0.35;
            let targetAlpha = 85;

            const charIdx = Math.floor(((Math.sin(c.randomOffset + time * 2.0) + 1.0) * 0.5) * allChars.length);
            let displayChar = allChars[charIdx % allChars.length];
            let cR = 74, cG = 85, cB = 104;

            if (isInteracting) {
                const dx = c.baseX - mX;
                const dy = c.baseY - mY;
                const d = Math.sqrt(dx * dx + dy * dy);

                if (d < radius) {
                    const intensity = Math.pow(Math.max(0, 1 - (d / radius)), 1.5);

                    targetX = targetX + (c.baseX - targetX) * intensity;
                    targetY = targetY + (c.baseY - targetY) * intensity;

                    if (c.trueChar !== ' ') {
                        displayChar = c.trueChar;
                        targetSize = targetSize + (scl * 0.75 - targetSize) * intensity;
                        targetAlpha = targetAlpha + (255 - targetAlpha) * intensity;

                        cR = cR + (c.rR - cR) * intensity;
                        cG = cG + (c.rG - cG) * intensity;
                        cB = cB + (c.rB - cB) * intensity;

                        if (c.lang !== 'en' && !hasDiscoveredMultilingual && intensity > 0.5) {
                            hasDiscoveredMultilingual = true;
                        }
                    } else {
                        targetSize = targetSize + (0 - targetSize) * intensity;
                        targetAlpha = targetAlpha + (0 - targetAlpha) * intensity;
                    }
                }
            }

            const forceX = (targetX - c.curX) * STIFFNESS;
            c.vx = (c.vx + forceX) * DAMPING;
            c.curX += c.vx;

            const forceY = (targetY - c.curY) * STIFFNESS;
            c.vy = (c.vy + forceY) * DAMPING;
            c.curY += c.vy;

            const forceSize = (targetSize - c.curSize) * STIFFNESS;
            c.vSize = (c.vSize + forceSize) * DAMPING;
            c.curSize += c.vSize;

            c.curAlpha += (targetAlpha - c.curAlpha) * 0.2;
            c.r += (cR - c.r) * 0.2;
            c.g += (cG - c.g) * 0.2;
            c.b += (cB - c.b) * 0.2;

            if (c.curSize > 0.5 && c.curAlpha > 1) {
                ctx.fillStyle = `rgba(${Math.floor(c.r)}, ${Math.floor(c.g)}, ${Math.floor(c.b)}, ${c.curAlpha / 255})`;
                ctx.font = `${Math.max(0.1, c.curSize)}px 'Noto Sans Sinhala', 'Noto Sans Tamil', 'Inter', system-ui, sans-serif`;
                ctx.fillText(displayChar, c.curX, c.curY);
            }
        }

        if (hintOpacity > 0.5) {
            if (hasDiscoveredMultilingual) hintOpacity += (0 - hintOpacity) * 0.04;
            ctx.fillStyle = `rgba(120, 130, 140, ${hintOpacity / 100})`;
            ctx.font = "10px 'Inter', system-ui, sans-serif";
            ctx.textAlign = 'right';
            ctx.fillText('ස · த · A — Hover to explore', width - 18, height - 18);
        }

        time += reducedMotion ? 0 : 0.003;
        requestAnimationFrame(updateAndRender);
    };

    const trackInteraction = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        mX = clientX - rect.left;
        mY = clientY - rect.top;
        isInteracting = true;
    };

    window.addEventListener('mousemove', (e) => trackInteraction(e.clientX, e.clientY), { passive: true });
    window.addEventListener('mouseleave', () => isInteracting = false, { passive: true });
    
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) trackInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) trackInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    
    window.addEventListener('touchend', () => isInteracting = false, { passive: true });

    let resizeDebounce;
    window.addEventListener('resize', () => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
            if (Math.abs(window.innerWidth - width) > 50) initGrid();
        }, 150);
    }, { passive: true });

    initGrid();
    requestAnimationFrame(updateAndRender);
};

initHeroCanvas();