import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      // Add other jest-dom matchers as needed
    }
  }

  // Custom global flag for E2E empty state
  var __JEST_E2E_EMPTY__: boolean | undefined;

  // MSW server for per-test handler overrides
  var server: import('msw/node').SetupServerApi;
}
