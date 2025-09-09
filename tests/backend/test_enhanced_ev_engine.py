"""
Comprehensive test suite for Enhanced EV Engine hardening features

Tests cover:
- Enhanced EV calculations with caching and metrics
- Feature flag management and A/B testing
- Batch processing optimization
- Cache invalidation and TTL behavior
- Metrics collection and distribution analysis
- Error handling and validation
- Performance monitoring
"""

import pytest
import asyncio
import time
from unittest.mock import patch, MagicMock
from typing import Dict, Any

from backend.services.enhanced_ev_engine import (
    enhanced_ev_engine, 
    EnhancedEVEngine, 
    FeatureFlag, 
    EVMetrics, 
    CacheEntry,
    EVDistribution
)
from backend.services.ev_engine import EVTier


@pytest.fixture
def fresh_ev_engine():
    """Create a fresh EV engine instance for testing"""
    engine = EnhancedEVEngine()
    # Reset to known state
    engine.reset_metrics()
    engine.invalidate_cache()
    
    # Enable all features for testing
    for flag in FeatureFlag:
        engine.set_feature_flag(flag, True)
    
    return engine


@pytest.fixture
def sample_opportunities():
    """Sample betting opportunities for batch testing"""
    return [
        {"id": "opp1", "fair_odds": 2.0, "market_odds": 2.2, "sport": "NBA"},
        {"id": "opp2", "fair_odds": 1.8, "market_odds": 1.9, "sport": "NFL"},
        {"id": "opp3", "fair_odds": 3.0, "market_odds": 2.8, "sport": "MLB"},
        {"id": "opp4", "fair_odds": 1.5, "market_odds": 1.6, "sport": "NHL"},
        {"id": "opp5", "fair_odds": 4.0, "market_odds": 5.0, "sport": "Soccer"}
    ]


class TestEnhancedEVEngine:
    """Test enhanced EV engine core functionality"""
    
    @pytest.mark.asyncio
    async def test_basic_ev_calculation(self, fresh_ev_engine):
        """Test basic enhanced EV calculation"""
        result = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        
        assert result["ev_percent"] > 0  # Should be positive EV
        assert result["tier"] in [tier.value for tier in EVTier]
        assert "calculation_time_ms" in result
        assert result["cache_hit"] is False  # First calculation
        assert "timestamp" in result
    
    @pytest.mark.asyncio
    async def test_caching_functionality(self, fresh_ev_engine):
        """Test caching behavior and cache hits"""
        # First calculation - should miss cache
        result1 = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        assert result1["cache_hit"] is False
        
        # Second calculation - should hit cache
        result2 = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        assert result2["cache_hit"] is True
        assert result2["ev_percent"] == result1["ev_percent"]
    
    @pytest.mark.asyncio
    async def test_cache_ttl_expiration(self, fresh_ev_engine):
        """Test cache TTL expiration behavior"""
        # Set very short TTL for testing
        fresh_ev_engine.cache_ttl = 0.1  # 100ms
        
        # First calculation
        result1 = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        assert result1["cache_hit"] is False
        
        # Wait for cache to expire
        await asyncio.sleep(0.2)
        
        # Second calculation should miss cache due to expiration
        result2 = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        assert result2["cache_hit"] is False
    
    @pytest.mark.asyncio
    async def test_feature_flag_management(self, fresh_ev_engine):
        """Test feature flag enable/disable functionality"""
        # Disable caching
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_CACHING, False)
        assert not fresh_ev_engine.is_feature_enabled(FeatureFlag.ENABLE_CACHING)
        
        # All calculations should miss cache when disabled
        result1 = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        result2 = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        
        assert result1["cache_hit"] is False
        assert result2["cache_hit"] is False
        
        # Re-enable caching
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_CACHING, True)
        assert fresh_ev_engine.is_feature_enabled(FeatureFlag.ENABLE_CACHING)
    
    @pytest.mark.asyncio
    async def test_advanced_validation(self, fresh_ev_engine):
        """Test advanced input validation"""
        # Test invalid odds
        result = await fresh_ev_engine.compute_ev_enhanced(0.5, 2.0)  # Invalid fair odds
        assert "error" in result
        assert result["ev_percent"] == 0.0
        
        # Test None values
        result = await fresh_ev_engine.compute_ev_enhanced(None, 2.0)
        assert "error" in result
        
        # Test extreme disparities
        result = await fresh_ev_engine.compute_ev_enhanced(1.1, 50.0)  # Extreme ratio
        assert "error" in result
    
    @pytest.mark.asyncio
    async def test_metrics_collection(self, fresh_ev_engine):
        """Test comprehensive metrics collection"""
        # Perform several calculations
        for i in range(5):
            await fresh_ev_engine.compute_ev_enhanced(2.0 + i * 0.1, 2.2 + i * 0.1)
        
        metrics = fresh_ev_engine.get_metrics_summary()
        
        assert metrics["total_calculations"] == 5
        assert metrics["cache_hit_rate"] >= 0  # Should be between 0 and 1
        assert "average_calculation_time_ms" in metrics
        assert "tier_distribution" in metrics
        assert "feature_flags" in metrics
    
    @pytest.mark.asyncio
    async def test_batch_processing(self, fresh_ev_engine, sample_opportunities):
        """Test batch EV processing with optimization"""
        results = await fresh_ev_engine.batch_compute_ev(sample_opportunities)
        
        assert len(results) == len(sample_opportunities)
        
        # Check that all results have EV data
        for result in results:
            assert "ev_percent" in result
            assert "tier" in result
            assert "id" in result  # Original data preserved
    
    @pytest.mark.asyncio
    async def test_batch_optimization_flag(self, fresh_ev_engine, sample_opportunities):
        """Test batch optimization feature flag"""
        # Disable batch optimization
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_BATCH_OPTIMIZATION, False)
        
        start_time = time.time()
        results = await fresh_ev_engine.batch_compute_ev(sample_opportunities)
        time_without_optimization = time.time() - start_time
        
        # Enable batch optimization
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_BATCH_OPTIMIZATION, True)
        
        start_time = time.time()
        results_optimized = await fresh_ev_engine.batch_compute_ev(sample_opportunities)
        time_with_optimization = time.time() - start_time
        
        assert len(results) == len(results_optimized)
        # Optimization should generally be faster for larger batches
        # Note: For small batches, overhead might make it slower
    
    @pytest.mark.asyncio
    async def test_cache_eviction(self, fresh_ev_engine):
        """Test cache eviction when max size exceeded"""
        # Set small cache size for testing
        fresh_ev_engine.max_cache_size = 3
        
        # Fill cache beyond capacity
        for i in range(5):
            await fresh_ev_engine.compute_ev_enhanced(2.0 + i * 0.1, 2.2 + i * 0.1)
        
        # Cache should not exceed max size
        assert len(fresh_ev_engine.cache) <= fresh_ev_engine.max_cache_size
    
    @pytest.mark.asyncio
    async def test_precision_mode(self, fresh_ev_engine):
        """Test precision mode features"""
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_PRECISION_MODE, True)
        
        result = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        
        # Precision mode should add extra analysis fields
        assert "our_implied_probability" in result
        assert "market_implied_probability" in result
        assert "probability_edge" in result
        assert "edge_confidence" in result
    
    def test_cache_entry_functionality(self):
        """Test cache entry TTL and access tracking"""
        entry = CacheEntry(
            value={"test": "data"},
            timestamp=time.time(),
            ttl=1.0  # 1 second TTL
        )
        
        # Should not be expired immediately
        assert not entry.is_expired()
        
        # Mark as accessed
        entry.mark_accessed()
        assert entry.access_count == 1
        assert entry.last_access is not None
        
        # Wait for expiration
        time.sleep(1.1)
        assert entry.is_expired()
    
    @pytest.mark.asyncio
    async def test_distribution_analysis(self, fresh_ev_engine):
        """Test EV distribution analysis functionality"""
        # Generate enough samples for distribution analysis
        for i in range(50):
            fair_odds = 1.5 + (i % 10) * 0.1
            market_odds = fair_odds + 0.2
            await fresh_ev_engine.compute_ev_enhanced(fair_odds, market_odds)
        
        distribution = fresh_ev_engine.get_ev_distribution_summary()
        
        assert distribution.sample_size == 50
        assert distribution.mean_ev is not None
        assert distribution.median_ev is not None
        assert distribution.std_dev >= 0
        assert "p50" in distribution.percentiles
        assert distribution.positive_ev_ratio >= 0
    
    @pytest.mark.asyncio
    async def test_error_handling_and_metrics(self, fresh_ev_engine):
        """Test error handling and error metrics"""
        # Trigger validation errors
        await fresh_ev_engine.compute_ev_enhanced(-1.0, 2.0)  # Invalid odds
        await fresh_ev_engine.compute_ev_enhanced(None, 2.0)  # None value
        
        metrics = fresh_ev_engine.get_metrics_summary()
        assert metrics["error_rate"] > 0
        assert metrics["validation_failure_rate"] > 0
    
    def test_cache_invalidation(self, fresh_ev_engine):
        """Test cache invalidation functionality"""
        # Add some entries to cache
        fresh_ev_engine._set_cache("key1", {"data": 1})
        fresh_ev_engine._set_cache("key2", {"data": 2})
        fresh_ev_engine._set_cache("pattern_key", {"data": 3})
        
        assert len(fresh_ev_engine.cache) == 3
        
        # Test pattern-based invalidation
        fresh_ev_engine.invalidate_cache("pattern")
        assert len(fresh_ev_engine.cache) == 2
        
        # Test full cache invalidation
        fresh_ev_engine.invalidate_cache()
        assert len(fresh_ev_engine.cache) == 0
    
    def test_metrics_reset(self, fresh_ev_engine):
        """Test metrics reset functionality"""
        # Add some data
        fresh_ev_engine.ev_samples.extend([1.0, 2.0, 3.0])
        fresh_ev_engine.tier_samples.extend(["low", "high", "moderate"])
        fresh_ev_engine.metrics.total_calculations = 10
        
        # Reset metrics
        fresh_ev_engine.reset_metrics()
        
        assert len(fresh_ev_engine.ev_samples) == 0
        assert len(fresh_ev_engine.tier_samples) == 0
        assert fresh_ev_engine.metrics.total_calculations == 0


class TestEVMetrics:
    """Test EV metrics data structure"""
    
    def test_metrics_initialization(self):
        """Test metrics proper initialization"""
        metrics = EVMetrics()
        
        assert metrics.total_calculations == 0
        assert metrics.cache_hits == 0
        assert metrics.cache_misses == 0
        assert metrics.error_count == 0
        assert metrics.calculation_times is not None
        assert metrics.ev_distribution is not None
        assert metrics.tier_counts is not None


class TestFeatureFlags:
    """Test feature flag functionality"""
    
    def test_feature_flag_enum(self):
        """Test feature flag enum values"""
        flags = list(FeatureFlag)
        
        expected_flags = [
            FeatureFlag.ENABLE_CACHING,
            FeatureFlag.ENABLE_METRICS,
            FeatureFlag.ENABLE_BATCH_OPTIMIZATION,
            FeatureFlag.ENABLE_PRECISION_MODE,
            FeatureFlag.ENABLE_DISTRIBUTION_ANALYSIS,
            FeatureFlag.ENABLE_ADVANCED_VALIDATION
        ]
        
        for flag in expected_flags:
            assert flag in flags
    
    def test_feature_flag_management(self, fresh_ev_engine):
        """Test feature flag enable/disable"""
        for flag in FeatureFlag:
            # Test disabling
            fresh_ev_engine.set_feature_flag(flag, False)
            assert not fresh_ev_engine.is_feature_enabled(flag)
            
            # Test enabling
            fresh_ev_engine.set_feature_flag(flag, True)
            assert fresh_ev_engine.is_feature_enabled(flag)


class TestPerformance:
    """Test performance characteristics"""
    
    @pytest.mark.asyncio
    async def test_calculation_performance(self, fresh_ev_engine):
        """Test calculation performance with caching"""
        # Measure performance without cache
        start_time = time.time()
        for i in range(100):
            await fresh_ev_engine.compute_ev_enhanced(2.0 + i * 0.001, 2.2 + i * 0.001)
        time_without_cache = time.time() - start_time
        
        # Reset and measure with cache hits
        fresh_ev_engine.reset_metrics()
        fresh_ev_engine.invalidate_cache()
        
        # Pre-populate cache
        await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        
        start_time = time.time()
        for i in range(100):
            await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)  # Same values = cache hits
        time_with_cache = time.time() - start_time
        
        # Cache should provide significant speedup
        assert time_with_cache < time_without_cache * 0.8  # At least 20% faster (more tolerant)
        
        metrics = fresh_ev_engine.get_metrics_summary()
        assert metrics["cache_hit_rate"] > 0.9  # Should be mostly cache hits
    
    @pytest.mark.asyncio
    async def test_batch_performance(self, fresh_ev_engine, sample_opportunities):
        """Test batch processing performance"""
        # Create larger opportunity set
        large_opportunities = sample_opportunities * 20  # 100 opportunities
        
        start_time = time.time()
        results = await fresh_ev_engine.batch_compute_ev(large_opportunities)
        processing_time = time.time() - start_time
        
        assert len(results) == len(large_opportunities)
        assert processing_time < 10.0  # Should complete within 10 seconds
        
        # Check that all results are valid
        for result in results:
            assert "ev_percent" in result
            assert isinstance(result["ev_percent"], (int, float))


class TestEdgeCases:
    """Test edge cases and error conditions"""
    
    @pytest.mark.asyncio
    async def test_extreme_values(self, fresh_ev_engine):
        """Test handling of extreme input values"""
        # Very small odds
        result = await fresh_ev_engine.compute_ev_enhanced(1.001, 1.002)
        assert "ev_percent" in result
        
        # Very large odds (should be rejected by validation)
        result = await fresh_ev_engine.compute_ev_enhanced(1000.0, 1001.0)
        assert "error" in result
    
    @pytest.mark.asyncio
    async def test_empty_batch(self, fresh_ev_engine):
        """Test batch processing with empty input"""
        results = await fresh_ev_engine.batch_compute_ev([])
        assert results == []
    
    @pytest.mark.asyncio
    async def test_malformed_opportunities(self, fresh_ev_engine):
        """Test batch processing with malformed data"""
        malformed_opportunities = [
            {"id": "bad1"},  # Missing odds
            {"id": "bad2", "fair_odds": "invalid"},  # Invalid type
            {"id": "bad3", "fair_odds": 2.0, "market_odds": -1.0},  # Invalid value
        ]
        
        results = await fresh_ev_engine.batch_compute_ev(malformed_opportunities)
        
        # Should handle errors gracefully
        assert len(results) == len(malformed_opportunities)
        for result in results:
            assert "id" in result  # Original data preserved
    
    def test_distribution_analysis_insufficient_data(self, fresh_ev_engine):
        """Test distribution analysis with insufficient data"""
        with pytest.raises(ValueError, match="No EV samples available"):
            fresh_ev_engine.get_ev_distribution_summary()
    
    def test_metrics_with_disabled_features(self, fresh_ev_engine):
        """Test metrics when features are disabled"""
        # Disable metrics collection
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_METRICS, False)
        
        metrics = fresh_ev_engine.get_metrics_summary()
        assert "error" in metrics
    
    def test_distribution_with_disabled_feature(self, fresh_ev_engine):
        """Test distribution analysis when feature is disabled"""
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_DISTRIBUTION_ANALYSIS, False)
        
        with pytest.raises(ValueError, match="Distribution analysis disabled"):
            fresh_ev_engine.get_ev_distribution_summary()


# Integration tests
class TestIntegration:
    """Integration tests for enhanced EV engine"""
    
    @pytest.mark.asyncio
    async def test_full_workflow(self, fresh_ev_engine, sample_opportunities):
        """Test complete workflow with all features"""
        # 1. Process batch of opportunities
        results = await fresh_ev_engine.batch_compute_ev(sample_opportunities)
        
        # 2. Check metrics
        metrics = fresh_ev_engine.get_metrics_summary()
        assert metrics["total_calculations"] > 0
        
        # 3. Get distribution analysis (need more samples)
        for i in range(50):
            await fresh_ev_engine.compute_ev_enhanced(1.8 + i * 0.02, 2.0 + i * 0.02)
        
        distribution = fresh_ev_engine.get_ev_distribution_summary()
        assert distribution.sample_size > 50
        
        # 4. Test feature flag changes
        fresh_ev_engine.set_feature_flag(FeatureFlag.ENABLE_CACHING, False)
        result = await fresh_ev_engine.compute_ev_enhanced(2.0, 2.2)
        assert result["cache_hit"] is False
        
        # 5. Cache invalidation
        fresh_ev_engine.invalidate_cache()
        assert len(fresh_ev_engine.cache) == 0
        
        # 6. Metrics reset
        fresh_ev_engine.reset_metrics()
        final_metrics = fresh_ev_engine.get_metrics_summary()
        assert final_metrics["total_calculations"] == 0


if __name__ == "__main__":
    # Run specific test groups
    pytest.main([
        __file__,
        "-v",
        "-k", "ev_engine",
        "--tb=short"
    ])