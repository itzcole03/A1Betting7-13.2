// Unified test setup for Jest - consolidates all test configurations
import '@testing-library/jest-dom';

// Polyfills
import 'jest-localstorage-mock';

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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn();

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

// Setup MSW for API mocking
import { server } from '../test/msw-server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Global test utilities
global.testUtils = {
  // Add any global test utilities here
  mockComponent: (name: string) => {
    return jest.fn(() => React.createElement('div', { 'data-testid': name }));
  },
};

// Enhanced cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  // Clear any timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});
