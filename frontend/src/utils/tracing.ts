// Simplified tracing utility
// OpenTelemetry functionality temporarily disabled until dependencies are properly installed

const provider: unknown = null;

// Safe environment variable access for both Vite and Jest
function safeImportMetaEnv(key: string): string | undefined {
  try {
    // In test environment, use process.env
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
    // In Vite environment, use import.meta.env if available
    if (typeof window !== 'undefined' && (window as any).__VITE_ENV__) {
      return (window as any).__VITE_ENV__[key];
    }
  } catch (e) {}
  return undefined;
}

const isTest =
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ||
  safeImportMetaEnv('MODE') === 'test';

// OpenTelemetry is temporarily disabled
const otelEnabled = false;

// console.log('Tracing initialized (disabled):', { isTest, otelEnabled });

export { provider };
