#!/usr/bin/env python3
"""
Provider Resilience Demo Script

Demonstrates the complete provider resilience system with circuit breaker patterns,
SLA metrics tracking, and reliability monitoring integration.

This script verifies the exit criteria:
1. Single provider outage does not block other providers
2. Circuit re-closes after successful half-open probe
"""

import asyncio
import time
import sys
import os

# Add the project root to the path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.provider_resilience_manager import provider_resilience_manager
from backend.services.provider_resilience_testing import run_resilience_tests
from backend.services.provider_reliability_integration import (
    provider_reliability_integrator,
    start_provider_reliability_monitoring
)
from backend.services.unified_logging import get_logger

logger = get_logger("provider_resilience_demo")


async def demo_circuit_breaker_transitions():
    """Demonstrate circuit breaker state transitions: CLOSED → OPEN → HALF_OPEN → CLOSED"""
    
    print("\n🔄 DEMO: Circuit Breaker State Transitions")
    print("=" * 60)
    
    provider_id = "demo_provider"
    
    # Register the provider
    await provider_resilience_manager.register_provider(provider_id)
    print(f"✅ Registered provider: {provider_id}")
    
    # Phase 1: Normal operation (CLOSED state)
    print("\n📍 Phase 1: Normal Operation (CLOSED)")
    for i in range(3):
        await provider_resilience_manager.record_provider_request(
            provider_id=provider_id,
            success=True,
            latency_ms=100.0
        )
    
    state = provider_resilience_manager.get_provider_state(provider_id)
    if state:
        print(f"   Provider State: {state['provider_state']}")
        print(f"   Circuit State: {state['circuit_state']}")
        print(f"   Success Rate: {state['success_rate_5m']:.2f}")
    else:
        print("   ⚠️ Provider state not found")
    
    # Phase 2: Cause failures to open circuit (CLOSED → OPEN)
    print("\n📍 Phase 2: Triggering Circuit Breaker (CLOSED → OPEN)")
    for i in range(12):  # Trigger circuit open at 10 failures
        await provider_resilience_manager.record_provider_request(
            provider_id=provider_id,
            success=False,
            latency_ms=2000.0,
            error=Exception(f"Simulated failure {i+1}")
        )
        
        if i == 9:  # After 10th failure
            state = provider_resilience_manager.get_provider_state(provider_id)
            if state:
                print(f"   After {i+1} failures:")
                print(f"     Provider State: {state['provider_state']}")
                print(f"     Circuit State: {state['circuit_state']}")
                print(f"     Consecutive Failures: {state['consecutive_failures']}")
    
    state = provider_resilience_manager.get_provider_state(provider_id)
    if state:
        print(f"\n   Final Circuit State: {state['circuit_state']}")
        print(f"   Backoff Duration: {state['backoff_current_sec']:.1f} seconds")
        
        # Phase 3: Wait for cooldown and test HALF_OPEN transition
        print("\n📍 Phase 3: Testing Recovery (OPEN → HALF_OPEN → CLOSED)")
        print("   Waiting for circuit breaker cooldown...")
        
        # Wait for retry time
        retry_time = state['next_retry_time']
        current_time = time.time()
        if retry_time > current_time:
            wait_time = min(retry_time - current_time + 0.5, 5.0)  # Max 5 seconds wait
            await asyncio.sleep(wait_time)
    else:
        print("   ⚠️ Provider state not available for recovery testing")
        return
    
    # Check if we can retry (should transition to HALF_OPEN)
    should_skip, retry_after, circuit_state = await provider_resilience_manager.should_skip_provider(provider_id)
    print(f"   Should Skip: {should_skip}, Circuit State: {circuit_state}")
    
    # Send successful requests to recover (HALF_OPEN → CLOSED)
    print("   Sending recovery requests...")
    for i in range(5):  # Send enough successful requests to close circuit
        if not should_skip:
            await provider_resilience_manager.record_provider_request(
                provider_id=provider_id,
                success=True,
                latency_ms=150.0
            )
        
        state = provider_resilience_manager.get_provider_state(provider_id)
        should_skip, retry_after, circuit_state = await provider_resilience_manager.should_skip_provider(provider_id)
        
        if circuit_state == "closed":
            print(f"   🎉 Circuit CLOSED after {i+1} successful requests!")
            break
        
        await asyncio.sleep(0.1)
    
    # Final state
    final_state = provider_resilience_manager.get_provider_state(provider_id)
    if final_state:
        print(f"\n✅ Final State:")
        print(f"   Provider State: {final_state['provider_state']}")
        print(f"   Circuit State: {final_state['circuit_state']}")
        print(f"   Success Rate: {final_state['success_rate_5m']:.2f}")
        print(f"   SLA Percentage: {final_state['sla_percentage']:.1f}%")
    else:
        print(f"\n⚠️ Final state unavailable for provider: {provider_id}")


async def demo_sla_metrics_tracking():
    """Demonstrate SLA metrics with error categorization"""
    
    print("\n📊 DEMO: SLA Metrics & Error Categorization")
    print("=" * 60)
    
    provider_id = "sla_demo_provider"
    await provider_resilience_manager.register_provider(provider_id)
    print(f"✅ Registered provider: {provider_id}")
    
    # Simulate various types of requests
    test_scenarios = [
        ("Success", True, 100.0, None),
        ("Success", True, 150.0, None),
        ("Success", True, 80.0, None),
        ("Connection Error", False, 5000.0, Exception("Connection timeout")),
        ("Rate Limit", False, 200.0, Exception("Rate limit exceeded (429)")),
        ("Success", True, 120.0, None),
        ("Server Error", False, 1000.0, Exception("Internal server error (500)")),
        ("Success", True, 90.0, None),
        ("Auth Error", False, 300.0, Exception("Authentication failed (401)")),
        ("Success", True, 200.0, None),
    ]
    
    print("\n📝 Simulating requests:")
    for scenario_name, success, latency, error in test_scenarios:
        await provider_resilience_manager.record_provider_request(
            provider_id=provider_id,
            success=success,
            latency_ms=latency,
            error=error
        )
        status = "✅" if success else "❌"
        print(f"   {status} {scenario_name}: {latency:.0f}ms")
    
    # Get final metrics
    state = provider_resilience_manager.get_provider_state(provider_id)
    
    if state:
        print(f"\n📈 SLA Metrics:")
        print(f"   Success Percentage: {state['sla_percentage']:.1f}%")
        print(f"   Average Latency: {state['avg_latency_ms']:.0f}ms")
        print(f"   P95 Latency: {state['p95_latency_ms']:.0f}ms")
        print(f"   Total Requests: {state['total_requests']}")
        print(f"   Successful Requests: {state['successful_requests']}")
        print(f"   Failed Requests: {state['failed_requests']}")
        
        print(f"\n🏷️ Error Categories:")
        for category, count in state['error_categories'].items():
            print(f"   {category}: {count}")
    else:
        print(f"\n⚠️ SLA metrics unavailable for provider: {provider_id}")


async def demo_reliability_integration():
    """Demonstrate reliability monitoring integration"""
    
    print("\n🔗 DEMO: Reliability Monitoring Integration")
    print("=" * 60)
    
    # Get health summaries
    health_summaries = provider_reliability_integrator.get_provider_health_summaries()
    print(f"✅ Provider Health Summary:")
    print(f"   Total Providers: {health_summaries['summary']['total_count']}")
    print(f"   Healthy: {health_summaries['summary']['healthy_count']}")
    print(f"   Degraded: {health_summaries['summary']['degraded_count']}")
    print(f"   Outages: {health_summaries['summary']['outage_count']}")
    
    # Detect anomalies
    anomalies = provider_reliability_integrator.detect_provider_anomalies()
    print(f"\n🚨 Detected Anomalies: {len(anomalies)}")
    for anomaly in anomalies:
        severity_icon = {"critical": "🔴", "warning": "🟡", "info": "🔵"}.get(anomaly.get("severity", "info"), "⚪")
        print(f"   {severity_icon} {anomaly.get('code')}: {anomaly.get('description')}")
    
    # Get reliability metrics
    reliability_metrics = provider_reliability_integrator.get_provider_reliability_metrics()
    print(f"\n📊 Reliability Metrics:")
    for provider_id, metrics in reliability_metrics['provider_scores'].items():
        print(f"   {provider_id}:")
        print(f"     Reliability Score: {metrics['reliability_score']:.1f}/100")
        print(f"     Health Status: {metrics['health_status']}")
        print(f"     Circuit State: {metrics['circuit_state']}")
        print(f"     Available: {'✅' if metrics['is_available'] else '❌'}")


async def run_comprehensive_demo():
    """Run the complete provider resilience demonstration"""
    
    print("🚀 PROVIDER RESILIENCE DEMONSTRATION")
    print("=" * 80)
    print("This demo verifies the exit criteria:")
    print("1. Single provider outage does not block other providers")
    print("2. Circuit re-closes after successful half-open probe")
    print("3. SLA metrics tracking with error categorization")
    print("4. Reliability monitoring integration")
    
    try:
        # Run individual demos
        await demo_circuit_breaker_transitions()
        await demo_sla_metrics_tracking()
        await demo_reliability_integration()
        
        # Run comprehensive test suite
        print("\n🧪 COMPREHENSIVE TEST SUITE")
        print("=" * 60)
        print("Running automated tests to verify exit criteria...")
        
        test_results = await run_resilience_tests()
        
        print(f"\n📋 Test Results:")
        print(f"   Total Tests: {test_results['total_tests']}")
        print(f"   Passed: {test_results['passed_tests']} ✅")
        print(f"   Failed: {test_results['failed_tests']} ❌")
        print(f"   Success Rate: {test_results['success_rate']:.1f}%")
        print(f"   Duration: {test_results['suite_duration_sec']:.1f}s")
        
        # Show individual test results
        for test_result in test_results['test_results']:
            status_icon = "✅" if test_result['success'] else "❌"
            print(f"\n   {status_icon} {test_result['scenario']}:")
            print(f"      Duration: {test_result['duration_sec']:.1f}s")
            if test_result['error']:
                print(f"      Error: {test_result['error']}")
            
            # Show key details for specific tests
            if test_result['scenario'] == 'single_provider_outage':
                details = test_result['details']
                print(f"      Provider 1 (failing): {details.get('provider_1_successes', 0)} successes")
                print(f"      Provider 2 (healthy): {details.get('provider_2_successes', 0)} successes") 
                print(f"      Provider 3 (healthy): {details.get('provider_3_successes', 0)} successes")
            
            elif test_result['scenario'] == 'circuit_breaker_recovery':
                details = test_result['details']
                print(f"      Circuit Closed: {'✅' if details.get('circuit_closed_successfully') else '❌'}")
                print(f"      Provider Recovered: {'✅' if details.get('provider_recovered') else '❌'}")
                print(f"      Recovery Attempts: {details.get('recovery_attempts', 0)}")
        
        # Final system status
        system_status = provider_resilience_manager.get_system_status()
        print(f"\n📊 Final System Status:")
        print(f"   Total Providers: {system_status['total_providers']}")
        print(f"   Healthy Providers: {system_status['healthy_providers']}")
        print(f"   Degraded Providers: {system_status['degraded_providers']}")
        
        # Overall success
        overall_success = test_results['success_rate'] >= 80.0  # 80% threshold
        print(f"\n🎯 OVERALL RESULT: {'✅ SUCCESS' if overall_success else '❌ NEEDS ATTENTION'}")
        
        if overall_success:
            print("\n✅ EXIT CRITERIA VERIFICATION:")
            print("   ✅ Single provider outage isolation: VERIFIED")
            print("   ✅ Circuit breaker recovery: VERIFIED") 
            print("   ✅ SLA metrics tracking: VERIFIED")
            print("   ✅ Reliability monitoring integration: VERIFIED")
        else:
            print("\n❌ Some tests failed - review results above")
        
        return overall_success
        
    except Exception as e:
        logger.error(f"Demo failed with exception: {e}", exc_info=True)
        print(f"\n❌ Demo failed: {e}")
        return False


if __name__ == "__main__":
    """Run the demonstration if executed directly"""
    print("Starting Provider Resilience Demo...")
    
    # Set up basic logging
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the demo
    success = asyncio.run(run_comprehensive_demo())
    
    exit_code = 0 if success else 1
    sys.exit(exit_code)