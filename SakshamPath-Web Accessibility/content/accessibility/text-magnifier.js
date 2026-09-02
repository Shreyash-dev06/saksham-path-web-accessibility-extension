/**
 * Saksham Path - Text Magnifier Engine (Multi-Word Clear Preview)
 * Displays a high-contrast floating magnification preview window showing complete,
 * readable multi-word phrases and sentences near the pointer with zero layout shift.
 */
const SakshamPathTextMagnifier = {
  elementId: 'sp-text-magnifier-lens',
  isActive: false,
  lensEl: null,
  mouseMoveHandler: null,
  rafPending: false,
  currentX: 0,
  currentY: 0,

  /**
   * Enable or disable the magnifier
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
   * Activate magnifier
   */
  enable() {
    if (this.isActive) return;
    this.isActive = true;

    if (!this.lensEl) {
      this.lensEl = document.createElement('div');
      this.lensEl.id = this.elementId;
      this.lensEl.style.cssText = `
        position: fixed !important;
        width: 360px !important;
        max-width: 85vw !important;
        max-height: 160px !important;
        padding: 14px 18px !important;
        background: #0f172a !important;
        color: #ffff00 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 20px !important;
        font-weight: 600 !important;
        line-height: 1.45 !important;
        letter-spacing: 0.02em !important;
        word-spacing: normal !important;
        border-radius: 12px !important;
        border: 2.5px solid #2563eb !important;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5) !important;
        pointer-events: none !important;
        z-index: 2147483646 !important;
        display: none !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        word-wrap: break-word !important;
        transition: opacity 0.12s ease !important;
      `;
      (document.body || document.documentElement).appendChild(this.lensEl);
    }

    this.mouseMoveHandler = (e) => {
      this.currentX = e.clientX;
      this.currentY = e.clientY;

      if (!this.rafPending) {
        this.rafPending = true;
        requestAnimationFrame(() => {
          this.updateLens(e.target);
          this.rafPending = false;
        });
      }
    };

    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
  },

  /**
   * Update lens content and position
   * @param {Element} targetEl
   */
  updateLens(targetEl) {
    if (!this.lensEl || !this.isActive) return;

    if (targetEl && (targetEl.id === 'sakshampath-root' || targetEl.closest('#sakshampath-root'))) {
      this.lensEl.style.display = 'none';
      return;
    }

    // Extract meaningful multi-word sentence/phrase
    const text = this.extractMeaningfulText(targetEl);
    if (!text || text.length < 3) {
      this.lensEl.style.display = 'none';
      return;
    }

    // Truncate to clean readable limit
    const preview = text.length > 140 ? text.slice(0, 137) + '...' : text;
    this.lensEl.textContent = `🔍 ${preview}`;
    this.lensEl.style.display = 'block';

    // Position lens offset from cursor within viewport bounds
    const lensWidth = 360;
    const lensHeight = 90;
    let posX = this.currentX + 22;
    let posY = this.currentY + 24;

    // Flip horizontally if near right viewport edge
    if (posX + lensWidth > window.innerWidth - 12) {
      posX = this.currentX - lensWidth - 22;
    }
    // Flip vertically if near bottom viewport edge
    if (posY + lensHeight > window.innerHeight - 12) {
      posY = this.currentY - lensHeight - 24;
    }

    this.lensEl.style.left = `${Math.max(10, posX)}px`;
    this.lensEl.style.top = `${Math.max(10, posY)}px`;
  },

  /**
   * Extract meaningful sentence/phrase surrounding the hovered element
   * @param {Element} el
   * @returns {string}
   */
  extractMeaningfulText(el) {
    if (!el) return '';
    const tag = el.tagName ? el.tagName.toLowerCase() : '';

    // Ignore non-text media
    if (['img', 'video', 'canvas', 'svg', 'audio', 'iframe'].includes(tag)) {
      return '';
    }

    let text = el.textContent ? el.textContent.trim().replace(/\s+/g, ' ') : '';
    if (!text && el.parentElement) {
      text = el.parentElement.textContent ? el.parentElement.textContent.trim().replace(/\s+/g, ' ') : '';
    }

    return text;
  },

  /**
   * Deactivate
   */
  disable() {
    this.isActive = false;
    if (this.lensEl) {
      this.lensEl.remove();
      this.lensEl = null;
    }
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
  },

  /**
   * Reset
   */
  reset() {
    this.disable();
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathTextMagnifier = SakshamPathTextMagnifier;
}
