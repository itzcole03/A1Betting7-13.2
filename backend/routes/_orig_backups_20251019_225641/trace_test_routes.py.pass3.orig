"""
PR8 Request Correlation Test Routes

Simple test endpoints to validate request correlation and tracing functionality.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import asyncio
import logging

from backend.utils.log_context import get_contextual_logger, get_request_id
from backend.utils.trace_utils import trace_span, add_span_tag, get_trace_summary
from backend.middleware.request_id_middleware import get_request_id_from_request

# Logger with automatic context injection
logger = get_contextual_logger(__name__)

router = APIRouter()


@router.get("/api/trace/test")
async def test_request_correlation(request: Request):
    """
    Test endpoint for request correlation functionality
    
    Returns request ID, trace summary, and timing information to verify
    that the middleware and context utilities are working correctly.
    """
    logger.info("Testing request correlation")
    
    # Get request ID from different sources
    request_id_from_state = get_request_id_from_request(request)
    request_id_from_context = get_request_id()
    
    with trace_span("correlation_test", service_name="test", operation_name="correlation") as span_id:
        add_span_tag(span_id, "test_type", "correlation")
        add_span_tag(span_id, "endpoint", "/api/trace/test")
        
        # Simulate some work
        await asyncio.sleep(0.01)
        
        # Get trace summary
        trace_summary = get_trace_summary()
        
        logger.info("Request correlation test completed successfully")
        
        return {
            "success": True,
            "data": {
                "request_id_from_state": request_id_from_state,
                "request_id_from_context": request_id_from_context,
                "span_id": span_id,
                "trace_summary": trace_summary,
                "correlation_working": request_id_from_state == request_id_from_context,
                "message": "Request correlation test completed"
            },
            "error": None
        }


@router.get("/api/trace/nested")
async def test_nested_tracing(request: Request):
    """
    Test endpoint for nested span tracing functionality
    
    Creates multiple nested spans to verify hierarchical tracing works correctly.
    """
    logger.info("Testing nested span tracing")
    
    request_id = get_request_id_from_request(request)
    
    with trace_span("outer_operation", service_name="test", operation_name="nested_test") as outer_span:
        add_span_tag(outer_span, "level", "outer")
        add_span_tag(outer_span, "operation_type", "nested_test")
        
        await asyncio.sleep(0.005)  # Simulate work
        
        with trace_span("middle_operation", service_name="test", operation_name="middle_work") as middle_span:
            add_span_tag(middle_span, "level", "middle")
            add_span_tag(middle_span, "parent_span", outer_span)
            
            await asyncio.sleep(0.01)  # Simulate work
            
            with trace_span("inner_operation", service_name="test", operation_name="inner_work") as inner_span:
                add_span_tag(inner_span, "level", "inner")
                add_span_tag(inner_span, "parent_span", middle_span)
                
                await asyncio.sleep(0.005)  # Simulate work
                
                logger.info("Completed inner operation", extra={"span_id": inner_span})
            
            logger.info("Completed middle operation", extra={"span_id": middle_span})
        
        logger.info("Completed outer operation", extra={"span_id": outer_span})
    
    # Get final trace summary
    trace_summary = get_trace_summary()
    
    return {
        "success": True,
        "data": {
            "request_id": request_id,
            "spans_created": [outer_span, middle_span, inner_span],
            "trace_summary": trace_summary,
            "message": "Nested tracing test completed"
        },
        "error": None
    }


@router.get("/api/trace/performance")
async def test_performance_tracking(request: Request):
    """
    Test endpoint for performance tracking and metrics collection
    
    Simulates various operations with different durations to test
    performance monitoring capabilities.
    """
    logger.info("Testing performance tracking")
    
    request_id = get_request_id_from_request(request)
    operations_completed = []
    
    # Fast operation
    with trace_span("fast_operation", service_name="test", operation_name="fast_work") as fast_span:
        add_span_tag(fast_span, "operation_type", "fast")
        add_span_tag(fast_span, "expected_duration", "< 5ms")
        
        await asyncio.sleep(0.001)  # 1ms
        operations_completed.append({"span_id": fast_span, "type": "fast"})
    
    # Medium operation  
    with trace_span("medium_operation", service_name="test", operation_name="medium_work") as medium_span:
        add_span_tag(medium_span, "operation_type", "medium")
        add_span_tag(medium_span, "expected_duration", "5-20ms")
        
        await asyncio.sleep(0.01)  # 10ms
        operations_completed.append({"span_id": medium_span, "type": "medium"})
    
    # Slow operation
    with trace_span("slow_operation", service_name="test", operation_name="slow_work") as slow_span:
        add_span_tag(slow_span, "operation_type", "slow")
        add_span_tag(slow_span, "expected_duration", "> 20ms")
        
        await asyncio.sleep(0.025)  # 25ms
        operations_completed.append({"span_id": slow_span, "type": "slow"})
    
    # Get trace summary with performance data
    trace_summary = get_trace_summary()
    
    logger.info("Performance tracking test completed", extra={
        "operations_count": len(operations_completed),
        "total_spans": len(operations_completed)
    })
    
    return {
        "success": True,
        "data": {
            "request_id": request_id,
            "operations_completed": operations_completed,
            "trace_summary": trace_summary,
            "performance_note": "Check trace_summary for span durations",
            "message": "Performance tracking test completed"
        },
        "error": None
    }


@router.get("/api/trace/error")
async def test_error_tracing(request: Request):
    """
    Test endpoint for error tracing and logging
    
    Simulates an error condition to verify error tracking works correctly.
    """
    logger.info("Testing error tracing")
    
    request_id = get_request_id_from_request(request)
    
    try:
        with trace_span("error_operation", service_name="test", operation_name="error_test") as error_span:
            add_span_tag(error_span, "operation_type", "error_simulation")
            add_span_tag(error_span, "expected_result", "error")
            
            await asyncio.sleep(0.005)  # Simulate work before error
            
            # Simulate an error
            raise ValueError("Simulated error for tracing test")
            
    except ValueError as e:
        # Log the error with context
        logger.error(f"Caught expected error: {str(e)}", extra={
            "error_type": "ValueError",
            "error_message": str(e),
            "test_context": "error_tracing"
        })
        
        # Get trace summary to show error was captured
        trace_summary = get_trace_summary()
        
        return {
            "success": True,
            "data": {
                "request_id": request_id,
                "error_simulated": True,
                "error_message": str(e),
                "trace_summary": trace_summary,
                "message": "Error tracing test completed successfully"
            },
            "error": None
        }