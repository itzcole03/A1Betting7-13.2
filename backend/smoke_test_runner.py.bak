"""
Smoke Test Runner

Provides command-line interface to run comprehensive smoke tests
for the A1Betting backend system.
"""

import asyncio
import argparse
import json
import sys
from pathlib import Path

# Add backend to Python path for imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from tests.smoke import run_websocket_envelope_smoke_tests


async def run_all_smoke_tests():
    """Run all available smoke tests"""
    print("🔥 A1BETTING COMPREHENSIVE SMOKE TESTS")
    print("=" * 50)
    
    all_results = {}
    
    # WebSocket Envelope Compliance Tests
    print("\n📡 WEBSOCKET ENVELOPE COMPLIANCE TESTS")
    print("-" * 40)
    websocket_results = await run_websocket_envelope_smoke_tests()
    all_results['websocket_envelope'] = websocket_results
    
    # Additional smoke tests can be added here
    # API Health Tests, Database Connection Tests, etc.
    
    # Generate summary report
    print("\n" + "=" * 50)
    print("📋 OVERALL SMOKE TEST SUMMARY")
    print("=" * 50)
    
    total_success_rate = 0
    total_test_suites = 0
    
    for test_suite, results in all_results.items():
        suite_rate = results['summary']['success_rate']
        total_success_rate += suite_rate
        total_test_suites += 1
        
        status = "✅ PASS" if suite_rate >= 80 else "⚠️ WARN" if suite_rate >= 50 else "❌ FAIL"
        print(f"{test_suite}: {status} ({suite_rate:.1f}%)")
    
    overall_rate = total_success_rate / total_test_suites if total_test_suites > 0 else 0
    overall_status = "✅ PASS" if overall_rate >= 80 else "⚠️ WARN" if overall_rate >= 50 else "❌ FAIL"
    
    print(f"\nOverall: {overall_status} ({overall_rate:.1f}%)")
    
    return all_results, overall_rate >= 80


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(description="A1Betting Smoke Test Runner")
    parser.add_argument(
        '--output', 
        type=str, 
        help="Output file for detailed JSON results"
    )
    parser.add_argument(
        '--websocket-only',
        action='store_true',
        help="Run only WebSocket envelope compliance tests"
    )
    parser.add_argument(
        '--base-url',
        type=str,
        default="ws://localhost:8000",
        help="Base WebSocket URL for testing (default: ws://localhost:8000)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.websocket_only:
            # Run only WebSocket tests
            results = asyncio.run(run_websocket_envelope_smoke_tests())
            success = results['summary']['success_rate'] >= 80
        else:
            # Run all smoke tests
            results, success = asyncio.run(run_all_smoke_tests())
        
        # Save detailed results if requested
        if args.output:
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            
            print(f"\n📄 Detailed results saved to: {output_path}")
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️ Smoke tests interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Smoke tests failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
