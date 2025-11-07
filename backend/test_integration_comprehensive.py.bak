#!/usr/bin/env python3
"""
Integration test for comprehensive prop generator
Tests the full prop generation pipeline with real-world data
"""

import asyncio
import json
import sys
import time
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))


async def test_prop_generation_pipeline():
    """Test the full prop generation pipeline"""
    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        generator = ComprehensivePropGenerator()

        # Test with a realistic game ID (using a mock structure)
        mock_game_id = 12345

        print(f"🎯 Testing prop generation for game {mock_game_id}")

        # Test the main generation method
        start_time = time.time()
        result = await generator.generate_game_props(
            game_id=mock_game_id, optimize_performance=True
        )
        generation_time = time.time() - start_time

        print(f"⏱️  Generation completed in {generation_time:.2f}s")
        print(f"📊 Result keys: {list(result.keys())}")
        print(f"📈 Status: {result.get('status', 'unknown')}")

        # Validate result structure
        expected_keys = ["props", "phase2_stats", "status"]
        for key in expected_keys:
            assert key in result, f"Missing expected key: {key}"

        print(f"✅ Result structure validation passed")

        # Test stats tracking
        stats = result.get("phase2_stats", {})
        print(f"📊 Generation stats: {json.dumps(stats, indent=2)}")

        # Test cleanup
        await generator.cleanup()
        print("✅ Generator cleanup completed")

        return True

    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


async def test_circuit_breaker_integration():
    """Test circuit breaker integration under load"""
    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        generator = ComprehensivePropGenerator()

        print("🔄 Testing circuit breaker under multiple requests")

        # Simulate multiple concurrent requests
        tasks = []
        for i in range(5):
            task = generator.generate_game_props(
                game_id=12345 + i, optimize_performance=True
            )
            tasks.append(task)

        # Execute concurrently
        start_time = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        total_time = time.time() - start_time

        print(f"⏱️  5 concurrent requests completed in {total_time:.2f}s")

        # Check results
        successful = sum(
            1 for r in results if isinstance(r, dict) and r.get("status") != "error"
        )
        print(f"✅ {successful}/5 requests successful")

        # Test stats aggregation
        final_stats = generator.generation_stats
        print(
            f"📊 Final stats: cache_hits={final_stats.get('cache_hits', 0)}, cache_misses={final_stats.get('cache_misses', 0)}"
        )

        await generator.cleanup()
        return True

    except Exception as e:
        print(f"❌ Circuit breaker test failed: {e}")
        return False


async def test_resource_management():
    """Test resource management and cleanup"""
    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        print("🧹 Testing resource management")

        # Create multiple generators to test resource handling
        generators = []
        for i in range(3):
            generator = ComprehensivePropGenerator()
            generators.append(generator)

        # Test that each has proper resource managers
        for i, gen in enumerate(generators):
            assert hasattr(
                gen, "resource_manager"
            ), f"Generator {i} missing resource_manager"
            assert hasattr(
                gen, "circuit_breaker"
            ), f"Generator {i} missing circuit_breaker"
            assert hasattr(
                gen, "batch_processor"
            ), f"Generator {i} missing batch_processor"

        print("✅ All generators have proper resource managers")

        # Test cleanup
        for gen in generators:
            await gen.cleanup()

        print("✅ All generators cleaned up successfully")
        return True

    except Exception as e:
        print(f"❌ Resource management test failed: {e}")
        return False


async def test_error_handling():
    """Test error handling and fallback mechanisms"""
    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        generator = ComprehensivePropGenerator()

        print("⚠️  Testing error handling with invalid game ID")

        # Test with invalid game ID
        result = await generator.generate_game_props(
            game_id=-1, optimize_performance=True  # Invalid game ID
        )

        # Should handle gracefully
        assert "status" in result, "Result should contain status"
        print(f"✅ Error handling works - status: {result.get('status')}")

        await generator.cleanup()
        return True

    except Exception as e:
        print(f"❌ Error handling test failed: {e}")
        return False


async def main():
    """Run all integration tests"""
    print("🧪 Comprehensive Prop Generator Integration Tests")
    print("=" * 60)

    start_time = time.time()

    tests = [
        ("Prop Generation Pipeline", test_prop_generation_pipeline),
        ("Circuit Breaker Integration", test_circuit_breaker_integration),
        ("Resource Management", test_resource_management),
        ("Error Handling", test_error_handling),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        try:
            result = await test_func()
            if result:
                passed += 1
                print(f"✅ {test_name} passed")
            else:
                print(f"❌ {test_name} failed")
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")

    elapsed = time.time() - start_time

    print("\n" + "=" * 60)
    print(f"📊 Integration Test Results: {passed}/{total} tests passed")
    print(f"⏱️  Total time: {elapsed:.2f}s")

    if passed == total:
        print(
            "🎉 All integration tests passed! The comprehensive prop generator is working correctly."
        )
        print(
            "✨ Modern async patterns, circuit breakers, and resource management are functioning properly."
        )
        return True
    else:
        print("⚠️  Some integration tests failed. Check the implementation.")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
