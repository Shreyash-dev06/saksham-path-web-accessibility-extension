/**
 * Saksham Path - Font Size Adjustment Engine
 * Proportional, collision-free typography scaling targeting readable host elements
 * with matching line-height and preserved word spacing.
 */
const SakshamPathFontSize = {
  name: 'FontSize',

  // Percentages and corresponding multipliers for steps -2 to 5
  scales: {
    '-2': { pct: '80%', mult: 0.80, lh: 1.35 },
    '-1': { pct: '90%', mult: 0.90, lh: 1.40 },
    '0':  { pct: '100%', mult: 1.00, lh: 1.50 },
    '1':  { pct: '110%', mult: 1.10, lh: 1.55 },
    '2':  { pct: '120%', mult: 1.20, lh: 1.60 },
    '3':  { pct: '130%', mult: 1.30, lh: 1.65 },
    '4':  { pct: '140%', mult: 1.40, lh: 1.70 },
    '5':  { pct: '150%', mult: 1.50, lh: 1.75 }
  },

  /**
   * Generates CSS rules for font scaling without text collisions or word joins
   * @param {number} step
   * @returns {string}
   */
  generateCSS(step) {
    if (step === 0 || step === undefined || step === null) {
      return '';
    }

    const scale = this.scales[String(step)] || this.scales['0'];
    const mult = scale.mult;
    const lh = scale.lh;

    return `
      /* Saksham Path: Non-Colliding Font Size Scaling (${scale.pct}) */
      :root {
        --sp-font-multiplier: ${mult};
      }

      /* Base paragraph and readable block text */
      body p:not(#sakshampath-root *),
      body li:not(#sakshampath-root *),
      body dt:not(#sakshampath-root *),
      body dd:not(#sakshampath-root *),
      body blockquote:not(#sakshampath-root *),
      body label:not(#sakshampath-root *),
      body td:not(#sakshampath-root *),
      body th:not(#sakshampath-root *),
      body figcaption:not(#sakshampath-root *) {
        font-size: calc(1em * ${mult}) !important;
        line-height: ${lh} !important;
        word-spacing: normal !important;
        white-space: normal;
      }

      /* Headings scaling with proportional line-heights */
      body h1:not(#sakshampath-root *) {
        font-size: calc(2.0em * ${mult}) !important;
        line-height: calc(1.2 * ${lh}) !important;
        word-spacing: normal !important;
      }
      body h2:not(#sakshampath-root *) {
        font-size: calc(1.6em * ${mult}) !important;
        line-height: calc(1.25 * ${lh}) !important;
        word-spacing: normal !important;
      }
      body h3:not(#sakshampath-root *) {
        font-size: calc(1.35em * ${mult}) !important;
        line-height: calc(1.3 * ${lh}) !important;
        word-spacing: normal !important;
      }
      body h4:not(#sakshampath-root *),
      body h5:not(#sakshampath-root *),
      body h6:not(#sakshampath-root *) {
        font-size: calc(1.15em * ${mult}) !important;
        line-height: calc(1.35 * ${lh}) !important;
        word-spacing: normal !important;
      }

      /* Inline spans and anchors inside readable blocks */
      body p span:not(#sakshampath-root *):not([class*="icon"]):not(svg *),
      body li span:not(#sakshampath-root *):not([class*="icon"]):not(svg *),
      body article span:not(#sakshampath-root *):not([class*="icon"]):not(svg *),
      body a:not(#sakshampath-root *):not([class*="btn"]):not([class*="button"]):not([class*="icon"]) {
        word-spacing: normal !important;
      }
    `;
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathFontSize = SakshamPathFontSize;
}
