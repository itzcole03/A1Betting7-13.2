/**
 * Test Setup for WebSocket Migration and Core Tests
 * 
 * Configures Jest environment with comprehensive mocks and utilities
 * for WebSocket migration testing and enhanced error handling.
 */

import '@testing-library/jest-dom';

// Mock window.crypto for buildWebSocketUrl tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  },
  writable: true
});

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState: number = MockWebSocket.CONNECTING;
  public url: string;
  public onopen: ((event: Event) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;
  
  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }
  
  send = jest.fn();
  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  });
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  
  // Simulate connection
  mockConnect() {
    this.readyState = MockWebSocket.OPEN;
    const event = new Event('open');
    if (this.onopen) this.onopen(event);
    this.dispatchEvent(event);
  }
  
  // Simulate disconnection
  mockDisconnect(code: number = 1000, reason: string = 'Normal closure') {
    this.readyState = MockWebSocket.CLOSED;
    const event = new CloseEvent('close', { code, reason });
    if (this.onclose) this.onclose(event);
    this.dispatchEvent(event);
  }
  
  // Simulate message
  mockMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      const event = new MessageEvent('message', { data });
      if (this.onmessage) this.onmessage(event);
      this.dispatchEvent(event);
    }
  }
  
  // Simulate error
  mockError(error?: string) {
    const event = new Event('error');
    if (this.onerror) this.onerror(event);
    this.dispatchEvent(event);
  }
  
  // Mock event dispatcher
  dispatchEvent = jest.fn();
}

// Mock EventSource
class MockEventSource {
  public readyState: number = EventSource.CONNECTING;
  public url: string;
  
  constructor(url: string) {
    this.url = url;
  }
  
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  
  // Simulate connection
  mockConnect() {
    this.readyState = EventSource.OPEN;
    const event = new Event('open');
    this.dispatchEvent(event);
  }
  
  // Mock event dispatcher
  dispatchEvent = jest.fn();
}

// Global mocks
global.WebSocket = MockWebSocket as any;
global.EventSource = MockEventSource as any;

// Mock gtag function for analytics
Object.defineProperty(global, 'gtag', {
  value: jest.fn(),
  writable: true
});

// Mock URL constructor for WebSocket URL validation
Object.defineProperty(global, 'URL', {
  value: class MockURL {
    public protocol: string;
    public hostname: string;
    public port: string;
    public pathname: string;
    public search: string;
    public searchParams: URLSearchParams;

    constructor(url: string, base?: string | URL) {
      // Parse URL components
      const fullUrl = base ? new URL(url, base.toString()).href : url;
      const match = fullUrl.match(/^(ws|wss|http|https):\/\/([^:\/\s]+)(?::(\d+))?(\/[^?]*)?\??(.*)$/);
      
      if (match) {
        this.protocol = match[1] + ':';
        this.hostname = match[2];
        this.port = match[3] || '';
        this.pathname = match[4] || '/';
        this.search = match[5] ? '?' + match[5] : '';
        this.searchParams = new URLSearchParams(this.search);
      } else {
        throw new Error('Invalid URL');
      }
    }

    toString() {
      return `${this.protocol}//${this.hostname}${this.port ? ':' + this.port : ''}${this.pathname}${this.search}`;
    }
  },
  writable: true
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => [])
  }
});

// Mock localStorage with WebSocket client ID support
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === 'a1betting_client_id') {
      return 'test-client-id-12345';
    }
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null)
};

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(() => null)
};

Object.defineProperty(window, 'sessionStorage', {
  writable: true,
  value: sessionStorageMock
});

// Mock ResizeObserver for components that might use it
Object.defineProperty(global, 'ResizeObserver', {
  value: class MockResizeObserver {
    constructor(callback: ResizeObserverCallback) {}
    observe(target: Element) {}
    unobserve(target: Element) {}
    disconnect() {}
  }
});

// Mock IntersectionObserver
Object.defineProperty(global, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
    observe(target: Element) {}
    unobserve(target: Element) {}
    disconnect() {}
  }
});

// Mock console methods to reduce test noise
const originalConsole = { ...console };

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockImplementation((key: string) => {
    if (key === 'a1betting_client_id') {
      return 'test-client-id-12345';
    }
    return null;
  });
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Reset crypto mock
  (global.crypto.randomUUID as jest.Mock).mockReturnValue('test-uuid-123');
  
  // Mock console methods to reduce noise
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
  console.info = jest.fn();
});

afterEach(() => {
  // Restore original console
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
});

// Utility functions for tests
export const testUtils = {
  /**
   * Create a mock WebSocket instance with predefined behavior
   */
  createMockWebSocket: (url: string = 'ws://localhost:8000/ws/client') => {
    return new MockWebSocket(url);
  },
  
  /**
   * Create a mock EventSource instance
   */
  createMockEventSource: (url: string = 'http://localhost:8000/api/sse/realtime') => {
    return new MockEventSource(url);
  },
  
  /**
   * Wait for a specific amount of time (for timer testing)
   */
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Flush all pending promises
   */
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  /**
   * Mock DOM elements for testing
   */
  mockDOMElements: (selector: string, count: number = 1) => {
    const elements = Array.from({ length: count }, (_, index) => ({
      id: `mock-element-${index}`,
      textContent: count > 0 ? `Mock content ${index}` : '',
      children: { length: count > 0 ? 1 : 0 },
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => [])
    }));
    
    const mockQuerySelectorAll = jest.spyOn(document, 'querySelectorAll');
    const mockQuerySelector = jest.spyOn(document, 'querySelector');
    
    mockQuerySelectorAll.mockImplementation((sel) => {
      return sel === selector ? (elements as any) : [];
    });
    
    mockQuerySelector.mockImplementation((sel) => {
      return sel === selector && elements.length > 0 ? (elements[0] as any) : null;
    });
    
    return elements;
  },

  /**
   * Create mock client ID for WebSocket testing
   */
  mockClientId: (id: string = 'test-client-id-12345') => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      return key === 'a1betting_client_id' ? id : null;
    });
  },

  /**
   * Simulate WebSocket URL scenarios
   */
  testWebSocketScenarios: {
    canonical: 'ws://localhost:8000/ws/client?client_id=test-uuid&version=1&role=frontend',
    legacy: 'ws://localhost:8000/client_/ws/test-uuid',
    invalid: 'not-a-websocket-url',
    secure: 'wss://production.a1betting.com/ws/client?client_id=test-uuid&version=1&role=frontend'
  }
};

// Export mock classes for direct use in tests
export { MockWebSocket, MockEventSource };

// Global test timeout
jest.setTimeout(10000);