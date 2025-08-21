// Jest environment mock for import.meta and other Node.js globals

// Mock import.meta for Jest compatibility
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        DEV: process.env.NODE_ENV === 'development',
        PROD: process.env.NODE_ENV === 'production',
        MODE: process.env.NODE_ENV || 'test',
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
      },
      url: 'http://localhost:3000',
      resolve: (path) => new URL(path, 'http://localhost:3000').href,
    },
  },
  writable: true,
});

// Also expose a __import_meta__ on globalThis for runtime helpers
globalThis.__import_meta__ = {
  env: {
    DEV: process.env.NODE_ENV === 'development',
    PROD: process.env.NODE_ENV === 'production',
    MODE: process.env.NODE_ENV || 'test',
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
    VITE_WS_URL: process.env.VITE_WS_URL || undefined,
  },
};

// Mock process.env if not available
if (typeof process === 'undefined') {
  global.process = {
    env: {
      NODE_ENV: 'test',
    },
  };
}

// Mock window.matchMedia for responsive components
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

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver for components that use it
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Mock WebSocket for WebSocket context tests
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen && this.onopen();
    }, 0);
  }
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  send() {}
  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose && this.onclose();
  }
};
