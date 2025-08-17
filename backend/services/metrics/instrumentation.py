"""
Instrumentation Utilities - Decorators and context managers for comprehensive monitoring
Provides easy-to-use instrumentation for HTTP routes and WebSocket connections.
"""

import asyncio
import functools
import time
from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Callable, Dict, Optional

try:
    from fastapi import Request, Response, WebSocket
    from starlette.websockets import WebSocketDisconnect
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    # Placeholder for type hints
    Request = Any
    Response = Any
    WebSocket = Any

try:
    from backend.services.unified_logging import get_logger
    logger = get_logger("instrumentation")
except ImportError:
    import logging
    logger = logging.getLogger(__name__)

from .unified_metrics_collector import get_metrics_collector


@asynccontextmanager
async def record_http_request(path: str, method: str) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Async context manager for recording HTTP request metrics.
    
    Args:
        path: The HTTP path being accessed
        method: The HTTP method (GET, POST, etc.)
        
    Yields:
        Dictionary containing timing information and utilities
        
    Example:
        async with record_http_request("/api/health", "GET") as timing:
            # Your endpoint logic here
            response_data = await process_request()
            timing["response_size"] = len(response_data)
    """
    metrics_collector = get_metrics_collector()
    start_time = time.time()
    context = {
        "start_time": start_time,
        "path": path,
        "method": method,
        "response_size": 0,
        "status_code": 200
    }
    
    try:
        yield context
        
        # Record successful request
        latency_ms = (time.time() - start_time) * 1000
        status_code = context.get("status_code", 200)
        metrics_collector.record_request(latency_ms, status_code)
        
    except Exception as e:
        # Record error
        latency_ms = (time.time() - start_time) * 1000
        status_code = context.get("status_code", 500)
        metrics_collector.record_request(latency_ms, status_code)
        
        logger.warning(f"Request error in instrumented endpoint {method} {path}", extra={
            "latency_ms": latency_ms,
            "error": str(e)
        })
        raise


def instrument_route(func: Callable) -> Callable:
    """
    Decorator for automatically instrumenting FastAPI route functions.
    
    Records request latency and status codes for monitoring and alerting.
    Compatible with both sync and async route handlers.
    
    Args:
        func: The FastAPI route handler function to instrument
        
    Returns:
        Instrumented route handler that records metrics
        
    Example:
        @router.get("/api/health")
        @instrument_route
        async def health_check():
            return {"status": "healthy"}
    """
    
    if not HAS_FASTAPI:
        logger.warning("FastAPI not available, instrumentation decorator is no-op")
        return func
    
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        # Extract request information from FastAPI dependency injection
        request: Optional[Any] = None
        response: Optional[Any] = None
        
        if HAS_FASTAPI:
            # Import types locally to avoid issues with conditional imports
            from fastapi import Request, Response
            
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                elif hasattr(arg, 'status_code'):  # Response-like object
                    response = arg
            
            # Fall back to kwargs
            if not request:
                request = kwargs.get('request')
        
        # Safely extract path and method
        if request and hasattr(request, 'url') and hasattr(request.url, 'path'):
            path = request.url.path
        else:
            path = "unknown_path"
            
        if request and hasattr(request, 'method'):
            method = request.method
        else:
            method = "unknown_method"
        
        async with record_http_request(path, method) as timing:
            try:
                # Call the original function
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                # Try to extract status code from result
                if hasattr(result, 'status_code'):
                    timing["status_code"] = result.status_code
                elif isinstance(result, dict) and 'status_code' in result:
                    timing["status_code"] = result['status_code']
                else:
                    timing["status_code"] = 200  # Assume success if no explicit status
                
                return result
                
            except Exception as e:
                # Classify error by exception type
                if "Authentication" in str(type(e)) or "401" in str(e):
                    timing["status_code"] = 401
                elif "Authorization" in str(type(e)) or "403" in str(e):
                    timing["status_code"] = 403
                elif "NotFound" in str(type(e)) or "404" in str(e):
                    timing["status_code"] = 404
                elif "Validation" in str(type(e)) or "422" in str(e):
                    timing["status_code"] = 422
                else:
                    timing["status_code"] = 500
                    
                raise
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        # For synchronous functions, create a simple timing wrapper
        metrics_collector = get_metrics_collector()
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            latency_ms = (time.time() - start_time) * 1000
            metrics_collector.record_request(latency_ms, 200)
            return result
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            metrics_collector.record_request(latency_ms, 500)
            raise
    
    # Return appropriate wrapper based on function type
    if asyncio.iscoroutinefunction(func):
        return async_wrapper
    else:
        return sync_wrapper


class InstrumentedWebSocket:
    """
    Instrumented WebSocket wrapper that tracks connection lifecycle and messages.
    
    Provides the same interface as FastAPI WebSocket while recording metrics.
    """
    
    def __init__(self, websocket: Any):
        if not HAS_FASTAPI:
            raise RuntimeError("FastAPI is required for WebSocket instrumentation")
            
        self._websocket = websocket
        self._metrics_collector = get_metrics_collector()
        self._connected = False
        
    async def accept(self, subprotocol: Optional[str] = None):
        """Accept WebSocket connection and record metrics."""
        await self._websocket.accept(subprotocol)
        self._connected = True
        self._metrics_collector.record_ws_connection(True)
        
        logger.debug("WebSocket connection accepted and recorded", extra={
            "client": getattr(self._websocket, 'client', 'unknown')
        })
    
    async def close(self, code: int = 1000):
        """Close WebSocket connection and record metrics."""
        if self._connected:
            await self._websocket.close(code)
            self._connected = False
            self._metrics_collector.record_ws_connection(False)
            
            logger.debug("WebSocket connection closed and recorded", extra={
                "code": code
            })
    
    async def send_text(self, data: str):
        """Send text data and record message metric."""
        await self._websocket.send_text(data)
        self._metrics_collector.record_ws_message(1)
    
    async def send_bytes(self, data: bytes):
        """Send binary data and record message metric."""
        await self._websocket.send_bytes(data)
        self._metrics_collector.record_ws_message(1)
    
    async def send_json(self, data: Any):
        """Send JSON data and record message metric."""
        await self._websocket.send_json(data)
        self._metrics_collector.record_ws_message(1)
    
    async def receive_text(self) -> str:
        """Receive text data (no metric recording for incoming messages)."""
        return await self._websocket.receive_text()
    
    async def receive_bytes(self) -> bytes:
        """Receive binary data (no metric recording for incoming messages)."""
        return await self._websocket.receive_bytes()
    
    async def receive_json(self) -> Any:
        """Receive JSON data (no metric recording for incoming messages)."""
        return await self._websocket.receive_json()
    
    def __getattr__(self, name: str) -> Any:
        """Delegate any other attributes to the wrapped WebSocket."""
        return getattr(self._websocket, name)


def instrument_websocket(websocket: Any) -> InstrumentedWebSocket:
    """
    Create an instrumented WebSocket wrapper.
    
    Args:
        websocket: The FastAPI WebSocket instance to instrument
        
    Returns:
        InstrumentedWebSocket wrapper that records metrics
        
    Example:
        @router.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            ws = instrument_websocket(websocket)
            await ws.accept()
            
            try:
                while True:
                    data = await ws.receive_text()
                    await ws.send_json({"echo": data})
            except WebSocketDisconnect:
                pass
    """
    return InstrumentedWebSocket(websocket)


async def send_json_instrumented(websocket: Any, payload: Any) -> None:
    """
    Helper function to send JSON with metrics recording.
    
    For use when you cannot use the InstrumentedWebSocket wrapper.
    
    Args:
        websocket: The WebSocket connection
        payload: The JSON payload to send
    """
    metrics_collector = get_metrics_collector()
    await websocket.send_json(payload)
    metrics_collector.record_ws_message(1)


# TODO: Add middleware integration for automatic route instrumentation
# TODO: Add batch metrics recording for high-throughput scenarios
# TODO: Add custom metric tags/labels support