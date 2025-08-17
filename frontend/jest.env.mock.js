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
        VITE_WS_URL: process.env.VITE_WS_URL || 'ws://localhost:8000',
      },
      url: 'http://localhost:3000',
      resolve: (path) => new URL(path, 'http://localhost:3000').href,
    },
  },
  writable: true,
});

// Mock process.env if not available
if (typeof process === 'undefined') {
  global.process = {
    env: {
      NODE_ENV: 'test',
    },
  };
}

// Set up environment variable for testing - will be overridden by individual tests
// process.env.VITE_WS_URL = 'ws://env-test:9000';

// Mock URLSearchParams for Jest environment
if (typeof URLSearchParams === 'undefined') {
  global.URLSearchParams = class MockURLSearchParams {
    constructor(init) {
      this._params = new Map();
      if (init) {
        if (typeof init === 'string') {
          // Parse query string
          init.replace(/^\?/, '').split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
              this._params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
            }
          });
        }
      }
    }

    set(key, value) {
      this._params.set(key, value);
    }

    get(key) {
      return this._params.get(key) || null;
    }

    toString() {
      return Array.from(this._params.entries())
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }

    entries() {
      return this._params.entries();
    }
  };
}

// Mock URL constructor for Jest environment
if (typeof URL === 'undefined') {
  global.URL = class MockURL {
    constructor(path, base) {
      this.protocol = base.startsWith('ws:') ? 'ws:' : 'http:';
      this.hostname = base.split('://')[1].split(':')[0] || 'localhost';
      this.port = base.split(':')[2] || '8000';
      this.pathname = path;
      this._params = new Map();
      this.search = '';
      this.href = `${base}${path}`;
      
      // Create searchParams object with proper binding
      const self = this;
      this.searchParams = {
        set(key, value) {
          self._params.set(key, value);
        },
        get(key) {
          return self._params.get(key);
        },
        entries() {
          return self._params.entries();
        }
      };
    }
    
    toString() {
      const searchStr = Array.from(this._params.entries())
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      return `${this.protocol}//${this.hostname}:${this.port}${this.pathname}${searchStr ? '?' + searchStr : ''}`;
    }
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
  getItem: jest.fn((key) => {
    if (key === 'ws_client_id') {
      return 'persisted-client-id';
    }
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;
global.window = global.window || {};
global.window.localStorage = localStorageMock;

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
