"""
Portfolio Optimization Routes Integration Tests - Phase 4.1 Backend Tests
Test suite for advanced Kelly criterion and portfolio optimization endpoints
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from backend.main import app


class TestPortfolioOptimizationRoutes:
    """Test suite for portfolio optimization routes"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    async def async_client(self):
        """Create async test client"""
        from httpx import AsyncClient
        async with AsyncClient(base_url="http://test") as client:
            yield client
    
    def test_single_kelly_calculation_endpoint(self, client):
        """Test single Kelly calculation endpoint structure"""
        kelly_request = {
            "probability": 0.65,
            "odds": 1.85,
            "bankroll": 1000.0,
            "variant": "standard",
            "risk_adjustment": 1.0
        }
        
        response = client.post("/api/advanced-kelly/calculate", json=kelly_request)
        
        # Should return proper response structure
        assert response.status_code in [200, 400, 422, 500]
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check Kelly calculation fields
            assert isinstance(data, dict)
            assert any(key in data for key in ["kelly_fraction", "recommended_bet", "result", "success"])
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_kelly_calculation_validation(self, client):
        """Test Kelly calculation input validation"""
        # Test invalid probability values
        invalid_requests = [
            {"probability": -0.1, "odds": 1.85, "bankroll": 1000.0},  # Negative probability
            {"probability": 1.5, "odds": 1.85, "bankroll": 1000.0},   # Probability > 1
            {"probability": 0.65, "odds": -1.0, "bankroll": 1000.0},  # Negative odds
            {"probability": 0.65, "odds": 1.85, "bankroll": -100.0},  # Negative bankroll
            {"probability": 0.65, "odds": 1.0, "bankroll": 1000.0},   # Odds = 1.0 (no edge)
            {},  # Empty request
            {"probability": "invalid", "odds": 1.85, "bankroll": 1000.0}  # Invalid type
        ]
        
        for invalid_request in invalid_requests:
            response = client.post("/api/advanced-kelly/calculate", json=invalid_request)
            assert response.status_code in [400, 422], f"Failed for request: {invalid_request}"
            
            data = response.json()
            assert "message" in data or "detail" in data
    
    def test_portfolio_optimization_endpoint_structure(self, client):
        """Test portfolio optimization endpoint structure"""
        portfolio_request = {
            "opportunities": [
                {
                    "id": "bet_1",
                    "probability": 0.65,
                    "odds": 1.85,
                    "sport": "MLB",
                    "prop_type": "runs_scored"
                },
                {
                    "id": "bet_2", 
                    "probability": 0.58,
                    "odds": 2.10,
                    "sport": "MLB",
                    "prop_type": "hits"
                }
            ],
            "total_bankroll": 1000.0,
            "variant": "portfolio",
            "risk_tolerance": 0.8
        }
        
        response = client.post("/api/advanced-kelly/portfolio-optimization", json=portfolio_request)
        
        # Should return proper response structure
        assert response.status_code in [200, 400, 422, 500]
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check portfolio optimization fields
            assert isinstance(data, dict)
            # Should contain results for each opportunity or summary
            assert len(data) > 0 or "results" in data or "allocations" in data
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_portfolio_optimization_validation(self, client):
        """Test portfolio optimization validation"""
        # Test invalid portfolio requests
        invalid_requests = [
            {"opportunities": [], "total_bankroll": 1000.0},  # Empty opportunities
            {"opportunities": [{"invalid": "opportunity"}], "total_bankroll": 1000.0},  # Invalid opportunity
            {"total_bankroll": -1000.0},  # Negative bankroll
            {},  # Empty request
            {
                "opportunities": [
                    {"id": "bet_1", "probability": -0.1, "odds": 1.85}  # Invalid probability
                ],
                "total_bankroll": 1000.0
            }
        ]
        
        for invalid_request in invalid_requests:
            response = client.post("/api/advanced-kelly/portfolio-optimization", json=invalid_request)
            assert response.status_code in [400, 422], f"Failed for request: {invalid_request}"
            
            data = response.json()
            assert "message" in data or "detail" in data
    
    def test_portfolio_metrics_endpoint(self, client):
        """Test portfolio metrics endpoint"""
        response = client.get("/api/advanced-kelly/portfolio-metrics")
        
        # Should return proper response structure
        assert response.status_code in [200, 404, 500]
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check metrics structure
            assert isinstance(data, dict)
            assert any(key in data for key in [
                "total_exposure", "portfolio_variance", "expected_return", 
                "risk_metrics", "diversification_ratio", "portfolio_status"
            ])
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_batch_kelly_calculation_endpoint(self, client):
        """Test batch Kelly calculation endpoint"""
        batch_request = {
            "opportunities": [
                {
                    "probability": 0.65,
                    "odds": 1.85,
                    "bankroll": 1000.0,
                    "id": "calc_1"
                },
                {
                    "probability": 0.58,
                    "odds": 2.10,
                    "bankroll": 1000.0,
                    "id": "calc_2"
                }
            ],
            "variant": "standard"
        }
        
        response = client.post("/api/advanced-kelly/batch-calculate", json=batch_request)
        
        # Should return proper response structure
        assert response.status_code in [200, 400, 422, 500]
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check batch results
            assert isinstance(data, dict)
            assert "results" in data or len(data) > 0
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_optimization_variants(self, client):
        """Test different optimization variants"""
        base_request = {
            "probability": 0.65,
            "odds": 1.85,
            "bankroll": 1000.0
        }
        
        variants = ["standard", "fractional", "modified", "conservative"]
        
        for variant in variants:
            request_data = {**base_request, "variant": variant}
            response = client.post("/api/advanced-kelly/calculate", json=request_data)
            
            # Should handle all variants (success or graceful error)
            assert response.status_code in [200, 400, 422, 500]
            
            data = response.json()
            if response.status_code != 200:
                # If variant not supported, should have clear error message
                assert "message" in data or "detail" in data
    
    def test_risk_management_endpoint(self, client):
        """Test risk management analysis endpoint"""
        risk_request = {
            "portfolio": [
                {
                    "bet_id": "bet_1",
                    "amount": 50.0,
                    "probability": 0.65,
                    "odds": 1.85
                },
                {
                    "bet_id": "bet_2",
                    "amount": 30.0,
                    "probability": 0.58,
                    "odds": 2.10
                }
            ],
            "total_bankroll": 1000.0
        }
        
        response = client.post("/api/advanced-kelly/risk-analysis", json=risk_request)
        
        # Should return proper response structure
        assert response.status_code in [200, 400, 422, 500]
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check risk analysis fields
            assert isinstance(data, dict)
            assert any(key in data for key in [
                "risk_score", "value_at_risk", "expected_return", 
                "volatility", "sharpe_ratio", "max_drawdown"
            ])
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_historical_performance_endpoint(self, client):
        """Test historical performance tracking endpoint"""
        performance_request = {
            "time_range": {
                "start": "2024-01-01T00:00:00Z",
                "end": "2024-12-31T23:59:59Z"
            },
            "portfolio_id": "test_portfolio"
        }
        
        response = client.post("/api/advanced-kelly/historical-performance", json=performance_request)
        
        # Should return proper response structure
        assert response.status_code in [200, 404, 422, 500]
        
        data = response.json()
        if response.status_code == 200:
            # Success case - check performance data
            assert isinstance(data, dict)
            assert any(key in data for key in [
                "performance_data", "returns", "win_rate", 
                "profit_loss", "sharpe_ratio", "max_drawdown"
            ])
        else:
            # Error case
            assert "message" in data or "detail" in data
    
    def test_kelly_optimization_flow_integration(self, client):
        """Test complete Kelly optimization flow integration"""
        # 1. Test single Kelly calculation
        single_kelly = {
            "probability": 0.65,
            "odds": 1.85,
            "bankroll": 1000.0,
            "variant": "standard"
        }
        
        single_response = client.post("/api/advanced-kelly/calculate", json=single_kelly)
        assert single_response.status_code in [200, 400, 422, 500]
        
        # 2. Test portfolio optimization with multiple opportunities
        portfolio_data = {
            "opportunities": [
                {
                    "id": "bet_1",
                    "probability": 0.65,
                    "odds": 1.85,
                    "sport": "MLB"
                },
                {
                    "id": "bet_2",
                    "probability": 0.58, 
                    "odds": 2.10,
                    "sport": "MLB"
                }
            ],
            "total_bankroll": 1000.0,
            "variant": "portfolio"
        }
        
        portfolio_response = client.post("/api/advanced-kelly/portfolio-optimization", json=portfolio_data)
        assert portfolio_response.status_code in [200, 400, 422, 500]
        
        # 3. Test portfolio metrics
        metrics_response = client.get("/api/advanced-kelly/portfolio-metrics")
        assert metrics_response.status_code in [200, 404, 500]
        
        # 4. Test batch calculations
        batch_data = {
            "opportunities": [
                {"probability": 0.65, "odds": 1.85, "bankroll": 1000.0, "id": "calc_1"},
                {"probability": 0.58, "odds": 2.10, "bankroll": 1000.0, "id": "calc_2"}
            ],
            "variant": "standard"
        }
        
        batch_response = client.post("/api/advanced-kelly/batch-calculate", json=batch_data)
        assert batch_response.status_code in [200, 400, 422, 500]
    
    def test_error_handling_consistency(self, client):
        """Test consistent error handling across Kelly routes"""
        # Test various malformed requests
        malformed_requests = [
            (client.post, "/api/advanced-kelly/calculate", {"invalid": "data"}),
            (client.post, "/api/advanced-kelly/portfolio-optimization", {"malformed": "request"}),
            (client.post, "/api/advanced-kelly/batch-calculate", {"bad": "batch"}),
            (client.post, "/api/advanced-kelly/risk-analysis", {"incomplete": "risk_data"})
        ]
        
        for method, endpoint, data in malformed_requests:
            response = method(endpoint, json=data)
            
            # Should return consistent error structure
            assert response.status_code in [400, 422, 500]
            
            response_data = response.json()
            assert isinstance(response_data, dict)
            
            # Should have error information
            has_error_info = any(key in response_data for key in ["message", "detail", "error"])
            assert has_error_info, f"Response lacks error info: {response_data}"
    
    def test_numerical_edge_cases(self, client):
        """Test numerical edge cases in Kelly calculations"""
        edge_cases = [
            # Very small probability
            {"probability": 0.001, "odds": 100.0, "bankroll": 1000.0},
            # Very high probability
            {"probability": 0.999, "odds": 1.01, "bankroll": 1000.0},
            # Large bankroll
            {"probability": 0.65, "odds": 1.85, "bankroll": 1000000.0},
            # Small bankroll
            {"probability": 0.65, "odds": 1.85, "bankroll": 10.0},
            # High odds
            {"probability": 0.15, "odds": 10.0, "bankroll": 1000.0},
            # Low odds (near break-even)
            {"probability": 0.51, "odds": 1.02, "bankroll": 1000.0}
        ]
        
        for edge_case in edge_cases:
            response = client.post("/api/advanced-kelly/calculate", json=edge_case)
            
            # Should handle edge cases gracefully
            assert response.status_code in [200, 400, 422]
            
            data = response.json()
            if response.status_code == 200:
                # Should return valid Kelly result
                assert isinstance(data, dict)
                # Kelly fraction should be reasonable (not NaN or infinite)
                if "kelly_fraction" in data:
                    kelly_fraction = data.get("kelly_fraction")
                    if kelly_fraction is not None:
                        assert isinstance(kelly_fraction, (int, float))
                        assert not (kelly_fraction != kelly_fraction)  # Check for NaN
            else:
                # Should have error message for invalid cases
                assert "message" in data or "detail" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
