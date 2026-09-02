/**
 * Saksham Path - Central Accessibility Orchestrator Manager
 * Consolidates typography, color/contrast, navigation, reading, and translation engines.
 */
const SakshamPathManager = {
  styleElementId: 'sakshampath-host-styles',

  /**
   * Apply all active accessibility settings onto the host page
   * @param {Object} settings
   */
  apply(settings) {
    if (!settings) return;

    let compiledCSS = `/* Saksham Path Live Accessibility Styles */\n`;

    // 1. Content & Typography Adjustments
    if (typeof SakshamPathFontSize !== 'undefined') {
      compiledCSS += SakshamPathFontSize.generateCSS(settings.fontSizeStep) + '\n';
    }
    if (typeof SakshamPathLineSpacing !== 'undefined') {
      compiledCSS += SakshamPathLineSpacing.generateCSS(settings.lineSpacingStep) + '\n';
    }
    if (typeof SakshamPathLetterSpacing !== 'undefined') {
      compiledCSS += SakshamPathLetterSpacing.generateCSS(settings.letterSpacingStep) + '\n';
    }
    if (typeof SakshamPathWordSpacing !== 'undefined') {
      compiledCSS += SakshamPathWordSpacing.generateCSS(settings.wordSpacingStep) + '\n';
    }
    if (typeof SakshamPathReadableFont !== 'undefined') {
      compiledCSS += SakshamPathReadableFont.generateCSS(settings.readableFont) + '\n';
    }

    // 2. Color & Contrast Adjustments
    if (typeof SakshamPathGrayscale !== 'undefined') {
      compiledCSS += SakshamPathGrayscale.generateCSS(settings.grayscale) + '\n';
    }
    if (typeof SakshamPathContrast !== 'undefined') {
      compiledCSS += SakshamPathContrast.generateCSS(settings.contrastMode) + '\n';
    }
    if (typeof SakshamPathSaturation !== 'undefined') {
      compiledCSS += SakshamPathSaturation.generateCSS(settings.saturationMode) + '\n';
    }

    // 3. Navigation & Interaction Tools
    if (typeof SakshamPathCursor !== 'undefined') {
      compiledCSS += SakshamPathCursor.generateCSS(settings.largeCursor) + '\n';
    }
    if (typeof SakshamPathInteractiveHighlight !== 'undefined') {
      compiledCSS += SakshamPathInteractiveHighlight.generateCSS(settings.interactiveHighlight) + '\n';
      SakshamPathInteractiveHighlight.set(!!settings.interactiveHighlight);
    }

    this.injectHostCSS(compiledCSS);

    // 4. Reading Assistance Engines (TTS, Ruler, Magnifier)
    if (typeof SakshamPathReadingGuide !== 'undefined') {
      SakshamPathReadingGuide.set(!!settings.readingGuide);
    }
    if (typeof SakshamPathTextMagnifier !== 'undefined') {
      SakshamPathTextMagnifier.set(!!settings.textMagnifier);
    }
    if (typeof SakshamPathSpeechManager !== 'undefined') {
      SakshamPathSpeechManager.setReadSelectedMode(!!settings.readSelected);
      SakshamPathSpeechManager.setRate(settings.speechRate || 1.0);
      SakshamPathSpeechManager.setLanguage(settings.speechLanguage || 'auto');
    }
  },

  /**
   * Injects or updates the host stylesheet in document head
   * @param {string} cssContent
   */
  injectHostCSS(cssContent) {
    let styleEl = document.getElementById(this.styleElementId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = this.styleElementId;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = cssContent;
  },

  /**
   * Reset all accessibility transformations, overlays, speech, translation, and host styles
   */
  reset() {
    const styleEl = document.getElementById(this.styleElementId);
    if (styleEl) {
      styleEl.textContent = '';
    }

    if (typeof SakshamPathInteractiveHighlight !== 'undefined') {
      SakshamPathInteractiveHighlight.reset();
    }
    if (typeof SakshamPathReadingGuide !== 'undefined') {
      SakshamPathReadingGuide.reset();
    }
    if (typeof SakshamPathTextMagnifier !== 'undefined') {
      SakshamPathTextMagnifier.reset();
    }
    if (typeof SakshamPathSpeechManager !== 'undefined') {
      SakshamPathSpeechManager.reset();
    }
    if (typeof SakshamPathTranslator !== 'undefined') {
      SakshamPathTranslator.reset();
    }
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathManager = SakshamPathManager;
}
