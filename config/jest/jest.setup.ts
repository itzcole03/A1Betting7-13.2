// Jest setup file for global test configuration
import "@testing-library/jest-dom";
import "jest-localstorage-mock";
import React from "react";
import "whatwg-fetch";

// Polyfill TextEncoder/TextDecoder for Node.js (needed by MSW and fetch polyfills)
import { TextDecoder, TextEncoder } from "util";
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

// Set environment variables for Jest testing
process.env.VITE_API_URL = "http://localhost:8000";
process.env.VITE_WS_ENDPOINT = "ws://localhost:8000/ws";
process.env.VITE_WS_URL = "ws://localhost:8000/ws";
process.env.VITE_THEODDS_API_KEY = "test-key";
process.env.VITE_SPORTRADAR_API_KEY = "test-key";
process.env.VITE_DAILYFANTASY_API_KEY = "test-key";
process.env.VITE_PRIZEPICKS_API_KEY = "test-key";

// Mock import.meta for Jest environment (Babel will transform import.meta references)
(global as any).React = React;
(global as any).import = {
  meta: {
    env: {
      VITE_API_URL: "http://localhost:8000",
      VITE_WS_ENDPOINT: "ws://localhost:8000/ws",
      VITE_WS_URL: "ws://localhost:8000/ws",
      VITE_THEODDS_API_KEY: "test-key",
      VITE_SPORTRADAR_API_KEY: "test-key",
      VITE_DAILYFANTASY_API_KEY: "test-key",
      VITE_PRIZEPICKS_API_KEY: "test-key",
    },
  },
};

// Mock window.matchMedia as early as possible for framer-motion compatibility
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      const listeners = new Set<EventListener>();
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: function (listener: EventListener) {
          listeners.add(listener);
        },
        removeListener: function (listener: EventListener) {
          listeners.delete(listener);
        },
        addEventListener: function (_type: string, listener: EventListener) {
          listeners.add(listener);
        },
        removeEventListener: function (_type: string, listener: EventListener) {
          listeners.delete(listener);
        },
        dispatchEvent: function () {
          return false;
        },
      };
    }),
  });
}

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds = [];

  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn();

// Setup MSW for API mocking
try {
  const { server } = require("./frontend/test/msw-server");

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
} catch (error) {
  console.warn("MSW server not available:", error.message);
}

// Global test utilities and cleanup
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});
