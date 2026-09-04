/**
 * Saksham Path - Reading Guide (Ruler) Engine
 * Injects a smooth, mouse-following horizontal reading bar to assist line-by-line reading
 */
const SakshamPathReadingGuide = {
  elementId: 'sp-reading-guide-strip',
  isActive: false,
  guideEl: null,
  mouseMoveHandler: null,
  rafPending: false,
  currentY: 0,

  /**
   * Enable or disable reading guide
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
   * Activate reading guide
   */
  enable() {
    if (this.isActive) return;
    this.isActive = true;

    // Create reading guide strip element if not exists
    if (!this.guideEl) {
      this.guideEl = document.createElement('div');
      this.guideEl.id = this.elementId;
      this.guideEl.style.cssText = `
        position: fixed !important;
        left: 0 !important;
        right: 0 !important;
        width: 100vw !important;
        height: 38px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        background-color: rgba(254, 240, 138, 0.35) !important;
        border-top: 2px solid #eab308 !important;
        border-bottom: 2px solid #eab308 !important;
        pointer-events: none !important;
        z-index: 2147483638 !important;
        box-shadow: 0 0 16px rgba(234, 179, 8, 0.25) !important;
        transition: opacity 0.15s ease !important;
      `;
      (document.body || document.documentElement).appendChild(this.guideEl);
    } else {
      this.guideEl.style.display = 'block';
    }

    // Throttled mouse move listener using requestAnimationFrame
    this.mouseMoveHandler = (e) => {
      this.currentY = e.clientY;
      if (!this.rafPending) {
        this.rafPending = true;
        requestAnimationFrame(() => {
          if (this.guideEl && this.isActive) {
            this.guideEl.style.top = `${this.currentY}px`;
          }
          this.rafPending = false;
        });
      }
    };

    window.addEventListener('mousemove', this.mouseMoveHandler, { passive: true });
  },

  /**
   * Deactivate reading guide
   */
  disable() {
    this.isActive = false;
    if (this.guideEl) {
      this.guideEl.remove();
      this.guideEl = null;
    }
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
  },

  /**
   * Full reset
   */
  reset() {
    this.disable();
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathReadingGuide = SakshamPathReadingGuide;
}
