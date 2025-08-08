// jest.setup.js
require('@testing-library/jest-dom');
// Mock import.meta.env for Vite compatibility in Jest
if (!globalThis.import) {
  globalThis.import = {};
}
if (!globalThis.import.meta) {
  globalThis.import.meta = {};
}
globalThis.import.meta.env = {
  VITE_BACKEND_URL: 'http://localhost:8000',
  VITE_API_BASE_URL: 'http://localhost:8000',
  VITE_API_HOST: 'localhost',
  VITE_API_PORT: '8000',
  VITE_WS_URL: 'ws://localhost:8000/ws',
  VITE_EXTERNAL_API_URL: 'https://api.sportsdata.io/v3/news',
  VITE_API_URL: 'http://localhost:8000',
  DEV: true,
  MODE: 'test',
  // Add other env vars as needed
};
