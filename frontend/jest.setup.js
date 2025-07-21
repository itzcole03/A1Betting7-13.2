import '@testing-library/jest-dom';
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
}

// Mock import.meta.env for Vite compatibility in Jest
globalThis.importMetaEnv = {
  VITE_BACKEND_URL: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
  // Add other VITE_ variables as needed
};
