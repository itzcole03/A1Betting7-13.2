"""
Provider Resilience API Routes

API endpoints for provider resilience testing, monitoring, and management.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import asyncio
import time

from backend.services.provider_resilience_manager import provider_resilience_manager
from backend.services.provider_resilience_testing import resilience_test_suite, run_resilience_tests
from backend.services.provider_reliability_integration import (
    provider_reliability_integrator, 
    start_provider_reliability_monitoring,
    get_provider_reliability_status
)
from backend.services.unified_logging import get_logger

router = APIRouter(prefix="/api/provider-resilience", tags=["Provider Resilience"])
logger = get_logger("provider_resilience_api")


class ProviderTestRequest(BaseModel):
    """Request model for provider testing"""
    test_scenarios: Optional[List[str]] = None
    provider_count: int = 3
    duration_sec: Optional[int] = None


class ProviderRegistrationRequest(BaseModel):
    """Request model for provider registration"""
    provider_id: str
    config: Optional[Dict[str, Any]] = None


@router.get("/status")
async def get_resilience_status():
    """Get comprehensive provider resilience status"""
    try:
        system_status = provider_resilience_manager.get_system_status()
        reliability_metrics = get_provider_reliability_status()
        
        return {
            "system_status": system_status,
            "reliability_metrics": reliability_metrics,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to get resilience status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers")
async def get_all_providers():
    """Get status of all registered providers"""
    try:
        system_status = provider_resilience_manager.get_system_status()
        providers = system_status.get("providers", {})
        
        provider_list = []
        for provider_id, provider_state in providers.items():
            if provider_state:
                health_summary = provider_resilience_manager.get_provider_health_summary(provider_id)
                provider_list.append({
                    "provider_id": provider_id,
                    "state": provider_state,
                    "health_summary": health_summary
                })
        
        return {
            "providers": provider_list,
            "total_count": len(provider_list),
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to get providers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers/{provider_id}")
async def get_provider_details(provider_id: str):
    """Get detailed information about a specific provider"""
    try:
        provider_state = provider_resilience_manager.get_provider_state(provider_id)
        if not provider_state:
            raise HTTPException(status_code=404, detail=f"Provider {provider_id} not found")
        
        health_summary = provider_resilience_manager.get_provider_health_summary(provider_id)
        
        return {
            "provider_id": provider_id,
            "state": provider_state,
            "health_summary": health_summary,
            "timestamp": time.time()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get provider {provider_id} details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/providers/register")
async def register_provider(request: ProviderRegistrationRequest):
    """Register a new provider for resilience monitoring"""
    try:
        await provider_resilience_manager.register_provider(
            provider_id=request.provider_id,
            config=request.config
        )
        
        return {
            "message": f"Provider {request.provider_id} registered successfully",
            "provider_id": request.provider_id,
            "config": request.config or {},
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to register provider {request.provider_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/providers/{provider_id}/record-request")
async def record_provider_request(
    provider_id: str, 
    success: bool, 
    latency_ms: float,
    error_message: Optional[str] = None
):
    """Record a provider request result for testing purposes"""
    try:
        error = Exception(error_message) if error_message else None
        
        await provider_resilience_manager.record_provider_request(
            provider_id=provider_id,
            success=success,
            latency_ms=latency_ms,
            error=error
        )
        
        # Get updated state
        updated_state = provider_resilience_manager.get_provider_state(provider_id)
        
        return {
            "message": f"Request recorded for provider {provider_id}",
            "provider_id": provider_id,
            "success": success,
            "latency_ms": latency_ms,
            "updated_state": updated_state,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to record request for provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/providers/{provider_id}/should-skip")
async def check_should_skip_provider(provider_id: str):
    """Check if provider should be skipped due to circuit breaker state"""
    try:
        should_skip, retry_after, circuit_state = await provider_resilience_manager.should_skip_provider(provider_id)
        
        return {
            "provider_id": provider_id,
            "should_skip": should_skip,
            "retry_after_seconds": retry_after,
            "circuit_state": circuit_state,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to check skip status for provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test/run-comprehensive")
async def run_comprehensive_tests(background_tasks: BackgroundTasks, request: Optional[ProviderTestRequest] = None):
    """
    Run comprehensive provider resilience tests
    
    This tests the exit criteria:
    - Single provider outage does not block others
    - Circuit re-closes after successful half-open probe
    """
    try:
        logger.info("Starting comprehensive provider resilience tests")
        
        # Run tests in the background to avoid blocking
        def run_tests_sync():
            return asyncio.run(run_resilience_tests())
        
        # For now, run synchronously to return results immediately
        # In production, you might want to run this in background and provide a job ID
        results = await run_resilience_tests()
        
        logger.info(f"Resilience tests completed: {results.get('success_rate', 0):.1f}% success rate")
        
        return {
            "message": "Comprehensive resilience tests completed",
            "results": results,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to run comprehensive tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test/single-provider-outage")
async def test_single_provider_outage():
    """
    Test single provider outage scenario.
    Exit Criteria: Single provider outage does not block others.
    """
    try:
        logger.info("Running single provider outage test")
        result = await resilience_test_suite.test_single_provider_outage()
        
        return {
            "test_name": "single_provider_outage",
            "success": result.success,
            "duration_sec": result.duration_sec,
            "details": result.details,
            "error": result.error,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to run single provider outage test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test/circuit-breaker-recovery")
async def test_circuit_breaker_recovery():
    """
    Test circuit breaker recovery.
    Exit Criteria: Circuit re-closes after successful half-open probe.
    """
    try:
        logger.info("Running circuit breaker recovery test")
        result = await resilience_test_suite.test_circuit_breaker_recovery()
        
        return {
            "test_name": "circuit_breaker_recovery",
            "success": result.success,
            "duration_sec": result.duration_sec,
            "details": result.details,
            "error": result.error,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to run circuit breaker recovery test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test/sla-metrics")
async def test_sla_metrics():
    """Test SLA metrics tracking with error categorization"""
    try:
        logger.info("Running SLA metrics tracking test")
        result = await resilience_test_suite.test_sla_metrics_tracking()
        
        return {
            "test_name": "sla_metrics_tracking",
            "success": result.success,
            "duration_sec": result.duration_sec,
            "details": result.details,
            "error": result.error,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to run SLA metrics test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/anomalies")
async def get_provider_anomalies():
    """Get current provider anomalies detected by reliability monitoring"""
    try:
        anomalies = provider_reliability_integrator.detect_provider_anomalies()
        
        return {
            "anomalies": anomalies,
            "total_count": len(anomalies),
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to get provider anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reliability-metrics")
async def get_reliability_metrics():
    """Get comprehensive provider reliability metrics"""
    try:
        metrics = provider_reliability_integrator.get_provider_reliability_metrics()
        
        return {
            "metrics": metrics,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to get reliability metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/monitoring/start")
async def start_monitoring(background_tasks: BackgroundTasks):
    """Start provider reliability monitoring background task"""
    try:
        # Start the monitoring task in background
        background_tasks.add_task(start_provider_reliability_monitoring)
        
        return {
            "message": "Provider reliability monitoring started",
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to start monitoring: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test/forced-failure/{provider_id}")
async def simulate_provider_failure(provider_id: str, failure_count: int = 5):
    """
    Simulate provider failures for testing circuit breaker behavior.
    Useful for manual testing of resilience patterns.
    """
    try:
        # Register provider if it doesn't exist
        await provider_resilience_manager.register_provider(provider_id)
        
        # Simulate multiple failures
        for i in range(failure_count):
            await provider_resilience_manager.record_provider_request(
                provider_id=provider_id,
                success=False,
                latency_ms=1000.0,
                error=Exception(f"Simulated failure {i+1}/{failure_count}")
            )
        
        # Get updated state
        final_state = provider_resilience_manager.get_provider_state(provider_id)
        
        return {
            "message": f"Simulated {failure_count} failures for provider {provider_id}",
            "provider_id": provider_id,
            "failure_count": failure_count,
            "final_state": final_state,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to simulate failure for provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test/simulate-recovery/{provider_id}")
async def simulate_provider_recovery(provider_id: str, success_count: int = 5):
    """
    Simulate provider recovery for testing half-open to closed transitions.
    """
    try:
        # Simulate multiple successful requests
        for i in range(success_count):
            await provider_resilience_manager.record_provider_request(
                provider_id=provider_id,
                success=True,
                latency_ms=200.0,
                error=None
            )
        
        # Get updated state
        final_state = provider_resilience_manager.get_provider_state(provider_id)
        
        return {
            "message": f"Simulated {success_count} successful requests for provider {provider_id}",
            "provider_id": provider_id,
            "success_count": success_count,
            "final_state": final_state,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Failed to simulate recovery for provider {provider_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include router in main application
def get_provider_resilience_router():
    """Get the provider resilience API router"""
    return router