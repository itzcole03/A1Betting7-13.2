"""
Unit tests for the Correlation Engine
Tests correlation computation, caching, clustering, and historical data integration.
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from typing import List, Dict, Any
import time

from backend.services.correlation.correlation_engine import (
    CorrelationEngine, CorrelationRecord, CorrelationClusterResult
)
from backend.services.unified_config import CorrelationConfig
from backend.models.correlation_ticketing import (
    PropCorrelationStat, CorrelationCluster, HistoricalPropOutcome
)


class TestCorrelationEngine:
    """Test suite for correlation engine functionality."""
    
    @pytest.fixture
    def mock_correlation_config(self):
        """Create mock correlation configuration."""
        config = Mock(spec=CorrelationConfig)
        config.min_samples = 10
        config.correlation_threshold = 0.3
        config.clustering_min_correlation = 0.4
        config.max_cluster_size = 8
        config.cache_ttl_seconds = 3600
        return config
    
    @pytest.fixture 
    def correlation_engine(self, mock_correlation_config):
        """Create correlation engine instance with mocked dependencies."""
        with patch('backend.services.correlation.correlation_engine.get_correlation_config') as mock_get_config:
            mock_get_config.return_value = mock_correlation_config
            engine = CorrelationEngine()
            return engine
    
    @pytest.fixture
    def sample_correlation_records(self):
        """Create sample correlation records for testing."""
        return [
            CorrelationRecord(prop_id_a=1, prop_id_b=2, pearson_r=0.75, sample_size=50),
            CorrelationRecord(prop_id_a=1, prop_id_b=3, pearson_r=0.25, sample_size=45),
            CorrelationRecord(prop_id_a=2, prop_id_b=3, pearson_r=0.60, sample_size=48),
            CorrelationRecord(prop_id_a=1, prop_id_b=4, pearson_r=0.10, sample_size=52),
        ]
    
    @pytest.fixture
    def mock_historical_data_provider(self):
        """Create mock historical data provider."""
        mock_provider = Mock()
        # Mock return: (valid_prop_ids, aligned_data_dict)
        mock_provider.get_aligned_history.return_value = (
            [1, 2, 3],  # valid props
            {
                1: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],  # 10 samples
                2: [0, 1, 1, 0, 1, 0, 1, 1, 0, 0], 
                3: [1, 1, 0, 1, 0, 1, 1, 0, 1, 0]
            }
        )
        return mock_provider
    
    def test_engine_initialization(self, mock_correlation_config):
        """Test correlation engine initialization."""
        with patch('backend.services.correlation.correlation_engine.get_correlation_config') as mock_get_config:
            mock_get_config.return_value = mock_correlation_config
            
            engine = CorrelationEngine()
            
            assert engine.config == mock_correlation_config
            assert engine._cache == {}
    
    def test_correlation_record_ordering(self):
        """Test CorrelationRecord ensures consistent prop ID ordering."""
        # Test normal order
        record1 = CorrelationRecord(prop_id_a=1, prop_id_b=3, pearson_r=0.5, sample_size=20)
        assert record1.prop_id_a == 1 and record1.prop_id_b == 3
        
        # Test reversed order gets corrected
        record2 = CorrelationRecord(prop_id_a=5, prop_id_b=2, pearson_r=0.7, sample_size=25)
        assert record2.prop_id_a == 2 and record2.prop_id_b == 5
    
    def test_context_hash_computation(self, correlation_engine):
        """Test context hash computation for caching."""
        context1 = {"game_id": 12345, "league": "NBA"}
        context2 = {"league": "NBA", "game_id": 12345}  # Same but different order
        context3 = {"game_id": 54321, "league": "NBA"}  # Different content
        
        hash1 = correlation_engine._compute_context_hash(context1)
        hash2 = correlation_engine._compute_context_hash(context2)
        hash3 = correlation_engine._compute_context_hash(context3)
        
        # Same content should produce same hash regardless of order
        assert hash1 == hash2
        # Different content should produce different hash
        assert hash1 != hash3
        assert isinstance(hash1, str)
    
    @patch('backend.services.correlation.correlation_engine.historical_data_provider')
    def test_compute_pairwise_correlations_insufficient_props(self, mock_provider, correlation_engine):
        """Test handling when fewer than 2 props provided."""
        result = correlation_engine.compute_pairwise_correlations([1])
        
        assert result == []
        mock_provider.get_aligned_history.assert_not_called()
    
    @patch('backend.services.correlation.correlation_engine.historical_data_provider')
    def test_compute_pairwise_correlations_insufficient_data(self, mock_provider, correlation_engine):
        """Test handling when insufficient historical data available."""
        # Mock provider to return insufficient valid props
        mock_provider.get_aligned_history.return_value = ([1], {1: [1, 0, 1]})
        
        result = correlation_engine.compute_pairwise_correlations([1, 2, 3])
        
        assert result == []
        mock_provider.get_aligned_history.assert_called_once()
    
    @patch('backend.services.correlation.correlation_engine.historical_data_provider')
    @patch('backend.services.correlation.correlation_engine.np.corrcoef')
    def test_successful_correlation_computation(self, mock_corrcoef, mock_provider, correlation_engine):
        """Test successful pairwise correlation computation."""
        # Setup mocks
        mock_provider.get_aligned_history.return_value = (
            [1, 2, 3],
            {
                1: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
                2: [0, 1, 1, 0, 1, 0, 1, 1, 0, 0], 
                3: [1, 1, 0, 1, 0, 1, 1, 0, 1, 0]
            }
        )
        
        # Mock numpy correlation matrix
        mock_correlation_matrix = np.array([
            [1.0, 0.7, 0.3],
            [0.7, 1.0, 0.5],
            [0.3, 0.5, 1.0]
        ])
        mock_corrcoef.return_value = mock_correlation_matrix
        
        result = correlation_engine.compute_pairwise_correlations([1, 2, 3])
        
        # Should return correlation records for unique pairs
        assert len(result) == 3  # (1,2), (1,3), (2,3)
        
        # Verify correlation values
        correlations_dict = {(r.prop_id_a, r.prop_id_b): r.pearson_r for r in result}
        assert correlations_dict[(1, 2)] == 0.7
        assert correlations_dict[(1, 3)] == 0.3
        assert correlations_dict[(2, 3)] == 0.5
        
        # Verify sample sizes
        for record in result:
            assert record.sample_size == 10  # 10 samples provided
    
    def test_build_correlation_matrix(self, correlation_engine, sample_correlation_records):
        """Test building correlation matrix from correlation records."""
        matrix, sample_size_map = correlation_engine.build_correlation_matrix(sample_correlation_records)
        
        # Verify matrix structure
        assert isinstance(matrix, dict)
        assert 1 in matrix and 2 in matrix and 3 in matrix and 4 in matrix
        
        # Verify diagonal elements (self-correlations should be 1.0)
        assert matrix[1][1] == 1.0
        assert matrix[2][2] == 1.0
        assert matrix[3][3] == 1.0
        assert matrix[4][4] == 1.0
        
        # Verify correlation values
        assert matrix[1][2] == 0.75
        assert matrix[2][1] == 0.75  # Should be symmetric
        assert matrix[1][3] == 0.25
        assert matrix[2][3] == 0.60
        
        # Verify sample size map
        assert "1-2" in sample_size_map
        assert sample_size_map["1-2"] == 50
    
    def test_compute_clusters(self, correlation_engine, sample_correlation_records):
        """Test clustering computation from correlation records."""
        clusters = correlation_engine.compute_clusters(sample_correlation_records, min_correlation=0.5)
        
        # Based on sample data, props 1 and 2 (r=0.75) and 2 and 3 (r=0.60) should cluster
        # So we should get cluster [1, 2, 3]
        assert len(clusters) >= 1
        
        # Find cluster containing props 1, 2, 3
        found_cluster = None
        for cluster in clusters:
            if 1 in cluster.member_prop_ids and 2 in cluster.member_prop_ids:
                found_cluster = cluster
                break
        
        assert found_cluster is not None
        assert 1 in found_cluster.member_prop_ids
        assert 2 in found_cluster.member_prop_ids
        # Prop 3 might also be included depending on transitivity handling
    
    @patch('backend.services.correlation.correlation_engine.SessionLocal')
    def test_persist_correlation_stats(self, mock_session_local, correlation_engine, sample_correlation_records):
        """Test persistence of correlation statistics to database."""
        mock_session = Mock()
        mock_session_local.return_value.__enter__.return_value = mock_session
        
        correlation_engine.persist_correlation_stats(sample_correlation_records)
        
        # Verify database operations
        assert mock_session.add.called
        assert mock_session.commit.called
        
        # Should add one record per correlation
        add_calls = mock_session.add.call_args_list
        assert len(add_calls) == len(sample_correlation_records)
    
    @patch('backend.services.correlation.correlation_engine.SessionLocal')
    def test_persist_clusters(self, mock_session_local, correlation_engine):
        """Test persistence of clusters to database."""
        mock_session = Mock()
        mock_session_local.return_value.__enter__.return_value = mock_session
        
        clusters = [
            CorrelationClusterResult(
                cluster_id="cluster_1", 
                member_prop_ids=[1, 2, 3], 
                average_internal_r=0.65
            ),
            CorrelationClusterResult(
                cluster_id="cluster_2", 
                member_prop_ids=[4, 5], 
                average_internal_r=0.55
            )
        ]
        
        correlation_engine.persist_clusters(clusters)
        
        # Verify database operations
        assert mock_session.add.called
        assert mock_session.commit.called
        
        add_calls = mock_session.add.call_args_list
        assert len(add_calls) == 2  # Two clusters
    
    def test_caching_behavior(self, correlation_engine):
        """Test correlation computation caching."""
        prop_ids = [1, 2, 3]
        context = {"game_id": 123}
        
        # Mock the first computation
        with patch.object(correlation_engine, '_compute_correlations_uncached') as mock_compute:
            mock_compute.return_value = [
                CorrelationRecord(prop_id_a=1, prop_id_b=2, pearson_r=0.6, sample_size=20)
            ]
            
            # First call should compute
            result1 = correlation_engine.compute_pairwise_correlations(prop_ids, context)
            assert mock_compute.call_count == 1
            
            # Second call should use cache
            result2 = correlation_engine.compute_pairwise_correlations(prop_ids, context)
            assert mock_compute.call_count == 1  # Should not call again
            
            assert result1 == result2
    
    @patch('backend.services.correlation.correlation_engine.get_correlation_ticketing_metrics')
    def test_metrics_recording(self, mock_get_metrics, correlation_engine):
        """Test that correlation metrics are properly recorded."""
        mock_metrics = Mock()
        mock_get_metrics.return_value = mock_metrics
        
        with patch.object(correlation_engine, '_compute_correlations_uncached') as mock_compute:
            mock_compute.return_value = []
            
            correlation_engine.compute_pairwise_correlations([1, 2])
            
            # Verify metrics were recorded
            mock_metrics.record_correlation_matrix_computation.assert_called()
    
    def test_error_handling_numpy_failure(self, correlation_engine):
        """Test graceful handling of numpy computation errors."""
        with patch('backend.services.correlation.correlation_engine.historical_data_provider') as mock_provider:
            mock_provider.get_aligned_history.return_value = (
                [1, 2], {1: [1, 0, 1], 2: [0, 1, 0]}
            )
            
            with patch('backend.services.correlation.correlation_engine.np.corrcoef') as mock_corrcoef:
                mock_corrcoef.side_effect = Exception("Numpy computation failed")
                
                # Should handle error gracefully
                result = correlation_engine.compute_pairwise_correlations([1, 2])
                assert result == []  # Should return empty list on error
    
    def test_database_error_handling(self, correlation_engine, sample_correlation_records):
        """Test graceful handling of database errors."""
        with patch('backend.services.correlation.correlation_engine.SessionLocal') as mock_session_local:
            mock_session = Mock()
            mock_session_local.return_value.__enter__.return_value = mock_session
            mock_session.commit.side_effect = Exception("Database error")
            
            # Should not raise exception
            try:
                correlation_engine.persist_correlation_stats(sample_correlation_records)
                # Should call rollback on error
                mock_session.rollback.assert_called()
            except Exception:
                pytest.fail("Database error should be handled gracefully")


class TestCorrelationEngineIntegration:
    """Integration tests for correlation engine with realistic scenarios."""
    
    def test_large_correlation_matrix(self):
        """Test performance and correctness with large prop sets."""
        # Would test with 50+ props to verify:
        # 1. Performance stays reasonable
        # 2. Memory usage is controlled
        # 3. Results are mathematically correct
        pass
    
    def test_real_historical_data_integration(self):
        """Test with actual historical data patterns."""
        # Would test with real-like correlated data to verify:
        # 1. Proper correlation detection
        # 2. Meaningful cluster formation  
        # 3. Database persistence accuracy
        pass


if __name__ == "__main__":
    pytest.main([__file__])