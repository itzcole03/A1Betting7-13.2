// Utility to get backend URL for both Vite (browser) and Jest/Node
const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export function getBackendUrl(): string {
  // Use process.env for all environments (Jest/Node/browser with env polyfill)
  if (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return DEFAULT_BACKEND_URL;
}
