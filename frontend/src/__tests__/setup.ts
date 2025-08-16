/**
 * Test Setup for Realtime Enhancement Tests
 * 
 * Configures Jest environment with necessary mocks and utilities.
 */

import '@testing-library/jest-dom';

// Mock WebSocket
class MockWebSocket {
  public readyState: number = WebSocket.CONNECTING;
  public url: string;
  
  constructor(url: string) {
    this.url = url;
  }
  
  send = jest.fn();
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  
  // Simulate connection
  mockConnect() {
    this.readyState = WebSocket.OPEN;
    const event = new Event('open');
    this.dispatchEvent(event);
  }
  
  // Simulate disconnection
  mockDisconnect() {
    this.readyState = WebSocket.CLOSED;
    const event = new Event('close');
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
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

// Mock console methods to reduce test noise
const originalConsole = { ...console };

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  
  // Reset localStorage mock
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  
  // Mock console.warn and console.error to reduce noise
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
      children: { length: count > 0 ? 1 : 0 }
    }));
    
    const mockQuerySelectorAll = document.querySelectorAll as jest.MockedFunction<typeof document.querySelectorAll>;
    const mockQuerySelector = document.querySelector as jest.MockedFunction<typeof document.querySelector>;
    
    mockQuerySelectorAll.mockImplementation((sel) => {
      return sel === selector ? elements as any : [];
    });
    
    mockQuerySelector.mockImplementation((sel) => {
      return sel === selector && elements.length > 0 ? elements[0] as any : null;
    });
    
    return elements;
  }
};

// Export mock classes for direct use in tests
export { MockWebSocket, MockEventSource };