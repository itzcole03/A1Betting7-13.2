// Utility to get backend URL for all environments (Vite/browser and Jest/node)
const DEFAULT_BACKEND_URL = 'http://localhost:8000';

// Use dynamic function to avoid import.meta parsing in Node/Jest
function getViteEnvSafe(): Record<string, string> {
  // In Jest/Node, skip import.meta entirely
  if (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID) {
    return {};
  }
  // Only access import.meta.env if it exists and is an object, using dynamic function
  try {
     
    const getEnv = new Function(
      'return (typeof import!=="undefined" && import.meta && import.meta.env) ? import.meta.env : {}'
    );
    return getEnv();
  } catch (e) {
    // Ignore if import.meta is not defined
  }
  return {};
}

export function getBackendUrl(): string {
  const viteEnv = getViteEnvSafe();
  // In a browser dev server session (Vite), prefer a relative base so the
  // dev proxy forwards /api requests to the backend and avoids CORS issues.
  // For Jest/Node, keep returning the absolute URL.
  try {
    const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    const isDev = import.meta.env ? import.meta.env.MODE === 'development' : false;
    if (inBrowser && isDev) {
      return ''; // use relative paths like '/api/...' so Vite proxy picks them up
    }
  } catch (e) {
    // ignore - fall back to legacy logic
  }

  return (
    viteEnv.VITE_BACKEND_URL ||
    viteEnv.VITE_API_URL ||
    viteEnv.BACKEND_URL ||
    viteEnv.API_URL ||
    (typeof process !== 'undefined' &&
      process.env &&
      (process.env.VITE_BACKEND_URL ||
        process.env.VITE_API_URL ||
        process.env.BACKEND_URL ||
        process.env.API_URL)) ||
    DEFAULT_BACKEND_URL
  );
}
