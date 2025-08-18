"""
Resilience Testing API Routes
FastAPI endpoints for comprehensive resilience testing, chaos engineering, and monitoring
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Path
from pydantic import BaseModel, Field

from backend.services.resilience_test_orchestrator import (
    ResilienceTestOrchestrator,
    ResilienceTestConfig,
    TestPhase,
    TestResult,
    create_orchestrator,
    run_resilience_test
)
from backend.services.chaos_engineering_service import (
    ChaosEngineeringService,
    ChaosScenario,
    ChaosConfig,
    get_chaos_service
)
from backend.services.memory_monitoring_service import (
    MemoryMonitoringService,
    SoakTestConfig,
    get_memory_monitor
)
from backend.services.advanced_circuit_breaker_tester import (
    AdvancedCircuitBreakerTester,
    CircuitBreakerTestScenario,
    CascadeTestType,
    create_circuit_breaker_tester
)

try:
    from backend.services.unified_logging import unified_logging
    logger = unified_logging.get_logger("resilience_api")
except (ImportError, AttributeError):
    import logging
    logger = logging.getLogger("resilience_api")

router = APIRouter(prefix="/api/resilience", tags=["Resilience Testing"])

# Global state tracking
active_tests: Dict[str, ResilienceTestOrchestrator] = {}
active_memory_monitors: Dict[str, MemoryMonitoringService] = {}
active_chaos_services: Dict[str, ChaosEngineeringService] = {}


# Pydantic models for request/response
class ChaosInjectionRequest(BaseModel):
    scenario: str = Field(..., description="Chaos scenario to inject")
    target_service: str = Field(..., description="Target service name")
    duration: Optional[int] = Field(300, description="Duration in seconds")


class ChaosConfigRequest(BaseModel):
    timeout_probability: float = Field(0.1, ge=0.0, le=1.0)
    valuation_exception_rate: float = Field(0.5, ge=0.0, le=1.0)
    latency_spike_probability: float = Field(0.05, ge=0.0, le=1.0)
    memory_pressure_threshold: float = Field(0.8, ge=0.0, le=1.0)
    auto_recovery: bool = Field(True)
    max_concurrent_chaos: int = Field(3, ge=1, le=10)


class ResilienceTestConfigRequest(BaseModel):
    total_duration_hours: int = Field(4, ge=1, le=24)
    enable_chaos_testing: bool = Field(True)
    enable_circuit_breaker_testing: bool = Field(True)
    enable_memory_monitoring: bool = Field(True)
    enable_cascading_failure_testing: bool = Field(True)
    chaos_intensity: str = Field("medium", regex="^(low|medium|high|extreme)$")
    memory_growth_threshold_percent: int = Field(10, ge=1, le=100)
    memory_sampling_interval_seconds: int = Field(30, ge=10, le=300)
    max_memory_growth_percent: float = Field(15.0, ge=1.0, le=100.0)
    max_system_memory_percent: float = Field(90.0, ge=50.0, le=99.0)
    min_recovery_success_rate: float = Field(0.8, ge=0.1, le=1.0)


class SoakTestConfigRequest(BaseModel):
    duration_hours: int = Field(4, ge=1, le=48)
    sampling_interval_seconds: int = Field(30, ge=10, le=300)
    memory_growth_threshold_percent: int = Field(10, ge=1, le=100)
    critical_memory_threshold_percent: int = Field(90, ge=50, le=99)
    enable_object_tracking: bool = Field(True)
    enable_detailed_analysis: bool = Field(True)


# Comprehensive Resilience Testing Endpoints
@router.post("/tests/comprehensive")
async def start_comprehensive_resilience_test(
    config: ResilienceTestConfigRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Start a comprehensive resilience test"""
    try:
        # Convert request to config object
        test_config = ResilienceTestConfig(
            total_duration_hours=config.total_duration_hours,
            enable_chaos_testing=config.enable_chaos_testing,
            enable_circuit_breaker_testing=config.enable_circuit_breaker_testing,
            enable_memory_monitoring=config.enable_memory_monitoring,
            enable_cascading_failure_testing=config.enable_cascading_failure_testing,
            chaos_intensity=config.chaos_intensity,
            memory_growth_threshold_percent=config.memory_growth_threshold_percent,
            memory_sampling_interval_seconds=config.memory_sampling_interval_seconds,
            max_memory_growth_percent=config.max_memory_growth_percent,
            max_system_memory_percent=config.max_system_memory_percent,
            min_recovery_success_rate=config.min_recovery_success_rate,
        )
        
        # Create orchestrator
        orchestrator = create_orchestrator(test_config)
        test_id = orchestrator.test_id
        
        # Store in active tests
        active_tests[test_id] = orchestrator
        
        # Start test in background
        async def run_test():
            try:
                await orchestrator.run_comprehensive_resilience_test()
            except Exception as e:
                logger.error(f"Background resilience test failed: {e}")
            finally:
                # Clean up from active tests after completion
                if test_id in active_tests:
                    del active_tests[test_id]
        
        background_tasks.add_task(run_test)
        
        return {
            "status": "started",
            "test_id": test_id,
            "message": f"Comprehensive resilience test started with ID: {test_id}",
            "estimated_duration_hours": config.total_duration_hours,
        }
        
    except Exception as e:
        logger.error(f"Failed to start comprehensive resilience test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tests/{test_id}/status")
async def get_test_status(test_id: str = Path(..., description="Test ID")) -> Dict[str, Any]:
    """Get status of a running resilience test"""
    if test_id not in active_tests:
        raise HTTPException(status_code=404, detail="Test not found or completed")
    
    orchestrator = active_tests[test_id]
    return {
        "test_id": test_id,
        "status": orchestrator.get_current_status(),
        "report_preview": {
            "overall_result": orchestrator.test_report.overall_result.value,
            "phases_completed": len(orchestrator.test_report.phase_results),
            "chaos_events_triggered": orchestrator.test_report.chaos_events_triggered,
            "memory_leak_detected": orchestrator.test_report.memory_leak_detected,
            "exit_criteria_met": orchestrator.test_report.exit_criteria_met,
        }
    }


@router.get("/tests/{test_id}/report")
async def get_test_report(test_id: str = Path(..., description="Test ID")) -> Dict[str, Any]:
    """Get full test report (works for both active and completed tests)"""
    if test_id in active_tests:
        # Active test - return current report
        orchestrator = active_tests[test_id]
        return {
            "test_id": test_id,
            "status": "running",
            "report": orchestrator.test_report.to_dict()
        }
    else:
        # Try to find completed test results (in a real implementation, this would query a database)
        raise HTTPException(
            status_code=404, 
            detail="Test not found. Active tests expire after completion."
        )


@router.get("/tests")
async def list_active_tests() -> Dict[str, Any]:
    """List all active resilience tests"""
    return {
        "active_tests": [
            {
                "test_id": test_id,
                "status": orchestrator.get_current_status(),
                "start_time": orchestrator.test_report.start_time.isoformat(),
            }
            for test_id, orchestrator in active_tests.items()
        ],
        "total_active": len(active_tests)
    }


# Chaos Engineering Endpoints
@router.post("/chaos/start")
async def start_chaos_service(config: Optional[ChaosConfigRequest] = None) -> Dict[str, Any]:
    """Start chaos engineering service"""
    try:
        service_id = f"chaos_{int(datetime.now().timestamp())}"
        
        # Convert config if provided
        chaos_config = None
        if config:
            chaos_config = ChaosConfig(
                timeout_probability=config.timeout_probability,
                valuation_exception_rate=config.valuation_exception_rate,
                latency_spike_probability=config.latency_spike_probability,
                auto_recovery=config.auto_recovery,
                max_concurrent_chaos=config.max_concurrent_chaos,
            )
        
        # Create and start service
        chaos_service = ChaosEngineeringService(chaos_config)
        await chaos_service.start()
        
        # Store in active services
        active_chaos_services[service_id] = chaos_service
        
        return {
            "status": "started",
            "service_id": service_id,
            "message": "Chaos engineering service started successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to start chaos service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chaos/{service_id}/inject")
async def inject_chaos(
    service_id: str,
    request: ChaosInjectionRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Inject specific chaos scenario"""
    if service_id not in active_chaos_services:
        raise HTTPException(status_code=404, detail="Chaos service not found")
    
    chaos_service = active_chaos_services[service_id]
    
    try:
        # Validate scenario
        try:
            scenario = ChaosScenario(request.scenario)
        except ValueError:
            valid_scenarios = [s.value for s in ChaosScenario]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid scenario. Must be one of: {valid_scenarios}"
            )
        
        # Inject chaos in background
        async def inject_chaos_task():
            try:
                event = await chaos_service.inject_chaos(
                    scenario, 
                    request.target_service, 
                    request.duration
                )
                logger.info(f"Chaos injection completed: {event.id}")
            except Exception as e:
                logger.error(f"Chaos injection failed: {e}")
        
        background_tasks.add_task(inject_chaos_task)
        
        return {
            "status": "injected",
            "scenario": request.scenario,
            "target_service": request.target_service,
            "duration": request.duration,
            "message": f"Chaos scenario {request.scenario} injected into {request.target_service}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to inject chaos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chaos/{service_id}/status")
async def get_chaos_status(service_id: str) -> Dict[str, Any]:
    """Get chaos service status"""
    if service_id not in active_chaos_services:
        raise HTTPException(status_code=404, detail="Chaos service not found")
    
    chaos_service = active_chaos_services[service_id]
    
    try:
        status = chaos_service.get_status()
        metrics = chaos_service.get_metrics()
        
        return {
            "service_id": service_id,
            "status": status,
            "metrics": metrics,
        }
        
    except Exception as e:
        logger.error(f"Failed to get chaos status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chaos/{service_id}/stop")
async def stop_chaos_service(service_id: str) -> Dict[str, Any]:
    """Stop chaos engineering service"""
    if service_id not in active_chaos_services:
        raise HTTPException(status_code=404, detail="Chaos service not found")
    
    try:
        chaos_service = active_chaos_services[service_id]
        await chaos_service.stop()
        
        # Remove from active services
        del active_chaos_services[service_id]
        
        return {
            "status": "stopped",
            "service_id": service_id,
            "message": "Chaos engineering service stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop chaos service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Memory Monitoring Endpoints
@router.post("/memory/start")
async def start_memory_monitoring(config: Optional[SoakTestConfigRequest] = None) -> Dict[str, Any]:
    """Start memory monitoring service"""
    try:
        monitor_id = f"memory_{int(datetime.now().timestamp())}"
        
        # Convert config if provided
        soak_config = None
        if config:
            soak_config = SoakTestConfig(
                duration_hours=config.duration_hours,
                sampling_interval_seconds=config.sampling_interval_seconds,
                memory_growth_threshold_percent=config.memory_growth_threshold_percent,
                critical_memory_threshold_percent=config.critical_memory_threshold_percent,
                enable_object_tracking=config.enable_object_tracking,
                enable_detailed_analysis=config.enable_detailed_analysis,
            )
        
        # Get and start memory monitor
        memory_monitor = await get_memory_monitor(soak_config)
        started = await memory_monitor.start_monitoring()
        
        if not started:
            raise HTTPException(status_code=409, detail="Memory monitoring already running")
        
        # Store in active monitors
        active_memory_monitors[monitor_id] = memory_monitor
        
        return {
            "status": "started",
            "monitor_id": monitor_id,
            "message": "Memory monitoring started successfully",
            "config": {
                "sampling_interval_seconds": soak_config.sampling_interval_seconds if soak_config else 30,
                "duration_hours": soak_config.duration_hours if soak_config else 4,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start memory monitoring: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memory/{monitor_id}/status")
async def get_memory_monitoring_status(monitor_id: str) -> Dict[str, Any]:
    """Get memory monitoring status"""
    if monitor_id not in active_memory_monitors:
        raise HTTPException(status_code=404, detail="Memory monitor not found")
    
    try:
        memory_monitor = active_memory_monitors[monitor_id]
        status = memory_monitor.get_current_status()
        
        return {
            "monitor_id": monitor_id,
            "status": status,
        }
        
    except Exception as e:
        logger.error(f"Failed to get memory monitoring status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/memory/{monitor_id}/history")
async def get_memory_history(
    monitor_id: str,
    hours: int = Query(1, ge=1, le=48, description="Hours of history to retrieve")
) -> Dict[str, Any]:
    """Get memory usage history"""
    if monitor_id not in active_memory_monitors:
        raise HTTPException(status_code=404, detail="Memory monitor not found")
    
    try:
        memory_monitor = active_memory_monitors[monitor_id]
        history = memory_monitor.get_memory_history(hours)
        
        return {
            "monitor_id": monitor_id,
            "hours": hours,
            "data_points": len(history),
            "history": history,
        }
        
    except Exception as e:
        logger.error(f"Failed to get memory history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/memory/{monitor_id}/stop")
async def stop_memory_monitoring(monitor_id: str) -> Dict[str, Any]:
    """Stop memory monitoring and get final report"""
    if monitor_id not in active_memory_monitors:
        raise HTTPException(status_code=404, detail="Memory monitor not found")
    
    try:
        memory_monitor = active_memory_monitors[monitor_id]
        final_report = await memory_monitor.stop_monitoring()
        
        # Remove from active monitors
        del active_memory_monitors[monitor_id]
        
        return {
            "status": "stopped",
            "monitor_id": monitor_id,
            "final_report": final_report,
            "message": "Memory monitoring stopped successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to stop memory monitoring: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Circuit Breaker Testing Endpoints
@router.post("/circuit-breakers/test")
async def run_circuit_breaker_tests(
    circuit_name: str = Query("test_circuit", description="Circuit breaker name"),
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """Run comprehensive circuit breaker tests"""
    try:
        test_id = f"cb_test_{int(datetime.now().timestamp())}"
        
        # Run tests in background
        async def run_tests():
            try:
                tester = await create_circuit_breaker_tester()
                results = await tester.run_comprehensive_circuit_breaker_tests(circuit_name)
                logger.info(f"Circuit breaker tests completed: {test_id}")
                # In a real implementation, store results in database
            except Exception as e:
                logger.error(f"Circuit breaker tests failed: {e}")
        
        background_tasks.add_task(run_tests)
        
        return {
            "status": "started",
            "test_id": test_id,
            "circuit_name": circuit_name,
            "message": f"Circuit breaker tests started for {circuit_name}"
        }
        
    except Exception as e:
        logger.error(f"Failed to start circuit breaker tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/circuit-breakers/cascade-test")
async def run_cascading_failure_tests(
    background_tasks: BackgroundTasks,
    service_topology: Optional[Dict[str, List[str]]] = None
) -> Dict[str, Any]:
    """Run cascading failure tests"""
    try:
        test_id = f"cascade_test_{int(datetime.now().timestamp())}"
        
        # Default topology if not provided
        if not service_topology:
            service_topology = {
                "frontend": ["api_gateway"],
                "api_gateway": ["auth_service", "data_service"],
                "auth_service": ["database", "cache"],
                "data_service": ["database", "external_api"],
                "database": [],
                "cache": [],
                "external_api": ["third_party_service"],
                "third_party_service": [],
            }
        
        # Run tests in background
        async def run_cascade_tests():
            try:
                tester = await create_circuit_breaker_tester()
                results = await tester.run_cascading_failure_tests(service_topology)
                logger.info(f"Cascading failure tests completed: {test_id}")
                # In a real implementation, store results in database
            except Exception as e:
                logger.error(f"Cascading failure tests failed: {e}")
        
        background_tasks.add_task(run_cascade_tests)
        
        return {
            "status": "started",
            "test_id": test_id,
            "service_topology": service_topology,
            "message": "Cascading failure tests started"
        }
        
    except Exception as e:
        logger.error(f"Failed to start cascading failure tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# System Status and Health Endpoints
@router.get("/status")
async def get_resilience_system_status() -> Dict[str, Any]:
    """Get overall resilience system status"""
    try:
        return {
            "timestamp": datetime.now().isoformat(),
            "services": {
                "active_resilience_tests": len(active_tests),
                "active_chaos_services": len(active_chaos_services),
                "active_memory_monitors": len(active_memory_monitors),
            },
            "active_tests": list(active_tests.keys()),
            "active_chaos_services": list(active_chaos_services.keys()),
            "active_memory_monitors": list(active_memory_monitors.keys()),
            "system_healthy": True,
        }
        
    except Exception as e:
        logger.error(f"Failed to get system status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_all_services() -> Dict[str, Any]:
    """Clean up all active resilience services (emergency stop)"""
    try:
        cleanup_results = {
            "chaos_services_stopped": 0,
            "memory_monitors_stopped": 0,
            "tests_cancelled": 0,
            "errors": []
        }
        
        # Stop all chaos services
        for service_id, chaos_service in list(active_chaos_services.items()):
            try:
                await chaos_service.stop()
                del active_chaos_services[service_id]
                cleanup_results["chaos_services_stopped"] += 1
            except Exception as e:
                cleanup_results["errors"].append(f"Chaos service {service_id}: {str(e)}")
        
        # Stop all memory monitors
        for monitor_id, memory_monitor in list(active_memory_monitors.items()):
            try:
                await memory_monitor.stop_monitoring()
                del active_memory_monitors[monitor_id]
                cleanup_results["memory_monitors_stopped"] += 1
            except Exception as e:
                cleanup_results["errors"].append(f"Memory monitor {monitor_id}: {str(e)}")
        
        # Cancel all active tests (they will clean up themselves)
        cleanup_results["tests_cancelled"] = len(active_tests)
        active_tests.clear()
        
        return {
            "status": "cleaned",
            "message": "All resilience services cleaned up",
            "cleanup_results": cleanup_results
        }
        
    except Exception as e:
        logger.error(f"Failed to cleanup services: {e}")
        raise HTTPException(status_code=500, detail=str(e))