// Unified environment variable accessor for Vite and Jest

export function getEnvVar(key: string, fallback?: string): string | undefined {
  // Vite/browser: import.meta.env (only in ESM context)
  let value: string | undefined = undefined;
  try {
    // Only access import.meta.env via dynamic function to avoid SyntaxError in CJS/Jest
    const getViteEnv = new Function(
      'key',
      'fallback',
      `try { if (typeof import !== 'undefined' && import.meta && import.meta.env && key in import.meta.env) { return import.meta.env[key] ?? fallback; } } catch (e) {} return undefined;`
    );
    value = getViteEnv(key, fallback);
    if (value !== undefined) return value;
  } catch (e) {}

  // Jest: globalThis.import.meta.env (mocked in jest.env.mock.js)
  if (
    typeof globalThis !== 'undefined' &&
    (globalThis as any).import &&
    (globalThis as any).import.meta &&
    (globalThis as any).import.meta.env &&
    key in (globalThis as any).import.meta.env
  ) {
    return (globalThis as any).import.meta.env[key] ?? fallback;
  }

  // Node: process.env
  if (typeof process !== 'undefined' && process.env && key in process.env) {
    return process.env[key] ?? fallback;
  }
  return fallback;
}
