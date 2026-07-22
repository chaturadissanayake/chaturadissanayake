document.addEventListener('DOMContentLoaded', () => {
    const projectModal    = document.getElementById('project-detail-modal');
    const closeProjectBtn = document.getElementById('close-project-modal');
    let lastFocusedElement = null;

    const focusableSelectors = 'a, button, [tabindex]:not([tabindex="-1"])';

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

        const methoEl = document.getElementById('pm-methodology');
        if (methoEl) {
            const dataSource = card.getAttribute('data-source');
            const stack = card.getAttribute('data-stack');
            const parts = [];
            if (dataSource) parts.push(`Data Source: ${dataSource}`);
            if (stack) parts.push(`Stack: ${stack}`);
            methoEl.textContent = parts.join(' · ');
            methoEl.style.display = parts.length ? 'block' : 'none';
        }

        projectModal.showModal();
        document.body.classList.add('modal-open');
        document.body.classList.add('project-modal-open');

        const panel = projectModal.querySelector('.modal-panel');
        if (panel) panel.scrollTop = 0;

        // Let the browser paint one frame with the panel still off-screen
        // (display just switched to flex via [open], but .is-open isn't on
        // yet) before triggering the slide-in transition. Two rAFs is the
        // safe margin some browsers need to guarantee that paint happens.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                projectModal.classList.add('is-open');
            });
        });
    };

    const closeModal = () => {
        if (!projectModal?.open) return;
        if (!projectModal.classList.contains('is-open')) {
            // Already mid-close or never finished opening; just bail out cleanly.
            projectModal.close();
            return;
        }

        const panel = projectModal.querySelector('.modal-panel');
        let finished = false;
        const finishClose = () => {
            if (finished) return;
            finished = true;
            if (projectModal.open) projectModal.close();
        };

        projectModal.classList.remove('is-open');
        if (panel) {
            panel.addEventListener('transitionend', finishClose, { once: true });
            // Fallback in case transitionend doesn't fire (e.g. reduced motion,
            // or the panel was hidden mid-transition).
            setTimeout(finishClose, 400);
        } else {
            finishClose();
        }
    };

    closeProjectBtn?.addEventListener('click', closeModal);
    projectModal?.addEventListener('mousedown', e => {
        if (e.target === projectModal) closeModal();
    });
    projectModal?.addEventListener('cancel', e => {
        // Escape key fires 'cancel' and would otherwise close the dialog
        // instantly, skipping the slide-out entirely.
        e.preventDefault();
        closeModal();
    });
    document.querySelector('.modal-panel')?.addEventListener('mousedown', e => {
        e.stopPropagation();
    });
    projectModal?.addEventListener('close', () => {
        document.body.classList.remove('modal-open');
        document.body.classList.remove('project-modal-open');
        if (window.location.hash === '#project-details') history.back();
        if (lastFocusedElement) lastFocusedElement.focus();
    });

    window.addEventListener('hashchange', () => {
        if (window.location.hash !== '#project-details' && projectModal?.open) {
            closeModal();
        }
    });

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

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                lightboxModal.classList.add('is-open');
            });
        });

        lightboxClose?.focus();
    };

    const closeLightbox = () => {
        if (lightboxModal) {
            lightboxModal.classList.remove('is-open');
            lightboxModal.removeEventListener('keydown', trapLightboxFocus);

            let finished = false;
            const finishClose = () => {
                if (finished) return;
                finished = true;
                lightboxModal.style.display = 'none';
                if (lightboxImg) { lightboxImg.src = ''; lightboxImg.alt = ''; }
            };
            lightboxModal.addEventListener('transitionend', finishClose, { once: true });
            setTimeout(finishClose, 350);
        }

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

    let lightboxTouchStartX = 0;
    let lightboxTouchStartY = 0;

    lightboxModal?.addEventListener('touchstart', e => {
        lightboxTouchStartX = e.changedTouches[0].clientX;
        lightboxTouchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    lightboxModal?.addEventListener('touchend', e => {
        const deltaX = e.changedTouches[0].clientX - lightboxTouchStartX;
        const deltaY = e.changedTouches[0].clientY - lightboxTouchStartY;
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
                openLightboxAt((lightboxIdx + 1) % vizTriggers.length);
            } else {
                openLightboxAt((lightboxIdx - 1 + vizTriggers.length) % vizTriggers.length);
            }
        }
    }, { passive: true });

    window.SiteModals = { openModal, closeModal };
});