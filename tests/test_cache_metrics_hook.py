"""
Tests for Cache Metrics Integration - Hook validation and performance verification
Comprehensive test coverage for cache operation tracking and metrics integration.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import asyncio
import time
from typing import Optional, Dict, Any

# Import cache metrics components
from backend.services.metrics.cache_metrics_hook import (
    CacheMetricsHook,
    get_cache_hook,
    auto_hook_unified_cache_service,
    auto_hook_intelligent_cache_service,
    initialize_cache_metrics_hooks
)


class MockCacheService:
    """Mock cache service for testing."""
    
    def __init__(self):
        self.data: Dict[str, Any] = {}
        self.get_count = 0
        self.set_count = 0
        self.delete_count = 0
        self.hit_count = 0
        self.miss_count = 0
    
    def get(self, key: str, default=None):
        """Mock get operation."""
        self.get_count += 1
        if key in self.data:
            self.hit_count += 1
            return self.data[key]
        else:
            self.miss_count += 1
            return default
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Mock set operation."""
        self.set_count += 1
        self.data[key] = value
    
    def delete(self, key: str):
        """Mock delete operation."""
        self.delete_count += 1
        if key in self.data:
            del self.data[key]
            return True
        return False


class MockAsyncCacheService:
    """Mock async cache service for testing."""
    
    def __init__(self):
        self.data: Dict[str, Any] = {}
        self.get_count = 0
        self.set_count = 0
        self.delete_count = 0
        self.hit_count = 0
        self.miss_count = 0
    
    async def get(self, key: str, default=None):
        """Mock async get operation."""
        self.get_count += 1
        await asyncio.sleep(0.001)  # Simulate async operation
        if key in self.data:
            self.hit_count += 1
            return self.data[key]
        else:
            self.miss_count += 1
            return default
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Mock async set operation."""
        self.set_count += 1
        await asyncio.sleep(0.001)  # Simulate async operation
        self.data[key] = value
    
    async def delete(self, key: str):
        """Mock async delete operation."""
        self.delete_count += 1
        await asyncio.sleep(0.001)  # Simulate async operation
        if key in self.data:
            del self.data[key]
            return True
        return False


class TestCacheMetricsHook:
    """Test suite for cache metrics hook functionality."""
    
    def setup_method(self):
        """Setup for each test method."""
        from backend.services.metrics.unified_metrics_collector import get_metrics_collector
        self.metrics_collector = get_metrics_collector()
        self.metrics_collector.reset_metrics()
        
        self.mock_cache = MockCacheService()
        self.mock_async_cache = MockAsyncCacheService()
        self.hook = CacheMetricsHook()
    
    def test_cache_metrics_hook_initialization(self):
        """Test cache metrics hook initialization."""
        assert self.hook.metrics_collector is not None
        assert hasattr(self.hook, 'wrap_cache_get')
        assert hasattr(self.hook, 'wrap_cache_set')
        assert hasattr(self.hook, 'wrap_cache_delete')
        assert hasattr(self.hook, 'hook_cache_service')
    
    def test_wrap_sync_cache_get_hit(self):
        """Test wrapping sync cache get operation with hit."""
        # Setup cache with data
        self.mock_cache.set("test_key", "test_value")
        
        # Wrap the get method
        original_get = self.mock_cache.get
        wrapped_get = self.hook.wrap_cache_get(original_get)
        
        # Perform get operation
        result = wrapped_get("test_key")
        
        assert result == "test_value"
        
        # Check metrics were recorded - global cache metrics
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["hits"] >= 1
        assert cache_metrics["misses"] >= 0
    
    def test_wrap_sync_cache_get_miss(self):
        """Test wrapping sync cache get operation with miss."""
        # Wrap the get method
        original_get = self.mock_cache.get
        wrapped_get = self.hook.wrap_cache_get(original_get)
        
        # Perform get operation on non-existent key
        result = wrapped_get("nonexistent_key", "default_value")
        
        assert result == "default_value"
        
        # Check metrics were recorded
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["misses"] >= 1
    
    @pytest.mark.asyncio
    async def test_wrap_async_cache_get_hit(self):
        """Test wrapping async cache get operation with hit."""
        # Setup cache with data
        await self.mock_async_cache.set("async_key", "async_value")
        
        # Wrap the get method
        original_get = self.mock_async_cache.get
        wrapped_get = self.hook.wrap_cache_get(original_get)
        
        # Perform get operation
        result = await wrapped_get("async_key")
        
        assert result == "async_value"
        
        # Check metrics were recorded
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["hits"] >= 1
        assert cache_metrics["misses"] >= 0
    
    def test_wrap_sync_cache_set(self):
        """Test wrapping sync cache set operation."""
        # Wrap the set method
        original_set = self.mock_cache.set
        wrapped_set = self.hook.wrap_cache_set(original_set)
        
        # Perform set operation
        wrapped_set("new_key", "new_value")
        
        # Verify data was set
        assert self.mock_cache.get("new_key") == "new_value"
        
        # Note: current implementation doesn't record set metrics
        # This test verifies the wrapper doesn't break functionality
    
    @pytest.mark.asyncio
    async def test_wrap_async_cache_set(self):
        """Test wrapping async cache set operation."""
        # Wrap the set method
        original_set = self.mock_async_cache.set
        wrapped_set = self.hook.wrap_cache_set(original_set)
        
        # Perform set operation
        await wrapped_set("async_new_key", "async_new_value")
        
        # Verify data was set
        result = await self.mock_async_cache.get("async_new_key")
        assert result == "async_new_value"
    
    def test_wrap_sync_cache_delete(self):
        """Test wrapping sync cache delete operation."""
        # Setup cache with data
        self.mock_cache.set("delete_key", "delete_value")
        
        # Wrap the delete method
        original_delete = self.mock_cache.delete
        wrapped_delete = self.hook.wrap_cache_delete(original_delete)
        
        # Perform delete operation
        result = wrapped_delete("delete_key")
        
        assert result is True  # Key existed and was deleted
        assert self.mock_cache.get("delete_key") is None
        
        # Check that eviction was recorded
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["evictions"] >= 1
    
    @pytest.mark.asyncio
    async def test_wrap_async_cache_delete(self):
        """Test wrapping async cache delete operation."""
        # Setup cache with data
        await self.mock_async_cache.set("async_delete_key", "async_delete_value")
        
        # Wrap the delete method
        original_delete = self.mock_async_cache.delete
        wrapped_delete = self.hook.wrap_cache_delete(original_delete)
        
        # Perform delete operation
        result = await wrapped_delete("async_delete_key")
        
        assert result is True  # Key existed and was deleted
        
        # Check that eviction was recorded
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["evictions"] >= 1
    
    def test_cache_hit_rate_calculation(self):
        """Test cache hit rate calculation with mixed operations."""
        # Wrap cache operations
        original_get = self.mock_cache.get
        wrapped_get = self.hook.wrap_cache_get(original_get)
        
        # Setup some data
        self.mock_cache.set("key1", "value1")
        self.mock_cache.set("key2", "value2")
        
        # Reset metrics to have clean slate
        self.metrics_collector.reset_metrics()
        
        # Perform mixed operations: hits and misses
        wrapped_get("key1")      # Hit
        wrapped_get("key2")      # Hit  
        wrapped_get("key3")      # Miss
        wrapped_get("key1")      # Hit
        wrapped_get("key4")      # Miss
        
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["hits"] == 3
        assert cache_metrics["misses"] == 2
        
        # Calculate hit rate manually to verify
        total_operations = cache_metrics["hits"] + cache_metrics["misses"]
        expected_hit_rate = cache_metrics["hits"] / total_operations if total_operations > 0 else 0.0
        assert abs(expected_hit_rate - 0.6) < 0.001  # 60% hit rate
    
    def test_hook_cache_service_sync(self):
        """Test hooking a complete cache service instance."""
        # Hook the entire cache service
        success = self.hook.hook_cache_service(self.mock_cache)
        assert success is True
        
        # Setup test data
        self.mock_cache.set("hook_key", "hook_value")
        
        # Reset metrics
        self.metrics_collector.reset_metrics()
        
        # Use the hooked service
        result = self.mock_cache.get("hook_key")        # Should be a hit
        self.mock_cache.get("missing_key", "default")   # Should be a miss
        self.mock_cache.delete("hook_key")              # Should record eviction
        
        assert result == "hook_value"
        
        # Verify metrics were recorded automatically
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["hits"] >= 1
        assert cache_metrics["misses"] >= 1
        assert cache_metrics["evictions"] >= 1
    
    @pytest.mark.asyncio
    async def test_hook_cache_service_async(self):
        """Test hooking an async cache service instance."""
        # Hook the entire cache service
        success = self.hook.hook_cache_service(self.mock_async_cache)
        assert success is True
        
        # Setup test data
        await self.mock_async_cache.set("async_hook_key", "async_hook_value")
        
        # Reset metrics
        self.metrics_collector.reset_metrics()
        
        # Use the hooked service
        result = await self.mock_async_cache.get("async_hook_key")    # Hit
        await self.mock_async_cache.get("async_missing", "default")  # Miss
        await self.mock_async_cache.delete("async_hook_key")         # Eviction
        
        assert result == "async_hook_value"
        
        # Verify metrics were recorded automatically
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["hits"] >= 1
        assert cache_metrics["misses"] >= 1
        assert cache_metrics["evictions"] >= 1
    
    def test_cache_operation_exception_handling(self):
        """Test cache metrics recording when cache operations raise exceptions."""
        
        def failing_cache_get(key: str, default=None):
            if key == "error_key":
                raise Exception("Cache operation failed")
            return self.mock_cache.get(key, default)
        
        wrapped_get = self.hook.wrap_cache_get(failing_cache_get)
        
        # Reset metrics
        self.metrics_collector.reset_metrics()
        
        # Test successful operation first
        result = wrapped_get("normal_key", "default_value")
        assert result == "default_value"  # Miss, returns default
        
        # Test failing operation
        with pytest.raises(Exception, match="Cache operation failed"):
            wrapped_get("error_key")
        
        # Verify that both operations were recorded (including exception as miss)
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["misses"] >= 2  # Both normal miss and exception
    
    @patch('backend.services.metrics.cache_metrics_hook.unified_cache_service')
    def test_auto_hook_unified_cache_success(self, mock_unified_cache):
        """Test successful auto-hooking of unified cache service."""
        # Mock the unified cache service
        mock_cache_instance = Mock()
        mock_cache_instance.get = Mock(return_value="cached_value")
        mock_cache_instance.set = Mock()
        mock_cache_instance.delete = Mock(return_value=True)
        
        # Mock the service import to return our mock
        mock_unified_cache.return_value = mock_cache_instance
        
        # Call auto-hook function
        result = auto_hook_unified_cache_service()
        
        assert result is True  # Should succeed
        
        # Note: We can't easily verify method wrapping without complex mock introspection
        # The test verifies the function completes successfully
    
    @patch('backend.services.metrics.cache_metrics_hook.unified_cache_service', None)
    def test_auto_hook_unified_cache_not_available(self):
        """Test auto-hooking when unified cache service is not available."""
        with patch('backend.services.metrics.cache_metrics_hook.unified_cache_service', side_effect=ImportError):
            result = auto_hook_unified_cache_service()
            assert result is False  # Should fail gracefully
    
    @patch('backend.services.metrics.cache_metrics_hook.intelligent_cache_service')  
    def test_auto_hook_intelligent_cache_success(self, mock_intelligent_cache):
        """Test successful auto-hooking of intelligent cache service."""
        # Mock the intelligent cache service
        mock_cache_instance = Mock()
        mock_cache_instance.get = Mock(return_value="intelligent_cached_value")
        mock_cache_instance.set = Mock()
        mock_cache_instance.delete = Mock(return_value=True)
        
        mock_intelligent_cache.return_value = mock_cache_instance
        
        # Call auto-hook function
        result = auto_hook_intelligent_cache_service()
        
        assert result is True  # Should succeed
    
    @patch('backend.services.metrics.cache_metrics_hook.intelligent_cache_service', None)
    def test_auto_hook_intelligent_cache_not_available(self):
        """Test auto-hooking when intelligent cache service is not available."""
        with patch('backend.services.metrics.cache_metrics_hook.intelligent_cache_service', side_effect=ImportError):
            result = auto_hook_intelligent_cache_service()
            assert result is False  # Should fail gracefully
    
    def test_initialize_cache_metrics_hooks(self):
        """Test the initialize function that hooks all available services."""
        with patch('backend.services.metrics.cache_metrics_hook.auto_hook_unified_cache_service', return_value=True), \
             patch('backend.services.metrics.cache_metrics_hook.auto_hook_intelligent_cache_service', return_value=False):
            
            results = initialize_cache_metrics_hooks()
            
            assert isinstance(results, dict)
            assert "unified_cache_service" in results
            assert "intelligent_cache_service" in results
            assert results["unified_cache_service"] is True
            assert results["intelligent_cache_service"] is False
    
    def test_get_cache_hook_singleton(self):
        """Test that get_cache_hook returns a singleton instance."""
        hook1 = get_cache_hook()
        hook2 = get_cache_hook()
        
        assert hook1 is hook2  # Same instance
        assert isinstance(hook1, CacheMetricsHook)
    
    def test_cache_hook_unhook_all(self):
        """Test unhooking all hooked methods."""
        # Hook the cache service
        original_get = self.mock_cache.get
        success = self.hook.hook_cache_service(self.mock_cache)
        assert success is True
        
        # Verify method was wrapped (wrapped methods have different identity)
        assert self.mock_cache.get != original_get
        
        # Unhook all methods
        self.hook.unhook_all()
        
        # Verify method was restored
        assert self.mock_cache.get == original_get
    
    @pytest.mark.asyncio
    async def test_mixed_sync_async_cache_operations(self):
        """Test metrics collection with mixed sync and async cache operations."""
        # Hook both cache services
        self.hook.hook_cache_service(self.mock_cache)
        self.hook.hook_cache_service(self.mock_async_cache)
        
        # Setup data
        self.mock_cache.set("sync_key", "sync_value")
        await self.mock_async_cache.set("async_key", "async_value")
        
        # Reset metrics
        self.metrics_collector.reset_metrics()
        
        # Perform mixed operations
        sync_result = self.mock_cache.get("sync_key")           # Sync hit
        async_result = await self.mock_async_cache.get("async_key")  # Async hit
        sync_miss = self.mock_cache.get("missing_sync")         # Sync miss
        async_miss = await self.mock_async_cache.get("missing_async")# Async miss
        
        # Verify results
        assert sync_result == "sync_value"
        assert async_result == "async_value"
        assert sync_miss is None
        assert async_miss is None
        
        # Verify metrics are tracked (global counters)
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        
        assert cache_metrics["hits"] == 2  # 2 hits total
        assert cache_metrics["misses"] == 2  # 2 misses total
    
    def test_cache_hook_performance_overhead(self):
        """Test that cache hook adds minimal performance overhead."""
        import time
        
        # Baseline: direct cache operations
        start_time = time.time()
        for i in range(1000):
            self.mock_cache.set(f"perf_key_{i}", f"perf_value_{i}")
            self.mock_cache.get(f"perf_key_{i}")
        baseline_time = time.time() - start_time
        
        # Reset cache for fair comparison
        self.mock_cache = MockCacheService()
        
        # Hook the cache service
        self.hook.hook_cache_service(self.mock_cache)
        
        start_time = time.time()
        for i in range(1000):
            self.mock_cache.set(f"perf_key_{i}", f"perf_value_{i}")
            self.mock_cache.get(f"perf_key_{i}")
        wrapped_time = time.time() - start_time
        
        # Overhead should be minimal (less than 100% increase)
        overhead_ratio = wrapped_time / baseline_time if baseline_time > 0 else 1.0
        assert overhead_ratio < 2.0  # Less than 100% overhead
        
        # Verify metrics were collected
        snapshot = self.metrics_collector.snapshot()
        assert "cache" in snapshot
        assert snapshot["cache"]["hits"] >= 1000  # All gets should be hits
    
    def test_cache_service_with_no_hookable_methods(self):
        """Test hook behavior with cache service that has no hookable methods."""
        # Create mock service without standard cache methods
        mock_service = Mock()
        mock_service.custom_method = Mock()
        
        # Try to hook it
        success = self.hook.hook_cache_service(mock_service)
        
        # Should fail gracefully
        assert success is False
    
    def test_cache_service_partial_hook_success(self):
        """Test hook behavior when only some methods are available."""
        # Create mock service with only get method
        mock_service = Mock()
        mock_service.get = Mock(return_value="test_value")
        
        # Hook should succeed for available methods
        success = self.hook.hook_cache_service(mock_service)
        assert success is True  # Should succeed for partial hooks
        
        # Reset metrics
        self.metrics_collector.reset_metrics()
        
        # Use the available hooked method
        result = mock_service.get("test_key")
        assert result == "test_value"
        
        # Verify metrics were recorded
        snapshot = self.metrics_collector.snapshot()
        cache_metrics = snapshot["cache"]
        assert cache_metrics["hits"] >= 1