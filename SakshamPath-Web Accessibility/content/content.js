/**
 * Saksham Path - Content Script Entry Point
 * Executes in the context of host webpages (http / https)
 */
(function () {
  'use strict';

  // Guard against duplicate execution
  if (window.__SAKSHAMPATH_INITIALIZED__) {
    return;
  }
  window.__SAKSHAMPATH_INITIALIZED__ = true;

  let widgetInstance = null;

  async function initSakshamPath() {
    try {
      if (typeof SakshamPathWidget !== 'undefined') {
        widgetInstance = new SakshamPathWidget();
        await widgetInstance.init();
        console.info('[Saksham Path] Web Accessibility Assistant initialized successfully.');
      } else {
        console.error('[Saksham Path] SakshamPathWidget class is not defined.');
      }
    } catch (err) {
      console.error('[Saksham Path] Failed to initialize Saksham Path widget:', err);
    }
  }

  // Handle runtime messages from Extension Popup / Background
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === 'TOGGLE_PANEL') {
        if (widgetInstance) {
          widgetInstance.togglePanel();
          sendResponse({ status: 'ok', isOpen: widgetInstance.isOpen });
        }
      } else if (message && message.action === 'RESET_SETTINGS') {
        if (widgetInstance) {
          widgetInstance.handleResetAll();
          sendResponse({ status: 'ok' });
        }
      } else if (message && message.action === 'PING') {
        sendResponse({ status: 'active', initialized: true });
      }
      return true;
    });
  }

  // Mount when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSakshamPath);
  } else {
    initSakshamPath();
  }
})();
