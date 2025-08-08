// Simplified tracing utility
// OpenTelemetry functionality temporarily disabled until dependencies are properly installed

let provider: unknown = null;

// Use eval to prevent Jest from parsing import.meta
function safeImportMetaEnv(key: string): string | undefined {
  try {
    // eslint-disable-next-line no-eval
    const meta = eval(
      'typeof import !== "undefined" && typeof import.meta !== "undefined" ? import.meta.env : undefined'
    );
    if (meta && key in meta) {
      return meta[key];
    }
  } catch (e) {}
  return undefined;
}

const isTest =
  (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') ||
  safeImportMetaEnv('MODE') === 'test';

// OpenTelemetry is temporarily disabled
const otelEnabled = false;

console.log('Tracing initialized (disabled):', { isTest, otelEnabled });

export { provider };
