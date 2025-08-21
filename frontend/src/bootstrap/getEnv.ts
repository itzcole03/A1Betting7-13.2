// Safe environment accessor for both Vite (import.meta.env) and Node/Jest (process.env)
export function getEnvVar(name: string, fallback?: string): string | undefined {
  // Try Vite style import.meta.env if available via globalThis shim
  try {
    // Some test environments or bundlers expose a shimmed object on globalThis
    const maybeImportMeta = (globalThis as any).importMeta ?? (globalThis as any).__import_meta__;
    if (maybeImportMeta && maybeImportMeta.env) {
      return maybeImportMeta.env[name] ?? fallback;
    }
  } catch (e) {
    // ignore - not available
  }

  // Fallback to process.env for Jest/Node
  if (typeof process !== 'undefined' && process.env) {
    return process.env[name] ?? fallback;
  }

  return fallback;
}

export function isDev(): boolean {
  const v = getEnvVar('VITE_DEV') ?? getEnvVar('DEV');
  if (typeof v === 'string') return v === 'true' || v === '1';
  if (typeof process !== 'undefined') return process.env.NODE_ENV === 'development';
  return false;
}

export function isProd(): boolean {
  const v = getEnvVar('VITE_PROD') ?? getEnvVar('PROD');
  if (typeof v === 'string') return v === 'true' || v === '1';
  if (typeof process !== 'undefined') return process.env.NODE_ENV === 'production';
  return false;
}
