"""
Test Enhanced ML Routes - SHAP Explainability, Batch Optimization, Performance Logging
Tests all 15+ endpoints in enhanced_ml_routes.py with comprehensive scenarios
"""

import json
import time
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
from fastapi import status


class TestEnhancedMLRoutes:
    """Comprehensive tests for Enhanced ML API routes"""
    
    @pytest.fixture(autouse=True)
    async def setup(self):
        """Setup mocks for each test"""
        # Mock the enhanced prediction integration service
        self.mock_service = AsyncMock()
        
        # Default mock responses
        self.mock_single_prediction = {
            "request_id": "test-req-123",
            "prediction": 0.68,
            "confidence": 87.2,
            "models_used": ["xgboost", "random_forest"],
            "model_agreement": 0.89,
            "shap_explanations": {
                "feature_importance": {
                    "batting_average": 0.15,
                    "recent_performance": 0.22,
                    "opponent_strength": -0.08
                },
                "feature_values": {
                    "batting_average": 0.285,
                    "recent_performance": 0.65,
                    "opponent_strength": 0.72
                }
            },
            "performance_logged": True,
            "processing_time_ms": 245
        }
        
        self.mock_service.enhanced_predict_single.return_value = self.mock_single_prediction
        
        # Patch the service import
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', self.mock_service):
            yield
    
    
    # ============================================================================
    # Single Prediction Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_predict_single_success(self, client, mock_enhanced_prediction_integration):
        """Test successful single prediction with SHAP explanations"""
        
        # Mock the service
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            prediction_request = {
                "request_id": "test-req-123",
                "event_id": "game-662253",
                "sport": "MLB",
                "bet_type": "over_under", 
                "features": {
                    "batting_average": 0.285,
                    "recent_performance": 0.65,
                    "opponent_strength": 0.72
                },
                "include_explanations": True,
                "priority": 2
            }
            
            response = await client.post("/api/enhanced-ml/predict/single", json=prediction_request)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            # Check response structure
            assert "status" in data
            assert data["status"] == "success"
            assert "result" in data
            assert "timestamp" in data
            
            # Check prediction result
            result = data["result"]
            assert result["request_id"] == "test-req-123"
            assert "prediction" in result
            assert "confidence" in result
            assert "shap_explanations" in result
            assert "processing_time_ms" in result
            
            # Verify service was called correctly
            mock_enhanced_prediction_integration.enhanced_predict_single.assert_called_once()
    
    
    @pytest.mark.asyncio
    async def test_predict_single_missing_fields(self, client):
        """Test single prediction with missing required fields"""
        
        incomplete_request = {
            "request_id": "test-req-123",
            # Missing event_id, sport, bet_type, features
        }
        
        response = await client.post("/api/enhanced-ml/predict/single", json=incomplete_request)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        error_data = response.json()
        assert "detail" in error_data
    
    
    @pytest.mark.asyncio
    async def test_predict_single_invalid_priority(self, client):
        """Test single prediction with invalid priority value"""
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', AsyncMock()):
            
            prediction_request = {
                "request_id": "test-req-123",
                "event_id": "game-662253",
                "sport": "MLB", 
                "bet_type": "over_under",
                "features": {"batting_average": 0.285},
                "priority": 5  # Invalid: must be 1-3
            }
            
            response = await client.post("/api/enhanced-ml/predict/single", json=prediction_request)
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    
    # ============================================================================
    # Batch Prediction Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_batch_predict_success(self, client, mock_enhanced_prediction_integration):
        """Test successful batch predictions with optimization"""
        
        # Mock batch results
        mock_batch_results = [
            {"request_id": "batch-req-1", "prediction": 0.65, "confidence": 82.1},
            {"request_id": "batch-req-2", "prediction": 0.73, "confidence": 89.5}
        ]
        mock_enhanced_prediction_integration.batch_predict.return_value = mock_batch_results
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            batch_request = {
                "requests": [
                    {
                        "request_id": "batch-req-1",
                        "event_id": "game-1",
                        "sport": "MLB",
                        "bet_type": "over_under",
                        "features": {"batting_average": 0.285}
                    },
                    {
                        "request_id": "batch-req-2", 
                        "event_id": "game-2",
                        "sport": "MLB",
                        "bet_type": "over_under",
                        "features": {"batting_average": 0.305}
                    }
                ],
                "include_explanations": True
            }
            
            response = await client.post("/api/enhanced-ml/predict/batch", json=batch_request)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert "results" in data
            assert len(data["results"]) == 2
            assert "batch_id" in data
            assert "processing_time_ms" in data
            
            # Verify service was called
            mock_enhanced_prediction_integration.batch_predict.assert_called_once()
    
    
    @pytest.mark.asyncio 
    async def test_batch_predict_empty_requests(self, client):
        """Test batch prediction with empty request list"""
        
        batch_request = {
            "requests": [],
            "include_explanations": False
        }
        
        response = await client.post("/api/enhanced-ml/predict/batch", json=batch_request)
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    
    @pytest.mark.asyncio
    async def test_batch_predict_large_batch(self, client, mock_enhanced_prediction_integration):
        """Test batch prediction with large number of requests (performance)"""
        
        # Create 50 prediction requests
        requests = []
        for i in range(50):
            requests.append({
                "request_id": f"large-batch-{i}",
                "event_id": f"game-{i}",
                "sport": "MLB",
                "bet_type": "over_under", 
                "features": {"batting_average": 0.200 + (i * 0.002)}
            })
        
        # Mock batch results
        mock_results = [{"request_id": req["request_id"], "prediction": 0.6} for req in requests]
        mock_enhanced_prediction_integration.batch_predict.return_value = mock_results
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            batch_request = {
                "requests": requests,
                "include_explanations": False  # Disable for performance
            }
            
            response = await client.post("/api/enhanced-ml/predict/batch", json=batch_request)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert len(data["results"]) == 50
            assert "batch_optimization_used" in data
    
    
    # ============================================================================
    # Model Management Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_register_model_success(self, client, mock_enhanced_prediction_integration):
        """Test successful model registration"""
        
        mock_enhanced_prediction_integration.register_model.return_value = {
            "model_id": "model-123",
            "status": "registered",
            "version": "1.0"
        }
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            model_data = {
                "model_name": "test_xgboost_mlb",
                "sport": "MLB",
                "model_type": "xgboost",
                "model_version": "1.0",
                "feature_names": ["batting_average", "recent_performance"],
                "metadata": {"trained_on": "2025-data"}
            }
            
            response = await client.post("/api/enhanced-ml/models/register", json=model_data)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert "model_id" in data["result"]
    
    
    @pytest.mark.asyncio
    async def test_list_models_success(self, client, mock_enhanced_prediction_integration):
        """Test listing registered models"""
        
        mock_models = [
            {
                "model_id": "model-1",
                "model_name": "xgboost_mlb_v1",
                "sport": "MLB",
                "status": "active",
                "version": "1.0"
            },
            {
                "model_id": "model-2", 
                "model_name": "neural_net_nba_v2",
                "sport": "NBA",
                "status": "active",
                "version": "2.0"
            }
        ]
        
        mock_enhanced_prediction_integration.list_models.return_value = mock_models
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            response = await client.get("/api/enhanced-ml/models/list")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert "models" in data
            assert len(data["models"]) == 2
            assert data["models"][0]["model_name"] == "xgboost_mlb_v1"
    
    
    @pytest.mark.asyncio
    async def test_get_model_info(self, client, mock_enhanced_prediction_integration):
        """Test getting specific model information"""
        
        mock_model_info = {
            "model_id": "model-123",
            "model_name": "test_model",
            "sport": "MLB",
            "feature_names": ["batting_average", "recent_performance"],
            "performance_metrics": {
                "accuracy": 0.743,
                "precision": 0.712
            }
        }
        
        mock_enhanced_prediction_integration.get_model_info.return_value = mock_model_info
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            response = await client.get("/api/enhanced-ml/models/model-123")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert data["model"]["model_id"] == "model-123"
    
    
    # ============================================================================
    # Performance Monitoring Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_get_performance_metrics(self, client, mock_enhanced_prediction_integration):
        """Test getting performance metrics with filters"""
        
        mock_metrics = {
            "overall_stats": {
                "total_predictions": 15420,
                "accuracy": 0.743,
                "avg_confidence": 82.4,
                "avg_response_time_ms": 234
            },
            "model_breakdown": {
                "xgboost": {"accuracy": 0.751, "count": 8240},
                "random_forest": {"accuracy": 0.738, "count": 4890}, 
                "neural_network": {"accuracy": 0.729, "count": 2290}
            },
            "sport_breakdown": {
                "MLB": {"accuracy": 0.756, "count": 9830},
                "NBA": {"accuracy": 0.721, "count": 5590}
            }
        }
        
        mock_enhanced_prediction_integration.get_performance_metrics.return_value = mock_metrics
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            response = await client.post("/api/enhanced-ml/performance/metrics", json={
                "sport": "MLB",
                "window_size": 1000
            })
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert "overall_stats" in data["metrics"]
            assert "model_breakdown" in data["metrics"]
    
    
    @pytest.mark.asyncio
    async def test_update_prediction_outcome(self, client, mock_enhanced_prediction_integration):
        """Test updating prediction outcome for performance tracking"""
        
        mock_enhanced_prediction_integration.update_prediction_outcome.return_value = {
            "prediction_id": "pred-123",
            "outcome_recorded": True,
            "new_accuracy": 0.745
        }
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            outcome_update = {
                "prediction_id": "pred-123", 
                "actual_outcome": 1.0,
                "outcome_status": "correct"
            }
            
            response = await client.post("/api/enhanced-ml/performance/update-outcome", json=outcome_update)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert data["result"]["outcome_recorded"] == True
    
    
    # ============================================================================
    # Model Comparison Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_compare_models(self, client, mock_enhanced_prediction_integration):
        """Test model comparison functionality"""
        
        mock_comparison = {
            "sport": "MLB",
            "bet_type": "over_under",
            "models_compared": ["xgboost", "random_forest", "neural_network"],
            "comparison_metrics": {
                "accuracy": {
                    "xgboost": 0.751,
                    "random_forest": 0.738,
                    "neural_network": 0.729
                },
                "precision": {
                    "xgboost": 0.723,
                    "random_forest": 0.715,
                    "neural_network": 0.712
                }
            },
            "recommendation": "xgboost",
            "confidence_in_recommendation": 0.85
        }
        
        mock_enhanced_prediction_integration.compare_models.return_value = mock_comparison
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            comparison_request = {
                "sport": "MLB",
                "bet_type": "over_under",
                "metrics": ["accuracy", "precision"]
            }
            
            response = await client.post("/api/enhanced-ml/models/compare", json=comparison_request)
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert data["comparison"]["recommendation"] == "xgboost"
    
    
    # ============================================================================
    # Health and Status Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_health_check(self, client):
        """Test enhanced ML service health check"""
        
        response = await client.get("/api/enhanced-ml/health")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
        assert "dependencies" in data
    
    
    @pytest.mark.asyncio
    async def test_get_system_status(self, client, mock_enhanced_prediction_integration):
        """Test getting comprehensive system status"""
        
        mock_status = {
            "service_health": "healthy",
            "models_loaded": 3,
            "active_predictions": 12,
            "memory_usage": "2.1GB",
            "cpu_usage": "15%",
            "last_prediction": "2025-08-14T15:30:00Z"
        }
        
        mock_enhanced_prediction_integration.get_system_status.return_value = mock_status
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            response = await client.get("/api/enhanced-ml/status")
            
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            
            assert data["status"] == "success"
            assert data["system_status"]["service_health"] == "healthy"
    
    
    # ============================================================================
    # Error Handling Tests
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_predict_single_service_error(self, client, mock_enhanced_prediction_integration):
        """Test handling of service errors in single prediction"""
        
        # Mock service to raise an exception
        mock_enhanced_prediction_integration.enhanced_predict_single.side_effect = Exception("ML service unavailable")
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            prediction_request = {
                "request_id": "test-req-123",
                "event_id": "game-662253",
                "sport": "MLB",
                "bet_type": "over_under",
                "features": {"batting_average": 0.285}
            }
            
            response = await client.post("/api/enhanced-ml/predict/single", json=prediction_request)
            
            assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            
    
    @pytest.mark.asyncio
    async def test_invalid_endpoint_404(self, client):
        """Test 404 for invalid enhanced ML endpoints"""
        
        response = await client.get("/api/enhanced-ml/nonexistent-endpoint")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    
    # ============================================================================
    # Performance Tests  
    # ============================================================================
    
    @pytest.mark.asyncio
    async def test_predict_single_response_time(self, client, performance_timer, mock_enhanced_prediction_integration):
        """Test single prediction response time performance"""
        
        with patch('backend.routes.enhanced_ml_routes.enhanced_prediction_integration', mock_enhanced_prediction_integration):
            
            prediction_request = {
                "request_id": "perf-test-123",
                "event_id": "game-662253", 
                "sport": "MLB",
                "bet_type": "over_under",
                "features": {"batting_average": 0.285},
                "timeout": 5.0
            }
            
            performance_timer.start()
            response = await client.post("/api/enhanced-ml/predict/single", json=prediction_request)
            elapsed = performance_timer.stop()
            
            assert response.status_code == status.HTTP_200_OK
            assert elapsed < 1.0  # Should respond within 1 second
            
            data = response.json()
            assert "processing_time_ms" in data["result"]
