/**
 * Saksham Path - Grayscale Color Engine
 * Applies monochrome filter to host webpage content while preserving layout and the Saksham Path widget
 */
const SakshamPathGrayscale = {
  name: 'Grayscale',

  /**
   * Generates CSS rules for grayscale mode
   * @param {boolean} active
   * @returns {string}
   */
  generateCSS(active) {
    if (!active) return '';

    return `
      /* Saksham Path: Grayscale Mode */
      body > *:not(#sakshampath-root) {
        filter: grayscale(100%) !important;
      }
    `;
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathGrayscale = SakshamPathGrayscale;
}
