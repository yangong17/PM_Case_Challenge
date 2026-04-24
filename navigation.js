/**
 * PMI-LA Case Study Challenge - Navigation System
 * Modern, robust navigation with enhanced UX and accessibility
 * @version 2.0.0
 */

class NavigationManager {
    constructor() {
        this.navPlaceholder = null;
        this.currentPage = this.getCurrentPage();
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        // Performance optimization
        this.navCache = null;
        this.observers = new Set();
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the navigation system
     */
    async init() {
        try {
            this.navPlaceholder = document.getElementById('nav-placeholder');
            
            if (!this.navPlaceholder) {
                console.warn('Navigation placeholder not found. Retrying...');
                await this.retryWithDelay(() => this.init());
                return;
            }

            await this.loadNavigation();
            this.setupEventListeners();
            this.setupAccessibility();
            
        } catch (error) {
            this.handleError('Initialization failed', error);
        }
    }

    /**
     * Get current page name from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        return page.includes('.html') ? page : 'index.html';
    }

    /**
     * Load navigation with caching and error handling
     */
    async loadNavigation() {
        try {
            // Use cached navigation if available
            if (this.navCache) {
                this.renderNavigation(this.navCache);
                return;
            }

            const response = await fetch('nav.html', {
                cache: 'default',
                headers: {
                    'Accept': 'text/html'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const navHtml = await response.text();
            
            // Cache the navigation HTML
            this.navCache = navHtml;
            
            this.renderNavigation(navHtml);
            
        } catch (error) {
            await this.handleNavigationError(error);
        }
    }

    /**
     * Render navigation HTML and set active states
     */
    renderNavigation(navHtml) {
        this.navPlaceholder.innerHTML = navHtml;
        this.setActivePage();
        this.enhanceNavigationUX();
        this.notifyObservers('navigationLoaded');
    }

    /**
     * Handle navigation loading errors with retry logic
     */
    async handleNavigationError(error) {
        console.error('Navigation loading error:', error);
        
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`Retrying navigation load (${this.retryCount}/${this.maxRetries})...`);
            
            await this.retryWithDelay(() => this.loadNavigation());
        } else {
            this.renderFallbackNavigation();
        }
    }

    /**
     * Render a fallback navigation when loading fails
     */
    renderFallbackNavigation() {
        const fallbackNav = `
            <nav class="sidebar">
                <h1>Project Management Case Challenge</h1>
                <div class="error-message">
                    <p>Navigation temporarily unavailable</p>
                    <button onclick="location.reload()" class="button">Reload Page</button>
                </div>
            </nav>
        `;
        
        this.navPlaceholder.innerHTML = fallbackNav;
        this.addFallbackStyles();
    }

    /**
     * Add styles for fallback navigation
     */
    addFallbackStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .error-message {
                padding: var(--space-4);
                text-align: center;
                color: var(--gray-600);
                background: var(--gray-100);
                border-radius: var(--radius-lg);
                margin: var(--space-4);
            }
            .error-message button {
                margin-top: var(--space-3);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Set active page highlighting with improved logic
     */
    setActivePage() {
        const links = this.navPlaceholder.querySelectorAll('.sidebar a[href]');
        
        links.forEach(link => {
            link.classList.remove('active', 'active-parent');
            
            const href = link.getAttribute('href');
            
            if (href === this.currentPage) {
                link.classList.add('active');
                this.setActiveParents(link);
            }
        });
    }

    /**
     * Set active state for parent navigation items
     */
    setActiveParents(activeLink) {
        let parent = activeLink.closest('ul');
        
        while (parent && parent.classList.contains('sidebar') === false) {
            const parentLink = parent.previousElementSibling;
            
            if (parentLink && parentLink.tagName === 'A') {
                parentLink.classList.add('active-parent');
            }
            
            parent = parent.parentElement?.closest('ul');
        }
    }

    /**
     * Enhanced navigation UX with smooth interactions
     */
    enhanceNavigationUX() {
        const links = this.navPlaceholder.querySelectorAll('.sidebar a');
        
        links.forEach(link => {
            // Preload pages on hover for better performance
            link.addEventListener('mouseenter', this.preloadPage.bind(this), { once: true });
            
            // Enhanced click handling
            link.addEventListener('click', this.handleNavClick.bind(this));
            
            // Add hover sound effect trigger (optional)
            link.addEventListener('mouseenter', this.addHoverEffect.bind(this));
        });
    }

    /**
     * Preload page resources on hover
     */
    preloadPage(event) {
        const href = event.target.getAttribute('href');
        
        if (href && href.endsWith('.html') && href !== this.currentPage) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        }
    }

    /**
     * Handle navigation clicks with analytics and smooth transitions
     */
    handleNavClick(event) {
        const link = event.target;
        const href = link.getAttribute('href');
        
        // Track navigation for analytics (if available)
        if (window.gtag) {
            gtag('event', 'page_view', {
                page_title: link.textContent.trim(),
                page_location: href
            });
        }
        
        // Add loading state
        link.classList.add('loading');
        
        // Remove loading state after navigation
        setTimeout(() => {
            link.classList.remove('loading');
        }, 500);
    }

    /**
     * Add subtle hover effects
     */
    addHoverEffect(event) {
        const link = event.target;
        
        // Add ripple effect
        const ripple = document.createElement('span');
        ripple.className = 'nav-ripple';
        link.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Setup event listeners for the navigation system
     */
    setupEventListeners() {
        // Handle browser back/forward navigation
        window.addEventListener('popstate', () => {
            this.currentPage = this.getCurrentPage();
            this.setActivePage();
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.currentPage = this.getCurrentPage();
                this.setActivePage();
            }
        });

        // Handle hash changes for single-page sections
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add ARIA labels and roles
        const nav = this.navPlaceholder.querySelector('.sidebar');
        if (nav) {
            nav.setAttribute('role', 'navigation');
            nav.setAttribute('aria-label', 'Main navigation');
        }

        // Add skip link functionality
        this.addSkipLink();
        
        // Enhance keyboard navigation
        this.enhanceKeyboardNavigation();
    }

    /**
     * Add skip link for accessibility
     */
    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-600);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 1000;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add target for skip link
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.id = 'main-content';
            mainContent.setAttribute('tabindex', '-1');
        }
    }

    /**
     * Enhance keyboard navigation
     */
    enhanceKeyboardNavigation() {
        const links = this.navPlaceholder.querySelectorAll('.sidebar a');
        
        links.forEach((link, index) => {
            link.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    const nextLink = links[index + 1];
                    if (nextLink) nextLink.focus();
                }
                
                if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    const prevLink = links[index - 1];
                    if (prevLink) prevLink.focus();
                }
                
                if (event.key === 'Home') {
                    event.preventDefault();
                    links[0].focus();
                }
                
                if (event.key === 'End') {
                    event.preventDefault();
                    links[links.length - 1].focus();
                }
            });
        });
    }

    /**
     * Handle hash changes for single-page navigation
     */
    handleHashChange() {
        const hash = window.location.hash;
        if (hash) {
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    /**
     * Generic retry mechanism with exponential backoff
     */
    async retryWithDelay(fn) {
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fn();
    }

    /**
     * Observer pattern for navigation events
     */
    addObserver(callback) {
        this.observers.add(callback);
    }

    removeObserver(callback) {
        this.observers.delete(callback);
    }

    notifyObservers(event, data = null) {
        this.observers.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Observer callback error:', error);
            }
        });
    }

    /**
     * Generic error handler
     */
    handleError(message, error) {
        console.error(`NavigationManager: ${message}`, error);
        
        // Send error to monitoring service if available
        if (window.Sentry) {
            Sentry.captureException(error);
        }
    }

    /**
     * Public API methods
     */
    getCurrentPageName() {
        return this.currentPage;
    }

    refreshNavigation() {
        this.navCache = null;
        this.retryCount = 0;
        return this.loadNavigation();
    }

    destroy() {
        this.observers.clear();
        // Clean up event listeners would go here
    }
}

// Add CSS for navigation enhancements
const navStyles = document.createElement('style');
navStyles.textContent = `
    .nav-ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: nav-ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes nav-ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .sidebar a.loading {
        opacity: 0.7;
        pointer-events: none;
    }
    
    .sidebar a:focus {
        outline: 2px solid var(--primary-500);
        outline-offset: 2px;
    }
    
    @media (prefers-reduced-motion: reduce) {
        .nav-ripple {
            animation: none;
        }
    }
`;

document.head.appendChild(navStyles);

// Function to load external script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve(); // Script already loaded
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

// Initialize all components
async function initializeApp() {
    try {
        // Load navigation
        const navResponse = await fetch('nav.html');
        const navHtml = await navResponse.text();
        document.getElementById('nav-placeholder').innerHTML = navHtml;
        
        // Highlight current page in navigation
        highlightCurrentPage();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Initialize navigation system
const navigationManager = new NavigationManager();

// Export for external use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}

// Global reference for debugging
window.NavigationManager = navigationManager; 