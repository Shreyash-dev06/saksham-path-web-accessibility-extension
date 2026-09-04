/**
 * Saksham Path - Centralized Speech Synthesis Manager (Indian Languages & Hindi Support)
 * Handles persistent Read Selected mode, semantic Read Page extraction, Indic script detection,
 * browser voice matching for Indian languages, session token invalidation, and rate scaling.
 */
const SakshamPathSpeechManager = {
  name: 'SpeechManager',
  synth: typeof window !== 'undefined' ? window.speechSynthesis : null,
  currentSessionId: 0,
  status: 'idle', // 'idle' | 'reading' | 'paused' | 'stopped'
  rate: 1.0,
  languageMode: 'auto', // 'auto' or BCP-47 like 'hi-IN', 'en-IN', 'mr-IN', 'ta-IN', etc.
  voices: [],
  listeners: new Set(),
  voiceNotFoundListener: null,

  // Persistent Read Selected mode state
  isReadSelectedMode: false,
  selectionDebounceTimer: null,
  selectionHandler: null,
  lastReadSelection: '',

  // Queue state for sequential chunking
  currentChunks: [],
  currentChunkIndex: 0,

  /**
   * Initialize voices and async voice loader
   */
  init() {
    if (!this.synth) return;

    const loadVoices = () => {
      this.voices = this.synth.getVoices() || [];
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  },

  /**
   * Subscribe to status changes
   * @param {Function} cb
   */
  onStatus(cb) {
    this.listeners.add(cb);
  },

  /**
   * Register voice not found notification listener
   * @param {Function} cb
   */
  onVoiceNotFound(cb) {
    this.voiceNotFoundListener = cb;
  },

  /**
   * Update status and notify subscribers
   * @param {string} newStatus
   */
  setStatus(newStatus) {
    this.status = newStatus;
    this.listeners.forEach(cb => {
      try { cb(this.status); } catch {}
    });
  },

  /**
   * Set speech language mode ('auto' or specific speech code like 'hi-IN')
   * @param {string} lang
   */
  setLanguage(lang) {
    this.languageMode = lang || 'auto';
  },

  /**
   * Set live speech rate
   * @param {number} rate (0.75 - 2.0)
   */
  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.5, rate || 1.0));
  },

  /**
   * Toggle or set persistent Read Selected mode
   * @param {boolean} enable
   */
  setReadSelectedMode(enable) {
    this.isReadSelectedMode = !!enable;

    if (this.isReadSelectedMode) {
      this.enableSelectionListener();
    } else {
      this.disableSelectionListener();
      if (this.status === 'reading') {
        this.stop();
      }
    }
  },

  /**
   * Attach debounced selection change listener across the document
   */
  enableSelectionListener() {
    if (this.selectionHandler) return;

    this.selectionHandler = () => {
      if (!this.isReadSelectedMode) return;

      clearTimeout(this.selectionDebounceTimer);
      this.selectionDebounceTimer = setTimeout(() => {
        this.handleAutoReadSelection();
      }, 350);
    };

    document.addEventListener('selectionchange', this.selectionHandler, { passive: true });
    document.addEventListener('mouseup', this.selectionHandler, { passive: true });
    document.addEventListener('keyup', this.selectionHandler, { passive: true });
  },

  /**
   * Detach selection change listeners
   */
  disableSelectionListener() {
    if (this.selectionHandler) {
      document.removeEventListener('selectionchange', this.selectionHandler);
      document.removeEventListener('mouseup', this.selectionHandler);
      document.removeEventListener('keyup', this.selectionHandler);
      this.selectionHandler = null;
    }
    clearTimeout(this.selectionDebounceTimer);
    this.lastReadSelection = '';
  },

  /**
   * Automatically speak newly stabilized text selection
   */
  handleAutoReadSelection() {
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    // Ignore selections made inside the Saksham Path UI
    if (selection.anchorNode) {
      const parent = selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? selection.anchorNode
        : selection.anchorNode.parentElement;
      if (parent && (parent.id === 'sakshampath-root' || parent.closest('#sakshampath-root'))) {
        return;
      }
    }

    if (text === this.lastReadSelection && this.status === 'reading') {
      return;
    }

    this.lastReadSelection = text;
    this.speakText(text, 'selection');
  },

  /**
   * Read entire meaningful page content
   * @returns {string|null} error message or null on success
   */
  readPage() {
    if (!this.synth) return 'Speech synthesis is not supported in this browser.';

    const text = this.extractSemanticPageText();
    if (!text) {
      return 'No readable text content found on this page.';
    }

    this.speakText(text, 'page');
    return null;
  },

  /**
   * Core Speech Engine: speaks text with sequential chunking & session token invalidation
   * @param {string} text
   * @param {'page'|'selection'} mode
   */
  speakText(text, mode = 'page') {
    if (!this.synth) return;

    // 1. Invalidate previous speech session
    const sessionId = ++this.currentSessionId;
    this.synth.cancel();

    // 2. Controlled chunking (sentences/paragraphs <= 200 chars)
    this.currentChunks = this.chunkText(text);
    if (!this.currentChunks.length) {
      this.setStatus('idle');
      return;
    }

    this.currentChunkIndex = 0;
    this.setStatus('reading');

    // 3. Determine target language and matching voice
    const targetLangCode = this.resolveLanguageCode(text);
    const matchedVoice = this.findMatchingVoice(targetLangCode);

    // If manual language selected but no voice available on device, notify user
    if (this.languageMode !== 'auto' && !matchedVoice && this.voiceNotFoundListener) {
      this.voiceNotFoundListener(targetLangCode);
    }

    // 4. Sequential utterance player
    const playNextChunk = () => {
      if (sessionId !== this.currentSessionId || this.status === 'stopped' || this.status === 'idle') {
        return;
      }

      if (this.currentChunkIndex >= this.currentChunks.length) {
        this.setStatus('idle');
        return;
      }

      const chunkText = this.currentChunks[this.currentChunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = this.rate;
      utterance.lang = targetLangCode;

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        if (sessionId !== this.currentSessionId) return;
        this.currentChunkIndex++;
        playNextChunk();
      };

      utterance.onerror = (e) => {
        if (sessionId !== this.currentSessionId) return;
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }
        console.warn('[Saksham Path:TTS] Utterance error:', e);
        this.currentChunkIndex++;
        playNextChunk();
      };

      this.synth.speak(utterance);
    };

    playNextChunk();
  },

  /**
   * Resolves language code using Auto Detect (Indic scripts) or manual selection
   * @param {string} sampleText
   * @returns {string} BCP-47 language tag
   */
  resolveLanguageCode(sampleText) {
    if (this.languageMode && this.languageMode !== 'auto') {
      return this.languageMode;
    }

    // Auto Detect based on Unicode script ranges
    if (/[\u0900-\u097F]/.test(sampleText)) {
      return 'hi-IN'; // Devanagari (Hindi/Marathi/Sanskrit/Nepali)
    }
    if (/[\u0980-\u09FF]/.test(sampleText)) {
      return 'bn-IN'; // Bengali / Assamese
    }
    if (/[\u0A00-\u0A7F]/.test(sampleText)) {
      return 'pa-IN'; // Gurmukhi (Punjabi)
    }
    if (/[\u0A80-\u0AFF]/.test(sampleText)) {
      return 'gu-IN'; // Gujarati
    }
    if (/[\u0B00-\u0B7F]/.test(sampleText)) {
      return 'or-IN'; // Odia
    }
    if (/[\u0B80-\u0BFF]/.test(sampleText)) {
      return 'ta-IN'; // Tamil
    }
    if (/[\u0C00-\u0C7F]/.test(sampleText)) {
      return 'te-IN'; // Telugu
    }
    if (/[\u0C80-\u0CFF]/.test(sampleText)) {
      return 'kn-IN'; // Kannada
    }
    if (/[\u0D00-\u0D7F]/.test(sampleText)) {
      return 'ml-IN'; // Malayalam
    }
    if (/[\u0600-\u06FF]/.test(sampleText)) {
      return 'ur-IN'; // Urdu / Arabic
    }

    // Default to Indian English or page document language
    const docLang = document.documentElement.lang;
    if (docLang && docLang.startsWith('hi')) return 'hi-IN';
    return 'en-IN';
  },

  /**
   * Find matching browser speech synthesis voice
   * @param {string} langCode
   * @returns {SpeechSynthesisVoice|null}
   */
  findMatchingVoice(langCode) {
    if (!this.voices || !this.voices.length) {
      this.voices = this.synth ? this.synth.getVoices() || [] : [];
    }

    const shortCode = langCode.slice(0, 2).toLowerCase();

    // 1. Exact match (e.g. 'hi-IN' or 'en-IN')
    let match = this.voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === langCode.toLowerCase());
    if (match) return match;

    // 2. Prefix match (e.g. any 'hi' voice or 'en' voice)
    match = this.voices.find(v => v.lang && v.lang.toLowerCase().startsWith(shortCode));
    if (match) return match;

    // 3. Indian English fallback for English
    if (shortCode === 'en') {
      match = this.voices.find(v => v.lang && (v.lang.includes('en-IN') || v.lang.includes('en-US') || v.lang.includes('en-GB')));
      if (match) return match;
    }

    return null;
  },

  /**
   * Pause active speech
   */
  pause() {
    if (this.synth && this.status === 'reading') {
      this.synth.pause();
      this.setStatus('paused');
    }
  },

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synth && this.status === 'paused') {
      this.synth.resume();
      this.setStatus('reading');
    }
  },

  /**
   * Stop speech completely and clear queue
   */
  stop() {
    this.currentSessionId++;
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentChunks = [];
    this.currentChunkIndex = 0;
    this.setStatus('stopped');
    setTimeout(() => {
      if (this.status === 'stopped') this.setStatus('idle');
    }, 400);
  },

  /**
   * Semantic extractor prioritizing <main>, <article>, and readable text blocks
   */
  extractSemanticPageText() {
    const prioritySelectors = [
      'main',
      '[role="main"]',
      'article',
      '.article',
      '.post-content',
      '#content',
      '#main-content',
      '#bodyContent',
      'section'
    ];

    let contentRoot = null;
    for (const sel of prioritySelectors) {
      const el = document.querySelector(sel);
      if (el && !el.closest('#sakshampath-root')) {
        const textLen = el.textContent ? el.textContent.trim().length : 0;
        if (textLen > 150) {
          contentRoot = el;
          break;
        }
      }
    }

    if (!contentRoot) {
      contentRoot = document.body || document.documentElement;
    }

    const elements = contentRoot.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote');
    const textBlocks = [];
    const seen = new Set();

    elements.forEach(el => {
      if (
        el.closest('#sakshampath-root') ||
        el.closest('nav, header, footer, aside, [role="navigation"], [role="banner"], [role="contentinfo"]') ||
        el.closest('.ad, .advertisement, [id*="cookie"], [class*="cookie"], [id*="consent"], [class*="consent"]')
      ) {
        return;
      }

      if (this.isElementHidden(el)) return;

      const txt = el.textContent ? el.textContent.trim().replace(/\s+/g, ' ') : '';
      if (txt.length >= 8 && !seen.has(txt)) {
        seen.add(txt);
        textBlocks.push(txt);
      }
    });

    return textBlocks.join('. ');
  },

  isElementHidden(el) {
    if (!el) return true;
    if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return true;
    const style = window.getComputedStyle ? window.getComputedStyle(el) : el.style;
    if (style) {
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return true;
      }
    }
    return false;
  },

  chunkText(text) {
    const sentences = text.match(/[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).length > 200) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = trimmed;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  },

  reset() {
    this.setReadSelectedMode(false);
    this.stop();
  }
};

SakshamPathSpeechManager.init();

if (typeof window !== 'undefined') {
  window.SakshamPathSpeechManager = SakshamPathSpeechManager;
  window.SakshamPathTTS = SakshamPathSpeechManager;
}
