/**
 * Saksham Path - Storage Utility
 * Manages user accessibility preferences, language selections, and button position across sessions
 */
const SakshamPathStorage = {
  /**
   * Consolidated state configuration for Saksham Path
   */
  defaults: {
    enabled: true,
    // Button positioning
    buttonSide: 'right', // 'left' or 'right'
    buttonVerticalPosition: 50, // Percentage from top (0% to 100%)
    
    // Language & Translation
    extensionLanguage: 'en', // 'en', 'hi', 'mr', 'bn', 'ta', 'te', 'ur', etc.
    translationTargetLanguage: 'hi', // 'hi', 'mr', 'bn', etc.
    speechLanguage: 'auto', // 'auto', 'hi-IN', 'en-IN', 'mr-IN', 'ta-IN', etc.

    // Content & Typography Adjustments
    fontSizeStep: 0, // -2 (80%) to 5 (150%)
    lineSpacingStep: 0, // 0: Normal, 1: 1.6x, 2: 1.9x, 3: 2.2x
    letterSpacingStep: 0, // 0: Normal, 1: 1.5px, 2: 3.0px, 3: 4.5px
    wordSpacingStep: 0, // 0: Normal, 1: 3px, 2: 6px, 3: 9px
    readableFont: false, // Dyslexia-friendly readable font stack

    // Color & Contrast
    grayscale: false,
    contrastMode: 'none', // 'none', 'high', 'dark', 'bright'
    saturationMode: 'none', // 'none', 'high', 'low'

    // Navigation & Interaction
    interactiveHighlight: false,
    largeCursor: false,

    // Reading Assistance
    readSelected: false,
    readingGuide: false,
    textMagnifier: false,
    speechRate: 1.0 // 0.75, 1.0, 1.25, 1.5, 1.75, 2.0
  },

  /**
   * Retrieve stored preferences merged with defaults
   * @returns {Promise<Object>}
   */
  async getSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['sakshampath_settings'], (result) => {
          if (chrome.runtime.lastError) {
            console.warn('[Saksham Path] Error reading storage:', chrome.runtime.lastError);
            resolve(JSON.parse(JSON.stringify(this.defaults)));
          } else {
            const saved = result && result.sakshampath_settings ? result.sakshampath_settings : {};
            const merged = this._deepMerge(this.defaults, saved);
            resolve(merged);
          }
        });
      } else {
        try {
          const raw = localStorage.getItem('sakshampath_settings');
          const saved = raw ? JSON.parse(raw) : {};
          resolve(this._deepMerge(this.defaults, saved));
        } catch {
          resolve(JSON.parse(JSON.stringify(this.defaults)));
        }
      }
    });
  },

  /**
   * Save updated preferences
   * @param {Object} settings
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ sakshampath_settings: settings }, () => {
          if (chrome.runtime.lastError) {
            console.warn('[Saksham Path] Error saving storage:', chrome.runtime.lastError);
          }
          resolve();
        });
      } else {
        try {
          localStorage.setItem('sakshampath_settings', JSON.stringify(settings));
        } catch (e) {
          console.warn('[Saksham Path] LocalStorage error:', e);
        }
        resolve();
      }
    });
  },

  /**
   * Reset all accessibility settings back to default
   * @param {boolean} preserveButtonPosition
   * @returns {Promise<Object>}
   */
  async resetSettings(preserveButtonPosition = true) {
    const current = await this.getSettings();
    const defaults = JSON.parse(JSON.stringify(this.defaults));
    
    if (preserveButtonPosition) {
      defaults.buttonSide = current.buttonSide || 'right';
      defaults.buttonVerticalPosition = current.buttonVerticalPosition ?? 50;
    }
    
    await this.saveSettings(defaults);
    return defaults;
  },

  _deepMerge(target, source) {
    const output = Object.assign({}, target);
    if (this._isObject(target) && this._isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this._isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this._deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  },

  _isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathStorage = SakshamPathStorage;
}
