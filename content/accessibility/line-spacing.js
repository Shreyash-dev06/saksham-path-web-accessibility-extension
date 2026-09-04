/**
 * Saksham Path - Line Spacing Adjustment Engine
 * Enhances line-height across text paragraphs, articles, and readable content
 */
const SakshamPathLineSpacing = {
  name: 'LineSpacing',

  lineHeights: {
    '1': '1.6 !important',
    '2': '1.9 !important',
    '3': '2.2 !important'
  },

  /**
   * Generates CSS rules for line height
   * @param {number} step
   * @returns {string}
   */
  generateCSS(step) {
    if (!step || step <= 0) return '';

    const lh = this.lineHeights[String(step)] || '1.6 !important';

    return `
      /* Saksham Path: Line Spacing Adjustment */
      body *:not(#sakshampath-root):not(#sakshampath-root *):not(button):not(input):not(select):not(textarea):not(svg):not(path) {
        line-height: ${lh};
      }
    `;
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathLineSpacing = SakshamPathLineSpacing;
}
