// Jest DOM setup for testing library
import '@testing-library/jest-dom';

// Configure testing library
import { configure } from '@testing-library/react';

// Make React available globally for tests that use JSX without explicit import
import React from 'react';
globalThis.React = React;

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

// Vitest `vi` compatibility shim for tests that use `vi` mocks/spies
// Provides a minimal subset mapped to Jest equivalents so tests written
// for Vitest don't error under Jest.
if (typeof globalThis.vi === 'undefined') {
  globalThis.vi = {
    fn: (...args) => jest.fn(...args),
    spyOn: (obj, prop) => jest.spyOn(obj, prop),
    clearAllMocks: () => jest.clearAllMocks(),
    restoreAllMocks: () => jest.restoreAllMocks(),
    useFakeTimers: () => jest.useFakeTimers(),
    useRealTimers: () => jest.useRealTimers(),
  // Vitest provides `mocked` to get typed mock; under Jest we return the function
  mocked: (fn) => fn,
  };
}

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
