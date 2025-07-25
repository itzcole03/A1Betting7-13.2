// Utility to get backend URL for Vite browser environment
const DEFAULT_BACKEND_URL = 'http://localhost:8000';

// Use import.meta.env for Vite environment variables
export function getBackendUrl(): string {
  return import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || DEFAULT_BACKEND_URL;
}
