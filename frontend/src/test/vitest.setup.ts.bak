// Polyfill TextEncoder and TextDecoder for Vitest
(async () => {
  globalThis.TextEncoder = globalThis.TextEncoder || (await import('util')).TextEncoder;
  globalThis.TextDecoder = globalThis.TextDecoder || (await import('util')).TextDecoder;
})();

// Mock localStorage if not present
if (!globalThis.localStorage) {
  let _store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => _store[key] || null,
    setItem: (key: string, value: string) => {
      _store[key] = value;
    },
    removeItem: (key: string) => {
      delete _store[key];
    },
    clear: () => {
      _store = {};
    },
    key: (i: number) => Object.keys(_store)[i] || null,
    length: 0,
  } as Storage;
}

// Mock matchMedia
globalThis.matchMedia =
  globalThis.matchMedia ||
  ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));

// Mock ResizeObserver
globalThis.ResizeObserver =
  globalThis.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

// Import jest-dom for extended assertions
import '@testing-library/jest-dom';
