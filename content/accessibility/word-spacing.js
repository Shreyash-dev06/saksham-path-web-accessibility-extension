/**
 * Saksham Path - Word Spacing Adjustment Engine
 * Enhances word separation to reduce visual crowding
 */
const SakshamPathWordSpacing = {
  name: 'WordSpacing',

  spacings: {
    '1': '3px !important',
    '2': '6px !important',
    '3': '9px !important'
  },

  /**
   * Generates CSS rules for word spacing
   * @param {number} step
   * @returns {string}
   */
  generateCSS(step) {
    if (!step || step <= 0) return '';

    const spacing = this.spacings[String(step)] || '3px !important';

    return `
      /* Saksham Path: Word Spacing Adjustment */
      body *:not(#sakshampath-root):not(#sakshampath-root *):not(svg):not(path) {
        word-spacing: ${spacing};
      }
    `;
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathWordSpacing = SakshamPathWordSpacing;
}
