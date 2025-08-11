// Enhanced Jest Setup for Phase 4 Testing Automation
import '@testing-library/jest-dom';
import 'jest-localstorage-mock';

// Enhanced DOM Testing Setup
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

// WebSocket Mock
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// ResizeObserver Mock
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// IntersectionObserver Mock
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Fetch Mock Enhancement
global.fetch = jest.fn();

// Console Mock for Testing
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || 
       args[0].includes('React does not recognize') ||
       args[0].includes('validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Performance Mock
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    now: jest.fn(() => Date.now()),
  },
});

// URL Mock
Object.defineProperty(window, 'URL', {
  writable: true,
  value: {
    createObjectURL: jest.fn(() => 'mocked-url'),
    revokeObjectURL: jest.fn(),
  },
});

// File and FileReader Mocks
global.File = jest.fn().mockImplementation((fileBits, filename, options) => ({
  name: filename,
  size: fileBits.length,
  type: options?.type || '',
  lastModified: Date.now(),
  arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
  text: jest.fn(() => Promise.resolve('')),
  stream: jest.fn(),
  slice: jest.fn(),
}));

global.FileReader = jest.fn().mockImplementation(() => ({
  readAsText: jest.fn(),
  readAsDataURL: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  abort: jest.fn(),
  result: null,
  error: null,
  onload: null,
  onerror: null,
  onabort: null,
  readyState: 0,
  EMPTY: 0,
  LOADING: 1,
  DONE: 2,
}));

// Enhanced Local Storage Mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Crypto Mock
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn(() => new Uint32Array(1)),
    randomUUID: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
    subtle: {
      digest: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
      encrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
      decrypt: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    },
  },
});

// HTMLCanvasElement Mock
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

// Enhanced Error Handling
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Test Cleanup
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});

// Global Test Utilities
global.testUtils = {
  waitFor: (callback: () => void, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        try {
          callback();
          resolve(undefined);
        } catch (error) {
          if (Date.now() - startTime < timeout) {
            setTimeout(check, 100);
          } else {
            reject(error);
          }
        }
      };
      check();
    });
  },
  
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn(() => Promise.resolve(data)),
    text: jest.fn(() => Promise.resolve(JSON.stringify(data))),
    blob: jest.fn(() => Promise.resolve(new Blob())),
    headers: new Headers(),
  }),
  
  mockWebSocket: () => ({
    send: jest.fn(),
    close: jest.fn(),
    readyState: 1,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }),
  
  createMockEvent: (type: string, properties = {}) => ({
    type,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    target: { value: '' },
    currentTarget: { value: '' },
    ...properties,
  }),
};

// Type Augmentation for Global Test Utils
declare global {
  var testUtils: {
    waitFor: (callback: () => void, timeout?: number) => Promise<void>;
    mockApiResponse: (data: any, status?: number) => any;
    mockWebSocket: () => any;
    createMockEvent: (type: string, properties?: any) => any;
  };
}

export {};
