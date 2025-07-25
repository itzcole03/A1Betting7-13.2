// Type import for correct assertion

// Robustly disable OpenTelemetry tracing in test environments and avoid import.meta.env
// Only enable tracing in non-test environments and if VITE_OTEL_ENABLED is 'true'

let provider: unknown = null;
const isTest = import.meta.env.MODE === 'test';
const otelEnabled = !isTest && import.meta.env.VITE_OTEL_ENABLED === 'true';

if (otelEnabled) {
  (async () => {
    try {
      const [
        { OTLPTraceExporter },
        { registerInstrumentations },
        { FetchInstrumentation },
        { BatchSpanProcessor },
        { WebTracerProvider },
      ] = await Promise.all([
        // @ts-ignore
        import('@opentelemetry/exporter-trace-otlp-http'),
        // @ts-ignore
        import('@opentelemetry/instrumentation'),
        // @ts-ignore
        import('@opentelemetry/instrumentation-fetch'),
        // @ts-ignore
        import('@opentelemetry/sdk-trace-base'),
        // @ts-ignore
        import('@opentelemetry/sdk-trace-web'),
      ]);

      const exporter = new OTLPTraceExporter({
        url: import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces',
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
