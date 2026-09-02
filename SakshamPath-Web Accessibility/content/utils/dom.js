/**
 * Saksham Path - DOM Utility
 * Safe, sanitized DOM element generation, SVG icons, and keyboard focus management
 */
const SakshamPathDOM = {
  /**
   * Safely create an HTML element with attributes and children
   * @param {string} tag 
   * @param {Object} attributes 
   * @param {Array|string|Node} children 
   * @returns {HTMLElement}
   */
  el(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes)) {
      if (key === 'className' || key === 'class') {
        element.className = value;
      } else if (key === 'dataset' && typeof value === 'object') {
        for (const [dataKey, dataValue] of Object.entries(value)) {
          element.dataset[dataKey] = dataValue;
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (value !== null && value !== undefined && value !== false) {
        element.setAttribute(key, value === true ? '' : value);
      }
    }

    const childList = Array.isArray(children) ? children : [children];
    for (const child of childList) {
      if (child === null || child === undefined || child === false) continue;
      if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    }

    return element;
  },

  /**
   * Create SVG element safely with proper namespace
   * @param {string} tag 
   * @param {Object} attributes 
   * @param {Array} children 
   * @returns {SVGElement}
   */
  svg(tag, attributes = {}, children = []) {
    const ns = 'http://www.w3.org/2000/svg';
    const element = document.createElementNS(ns, tag);

    for (const [key, value] of Object.entries(attributes)) {
      if (value !== null && value !== undefined) {
        element.setAttribute(key, String(value));
      }
    }

    const childList = Array.isArray(children) ? children : [children];
    for (const child of childList) {
      if (child instanceof Node) {
        element.appendChild(child);
      }
    }

    return element;
  },

  /**
   * Standard icons used across Saksham Path
   */
  icons: {
    accessibility(size = 24) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('circle', { cx: '12', cy: '4.5', r: '2.5' }),
        SakshamPathDOM.svg('path', { d: 'M4 9h16' }),
        SakshamPathDOM.svg('path', { d: 'M12 9v7' }),
        SakshamPathDOM.svg('path', { d: 'm8 22 4-6 4 6' })
      ]);
    },

    moveVertical(size = 18) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('polyline', { points: '8 6 12 2 16 6' }),
        SakshamPathDOM.svg('line', { x1: '12', y1: '2', x2: '12', y2: '22' }),
        SakshamPathDOM.svg('polyline', { points: '8 18 12 22 16 18' })
      ]);
    },

    dragHandle(size = 18) {
      return SakshamPathDOM.icons.moveVertical(size);
    },

    arrowLeft(size = 18) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('line', { x1: '19', y1: '12', x2: '5', y2: '12' }),
        SakshamPathDOM.svg('polyline', { points: '12 19 5 12 12 5' })
      ]);
    },

    switchSide(size = 18) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('path', { d: 'm7 16-4-4 4-4' }),
        SakshamPathDOM.svg('path', { d: 'M3 12h18' }),
        SakshamPathDOM.svg('path', { d: 'm17 8 4 4-4 4' })
      ]);
    },

    close(size = 20) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
        SakshamPathDOM.svg('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
      ]);
    },

    reset(size = 18) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' }),
        SakshamPathDOM.svg('path', { d: 'M3 3v5h5' })
      ]);
    },

    plus(size = 16) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
        SakshamPathDOM.svg('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
      ]);
    },

    minus(size = 16) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
      ]);
    },

    check(size = 16) {
      return SakshamPathDOM.svg('svg', {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2.5',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'aria-hidden': 'true'
      }, [
        SakshamPathDOM.svg('polyline', { points: '20 6 9 17 4 12' })
      ]);
    }
  },

  /**
   * Trap focus within a container element for accessibility dialogs
   * @param {HTMLElement} container 
   * @param {KeyboardEvent} e 
   */
  trapFocus(container, e) {
    if (e.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement || container.shadowRoot?.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement || container.shadowRoot?.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  }
};

if (typeof window !== 'undefined') {
  window.SakshamPathDOM = SakshamPathDOM;
}
