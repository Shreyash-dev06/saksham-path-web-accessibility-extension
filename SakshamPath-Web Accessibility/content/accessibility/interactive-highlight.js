/**
 * Saksham Path - Interactive Elements Engine (Dynamic & Hover-Triggered)
 * Accurately detects and visually identifies standard HTML5 controls, ARIA interactive widgets,
 * custom clickable components, and newly revealed dynamic/hover submenus, mega-menus, and dropdowns.
 */
const SakshamPathInteractiveHighlight = {
  name: 'InteractiveHighlight',
  className: 'sp-interactive-element',
  isActive: false,
  observer: null,
  mutationTimer: null,
  delegatedHandler: null,
  scannedElements: new WeakSet(),

  // Standard and ARIA interactive selectors
  interactiveSelectors: [
    'a[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'summary',
    'option',
    'label[for]',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[role="combobox"]',
    '[role="listbox"]',
    '[role="slider"]',
    '[role="spinbutton"]',
    '[role="textbox"]',
    '[role="searchbox"]',
    '[role="treeitem"]',
    '[role="gridcell"]',
    '[onclick]',
    '[tabindex="0"]'
  ].join(', '),

  /**
   * Generates static CSS rules for interactive elements
   * @param {boolean} active
   * @returns {string}
   */
  generateCSS(active) {
    if (!active) return '';

    return `
      /* Saksham Path: Highlight Interactive Elements (Non-blocking) */
      body a[href]:not(#sakshampath-root *),
      body button:not(#sakshampath-root *),
      body input:not([type="hidden"]):not(#sakshampath-root *),
      body select:not(#sakshampath-root *),
      body textarea:not(#sakshampath-root *),
      body summary:not(#sakshampath-root *),
      body [role="button"]:not(#sakshampath-root *),
      body [role="link"]:not(#sakshampath-root *),
      body [role="checkbox"]:not(#sakshampath-root *),
      body [role="radio"]:not(#sakshampath-root *),
      body [role="switch"]:not(#sakshampath-root *),
      body [role="tab"]:not(#sakshampath-root *),
      body [role="menuitem"]:not(#sakshampath-root *),
      body [role="combobox"]:not(#sakshampath-root *),
      body [role="textbox"]:not(#sakshampath-root *),
      body [role="searchbox"]:not(#sakshampath-root *),
      body .${this.className} {
        outline: 2.5px solid #8b5cf6 !important;
        outline-offset: 2px !important;
        background-color: rgba(139, 92, 246, 0.1) !important;
        border-radius: 4px !important;
        box-shadow: 0 0 6px rgba(139, 92, 246, 0.35) !important;
      }
    `;
  },

  /**
   * Enable or disable interactive elements detection
   * @param {boolean} enable
   */
  set(enable) {
    if (enable) {
      this.enable();
    } else {
      this.disable();
    }
  },

  /**
   * Activate DOM scanner, event delegation, and mutation observer
   */
  enable() {
    if (this.isActive) return;
    this.isActive = true;

    // 1. Initial scan
    this.scanContainer(document.body || document.documentElement);

    // 2. Event delegation for hover menus, focus, click, and CSS transition reveals
    this.delegatedHandler = (e) => {
      if (!this.isActive || !e.target) return;
      const target = e.target;
      if (target.closest && target.closest('#sakshampath-root')) return;

      // Scan target and its parent menu container
      const container = target.closest('nav, [role="menu"], [role="menubar"], ul, ol, div, header') || target;
      this.scanContainer(container);
    };

    const rootDoc = document.body || document.documentElement;
    rootDoc.addEventListener('mouseover', this.delegatedHandler, { passive: true, capture: true });
    rootDoc.addEventListener('focusin', this.delegatedHandler, { passive: true, capture: true });
    rootDoc.addEventListener('click', this.delegatedHandler, { passive: true, capture: true });
    rootDoc.addEventListener('transitionend', this.delegatedHandler, { passive: true, capture: true });
    rootDoc.addEventListener('animationend', this.delegatedHandler, { passive: true, capture: true });

    // 3. Debounced MutationObserver for dynamic React/Vue SPA nodes
    if (!this.observer) {
      this.observer = new MutationObserver((mutations) => {
        if (!this.isActive) return;
        let hasAddedNodes = false;
        for (const m of mutations) {
          if (m.addedNodes && m.addedNodes.length > 0) {
            hasAddedNodes = true;
            m.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.scanContainer(node);
              }
            });
          }
        }
        if (hasAddedNodes) {
          clearTimeout(this.mutationTimer);
          this.mutationTimer = setTimeout(() => {
            this.scanContainer(document.body);
          }, 200);
        }
      });

      this.observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  },

  /**
   * Scan a specific container element and tag interactive items
   * @param {Element} container
   */
  scanContainer(container) {
    if (!this.isActive || !container || !container.querySelectorAll) return;

    try {
      // Check container itself
      if (this.isInteractiveElement(container)) {
        container.classList.add(this.className);
      }

      // Query interactive candidates within container
      const candidates = container.querySelectorAll(this.interactiveSelectors);
      candidates.forEach(el => {
        if (this.isInteractiveElement(el)) {
          el.classList.add(this.className);
        }
      });
    } catch (e) {
      console.debug('[Saksham Path:Interactive] Scan error:', e);
    }
  },

  /**
   * Validate if an element is genuinely interactive (not a massive layout container)
   * @param {Element} el
   * @returns {boolean}
   */
  isInteractiveElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.id === 'sakshampath-root' || (el.closest && el.closest('#sakshampath-root'))) return false;

    const tag = el.tagName.toLowerCase();
    // Exclude major layout tags
    if (['body', 'html', 'main', 'header', 'footer', 'nav', 'section', 'article', 'aside'].includes(tag)) {
      return false;
    }

    // Standard interactive elements are always valid
    if (['a', 'button', 'input', 'select', 'textarea', 'summary', 'option'].includes(tag)) {
      return true;
    }

    // ARIA interactive roles
    const role = el.getAttribute('role');
    const interactiveRoles = [
      'button', 'link', 'checkbox', 'radio', 'switch', 'tab',
      'menuitem', 'option', 'combobox', 'listbox', 'slider',
      'spinbutton', 'textbox', 'searchbox', 'treeitem', 'gridcell'
    ];
    if (role && interactiveRoles.includes(role.toLowerCase())) {
      return true;
    }

    // Clickable attributes & custom tab index
    if (el.hasAttribute('onclick') || (el.getAttribute('tabindex') === '0')) {
      // Avoid massive wrappers
      const rect = el.getBoundingClientRect();
      const vpArea = window.innerWidth * window.innerHeight;
      if (rect.width > 0 && rect.height > 0 && (rect.width * rect.height < vpArea * 0.45)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Deactivate and remove all tagged classes and listeners
   */
  disable() {
    this.isActive = false;

    const rootDoc = document.body || document.documentElement;
    if (this.delegatedHandler) {
      rootDoc.removeEventListener('mouseover', this.delegatedHandler, { capture: true });
      rootDoc.removeEventListener('focusin', this.delegatedHandler, { capture: true });
      rootDoc.removeEventListener('click', this.delegatedHandler, { capture: true });
      rootDoc.removeEventListener('transitionend', this.delegatedHandler, { capture: true });
      rootDoc.removeEventListener('animationend', this.delegatedHandler, { capture: true });
      this.delegatedHandler = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    clearTimeout(this.mutationTimer);

    // Remove tagged classes
    const tagged = document.querySelectorAll(`.${this.className}`);
    tagged.forEach(el => el.classList.remove(this.className));
  },

  /**
   * Reset
   */
  reset() {
    this.disable();
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathInteractiveHighlight = SakshamPathInteractiveHighlight;
}
