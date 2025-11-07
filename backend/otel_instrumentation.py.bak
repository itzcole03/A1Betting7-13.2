from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Configure OpenTelemetry TracerProvider
resource = Resource(attributes={SERVICE_NAME: "A1Betting-Backend"})
provider = TracerProvider(resource=resource)
trace.set_tracer_provider(provider)

# Configure SigNoz OTLP exporter
otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces")
span_processor = BatchSpanProcessor(otlp_exporter)
provider.add_span_processor(span_processor)


def instrument_app(app):
    FastAPIInstrumentor.instrument_app(app)
