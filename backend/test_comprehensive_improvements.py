#!/usr/bin/env python3
"""
Test script for comprehensive prop generator improvements
Tests modern async patterns, error handling, and type safety
"""

import asyncio
import sys
import time
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))


async def test_comprehensive_generator_imports():
    """Test that the comprehensive generator imports correctly"""
    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        print("✅ ComprehensivePropGenerator imports successfully")
        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False


async def test_async_resource_manager():
    """Test the AsyncResourceManager functionality"""
    try:
        from backend.services.comprehensive_prop_generator import AsyncResourceManager

        manager = AsyncResourceManager()

        # Test context manager
        async with manager.get_session() as session:
            print("✅ AsyncResourceManager session context works")

        # Test cleanup
        await manager.cleanup()
        print("✅ AsyncResourceManager cleanup works")
        return True
    except Exception as e:
        print(f"❌ AsyncResourceManager test failed: {e}")
        return False


async def test_circuit_breaker():
    """Test the CircuitBreaker functionality"""
    try:
        from backend.services.comprehensive_prop_generator import CircuitBreaker

        breaker = CircuitBreaker(failure_threshold=2, recovery_timeout=1.0)

        # Test initial state
        assert breaker.is_callable(), "Circuit breaker should be callable initially"
        print("✅ Circuit breaker initial state works")

        # Test failure recording
        breaker.record_failure()
        breaker.record_failure()
        assert (
            not breaker.is_callable()
        ), "Circuit breaker should be open after failures"
        print("✅ Circuit breaker failure handling works")

        # Test recovery
        await asyncio.sleep(1.1)  # Wait for recovery timeout
        breaker.record_success()
        assert breaker.is_callable(), "Circuit breaker should recover after timeout"
        print("✅ Circuit breaker recovery works")

        return True
    except Exception as e:
        print(f"❌ CircuitBreaker test failed: {e}")
        return False


async def test_batch_processor():
    """Test the AsyncBatchProcessor functionality"""
    try:
        from backend.services.comprehensive_prop_generator import AsyncBatchProcessor

        processor = AsyncBatchProcessor(batch_size=5, timeout=10.0)

        # Test batch context
        async with processor.batch_context() as batch:
            # Add a simple task
            task = batch.add_task(asyncio.sleep(0.1), timeout=5.0)
            results = await batch.execute_single(task)
            assert results is None, "Sleep task should return None"

        print("✅ AsyncBatchProcessor works")
        return True
    except Exception as e:
        print(f"❌ AsyncBatchProcessor test failed: {e}")
        return False


async def test_comprehensive_generator_init():
    """Test ComprehensivePropGenerator initialization"""
    try:
        from backend.services.comprehensive_prop_generator import (
            ComprehensivePropGenerator,
        )

        generator = ComprehensivePropGenerator()

        # Test that it has the expected attributes
        assert hasattr(generator, "resource_manager"), "Should have resource_manager"
        assert hasattr(generator, "circuit_breaker"), "Should have circuit_breaker"
        assert hasattr(generator, "batch_processor"), "Should have batch_processor"
        assert hasattr(generator, "generation_stats"), "Should have generation_stats"

        # Test cleanup
        await generator.cleanup()

        print("✅ ComprehensivePropGenerator initialization works")
        return True
    except Exception as e:
        print(f"❌ ComprehensivePropGenerator initialization failed: {e}")
        return False


async def main():
    """Run all tests"""
    print("🧪 Testing Comprehensive Prop Generator Improvements")
    print("=" * 60)

    start_time = time.time()

    tests = [
        test_comprehensive_generator_imports,
        test_async_resource_manager,
        test_circuit_breaker,
        test_batch_processor,
        test_comprehensive_generator_init,
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        print(f"\n📋 Running {test.__name__}...")
        try:
            result = await test()
            if result:
                passed += 1
        except Exception as e:
            print(f"❌ {test.__name__} failed with exception: {e}")

    elapsed = time.time() - start_time

    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    print(f"⏱️  Total time: {elapsed:.2f}s")

    if passed == total:
        print("🎉 All tests passed! Modern async patterns working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Check the implementation.")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
