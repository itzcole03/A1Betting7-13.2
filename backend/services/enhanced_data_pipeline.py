import os
import time

from prometheus_client import CollectorRegistry, Counter, Histogram

# Avoid metric registration in test mode
if "PYTEST_CURRENT_TEST" in os.environ or os.getenv("A1BETTING_TEST_MODE") == "1":
    # Use a fresh registry for tests
    registry = CollectorRegistry()
    fetch_success = Counter(
        "fetch_success_total", "Successful fetches", registry=registry
    )
    fetch_failure = Counter("fetch_failure_total", "Failed fetches", registry=registry)
    fetch_latency = Histogram(
        "fetch_latency_seconds", "Fetch latency", registry=registry
    )
else:
    fetch_success = Counter("fetch_success_total", "Successful fetches")
    fetch_failure = Counter("fetch_failure_total", "Failed fetches")
    fetch_latency = Histogram("fetch_latency_seconds", "Fetch latency")


async def fetch_with_metrics(fetch_func, *args, **kwargs):
    start = time.time()
    try:
        result = await fetch_func(*args, **kwargs)
        fetch_success.inc()
        return result
    except Exception as e:
        fetch_failure.inc()
        raise
    finally:
        fetch_latency.observe(time.time() - start)


"""
Enhanced Real-Time Data Pipeline with Circuit Breakers and Streaming
Advanced data pipeline with resilience patterns, real-time streaming, and intelligent routing
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, AsyncGenerator, Callable, Dict, List, Optional, Set, Tuple

import aiohttp
import numpy as np
import pandas as pd
import websockets

from backend.services.intelligent_cache_service import intelligent_cache_service
from backend.services.unified_error_handler import unified_error_handler
from backend.services.unified_logging import get_logger, unified_logging
from backend.utils.enhanced_logging import get_logger

logger = get_logger("enhanced_data_pipeline")
unified_logger = get_logger("enhanced_data_pipeline")


class DataSourceState(Enum):
    """Data source health states"""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    MAINTENANCE = "maintenance"


async def fetch_with_retries(url, max_retries=3, timeout=10):
    attempt = 0
    while attempt < max_retries:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=timeout) as response:
                    if response.status == 200:
                        data = await response.json()
                        unified_logger.info(
                            {"url": url, "status": response.status, "attempt": attempt}
                        )
                        return data
                    else:
                        unified_logger.warn(
                            {"url": url, "status": response.status, "attempt": attempt}
                        )
        except Exception as e:
            unified_error_handler.handle_error(
                e,
                context="fetch_with_retries",
                user_context={"url": url, "attempt": attempt},
            )
        attempt += 1
        await asyncio.sleep(2 * attempt)  # Exponential backoff
    unified_logger.error({"url": url, "error": "Max retries exceeded"})
    return None


class CircuitBreakerState(Enum):
    """Circuit breaker states"""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing fast
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class DataSourceMetrics:
    """Metrics for data source monitoring"""

    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    avg_response_time: float = 0.0
    last_success: Optional[datetime] = None
    last_failure: Optional[datetime] = None
    consecutive_failures: int = 0
    circuit_breaker_state: CircuitBreakerState = CircuitBreakerState.CLOSED


@dataclass
class StreamingDataPoint:
    """Real-time streaming data point"""

    source: str
    timestamp: datetime
    data_type: str
    payload: Dict[str, Any]
    sequence_id: int
    checksum: str


class CircuitBreaker:
    """Circuit breaker for resilient data source handling"""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        success_threshold: int = 3,
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold

        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info("CIRCUIT_BREAKER: Circuit breaker transitioning to HALF_OPEN")
            else:
                raise Exception("Circuit breaker is OPEN - failing fast")

        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result

        except Exception as e:
            await self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        """Check if circuit breaker should attempt reset"""
        if self.last_failure_time is None:
            return True

        return (
            datetime.now() - self.last_failure_time
        ).seconds >= self.recovery_timeout

    async def _on_success(self):
        """Handle successful operation"""
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.success_threshold:
                self.state = CircuitBreakerState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                logger.info("SUCCESS: Circuit breaker CLOSED - service recovered")

        self.failure_count = 0

    async def _on_failure(self):
        """Handle failed operation"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.OPEN
            logger.warning("ERROR: Circuit breaker OPEN - service still failing")
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            logger.warning(
                f"🚨 Circuit breaker OPEN - {self.failure_count} consecutive failures"
            )


class DataCompressionService:
    """Service for compressing and decompressing data payloads"""

    @staticmethod
    async def compress_json(data: Dict[str, Any]) -> bytes:
        """Compress JSON data using gzip"""
        import gzip

        json_bytes = json.dumps(data, separators=(",", ":")).encode("utf-8")
        return gzip.compress(json_bytes)

    @staticmethod
    async def decompress_json(compressed_data: bytes) -> Dict[str, Any]:
        """Decompress gzipped JSON data"""
        import gzip

        json_bytes = gzip.decompress(compressed_data)
        return json.loads(json_bytes.decode("utf-8"))

    @staticmethod
    async def calculate_compression_ratio(
        original: Dict[str, Any], compressed: bytes
    ) -> float:
        """Calculate compression ratio"""
        original_size = len(json.dumps(original).encode("utf-8"))
        compressed_size = len(compressed)
        return compressed_size / original_size if original_size > 0 else 1.0


class EnhancedDataPipeline:
    """
    Enhanced data pipeline with:
    - Circuit breaker patterns for resilience
    - Real-time streaming capabilities
    - Intelligent caching and compression
    - Advanced monitoring and alerting
    - Parallel data processing with backpressure
    """

    def __init__(self):
        self.data_sources: Dict[str, CircuitBreaker] = {}
        self.source_metrics: Dict[str, DataSourceMetrics] = {}
        self.streaming_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.compression_service = DataCompressionService()

        # Configuration
        self.max_concurrent_requests = 50
        self.request_timeout = 30
        self.streaming_buffer_size = 1000
        self.compression_threshold = 1024  # Compress payloads > 1KB

        # Internal state
        self.semaphore = asyncio.Semaphore(self.max_concurrent_requests)
        self.streaming_queue: asyncio.Queue = asyncio.Queue(
            maxsize=self.streaming_buffer_size
        )
        self.sequence_counter = 0

        # Background tasks
        self._streaming_task: Optional[asyncio.Task] = None
        self._metrics_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Initialize enhanced data pipeline"""
        # Start background tasks
        self._streaming_task = asyncio.create_task(self._streaming_processor())
        self._metrics_task = asyncio.create_task(self._metrics_collector())

        logger.info("STARTUP: Enhanced data pipeline initialized")

    def register_data_source(self, source_name: str, **circuit_breaker_config) -> None:
        """Register a data source with circuit breaker protection"""
        self.data_sources[source_name] = CircuitBreaker(**circuit_breaker_config)
        self.source_metrics[source_name] = DataSourceMetrics()

        logger.info(f"DATASOURCE: Registered data source: {source_name}")

    async def fetch_data_with_resilience(
        self,
        source_name: str,
        fetch_function: Callable,
        *args,
        use_cache: bool = True,
        cache_ttl: int = 300,
        compression: bool = True,
        **kwargs,
    ) -> Optional[Dict[str, Any]]:
        """Fetch data with circuit breaker protection and intelligent caching"""
        if source_name not in self.data_sources:
            self.register_data_source(source_name)

        circuit_breaker = self.data_sources[source_name]
        metrics = self.source_metrics[source_name]

        # Generate cache key
        cache_key = f"data:{source_name}:{hashlib.md5(str(args + tuple(kwargs.items())).encode()).hexdigest()}"

        # Try cache first
        if use_cache:
            cached_data = await intelligent_cache_service.get(cache_key)
            if cached_data is not None:
                logger.debug(f"CACHE: Cache hit for {source_name}")
                return cached_data

        # Acquire semaphore for rate limiting
        async with self.semaphore:
            start_time = time.time()

            try:
                metrics.total_requests += 1

                # Fetch data through circuit breaker
                data = await circuit_breaker.call(
                    self._execute_with_timeout, fetch_function, *args, **kwargs
                )

                # Update metrics
                response_time = time.time() - start_time
                metrics.successful_requests += 1
                metrics.avg_response_time = (
                    metrics.avg_response_time * 0.9 + response_time * 0.1
                )
                metrics.last_success = datetime.now()
                metrics.consecutive_failures = 0
                metrics.circuit_breaker_state = circuit_breaker.state

                # Cache successful response
                if use_cache and data is not None:
                    # Compress if payload is large
                    if (
                        compression
                        and len(json.dumps(data).encode()) > self.compression_threshold
                    ):
                        compressed_data = await self.compression_service.compress_json(
                            data
                        )
                        compression_ratio = (
                            await self.compression_service.calculate_compression_ratio(
                                data, compressed_data
                            )
                        )

                        cache_data = {
                            "compressed": True,
                            "data": compressed_data.hex(),
                            "compression_ratio": compression_ratio,
                        }

                        logger.debug(
                            f"🗜️ Compressed {source_name} data by {(1-compression_ratio)*100:.1f}%"
                        )
                    else:
                        cache_data = {"compressed": False, "data": data}

                    await intelligent_cache_service.set(
                        cache_key,
                        cache_data,
                        ttl_seconds=cache_ttl,
                        user_context=source_name,
                    )

                # Stream data if there are active connections
                if self.streaming_connections:
                    await self._queue_for_streaming(source_name, data)

                return data

            except Exception as e:
                # Update failure metrics
                metrics.failed_requests += 1
                metrics.last_failure = datetime.now()
                metrics.consecutive_failures += 1
                metrics.circuit_breaker_state = circuit_breaker.state

                logger.error(f"ERROR: Data fetch failed for {source_name}: {e}")

                # Try to return stale cached data as fallback
                if use_cache:
                    stale_data = await intelligent_cache_service.get(
                        f"stale:{cache_key}"
                    )
                    if stale_data is not None:
                        logger.warning(f"WARNING: Returning stale data for {source_name}")
                        return stale_data

                raise

    async def _execute_with_timeout(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with timeout"""
        return await asyncio.wait_for(
            func(*args, **kwargs), timeout=self.request_timeout
        )

    async def fetch_parallel_data(
        self, sources: List[Tuple[str, Callable, tuple, dict]], max_failures: int = None
    ) -> Dict[str, Optional[Dict[str, Any]]]:
        """Fetch data from multiple sources in parallel with failure tolerance"""
        if max_failures is None:
            max_failures = len(sources) // 2  # Allow up to 50% failures

        tasks = []
        source_names = []

        for source_name, fetch_func, args, kwargs in sources:
            task = asyncio.create_task(
                self.fetch_data_with_resilience(
                    source_name, fetch_func, *args, **kwargs
                )
            )
            tasks.append(task)
            source_names.append(source_name)

        # Wait for completion with failure tolerance
        results = {}
        completed_tasks = await asyncio.gather(*tasks, return_exceptions=True)

        failure_count = 0
        for source_name, result in zip(source_names, completed_tasks):
            if isinstance(result, Exception):
                results[source_name] = None
                failure_count += 1
                logger.error(f"ERROR: Parallel fetch failed for {source_name}: {result}")
            else:
                results[source_name] = result

        # Check if too many failures occurred
        if failure_count > max_failures:
            logger.error(
                f"🚨 Too many parallel fetch failures: {failure_count}/{len(sources)}"
            )
            raise Exception(
                f"Parallel fetch exceeded failure threshold: {failure_count}/{len(sources)}"
            )

        logger.info(
            f"ANALYTICS: Parallel fetch completed: {len(sources)-failure_count}/{len(sources)} successful"
        )

        return results

    async def start_streaming_server(self, port: int = 8765) -> None:
        """Start WebSocket server for real-time data streaming"""

        async def handle_client(websocket, path):
            client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
            self.streaming_connections[client_id] = websocket

            logger.info(f"STREAMING: Streaming client connected: {client_id}")

            try:
                await websocket.wait_closed()
            except websockets.exceptions.ConnectionClosed:
                pass
            finally:
                if client_id in self.streaming_connections:
                    del self.streaming_connections[client_id]
                    logger.info(f"STREAMING: Streaming client disconnected: {client_id}")

        start_server = websockets.serve(handle_client, "localhost", port)
        await start_server

        logger.info(f"🌐 Streaming server started on port {port}")

    async def _queue_for_streaming(self, source: str, data: Dict[str, Any]) -> None:
        """Queue data for real-time streaming"""
        try:
            streaming_point = StreamingDataPoint(
                source=source,
                timestamp=datetime.now(timezone.utc),
                data_type="update",
                payload=data,
                sequence_id=self.sequence_counter,
                checksum=hashlib.md5(
                    json.dumps(data, sort_keys=True).encode()
                ).hexdigest(),
            )

            self.sequence_counter += 1

            # Try to put in queue without blocking
            try:
                self.streaming_queue.put_nowait(streaming_point)
            except asyncio.QueueFull:
                # Remove oldest item and add new one
                try:
                    self.streaming_queue.get_nowait()
                    self.streaming_queue.put_nowait(streaming_point)
                    logger.warning("WARNING: Streaming queue full - dropped oldest message")
                except asyncio.QueueEmpty:
                    pass

        except Exception as e:
            logger.error(f"ERROR: Failed to queue streaming data: {e}")

    async def _streaming_processor(self) -> None:
        """Background task to process streaming queue"""
        while True:
            try:
                # Get data from queue with timeout
                streaming_point = await asyncio.wait_for(
                    self.streaming_queue.get(), timeout=5.0
                )

                # Send to all connected clients
                if self.streaming_connections:
                    message = {
                        "type": "data_update",
                        "source": streaming_point.source,
                        "timestamp": streaming_point.timestamp.isoformat(),
                        "sequence_id": streaming_point.sequence_id,
                        "checksum": streaming_point.checksum,
                        "data": streaming_point.payload,
                    }

                    # Send to all clients in parallel
                    send_tasks = []
                    for client_id, websocket in list(
                        self.streaming_connections.items()
                    ):
                        send_tasks.append(
                            self._send_to_client(client_id, websocket, message)
                        )

                    if send_tasks:
                        await asyncio.gather(*send_tasks, return_exceptions=True)

            except asyncio.TimeoutError:
                # No messages in queue - continue
                continue
            except Exception as e:
                logger.error(f"ERROR: Streaming processor error: {e}")
                await asyncio.sleep(1)

    async def _send_to_client(
        self, client_id: str, websocket, message: Dict[str, Any]
    ) -> None:
        """Send message to specific client"""
        try:
            await websocket.send(json.dumps(message))
        except websockets.exceptions.ConnectionClosed:
            # Clean up closed connection
            if client_id in self.streaming_connections:
                del self.streaming_connections[client_id]
        except Exception as e:
            logger.error(f"ERROR: Failed to send to client {client_id}: {e}")

    async def _metrics_collector(self) -> None:
        """Background task to collect and log metrics"""
        while True:
            try:
                await asyncio.sleep(60)  # Collect metrics every minute

                # Calculate aggregate metrics
                total_requests = sum(
                    m.total_requests for m in self.source_metrics.values()
                )
                total_successes = sum(
                    m.successful_requests for m in self.source_metrics.values()
                )
                total_failures = sum(
                    m.failed_requests for m in self.source_metrics.values()
                )

                success_rate = (
                    (total_successes / total_requests * 100)
                    if total_requests > 0
                    else 0
                )

                # Log metrics
                logger.info(
                    f"ANALYTICS: Pipeline metrics - Total: {total_requests}, "
                    f"Success: {total_successes} ({success_rate:.1f}%), "
                    f"Failures: {total_failures}, "
                    f"Active streams: {len(self.streaming_connections)}"
                )

                # Check for unhealthy sources
                for source_name, metrics in self.source_metrics.items():
                    if metrics.consecutive_failures >= 3:
                        logger.warning(
                            f"WARNING: Source {source_name} has {metrics.consecutive_failures} consecutive failures"
                        )

            except Exception as e:
                logger.error(f"ERROR: Metrics collection error: {e}")

    async def get_health_status(self) -> Dict[str, Any]:
        """Get overall pipeline health status"""
        health = {
            "overall_status": "healthy",
            "sources": {},
            "streaming": {
                "active_connections": len(self.streaming_connections),
                "queue_size": self.streaming_queue.qsize(),
            },
        }

        unhealthy_sources = 0

        for source_name, metrics in self.source_metrics.items():
            source_health = "healthy"

            if metrics.circuit_breaker_state == CircuitBreakerState.OPEN:
                source_health = "failed"
                unhealthy_sources += 1
            elif metrics.consecutive_failures > 0:
                source_health = "degraded"

            health["sources"][source_name] = {
                "status": source_health,
                "circuit_breaker": metrics.circuit_breaker_state.value,
                "total_requests": metrics.total_requests,
                "success_rate": (
                    metrics.successful_requests / metrics.total_requests * 100
                    if metrics.total_requests > 0
                    else 0
                ),
                "avg_response_time": metrics.avg_response_time,
                "consecutive_failures": metrics.consecutive_failures,
                "last_success": (
                    metrics.last_success.isoformat() if metrics.last_success else None
                ),
            }

        # Determine overall health
        if unhealthy_sources > len(self.source_metrics) // 2:
            health["overall_status"] = "critical"
        elif unhealthy_sources > 0:
            health["overall_status"] = "degraded"

        return health

    async def close(self) -> None:
        """Cleanup pipeline resources"""
        # Cancel background tasks
        for task in [self._streaming_task, self._metrics_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        # Close streaming connections
        for websocket in self.streaming_connections.values():
            await websocket.close()

        self.streaming_connections.clear()

        logger.info("SHUTDOWN: Enhanced data pipeline shutdown completed")


# Global instance
enhanced_data_pipeline = EnhancedDataPipeline()
