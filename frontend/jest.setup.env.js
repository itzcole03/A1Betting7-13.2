// Polyfill window.matchMedia for framer-motion compatibility in Jest/JSDOM
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
// Minimal BroadcastChannel mock for Jest/JSDOM (for MSW compatibility)
if (typeof global.BroadcastChannel === 'undefined') {
  class BroadcastChannelMock {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
    onmessage = null;
  }
  global.BroadcastChannel = BroadcastChannelMock;
}
// Polyfill TransformStream, ReadableStream, WritableStream for Node.js/Jest
const streams = require('web-streams-polyfill/dist/ponyfill.js');
if (typeof global.TransformStream === 'undefined') {
  global.TransformStream = streams.TransformStream;
}
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = streams.ReadableStream;
}
if (typeof global.WritableStream === 'undefined') {
  global.WritableStream = streams.WritableStream;
}
// Polyfill TextEncoder/TextDecoder for Node.js/Jest (must be first)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill fetch, Response, and Request for Jest/Node (required for MSW)
import 'whatwg-fetch';

Object.defineProperty(global, 'import', {
  value: { meta: { env: {} } },
  writable: true,
});

// Jest setup to robustly polyfill import.meta.env for all test environments
if (!globalThis.import) {
  Object.defineProperty(globalThis, 'import', {
    value: { meta: { env: {} } },
    writable: true,
    configurable: true,
  });
}

// Ensure import.meta.env is always defined and writable
if (!globalThis.import.meta) {
  globalThis.import.meta = { env: {} };
}
if (!globalThis.import.meta.env) {
  globalThis.import.meta.env = {};
}

// Optionally, copy process.env vars for VITE_*, BACKEND_URL, API_URL
if (typeof process !== 'undefined' && process.env) {
  const keys = ['VITE_BACKEND_URL', 'VITE_API_URL', 'BACKEND_URL', 'API_URL'];
  for (const key of keys) {
    if (process.env[key]) {
      globalThis.import.meta.env[key] = process.env[key];
    }
  }
}
