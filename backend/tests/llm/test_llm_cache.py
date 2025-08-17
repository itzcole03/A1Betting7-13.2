"""
Test LLM Cache System

Tests the caching behavior for LLM explanations including memory and database layers.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
import asyncio
import time
from datetime import datetime, timezone

from backend.services.llm.llm_cache import LLMCache, ExplanationRecord, CacheStats


@pytest.fixture
def cache():
    """Create cache instance for testing"""
    return LLMCache(max_memory_size=3, ttl_seconds=60)  # Small cache for testing


class TestLLMCache:
    """Test the LLM caching system"""
    
    def test_cache_initialization(self, cache):
        """Test cache initialization"""
        assert cache.max_memory_size == 3
        assert cache.ttl_seconds == 60
        assert len(cache._memory_cache) == 0
        assert cache.stats.hits == 0
        assert cache.stats.misses == 0
        
    def test_cache_key_generation(self, cache):
        """Test cache key generation from edge context"""
        edge_id = 123
        model_version_id = 456
        valuation_hash = "abc123def456"
        prompt_version = "v1"
        
        key1 = cache.generate_cache_key(edge_id, model_version_id, valuation_hash, prompt_version)
        key2 = cache.generate_cache_key(edge_id, model_version_id, "different_hash", prompt_version)
        key3 = cache.generate_cache_key(edge_id, model_version_id, valuation_hash, prompt_version)
        
        # Same inputs should generate same keys
        assert key1 == key3
        # Different inputs should generate different keys
        assert key1 != key2
        # Keys should be hex strings
        assert all(c in '0123456789abcdef' for c in key1)
        
    def test_cache_miss(self, cache):
        """Test cache miss"""
        result = cache.get_cached_explanation("nonexistent_key")
        
        assert result is None
        assert cache.stats.misses == 1
        
    def test_cache_set_and_get(self, cache):
        """Test setting and getting from cache"""
        cache_key = "test_cache_key"
        content = "This is a test explanation"
        provider = "test_provider"
        tokens_used = 150
        
        # Set in cache
        cache.set_cached_explanation(cache_key, content, provider, tokens_used)
        
        # Get from cache
        result = cache.get_cached_explanation(cache_key)
        
        assert result is not None
        assert result.content == content
        assert result.provider == provider
        assert result.tokens_used == tokens_used
        assert cache.stats.hits == 1
        assert cache.stats.sets == 1
        
    def test_cache_eviction(self, cache):
        """Test LRU eviction when cache is full"""
        # Fill cache to max capacity
        for i in range(3):
            cache.set_cached_explanation(f"key_{i}", f"content_{i}", "provider", 100)
            
        # Verify all keys are present
        assert len(cache._memory_cache) == 3
        
        # Add one more item - should evict oldest
        cache.set_cached_explanation("key_3", "content_3", "provider", 100)
        
        # Should still have max size
        assert len(cache._memory_cache) == 3
        # First key should be evicted
        assert cache.get_cached_explanation("key_0") is None
        # Newest key should be present
        assert cache.get_cached_explanation("key_3") is not None
        
    def test_cache_ttl_expiration(self):
        """Test TTL expiration"""
        # Create cache with very short TTL
        cache = LLMCache(max_memory_size=10, ttl_seconds=1)
        
        cache.set_cached_explanation("test_key", "test_content", "provider", 100)
        
        # Should be retrievable immediately
        result = cache.get_cached_explanation("test_key")
        assert result is not None
        
        # Wait for TTL to expire
        time.sleep(1.1)
        
        # Should now be None due to expiration
        result = cache.get_cached_explanation("test_key")
        assert result is None
        
    def test_cache_stats(self, cache):
        """Test cache statistics tracking"""
        # Initial stats
        info = cache.get_cache_info()
        assert info["stats"]["hits"] == 0
        assert info["stats"]["misses"] == 0
        
        # Test cache set
        cache.set_cached_explanation("key1", "content1", "provider", 100)
        
        # Test cache hit
        result = cache.get_cached_explanation("key1")
        assert result is not None
        
        # Test cache miss
        result = cache.get_cached_explanation("nonexistent")
        assert result is None
        
        info = cache.get_cache_info()
        assert info["stats"]["hits"] == 1
        assert info["stats"]["misses"] == 1
        assert info["stats"]["sets"] == 1
        
    def test_cache_clear(self, cache):
        """Test cache clearing"""
        # Add some data
        cache.set_cached_explanation("key1", "content1", "provider", 100)
        cache.set_cached_explanation("key2", "content2", "provider", 150)
        
        assert len(cache._memory_cache) == 2
        
        cache.clear_cache()
        
        assert len(cache._memory_cache) == 0
        
    def test_prune_expired(self):
        """Test pruning expired entries"""
        # Create cache with very short TTL
        cache = LLMCache(max_memory_size=10, ttl_seconds=1)
        
        # Add entries
        cache.set_cached_explanation("key1", "content1", "provider", 100)
        cache.set_cached_explanation("key2", "content2", "provider", 150)
        
        assert len(cache._memory_cache) == 2
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Prune expired
        pruned = cache.prune_expired()
        
        assert pruned == 2
        assert len(cache._memory_cache) == 0
        
    def test_cache_info(self, cache):
        """Test cache information retrieval"""
        info = cache.get_cache_info()
        
        assert "memory_cache_size" in info
        assert "max_memory_size" in info
        assert "ttl_seconds" in info
        assert "stats" in info
        
        assert info["memory_cache_size"] == 0
        assert info["max_memory_size"] == 3
        assert info["ttl_seconds"] == 60
        
        # Verify stats structure
        stats = info["stats"]
        assert "hits" in stats
        assert "misses" in stats
        assert "sets" in stats
        assert "evictions" in stats
        assert "hit_rate" in stats
        
    def test_hit_rate_calculation(self, cache):
        """Test hit rate calculation"""
        # No hits or misses yet
        assert cache.stats.hit_rate == 0.0
        
        # Add cache entry
        cache.set_cached_explanation("key1", "content1", "provider", 100)
        
        # One hit
        cache.get_cached_explanation("key1")
        assert cache.stats.hit_rate == 1.0
        
        # One miss
        cache.get_cached_explanation("nonexistent")
        assert cache.stats.hit_rate == 0.5  # 1 hit out of 2 total
        
        # Another hit
        cache.get_cached_explanation("key1")
        assert abs(cache.stats.hit_rate - 2/3) < 0.01  # 2 hits out of 3 total


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


if __name__ == "__main__":
    pytest.main([__file__, "-v"])