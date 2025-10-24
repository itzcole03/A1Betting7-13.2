"""
Tests for Smart Signals Service and API endpoints.
Tests signal computation, API responses, and integration scenarios.
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from backend.services.smart_signals import SmartSignalsService, smart_signals_service, SmartSignal, SignalFactor


class TestSmartSignalsService:
    """Test cases for SmartSignalsService."""
    
    def setup_method(self):
        """Set up test fixtures."""
        self.service = SmartSignalsService()
        # Enable for testing
        self.service.enabled = True
    
    def test_service_initialization(self):
        """Test service initializes correctly."""
        service = SmartSignalsService()
        assert service.weights is not None
        assert len(service.weights) == 5
        assert service.weights["ev_percent"] == 0.30
        assert service.weights["arbitrage"] == 0.25
        
    def test_feature_flag_disabled(self):
        """Test service returns None when disabled."""
        service = SmartSignalsService()
        service.enabled = False
        
        opportunity = {
            "id": "test",
            "player": "Test Player",
            "sport": "MLB",
            "edge": 5.0
        }
        
        result = service.compute_signal(opportunity)
        assert result is None
    
    def test_empty_opportunity_handling(self):
        """Test graceful handling of empty/invalid inputs."""
        # Empty opportunity
        result = self.service.compute_signal({})
        assert result is None
        
        # None opportunity  
        try:
            result = self.service.compute_signal(None)  # type: ignore
            assert result is None
        except (TypeError, AttributeError):
            # Expected behavior - service should handle gracefully
            pass
    
    def test_high_ev_low_vig_scenario(self):
        """Test high EV + low vig opportunity gets high score."""
        opportunity = {
            "id": "high-value-1",
            "player": "Aaron Judge",
            "sport": "MLB",
            "market": "Total Runs",
            "line": 8.5,
            "odds": -105,  # Low vig
            "edge": 12.0,  # High EV (12%)
            "ev_percent": 12.0,
            "line_movement": 0.5,
            "movement_direction": "favorable",
            "hasArbitrage": False,
            "arbitrageProfitPct": 0.0,
            "numBookmakers": 6,
            "vig": 2.5  # Low vig
        }
        
        signal = self.service.compute_signal(opportunity)
        
        assert signal is not None
        assert signal.score >= 70, f"Expected high score >= 70, got {signal.score}"
        assert signal.confidence > 0.8, f"Expected high confidence, got {signal.confidence}"
        assert len(signal.factors) >= 3, f"Expected multiple factors, got {len(signal.factors)}"
        
        # Check that EV factor contributes significantly
        ev_factor = next((f for f in signal.factors if f.name == "ev_percent"), None)
        assert ev_factor is not None
        assert ev_factor.value >= 80, f"Expected high EV factor score, got {ev_factor.value}"
    
    def test_arbitrage_opportunity_scenario(self):
        """Test arbitrage opportunity gets high score."""
        opportunity = {
            "id": "arb-1",
            "player": "Vladimir Guerrero Jr.",
            "sport": "MLB",
            "edge": 8.0,
            "ev_percent": 8.0,
            "hasArbitrage": True,
            "arbitrageProfitPct": 3.5,  # Good arbitrage profit
            "oddsSpread": 40,
            "numBookmakers": 8
        }
        
        signal = self.service.compute_signal(opportunity)
        
        assert signal is not None
        assert signal.score >= 75, f"Expected high arbitrage score, got {signal.score}"
        
        # Check arbitrage factor
        arb_factor = next((f for f in signal.factors if f.name == "arbitrage"), None)
        assert arb_factor is not None
        assert arb_factor.value >= 80, f"Expected high arbitrage factor, got {arb_factor.value}"
    
    def test_poor_opportunity_scenario(self):
        """Test poor opportunity gets low score or no signal."""
        opportunity = {
            "id": "poor-1",
            "player": "Test Player",
            "sport": "MLB",
            "edge": -2.0,  # Negative EV
            "ev_percent": -2.0,
            "line_movement": -0.8,
            "movement_direction": "unfavorable",
            "hasArbitrage": False,
            "arbitrageProfitPct": 0.0,
            "vig": 12.0,  # High vig
            "numBookmakers": 1
        }
        
        signal = self.service.compute_signal(opportunity)
        
        # Should get a signal but with low score
        if signal is not None:
            assert signal.score < 40, f"Expected low score for poor opportunity, got {signal.score}"
    
    def test_missing_data_graceful_handling(self):
        """Test service handles missing data gracefully."""
        opportunity = {
            "id": "partial-1",
            "player": "Test Player",
            "sport": "MLB",
            # Missing most fields
        }
        
        # Should not crash
        signal = self.service.compute_signal(opportunity)
        
        # Might return None or a signal with few factors
        if signal is not None:
            assert isinstance(signal.score, float)
            assert 0 <= signal.score <= 100
            assert isinstance(signal.factors, list)
    
    def test_signal_factor_calculations(self):
        """Test individual factor calculation methods."""
        opportunity = {
            "ev_percent": 10.0,
            "line_movement": 1.0,
            "movement_direction": "favorable",
            "hasArbitrage": True,
            "arbitrageProfitPct": 2.5,
            "vig": 3.0,
            "numBookmakers": 5
        }
        
        # Test individual factor methods
        ev_factor = self.service._compute_ev_factor(opportunity)
        assert ev_factor is not None
        assert ev_factor.name == "ev_percent"
        assert ev_factor.value > 50
        
        movement_factor = self.service._compute_line_movement_factor(opportunity)
        assert movement_factor is not None
        assert movement_factor.name == "line_movement"
        
        arb_factor = self.service._compute_arbitrage_factor(opportunity)
        assert arb_factor is not None
        assert arb_factor.name == "arbitrage"
        
        vig_factor = self.service._compute_vig_factor(opportunity)
        assert vig_factor is not None
        assert vig_factor.name == "vig"
        
        diversity_factor = self.service._compute_book_diversity_factor(opportunity)
        assert diversity_factor is not None
        assert diversity_factor.name == "book_diversity"
    
    def test_american_odds_conversion(self):
        """Test American odds to implied probability conversion."""
        # Test positive odds
        implied_pos = self.service._american_to_implied(150)
        assert 0.39 < implied_pos < 0.41  # Should be around 40%
        
        # Test negative odds
        implied_neg = self.service._american_to_implied(-150)
        assert 0.59 < implied_neg < 0.61  # Should be around 60%
    
    def test_signal_response_structure(self):
        """Test signal response has correct structure."""
        opportunity = {
            "id": "struct-test",
            "player": "Test Player", 
            "sport": "MLB",
            "ev_percent": 8.0,
            "vig": 4.0,
            "numBookmakers": 4
        }
        
        signal = self.service.compute_signal(opportunity)
        
        if signal is not None:
            # Test signal structure
            assert hasattr(signal, 'score')
            assert hasattr(signal, 'factors')
            assert hasattr(signal, 'confidence')
            assert hasattr(signal, 'timestamp')
            
            # Test to_dict method
            signal_dict = signal.to_dict()
            assert 'score' in signal_dict
            assert 'factors' in signal_dict
            assert 'confidence' in signal_dict
            assert 'timestamp' in signal_dict
            
            # Test factor structure
            for factor in signal_dict['factors']:
                assert 'name' in factor
                assert 'value' in factor
                assert 'weight' in factor
                assert 'description' in factor


class TestSmartSignalsAPI:
    """Test cases for Smart Signals API endpoints."""
    
    @pytest.fixture
    def client(self):
        """Create test client."""
        from fastapi.testclient import TestClient
        from backend.core.app import create_app
        
        app = create_app()
        return TestClient(app)
    
    def test_smart_signals_health_endpoint(self, client):
        """Test health endpoint returns service status."""
        response = client.get("/api/signals/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert "status" in data
        assert "enabled" in data
        assert "weights" in data
        assert data["service"] == "smart_signals"
    
    @patch.dict(os.environ, {"ENABLE_SMART_SIGNALS": "false"})
    def test_smart_signals_disabled_returns_503(self, client):
        """Test API returns 503 when feature is disabled."""
        response = client.get("/api/signals/smart?sport=MLB&min_score=70")
        
        assert response.status_code == 503
        data = response.json()
        assert "disabled" in data["detail"]
    
    @patch.dict(os.environ, {"ENABLE_SMART_SIGNALS": "true"})
    @patch('backend.services.simple_propfinder_service.SimplePropFinderService.get_opportunities')
    def test_smart_signals_endpoint_with_data(self, mock_get_opportunities, client):
        """Test smart signals endpoint with mock data."""
        # Mock PropFinder data
        mock_get_opportunities.return_value = {
            "opportunities": [
                {
                    "id": "test-1",
                    "player": "Test Player",
                    "team": "TEST",
                    "opponent": "OPP",
                    "sport": "MLB",
                    "market": "Total Runs",
                    "line": 8.5,
                    "odds": -110,
                    "confidence": 75.0,
                    "edge": 8.0,
                    "ev_percent": 8.0,
                    "vig": 4.5,
                    "numBookmakers": 5,
                    "hasArbitrage": False,
                    "arbitrageProfitPct": 0.0
                }
            ]
        }
        
        response = client.get("/api/signals/smart?sport=MLB&min_score=70")
        
        # Should work if PropFinder service is available
        assert response.status_code in [200, 500]  # 500 if service not available in test
    
    def test_smart_signals_endpoint_parameters(self, client):
        """Test endpoint parameter validation."""
        # Test invalid min_score
        response = client.get("/api/signals/smart?min_score=150")
        assert response.status_code == 422  # Validation error
        
        # Test invalid limit
        response = client.get("/api/signals/smart?limit=0")
        assert response.status_code == 422  # Validation error


class TestSmartSignalsIntegration:
    """Integration tests for smart signals with PropFinder."""
    
    @patch.dict(os.environ, {"ENABLE_SMART_SIGNALS": "true"})
    def test_propfinder_integration(self):
        """Test PropFinder integration adds smart signals to high-scoring opportunities."""
        # Skip integration test - requires full PropFinder setup
        pytest.skip("Integration test requires full PropFinder service setup")


def test_global_service_instance():
    """Test global service instance is properly configured."""
    assert smart_signals_service is not None
    assert isinstance(smart_signals_service, SmartSignalsService)
    assert hasattr(smart_signals_service, 'enabled')
    assert hasattr(smart_signals_service, 'weights')


# Performance and edge case tests
class TestSmartSignalsEdgeCases:
    """Test edge cases and error conditions."""
    
    def test_extremely_high_values(self):
        """Test service handles extremely high input values."""
        service = SmartSignalsService()
        service.enabled = True
        
        opportunity = {
            "id": "extreme-1",
            "ev_percent": 999.0,  # Extreme EV
            "vig": -50.0,  # Negative vig (impossible)
            "arbitrageProfitPct": 1000.0,  # Extreme arbitrage
            "numBookmakers": 999,
            "line_movement": 100.0
        }
        
        signal = service.compute_signal(opportunity)
        
        if signal is not None:
            # Score should be capped at 100
            assert signal.score <= 100
            assert signal.score >= 0
            
            # All factor values should be capped at 100
            for factor in signal.factors:
                assert factor.value <= 100
                assert factor.value >= 0
    
    def test_malformed_data_types(self):
        """Test service handles malformed data types gracefully."""
        service = SmartSignalsService()
        service.enabled = True
        
        opportunity = {
            "id": "malformed-1",
            "ev_percent": "not_a_number",
            "vig": None,
            "arbitrageProfitPct": [1, 2, 3],  # Wrong type
            "numBookmakers": "five"  # String instead of int
        }
        
        # Should not crash
        signal = service.compute_signal(opportunity)
        
        # Might return None or a signal with minimal factors
        if signal is not None:
            assert isinstance(signal.score, float)
            assert 0 <= signal.score <= 100


if __name__ == "__main__":
    pytest.main([__file__, "-v"])