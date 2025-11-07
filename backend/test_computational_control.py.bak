#!/usr/bin/env python3
"""
Test script for computational cost controller.

This script demonstrates and tests the predictable computational cost features:
- Line change classification (micro, moderate, major)
- Lazy flagged recompute for micro changes  
- Burst controller with degraded recompute mode
- Rolling counters tracking
"""

import asyncio
import logging
import time
from backend.services.provider_resilience_manager import provider_resilience_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger("computational_control_test")


async def test_line_change_classification():
    """Test line change classification system"""
    print("\n=== Testing Line Change Classification ===")
    
    test_events = [
        ("micro_change", 0.1, "Micro classification test"),
        ("moderate_change", 0.5, "Moderate classification test"), 
        ("major_change", 1.5, "Major classification test"),
    ]
    
    for event_type, magnitude, description in test_events:
        was_added, reason = await provider_resilience_manager.add_recompute_event(
            prop_id=f"test_prop_{event_type}",
            event_type=event_type,
            data={"test": True},
            change_magnitude=magnitude
        )
        
        print(f"  {description}: magnitude={magnitude}, added={was_added}, reason={reason}")
    
    # Wait for processing
    await asyncio.sleep(1.0)


async def test_lazy_flagged_recompute():
    """Test lazy flagged recompute for micro changes"""
    print("\n=== Testing Lazy Flagged Recompute ===")
    
    prop_id = "lazy_test_prop"
    
    # Send multiple micro changes in quick succession
    for i in range(5):
        was_added, reason = await provider_resilience_manager.add_recompute_event(
            prop_id=prop_id,
            event_type="micro_update",
            data={"sequence": i},
            change_magnitude=0.15  # Micro change
        )
        
        print(f"  Micro change {i+1}: added={was_added}, reason={reason}")
        
        # Small delay between events
        await asyncio.sleep(0.1)
    
    # Wait for lazy window to expire and check processing
    print("  Waiting for lazy window to expire...")
    await asyncio.sleep(6.0)  # Longer than lazy window (5 seconds)
    
    # Send another micro change - should be processed now
    was_added, reason = await provider_resilience_manager.add_recompute_event(
        prop_id=prop_id,
        event_type="micro_update",
        data={"sequence": "after_window"},
        change_magnitude=0.15
    )
    
    print(f"  After window expiry: added={was_added}, reason={reason}")


async def test_burst_controller():
    """Test burst controller under high load"""
    print("\n=== Testing Burst Controller ===")
    
    # Get initial metrics
    initial_status = provider_resilience_manager.get_computational_status()
    print(f"  Initial mode: {initial_status['controller_metrics']['current_mode']}")
    
    # Generate burst of events to trigger degraded mode
    prop_ids = [f"burst_prop_{i}" for i in range(10)]
    events_added = 0
    events_deferred = 0
    
    print("  Generating burst load (200 events)...")
    
    for i in range(200):
        prop_id = prop_ids[i % len(prop_ids)]
        event_type = "line_move" if i % 3 == 0 else "odds_change"
        magnitude = 0.8 if i % 5 == 0 else 0.3  # Mix of moderate changes
        
        was_added, reason = await provider_resilience_manager.add_recompute_event(
            prop_id=prop_id,
            event_type=event_type,
            data={"burst_test": True, "sequence": i},
            change_magnitude=magnitude
        )
        
        if was_added:
            events_added += 1
        else:
            events_deferred += 1
        
        # Very short delay to create burst
        await asyncio.sleep(0.01)
    
    # Check status after burst
    post_burst_status = provider_resilience_manager.get_computational_status()
    
    print(f"  Events added: {events_added}")
    print(f"  Events deferred: {events_deferred}")
    print(f"  Final mode: {post_burst_status['controller_metrics']['current_mode']}")
    print(f"  Queue depth: {post_burst_status['controller_metrics']['pending_queue_depth']}")
    print(f"  Load ratio: {post_burst_status['controller_metrics']['load_ratio']:.2f}")
    
    # Wait for processing to complete
    await asyncio.sleep(3.0)


async def test_rolling_counters():
    """Test rolling counter tracking"""
    print("\n=== Testing Rolling Counters ===")
    
    # Get initial metrics
    initial_metrics = provider_resilience_manager.get_computational_status()
    print("  Initial metrics:")
    print(f"    Events emitted: {initial_metrics['controller_metrics']['events_emitted']}")
    print(f"    Recomputes executed: {initial_metrics['controller_metrics']['recomputes_executed']}")
    print(f"    Pending queue depth: {initial_metrics['controller_metrics']['pending_queue_depth']}")
    
    # Generate steady load for counter testing
    for i in range(20):
        await provider_resilience_manager.add_recompute_event(
            prop_id=f"counter_prop_{i}",
            event_type="steady_load",
            data={"counter_test": True},
            change_magnitude=0.6
        )
        await asyncio.sleep(0.1)
    
    # Wait for processing
    await asyncio.sleep(2.0)
    
    # Get final metrics
    final_metrics = provider_resilience_manager.get_computational_status()
    print("  Final metrics:")
    print(f"    Events emitted: {final_metrics['controller_metrics']['events_emitted']}")
    print(f"    Recomputes executed: {final_metrics['controller_metrics']['recomputes_executed']}")
    print(f"    Pending queue depth: {final_metrics['controller_metrics']['pending_queue_depth']}")
    print(f"    Avg events/sec: {final_metrics['controller_metrics']['avg_events_per_sec']:.2f}")
    print(f"    Avg recomputes/sec: {final_metrics['controller_metrics']['avg_recomputes_per_sec']:.2f}")
    print(f"    Processing efficiency: {final_metrics['controller_metrics']['performance_metrics']['processing_efficiency']:.2f}")


async def test_major_event_no_starvation():
    """Test that major events are not starved under load"""
    print("\n=== Testing Major Event No Starvation ===")
    
    # Create high load with moderate events
    moderate_events = []
    for i in range(150):  # High load
        moderate_events.append(provider_resilience_manager.add_recompute_event(
            prop_id=f"moderate_prop_{i}",
            event_type="moderate_load",
            data={"load_test": True},
            change_magnitude=0.7  # Moderate
        ))
    
    # Process moderate events (should trigger degraded mode)
    moderate_results = await asyncio.gather(*moderate_events)
    moderate_added = sum(1 for added, _ in moderate_results if added)
    moderate_deferred = len(moderate_results) - moderate_added
    
    # Now send major events - these should not be starved
    major_events = []
    for i in range(10):
        major_events.append(provider_resilience_manager.add_recompute_event(
            prop_id=f"major_prop_{i}",
            event_type="injury_news",
            data={"major_test": True},
            change_magnitude=2.0  # Major
        ))
    
    major_results = await asyncio.gather(*major_events)
    major_added = sum(1 for added, _ in major_results if added)
    major_deferred = len(major_results) - major_added
    
    print(f"  Moderate events: {moderate_added} added, {moderate_deferred} deferred")
    print(f"  Major events: {major_added} added, {major_deferred} deferred")
    print(f"  Major starvation prevented: {major_deferred == 0}")
    
    await asyncio.sleep(2.0)


async def run_stress_test():
    """Run comprehensive stress test"""
    print("\n=== Running 10x Baseline Stress Test ===")
    
    results = await provider_resilience_manager.stress_test_computational_control(
        baseline_events=50,  # 50 events/sec baseline
        duration_sec=5       # 5 second test
    )
    
    print("  Stress Test Results:")
    print(f"    Test passed: {results['stress_test_passed']}")
    print(f"    CPU under threshold: {results['cpu_under_threshold']}")
    print(f"    No major starvation: {results['no_major_starvation']}")
    print(f"    Events submitted: {results['events_submitted']}")
    print(f"    Major events processed: {results['major_events_processed']}")
    print(f"    Micro events deferred: {results['micro_events_deferred']}")
    print(f"    Final mode: {results['final_metrics']['current_mode']}")
    print(f"    Final queue depth: {results['performance_degradation']['queue_depth_final']}")
    print(f"    Processing efficiency: {results['performance_degradation']['processing_efficiency']:.2f}")


async def main():
    """Main test runner"""
    print("Starting Computational Cost Controller Tests")
    print("=" * 50)
    
    try:
        # Initialize the provider resilience manager
        await provider_resilience_manager.register_provider("test_provider")
        
        # Run all tests
        await test_line_change_classification()
        await test_lazy_flagged_recompute()
        await test_burst_controller()
        await test_rolling_counters()
        await test_major_event_no_starvation()
        await run_stress_test()
        
        print("\n" + "=" * 50)
        print("All tests completed successfully!")
        
        # Final system status
        final_status = provider_resilience_manager.get_system_status()
        print("\nFinal System Status:")
        print(f"  Computational mode: {final_status['performance_status']['current_mode']}")
        print(f"  Load ratio: {final_status['performance_status']['load_ratio']:.2f}")
        print(f"  Under CPU target: {final_status['performance_status']['under_cpu_target']}")
        print(f"  Queue depth: {final_status['performance_status']['queue_depth']}")
        print(f"  Processing efficiency: {final_status['performance_status']['processing_efficiency']:.2f}")
        
    except Exception as e:
        logger.error(f"Test failed with error: {e}")
        raise
    finally:
        # Clean shutdown
        await provider_resilience_manager.close()


if __name__ == "__main__":
    asyncio.run(main())