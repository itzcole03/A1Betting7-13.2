"""
Test script for Model Integrity Phase components
================================================

Quick verification that the core components are working properly:
1. Recompute Scheduler
2. Calibration Harness 
3. Edge Persistence Model
4. Metrics Export System

Run this script to verify the immediate priorities are operational.
"""

import asyncio
import time
import logging
from typing import Dict, Any

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("model_integrity_test")


async def test_recompute_scheduler():
    """Test recompute scheduler functionality"""
    logger.info("Testing Recompute Scheduler...")
    
    try:
        from backend.services.recompute_scheduler import recompute_scheduler, RecomputeTrigger
        
        # Test scheduler status
        status = recompute_scheduler.get_status()
        logger.info(f"Scheduler status: {status}")
        
        # Test scheduling a job
        job_id = await recompute_scheduler.schedule_recompute(
            game_id="test_game_123",
            trigger=RecomputeTrigger.MANUAL,
            prop_ids=["prop_1", "prop_2"]
        )
        
        if job_id:
            logger.info(f"Successfully scheduled job: {job_id}")
        else:
            logger.info("Job was debounced (expected for rapid testing)")
        
        # Test job history
        history = recompute_scheduler.get_job_history(limit=5)
        logger.info(f"Job history count: {len(history)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Recompute scheduler test failed: {str(e)}")
        return False


async def test_calibration_harness():
    """Test calibration harness functionality"""
    logger.info("Testing Calibration Harness...")
    
    try:
        from backend.services.calibration_harness import calibration_harness, PropType, OutcomeType
        
        # Record a test prediction
        await calibration_harness.record_prediction(
            prediction_id="test_pred_123",
            game_id="test_game_123",
            prop_type=PropType.PITCHER_STRIKEOUTS,
            prop_line=6.5,
            predicted_value=7.2,
            predicted_probability=0.65,
            confidence_score=0.75
        )
        
        logger.info("Recorded test prediction successfully")
        
        # Get overall summary
        summary = await calibration_harness.get_overall_summary()
        logger.info(f"Calibration summary: {summary}")
        
        # Get prop type summary
        prop_summary = await calibration_harness.get_prop_type_summary(PropType.PITCHER_STRIKEOUTS)
        logger.info(f"Pitcher strikeouts summary: {prop_summary}")
        
        # Test outcome recording (simulate)
        await calibration_harness.simulate_outcome_for_testing(
            prediction_id="test_pred_123",
            actual_value=8.0,
            outcome=OutcomeType.OVER
        )
        
        logger.info("Recorded test outcome successfully")
        
        return True
        
    except Exception as e:
        logger.error(f"Calibration harness test failed: {str(e)}")
        return False


async def test_edge_persistence():
    """Test edge persistence model functionality"""
    logger.info("Testing Edge Persistence Model...")
    
    try:
        from backend.services.edge_persistence_model import edge_persistence_model, EdgeType
        
        # Create a test edge
        edge = await edge_persistence_model.create_edge(
            edge_id="test_edge_123",
            game_id="test_game_123",
            prop_id="test_prop_123",
            edge_type=EdgeType.PLAYER_PROP,
            expected_value=0.05,  # 5% edge
            confidence_score=0.7,
            line_value=6.5
        )
        
        logger.info(f"Created test edge: {edge.id}")
        
        # Update the edge with new values
        updated_edge = await edge_persistence_model.update_edge(
            edge_id="test_edge_123",
            expected_value=0.04,  # Slightly lower EV
            confidence_score=0.65,
            line_value=6.0  # Line moved
        )
        
        if updated_edge:
            logger.info(f"Updated edge - persistence score: {updated_edge.persistence_score:.3f}")
        
        # Get edge quality summary
        summary = edge_persistence_model.get_edge_quality_summary()
        logger.info(f"Edge quality summary: {summary}")
        
        # Get active edges
        active_edges = await edge_persistence_model.get_active_edges(min_persistence_score=0.0)
        logger.info(f"Active edges count: {len(active_edges)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Edge persistence test failed: {str(e)}")
        return False


async def test_metrics_export():
    """Test metrics export system functionality"""
    logger.info("Testing Metrics Export System...")
    
    try:
        from backend.services.metrics_export import metrics_collector, MetricType
        
        # Record some test metrics
        metrics_collector.record_metric("test.counter", 100, metric_type=MetricType.COUNTER)
        metrics_collector.record_metric("test.gauge", 75.5, metric_type=MetricType.GAUGE)
        metrics_collector.record_metric("test.latency", 250.0, metric_type=MetricType.HISTOGRAM, tags={"service": "test"})
        
        logger.info("Recorded test metrics successfully")
        
        # Get health summary
        health = await metrics_collector.get_health_summary()
        logger.info(f"Health summary: {health}")
        
        # Get metric history
        history = metrics_collector.get_metric_history("test.gauge", limit=10)
        logger.info(f"Metric history count: {len(history)}")
        
        # Test Prometheus format export
        prometheus = metrics_collector.get_prometheus_format()
        logger.info(f"Prometheus format length: {len(prometheus)} characters")
        
        return True
        
    except Exception as e:
        logger.error(f"Metrics export test failed: {str(e)}")
        return False


async def integration_test():
    """Test integration between components"""
    logger.info("Running Integration Test...")
    
    try:
        from backend.services.recompute_scheduler import recompute_scheduler, RecomputeTrigger
        from backend.services.calibration_harness import calibration_harness, PropType
        from backend.services.edge_persistence_model import edge_persistence_model, EdgeType
        from backend.services.metrics_export import metrics_collector
        
        # Scenario: Line change triggers recompute, which creates new edge, which gets tracked
        
        # 1. Schedule recompute due to line change
        job_id = await recompute_scheduler.schedule_recompute(
            game_id="integration_game_456",
            trigger=RecomputeTrigger.LINE_CHANGE,
            context={"line_change_magnitude": 0.3}
        )
        
        logger.info(f"Scheduled recompute job: {job_id}")
        
        # 2. Create edge as result of recompute
        edge = await edge_persistence_model.create_edge(
            edge_id="integration_edge_456",
            game_id="integration_game_456",
            prop_id="integration_prop_456",
            edge_type=EdgeType.PLAYER_PROP,
            expected_value=0.08,
            confidence_score=0.8,
            line_value=7.5
        )
        
        logger.info(f"Created edge with persistence: {edge.persistence_score}")
        
        # 3. Record prediction for calibration
        await calibration_harness.record_prediction(
            prediction_id="integration_pred_456",
            game_id="integration_game_456",
            prop_type=PropType.PITCHER_STRIKEOUTS,
            prop_line=7.5,
            predicted_value=8.2,
            predicted_probability=0.75,
            confidence_score=0.8
        )
        
        logger.info("Recorded prediction for calibration")
        
        # 4. Record metrics showing system activity
        current_time = time.time()
        metrics_collector.record_metric("integration.edges_created", 1)
        metrics_collector.record_metric("integration.predictions_recorded", 1)
        metrics_collector.record_metric("integration.recomputes_scheduled", 1)
        
        logger.info("Recorded integration metrics")
        
        # 5. Verify everything is tracked properly
        edge_summary = edge_persistence_model.get_edge_quality_summary()
        cal_summary = await calibration_harness.get_overall_summary()
        recompute_status = recompute_scheduler.get_status()
        
        logger.info("Integration test results:")
        logger.info(f"  - Active edges: {edge_summary['active_edges']}")
        logger.info(f"  - Total predictions: {cal_summary['total_predictions']}")
        logger.info(f"  - Recompute jobs queued: {recompute_status['metrics']['jobs_queued']}")
        
        return True
        
    except Exception as e:
        logger.error(f"Integration test failed: {str(e)}")
        return False


async def main():
    """Run all tests"""
    logger.info("Starting Model Integrity Phase Component Tests")
    logger.info("=" * 60)
    
    test_results = {
        "recompute_scheduler": await test_recompute_scheduler(),
        "calibration_harness": await test_calibration_harness(),
        "edge_persistence": await test_edge_persistence(),
        "metrics_export": await test_metrics_export(),
        "integration": await integration_test()
    }
    
    logger.info("=" * 60)
    logger.info("Test Results Summary:")
    
    passed = 0
    total = len(test_results)
    
    for component, result in test_results.items():
        status = "PASS" if result else "FAIL"
        logger.info(f"  {component}: {status}")
        if result:
            passed += 1
    
    logger.info(f"\nOverall: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    
    if passed == total:
        logger.info("🎉 All Model Integrity Phase components are operational!")
        logger.info("\nNext steps:")
        logger.info("1. Integrate with existing prop generation pipeline")
        logger.info("2. Add real MLB game data for calibration testing")
        logger.info("3. Implement payout normalization (Phase 2 alignment)")
        logger.info("4. Set up monitoring dashboard")
    else:
        logger.error("❌ Some components failed - review logs above for details")
        
    return passed == total


if __name__ == "__main__":
    # Run the tests
    success = asyncio.run(main())
    exit(0 if success else 1)