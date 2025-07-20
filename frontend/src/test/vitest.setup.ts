// Polyfill TextEncoder and TextDecoder for Vitest
globalThis.TextEncoder = globalThis.TextEncoder || (await import('util')).TextEncoder;
globalThis.TextDecoder = globalThis.TextDecoder || (await import('util')).TextDecoder;

// Mock localStorage if not present
if (!globalThis.localStorage) {
  let store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (i: number) => Object.keys(store)[i] || null,
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
