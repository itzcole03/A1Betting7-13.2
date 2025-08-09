// Jest DOM setup for testing library
import '@testing-library/jest-dom';

// Configure testing library
import { configure } from '@testing-library/react';

configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
});

// Global test utilities
global.console = {
  ...console,
  // Uncomment to ignore specific logs during tests
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock console methods that are too noisy in tests
beforeAll(() => {
  // Silence console.warn in tests unless specifically testing warning behavior
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

// Clean up after each test
afterEach(() => {
  // Clean up any mocks that should reset between tests
  jest.clearAllMocks();
});
