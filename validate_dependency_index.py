#!/usr/bin/env python3
"""
Dependency Index Validation Test

Tests the selective updates implementation including:
1. Dependency index persistence snapshot (in-memory + periodic serialization)
2. Integrity verifier task detecting dangling edges and orphaned tickets
3. Auto-retirement and repair logic with structured remediation logging
4. Recovery logic handling synthetic churn

Exit criteria:
- Integrity sweep logs zero critical issues after synthetic churn test
- Recovery logic successfully retires invalid references
"""

import asyncio
import json
import logging
import sys
import time
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent))

from backend.services.provider_resilience_manager import (
    provider_resilience_manager, 
    DependencyIndex,
    IntegrityIssueType,
    RemediationAction
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger(__name__)


async def test_dependency_index_functionality():
    """Test core dependency index functionality"""
    logger.info("🧪 Testing dependency index functionality...")
    
    # Create a test instance
    test_index = DependencyIndex(persist_dir="./test_snapshots")
    await test_index.start_background_tasks()
    
    # Test 1: Add some props, edges, and tickets
    logger.info("📝 Test 1: Adding test data...")
    
    # Add props
    await test_index.update_prop(101, "active")
    await test_index.update_prop(102, "active")
    await test_index.update_prop(103, "retired")  # This will create dangling edges later
    
    # Add edges
    await test_index.update_edge(201, 101, "active")
    await test_index.update_edge(202, 102, "active")
    await test_index.update_edge(203, 103, "active")  # This will be dangling
    
    # Add tickets
    await test_index.update_ticket(301, [201, 202], "active")
    await test_index.update_ticket(302, [203], "active")  # This will be orphaned
    
    # Test 2: Check initial health
    health = await test_index.get_dependency_health()
    logger.info(f"📊 Initial health: {health['total_nodes']} nodes, {health['health_score']:.2f} score")
    
    assert health['total_nodes'] == 8, f"Expected 8 nodes, got {health['total_nodes']}"
    assert health['active_nodes'] == 7, f"Expected 7 active nodes, got {health['active_nodes']}"  # 2 props(active) + 3 edges + 2 tickets = 7
    
    # Test 3: Create integrity issues by retiring prop 103
    logger.info("🔧 Test 3: Creating integrity issues...")
    await test_index.update_prop(103, "retired")
    
    # Run integrity verification
    await test_index._run_integrity_verification()
    
    # Check that issues were found
    updated_health = await test_index.get_dependency_health()
    issues = updated_health['integrity_issues']
    
    logger.info(f"🔍 Issues found: {issues['total']} total, {issues['critical']} critical")
    assert issues['total'] > 0, "Expected integrity issues to be found"
    assert issues['critical'] > 0, "Expected critical integrity issues"
    
    # Test 4: Test snapshot persistence
    logger.info("💾 Test 4: Testing snapshot persistence...")
    snapshot_path = await test_index._create_snapshot()
    assert Path(snapshot_path).exists(), "Snapshot file should exist"
    
    # Create new index and load snapshot
    test_index2 = DependencyIndex(persist_dir="./test_snapshots")
    success = await test_index2.load_snapshot()
    assert success, "Should be able to load snapshot"
    
    # Verify data was restored
    health2 = await test_index2.get_dependency_health()
    assert health2['total_nodes'] == updated_health['total_nodes'], "Node count should match after load"
    
    logger.info("✅ Test 1-4 passed: Basic functionality working")
    return True


async def test_synthetic_churn():
    """Test synthetic churn and recovery logic"""
    logger.info("🌪️ Testing synthetic churn and recovery...")
    
    # Run synthetic churn test through provider resilience manager
    results = await provider_resilience_manager.run_synthetic_churn_test(iterations=50)
    
    # Validate results
    test_passed = results.get("test_passed", False)
    integrity_results = results.get("integrity_results", {})
    
    total_issues = integrity_results.get("total_issues_found", 0)
    initial_issues = integrity_results.get("initial_issues_count", 0)
    remediated_issues = integrity_results.get("remediated_issues", 0)
    remediation_rate = integrity_results.get("remediation_success_rate", 0)
    
    logger.info(f"🔍 Churn test results:")
    logger.info(f"  - Test passed: {test_passed}")
    logger.info(f"  - Initial issues: {initial_issues}")
    logger.info(f"  - Final issues found: {total_issues}")
    logger.info(f"  - Issues remediated: {remediated_issues}")
    logger.info(f"  - Remediation rate: {remediation_rate:.1%}")
    logger.info(f"  - Test duration: {results.get('test_duration_sec', 0):.2f}s")
    
    # Validation criteria from objective - modified to handle background remediation
    assert test_passed, "Synthetic churn test should pass"
    # Use initial_issues if background tasks cleared everything, otherwise use total_issues
    meaningful_issues = max(initial_issues, total_issues)
    assert meaningful_issues > 0, f"Test should find some issues (found {meaningful_issues} initial, {total_issues} final)"
    assert remediation_rate >= 1.0, "All issues should be remediated"
    
    logger.info("✅ Synthetic churn test passed: Recovery logic working correctly")
    return results


async def test_api_endpoints():
    """Test the dependency health API endpoints"""
    logger.info("🌐 Testing API endpoint functionality...")
    
    # Test dependency health retrieval
    health = await provider_resilience_manager.get_dependency_health()
    
    assert "health_score" in health, "Health should include health_score"
    assert "total_nodes" in health, "Health should include total_nodes"
    assert "integrity_issues" in health, "Health should include integrity_issues"
    assert "performance_metrics" in health, "Health should include performance_metrics"
    
    logger.info(f"📊 Current dependency health:")
    logger.info(f"  - Health score: {health['health_score']:.2f}")
    logger.info(f"  - Total nodes: {health['total_nodes']}")
    logger.info(f"  - Integrity issues: {health['integrity_issues']['total']}")
    logger.info(f"  - Performance metrics available: {len(health['performance_metrics'])}")
    
    logger.info("✅ API endpoints working correctly")
    return health


async def validate_exit_criteria():
    """Validate exit criteria from the objective"""
    logger.info("🎯 Validating exit criteria...")
    
    # Criterion 1: Run synthetic churn test and verify zero critical issues after
    churn_results = await test_synthetic_churn()
    
    # Criterion 2: Verify recovery logic successfully retires invalid references
    integrity_results = churn_results.get("integrity_results", {})
    remediation_success_rate = integrity_results.get("remediation_success_rate", 0)
    
    # Final health check
    final_health = await provider_resilience_manager.get_dependency_health()
    critical_issues = final_health['integrity_issues']['critical']
    
    logger.info("🎯 Exit Criteria Validation:")
    logger.info(f"  ✅ Criterion 1 - Zero critical issues after churn test: {critical_issues == 0}")
    logger.info(f"  ✅ Criterion 2 - Recovery logic success rate: {remediation_success_rate:.1%}")
    
    # Both criteria must pass
    criterion1_passed = critical_issues == 0
    criterion2_passed = remediation_success_rate >= 1.0
    
    all_passed = criterion1_passed and criterion2_passed
    
    if all_passed:
        logger.info("🎉 ALL EXIT CRITERIA PASSED!")
    else:
        logger.error("❌ Exit criteria validation failed")
    
    return all_passed, {
        "critical_issues_after_churn": critical_issues,
        "remediation_success_rate": remediation_success_rate,
        "criterion1_passed": criterion1_passed,
        "criterion2_passed": criterion2_passed
    }


async def main():
    """Main test execution"""
    logger.info("🚀 Starting Dependency Index Validation Test")
    logger.info("=" * 60)
    
    try:
        # Test basic functionality
        await test_dependency_index_functionality()
        
        # Test API endpoints
        await test_api_endpoints()
        
        # Validate exit criteria
        passed, results = await validate_exit_criteria()
        
        logger.info("=" * 60)
        if passed:
            logger.info("🎉 DEPENDENCY INDEX IMPLEMENTATION VALIDATION: PASSED")
            logger.info("✅ Selective updates implementation is correct!")
            logger.info("✅ Integrity verification working properly!")
            logger.info("✅ Auto-retirement logic successful!")
            logger.info("✅ Recovery logic handles synthetic churn correctly!")
            return 0
        else:
            logger.error("❌ DEPENDENCY INDEX IMPLEMENTATION VALIDATION: FAILED")
            logger.error(f"   Detailed results: {results}")
            return 1
            
    except Exception as e:
        logger.error(f"💥 Test execution failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    # Run the test
    exit_code = asyncio.run(main())
    sys.exit(exit_code)