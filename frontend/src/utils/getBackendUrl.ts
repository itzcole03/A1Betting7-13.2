// Utility to get backend URL for all environments (Vite/browser and Jest/node)
const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export function getBackendUrl(): string {
  // Use import.meta.env for Vite/browser, fallback to process.env for Node/Jest
  const viteEnv = (import.meta as any).env || {};
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
