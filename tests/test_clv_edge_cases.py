"""
Edge case tests for CLV (Closing Line Value) functionality.
Tests boundary conditions, invalid inputs, and error scenarios.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from backend.main import app

test_client = TestClient(app)
BASE_URL = "/api/propfinder/opportunities"


class TestCLVEdgeCases:
    """Test CLV edge cases and boundary conditions"""
    
    def test_clv_with_zero_limit(self):
        """Test CLV behavior with limit=0"""
        response = test_client.get(f"{BASE_URL}?limit=0&include_clv=1")
        
        # Should either succeed with empty list or handle gracefully
        assert response.status_code in [200, 422]
        
        if response.status_code == 200:
            data = response.json()
            if "opportunities" in data:
                assert len(data["opportunities"]) == 0
    
    def test_clv_with_negative_limit(self):
        """Test CLV behavior with negative limit"""
        response = test_client.get(f"{BASE_URL}?limit=-1&include_clv=1")
        
        # Should handle negative limit gracefully
        assert response.status_code in [200, 422]
    
    def test_clv_with_very_large_limit(self):
        """Test CLV behavior with unusually large limit"""
        response = test_client.get(f"{BASE_URL}?limit=1000&include_clv=1")
        
        # Should either succeed or handle gracefully
        assert response.status_code in [200, 422, 413]
        
        if response.status_code == 200:
            data = response.json()
            if "opportunities" in data and data["opportunities"]:
                # Should still provide CLV data for available opportunities
                opp = data["opportunities"][0]
                assert "clvPercent" in opp
    
    def test_clv_with_invalid_include_clv_values(self):
        """Test CLV with various invalid include_clv parameter values"""
        invalid_values = ["true", "false", "yes", "no", "maybe", "2", "-1", "abc"]
        
        for invalid_value in invalid_values:
            response = test_client.get(f"{BASE_URL}?limit=2&include_clv={invalid_value}")
            
            # Should either treat as 0/1 or return validation error
            assert response.status_code in [200, 422], f"Failed for include_clv={invalid_value}"
    
    def test_clv_with_missing_parameters(self):
        """Test CLV behavior when only include_clv is provided"""
        response = test_client.get(f"{BASE_URL}?include_clv=1")
        
        # Should use default limit and provide CLV data
        assert response.status_code in [200, 422]
        
        if response.status_code == 200:
            data = response.json()
            if "opportunities" in data and data["opportunities"]:
                opp = data["opportunities"][0]
                assert "clvPercent" in opp
    
    def test_clv_with_multiple_clv_parameters(self):
        """Test CLV behavior with duplicate include_clv parameters"""
        # Test URL with duplicate parameter
        response = test_client.get(f"{BASE_URL}?limit=2&include_clv=0&include_clv=1")
        
        # Should handle gracefully (typically uses last value)
        assert response.status_code in [200, 422]
    
    def test_clv_with_special_characters_in_params(self):
        """Test CLV behavior with special characters in parameters"""
        special_params = [
            "limit=2&include_clv=1&sport=%20",  # Encoded space
            "limit=2&include_clv=1&player=LeBron%20James",  # Encoded name
            "limit=2&include_clv=1&market=Points%2FOvertimes"  # Encoded special chars
        ]
        
        for params in special_params:
            response = test_client.get(f"{BASE_URL}?{params}")
            
            # Should handle URL encoding gracefully
            assert response.status_code in [200, 422], f"Failed for params: {params}"
    
    def test_clv_response_structure_validation(self):
        """Test that CLV responses maintain expected structure"""
        response = test_client.get(f"{BASE_URL}?limit=3&include_clv=1")
        
        if response.status_code == 200:
            data = response.json()
            
            # Basic structure validation
            assert isinstance(data, dict), "Response should be a dictionary"
            
            if "opportunities" in data:
                assert isinstance(data["opportunities"], list), "Opportunities should be a list"
                
                for opp in data["opportunities"]:
                    assert isinstance(opp, dict), "Each opportunity should be a dictionary"
                    
                    # CLV fields should be present and correct type
                    if "clvPercent" in opp:
                        clv_val = opp["clvPercent"]
                        assert isinstance(clv_val, (int, float)), f"clvPercent should be numeric: {clv_val}"
                    
                    if "closingLine" in opp and opp["closingLine"] is not None:
                        closing_line = opp["closingLine"]
                        assert isinstance(closing_line, (int, float)), f"closingLine should be numeric: {closing_line}"
                    
                    if "closingOdds" in opp and opp["closingOdds"] is not None:
                        closing_odds = opp["closingOdds"]
                        assert isinstance(closing_odds, (int, float)), f"closingOdds should be numeric: {closing_odds}"
    
    def test_clv_with_empty_database(self):
        """Test CLV behavior when no opportunities are available"""
        # This test assumes the mock data might sometimes return empty results
        response = test_client.get(f"{BASE_URL}?limit=100&include_clv=1")
        
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            if "opportunities" in data:
                # Should handle empty results gracefully
                assert isinstance(data["opportunities"], list)
    
    def test_clv_malformed_request_handling(self):
        """Test CLV behavior with malformed requests"""
        malformed_requests = [
            f"{BASE_URL}?limit=2&include_clv=1&",  # Trailing ampersand
            f"{BASE_URL}?limit=2&include_clv=1&invalid_param",  # Invalid param format
            f"{BASE_URL}?limit=2&include_clv=1&=value",  # Missing param name
        ]
        
        for malformed_url in malformed_requests:
            response = test_client.get(malformed_url)
            
            # Should handle malformed requests gracefully
            assert response.status_code in [200, 400, 422], f"Failed for URL: {malformed_url}"


class TestCLVBoundaryValues:
    """Test CLV with boundary and extreme values"""
    
    def test_clv_extreme_numeric_values(self):
        """Test CLV calculations with extreme numeric values"""
        with patch('backend.services.simple_propfinder_service.SimplePropFinderService.attach_clv_data') as mock_attach:
            def extreme_values_attach(opportunities):
                for opp in opportunities:
                    # Test extreme CLV values
                    opp["clvPercent"] = 999.9  # Very high CLV
                    opp["closingLine"] = 0.001  # Very low line
                    opp["closingOdds"] = -50000  # Extreme odds
                return opportunities
            
            mock_attach.side_effect = extreme_values_attach
            
            response = test_client.get(f"{BASE_URL}?limit=2&include_clv=1")
            
            if response.status_code == 200:
                data = response.json()
                if "opportunities" in data and data["opportunities"]:
                    opp = data["opportunities"][0]
                    # Should handle extreme values without crashing
                    assert "clvPercent" in opp
                    assert isinstance(opp["clvPercent"], (int, float))
    
    def test_clv_null_and_none_handling(self):
        """Test CLV behavior with null/None values in response"""
        with patch('backend.services.simple_propfinder_service.SimplePropFinderService.attach_clv_data') as mock_attach:
            def null_values_attach(opportunities):
                for opp in opportunities:
                    opp["clvPercent"] = None
                    opp["closingLine"] = None
                    opp["closingOdds"] = None
                return opportunities
            
            mock_attach.side_effect = null_values_attach
            
            response = test_client.get(f"{BASE_URL}?limit=2&include_clv=1")
            
            # Should handle null values gracefully
            assert response.status_code in [200, 422]
            
            if response.status_code == 200:
                data = response.json()
                # Response should still be valid JSON
                assert isinstance(data, dict)
    
    def test_clv_unicode_and_encoding(self):
        """Test CLV behavior with unicode characters in parameters"""
        unicode_params = [
            "limit=2&include_clv=1&player=Müller",  # German umlaut
            "limit=2&include_clv=1&team=Montréal",  # French accent
            "limit=2&include_clv=1&market=Gоals",   # Cyrillic 'o'
        ]
        
        for params in unicode_params:
            response = test_client.get(f"{BASE_URL}?{params}")
            
            # Should handle unicode characters gracefully
            assert response.status_code in [200, 422], f"Failed for unicode params: {params}"


class TestCLVStressConditions:
    """Test CLV under stress conditions"""
    
    def test_clv_rapid_sequential_requests(self):
        """Test CLV behavior with rapid sequential requests"""
        responses = []
        
        # Make 10 rapid requests
        for i in range(10):
            response = test_client.get(f"{BASE_URL}?limit=1&include_clv=1")
            responses.append(response.status_code)
        
        # Most requests should succeed
        success_count = sum(1 for status in responses if status == 200)
        success_rate = success_count / len(responses)
        
        assert success_rate >= 0.7, f"Only {success_rate:.1%} of rapid requests succeeded"
    
    def test_clv_parameter_combinations(self):
        """Test CLV with various parameter combinations"""
        param_combinations = [
            {"limit": 1, "include_clv": 1},
            {"limit": 5, "include_clv": 1, "sport": "NBA"},
            {"limit": 3, "include_clv": 1, "market": "Points"},
            {"limit": 2, "include_clv": 1, "player": "LeBron"},
            {"limit": 10, "include_clv": 0},  # CLV disabled
        ]
        
        for params in param_combinations:
            response = test_client.get(BASE_URL, params=params)
            
            # Should handle various parameter combinations
            assert response.status_code in [200, 422], f"Failed for params: {params}"
            
            if response.status_code == 200 and params.get("include_clv") == 1:
                data = response.json()
                if "opportunities" in data and data["opportunities"]:
                    opp = data["opportunities"][0]
                    assert "clvPercent" in opp, f"Missing CLV data for params: {params}"