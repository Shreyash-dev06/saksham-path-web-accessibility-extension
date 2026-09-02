/**
 * Saksham Path - Non-Destructive Website Translator
 * Translates visible text nodes in-place across all 22 Scheduled Languages of India + English
 * without destroying DOM elements, event listeners, forms, React/Vue components, or layout.
 */
const SakshamPathTranslator = {
  name: 'Translator',
  isTranslating: false,
  isTranslated: false,
  currentLanguage: 'en',
  originalTextMap: new WeakMap(),
  modifiedNodes: new Set(),
  translationCache: new Map(),
  observer: null,

  /**
   * Translates the meaningful visible webpage text into the target Indian language
   * @param {string} targetLang (e.g. 'hi', 'mr', 'bn', 'ta', 'te', 'gu', 'kn', 'ml', 'pa', 'ur', etc.)
   * @param {Function} onProgress callback for UI status updates
   * @returns {Promise<boolean>}
   */
  async translatePage(targetLang = 'hi', onProgress = null) {
    if (this.isTranslating) return false;
    this.isTranslating = true;
    this.currentLanguage = targetLang;

    try {
      // 1. Gather all meaningful visible text nodes
      const textNodes = this.extractTranslatableTextNodes();
      if (!textNodes.length) {
        this.isTranslating = false;
        return false;
      }

      // 2. Filter nodes with meaningful text (> 1 character, not pure symbols/numbers)
      const validNodes = textNodes.filter(node => {
        const txt = node.nodeValue.trim();
        return txt.length > 1 && /[^\d\s\p{P}]/u.test(txt);
      });

      const total = validNodes.length;
      let completed = 0;

      // 3. Batch process nodes in chunks to minimize network requests
      const batchSize = 10;
      for (let i = 0; i < validNodes.length; i += batchSize) {
        const batch = validNodes.slice(i, i + batchSize);
        await Promise.all(batch.map(async (node) => {
          const original = node.nodeValue;
          // Store original text if not already stored
          if (!this.originalTextMap.has(node)) {
            this.originalTextMap.set(node, original);
            this.modifiedNodes.add(node);
          }

          const trimmed = original.trim();
          const translated = await this.translateText(trimmed, targetLang);
          if (translated && translated !== trimmed) {
            // Preserve leading and trailing whitespace of the original node
            const leadingSpace = original.match(/^\s*/)[0] || '';
            const trailingSpace = original.match(/\s*$/)[0] || '';
            node.nodeValue = `${leadingSpace}${translated}${trailingSpace}`;
          }
          completed++;
        }));

        if (onProgress) {
          onProgress({ completed, total, done: false });
        }
      }

      this.isTranslated = true;
      this.isTranslating = false;
      if (onProgress) {
        onProgress({ completed: total, total, done: true });
      }

      // 4. Setup scoped observer for dynamic nodes added while translation is active
      this.setupDynamicObserver(targetLang);

      return true;
    } catch (err) {
      console.error('[Saksham Path:Translator] Translation error:', err);
      this.isTranslating = false;
      return false;
    }
  },

  /**
   * Core translation client calling client-safe endpoint with in-memory caching
   * @param {string} text
   * @param {string} targetLang
   * @returns {Promise<string>}
   */
  async translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;

    const cacheKey = `${targetLang}:${text}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey);
    }

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (!response.ok) return text;

      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(item => (item && item[0] ? item[0] : '')).join('');
        if (translated) {
          this.translationCache.set(cacheKey, translated);
          return translated;
        }
      }
      return text;
    } catch (e) {
      // Fallback cleanly on network failure
      return text;
    }
  },

  /**
   * Restores all modified text nodes to their pristine original state without page reload
   */
  restoreOriginal() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.modifiedNodes.forEach(node => {
      if (this.originalTextMap.has(node)) {
        node.nodeValue = this.originalTextMap.get(node);
      }
    });

    this.modifiedNodes.clear();
    this.isTranslated = false;
    this.isTranslating = false;
    this.currentLanguage = 'en';
  },

  /**
   * Traverses DOM and extracts translatable leaf text nodes, strictly avoiding
   * script, style, code, input values, hidden nodes, and the Saksham Path UI.
   * @returns {Text[]}
   */
  extractTranslatableTextNodes() {
    const textNodes = [];
    const ignoredTags = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'CODE', 'PRE', 'KBD', 'SAMP', 'VAR',
      'TEXTAREA', 'INPUT', 'SELECT', 'IFRAME', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO'
    ]);

    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node || !node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          // Never translate inside Saksham Path UI
          if (parent.id === 'sakshampath-root' || parent.closest('#sakshampath-root')) {
            return NodeFilter.FILTER_REJECT;
          }

          // Ignore code, script, input, style tags
          if (ignoredTags.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Check translate="no" attribute or hidden elements
          if (parent.getAttribute('translate') === 'no' || parent.closest('[translate="no"]')) {
            return NodeFilter.FILTER_REJECT;
          }

          if (parent.hasAttribute('hidden') || parent.getAttribute('aria-hidden') === 'true') {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currentNode;
    while ((currentNode = walker.nextNode())) {
      textNodes.push(currentNode);
    }

    return textNodes;
  },

  /**
   * Observer for dynamic content added while translation is active
   */
  setupDynamicObserver(targetLang) {
    if (this.observer) {
      this.observer.disconnect();
    }

    let debounceTimer;
    this.observer = new MutationObserver((mutations) => {
      if (!this.isTranslated) return;

      let hasNewNodes = false;
      mutations.forEach(m => {
        if (m.addedNodes && m.addedNodes.length > 0) {
          m.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && (!node.closest || !node.closest('#sakshampath-root'))) {
              hasNewNodes = true;
            }
          });
        }
      });

      if (hasNewNodes) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.translatePage(targetLang);
        }, 400);
      }
    });

    this.observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  },

  /**
   * Reset
   */
  reset() {
    this.restoreOriginal();
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathTranslator = SakshamPathTranslator;
}
