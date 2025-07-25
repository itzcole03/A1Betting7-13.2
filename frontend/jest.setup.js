require('@testing-library/jest-dom');

// Polyfill ResizeObserver for Mantine components in Jest/Jsdom
if (typeof window !== 'undefined') {
  class ResizeObserver {
    constructor(callback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserver;
  global.ResizeObserver = ResizeObserver;

  // Mock CSSStyleSheet and other globals if needed by Mantine
  Object.defineProperty(window, 'CSSStyleSheet', {
    writable: true,
    value: class CSSStyleSheet {
      constructor() {
        this.cssRules = [];
      }
      insertRule() {}
      deleteRule() {}
    },
  });

  // Mock getComputedStyle
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = (elt, pseudoElt) => {
    const computedStyle = originalGetComputedStyle(elt, pseudoElt);
    return computedStyle;
  };
}

// Mock import.meta.env for Vite compatibility in Jest

globalThis.importMeta = {
  env: {
    VITE_BACKEND_URL: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
    // Add other VITE_ variables as needed
  },
};
