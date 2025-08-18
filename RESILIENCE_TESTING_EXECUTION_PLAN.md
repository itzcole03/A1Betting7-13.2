# Comprehensive Resilience Testing Execution Plan

## Overview

This document provides a complete execution plan for the comprehensive resilience testing system designed to "prove resilience under adverse conditions" as requested. The system implements all required chaos scenarios, circuit breaker testing, and multi-hour soak testing.

## Architecture Summary

### Core Components

1. **ChaosEngineeringService** (`chaos_engineering_service.py`)
   - 10 chaos scenarios including provider timeouts, valuation exceptions, latency spikes
   - Configurable chaos parameters and auto-recovery mechanisms
   - Comprehensive chaos event tracking and metrics

2. **AdvancedCircuitBreakerTester** (`advanced_circuit_breaker_tester.py`)
   - 7 circuit breaker test scenarios with cascading failure simulation
   - 5 cascade test types for comprehensive failure propagation testing
   - Advanced exponential backoff and recovery validation

3. **MemoryMonitoringService** (`memory_monitoring_service.py`)
   - Continuous RSS memory tracking with leak detection algorithms
   - 4 memory leak pattern detection (linear, exponential, stepwise, object accumulation)
   - Comprehensive soak test reporting with detailed analysis

4. **ResilienceTestOrchestrator** (`resilience_test_orchestrator.py`)
   - 9-phase test execution coordinating all resilience components
   - Comprehensive exit criteria validation and test reporting
   - Multi-hour test coordination with detailed status tracking

5. **FastAPI Routes** (`resilience_routes.py`)
   - RESTful API endpoints for test control and monitoring
   - Background task execution for long-running tests
   - Comprehensive error handling and status reporting

## Execution Plan

### Phase 1: System Preparation

#### Start Backend Services

```bash
# From project root (A1Betting7-13.2/)
cd "c:\Users\bcmad\Downloads\A1Betting7-13.2"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Verify System Health

```bash
# Test basic health
curl http://127.0.0.1:8000/health

# Test resilience system status
curl http://127.0.0.1:8000/api/resilience/status
```

### Phase 2: Individual Component Testing

#### Test Chaos Engineering

```bash
# Start chaos service with custom configuration
curl -X POST "http://127.0.0.1:8000/api/resilience/chaos/start" \
  -H "Content-Type: application/json" \
  -d '{
    "timeout_probability": 0.1,
    "valuation_exception_rate": 0.5,
    "latency_spike_probability": 0.05,
    "auto_recovery": true,
    "max_concurrent_chaos": 3
  }'

# Inject specific chaos scenarios
curl -X POST "http://127.0.0.1:8000/api/resilience/chaos/[SERVICE_ID]/inject" \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "provider_timeout",
    "target_service": "betting_service", 
    "duration": 300
  }'

# Monitor chaos service status
curl http://127.0.0.1:8000/api/resilience/chaos/[SERVICE_ID]/status

# Stop chaos service
curl -X POST "http://127.0.0.1:8000/api/resilience/chaos/[SERVICE_ID]/stop"
```

#### Test Memory Monitoring

```bash
# Start memory monitoring for soak test
curl -X POST "http://127.0.0.1:8000/api/resilience/memory/start" \
  -H "Content-Type: application/json" \
  -d '{
    "duration_hours": 4,
    "sampling_interval_seconds": 30,
    "memory_growth_threshold_percent": 10,
    "critical_memory_threshold_percent": 90,
    "enable_object_tracking": true,
    "enable_detailed_analysis": true
  }'

# Monitor memory status
curl http://127.0.0.1:8000/api/resilience/memory/[MONITOR_ID]/status

# Get memory history
curl "http://127.0.0.1:8000/api/resilience/memory/[MONITOR_ID]/history?hours=1"

# Stop memory monitoring
curl -X POST "http://127.0.0.1:8000/api/resilience/memory/[MONITOR_ID]/stop"
```

#### Test Circuit Breaker System

```bash
# Run comprehensive circuit breaker tests
curl -X POST "http://127.0.0.1:8000/api/resilience/circuit-breakers/test?circuit_name=test_circuit"

# Run cascading failure tests with custom topology
curl -X POST "http://127.0.0.1:8000/api/resilience/circuit-breakers/cascade-test" \
  -H "Content-Type: application/json" \
  -d '{
    "frontend": ["api_gateway"],
    "api_gateway": ["auth_service", "data_service"], 
    "auth_service": ["database"],
    "data_service": ["database", "external_api"],
    "database": [],
    "external_api": []
  }'
```

### Phase 3: Comprehensive Resilience Testing

#### Start Full Resilience Test Suite

```bash
# Start comprehensive 4-hour resilience test
curl -X POST "http://127.0.0.1:8000/api/resilience/tests/comprehensive" \
  -H "Content-Type: application/json" \
  -d '{
    "total_duration_hours": 4,
    "enable_chaos_testing": true,
    "enable_circuit_breaker_testing": true,
    "enable_memory_monitoring": true,
    "enable_cascading_failure_testing": true,
    "chaos_intensity": "medium",
    "memory_growth_threshold_percent": 10,
    "memory_sampling_interval_seconds": 30,
    "max_memory_growth_percent": 15.0,
    "max_system_memory_percent": 90.0,
    "min_recovery_success_rate": 0.8
  }'

# Save test ID from response for monitoring
```

#### Monitor Long-Running Test

```bash
# Check test status (replace TEST_ID with actual ID)
curl http://127.0.0.1:8000/api/resilience/tests/[TEST_ID]/status

# Get comprehensive test report
curl http://127.0.0.1:8000/api/resilience/tests/[TEST_ID]/report

# List all active tests
curl http://127.0.0.1:8000/api/resilience/tests
```

### Phase 4: Exit Criteria Validation

The system automatically validates these exit criteria:

#### Chaos Scenarios Recovery
- **Requirement**: "All chaos scenarios recover without permanent degradation"
- **Validation**: Orchestrator tracks recovery success rate for each chaos injection
- **Threshold**: Minimum 80% successful recovery (configurable)

#### Memory Leak Detection  
- **Requirement**: "Memory grows <10% after 4h soak"
- **Validation**: Continuous RSS monitoring with leak detection algorithms
- **Threshold**: Memory growth threshold configurable (default 10%)

#### Circuit Breaker Functionality
- **Requirement**: "Circuit breaker verification under forced cascading failures"
- **Validation**: 7 test scenarios + 5 cascading failure types tested
- **Threshold**: All circuit breakers must recover to closed state

#### System Stability
- **Requirement**: "Prove resilience under adverse conditions"
- **Validation**: Overall system health maintained throughout test duration
- **Threshold**: No permanent service degradation

### Phase 5: Results Analysis

#### Generate Final Report

```bash
# Get final comprehensive report after test completion
curl http://127.0.0.1:8000/api/resilience/tests/[TEST_ID]/report

# System status overview
curl http://127.0.0.1:8000/api/resilience/status
```

#### Expected Report Structure

```json
{
  "test_id": "resilience_test_[timestamp]",
  "overall_result": "PASSED | FAILED | PARTIAL",
  "exit_criteria_met": true,
  "test_duration_hours": 4.0,
  "memory_leak_detected": false,
  "phases_completed": [
    "INITIALIZATION",
    "BASELINE_ESTABLISHMENT", 
    "CHAOS_INJECTION",
    "CIRCUIT_BREAKER_TESTING",
    "CASCADING_FAILURE_TESTING",
    "MEMORY_SOAK_TESTING", 
    "RECOVERY_VALIDATION",
    "FINAL_ANALYSIS",
    "CLEANUP"
  ],
  "chaos_events_triggered": 24,
  "successful_recoveries": 22,
  "recovery_success_rate": 0.916,
  "memory_growth_percent": 8.3,
  "max_memory_usage_mb": 1250,
  "circuit_breaker_tests_passed": 7,
  "cascading_failure_recovery": true
}
```

## Advanced Usage Patterns

### Custom Chaos Scenarios

```bash
# Inject provider timeout chaos
curl -X POST "http://127.0.0.1:8000/api/resilience/chaos/[SERVICE_ID]/inject" \
  -d '{"scenario": "provider_timeout", "target_service": "odds_provider", "duration": 600}'

# Inject 50% valuation exceptions
curl -X POST "http://127.0.0.1:8000/api/resilience/chaos/[SERVICE_ID]/inject" \
  -d '{"scenario": "valuation_exception", "target_service": "prop_analyzer", "duration": 300}'

# Inject latency spikes
curl -X POST "http://127.0.0.1:8000/api/resilience/chaos/[SERVICE_ID]/inject" \
  -d '{"scenario": "latency_spike", "target_service": "database_service", "duration": 180}'
```

### Extended Soak Testing

```bash
# 24-hour soak test with aggressive monitoring
curl -X POST "http://127.0.0.1:8000/api/resilience/tests/comprehensive" \
  -d '{
    "total_duration_hours": 24,
    "chaos_intensity": "high", 
    "memory_growth_threshold_percent": 5,
    "memory_sampling_interval_seconds": 15,
    "max_memory_growth_percent": 8.0
  }'
```

### Emergency Cleanup

```bash
# Emergency stop all resilience services
curl -X POST "http://127.0.0.1:8000/api/resilience/cleanup"
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Missing dependencies handled with fallback implementations
2. **Port Conflicts**: Ensure backend runs on port 8000
3. **Memory Pressure**: System includes circuit breakers for memory protection
4. **Long Test Duration**: Use background tasks and status endpoints for monitoring

### Debug Commands

```bash
# Check backend logs
tail -f backend/logs/propollama.log | grep "resilience"

# Verify service imports
python -c "from backend.services.resilience_test_orchestrator import create_orchestrator; print('✅ Import successful')"

# Test basic API connectivity
curl -v http://127.0.0.1:8000/api/resilience/status
```

## Success Metrics

### Test Pass Criteria

1. **Chaos Recovery**: ≥80% successful recovery from all chaos injections
2. **Memory Stability**: Memory growth <10% over 4+ hour duration
3. **Circuit Breaker Function**: All circuit breakers properly isolate and recover
4. **System Availability**: No permanent service degradation
5. **Cascading Failure Recovery**: System recovers from multi-service failures

### Performance Benchmarks

- **Chaos Injection Response Time**: <500ms per injection
- **Memory Monitoring Overhead**: <5% CPU impact
- **Circuit Breaker Response Time**: <100ms state transitions
- **Recovery Time**: <30 seconds average recovery per chaos event

## Conclusion

This comprehensive resilience testing system provides enterprise-grade chaos engineering, circuit breaker testing, and memory monitoring capabilities. The system is designed to prove resilience under adverse conditions through systematic testing of all failure modes and recovery mechanisms.

Execute the multi-hour soak test to validate system resilience and complete the exit criteria verification for production readiness.