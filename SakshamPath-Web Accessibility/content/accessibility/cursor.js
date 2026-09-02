/**
 * Saksham Path - Large Cursor Engine
 * Provides a high-visibility, large SVG cursor across host webpages
 */
const SakshamPathCursor = {
  name: 'Cursor',

  // High-visibility large black and yellow arrow cursor SVG encoded in URI
  cursorDataURI: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 32 32"><path fill="%23ffff00" stroke="%23000000" stroke-width="2" stroke-linejoin="round" d="M3 3l9 22 4-8 8-4z"/><circle cx="5" cy="5" r="2" fill="%23000000"/></svg>`,
  pointerDataURI: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 32 32"><path fill="%23ffff00" stroke="%23000000" stroke-width="2" stroke-linejoin="round" d="M10 2v14l-4-4-2 2 8 8 8-8-2-2-4 4V2z"/></svg>`,

  /**
   * Generates CSS rules for large cursor
   * @param {boolean} active
   * @returns {string}
   */
  generateCSS(active) {
    if (!active) return '';

    return `
      /* Saksham Path: Large High-Visibility Cursor */
      html:not(#sakshampath-root),
      body:not(#sakshampath-root),
      body *:not(#sakshampath-root):not(#sakshampath-root *) {
        cursor: url('${this.cursorDataURI}') 2 2, auto !important;
      }
      body a:not(#sakshampath-root):not(#sakshampath-root *),
      body button:not(#sakshampath-root):not(#sakshampath-root *),
      body [role="button"]:not(#sakshampath-root):not(#sakshampath-root *),
      body input:not(#sakshampath-root):not(#sakshampath-root *) {
        cursor: url('${this.pointerDataURI}') 2 2, pointer !important;
      }
    `;
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathCursor = SakshamPathCursor;
}
