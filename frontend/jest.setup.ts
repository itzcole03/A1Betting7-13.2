import '@testing-library/jest-dom';
import 'jest-localstorage-mock';
import 'whatwg-fetch';

// Mock import.meta.env for Vite compatibility in Jest
if (!globalThis.import) {
  globalThis.import = {};
}
if (!globalThis.import.meta) {
  globalThis.import.meta = {};
}
globalThis.import.meta.env = {
  VITE_BACKEND_URL: 'http://localhost:8000',
  VITE_API_BASE_URL: 'http://localhost:8000',
  VITE_API_HOST: 'localhost',
  VITE_API_PORT: '8000',
  VITE_WS_URL: 'ws://localhost:8000/ws',
  VITE_EXTERNAL_API_URL: 'https://api.sportsdata.io/v3/news',
  VITE_API_URL: 'http://localhost:8000',
  DEV: true,
  MODE: 'test',
};

// Mock window.matchMedia for framer-motion compatibility
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      };
    }),
  });
}

// Text Encoder/Decoder polyfill for Node.js
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Fetch polyfill
if (typeof global.fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock HTMLCanvasElement.getContext
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = jest.fn();
}

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
      args[0].includes('Warning: React.createFactory') ||
      args[0].includes('act() is not supported'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Global test utilities
(global as any).testUtils = {
  // Add any global test utilities here
  mockComponent: (name: string) => {
    return jest.fn(() => React.createElement('div', { 'data-testid': name }));
  },
};

// Enhanced cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  // Timer cleanup is now managed by each test file as needed
});

// --- MSW global patch: ensure req.headers.get exists on all MSW requests ---
// This monkey-patch ensures that all MSW request objects have a .get method on headers, preventing TypeError in tests
try {
  const { rest } = require('msw');
  const origRestGet = rest.get;
  const origRestPost = rest.post;
  const patchHeaders = resolver => (req, res, ctx) => {
    if (req && req.headers && typeof req.headers.get !== 'function') {
      req.headers.get = () => undefined;
    }
    return resolver(req, res, ctx);
  };
  rest.get = (path, resolver) => origRestGet(path, patchHeaders(resolver));
  rest.post = (path, resolver) => origRestPost(path, patchHeaders(resolver));
} catch (e) {
  // MSW not available, skip patch
}
