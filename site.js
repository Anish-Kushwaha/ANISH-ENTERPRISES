
        (function() {
            'use strict';

            // --- Theme toggle (light / dark / auto) ---
            const themeToggle = document.getElementById('themeToggle');
            const body = document.body;

            // Default to 'auto' if not set
            let currentTheme = localStorage.getItem('theme') || 'auto';
            applyTheme(currentTheme);

            function applyTheme(theme) {
                body.classList.remove('light-mode', 'dark-mode');
                if (theme === 'light') {
                    body.classList.add('light-mode');
                } else if (theme === 'dark') {
                    body.classList.add('dark-mode');
                }
                // 'auto' means no class — uses media query
                localStorage.setItem('theme', theme);
                currentTheme = theme;
            }

            if (themeToggle) themeToggle.addEventListener('click', function() {
                let nextTheme;
                if (currentTheme === 'light') nextTheme = 'dark';
                else if (currentTheme === 'dark') nextTheme = 'auto';
                else nextTheme = 'light';
                applyTheme(nextTheme);
            });

            // --- Navigation overlay ---
            const hamburger = document.getElementById('hamburgerBtn');
            const navOverlay = document.getElementById('navOverlay');
            const closeNavBtn = document.getElementById('closeNavBtn');

            function openNav() {
                navOverlay.classList.add('open');
            }
            function closeNav() {
                navOverlay.classList.remove('open');
            }

            if (hamburger) hamburger.addEventListener('click', openNav);
            if (closeNavBtn) closeNavBtn.addEventListener('click', closeNav);
            if (navOverlay) navOverlay.addEventListener('click', function(e) {
                if (e.target === navOverlay) closeNav();
            });
            if (navOverlay) navOverlay.querySelectorAll('.nav-links a').forEach(function(link) {
                link.addEventListener('click', closeNav);
            });

            // --- Section reveal ---
            const revealEls = document.querySelectorAll('.section-reveal');
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver(function(entries) {
                    entries.forEach(function(entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                        }
                    });
                }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });
                revealEls.forEach(function(el) {
                    observer.observe(el);
                });
                // Initial check
                setTimeout(function() {
                    revealEls.forEach(function(el) {
                        if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
                            el.classList.add('visible');
                        }
                    });
                }, 300);
            } else {
                revealEls.forEach(function(el) { el.classList.add('visible'); });
            }

            // --- Sub-nav active link ---
            const subLinks = document.querySelectorAll('.sub-nav .sub-inner a');
            subLinks.forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    subLinks.forEach(function(l) { l.classList.remove('active'); });
                    link.classList.add('active');
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
    