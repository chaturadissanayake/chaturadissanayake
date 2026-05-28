document.addEventListener('DOMContentLoaded', () => {

    const initIcons = (root) => {
        if (window.lucide) {
            lucide.createIcons({ root: root || document });
        }
    };
    initIcons();

    document.addEventListener('contextmenu', e => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    const removeLoadingState = () => {
        document.body.classList.remove('loading');
    };
    if (document.readyState === 'complete') {
        removeLoadingState();
    } else {
        window.addEventListener('load', removeLoadingState);
        setTimeout(removeLoadingState, 400);
    }

    const progressBar = document.getElementById('scroll-progress');
    let isProgressTicking = false;
    const updateProgress = () => {
        const scrollTop  = window.scrollY;
        const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) : 0;
        if (progressBar) progressBar.style.transform = `scaleX(${pct})`;
    };
    window.addEventListener('scroll', () => {
        if (!isProgressTicking) {
            window.requestAnimationFrame(() => {
                updateProgress();
                isProgressTicking = false;
            });
            isProgressTicking = true;
        }
    }, { passive: true });

    const header = document.getElementById('main-header');
    const floatBtt = document.getElementById('floating-back-to-top');
    const headerForceScrolled = header?.classList.contains('scrolled') ?? false;
    
    window.addEventListener('scroll', () => {
        if (header) header.classList.toggle('scrolled', window.scrollY > 40 || headerForceScrolled);
        
        if (floatBtt) {
            if (window.scrollY > 400) {
                floatBtt.classList.add('is-visible');
                floatBtt.removeAttribute('tabindex');
            } else {
                floatBtt.classList.remove('is-visible');
                floatBtt.setAttribute('tabindex', '-1');
            }
        }
    }, { passive: true });

    floatBtt?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const sections  = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('.nav-link[data-section]');

    let isNavTicking = false;
    const activateNav = () => {
        let current = '';
        const scrollPos = window.scrollY;
        sections.forEach(s => {
            if (scrollPos >= s.offsetTop - 120) current = s.id;
        });
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-section') === current);
        });
    };
    window.addEventListener('scroll', () => {
        if (!isNavTicking) {
            window.requestAnimationFrame(() => {
                activateNav();
                isNavTicking = false;
            });
            isNavTicking = true;
        }
    }, { passive: true });
    activateNav();

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
            l.addEventListener('click', (e) => {
                mobileMenu.classList.remove('is-active');
                mobileToggle.classList.remove('is-active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                
                const href = l.getAttribute('href');
                if (href && href.includes('#')) {
                    const targetId = href.substring(href.indexOf('#') + 1);
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        e.preventDefault();

                        setTimeout(() => {
                            targetEl.scrollIntoView({ behavior: 'smooth' });
                            history.pushState(null, '', href);
                        }, 50);
                    }
                }
            })
        );

    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && mobileMenu?.classList.contains('is-active')) {
            toggleMobileMenu();
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

    const projWrap = document.getElementById('projects-container');
    const noProjMsg = document.getElementById('no-projects-msg');
    const filterGroup = document.getElementById('dynamic-filter-group');
    let currentFilter = 'all';
    let allProjCards = [];

    const applyProjectFilter = () => {
        let count = 0;
        let visibleCount = 0;
        const isMobile = window.innerWidth <= 640;
        const expandBtn = document.getElementById('expand-projects-btn');
        const isExpanded = expandBtn ? expandBtn.classList.contains('expanded') : false;

        const maxCards = isMobile ? 3 : 6;

        allProjCards.forEach(card => {
            const cat = card.getAttribute('data-category') || '';
            const matches = currentFilter === 'all' || cat === currentFilter;
            
            card.classList.remove('mobile-hidden');
            card.classList.remove('capped-hidden');

            if (matches) {
                count++;
                if (!isExpanded && currentFilter === 'all' && count > maxCards) {
                    card.classList.add('capped-hidden');
                } else {
                    card.style.display = '';
                    visibleCount++;
                }
            } else {
                card.style.display = 'none';
            }
        });
        if (noProjMsg) noProjMsg.style.display = count === 0 ? 'block' : 'none';
        
        if (expandBtn) {
            if (currentFilter === 'all' && count > maxCards) {
                expandBtn.style.display = isExpanded ? 'none' : 'inline-flex';
            } else {
                expandBtn.style.display = 'none';
            }
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
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch('/data/projects.json', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const projects = await res.json();

            projects.sort((a, b) => {
                const aIsOngoing = !a.link || a.link === '#';
                const bIsOngoing = !b.link || b.link === '#';

                if (aIsOngoing && !bIsOngoing) return 1;
                if (!aIsOngoing && bIsOngoing) return -1;

                const dateA = new Date(a.date);
                const dateB = new Date(b.date);

                if (!isNaN(dateA) && !isNaN(dateB)) {
                    return dateB - dateA;
                }

                return 0; 
            });

            projWrap.innerHTML = ''; 
            const categories = new Set();
            
            projects.forEach(proj => {
                if (proj.category) categories.add(proj.category);
                
                const safeTags = proj.tags || [];
                const tagsHTML = safeTags.map(tag => `<span>${tag}</span>`).join('');
                
                const safeChallenge = proj.challenge || '';
                const descSnippet = safeChallenge.length > 120 
                    ? safeChallenge.substring(0, 120) + '...' 
                    : safeChallenge;

                const cardHTML = `
                    <article class="project-card project-trigger" 
                        data-category="${proj.category}"
                        data-title="${proj.title}"
                        data-challenge="${proj.challenge}"
                        data-role="${proj.role}"
                        data-outcome="${proj.outcome}"
                        data-link="${proj.link}" 
                        data-status="${proj.status}" 
                        data-tags="${safeTags.join(',')}">
                        <div class="card-inner">
                            <div class="card-image">
                                <img src="${proj.thumbnail}" alt="${proj.title}" width="800" height="600">
                                <div class="card-overlay">
                                    <span class="card-open-label">View Case Study <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i></span>
                                </div>
                            </div>
                            <div class="card-body">
                                <div class="card-meta">
                                    <span class="card-cat">${safeTags[0] || ''}</span>
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
                    img.addEventListener('error', handleLoad);
                }
            });

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

            initIcons(projWrap);

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
            console.error('Failed to load projects:', error);
            
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            projWrap.innerHTML = '';
            
            if (noProjMsg) {
                noProjMsg.innerHTML = `
                    <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: var(--space-12);">
                        <p style="color: var(--ink-muted); font-size: 0.9375rem; line-height: 1.7;">Couldn't load projects.<br>Check your connection and try again.</p>
                        <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 8px;">Retry <i data-lucide="refresh-cw" aria-hidden="true"></i></button>
                    </div>
                `;
                noProjMsg.style.display = 'block';
                if (window.lucide) {
                    lucide.createIcons({ root: noProjMsg });
                }
            }
        }
    };
    
    initProjects();

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
                    contactForm.innerHTML = '<div class="form-status success" style="font-size: 1.125rem; font-weight: 500; text-align: center; padding: 2rem; color: var(--ink);">Message sent. I\'ll be in touch soon.</div>';
                } else {
                    throw new Error('server');
                }
            } catch {
                formStatus.textContent = 'Message not sent — something went wrong. Try again or email directly at consultchatura@gmail.com';
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

        history.pushState({ modalOpen: true }, '', window.location.pathname + window.location.search);

        const link   = document.getElementById('pm-link');
        const href   = card.getAttribute('data-link');
        const status = card.getAttribute('data-status') || 'View Project';

        link.innerHTML = `${status} <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i>`;
        
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide', root: link });
        }

        if (href && href !== '#') {

            link.href = href;
            link.target = href.startsWith('http') ? '_blank' : '_self';
            link.style.display = 'inline-flex';
            link.style.opacity = '1';
            link.style.pointerEvents = 'auto';
        } else if (status && status !== 'View Project') {

            link.textContent = status;
            link.removeAttribute('href');
            link.style.opacity = '0.45';
            link.style.pointerEvents = 'none';
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
        projectModal.addEventListener('keydown', trapFocus);
        requestAnimationFrame(() => {
            const panel = projectModal.querySelector('.modal-panel');
            if (panel) panel.scrollTop = 0;
        });
    };

    const closeModal = (isPopState = false) => {
        projectModal?.classList.remove('active');
        document.body.classList.remove('modal-open');
        projectModal.removeEventListener('keydown', trapFocus);

        if (isPopState !== true && history.state && history.state.modalOpen) {
            history.back();
        }
        
        if (lastFocusedElement) lastFocusedElement.focus();
    };

    closeProjectBtn?.addEventListener('click', () => closeModal(false));
    projectModal?.addEventListener('mousedown', e => {
        if (e.target === projectModal) closeModal(false);
    });
    document.querySelector('.modal-panel')?.addEventListener('mousedown', e => {
        e.stopPropagation();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && projectModal?.classList.contains('active')) closeModal(false);
    });

    window.addEventListener('popstate', () => {
        if (projectModal?.classList.contains('active')) {
            closeModal(true);
        }
    });

    const vizTrack = document.querySelector('.viz-carousel-track');
    if (vizTrack) {
        const vizCount = document.querySelectorAll('.viz-item').length;
        const vizCountEl = document.querySelector('.viz-count');
        if (vizCountEl && vizCount > 0) vizCountEl.textContent = vizCount;

        const scrollAmt = () => {
            const item = vizTrack.querySelector('.viz-item');
            if (!item) return Math.min(420, window.innerWidth * 0.72);
            const itemW = item.offsetWidth + 20;
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

        vizTrack.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') vizTrack.scrollBy({ left: scrollAmt(), behavior: 'smooth' });
            if (e.key === 'ArrowLeft')  vizTrack.scrollBy({ left: -scrollAmt(), behavior: 'smooth' });
        });

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

    const cyclers = document.querySelectorAll('.hero-cycler');
    if (cyclers.length > 0) {
        let activeIdx1 = 0;
        const emp1 = cyclers[0].querySelectorAll('.hero-emp-1');

        if (emp1.length > 0) {
            emp1[0].classList.add('active');
        }

        const cycleWords = () => {
            if (emp1.length > 0) {
                emp1[activeIdx1].classList.remove('active');
                emp1[activeIdx1].classList.add('exit');
                const prev1 = activeIdx1;
                setTimeout(() => emp1[prev1].classList.remove('exit'), 400);
                
                activeIdx1 = (activeIdx1 + 1) % emp1.length;
                emp1[activeIdx1].classList.add('active');
            }
        };

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (!motionQuery.matches) {
            setInterval(cycleWords, 3500);
        }

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

    const sidebarWrap = document.getElementById('sidebarWrap');
    
    if (sidebarWrap) {

        window.toggleSidebar = function() {
            const isDesktop = window.innerWidth > 1024;
            const icons = document.querySelectorAll('.toggle-icon');
            const desktopBtn  = document.getElementById('sidebar-toggle-desktop');
            const mobileBtn   = document.getElementById('sidebar-toggle-mobile');

            if (isDesktop) {
                sidebarWrap.classList.toggle('is-collapsed');
                const isNowOpen = !sidebarWrap.classList.contains('is-collapsed');
                icons.forEach(icon => icon.textContent = isNowOpen ? '×' : '+');
                if (desktopBtn) desktopBtn.setAttribute('aria-expanded', String(isNowOpen));
            } else {
                sidebarWrap.classList.toggle('is-open-mobile');
                const isNowOpen = sidebarWrap.classList.contains('is-open-mobile');
                icons.forEach(icon => icon.textContent = isNowOpen ? '×' : '+');
                if (mobileBtn) mobileBtn.setAttribute('aria-expanded', String(isNowOpen));
                document.body.style.overflow = isNowOpen ? 'hidden' : '';

                if (isNowOpen) initIcons(sidebarWrap);
            }
        };

        const floatBtn = document.getElementById('mobileFloatBtn');
        const triggerSection = document.getElementById('nextProjectTarget');
        
        if (floatBtn && triggerSection) {
            const observer = new IntersectionObserver((entries) => {
                if(entries[0].isIntersecting) {
                    floatBtn.style.opacity = '0';
                    floatBtn.style.pointerEvents = 'none';
                    floatBtn.style.transform = 'translate(-50%, 20px)';
                } else {
                    floatBtn.style.opacity = '1';
                    floatBtn.style.pointerEvents = 'auto';
                    floatBtn.style.transform = 'translate(-50%, 0)';
                }
            }, { rootMargin: '100px' });
            
            observer.observe(triggerSection);
        }

        if (triggerSection) {
            const loadNextProject = async () => {
                try {
                    const res = await fetch('/data/projects.json');
                    if (!res.ok) throw new Error('Failed to load projects');
                    const projects = await res.json();

                    const currentProject = projects.find(p => p.link && p.link !== '#' && window.location.pathname.includes(p.link.replace('.html', '').replace('/index.html', '')));
                    const currentLinkKey = currentProject ? currentProject.link : window.location.pathname;

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

                    let unvisited = potentialNext.filter(p => !visited.includes(p.link));

                    let selectionPool = unvisited.length > 0 ? unvisited : potentialNext;

                    if (selectionPool.length > 0) {

                        const randomProj = selectionPool[Math.floor(Math.random() * selectionPool.length)];

                        const isExternal = randomProj.link.startsWith('http');
                        const finalHref = isExternal ? randomProj.link : `/${randomProj.link.replace(/^\//, '')}`;
                        const externalAttr = isExternal ? `target="_blank" rel="noopener"` : '';

                        const tagsHTML = (randomProj.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('');

                        let descSnippet = randomProj.challenge || '';
                        if (descSnippet.length > 120) {
                            descSnippet = descSnippet.substring(0, 120) + '...';
                        }

                        const thumbSrc = randomProj.thumbnail.startsWith('http') 
                            ? randomProj.thumbnail 
                            : '/' + randomProj.thumbnail.replace(/^\//, '');

                        triggerSection.innerHTML = `
                            <a href="${finalHref}" ${externalAttr} class="next-project-inner next-project-link" aria-label="View next project: ${randomProj.title}">
                                <div class="next-label">Next Project</div>
                                <h2 class="next-title">${randomProj.title}</h2>
                                <p class="next-desc">${descSnippet}</p>
                                <div class="tags-col">
                                    ${tagsHTML}
                                </div>
                                <div class="next-project-preview">
                                    <img src="${thumbSrc}" alt="Preview of ${randomProj.title}" loading="lazy">
                                </div>
                            </a>
                        `;
                    }
                } catch (error) {
                    console.error('Error loading next project:', error);
                }
            };
            loadNextProject();
        }
    }

    document.querySelectorAll('a[href*="medium.com"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const proceed = confirm("You are about to leave this site to read the full article on Medium. Do you want to continue?");
            if (!proceed) {
                e.preventDefault();
            }
        });
    });
});