document.addEventListener('DOMContentLoaded', () => {
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
    let currentSortMode = 'impact'; 
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
            filterGroup.scrollBy({ left: -220, behavior: SiteUtils.getScrollBehavior() });
        });
    }
    if (filterScrollNext) {
        filterScrollNext.addEventListener('click', () => {
            filterGroup.scrollBy({ left: 220, behavior: SiteUtils.getScrollBehavior() });
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
                window.scrollTo({ top: offset, behavior: SiteUtils.getScrollBehavior() });
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

            const rawDiscipline = proj.set_2_discipline_type;
            const disciplineTags = Array.isArray(rawDiscipline) ? rawDiscipline : (rawDiscipline ? [rawDiscipline] : []);
            disciplineTags.forEach(tag => disciplineTagsSet.add(tag));

            const tagsHTML = safeTags.slice(1).map(tag => `<button type="button" class="card-tag-btn" data-tag="${tag}" aria-pressed="false" aria-label="Filter projects by ${tag}">${tag}</button>`).join('');
            const catHTML = safeTags[0]
                ? `<button type="button" class="card-cat card-tag-btn" data-tag="${safeTags[0]}" aria-pressed="false" aria-label="Filter projects by ${safeTags[0]}">${safeTags[0]}</button>`
                : '';

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
                                ${catHTML}
                                <span class="card-date">${proj.date}</span>
                            </div>
                            <div class="card-title-wrap">
                                <h3 class="card-title">${proj.title}</h3>
                                <p class="card-desc">${descSnippet}</p>
                            </div>
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
        SiteUtils.initIcons(projWrap);
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
                if (card && window.SiteModals && window.SiteModals.openModal) {
                    e.preventDefault();
                    window.SiteModals.openModal(card);
                }
            });

            const expandBtn = document.getElementById('expand-projects-btn');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => {
                    const isExpanded = expandBtn.classList.toggle('expanded');
                    expandBtn.blur();
                    if (isExpanded) {
                        if (expandBtn.parentElement) expandBtn.parentElement.classList.add('floating-action-wrapper');
                        applyProjectFilter();
                        requestAnimationFrame(updateCardTagOverflow);
                    } else {
                        if (expandBtn.parentElement) expandBtn.parentElement.classList.remove('floating-action-wrapper');
                        applyProjectFilter();
                        requestAnimationFrame(() => {
                            updateCardTagOverflow();
                            const visibleCards = Array.from(document.querySelectorAll('.project-card')).filter(c => !c.classList.contains('capped-hidden') && c.style.display !== 'none');
                            const lastCard = visibleCards[visibleCards.length - 1];
                            if (lastCard) {
                                const offset = lastCard.getBoundingClientRect().top + window.scrollY - 100;
                                window.scrollTo({ top: offset, behavior: SiteUtils.getScrollBehavior() });
                            }
                        });
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
            sortBtn.innerHTML = `Sort: ${currentSortMode === 'impact' ? 'Featured' : 'Recent'} <i data-lucide="arrow-down-up" style="width:14px;height:14px; margin-left:6px;"></i>`;
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
        if (archiveModeBanner) SiteUtils.initIcons(archiveModeBanner);
        renderProjectsGrid();
        if (isArchiveView) {
            const projectsSection = document.getElementById('projects');
            if (projectsSection) {
                const offset = projectsSection.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: offset, behavior: SiteUtils.getScrollBehavior() });
            }
        }
    };

    if (archiveBtn) {
        archiveBtn.addEventListener('click', () => setArchiveView(!isArchiveView));
    }

    if (archiveBackBtn) {
        archiveBackBtn.addEventListener('click', () => setArchiveView(false));
    }

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
            vizTrack.scrollBy({ left: scrollAmt(), behavior: SiteUtils.getScrollBehavior() })
        );
        document.getElementById('viz-prev-btn')?.addEventListener('click', () =>
            vizTrack.scrollBy({ left: -scrollAmt(), behavior: SiteUtils.getScrollBehavior() })
        );

        vizTrack.addEventListener('keydown', (e) => {
            if (e.target === vizTrack) {
                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    vizTrack.scrollBy({ left: scrollAmt(), behavior: SiteUtils.getScrollBehavior() });
                }
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    vizTrack.scrollBy({ left: -scrollAmt(), behavior: SiteUtils.getScrollBehavior() });
                }
            }
        });

        const vizDots = Array.from(document.querySelectorAll('.viz-swipe-hint span'));
        if (vizDots.length) {
            const updateVizDots = () => {
                const maxScroll = vizTrack.scrollWidth - vizTrack.clientWidth;
                const progress = maxScroll > 0 ? vizTrack.scrollLeft / maxScroll : 0;
                const activeIdx = Math.min(vizDots.length - 1, Math.round(progress * (vizDots.length - 1)));
                vizDots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIdx));
            };
            vizTrack.addEventListener('scroll', updateVizDots, { passive: true });
            window.addEventListener('resize', updateVizDots);
            updateVizDots();
        }
    }
});
