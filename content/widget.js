/**
 * Saksham Path - Widget Controller (UI/UX Polish & Layout Refinements)
 * Manages the edge-docked hover-draggable trigger button, full-height accessibility sidebar,
 * standardized aligned dropdowns, zero horizontal overflow, and multi-language support.
 */
class SakshamPathWidget {
  constructor() {
    this.rootElement = null;
    this.shadowRoot = null;
    this.isOpen = false;
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartTop = 0;
    this.previousActiveElement = null;
    this.settings = {};
    this.toastTimer = null;
  }

  /**
   * Initialize and mount the widget into the host page DOM
   */
  async init() {
    if (document.getElementById('sakshampath-root')) {
      console.warn('[Saksham Path] Widget already exists on this page.');
      return;
    }

    // 1. Load stored user preferences
    if (typeof SakshamPathStorage !== 'undefined') {
      this.settings = await SakshamPathStorage.getSettings();
    }

    // 2. Apply active accessibility transformations to host DOM
    if (typeof SakshamPathManager !== 'undefined') {
      SakshamPathManager.apply(this.settings);
    }

    // 3. Create host container
    this.rootElement = document.createElement('div');
    this.rootElement.id = 'sakshampath-root';

    // 4. Attach open Shadow DOM for complete CSS isolation
    this.shadowRoot = this.rootElement.attachShadow({ mode: 'open' });

    // 5. Inject encapsulated stylesheet
    this.injectStyles();

    // 6. Render UI components
    this.render();

    // 7. Subscribe to Text-to-Speech status updates & voice fallbacks
    if (typeof SakshamPathSpeechManager !== 'undefined') {
      SakshamPathSpeechManager.onStatus((status) => {
        this.updateTTSStatusBadge(status);
      });
      SakshamPathSpeechManager.onVoiceNotFound(() => {
        const lang = this.settings.extensionLanguage || 'en';
        const msg = typeof SakshamPathI18n !== 'undefined'
          ? SakshamPathI18n.t('voiceNotFound', lang)
          : 'A speech voice for this language is not available on your device.';
        this.showToast(msg);
      });
    }

    // 8. Setup dragging, listeners & resize handlers
    this.setupInteractions();

    // 9. Mount into document body or root documentElement
    (document.body || document.documentElement).appendChild(this.rootElement);
  }

  /**
   * Inject Shadow DOM stylesheet
   */
  injectStyles() {
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      styleLink.href = chrome.runtime.getURL('content/widget.css');
    } else {
      styleLink.href = 'widget.css';
    }
    this.shadowRoot.appendChild(styleLink);
  }

  /**
   * Render the floating trigger and full-height sidebar
   */
  render() {
    const dom = SakshamPathDOM;
    const side = this.settings.buttonSide || 'right';
    const extLang = this.settings.extensionLanguage || 'en';
    const isRtl = typeof SakshamPathI18n !== 'undefined' && SakshamPathI18n.isRTL(extLang);
    const t = (key) => typeof SakshamPathI18n !== 'undefined' ? SakshamPathI18n.t(key, extLang) : key;

    // --- 1. Edge-Docked Trigger Button with Hover-Only Move Indicator ---
    const dragHandle = dom.el('div', {
      className: 'sp-drag-handle',
      title: 'Drag vertically to reposition'
    }, [dom.icons.moveVertical(16)]);

    const triggerBtn = dom.el('button', {
      className: 'sp-trigger-btn',
      id: 'sp-trigger-btn',
      type: 'button',
      'aria-label': `${t('appName')} - Accessibility Menu`,
      'aria-haspopup': 'dialog',
      'aria-expanded': 'false',
      'aria-controls': 'sp-sidebar-dialog',
      title: `${t('appName')}`,
      onClick: () => this.togglePanel()
    }, [dom.icons.accessibility(28)]);

    const capsuleChildren = side === 'right' ? [dragHandle, triggerBtn] : [triggerBtn, dragHandle];

    const triggerContainer = dom.el('div', {
      className: `sp-trigger-container sp-side-${side}`,
      id: 'sp-trigger-container'
    }, [
      dom.el('div', {
        className: 'sp-trigger-capsule',
        id: 'sp-trigger-capsule',
        'aria-label': `${t('appName')} Trigger`
      }, capsuleChildren)
    ]);

    this.applyButtonPosition(triggerContainer);

    // --- 2. Full-Height Accessibility Sidebar Dialog ---
    const sidebar = dom.el('aside', {
      className: `sp-sidebar sp-side-${side} ${isRtl ? 'sp-rtl' : ''}`,
      id: 'sp-sidebar-dialog',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'sp-panel-title',
      dir: isRtl ? 'rtl' : 'ltr',
      tabIndex: -1
    }, [
      // Header
      dom.el('header', { className: 'sp-header' }, [
        dom.el('div', { className: 'sp-brand' }, [
          dom.el('div', { className: 'sp-brand-icon' }, [dom.icons.accessibility(20)]),
          dom.el('h2', { className: 'sp-title', id: 'sp-panel-title' }, [
            t('appName'),
            dom.el('span', { className: 'sp-badge-v' }, 'v1.0')
          ])
        ]),
        dom.el('div', { className: 'sp-header-actions' }, [
          dom.el('button', {
            className: 'sp-icon-btn',
            type: 'button',
            'aria-label': t('switchSide'),
            title: t('switchSide'),
            onClick: () => this.toggleEdgeSide()
          }, [dom.icons.switchSide(16)]),
          dom.el('button', {
            className: 'sp-icon-btn',
            type: 'button',
            'aria-label': t('resetAllSettings'),
            title: t('resetAllSettings'),
            onClick: () => this.handleResetAll()
          }, [dom.icons.reset(16)]),
          dom.el('button', {
            className: 'sp-icon-btn sp-close-btn',
            id: 'sp-close-btn',
            type: 'button',
            'aria-label': t('close'),
            title: t('close'),
            onClick: () => this.closePanel()
          }, [dom.icons.close(18)])
        ])
      ]),

      // Toast Notification Banner
      dom.el('div', { className: 'sp-toast', id: 'sp-toast-banner' }),

      // Scrollable Body (Single vertical scroll, zero horizontal overflow)
      dom.el('div', { className: 'sp-body' }, [
        // ==========================================
        // SECTION 1: LANGUAGE & TRANSLATION
        // ==========================================
        dom.el('section', { className: 'sp-section' }, [
          dom.el('h3', { className: 'sp-section-title' }, t('languageTranslationSection')),

          // Unified Language & Translation Card Box
          dom.el('div', { className: 'sp-card-box' }, [
            // Extension Language
            dom.el('div', { className: 'sp-select-group' }, [
              dom.el('label', { className: 'sp-select-label', for: 'sp-ext-lang-select' }, t('extensionLanguage')),
              this.renderLanguageSelect('sp-ext-lang-select', extLang, (newLang) => {
                this.settings.extensionLanguage = newLang;
                this.updateSettings();
                this.refreshUI();
              })
            ]),

            // Website Translation
            dom.el('div', { className: 'sp-select-group' }, [
              dom.el('label', { className: 'sp-select-label', for: 'sp-trans-target-select' }, t('websiteTranslation')),
              this.renderLanguageSelect('sp-trans-target-select', this.settings.translationTargetLanguage || 'hi', (newLang) => {
                this.settings.translationTargetLanguage = newLang;
                this.updateSettings();
              })
            ]),

            // Action Buttons
            dom.el('div', { className: 'sp-translate-actions' }, [
              dom.el('button', {
                className: 'sp-tts-btn sp-tts-btn-primary',
                type: 'button',
                'aria-label': t('translatePage'),
                onClick: async () => {
                  if (typeof SakshamPathTranslator !== 'undefined') {
                    this.showToast(t('translating'));
                    const success = await SakshamPathTranslator.translatePage(this.settings.translationTargetLanguage || 'hi');
                    if (success) {
                      this.showToast(t('translationComplete'));
                    }
                  }
                }
              }, ['🌐 ' + t('translatePage')]),

              dom.el('button', {
                className: 'sp-tts-btn',
                type: 'button',
                'aria-label': t('restoreOriginal'),
                onClick: () => {
                  if (typeof SakshamPathTranslator !== 'undefined') {
                    SakshamPathTranslator.restoreOriginal();
                    this.showToast(t('translationRestored'));
                  }
                }
              }, ['↺ ' + t('restoreOriginal')])
            ])
          ])
        ]),

        // ==========================================
        // SECTION 2: READING ASSISTANCE
        // ==========================================
        dom.el('section', { className: 'sp-section' }, [
          dom.el('h3', { className: 'sp-section-title' }, t('readingAssistance')),

          // Text-to-Speech Player Box
          this.renderTTSPlayerBox(t),

          // Reading Grid (Reading Guide, Magnifier)
          dom.el('div', { className: 'sp-grid' }, [
            this.createToggleCard(
              t('readingGuide'),
              t('readingGuideDesc'),
              '📏',
              !!this.settings.readingGuide,
              (active) => {
                this.settings.readingGuide = active;
                this.updateSettings();
              }
            ),
            this.createToggleCard(
              t('textMagnifier'),
              t('textMagnifierDesc'),
              '🔍',
              !!this.settings.textMagnifier,
              (active) => {
                this.settings.textMagnifier = active;
                this.updateSettings();
              }
            )
          ])
        ]),

        // ==========================================
        // SECTION 3: CONTENT ADJUSTMENTS
        // ==========================================
        dom.el('section', { className: 'sp-section' }, [
          dom.el('h3', { className: 'sp-section-title' }, t('contentAdjustments')),
          
          // Stepper: Font Size
          this.createStepperCard(
            t('fontSize'),
            this.getFontSizeLabel(this.settings.fontSizeStep),
            'fontSizeStep',
            -2,
            5,
            (newVal) => {
              this.settings.fontSizeStep = newVal;
              this.updateSettings();
            }
          ),

          // Stepper: Line Spacing
          this.createStepperCard(
            t('lineSpacing'),
            this.getSpacingLabel(this.settings.lineSpacingStep),
            'lineSpacingStep',
            0,
            3,
            (newVal) => {
              this.settings.lineSpacingStep = newVal;
              this.updateSettings();
            }
          ),

          // Stepper: Letter Spacing
          this.createStepperCard(
            t('letterSpacing'),
            this.getSpacingLabel(this.settings.letterSpacingStep),
            'letterSpacingStep',
            0,
            3,
            (newVal) => {
              this.settings.letterSpacingStep = newVal;
              this.updateSettings();
            }
          ),

          // Stepper: Word Spacing
          this.createStepperCard(
            t('wordSpacing'),
            this.getSpacingLabel(this.settings.wordSpacingStep),
            'wordSpacingStep',
            0,
            3,
            (newVal) => {
              this.settings.wordSpacingStep = newVal;
              this.updateSettings();
            }
          ),

          // Toggle: Readable Font
          this.createToggleCard(
            t('readableFont'),
            t('readableFontDesc'),
            '🔤',
            !!this.settings.readableFont,
            (active) => {
              this.settings.readableFont = active;
              this.updateSettings();
            }
          )
        ]),

        // ==========================================
        // SECTION 4: COLOR & CONTRAST
        // ==========================================
        dom.el('section', { className: 'sp-section' }, [
          dom.el('h3', { className: 'sp-section-title' }, t('colorContrast')),
          dom.el('div', { className: 'sp-grid' }, [
            this.createToggleCard(
              t('grayscale'),
              t('grayscaleDesc'),
              '⚪',
              !!this.settings.grayscale,
              (active) => {
                this.settings.grayscale = active;
                this.updateSettings();
              }
            ),
            this.createToggleCard(
              t('highContrast'),
              t('highContrastDesc'),
              '🌓',
              this.settings.contrastMode === 'high',
              (active) => {
                this.settings.contrastMode = active ? 'high' : 'none';
                this.updateSettings();
              }
            ),
            this.createToggleCard(
              t('darkContrast'),
              t('darkContrastDesc'),
              '🌙',
              this.settings.contrastMode === 'dark',
              (active) => {
                this.settings.contrastMode = active ? 'dark' : 'none';
                this.updateSettings();
              }
            ),
            this.createToggleCard(
              t('brightContrast'),
              t('brightContrastDesc'),
              '☀️',
              this.settings.contrastMode === 'bright',
              (active) => {
                this.settings.contrastMode = active ? 'bright' : 'none';
                this.updateSettings();
              }
            ),
            this.createToggleCard(
              t('highSaturation'),
              t('highSaturationDesc'),
              '🌈',
              this.settings.saturationMode === 'high',
              (active) => {
                this.settings.saturationMode = active ? 'high' : 'none';
                this.updateSettings();
              }
            ),
            this.createToggleCard(
              t('lowSaturation'),
              t('lowSaturationDesc'),
              '🌧️',
              this.settings.saturationMode === 'low',
              (active) => {
                this.settings.saturationMode = active ? 'low' : 'none';
                this.updateSettings();
              }
            )
          ])
        ]),

        // ==========================================
        // SECTION 5: NAVIGATION & INTERACTION
        // ==========================================
        dom.el('section', { className: 'sp-section' }, [
          dom.el('h3', { className: 'sp-section-title' }, t('navigationInteraction')),
          dom.el('div', { className: 'sp-grid' }, [
            this.createToggleCard(
              t('interactiveElements'),
              t('interactiveElementsDesc'),
              '🔘',
              !!this.settings.interactiveHighlight,
              (active) => {
                this.settings.interactiveHighlight = active;
                this.updateSettings();
              }
            ),
            this.createToggleCard(
              t('largeCursor'),
              t('largeCursorDesc'),
              '🖱️',
              !!this.settings.largeCursor,
              (active) => {
                this.settings.largeCursor = active;
                this.updateSettings();
              }
            )
          ])
        ])
      ]),

      // Footer (Sticky bottom, zero horizontal overflow)
      dom.el('footer', { className: 'sp-footer' }, [
        dom.el('button', {
          className: 'sp-btn-reset-all',
          type: 'button',
          'aria-label': t('resetAllSettings'),
          onClick: () => this.handleResetAll()
        }, [
          dom.icons.reset(14),
          t('resetAllSettings')
        ]),
        dom.el('span', {}, `${t('appName')} v1.0`)
      ])
    ]);

    this.shadowRoot.appendChild(triggerContainer);
    this.shadowRoot.appendChild(sidebar);
  }

  /**
   * Render Language Select Dropdown with all 22 Scheduled Indian Languages + English
   */
  renderLanguageSelect(id, selectedCode, onChange) {
    const dom = SakshamPathDOM;
    const languages = typeof SakshamPathI18n !== 'undefined' ? SakshamPathI18n.languages : [];

    const options = languages.map(lang => {
      const opt = dom.el('option', { value: lang.code }, `${lang.nativeName} (${lang.name})`);
      if (lang.code === selectedCode) opt.selected = true;
      return opt;
    });

    const selectEl = dom.el('select', {
      className: 'sp-select',
      id: id,
      onChange: (e) => onChange(e.target.value)
    }, options);

    return selectEl;
  }

  /**
   * Render Text-to-Speech player box with Speech Language Selector
   */
  renderTTSPlayerBox(t) {
    const dom = SakshamPathDOM;
    const currentRate = this.settings.speechRate || 1.0;
    const isReadSelectedActive = !!this.settings.readSelected;
    const speechLang = this.settings.speechLanguage || 'auto';

    const speechLangOptions = [
      dom.el('option', { value: 'auto' }, `🌐 ${t('autoDetect')}`),
      dom.el('option', { value: 'hi-IN' }, 'हिन्दी (Hindi)'),
      dom.el('option', { value: 'en-IN' }, 'English (India)'),
      dom.el('option', { value: 'mr-IN' }, 'मराठी (Marathi)'),
      dom.el('option', { value: 'bn-IN' }, 'বাংলা (Bengali)'),
      dom.el('option', { value: 'ta-IN' }, 'தமிழ் (Tamil)'),
      dom.el('option', { value: 'te-IN' }, 'తెలుగు (Telugu)'),
      dom.el('option', { value: 'gu-IN' }, 'ગુજરાતી (Gujarati)'),
      dom.el('option', { value: 'kn-IN' }, 'ಕನ್ನಡ (Kannada)'),
      dom.el('option', { value: 'ml-IN' }, 'മലയാളം (Malayalam)'),
      dom.el('option', { value: 'pa-IN' }, 'ਪੰਜਾਬੀ (Punjabi)'),
      dom.el('option', { value: 'ur-IN' }, 'اردو (Urdu)')
    ];

    speechLangOptions.forEach(opt => {
      if (opt.value === speechLang) opt.selected = true;
    });

    const speechLangSelect = dom.el('select', {
      className: 'sp-select',
      id: 'sp-speech-lang-select',
      onChange: (e) => {
        this.settings.speechLanguage = e.target.value;
        this.updateSettings();
      }
    }, speechLangOptions);

    return dom.el('div', { className: 'sp-tts-box' }, [
      dom.el('div', { className: 'sp-tts-header' }, [
        dom.el('span', { className: 'sp-tts-title' }, `🔊 ${t('textReader')}`),
        dom.el('span', { className: 'sp-tts-status', id: 'sp-tts-status-badge' }, t('statusReady'))
      ]),

      // Speech Language Select
      dom.el('div', { className: 'sp-select-group' }, [
        dom.el('label', { className: 'sp-select-label', for: 'sp-speech-lang-select' }, t('speechLanguage')),
        speechLangSelect
      ]),

      // Primary Action Buttons: Read Selected (Toggle) & Read Page (Action)
      dom.el('div', { className: 'sp-tts-actions-grid' }, [
        dom.el('button', {
          className: `sp-tts-btn ${isReadSelectedActive ? 'sp-tts-btn-primary' : ''}`,
          type: 'button',
          'aria-label': `${t('readSelectedOn')} (${isReadSelectedActive ? 'ON' : 'OFF'})`,
          'aria-pressed': String(isReadSelectedActive),
          onClick: () => {
            this.settings.readSelected = !this.settings.readSelected;
            this.updateSettings();
            this.refreshUI();
            if (this.settings.readSelected) {
              this.showToast(isReadSelectedActive ? t('readSelectedOff') : t('readSelectedOn'));
            }
          }
        }, [isReadSelectedActive ? `📝 ${t('readSelectedOn')}` : `📝 ${t('readSelectedOff')}`]),

        dom.el('button', {
          className: 'sp-tts-btn sp-tts-btn-primary',
          type: 'button',
          'aria-label': t('readPage'),
          onClick: () => {
            if (typeof SakshamPathSpeechManager !== 'undefined') {
              const msg = SakshamPathSpeechManager.readPage();
              if (msg) this.showToast(msg);
            }
          }
        }, [`🌐 ${t('readPage')}`])
      ]),

      // Secondary Playback Controls & Speed Stepper
      dom.el('div', { className: 'sp-tts-playback-bar' }, [
        dom.el('div', { className: 'sp-tts-controls-row' }, [
          dom.el('button', {
            className: 'sp-tts-btn',
            type: 'button',
            'aria-label': t('pause'),
            title: t('pause'),
            onClick: () => {
              if (typeof SakshamPathSpeechManager !== 'undefined') SakshamPathSpeechManager.pause();
            }
          }, [`⏸️ ${t('pause')}`]),

          dom.el('button', {
            className: 'sp-tts-btn',
            type: 'button',
            'aria-label': t('resume'),
            title: t('resume'),
            onClick: () => {
              if (typeof SakshamPathSpeechManager !== 'undefined') SakshamPathSpeechManager.resume();
            }
          }, [`▶️ ${t('resume')}`]),

          dom.el('button', {
            className: 'sp-tts-btn sp-tts-btn-danger',
            type: 'button',
            'aria-label': t('stop'),
            title: t('stop'),
            onClick: () => {
              if (typeof SakshamPathSpeechManager !== 'undefined') SakshamPathSpeechManager.stop();
            }
          }, [`⏹️ ${t('stop')}`])
        ]),

        dom.el('div', { className: 'sp-tts-speed-row' }, [
          dom.el('span', { className: 'sp-tts-speed-label' }, `⚡ ${t('speed')}: ${currentRate}x`),
          dom.el('button', {
            className: 'sp-stepper-btn',
            style: { width: '26px', height: '26px' },
            type: 'button',
            'aria-label': 'Cycle speech speed',
            title: 'Change speech rate',
            onClick: () => {
              const rates = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
              const idx = rates.indexOf(this.settings.speechRate || 1.0);
              const nextRate = rates[(idx + 1) % rates.length];
              this.settings.speechRate = nextRate;
              this.updateSettings();
              this.refreshUI();
            }
          }, ['↻'])
        ])
      ])
    ]);
  }

  /**
   * Helper: Stepper Control Card
   */
  createStepperCard(title, valueLabel, key, min, max, onChange) {
    const dom = SakshamPathDOM;
    const currentVal = this.settings[key] ?? 0;

    const valueEl = dom.el('span', { className: 'sp-stepper-value', id: `sp-val-${key}` }, valueLabel);

    const btnMinus = dom.el('button', {
      className: 'sp-stepper-btn',
      type: 'button',
      'aria-label': `Decrease ${title}`,
      disabled: currentVal <= min,
      onClick: () => {
        const val = (this.settings[key] ?? 0) - 1;
        if (val >= min) {
          onChange(val);
          this.refreshUI();
        }
      }
    }, [dom.icons.minus(14)]);

    const btnPlus = dom.el('button', {
      className: 'sp-stepper-btn',
      type: 'button',
      'aria-label': `Increase ${title}`,
      disabled: currentVal >= max,
      onClick: () => {
        const val = (this.settings[key] ?? 0) + 1;
        if (val <= max) {
          onChange(val);
          this.refreshUI();
        }
      }
    }, [dom.icons.plus(14)]);

    return dom.el('div', { className: 'sp-stepper-card' }, [
      dom.el('div', { className: 'sp-stepper-info' }, [
        dom.el('span', { className: 'sp-stepper-title' }, title),
        valueEl
      ]),
      dom.el('div', { className: 'sp-stepper-actions' }, [btnMinus, btnPlus])
    ]);
  }

  /**
   * Helper: Interactive Toggle Card
   */
  createToggleCard(label, desc, iconText, isActive, onToggle) {
    const dom = SakshamPathDOM;
    return dom.el('button', {
      className: `sp-card-btn ${isActive ? 'sp-active' : ''}`,
      type: 'button',
      'aria-label': `${label} (${isActive ? 'Enabled' : 'Disabled'})`,
      'aria-pressed': String(isActive),
      onClick: (e) => {
        const newActive = !e.currentTarget.classList.contains('sp-active');
        onToggle(newActive);
        this.refreshUI();
      }
    }, [
      dom.el('span', { className: 'sp-card-icon' }, iconText),
      dom.el('span', { className: 'sp-card-label' }, label),
      dom.el('span', { className: 'sp-card-desc' }, desc),
      dom.el('span', { className: 'sp-card-check' }, [dom.icons.check(12)])
    ]);
  }

  /**
   * Show toast banner inside panel
   */
  showToast(message) {
    const toast = this.shadowRoot.getElementById('sp-toast-banner');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('sp-toast-show');

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('sp-toast-show');
    }, 3800);
  }

  /**
   * Update Text-to-Speech status badge
   */
  updateTTSStatusBadge(status) {
    const badge = this.shadowRoot.getElementById('sp-tts-status-badge');
    if (!badge) return;

    const extLang = this.settings.extensionLanguage || 'en';
    const t = (key) => typeof SakshamPathI18n !== 'undefined' ? SakshamPathI18n.t(key, extLang) : key;

    badge.className = 'sp-tts-status';
    if (status === 'reading') {
      badge.textContent = t('statusReading');
      badge.classList.add('sp-status-reading');
    } else if (status === 'paused') {
      badge.textContent = t('statusPaused');
      badge.classList.add('sp-status-paused');
    } else if (status === 'stopped') {
      badge.textContent = t('statusStopped');
    } else {
      badge.textContent = t('statusReady');
    }
  }

  /**
   * Refresh UI elements from current settings
   */
  refreshUI() {
    if (!this.shadowRoot) return;

    const oldSidebar = this.shadowRoot.getElementById('sp-sidebar-dialog');
    const oldTrigger = this.shadowRoot.getElementById('sp-trigger-container');
    
    if (oldSidebar) oldSidebar.remove();
    if (oldTrigger) oldTrigger.remove();

    this.render();
    this.setupInteractions();

    if (this.isOpen) {
      const newSidebar = this.shadowRoot.getElementById('sp-sidebar-dialog');
      if (newSidebar) newSidebar.classList.add('sp-open');
    }
  }

  /**
   * Apply changes to manager and persistence storage
   */
  async updateSettings() {
    if (typeof SakshamPathManager !== 'undefined') {
      SakshamPathManager.apply(this.settings);
    }
    if (typeof SakshamPathStorage !== 'undefined') {
      await SakshamPathStorage.saveSettings(this.settings);
    }
  }

  /**
   * Reset all settings, speech, overlays, translation, and clear host styling
   */
  async handleResetAll() {
    if (typeof SakshamPathManager !== 'undefined') {
      SakshamPathManager.reset();
    }
    if (typeof SakshamPathStorage !== 'undefined') {
      this.settings = await SakshamPathStorage.resetSettings(true);
    }
    this.refreshUI();
    const extLang = this.settings.extensionLanguage || 'en';
    const msg = typeof SakshamPathI18n !== 'undefined'
      ? SakshamPathI18n.t('resetAllSettings', extLang) + ' (OK)'
      : 'All accessibility settings have been reset.';
    this.showToast(msg);
    console.info('[Saksham Path] All settings reset to original defaults.');
  }

  /**
   * Setup dragging, edge switching & viewport clamping
   */
  setupInteractions() {
    const triggerContainer = this.shadowRoot.getElementById('sp-trigger-container');
    const capsule = this.shadowRoot.getElementById('sp-trigger-capsule');
    if (!triggerContainer || !capsule) return;

    // Vertical pointer dragging
    const onPointerDown = (e) => {
      if (e.target.closest('#sp-trigger-btn')) return;

      this.isDragging = true;
      this.dragStartY = e.clientY;
      const rect = triggerContainer.getBoundingClientRect();
      this.dragStartTop = rect.top;

      capsule.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;

      const deltaY = e.clientY - this.dragStartY;
      let newTop = this.dragStartTop + deltaY;

      // Viewport bounds clamping
      const maxTop = window.innerHeight - 60;
      newTop = Math.max(10, Math.min(newTop, maxTop));

      triggerContainer.style.top = `${newTop}px`;
      triggerContainer.style.bottom = 'auto';

      this.settings.buttonVerticalPosition = Math.round((newTop / window.innerHeight) * 100);
    };

    const onPointerUp = async (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      try {
        capsule.releasePointerCapture(e.pointerId);
      } catch {}

      if (typeof SakshamPathStorage !== 'undefined') {
        await SakshamPathStorage.saveSettings(this.settings);
      }
    };

    capsule.addEventListener('pointerdown', onPointerDown);
    capsule.addEventListener('pointermove', onPointerMove);
    capsule.addEventListener('pointerup', onPointerUp);
    capsule.addEventListener('pointercancel', onPointerUp);

    // Global Key Listener (Escape and Focus Trapping)
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.closePanel();
        return;
      }

      const sidebar = this.shadowRoot.getElementById('sp-sidebar-dialog');
      if (sidebar && this.isOpen) {
        SakshamPathDOM.trapFocus(sidebar, e);
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.isOpen) return;
      if (!this.rootElement.contains(e.target)) {
        this.closePanel();
      }
    });

    // Viewport resize clamping
    window.addEventListener('resize', () => {
      this.applyButtonPosition(triggerContainer);
    });
  }

  /**
   * Switch button & sidebar to opposite edge
   */
  async toggleEdgeSide() {
    this.settings.buttonSide = this.settings.buttonSide === 'left' ? 'right' : 'left';
    await this.updateSettings();
    this.refreshUI();
  }

  /**
   * Apply button vertical positioning and edge clamping
   */
  applyButtonPosition(container) {
    if (!container) return;
    const vPercent = this.settings.buttonVerticalPosition ?? 50;
    const computedTop = Math.round((window.innerHeight * vPercent) / 100);
    const maxTop = window.innerHeight - 60;
    const clampedTop = Math.max(10, Math.min(computedTop, maxTop));

    container.style.top = `${clampedTop}px`;
    container.style.bottom = 'auto';
  }

  /**
   * Toggle accessibility sidebar
   */
  togglePanel() {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * Open accessibility sidebar
   */
  openPanel() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.previousActiveElement = document.activeElement;

    const sidebar = this.shadowRoot.getElementById('sp-sidebar-dialog');
    const triggerBtn = this.shadowRoot.getElementById('sp-trigger-btn');
    const closeBtn = this.shadowRoot.getElementById('sp-close-btn');

    if (sidebar) sidebar.classList.add('sp-open');
    if (triggerBtn) triggerBtn.setAttribute('aria-expanded', 'true');

    setTimeout(() => {
      if (closeBtn) closeBtn.focus();
    }, 60);
  }

  /**
   * Close accessibility sidebar
   */
  closePanel() {
    if (!this.isOpen) return;

    this.isOpen = false;
    const sidebar = this.shadowRoot.getElementById('sp-sidebar-dialog');
    const triggerBtn = this.shadowRoot.getElementById('sp-trigger-btn');

    if (sidebar) sidebar.classList.remove('sp-open');
    if (triggerBtn) {
      triggerBtn.setAttribute('aria-expanded', 'false');
      triggerBtn.focus();
    } else if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
    }
  }

  getFontSizeLabel(step) {
    const scale = { '-2': '80%', '-1': '90%', '0': '100%', '1': '110%', '2': '120%', '3': '130%', '4': '140%', '5': '150%' };
    return scale[String(step ?? 0)] || '100%';
  }

  getSpacingLabel(step) {
    const labels = ['Normal', 'Medium', 'Wide', 'Extra'];
    return labels[step ?? 0] || 'Normal';
  }
}

if (typeof window !== 'undefined') {
  window.SakshamPathWidget = SakshamPathWidget;
}
