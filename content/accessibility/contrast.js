/**
 * Saksham Path - Contrast Engine
 * Provides targeted, non-destructive High Contrast, Dark Mode Contrast, and Bright Mode Contrast
 * while strictly preserving images, videos, canvas, SVGs, logos, icons, and third-party widgets.
 */
const SakshamPathContrast = {
  name: 'Contrast',

  /**
   * Generates targeted CSS rules based on active contrast mode
   * @param {'none'|'high'|'dark'|'bright'} mode
   * @returns {string}
   */
  generateCSS(mode) {
    if (!mode || mode === 'none') return '';

    // Selector for preserved media elements that must NEVER be inverted or distorted
    const preservedMedia = `
      body img:not(#sakshampath-root *),
      body picture:not(#sakshampath-root *),
      body video:not(#sakshampath-root *),
      body canvas:not(#sakshampath-root *),
      body svg:not(#sakshampath-root *),
      body [style*="background-image"]:not(#sakshampath-root *),
      body iframe:not(#sakshampath-root *)
    `;

    if (mode === 'high') {
      return `
        /* Saksham Path: Non-Destructive High Contrast Mode */
        html:not(#sakshampath-root), 
        body:not(#sakshampath-root) {
          background-color: #000000 !important;
          color: #ffff00 !important;
        }
        body *:not(#sakshampath-root):not(#sakshampath-root *):not(img):not(video):not(canvas):not(svg):not(svg *):not(picture):not(iframe) {
          background-color: #000000 !important;
          color: #ffff00 !important;
          border-color: #ffffff !important;
          box-shadow: none !important;
          text-shadow: none !important;
        }
        body a:not(#sakshampath-root *):not(img) {
          color: #00ffff !important;
          text-decoration: underline !important;
        }
        body button:not(#sakshampath-root *),
        body input:not(#sakshampath-root *),
        body select:not(#sakshampath-root *),
        body textarea:not(#sakshampath-root *) {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
          border: 2px solid #ffff00 !important;
        }
        ${preservedMedia} {
          background-color: transparent !important;
          opacity: 1 !important;
          filter: none !important;
        }
      `;
    }

    if (mode === 'dark') {
      return `
        /* Saksham Path: Non-Destructive Dark Contrast Mode */
        html:not(#sakshampath-root), 
        body:not(#sakshampath-root) {
          background-color: #0f172a !important;
          color: #f8fafc !important;
        }
        body *:not(#sakshampath-root):not(#sakshampath-root *):not(img):not(video):not(canvas):not(svg):not(svg *):not(picture):not(iframe) {
          background-color: inherit;
          color: #f1f5f9 !important;
          border-color: #334155 !important;
        }
        body div:not(#sakshampath-root *):not(img),
        body section:not(#sakshampath-root *),
        body article:not(#sakshampath-root *),
        body main:not(#sakshampath-root *),
        body header:not(#sakshampath-root *),
        body footer:not(#sakshampath-root *),
        body nav:not(#sakshampath-root *),
        body aside:not(#sakshampath-root *),
        body ul:not(#sakshampath-root *),
        body table:not(#sakshampath-root *) {
          background-color: #1e293b !important;
        }
        body a:not(#sakshampath-root *) {
          color: #38bdf8 !important;
        }
        body button:not(#sakshampath-root *),
        body input:not(#sakshampath-root *),
        body select:not(#sakshampath-root *),
        body textarea:not(#sakshampath-root *) {
          background-color: #334155 !important;
          color: #ffffff !important;
          border: 1px solid #475569 !important;
        }
        ${preservedMedia} {
          background-color: transparent !important;
          opacity: 1 !important;
          filter: none !important;
        }
      `;
    }

    if (mode === 'bright') {
      return `
        /* Saksham Path: Non-Destructive Bright Contrast Mode */
        html:not(#sakshampath-root), 
        body:not(#sakshampath-root) {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        body *:not(#sakshampath-root):not(#sakshampath-root *):not(img):not(video):not(canvas):not(svg):not(svg *):not(picture):not(iframe) {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #000000 !important;
        }
        body a:not(#sakshampath-root *) {
          color: #0000ee !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }
        body button:not(#sakshampath-root *),
        body input:not(#sakshampath-root *),
        body select:not(#sakshampath-root *) {
          background-color: #f8fafc !important;
          color: #000000 !important;
          border: 2px solid #000000 !important;
        }
        ${preservedMedia} {
          background-color: transparent !important;
          opacity: 1 !important;
          filter: none !important;
        }
      `;
    }

    return '';
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathContrast = SakshamPathContrast;
}
