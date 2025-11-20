// Main JavaScript for navigation and interactive features across all pages

// ===== NAVIGATION =====

// Update active navigation link based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Add shadow to navbar on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(section);
});

// ===== STATS COUNTER ANIMATION (Home Page) =====

function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Animate counters when hero section is visible
const hero = document.querySelector('.hero');
if (hero) {
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.textContent.replace('+', ''));
                    if (!isNaN(target)) {
                        stat.textContent = '0';
                        animateCounter(stat, target);
                    }
                });
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    heroObserver.observe(hero);
}

// ===== RESPONSIVE NAVIGATION TOGGLE (for mobile) =====

function setupMobileNav() {
    if (window.innerWidth <= 768) {
        const navContainer = document.querySelector('.nav-container');
        const navMenu = document.querySelector('.nav-menu');
        
        // Check if button already exists
        if (!document.querySelector('.mobile-menu-button')) {
            const menuButton = document.createElement('button');
            menuButton.className = 'mobile-menu-button';
            menuButton.setAttribute('aria-label', 'Toggle menu');
            menuButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            `;
            
            // Add styles for mobile menu button
            if (!document.querySelector('#mobile-menu-styles')) {
                const style = document.createElement('style');
                style.id = 'mobile-menu-styles';
                style.textContent = `
                    .mobile-menu-button {
                        display: none;
                        background: none;
                        border: none;
                        cursor: pointer;
                        color: var(--gray-700);
                        padding: 0.5rem;
                    }
                    
                    @media (max-width: 768px) {
                        .mobile-menu-button {
                            display: block;
                        }
                        
                        .nav-menu {
                            display: none;
                            position: absolute;
                            top: 100%;
                            left: 0;
                            right: 0;
                            background: white;
                            flex-direction: column;
                            padding: 1rem;
                            box-shadow: var(--shadow-lg);
                            border-top: 1px solid var(--gray-200);
                            z-index: 999;
                        }
                        
                        .nav-menu.active {
                            display: flex;
                        }
                        
                        .nav-menu li {
                            width: 100%;
                        }
                        
                        .nav-link {
                            display: block;
                            padding: 0.75rem 1rem;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            navContainer.appendChild(menuButton);
            
            menuButton.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
            
            // Close menu when clicking a link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                });
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navContainer.contains(e.target)) {
                    navMenu.classList.remove('active');
                }
            });
        }
    }
}

setupMobileNav();
window.addEventListener('resize', setupMobileNav);

// ===== PRINT FRIENDLY =====

window.addEventListener('beforeprint', () => {
    // Expand all charts before printing
    document.querySelectorAll('.chart-container, .map-container').forEach(container => {
        container.style.pageBreakInside = 'avoid';
    });
});

// ===== LOADING STATE =====

window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    
    // Add a subtle fade-in animation
    if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            body {
                opacity: 0;
                transition: opacity 0.3s ease-in;
            }
            
            body.loaded {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
});

// ===== ACCESSIBILITY =====

// Add skip to content link
const skipLink = document.createElement('a');
skipLink.href = '#main-content';
skipLink.className = 'skip-link';
skipLink.textContent = 'Skip to main content';
skipLink.style.cssText = `
    position: absolute;
    top: -100px;
    left: 0;
    background: var(--beige-700);
    color: white;
    padding: 0.75rem 1rem;
    text-decoration: none;
    z-index: 10000;
    font-weight: 600;
    border-radius: 0 0 0.375rem 0;
    transition: top 0.2s ease;
`;
skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
});
skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-100px';
});
document.body.insertBefore(skipLink, document.body.firstChild);

// Add main-content id to first section
const firstSection = document.querySelector('.section, .hero');
if (firstSection && !firstSection.id) {
    firstSection.id = 'main-content';
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId === '#main-content') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const targetPosition = targetElement.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== CONSOLE MESSAGE =====

console.log('%c🎓 COS30045 Traffic Infraction Analysis', 'color: #2563eb; font-size: 20px; font-weight: bold;');
console.log('%cWebsite built with Chart.js, D3.js, and Leaflet', 'color: #6b7280; font-size: 12px;');
console.log('%c📊 Data Visualizations Ready', 'color: #10b981; font-size: 14px; font-weight: bold;');

// ===== UTILITY: Export Data =====

window.exportData = function(rq) {
    if (typeof DATA === 'undefined') {
        console.error('DATA is not available on this page');
        return;
    }
    
    const dataToExport = DATA[rq];
    if (!dataToExport) {
        console.error(`No data found for ${rq}`);
        return;
    }
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rq}_data.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log(`✓ Exported ${rq} data`);
};

// Log available export function
if (typeof DATA !== 'undefined') {
    console.log('%cTip: Use exportData("rq1") to download research data', 'color: #f59e0b; font-size: 11px;');
}

// ===== KEYBOARD NAVIGATION =====

document.addEventListener('keydown', (e) => {
    // Navigate with arrow keys (only on home page with multiple sections)
    if (document.querySelectorAll('.section').length > 2 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        const sections = Array.from(document.querySelectorAll('.section, .hero'));
        const currentScroll = window.scrollY;
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        
        let currentIndex = sections.findIndex(section => {
            const top = section.offsetTop - navHeight;
            const bottom = top + section.offsetHeight;
            return currentScroll >= top && currentScroll < bottom;
        });
        
        if (e.key === 'ArrowDown' && currentIndex < sections.length - 1) {
            e.preventDefault();
            const nextSection = sections[currentIndex + 1];
            const targetPosition = nextSection.offsetTop - navHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
            e.preventDefault();
            const prevSection = sections[currentIndex - 1];
            const targetPosition = prevSection.offsetTop - navHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    }
});

// ===== RESEARCH CARD ANIMATIONS (Home Page) =====

const researchCards = document.querySelectorAll('.research-card');
if (researchCards.length > 0) {
    researchCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        cardObserver.observe(card);
    });
}
