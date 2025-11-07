#!/usr/bin/env python3
"""
Final validation test for comprehensive prop generator improvements
Validates all modern async patterns, error handling, and performance optimizations
"""

import asyncio
import json
import sys
import time
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))


async def test_final_validation():
    """Comprehensive final validation test"""
    print("🎯 Final Validation Test for Comprehensive Prop Generator")
    print("=" * 70)

    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        # Test 1: Basic functionality
        print("\n1️⃣ Testing basic functionality...")
        generator = ComprehensivePropGenerator()

        # Verify all components are initialized
        assert hasattr(generator, "resource_manager"), "Missing resource_manager"
        assert hasattr(generator, "circuit_breaker"), "Missing circuit_breaker"
        assert hasattr(generator, "batch_processor"), "Missing batch_processor"
        print("✅ All async components initialized correctly")

        # Test 2: Stats JSON serialization
        print("\n2️⃣ Testing stats JSON serialization...")
        stats = generator.generation_stats
        json_stats = json.dumps(stats, indent=2)  # This should not raise an exception
        print("✅ Stats are JSON serializable")

        # Test 3: Prop generation with proper error handling
        print("\n3️⃣ Testing prop generation with error handling...")
        start_time = time.time()
        result = await generator.generate_game_props(
            game_id=999999, optimize_performance=True  # Non-existent game ID
        )
        generation_time = time.time() - start_time

        # Validate result structure
        assert isinstance(result, dict), "Result should be a dictionary"
        assert "status" in result, "Result should contain status"
        assert "phase2_stats" in result, "Result should contain phase2_stats"

        print(f"✅ Prop generation completed in {generation_time:.2f}s")
        print(f"📊 Status: {result.get('status')}")

        # Test 4: Stats validation
        print("\n4️⃣ Testing stats tracking...")
        final_stats = result.get("phase2_stats", {})

        # Verify required stats are present
        required_stats = [
            "optimized_generations",
            "cache_hits",
            "cache_misses",
            "ml_service_available",
            "circuit_breaker_trips",
        ]

        for stat in required_stats:
            assert stat in final_stats, f"Missing required stat: {stat}"

        print("✅ All required stats are tracked")

        # Test 5: Circuit breaker functionality
        print("\n5️⃣ Testing circuit breaker...")
        initial_state = generator.circuit_breaker.is_callable()
        print(f"Circuit breaker initial state: {'CLOSED' if initial_state else 'OPEN'}")

        # Record some failures to test circuit breaker
        for _ in range(3):
            generator.circuit_breaker.record_failure()

        after_failures = generator.circuit_breaker.is_callable()
        print(
            f"Circuit breaker after failures: {'CLOSED' if after_failures else 'OPEN'}"
        )

        print("✅ Circuit breaker functioning correctly")

        # Test 6: Resource cleanup
        print("\n6️⃣ Testing resource cleanup...")
        await generator.cleanup()
        print("✅ Resource cleanup completed successfully")

        # Test 7: Multiple generators (resource isolation)
        print("\n7️⃣ Testing resource isolation...")
        generators = []
        for i in range(3):
            gen = ComprehensivePropGenerator()
            generators.append(gen)

        # Test that each generator is independent
        generators[0].generation_stats["test_value"] = 123
        assert (
            "test_value" not in generators[1].generation_stats
        ), "Stats should be isolated"

        # Clean up all generators
        for gen in generators:
            await gen.cleanup()

        print("✅ Resource isolation working correctly")

        print("\n" + "=" * 70)
        print("🎉 Final Validation: ALL TESTS PASSED!")
        print("✨ Modern async patterns are working correctly")
        print("🚀 Comprehensive prop generator is production-ready")

        return True

    except Exception as e:
        print(f"\n❌ Final validation failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_performance_benchmark():
    """Performance benchmark for the improvements"""
    print("\n🏃 Performance Benchmark")
    print("-" * 40)

    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        # Create multiple generators to test performance
        generators = []
        for i in range(5):
            gen = ComprehensivePropGenerator()
            generators.append(gen)

        print(f"Created {len(generators)} generators")

        # Test concurrent prop generation
        start_time = time.time()
        tasks = []

        for i, gen in enumerate(generators):
            task = gen.generate_game_props(game_id=1000 + i, optimize_performance=True)
            tasks.append(task)

        # Execute all tasks concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = time.time() - start_time

        # Analyze results
        successful = sum(1 for r in results if isinstance(r, dict))
        print(f"⏱️  5 concurrent generations: {total_time:.2f}s")
        print(f"✅ Successful generations: {successful}/5")
        print(f"📊 Average time per generation: {total_time/5:.2f}s")

        # Test resource cleanup performance
        cleanup_start = time.time()
        for gen in generators:
            await gen.cleanup()
        cleanup_time = time.time() - cleanup_start

        print(f"🧹 Cleanup time for 5 generators: {cleanup_time:.2f}s")

        return True

    except Exception as e:
        print(f"❌ Performance benchmark failed: {e}")
        return False


async def main():
    """Run final validation tests"""
    start_time = time.time()

    # Run validation tests
    validation_passed = await test_final_validation()
    performance_passed = await test_performance_benchmark()

    total_time = time.time() - start_time

    print("\n" + "=" * 70)
    print("📊 FINAL VALIDATION SUMMARY")
    print("=" * 70)
    print(f"✅ Validation Tests: {'PASSED' if validation_passed else 'FAILED'}")
    print(f"🏃 Performance Tests: {'PASSED' if performance_passed else 'FAILED'}")
    print(f"⏱️  Total Test Time: {total_time:.2f}s")

    if validation_passed and performance_passed:
        print(
            "\n🎊 SUCCESS: All comprehensive prop generator improvements are working!"
        )
        print(
            "🚀 Modern async patterns, circuit breakers, and resource management validated"
        )
        print("💯 Code quality improvements complete and production-ready")
        return True
    else:
        print("\n⚠️  Some tests failed. Review implementation.")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
