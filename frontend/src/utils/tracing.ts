// OpenTelemetry tracing setup for React + SigNoz (2025 best practice)
// Tracing is disabled unless VITE_OTEL_ENABLED is set to 'true'.

//
const otelEnabled = import.meta.env.VITE_OTEL_ENABLED === 'true';

let provider: any = null;
if (otelEnabled) {
  // Only import and initialize tracing if enabled

  import('@opentelemetry/exporter-trace-otlp-http').then(({ OTLPTraceExporter }) => {
    import('@opentelemetry/instrumentation').then(({ registerInstrumentations }) => {
      import('@opentelemetry/instrumentation-fetch').then(({ FetchInstrumentation }) => {
        import('@opentelemetry/sdk-trace-base').then(({ BatchSpanProcessor }) => {
          import('@opentelemetry/sdk-trace-web').then(({ WebTracerProvider }) => {
            const exporter = new OTLPTraceExporter({
              url: import.meta.env.VITE_OTEL_ENDPOINT || 'http://localhost:4318/v1/traces',
            });
            provider = new WebTracerProvider({
              spanProcessors: [new BatchSpanProcessor(exporter)],
            });
            provider.register();
            registerInstrumentations({
              instrumentations: [
                new FetchInstrumentation({
                  ignoreUrls: [/localhost:4318/],
                  propagateTraceHeaderCorsUrls: [/.*/],
                }),
              ],
            });
          });
        });
      });
    });
  });
}

export { provider };
