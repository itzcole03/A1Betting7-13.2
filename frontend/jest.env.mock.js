// Mock import.meta.env for Vite compatibility in Jest
if (!globalThis.import) {
  globalThis.import = {};
}
if (!globalThis.import.meta) {
  globalThis.import.meta = {};
}
if (!globalThis.import.meta.env) {
  globalThis.import.meta.env = {
    VITE_BACKEND_URL: 'http://localhost:8000',
    NODE_ENV: 'test',
    // Add other env vars as needed
  };
}
