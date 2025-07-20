// Jest setup for React Testing Library and import.meta.env mocks
import '@testing-library/jest-dom';

// Mock import.meta.env for tests
Object.defineProperty(globalThis, 'import', {
  value: { meta: { env: {} } },
  writable: true,
});

export {};
