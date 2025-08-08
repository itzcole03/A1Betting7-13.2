// Type import for correct assertion

// Robustly disable OpenTelemetry tracing in test environments and avoid import.meta.env
// Only enable tracing in non-test environments and if VITE_OTEL_ENABLED is 'true'

let provider: unknown = null;
// Robustly detect test environment for both Vite and Jest

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
const otelEnabled =
  !isTest &&
  (safeImportMetaEnv('VITE_OTEL_ENABLED') === 'true' ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_OTEL_ENABLED === 'true'));

if (otelEnabled) {
  (async () => {
    try {
      // Use string-based imports to avoid Vite processing them during dependency scan
      const [
        { OTLPTraceExporter },
        { registerInstrumentations },
        { FetchInstrumentation },
        { BatchSpanProcessor },
        { WebTracerProvider },
      ] = await Promise.all([
        // @ts-ignore
        import(/* @vite-ignore */ '@opentelemetry/exporter-trace-otlp-http'),
        // @ts-ignore
        import(/* @vite-ignore */ '@opentelemetry/instrumentation'),
        // @ts-ignore
        import(/* @vite-ignore */ '@opentelemetry/instrumentation-fetch'),
        // @ts-ignore
        import(/* @vite-ignore */ '@opentelemetry/sdk-trace-base'),
        // @ts-ignore
        import(/* @vite-ignore */ '@opentelemetry/sdk-trace-web'),
      ]);

      // Prefer process.env for Jest, import.meta.env for Vite

      const endpoint =
        (typeof process !== 'undefined' && process.env && process.env.VITE_OTEL_ENDPOINT) ||
        safeImportMetaEnv('VITE_OTEL_ENDPOINT') ||
        'http://localhost:4318/v1/traces';

      const exporter = new OTLPTraceExporter({
        url: endpoint,
      });
      provider = new WebTracerProvider({
        spanProcessors: [new BatchSpanProcessor(exporter)],
      });
      (provider as any).register();
      registerInstrumentations({
        instrumentations: [
          new FetchInstrumentation({
            ignoreUrls: [/localhost:4318/],
            propagateTraceHeaderCorsUrls: [/.*/],
          }),
        ],
      });
    } catch (error) {
      console.error('Failed to initialize OpenTelemetry tracing:', error);
    }
  })();
}

export { provider };
