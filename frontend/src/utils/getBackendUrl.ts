// Utility to get backend URL for all environments (Vite/browser and Jest/node)
const DEFAULT_BACKEND_URL = 'http://localhost:8000';

// Safe read of Vite-style import.meta.env via a global shim if available
function getViteEnvSafe(): Record<string, string> {
  // In Jest/Node, skip import.meta entirely if running as a test worker
  if (typeof process !== 'undefined' && process.env && process.env.JEST_WORKER_ID) {
    return {};
  }

  try {
    const maybeImportMeta = (globalThis as any).importMeta ?? (globalThis as any).__import_meta__;
    if (maybeImportMeta && maybeImportMeta.env) {
      return maybeImportMeta.env as Record<string, string>;
    }
  } catch (e) {
    // ignore
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
    // Prefer checking a safe shim or NODE_ENV to detect development
    const viteEnv = getViteEnvSafe();
    const isDev =
      (viteEnv && viteEnv.MODE === 'development') || process.env.NODE_ENV === 'development';
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
