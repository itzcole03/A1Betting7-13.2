#!/usr/bin/env python3
"""
Test Runner for Streaming Cycle Stability

This script executes the comprehensive stability test suite to verify
operational risk reduction objectives and exit criteria compliance.

Exit Criteria:
1. Streaming cycle stable under synthetic burst tests
2. No handler re-entrancy errors  
3. Mean recompute latency unchanged or reduced

Usage:
    python test_streaming_stability.py [--verbose] [--output-file results.json]
"""

import argparse
import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from services.streaming_stability_test import StreamingStabilityTester


def setup_logging(verbose: bool = False):
    """Setup logging configuration"""
    level = logging.DEBUG if verbose else logging.INFO
    
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('streaming_stability_test.log')
        ]
    )


async def main():
    """Main test execution"""
    parser = argparse.ArgumentParser(description='Run streaming cycle stability tests')
    parser.add_argument('--verbose', '-v', action='store_true', 
                        help='Enable verbose logging')
    parser.add_argument('--output-file', '-o', type=str, 
                        default='streaming_stability_results.json',
                        help='Output file for test results (JSON format)')
    parser.add_argument('--quick', '-q', action='store_true',
                        help='Run quick test suite (reduced durations)')
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    logger = logging.getLogger("test_runner")
    
    logger.info("=" * 60)
    logger.info("STREAMING CYCLE STABILITY TEST")
    logger.info("=" * 60)
    logger.info(f"Test started at: {datetime.now().isoformat()}")
    logger.info(f"Output file: {args.output_file}")
    logger.info(f"Verbose mode: {args.verbose}")
    logger.info(f"Quick mode: {args.quick}")
    logger.info("=" * 60)
    
    try:
        # Initialize test suite
        tester = StreamingStabilityTester()
        
        if args.quick:
            logger.info("Running QUICK test suite (reduced parameters)")
            # Override test parameters for quick testing
            tester.test_providers = ["test_provider_1", "test_provider_2"]
            tester.test_props = [f"prop_{i}" for i in range(20)]  # Reduced from 100
        
        # Run comprehensive test suite
        logger.info("Starting comprehensive stability test...")
        results = await tester.run_comprehensive_stability_test()
        
        # Save results to file
        output_path = Path(args.output_file)
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Test results saved to: {output_path.absolute()}")
        
        # Print summary
        print_test_summary(results, logger)
        
        # Determine exit code
        if 'error' in results:
            logger.error(f"Test suite failed with error: {results['error']}")
            return 1
        
        exit_criteria_met = results.get('exit_criteria', {}).get('all_criteria_met', False)
        
        if exit_criteria_met:
            logger.info("🎉 ALL EXIT CRITERIA MET - OPERATIONAL RISK REDUCTION SUCCESSFUL")
            return 0
        else:
            logger.warning("❌ SOME EXIT CRITERIA NOT MET - REVIEW REQUIRED")
            return 1
            
    except KeyboardInterrupt:
        logger.info("Test execution interrupted by user")
        return 130
        
    except Exception as e:
        logger.error(f"Test suite failed with unexpected error: {e}", exc_info=True)
        return 1


def print_test_summary(results: dict, logger: logging.Logger):
    """Print formatted test summary"""
    logger.info("")
    logger.info("=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    
    if 'error' in results:
        logger.error(f"ERROR: {results['error']}")
        return
    
    # Overall summary
    summary = results.get('test_summary', {})
    logger.info(f"Total Tests: {summary.get('total_tests', 0)}")
    logger.info(f"Total Events: {summary.get('total_events', 0):,}")
    logger.info(f"Success Rate: {summary.get('success_rate', 0):.2f}%")
    logger.info(f"Overall Avg Latency: {summary.get('overall_avg_latency_ms', 0):.2f}ms")
    
    logger.info("")
    logger.info("EXIT CRITERIA:")
    logger.info("=" * 40)
    
    exit_criteria = results.get('exit_criteria', {})
    
    criteria_checks = [
        ("Streaming Cycle Stable", exit_criteria.get('streaming_cycle_stable', False)),
        ("No Re-entrancy Errors", exit_criteria.get('no_re_entrancy_errors', False)),
        ("Latency Maintained", exit_criteria.get('latency_maintained', False)),
    ]
    
    for criterion, met in criteria_checks:
        status = "✅ PASS" if met else "❌ FAIL"
        logger.info(f"{criterion:<25}: {status}")
    
    all_met = exit_criteria.get('all_criteria_met', False)
    overall_status = "✅ SUCCESS" if all_met else "❌ FAILED"
    logger.info(f"{'Overall Result':<25}: {overall_status}")
    
    logger.info("")
    logger.info("INDIVIDUAL TEST RESULTS:")
    logger.info("=" * 40)
    
    # Individual test results
    for test in results.get('individual_test_results', []):
        logger.info(f"Test: {test.get('test_name', 'Unknown')}")
        logger.info(f"  Duration: {test.get('duration_sec', 0):.1f}s")
        logger.info(f"  Events: {test.get('total_events', 0):,}")
        logger.info(f"  Success Rate: {test.get('success_rate', 0):.2f}%")
        logger.info(f"  Avg Latency: {test.get('avg_latency_ms', 0):.2f}ms")
        logger.info(f"  P95 Latency: {test.get('p95_latency_ms', 0):.2f}ms")
        
        stable = test.get('system_stable', False)
        status = "✅ STABLE" if stable else "❌ UNSTABLE"
        logger.info(f"  System Status: {status}")
        
        re_errors = test.get('re_entrancy_errors', 0)
        if re_errors > 0:
            logger.warning(f"  ⚠️  Re-entrancy Errors: {re_errors}")
        
        logger.info("")
    
    # System status
    system_status = results.get('system_status', {})
    if system_status:
        logger.info("SYSTEM STATUS:")
        logger.info("=" * 40)
        logger.info(f"Active Providers: {len(system_status.get('providers', {}))}")
        logger.info(f"Total Recompute Events: {system_status.get('total_recompute_events', 0):,}")
        logger.info(f"Background Tasks Active: {system_status.get('background_tasks_active', False)}")
    
    # Re-entrancy detector status
    re_entrancy = results.get('re_entrancy_detector', {})
    if re_entrancy:
        logger.info("")
        logger.info("RE-ENTRANCY PROTECTION:")
        logger.info("=" * 40)
        logger.info(f"Total Violations: {re_entrancy.get('violation_count', 0)}")
        logger.info(f"Protected Functions: {len(re_entrancy.get('protected_functions', []))}")
        
        if re_entrancy.get('violation_count', 0) > 0:
            logger.warning("⚠️  RE-ENTRANCY VIOLATIONS DETECTED - SYSTEM UNSTABLE")
        else:
            logger.info("✅ No re-entrancy violations detected")
    
    logger.info("")
    logger.info("=" * 60)


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)