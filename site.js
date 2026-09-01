(function() {
    'use strict';

    // --- Theme toggle (light / dark / auto) ---
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const systemTheme = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function getSavedTheme() {
        try {
            return localStorage.getItem('theme') || 'auto';
        } catch (e) {
            return 'auto';
        }
    }

    let currentTheme = getSavedTheme();

    function applyTheme(theme) {
        body.classList.remove('light-mode', 'dark-mode');

        if (theme === 'light') {
            body.classList.add('light-mode');
        } else if (theme === 'dark') {
            body.classList.add('dark-mode');
        }

        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            // Continue normally if storage is unavailable.
        }

        currentTheme = theme;
    }

    applyTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            let nextTheme;
            if (currentTheme === 'light') {
                nextTheme = 'dark';
            } else if (currentTheme === 'dark') {
                nextTheme = 'auto';
            } else {
                nextTheme = 'light';
            }
            applyTheme(nextTheme);
        });
    }

    // When Auto is selected, follow live system theme changes.
    if (systemTheme) {
        const handleSystemThemeChange = function() {
            if (currentTheme === 'auto') {
                applyTheme('auto');
            }
        };
        if (systemTheme.addEventListener) {
            systemTheme.addEventListener('change', handleSystemThemeChange);
        } else if (systemTheme.addListener) {
            systemTheme.addListener(handleSystemThemeChange);
        }
    }

    // --- Navigation overlay ---
    const hamburger = document.getElementById('hamburgerBtn');
    const navOverlay = document.getElementById('navOverlay');
    const closeNavBtn = document.getElementById('closeNavBtn');

    function openNav() {
        if (navOverlay) navOverlay.classList.add('open');
    }

    function closeNav() {
        if (navOverlay) navOverlay.classList.remove('open');
    }

    if (hamburger) hamburger.addEventListener('click', openNav);
    if (closeNavBtn) closeNavBtn.addEventListener('click', closeNav);
    if (navOverlay) {
        navOverlay.addEventListener('click', function(e) {
            if (e.target === navOverlay) closeNav();
        });
        navOverlay.querySelectorAll('.nav-links a').forEach(function(link) {
            link.addEventListener('click', closeNav);
        });
    }

    // --- Section reveal ---
    // IMPORTANT: Make every section visible immediately so a failed/blocked
    // JavaScript execution can never leave the page looking blank.
    const revealEls = document.querySelectorAll('.section-reveal');
    revealEls.forEach(function(el) {
        el.classList.add('visible');
    });

    // Keep the observer for pages that use the reveal animation, but never
    // depend on it for visibility.
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });

        revealEls.forEach(function(el) {
            observer.observe(el);
        });
    }

    // --- Sub-nav active link ---
    const subLinks = document.querySelectorAll('.sub-nav .sub-inner a');
    subLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            // Preserve normal navigation for links to other pages.
            const href = link.getAttribute('href') || '';
            if (href.charAt(0) === '#') {
                e.preventDefault();
                subLinks.forEach(function(l) { l.classList.remove('active'); });
                link.classList.add('active');
            }
        });
    });

    // --- Active navigation link ---
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (navOverlay) {
        navOverlay.querySelectorAll('.nav-links a').forEach(function(link) {
            const href = link.getAttribute('href');
            if (href === currentPage || (href === 'index.html' && currentPage === '')) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    // --- Back to top button ---
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        function updateBackToTop() {
            if (window.scrollY > 320) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
        updateBackToTop();
        window.addEventListener('scroll', updateBackToTop);
        backToTop.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Policy page table of contents ---
    const tocLinks = document.querySelectorAll('.policy-toc a');
    const policyHeadings = document.querySelectorAll('main h4[id]');
    if (tocLinks.length && policyHeadings.length && 'IntersectionObserver' in window) {
        const activeTocObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    tocLinks.forEach(function(link) {
                        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
                    });
                }
            });
        }, { threshold: 0.35 });

        policyHeadings.forEach(function(heading) {
            activeTocObserver.observe(heading);
        });

        tocLinks.forEach(function(link) {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const targetId = this.getAttribute('href').slice(1);
                const target = document.getElementById(targetId);
                if (target) {
                    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
                }
            });
        });
    }
})();
