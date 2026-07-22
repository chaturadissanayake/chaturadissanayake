document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-text, .mobile-lang-text').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            document.querySelectorAll('.lang-text, .mobile-lang-text').forEach(b => {
                const match = b.getAttribute('data-lang') === lang;
                b.classList.toggle('is-active', match);
                b.setAttribute('aria-pressed', String(match));
            });
        });
    });

    const progressBar = document.getElementById('scroll-progress');
    const header = document.getElementById('main-header');
    const floatBtt = document.getElementById('floating-back-to-top');
    const headerForceScrolled = header?.classList.contains('scrolled') ?? false;

    floatBtt?.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: SiteUtils.getScrollBehavior() });
    });

    const sections  = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('.nav-link[data-section], .mobile-link[data-section]');
    let sectionOffsets = [];

    const cacheOffsets = () => {
        sectionOffsets = Array.from(sections).map(s => ({ id: s.id, top: s.offsetTop }));
    };
    window.addEventListener('resize', cacheOffsets);
    cacheOffsets();
    window.SiteNav = { cacheOffsets }; // Expose to global scope for dynamic content

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
                            targetEl.scrollIntoView({ behavior: SiteUtils.getScrollBehavior() });
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

                if (isNowOpen) SiteUtils.initIcons(sidebarWrap);
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
});
