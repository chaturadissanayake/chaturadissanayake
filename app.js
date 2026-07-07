document.addEventListener('DOMContentLoaded', () => {

    const initIcons = (root) => {
        if (window.lucide) {
            lucide.createIcons({ root: root || document });
        }
    };
    initIcons();

    const getScrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    document.addEventListener('click', e => {
        const anchor = e.target.closest('a[href^="/#"]');
        if (anchor && !anchor.classList.contains('mobile-link')) {
            const targetId = anchor.getAttribute('href').split('#')[1];
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: getScrollBehavior() });
                history.pushState(null, '', '#' + targetId);
            }
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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const heroHeadline = document.getElementById('hero-headline');
    if (heroHeadline && !prefersReducedMotion) {
        const originalText = heroHeadline.textContent.trim();
        const words = originalText.split(/\s+/);
        heroHeadline.setAttribute('aria-label', originalText);
        heroHeadline.innerHTML = words.map((word, i) => {
            return '<span class="word-mask"><span class="word-inner" style="--wd:' + (i * 45) + 'ms" aria-hidden="true">' + word + '&nbsp;</span></span>';
        }).join('');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                heroHeadline.classList.add('in-view');
            });
        });
    }

    const progressBar = document.getElementById('scroll-progress');
    const header = document.getElementById('main-header');
    const floatBtt = document.getElementById('floating-back-to-top');
    const headerForceScrolled = header?.classList.contains('scrolled') ?? false;

    floatBtt?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: getScrollBehavior() });
    });

    const sections  = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('.nav-link[data-section], .mobile-link[data-section]');
    let sectionOffsets = [];
    
    const cacheOffsets = () => {
        sectionOffsets = Array.from(sections).map(s => ({ id: s.id, top: s.offsetTop }));
    };
    window.addEventListener('resize', cacheOffsets);
    cacheOffsets();

    let isGlobalScrollTicking = false;
    
    const onGlobalScroll = () => {
        const scrollPos = window.scrollY;
        
        if (progressBar) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docHeight > 0 ? (scrollPos / docHeight) : 0;
            progressBar.style.transform = `scaleX(${pct})`;
        }

        if (header) header.classList.toggle('scrolled', scrollPos > 40 || headerForceScrolled);
        if (floatBtt) {
            if (scrollPos > 400) {
                floatBtt.classList.add('is-visible');
                floatBtt.removeAttribute('tabindex');
            } else {
                floatBtt.classList.remove('is-visible');
                floatBtt.setAttribute('tabindex', '-1');
            }
        }

        let current = '';
        sectionOffsets.forEach(s => {
            if (scrollPos >= s.top - 120) current = s.id;
        });
        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-section') === current);
        });
    };

    window.addEventListener('scroll', () => {
        if (!isGlobalScrollTicking) {
            window.requestAnimationFrame(() => {
                onGlobalScroll();
                isGlobalScrollTicking = false;
            });
            isGlobalScrollTicking = true;
        }
    }, { passive: true });
    
    onGlobalScroll();

    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const mobileMenu   = document.getElementById('mobile-nav-menu');

    const trapMobileFocus = e => {
        if (!mobileMenu.classList.contains('is-active')) return;
        const focusable = [...mobileMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };

    const toggleMobileMenu = () => {
        const isOpen = mobileMenu.classList.toggle('is-active');
        mobileToggle.classList.toggle('is-active', isOpen);
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('modal-open', isOpen);
        
        if (isOpen) {
            mobileMenu.addEventListener('keydown', trapMobileFocus);
            const firstLink = mobileMenu.querySelector('.mobile-link');
            if (firstLink) setTimeout(() => firstLink.focus(), 60);
        } else {
            mobileMenu.removeEventListener('keydown', trapMobileFocus);
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
                            targetEl.scrollIntoView({ behavior: getScrollBehavior() });
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
    const filterGroupWrapper = document.getElementById('filter-group-wrapper');
    const filterScrollPrev = document.getElementById('filter-scroll-prev');
    const filterScrollNext = document.getElementById('filter-scroll-next');
    const filterDropdown = document.getElementById('filter-dropdown');
    const filterDropdownTrigger = document.getElementById('filter-dropdown-trigger');
    const filterDropdownLabel = document.getElementById('filter-dropdown-label');
    const filterDropdownMenu = document.getElementById('filter-dropdown-menu');
let currentFilter = 'all';
    let allProjCards = [];
    let rawProjectsData = [];
    let currentSortMode = 'recent'; 
    let isArchiveView = false;

    const updateFilterScrollUI = () => {
        if (!filterGroup || !filterGroupWrapper) return;
        const maxScroll = filterGroup.scrollWidth - filterGroup.clientWidth;
        const canLeft = filterGroup.scrollLeft > 4;
        const canRight = filterGroup.scrollLeft < maxScroll - 4;
        if (filterScrollPrev) filterScrollPrev.hidden = !canLeft;
        if (filterScrollNext) filterScrollNext.hidden = !canRight;
        filterGroupWrapper.classList.toggle('can-scroll-left', canLeft);
        filterGroupWrapper.classList.toggle('can-scroll-right', canRight);
    };

    if (filterGroup) {
        filterGroup.addEventListener('scroll', updateFilterScrollUI, { passive: true });
        filterGroup.addEventListener('wheel', e => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            filterGroup.scrollLeft += e.deltaY;
        }, { passive: false });

        let dragState = null;
        filterGroup.addEventListener('pointerdown', e => {
            if (e.pointerType === 'touch') return;
            dragState = { startX: e.clientX, startScroll: filterGroup.scrollLeft, moved: false };
            filterGroup.classList.add('is-dragging');
        });
        document.addEventListener('pointermove', e => {
            if (!dragState) return;
            const delta = e.clientX - dragState.startX;
            if (Math.abs(delta) > 8) dragState.moved = true; 
            filterGroup.scrollLeft = dragState.startScroll - delta;
        });
        const endDrag = e => {
            if (!dragState) return;
            if (dragState.moved) {
                const suppressClick = ev => { ev.stopPropagation(); filterGroup.removeEventListener('click', suppressClick, true); };
                filterGroup.addEventListener('click', suppressClick, true);
            }
            dragState = null;
            filterGroup.classList.remove('is-dragging');
        };
        document.addEventListener('pointerup', endDrag);
        document.addEventListener('pointercancel', endDrag);
    }

    window.addEventListener('resize', () => {
        clearTimeout(window.__filterScrollResizeTimer);
        window.__filterScrollResizeTimer = setTimeout(updateFilterScrollUI, 150);
    });

    const closeFilterDropdown = () => {
        if (!filterDropdown) return;
        filterDropdown.classList.remove('is-open');
        if (filterDropdownTrigger) filterDropdownTrigger.setAttribute('aria-expanded', 'false');
    };

    const openFilterDropdown = () => {
        if (!filterDropdown) return;
        filterDropdown.classList.add('is-open');
        if (filterDropdownTrigger) filterDropdownTrigger.setAttribute('aria-expanded', 'true');
    };

    if (filterDropdownTrigger) {
        filterDropdownTrigger.addEventListener('click', () => {
            if (filterDropdown.classList.contains('is-open')) closeFilterDropdown();
            else openFilterDropdown();
        });
    }

    document.addEventListener('click', e => {
        if (!filterDropdown || !filterDropdown.classList.contains('is-open')) return;
        if (!filterDropdown.contains(e.target)) closeFilterDropdown();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && filterDropdown?.classList.contains('is-open')) {
            closeFilterDropdown();
            filterDropdownTrigger?.focus();
        }
    });

    if (filterScrollPrev) {
        filterScrollPrev.addEventListener('click', () => {
            filterGroup.scrollBy({ left: -220, behavior: getScrollBehavior() });
        });
    }
    if (filterScrollNext) {
        filterScrollNext.addEventListener('click', () => {
            filterGroup.scrollBy({ left: 220, behavior: getScrollBehavior() });
        });
    }

    const updateCardTagOverflow = () => {
        document.querySelectorAll('.card-tags').forEach(el => {
            el.classList.toggle('no-overflow', el.scrollWidth <= el.clientWidth + 1);
        });
    };
    window.addEventListener('resize', () => {
        clearTimeout(window.__cardTagResizeTimer);
        window.__cardTagResizeTimer = setTimeout(updateCardTagOverflow, 150);
    });

    const applyProjectFilter = () => {
        let count = 0; let visibleCount = 0;
        const isMobile = window.innerWidth <= 640;
        const expandBtn = document.getElementById('expand-projects-btn');
        const isExpanded = expandBtn ? expandBtn.classList.contains('expanded') : false;
        const maxCards = isMobile ? 3 : 6;

        allProjCards.forEach(card => {
            const cardTagList = (card.getAttribute('data-tags') || '').split(',').map(t => t.trim()).filter(Boolean);
            const matches = currentFilter === 'all' || cardTagList.includes(currentFilter);

            card.classList.remove('mobile-hidden', 'capped-hidden');

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

            card.querySelectorAll('.card-tag-btn').forEach(tagBtn => {
                const isActiveTag = tagBtn.getAttribute('data-tag') === currentFilter;
                tagBtn.classList.toggle('is-active', isActiveTag);
                tagBtn.setAttribute('aria-pressed', String(isActiveTag));
            });
        });
        if (noProjMsg) noProjMsg.style.display = count === 0 ? 'block' : 'none';
        const announcer = document.getElementById('filter-announcer');
        if (announcer) announcer.textContent = `Showing ${visibleCount} projects.`;

        if (expandBtn) {
            if (currentFilter === 'all' && count > maxCards) {
                expandBtn.style.display = 'inline-flex';
                expandBtn.innerHTML = isExpanded
                    ? '<span class="btn-label">Show less</span><i data-lucide="chevron-up" aria-hidden="true" style="width:16px;height:16px;"></i>'
                    : '<span class="btn-label">View all work</span><i data-lucide="chevron-down" aria-hidden="true" style="width:16px;height:16px;"></i>';
                if (window.lucide) lucide.createIcons({ root: expandBtn });
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

    const setActiveFilter = (value, { scrollToProjects = false } = {}) => {
        currentFilter = value;
        sessionStorage.setItem('activeProjectFilter', currentFilter);

        document.querySelectorAll('.filter-pill').forEach(b => {
            const isActive = b.getAttribute('data-filter') === value;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-pressed', String(isActive));
        });

        document.querySelectorAll('.filter-dropdown-option').forEach(o => {
            const isActive = o.getAttribute('data-filter') === value;
            o.classList.toggle('active', isActive);
            o.setAttribute('aria-selected', String(isActive));
        });

        const matchedOption = document.querySelector(`.filter-dropdown-option[data-filter="${value}"] span`);
        if (filterDropdownLabel && matchedOption) filterDropdownLabel.textContent = matchedOption.textContent;
        else if (filterDropdownLabel) filterDropdownLabel.textContent = value === 'all' ? 'All Work' : value;

        applyProjectFilter();
        requestAnimationFrame(updateFilterScrollUI);

        if (scrollToProjects) {
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                const offset = projectsSection.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: offset, behavior: getScrollBehavior() });
            }
        }
    };

    const renderProjectsGrid = () => {
        if (!projWrap) return;
        projWrap.innerHTML = ''; 
        const allTags = new Set();
        const disciplineTagsSet = new Set();
        
        let viewData = rawProjectsData.filter(p => !!p.archive === isArchiveView);
        
        if (currentSortMode === 'impact') {
            viewData.sort((a, b) => (a.priority || 99) - (b.priority || 99));
        } else {
            viewData.sort((a, b) => new Date(b.sortDate || '2000-01-01') - new Date(a.sortDate || '2000-01-01'));
        }

        if (viewData.length === 0) {
            projWrap.innerHTML = '<div class="system-message error-state"><p>No projects available in this view.</p></div>';
            if (noProjMsg) noProjMsg.style.display = 'none';
            return;
        }

        viewData.forEach((proj, index) => {
            const safeTags = proj.tags || [];
            safeTags.forEach(tag => allTags.add(tag));
            
            // Safely handle if discipline type is a string or an array in JSON
            const rawDiscipline = proj.set_2_discipline_type;
            const disciplineTags = Array.isArray(rawDiscipline) ? rawDiscipline : (rawDiscipline ? [rawDiscipline] : []);
            disciplineTags.forEach(tag => disciplineTagsSet.add(tag));

            const tagsHTML = safeTags.map(tag => `<button type="button" class="card-tag-btn" data-tag="${tag}" aria-pressed="false" aria-label="Filter projects by ${tag}">${tag}</button>`).join('');
            
            const safeChallenge = proj.challenge || '';
            const descSnippet = safeChallenge.length > 120 ? safeChallenge.substring(0, 120) + '...' : safeChallenge;
            const loadingAttr = index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
            const safeLink = proj.link || '#';
            const isExternal = safeLink.startsWith('http');
            const finalHref = isExternal ? safeLink : `/${safeLink.replace(/^\//, '')}`;
            const externalAttr = isExternal ? `target="_blank" rel="noopener"` : '';

            const cardHTML = `
                <div class="project-card card-interactive" data-tags="${safeTags.join(',')}" data-title="${proj.title || ''}" data-challenge="${proj.challenge || ''}" data-role="${proj.role || ''}" data-outcome="${proj.outcome || ''}" data-link="${finalHref}" data-status="${proj.status || ''}">
                    <a href="${finalHref}" ${externalAttr} class="card-hitbox" aria-label="View Project: ${proj.title}"></a>
                    <div class="card-inner">
                        <div class="card-image">
                            <img src="${proj.thumbnail}" alt="${proj.title}" width="800" height="600" ${loadingAttr} style="view-transition-name: project-img-${proj.id};">
                            <div class="card-overlay">
                                <span class="card-open-label">View Project <i data-lucide="arrow-up-right" aria-hidden="true" style="width:14px;height:14px;margin-left:4px;"></i></span>
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
                </div>
            `;
            projWrap.insertAdjacentHTML('beforeend', cardHTML);
        });

        allProjCards = document.querySelectorAll('.project-card');

        projWrap.querySelectorAll('.card-image img').forEach(img => {
            const handleLoad = () => {
                img.classList.add('img-loaded');
                const parent = img.closest('.card-image');
                if (parent) parent.classList.add('shimmer-complete');
            };
            const handleError = () => {
                img.style.display = 'none';
                const parent = img.closest('.card-image');
                if (parent) {
                    parent.classList.add('shimmer-complete', 'image-failed');
                    parent.insertAdjacentHTML('afterbegin', '<div class="fallback-img">Asset Unavailable</div>');
                }
                const card = img.closest('.project-card');
                if (card) card.style.order = '99';
            };
            if (img.complete && img.naturalHeight !== 0) handleLoad();
            else if (img.complete && img.naturalHeight === 0) handleError();
            else {
                img.addEventListener('load', handleLoad);
                img.addEventListener('error', handleError);
            }
        });

        if (!allTags.has(currentFilter) && currentFilter !== 'all') {
            currentFilter = 'all';
            sessionStorage.setItem('activeProjectFilter', 'all');
        }

        const filterOptions = [{ value: 'all', label: 'All Work' }];
        allTags.forEach(tag => filterOptions.push({ value: tag, label: tag }));

        if (filterGroup) {
            filterGroup.innerHTML = filterOptions.map(o => {
                const hasDisciplineTags = disciplineTagsSet.size > 0;
                const isDiscipline = disciplineTagsSet.has(o.value) || o.value === 'all';
                
                // Only apply the hiding class if we actually found discipline tags in the JSON
                const mobileClass = (hasDisciplineTags && !isDiscipline) ? ' desktop-only-filter' : '';
                
                return `<button type="button" class="filter-pill${mobileClass} ${currentFilter === o.value ? 'active' : ''}" data-filter="${o.value}" aria-pressed="${currentFilter === o.value}">${o.label}</button>`;
            }).join('');
        }

        if (filterDropdownMenu) {
            filterDropdownMenu.innerHTML = filterOptions.map(o =>
                `<button type="button" class="filter-dropdown-option ${currentFilter === o.value ? 'active' : ''}" data-filter="${o.value}" role="option" aria-selected="${currentFilter === o.value}"><span>${o.label}</span><span class="filter-dropdown-option-dot" aria-hidden="true"></span></button>`
            ).join('');
            if (filterDropdownLabel) {
                const matched = filterOptions.find(o => o.value === currentFilter);
                filterDropdownLabel.textContent = matched ? matched.label : 'All Work';
            }
        }

        applyProjectFilter();
        requestAnimationFrame(updateFilterScrollUI);
        requestAnimationFrame(updateCardTagOverflow);
        initIcons(projWrap);
    };

    const initProjects = async () => {
        if (!projWrap) return;
        
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';

        projWrap.innerHTML = '<div class="system-message loading-state">Loading Projects...</div>';

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await fetch('/data/projects.json', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            rawProjectsData = await res.json();
            
            const storedFilter = sessionStorage.getItem('activeProjectFilter');
            if (storedFilter) currentFilter = storedFilter;
            
            renderProjectsGrid();

            if (filterGroup) {
                filterGroup.addEventListener('click', e => {
                    const btn = e.target.closest('.filter-pill');
                    if (!btn || filterGroup.classList.contains('is-dragging')) return;
                    setActiveFilter(btn.getAttribute('data-filter'));
                });
            }

            if (filterDropdownMenu) {
                filterDropdownMenu.addEventListener('click', e => {
                    const opt = e.target.closest('.filter-dropdown-option');
                    if (!opt) return;
                    setActiveFilter(opt.getAttribute('data-filter'));
                    closeFilterDropdown();
                    filterDropdownTrigger?.focus();
                });
            }

            projWrap.addEventListener('click', e => {
                const tagBtn = e.target.closest('.card-tag-btn');
                if (tagBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveFilter(tagBtn.getAttribute('data-tag'), { scrollToProjects: true });
                    return;
                }

                const hitbox = e.target.closest('.card-hitbox');
                const card = hitbox ? hitbox.closest('.project-card') : null;
                if (card && typeof projectModal !== 'undefined' && projectModal) {
                    e.preventDefault();
                    openModal(card);
                }
            });

            const expandBtn = document.getElementById('expand-projects-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    const isExpanded = expandBtn.classList.toggle('expanded');
                    if (!isExpanded) {
                        if (expandBtn.parentElement) expandBtn.parentElement.classList.remove('floating-action-wrapper');
                        applyProjectFilter();
                        requestAnimationFrame(updateCardTagOverflow);
                        const projectsSection = document.getElementById('projects');
                        if (projectsSection) {
                            const offset = projectsSection.getBoundingClientRect().top + window.scrollY - 80;
                            window.scrollTo({ top: offset, behavior: 'auto' });
                        }
                    } else {
                        if (expandBtn.parentElement) expandBtn.parentElement.classList.add('floating-action-wrapper');
                        applyProjectFilter();
                        requestAnimationFrame(updateCardTagOverflow);
                    }
                });
            }

        } catch (error) {
            console.error('Failed to load projects:', error);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            projWrap.innerHTML = '';
            if (noProjMsg) {
                noProjMsg.innerHTML = `
                    <div class="system-message error-state">
                        <p>Couldn't load projects.<br>Check your connection and try again.</p>
                        <button onclick="window.location.reload()" class="btn-primary">Retry <i data-lucide="refresh-cw" aria-hidden="true"></i></button>
                    </div>
                `;
                noProjMsg.style.display = 'block';
                if (window.lucide) lucide.createIcons({ root: noProjMsg });
            }
        }
    };
    
    initProjects();

    const sortBtn = document.getElementById('sort-toggle-btn');
    const archiveBtn = document.getElementById('archive-toggle-btn');
    
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            currentSortMode = currentSortMode === 'recent' ? 'impact' : 'recent';
            sortBtn.innerHTML = `Sort: ${currentSortMode === 'recent' ? 'Impact' : 'Recent'} <i data-lucide="arrow-down-up" style="width:14px;height:14px; margin-left:6px;"></i>`;
            if (window.lucide) lucide.createIcons({ root: sortBtn });
            renderProjectsGrid();
        });
    }
    
    const archiveModeBanner = document.getElementById('archive-mode-banner');
    const archiveBackBtn = document.getElementById('archive-back-btn');

    const setArchiveView = (nextValue) => {
        isArchiveView = nextValue;
        archiveBtn.innerHTML = `${isArchiveView ? 'Portfolio' : 'Archive'} <i data-lucide="archive" style="width:14px;height:14px; margin-left:6px;"></i>`;
        if (isArchiveView) {
            archiveBtn.style.background = 'var(--ink)';
            archiveBtn.style.color = 'var(--white)';
            archiveBtn.style.borderColor = 'var(--ink)';
        } else {
            archiveBtn.style.background = '';
            archiveBtn.style.color = '';
            archiveBtn.style.borderColor = '';
        }
        if (archiveModeBanner) archiveModeBanner.hidden = !isArchiveView;
        setActiveFilter('all');
        if (window.lucide) lucide.createIcons({ root: archiveBtn });
        if (archiveModeBanner) initIcons(archiveModeBanner);
        renderProjectsGrid();
        if (isArchiveView) {
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                const offset = projectsSection.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: offset, behavior: getScrollBehavior() });
            }
        }
    };

    if (archiveBtn) {
        archiveBtn.addEventListener('click', () => setArchiveView(!isArchiveView));
    }

    if (archiveBackBtn) {
        archiveBackBtn.addEventListener('click', () => setArchiveView(false));
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
            } catch {
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

        window.location.hash = 'project-details';

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
            
            const closeBtn = document.getElementById('close-project-modal');
            if (closeBtn) closeBtn.focus();
        });
    };

    const closeModal = (isPopState = false) => {
        projectModal?.classList.remove('active');
        document.body.classList.remove('modal-open');
        projectModal.removeEventListener('keydown', trapFocus);

        if (isPopState !== true && window.location.hash === '#project-details') {
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

    window.addEventListener('hashchange', () => {
        if (window.location.hash !== '#project-details' && projectModal?.classList.contains('active')) {
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
            vizTrack.scrollBy({ left: scrollAmt(), behavior: getScrollBehavior() })
        );
        document.getElementById('viz-prev-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left: -scrollAmt(), behavior: getScrollBehavior() })
        );

        vizTrack.addEventListener('keydown', (e) => {
            if (e.target === vizTrack) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    vizTrack.scrollBy({ left: scrollAmt(), behavior: getScrollBehavior() });
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    vizTrack.scrollBy({ left: -scrollAmt(), behavior: getScrollBehavior() });
                }
            }
        });
    }
    const lightboxModal  = document.getElementById('lightbox-modal');
    const lightboxImg    = document.getElementById('lightbox-image');
    const lightboxClose  = lightboxModal?.querySelector('.lightbox-close');
    const lightboxPrev   = document.getElementById('lightbox-prev');
    const lightboxNext   = document.getElementById('lightbox-next');
    const vizTriggers    = Array.from(document.querySelectorAll('.viz-lightbox-trigger'));
    let lightboxIdx      = 0;

    const trapLightboxFocus = e => {
        if (lightboxModal.style.display !== 'flex') return;
        const focusable = [...lightboxModal.querySelectorAll(focusableSelectors)];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    };

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
        lightboxModal.addEventListener('keydown', trapLightboxFocus);
        
        document.getElementById('main-content')?.setAttribute('aria-hidden', 'true');
        document.getElementById('main-header')?.setAttribute('aria-hidden', 'true');
        
        lightboxClose?.focus();
    };

    const closeLightbox = () => {
        if (lightboxModal) {
            lightboxModal.style.display = 'none';
            lightboxModal.removeEventListener('keydown', trapLightboxFocus);
        }
        if (lightboxImg)   { lightboxImg.src = ''; lightboxImg.alt = ''; }
        
        document.getElementById('main-content')?.removeAttribute('aria-hidden');
        document.getElementById('main-header')?.removeAttribute('aria-hidden');
        
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
                if (desktopBtn) desktopBtn.setAttribute('aria-expanded', String(isNowOpen));
            } else {
                sidebarWrap.classList.toggle('is-open-mobile');
                const isNowOpen = sidebarWrap.classList.contains('is-open-mobile');
                if (mobileBtn) mobileBtn.setAttribute('aria-expanded', String(isNowOpen));
                document.body.classList.toggle('modal-open', isNowOpen);
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
                    
                    const validProjects = (await res.json()).filter(p => p.link && !p.link.startsWith('http') && p.link !== '#');
                    const currentIndex = validProjects.findIndex(p => window.location.pathname.includes(p.id));

                    if (validProjects.length > 0) {
                        let nextProj;
                        if (validProjects.length > 1) {
                            const availableProjects = validProjects.filter((_, i) => i !== currentIndex);
                            const randomIndex = Math.floor(Math.random() * availableProjects.length);
                            nextProj = availableProjects[randomIndex];
                        } else {
                            nextProj = validProjects[0];
                        }

                        const href = `/${nextProj.link.replace(/^\//, '')}`;
                        const thumbSrc = `/${nextProj.thumbnail.replace(/^\//, '')}`;
                        
                        const tagsHTML = (nextProj.tags || []).slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('');
                        
                        triggerSection.innerHTML = `
                            <a href="${href}" class="next-project-single-wrapper">
                                <span class="next-label-single">Next Project</span>
                                <h2 class="next-title-single">${nextProj.title}</h2>
                                <p class="next-desc-single">${nextProj.challenge}</p>
                                <div class="next-tags-single">
                                    ${tagsHTML}
                                </div>
                                <div class="next-image-single">
                                    <img src="${thumbSrc}" alt="${nextProj.title}" loading="lazy">
                                </div>
                            </a>
                        `;
                    }
                } catch (error) {
                    console.error('Error loading random next project:', error);
                }
            };
            loadNextProject();
        }
    }

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
const mapObj = document.querySelector('.clients-map-img');
    const mapTooltip = document.getElementById('map-tooltip');

    if (mapObj && mapTooltip) {
        mapObj.addEventListener('load', () => {
            try {
                const svgDoc = mapObj.contentDocument;
                if (!svgDoc) return;

                const style = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
                style.textContent = ".cls-1, .cls-2 { cursor: pointer; transition: opacity 0.2s; } .cls-1:hover, .cls-2:hover { opacity: 0.7; }";
                svgDoc.documentElement.appendChild(style);

                const interactivePaths = svgDoc.querySelectorAll('.cls-1, .cls-2');

                interactivePaths.forEach(path => {
                    path.addEventListener('mouseenter', () => {
                        const infoText = path.getAttribute('data-info');
                        if (infoText) {
                            mapTooltip.textContent = infoText;
                            mapTooltip.classList.add('is-visible');
                        }
                    });

                    path.addEventListener('mousemove', (e) => {
                        const rect = mapObj.getBoundingClientRect();
                        const x = e.clientX + rect.left;
                        const y = e.clientY + rect.top;
                        mapTooltip.style.left = `${x}px`;
                        mapTooltip.style.top = `${y}px`;
                    });

                    path.addEventListener('mouseleave', () => {
                        mapTooltip.classList.remove('is-visible');
                    });
                });
            } catch (err) {}
        });
    }
});