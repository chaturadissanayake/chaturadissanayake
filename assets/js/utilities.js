window.SiteUtils = (function() {
    const initIcons = (root) => {
        if (window.lucide) {
            lucide.createIcons({ root: root || document });
        }
    };

    const getScrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

    return { initIcons, getScrollBehavior };
})();
