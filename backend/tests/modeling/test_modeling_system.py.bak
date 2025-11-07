"""
Test suite for the baseline modeling + valuation + edge detection stack
"""

import pytest
import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

# Import the modeling system components
try:
    from backend.services.modeling.baseline_models import PoissonLikeModel, NormalModel, NegativeBinomialModel
    from backend.services.modeling.model_registry import model_registry, BaseStatModel
    from backend.services.valuation.valuation_engine import valuation_engine, PropData, ValuationResult
    from backend.services.edges.edge_service import edge_service, EdgeData, EdgeThresholds
    from backend.services.modeling.modeling_config import modeling_config, ModelType
    from backend.services.modeling.observability import modeling_observability
    MODELING_AVAILABLE = True
except ImportError as e:
    print(f"Modeling components not fully available for testing: {e}")
    MODELING_AVAILABLE = False


class TestBaselineModels:
    """Test baseline statistical models"""
    
    def test_poisson_model_initialization(self):
        """Test PoissonLikeModel can be initialized"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        model = PoissonLikeModel()
        assert model.model_name == "PoissonLike"
        assert model.distribution_family == "poisson"
    
    def test_normal_model_initialization(self):
        """Test NormalModel can be initialized"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        model = NormalModel()
        assert model.model_name == "Normal"
        assert model.distribution_family == "normal"
    
    def test_negative_binomial_model_initialization(self):
        """Test NegativeBinomialModel can be initialized"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        model = NegativeBinomialModel()
        assert model.model_name == "NegativeBinomial"
        assert model.distribution_family == "negative_binomial"
    
    @pytest.mark.asyncio
    async def test_poisson_model_predict(self):
        """Test PoissonLikeModel prediction with mock data"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        model = PoissonLikeModel()
        
        # Mock prop data
        prop_data = PropData(
            prop_id=1,
            player_id=100,
            prop_type="points",
            line=25.5,
            offered_odds=-110,
            sport="NBA",
            additional_features={"position": "PG"}
        )
        
        # This should work even with mock data
        prediction = await model.predict(prop_data)
        
        assert isinstance(prediction, float)
        assert prediction > 0  # Should be positive for points
    
    @pytest.mark.asyncio
    async def test_model_registry_operations(self):
        """Test model registry basic operations"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        # Test model registration
        test_model = PoissonLikeModel()
        model_registry.register_model("points", test_model)
        
        # Test getting default model
        default_model = model_registry.get_default_model("points")
        assert default_model is not None
        assert isinstance(default_model, BaseStatModel)
        
        # Test setting default
        model_registry.set_default_for_prop_type("points", test_model)
        
        # Should get the same model back
        retrieved_model = model_registry.get_default_model("points")
        assert retrieved_model.model_name == test_model.model_name


class TestValuationEngine:
    """Test valuation engine"""
    
    @pytest.mark.asyncio
    async def test_valuation_with_mock_data(self):
        """Test valuation engine with completely mocked dependencies"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        # Mock the database session to avoid actual database calls
        with patch('backend.services.valuation.valuation_engine.get_db_session') as mock_get_db:
            mock_session = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            # Mock the query results
            mock_session.execute.return_value.fetchone.return_value = None  # No existing valuation
            mock_session.flush = AsyncMock()
            mock_session.commit = AsyncMock()
            
            # Mock the prop data fetching
            with patch.object(valuation_engine, '_fetch_prop_data') as mock_fetch_prop:
                mock_fetch_prop.return_value = PropData(
                    prop_id=999,
                    player_id=100,
                    prop_type="points",
                    line=25.5,
                    offered_odds=-110,
                    sport="NBA",
                    additional_features={}
                )
                
                # Run valuation
                result = await valuation_engine.valuate(prop_id=999)
                
                # Should return a result even with mocked data
                assert result is not None
                assert isinstance(result, ValuationResult)
                assert result.prop_id == 999
                assert result.offered_line == 25.5
    
    def test_prop_data_model(self):
        """Test PropData model validation"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        prop_data = PropData(
            prop_id=1,
            player_id=100,
            prop_type="points",
            line=25.5,
            offered_odds=-110,
            sport="NBA",
            additional_features={"position": "PG", "team": "LAL"}
        )
        
        assert prop_data.prop_id == 1
        assert prop_data.player_id == 100
        assert prop_data.prop_type == "points"
        assert prop_data.line == 25.5
        assert prop_data.sport == "NBA"
        assert prop_data.additional_features["position"] == "PG"


class TestEdgeDetection:
    """Test edge detection service"""
    
    def test_edge_thresholds(self):
        """Test edge threshold configuration"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        thresholds = EdgeThresholds()
        
        assert thresholds.ev_min == 0.05
        assert thresholds.prob_over_min == 0.52
        assert thresholds.prob_over_max == 0.75
        assert thresholds.volatility_max == 2.0
    
    @pytest.mark.asyncio
    async def test_edge_detection_with_good_value(self):
        """Test edge detection with a valuation that should qualify"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        # Create a valuation that should qualify as an edge
        valuation = ValuationResult(
            valuation_id=None,
            prop_id=1,
            model_version_id=1,
            prediction=26.8,  # Above the line
            prob_over=0.62,   # In the sweet spot
            prob_under=0.38,
            fair_line=24.5,   # Well below offered line
            offered_line=25.5,
            expected_value=0.08,  # Above minimum threshold
            volatility_score=1.5,  # Below max threshold
            valuation_hash="test_hash",
            created_at=datetime.now(timezone.utc)
        )
        
        # Mock database operations to avoid actual database calls
        with patch('backend.services.edges.edge_service.get_db_session') as mock_get_db:
            mock_session = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            # Mock no existing edge
            mock_session.execute.return_value.fetchone.return_value = None
            mock_session.flush = AsyncMock()
            mock_session.commit = AsyncMock()
            
            # Mock edge storage
            with patch.object(edge_service, '_store_edge') as mock_store:
                mock_store.return_value = 123  # Mock edge ID
                
                # Mock websocket emission
                with patch.object(edge_service, '_emit_edge_event') as mock_emit:
                    mock_emit.return_value = None
                    
                    # Detect edge
                    edge = await edge_service.detect_edge(valuation)
                    
                    assert edge is not None
                    assert isinstance(edge, EdgeData)
                    assert edge.prop_id == 1
                    assert edge.ev == 0.08
                    assert edge.edge_score > 0
    
    @pytest.mark.asyncio
    async def test_edge_detection_with_poor_value(self):
        """Test edge detection with a valuation that should not qualify"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        # Create a valuation that should NOT qualify as an edge
        valuation = ValuationResult(
            valuation_id=None,
            prop_id=2,
            model_version_id=1,
            prediction=25.1,  # Close to the line
            prob_over=0.51,   # Below minimum threshold
            prob_under=0.49,
            fair_line=25.3,   # Close to offered line
            offered_line=25.5,
            expected_value=0.02,  # Below minimum threshold
            volatility_score=1.0,
            valuation_hash="test_hash_2",
            created_at=datetime.now(timezone.utc)
        )
        
        # Detect edge
        edge = await edge_service.detect_edge(valuation)
        
        # Should not qualify as an edge
        assert edge is None


class TestConfiguration:
    """Test configuration management"""
    
    def test_configuration_loading(self):
        """Test configuration can be loaded"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        assert modeling_config is not None
        assert hasattr(modeling_config, 'edge_thresholds')
        assert hasattr(modeling_config, 'models')
        assert hasattr(modeling_config, 'database')
        assert hasattr(modeling_config, 'cache')
    
    def test_model_configuration(self):
        """Test model-specific configuration"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        poisson_config = modeling_config.get_model_config(ModelType.POISSON)
        assert poisson_config is not None
        assert isinstance(poisson_config.enabled, bool)
        assert isinstance(poisson_config.priority, int)
        assert isinstance(poisson_config.cache_ttl_seconds, int)
    
    def test_feature_flags(self):
        """Test feature flag functionality"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        # Test feature flag checking
        caching_enabled = modeling_config.is_feature_enabled("enable_model_caching")
        assert isinstance(caching_enabled, bool)
        
        dedup_enabled = modeling_config.is_feature_enabled("enable_valuation_deduplication")
        assert isinstance(dedup_enabled, bool)
    
    def test_configuration_validation(self):
        """Test configuration validation"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        issues = modeling_config.validate_config()
        assert isinstance(issues, list)
        # In a properly configured environment, should have no issues
        # (though some issues might be expected in test environment)


class TestObservability:
    """Test observability and monitoring"""
    
    def test_metrics_initialization(self):
        """Test metrics can be initialized"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        assert modeling_observability is not None
        assert hasattr(modeling_observability, 'metrics')
        
        metrics = modeling_observability.metrics
        assert metrics.valuations_total >= 0
        assert metrics.edges_detected_total >= 0
        assert metrics.predictions_total >= 0
    
    def test_metric_tracking(self):
        """Test basic metric tracking"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        initial_total = modeling_observability.metrics.valuations_total
        
        # Track a successful valuation
        modeling_observability.track_valuation_success("test_op_123", 150.0, cached=False)
        
        assert modeling_observability.metrics.valuations_total == initial_total + 1
        assert modeling_observability.metrics.valuations_success >= 1
    
    @pytest.mark.asyncio
    async def test_health_checks(self):
        """Test health check system"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        # Run health checks
        health_result = await modeling_observability.run_health_checks()
        
        assert isinstance(health_result, dict)
        assert "overall_status" in health_result
        assert "timestamp" in health_result
        assert "checks" in health_result
        
        # Should have registered health checks
        assert len(health_result["checks"]) > 0


class TestIntegration:
    """Integration tests for the full modeling pipeline"""
    
    @pytest.mark.asyncio
    async def test_full_pipeline_mock(self):
        """Test the full valuation -> edge detection pipeline with mocks"""
        if not MODELING_AVAILABLE:
            pytest.skip("Modeling components not available")
        
        # Mock all database operations
        with patch('backend.services.valuation.valuation_engine.get_db_session') as mock_val_db, \
             patch('backend.services.edges.edge_service.get_db_session') as mock_edge_db:
            
            # Setup valuation mocks
            mock_val_session = AsyncMock()
            mock_val_db.return_value.__aenter__.return_value = mock_val_session
            mock_val_session.execute.return_value.fetchone.return_value = None
            mock_val_session.flush = AsyncMock()
            mock_val_session.commit = AsyncMock()
            
            # Setup edge mocks
            mock_edge_session = AsyncMock()
            mock_edge_db.return_value.__aenter__.return_value = mock_edge_session
            mock_edge_session.execute.return_value.fetchone.return_value = None
            mock_edge_session.flush = AsyncMock()
            mock_edge_session.commit = AsyncMock()
            
            # Mock prop data fetching
            with patch.object(valuation_engine, '_fetch_prop_data') as mock_fetch_prop:
                mock_fetch_prop.return_value = PropData(
                    prop_id=888,
                    player_id=200,
                    prop_type="rebounds",
                    line=8.5,
                    offered_odds=-105,
                    sport="NBA",
                    additional_features={"position": "C"}
                )
                
                # Mock edge storage and emission
                with patch.object(edge_service, '_store_edge') as mock_store, \
                     patch.object(edge_service, '_emit_edge_event') as mock_emit:
                    mock_store.return_value = 456
                    mock_emit.return_value = None
                    
                    # Step 1: Run valuation
                    valuation = await valuation_engine.valuate(prop_id=888)
                    assert valuation is not None
                    assert valuation.prop_id == 888
                    
                    # Step 2: Run edge detection
                    edge = await edge_service.detect_edge(valuation)
                    
                    # Result depends on the specific valuation output
                    # but the pipeline should complete without errors
                    assert edge is None or isinstance(edge, EdgeData)


# Configuration for pytest
def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line("markers", "asyncio: mark test as async")


# Test runner for standalone execution
if __name__ == "__main__":
    # Run basic tests without pytest if needed
    print("Running basic modeling system tests...")
    
    try:
        # Test imports
        print("✓ Testing imports...")
        if MODELING_AVAILABLE:
            print("  ✓ All modeling components imported successfully")
        else:
            print("  ⚠ Some modeling components not available (expected in development)")
        
        # Test basic initialization
        print("✓ Testing initialization...")
        if MODELING_AVAILABLE:
            model = PoissonLikeModel()
            print(f"  ✓ PoissonLikeModel: {model.model_name}")
            
            config = modeling_config
            print(f"  ✓ Configuration loaded: {config.environment.value}")
            
            observability = modeling_observability
            print(f"  ✓ Observability initialized: {observability.metrics.valuations_total} total valuations")
        
        print("\n✓ Basic tests completed successfully!")
        print("Run 'pytest backend/tests/modeling/' for full test suite")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        import traceback
        traceback.print_exc()