"""
Response Optimizer for FastAPI
Implements 2024-2025 best practices for response optimization, compression, and caching.
"""

import asyncio
import gzip
import json
import time
import zlib
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from fastapi import Response
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.background import BackgroundTask
from starlette.responses import Response as StarletteResponse

try:
    from backend.services.advanced_caching_system import advanced_caching_system
    from backend.utils.structured_logging import app_logger, performance_logger
except ImportError:
    import logging

    app_logger = logging.getLogger("response_optimizer")
    performance_logger = logging.getLogger("performance")
    advanced_caching_system = None


class CompressionType(Enum):
    """Compression algorithms"""

    NONE = "none"
    GZIP = "gzip"
    DEFLATE = "deflate"
    BROTLI = "br"


class ResponseFormat(Enum):
    """Response format types"""

    JSON = "json"
    STREAM = "stream"
    PAGINATED = "paginated"
    COMPRESSED = "compressed"


@dataclass
class ResponseMetrics:
    """Response performance metrics"""

    endpoint: str
    method: str
    status_code: int
    original_size: int
    compressed_size: int
    compression_ratio: float
    compression_time: float
    total_time: float
    cache_hit: bool
    timestamp: float


@dataclass
class OptimizationConfig:
    """Response optimization configuration"""

    enable_compression: bool = True
    compression_threshold: int = 1024  # bytes
    preferred_compression: CompressionType = CompressionType.GZIP
    enable_streaming: bool = True
    streaming_threshold: int = 10000  # items
    enable_pagination: bool = True
    default_page_size: int = 100
    max_page_size: int = 1000
    enable_caching: bool = True
    default_cache_ttl: int = 300  # seconds


class CompressionService:
    """Handles response compression"""

    @staticmethod
    def should_compress(content_length: int, threshold: int = 1024) -> bool:
        """Determine if content should be compressed"""
        return content_length >= threshold

    @staticmethod
    def detect_best_compression(accept_encoding: str) -> CompressionType:
        """Detect best compression method from Accept-Encoding header"""

        if not accept_encoding:
            return CompressionType.NONE

        accept_encoding = accept_encoding.lower()

        # Check in order of preference (best compression first)
        if "br" in accept_encoding:
            return CompressionType.BROTLI
        elif "gzip" in accept_encoding:
            return CompressionType.GZIP
        elif "deflate" in accept_encoding:
            return CompressionType.DEFLATE
        else:
            return CompressionType.NONE

    @staticmethod
    def compress_content(content: bytes, compression_type: CompressionType) -> bytes:
        """Compress content using specified algorithm"""

        if compression_type == CompressionType.GZIP:
            return gzip.compress(content)
        elif compression_type == CompressionType.DEFLATE:
            return zlib.compress(content)
        elif compression_type == CompressionType.BROTLI:
            try:
                import brotli

                return brotli.compress(content)
            except ImportError:
                # Fallback to gzip if brotli not available
                return gzip.compress(content)
        else:
            return content

    @staticmethod
    def get_encoding_header(compression_type: CompressionType) -> Optional[str]:
        """Get Content-Encoding header value"""

        if compression_type == CompressionType.GZIP:
            return "gzip"
        elif compression_type == CompressionType.DEFLATE:
            return "deflate"
        elif compression_type == CompressionType.BROTLI:
            return "br"
        else:
            return None


class PaginationService:
    """Handles response pagination"""

    @staticmethod
    def paginate_data(
        data: List[Any], page: int = 1, page_size: int = 100, max_page_size: int = 1000
    ) -> Dict[str, Any]:
        """Paginate list data"""

        # Validate parameters
        page = max(1, page)
        page_size = min(max(1, page_size), max_page_size)

        total_items = len(data)
        total_pages = (total_items + page_size - 1) // page_size

        # Calculate offset
        offset = (page - 1) * page_size

        # Get page data
        page_data = data[offset : offset + page_size]

        return {
            "data": page_data,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1,
                "next_page": page + 1 if page < total_pages else None,
                "previous_page": page - 1 if page > 1 else None,
            },
        }

    @staticmethod
    def create_pagination_links(
        base_url: str, pagination: Dict[str, Any], query_params: Dict[str, str] = None
    ) -> Dict[str, Optional[str]]:
        """Create pagination navigation links"""

        if query_params is None:
            query_params = {}

        def build_url(page: int) -> str:
            params = query_params.copy()
            params["page"] = str(page)
            params["page_size"] = str(pagination["page_size"])

            query_string = "&".join(f"{k}={v}" for k, v in params.items())
            return f"{base_url}?{query_string}"

        links = {
            "self": build_url(pagination["page"]),
            "first": build_url(1),
            "last": build_url(pagination["total_pages"]),
            "next": (
                build_url(pagination["next_page"]) if pagination["has_next"] else None
            ),
            "previous": (
                build_url(pagination["previous_page"])
                if pagination["has_previous"]
                else None
            ),
        }

        return links


class StreamingService:
    """Handles streaming responses"""

    @staticmethod
    async def stream_json_array(data: List[Any], chunk_size: int = 100):
        """Stream JSON array in chunks"""

        yield b'["'

        for i, item in enumerate(data):
            if i > 0:
                yield b","

            if i % chunk_size == 0:
                # Allow other tasks to run
                await asyncio.sleep(0)

            json_str = json.dumps(item, ensure_ascii=False)
            yield json_str.encode("utf-8")

        yield b"]"

    @staticmethod
    async def stream_ndjson(data: List[Any], chunk_size: int = 100):
        """Stream newline-delimited JSON"""

        for i, item in enumerate(data):
            if i % chunk_size == 0:
                # Allow other tasks to run
                await asyncio.sleep(0)

            json_str = json.dumps(item, ensure_ascii=False)
            yield f"{json_str}\n".encode("utf-8")


class ResponseOptimizer:
    """
    Advanced response optimizer with compression, streaming, and caching
    """

    def __init__(self, config: Optional[OptimizationConfig] = None):
        self.config = config or OptimizationConfig()
        self.compression = CompressionService()
        self.pagination = PaginationService()
        self.streaming = StreamingService()
        self.metrics: List[ResponseMetrics] = []
        self._max_metrics = 1000  # Keep last 1000 responses

    async def optimize_response(
        self,
        data: Any,
        endpoint: str,
        method: str = "GET",
        accept_encoding: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
        use_streaming: Optional[bool] = None,
        cache_key: Optional[str] = None,
        cache_ttl: Optional[int] = None,
        request_id: Optional[str] = None,
    ) -> Response:
        """
        Optimize response with compression, pagination, and caching
        """

        start_time = time.time()

        # Try cache first
        if cache_key and advanced_caching_system and self.config.enable_caching:
            cached_response = await self._try_cache(cache_key)
            if cached_response:
                return cached_response

        # Process data
        processed_data, should_stream = await self._process_data(
            data, page, page_size, use_streaming
        )

        # Create response
        if should_stream:
            response = await self._create_streaming_response(processed_data, endpoint)
        else:
            response = await self._create_standard_response(
                processed_data, endpoint, accept_encoding
            )

        # Cache response if appropriate
        if cache_key and advanced_caching_system and self.config.enable_caching:
            await self._cache_response(cache_key, response, cache_ttl)

        # Record metrics
        total_time = time.time() - start_time
        await self._record_metrics(endpoint, method, response, total_time, False)

        # Add performance headers
        self._add_performance_headers(response, total_time, request_id)

        return response

    async def _try_cache(self, cache_key: str) -> Optional[Response]:
        """Try to get response from cache"""

        try:
            cached_data = await advanced_caching_system.get(f"response:{cache_key}")
            if cached_data:
                return JSONResponse(content=cached_data)
        except Exception as e:
            app_logger.warning(f"Cache retrieval failed: {e}")

        return None

    async def _cache_response(
        self, cache_key: str, response: Response, ttl: Optional[int]
    ):
        """Cache response data"""

        try:
            # Only cache JSON responses
            if isinstance(response, JSONResponse):
                cache_ttl = ttl or self.config.default_cache_ttl
                await advanced_caching_system.set(
                    f"response:{cache_key}",
                    (
                        response.body.decode()
                        if isinstance(response.body, bytes)
                        else response.body
                    ),
                    cache_ttl,
                )
        except Exception as e:
            app_logger.warning(f"Cache storage failed: {e}")

    async def _process_data(
        self,
        data: Any,
        page: Optional[int],
        page_size: Optional[int],
        use_streaming: Optional[bool],
    ) -> tuple[Any, bool]:
        """Process data for optimization"""

        should_stream = False

        # Handle list data
        if isinstance(data, list):
            # Check if we should paginate
            if self.config.enable_pagination and page is not None:
                page_size = page_size or self.config.default_page_size
                data = self.pagination.paginate_data(
                    data, page, page_size, self.config.max_page_size
                )

            # Check if we should stream
            elif self.config.enable_streaming and (
                use_streaming or len(data) >= self.config.streaming_threshold
            ):
                should_stream = True

        return data, should_stream

    async def _create_streaming_response(
        self, data: List[Any], endpoint: str
    ) -> StreamingResponse:
        """Create streaming response for large datasets"""

        # Use NDJSON for streaming
        stream_generator = self.streaming.stream_ndjson(data)

        response = StreamingResponse(
            stream_generator,
            media_type="application/x-ndjson",
            headers={
                "X-Response-Type": "streaming",
                "X-Stream-Format": "ndjson",
            },
        )

        return response

    async def _create_standard_response(
        self, data: Any, endpoint: str, accept_encoding: Optional[str]
    ) -> Response:
        """Create standard JSON response with optional compression"""

        # Serialize data
        json_content = json.dumps(data, ensure_ascii=False)
        content_bytes = json_content.encode("utf-8")
        original_size = len(content_bytes)

        # Determine compression
        compression_type = CompressionType.NONE
        if (
            self.config.enable_compression
            and self.compression.should_compress(
                original_size, self.config.compression_threshold
            )
            and accept_encoding
        ):
            compression_type = self.compression.detect_best_compression(accept_encoding)

        # Compress if needed
        compressed_content = content_bytes
        compression_time = 0.0

        if compression_type != CompressionType.NONE:
            compression_start = time.time()
            compressed_content = self.compression.compress_content(
                content_bytes, compression_type
            )
            compression_time = time.time() - compression_start

        # Create response
        headers = {
            "Content-Type": "application/json",
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(len(compressed_content)),
            "X-Compression-Ratio": f"{len(compressed_content) / original_size:.3f}",
        }

        # Add compression headers
        encoding_header = self.compression.get_encoding_header(compression_type)
        if encoding_header:
            headers["Content-Encoding"] = encoding_header

        response = Response(
            content=compressed_content, headers=headers, media_type="application/json"
        )

        return response

    def _add_performance_headers(
        self, response: Response, total_time: float, request_id: Optional[str]
    ):
        """Add performance-related headers"""

        if hasattr(response, "headers"):
            response.headers["X-Response-Time"] = f"{total_time:.3f}s"

            if request_id:
                response.headers["X-Request-ID"] = request_id

            response.headers["X-Optimizer-Version"] = "2.0"

    async def _record_metrics(
        self,
        endpoint: str,
        method: str,
        response: Response,
        total_time: float,
        cache_hit: bool,
    ):
        """Record response metrics"""

        original_size = 0
        compressed_size = 0
        compression_ratio = 1.0
        compression_time = 0.0
        status_code = getattr(response, "status_code", 200)

        # Extract size information from headers
        if hasattr(response, "headers"):
            try:
                original_size = int(response.headers.get("X-Original-Size", "0"))
                compressed_size = int(response.headers.get("X-Compressed-Size", "0"))
                compression_ratio = float(
                    response.headers.get("X-Compression-Ratio", "1.0")
                )
            except (ValueError, TypeError):
                pass

        metrics = ResponseMetrics(
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            original_size=original_size,
            compressed_size=compressed_size,
            compression_ratio=compression_ratio,
            compression_time=compression_time,
            total_time=total_time,
            cache_hit=cache_hit,
            timestamp=time.time(),
        )

        self.metrics.append(metrics)

        # Keep only recent metrics
        if len(self.metrics) > self._max_metrics:
            self.metrics = self.metrics[-self._max_metrics :]

        # Log performance
        performance_logger.info(
            f"Response optimized: {endpoint} - "
            f"{total_time:.3f}s - "
            f"compression: {compression_ratio:.2f} - "
            f"size: {original_size} -> {compressed_size}"
        )

    def get_performance_report(self) -> Dict[str, Any]:
        """Get response optimization performance report"""

        if not self.metrics:
            return {"message": "No response metrics available"}

        # Calculate statistics
        total_responses = len(self.metrics)
        total_time = sum(m.total_time for m in self.metrics)
        avg_response_time = total_time / total_responses

        total_original_size = sum(m.original_size for m in self.metrics)
        total_compressed_size = sum(m.compressed_size for m in self.metrics)
        overall_compression_ratio = (
            total_compressed_size / total_original_size
            if total_original_size > 0
            else 1.0
        )

        cache_hits = sum(1 for m in self.metrics if m.cache_hit)
        cache_hit_rate = cache_hits / total_responses

        # Find slowest endpoints
        endpoint_times = {}
        for metric in self.metrics:
            if metric.endpoint not in endpoint_times:
                endpoint_times[metric.endpoint] = []
            endpoint_times[metric.endpoint].append(metric.total_time)

        slowest_endpoints = []
        for endpoint, times in endpoint_times.items():
            avg_time = sum(times) / len(times)
            slowest_endpoints.append(
                {
                    "endpoint": endpoint,
                    "avg_response_time": round(avg_time, 3),
                    "request_count": len(times),
                }
            )

        slowest_endpoints.sort(key=lambda x: x["avg_response_time"], reverse=True)

        # Status code distribution
        status_codes = {}
        for metric in self.metrics:
            status_codes[metric.status_code] = (
                status_codes.get(metric.status_code, 0) + 1
            )

        return {
            "summary": {
                "total_responses": total_responses,
                "avg_response_time": round(avg_response_time, 3),
                "cache_hit_rate": round(cache_hit_rate, 3),
                "overall_compression_ratio": round(overall_compression_ratio, 3),
                "bytes_saved": total_original_size - total_compressed_size,
            },
            "slowest_endpoints": slowest_endpoints[:10],
            "status_distribution": status_codes,
            "compression_stats": {
                "total_original_size": total_original_size,
                "total_compressed_size": total_compressed_size,
                "compression_ratio": round(overall_compression_ratio, 3),
                "bytes_saved": total_original_size - total_compressed_size,
            },
        }

    async def health_check(self) -> Dict[str, Any]:
        """Perform response optimizer health check"""

        recent_metrics = [
            m for m in self.metrics if time.time() - m.timestamp < 300
        ]  # Last 5 minutes

        if not recent_metrics:
            return {
                "status": "healthy",
                "recent_responses": 0,
                "avg_response_time": 0.0,
                "compression_ratio": 1.0,
            }

        avg_response_time = sum(m.total_time for m in recent_metrics) / len(
            recent_metrics
        )

        # Calculate compression effectiveness
        total_original = sum(m.original_size for m in recent_metrics)
        total_compressed = sum(m.compressed_size for m in recent_metrics)
        compression_ratio = (
            total_compressed / total_original if total_original > 0 else 1.0
        )

        health = {
            "status": "healthy",
            "recent_responses": len(recent_metrics),
            "avg_response_time": round(avg_response_time, 3),
            "compression_ratio": round(compression_ratio, 3),
        }

        # Determine health status
        if avg_response_time > 5.0:  # Very slow responses
            health["status"] = "degraded"
        elif avg_response_time > 10.0:  # Extremely slow responses
            health["status"] = "unhealthy"

        return health


# Global instance
response_optimizer = ResponseOptimizer()


# Convenience functions
async def optimize_response(
    data: Any,
    endpoint: str,
    method: str = "GET",
    accept_encoding: Optional[str] = None,
    page: Optional[int] = None,
    page_size: Optional[int] = None,
    use_streaming: Optional[bool] = None,
    cache_key: Optional[str] = None,
    cache_ttl: Optional[int] = None,
    request_id: Optional[str] = None,
) -> Response:
    """Optimize response with all available strategies"""
    return await response_optimizer.optimize_response(
        data,
        endpoint,
        method,
        accept_encoding,
        page,
        page_size,
        use_streaming,
        cache_key,
        cache_ttl,
        request_id,
    )
