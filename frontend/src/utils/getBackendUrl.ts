// Utility to get backend URL for both Vite (browser) and Jest/Node
const DEFAULT_BACKEND_URL = 'http://localhost:8000';

// Use only process.env for environment variables
export function getBackendUrl(): string {
  return process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || DEFAULT_BACKEND_URL;
}
