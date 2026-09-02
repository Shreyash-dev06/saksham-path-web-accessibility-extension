/**
 * Saksham Path - Letter Spacing Adjustment Engine
 * Enhances character spacing for improved legibility
 */
const SakshamPathLetterSpacing = {
  name: 'LetterSpacing',

  spacings: {
    '1': '1.5px !important',
    '2': '3.0px !important',
    '3': '4.5px !important'
  },

  /**
   * Generates CSS rules for letter spacing
   * @param {number} step
   * @returns {string}
   */
  generateCSS(step) {
    if (!step || step <= 0) return '';

    const spacing = this.spacings[String(step)] || '1.5px !important';

    return `
      /* Saksham Path: Letter Spacing Adjustment */
      body *:not(#sakshampath-root):not(#sakshampath-root *):not(svg):not(path) {
        letter-spacing: ${spacing};
      }
    `;
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathLetterSpacing = SakshamPathLetterSpacing;
}
