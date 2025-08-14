"""
Prometheus Metrics Middleware

Provides comprehensive metrics collection for:
- HTTP request/response metrics
- WebSocket connection metrics  
- Performance tracking
- Error rate monitoring
- Business logic metrics

Gracefully handles missing prometheus_client dependency.
"""

import time
from typing import Dict, Set, Optional
from fastapi import Request, Response, WebSocket
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Graceful handling of prometheus_client dependency
try:
    from prometheus_client import (
        Counter, 
        Histogram, 
        Gauge, 
        Summary,
        CollectorRegistry,
        generate_latest,
        CONTENT_TYPE_LATEST
    )
    PROMETHEUS_AVAILABLE = True
except ImportError:
    # Create mock classes if prometheus_client is not available
    class MockMetric:
        def __init__(self, *args, **kwargs): pass
        def inc(self, *args, **kwargs): pass
        def dec(self, *args, **kwargs): pass
        def observe(self, *args, **kwargs): pass
        def labels(self, **kwargs): return self
    
    Counter = Histogram = Gauge = Summary = MockMetric
    CollectorRegistry = MockMetric
    PROMETHEUS_AVAILABLE = False
    
    def generate_latest(registry):
        return b"# Prometheus client not available\n"

class PrometheusMetricsMiddleware(BaseHTTPMiddleware):
    """
    Middleware for collecting Prometheus metrics from FastAPI application
    """

    def __init__(self, app: ASGIApp, registry=None):
        super().__init__(app)
        self.registry = registry if PROMETHEUS_AVAILABLE else None
        
        if PROMETHEUS_AVAILABLE:
            if registry is None:
                self.registry = CollectorRegistry()
            # Initialize metrics
            self._init_http_metrics()
            self._init_websocket_metrics()
            self._init_business_metrics()
        else:
            # Create mock metrics for graceful degradation
            self._init_mock_metrics()
        
        # Active connections tracking
        self.active_websockets: Set[str] = set()

    def _init_mock_metrics(self):
        """Initialize mock metrics when Prometheus is not available"""
        mock = MockMetric()
        
        # HTTP metrics
        self.http_requests_total = mock
        self.http_request_duration_seconds = mock
        self.http_response_size_bytes = mock
        self.http_requests_active = mock
        self.http_errors_total = mock
        
        # WebSocket metrics
        self.websocket_connections_total = mock
        self.websocket_connections_active = mock
        self.websocket_messages_total = mock
        self.websocket_connection_duration_seconds = mock
        
        # Business metrics
        self.sports_requests_total = mock
        self.prediction_accuracy = mock
        self.cache_operations_total = mock
        self.ml_inference_duration_seconds = mock
        self.external_api_duration_seconds = mock

    def _init_http_metrics(self):
        """Initialize HTTP-related metrics"""
        
        # Request counter
        self.http_requests_total = Counter(
            'http_requests_total',
            'Total number of HTTP requests',
            ['method', 'endpoint', 'status_code'],
            registry=self.registry
        )
        
        # Request duration histogram
        self.http_request_duration_seconds = Histogram(
            'http_request_duration_seconds',
            'HTTP request duration in seconds',
            ['method', 'endpoint'],
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
            registry=self.registry
        )
        
        # Response size histogram
        self.http_response_size_bytes = Histogram(
            'http_response_size_bytes',
            'HTTP response size in bytes',
            ['method', 'endpoint'],
            registry=self.registry
        )
        
        # Active requests gauge
        self.http_requests_active = Gauge(
            'http_requests_active',
            'Number of active HTTP requests',
            registry=self.registry
        )
        
        # Error rate counter
        self.http_errors_total = Counter(
            'http_errors_total',
            'Total number of HTTP errors',
            ['method', 'endpoint', 'error_type'],
            registry=self.registry
        )

    def _init_websocket_metrics(self):
        """Initialize WebSocket-related metrics"""
        
        # WebSocket connections
        self.websocket_connections_total = Counter(
            'websocket_connections_total',
            'Total number of WebSocket connections',
            ['endpoint'],
            registry=self.registry
        )
        
        # Active WebSocket connections
        self.websocket_connections_active = Gauge(
            'websocket_connections_active',
            'Number of active WebSocket connections',
            ['endpoint'],
            registry=self.registry
        )
        
        # WebSocket messages
        self.websocket_messages_total = Counter(
            'websocket_messages_total',
            'Total number of WebSocket messages',
            ['endpoint', 'direction', 'message_type'],
            registry=self.registry
        )
        
        # WebSocket connection duration
        self.websocket_connection_duration_seconds = Summary(
            'websocket_connection_duration_seconds',
            'WebSocket connection duration in seconds',
            ['endpoint'],
            registry=self.registry
        )

    def _init_business_metrics(self):
        """Initialize business logic specific metrics"""
        
        # Sports data requests
        self.sports_requests_total = Counter(
            'sports_requests_total',
            'Total number of sports data requests',
            ['sport', 'data_type'],
            registry=self.registry
        )
        
        # Prediction accuracy
        self.prediction_accuracy = Histogram(
            'prediction_accuracy',
            'Prediction accuracy distribution',
            ['model', 'sport'],
            buckets=[0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            registry=self.registry
        )
        
        # Cache hit/miss rates
        self.cache_operations_total = Counter(
            'cache_operations_total',
            'Total number of cache operations',
            ['operation', 'result'],  # operation: get/set/delete, result: hit/miss/success/error
            registry=self.registry
        )
        
        # ML model inference time
        self.ml_inference_duration_seconds = Histogram(
            'ml_inference_duration_seconds',
            'ML model inference duration in seconds',
            ['model_name', 'sport'],
            buckets=[0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0],
            registry=self.registry
        )
        
        # API dependency response times
        self.external_api_duration_seconds = Histogram(
            'external_api_duration_seconds',
            'External API response duration in seconds',
            ['api_name', 'endpoint'],
            buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
            registry=self.registry
        )

    async def dispatch(self, request: Request, call_next) -> Response:
        """Process HTTP request and collect metrics"""
        
        # Track active requests
        self.http_requests_active.inc()
        
        # Extract path pattern (remove IDs for cleaner metrics)
        endpoint = self._normalize_endpoint(request.url.path)
        method = request.method
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Record success metrics
            self.http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=response.status_code
            ).inc()
            
            self.http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            # Track response size if available
            content_length = response.headers.get('content-length')
            if content_length:
                self.http_response_size_bytes.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(int(content_length))
            
            # Track errors for 4xx/5xx status codes
            if response.status_code >= 400:
                error_type = 'client_error' if response.status_code < 500 else 'server_error'
                self.http_errors_total.labels(
                    method=method,
                    endpoint=endpoint,
                    error_type=error_type
                ).inc()
            
            return response
            
        except Exception as exc:
            # Calculate duration for error case
            duration = time.time() - start_time
            
            # Record error metrics
            self.http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=500
            ).inc()
            
            self.http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            self.http_errors_total.labels(
                method=method,
                endpoint=endpoint,
                error_type='exception'
            ).inc()
            
            raise exc
            
        finally:
            # Track active requests
            self.http_requests_active.dec()

    def track_websocket_connection(self, endpoint: str, connection_id: str):
        """Track WebSocket connection start"""
        self.websocket_connections_total.labels(endpoint=endpoint).inc()
        self.websocket_connections_active.labels(endpoint=endpoint).inc()
        self.active_websockets.add(f"{endpoint}:{connection_id}")

    def track_websocket_disconnection(self, endpoint: str, connection_id: str, duration_seconds: float):
        """Track WebSocket connection end"""
        self.websocket_connections_active.labels(endpoint=endpoint).dec()
        self.websocket_connection_duration_seconds.labels(endpoint=endpoint).observe(duration_seconds)
        self.active_websockets.discard(f"{endpoint}:{connection_id}")

    def track_websocket_message(self, endpoint: str, direction: str, message_type: str = "unknown"):
        """Track WebSocket message"""
        self.websocket_messages_total.labels(
            endpoint=endpoint,
            direction=direction,  # 'inbound' or 'outbound'
            message_type=message_type
        ).inc()

    def track_sports_request(self, sport: str, data_type: str):
        """Track sports data request"""
        self.sports_requests_total.labels(sport=sport, data_type=data_type).inc()

    def track_prediction_accuracy(self, model: str, sport: str, accuracy: float):
        """Track prediction accuracy"""
        self.prediction_accuracy.labels(model=model, sport=sport).observe(accuracy)

    def track_cache_operation(self, operation: str, result: str):
        """Track cache operation"""
        self.cache_operations_total.labels(operation=operation, result=result).inc()

    def track_ml_inference(self, model_name: str, sport: str, duration_seconds: float):
        """Track ML model inference time"""
        self.ml_inference_duration_seconds.labels(
            model_name=model_name,
            sport=sport
        ).observe(duration_seconds)

    def track_external_api_call(self, api_name: str, endpoint: str, duration_seconds: float):
        """Track external API call duration"""
        self.external_api_duration_seconds.labels(
            api_name=api_name,
            endpoint=endpoint
        ).observe(duration_seconds)

    def _normalize_endpoint(self, path: str) -> str:
        """Normalize endpoint path for cleaner metrics"""
        # Replace common ID patterns with placeholders
        import re
        
        # Replace numeric IDs
        path = re.sub(r'/\d+', '/{id}', path)
        
        # Replace UUIDs
        path = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/{uuid}', path, flags=re.IGNORECASE)
        
        # Replace game IDs (common pattern)
        path = re.sub(r'/game_\d+', '/game_{id}', path)
        
        return path

    def get_metrics(self) -> str:
        """Get metrics in Prometheus format"""
        return generate_latest(self.registry).decode('utf-8')


# Global metrics instance (initialized in app factory)
metrics: Optional[PrometheusMetricsMiddleware] = None


def get_metrics_middleware() -> Optional[PrometheusMetricsMiddleware]:
    """Get the global metrics middleware instance"""
    return metrics


def set_metrics_middleware(middleware: PrometheusMetricsMiddleware):
    """Set the global metrics middleware instance"""
    global metrics
    metrics = middleware
