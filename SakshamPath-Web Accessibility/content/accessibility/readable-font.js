/**
 * Saksham Path - Readable Font Engine
 * Applies a dyslexia-friendly, high-legibility font stack to host text
 */
const SakshamPathReadableFont = {
  name: 'ReadableFont',

  /**
   * Generates CSS rules for readable dyslexia-friendly font stack
   * @param {boolean} active
   * @returns {string}
   */
  generateCSS(active) {
    if (!active) return '';

    return `
      /* Saksham Path: Dyslexia-Friendly Readable Font Stack */
      body *:not(#sakshampath-root):not(#sakshampath-root *):not(i):not(.fa):not([class*="icon"]):not(svg):not(path) {
        font-family: 'OpenDyslexic', 'Comic Sans MS', 'Trebuchet MS', Arial, -apple-system, BlinkMacSystemFont, sans-serif !important;
      }
    `;
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathReadableFont = SakshamPathReadableFont;
}
