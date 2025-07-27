// Utility to get backend URL for all environments (Vite/browser and Jest/node)
const DEFAULT_BACKEND_URL = 'http://localhost:8000';

export function getBackendUrl(): string {
  // Always use process.env, as Vite will replace these at build time
  return (
    process.env.BACKEND_URL ||
    process.env.API_URL ||
    process.env.VITE_BACKEND_URL ||
    process.env.VITE_API_URL ||
    DEFAULT_BACKEND_URL
  );
}
