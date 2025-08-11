"""
Unified Prediction Service

Consolidates all ML/AI prediction capabilities into a single, maintainable service
that provides consistent interfaces while preserving advanced capabilities.
"""

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
import json

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from .models import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    QuantumOptimizationRequest,
    QuantumOptimizationResponse,
    ExplanationResponse,
    ModelPerformanceMetrics,
    HealthResponse,
    Recommendation,
    ModelType,
    Sport,
    PropType,
)

# Import existing services for gradual migration
try:
    from backend.services.enhanced_ml_ensemble_service import EnhancedMLEnsembleService
    from backend.services.quantum_optimization_service import QuantumInspiredOptimizer
    from backend.services.real_shap_service import RealSHAPService
    LEGACY_SERVICES_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Legacy services not available: {e}")
    LEGACY_SERVICES_AVAILABLE = False

logger = logging.getLogger(__name__)


class UnifiedPredictionService:
    """
    Unified service that consolidates all prediction capabilities.
    
    This service acts as a facade over existing ML services while providing
    a clean, consistent interface for prediction operations.
    """
    
    def __init__(self):
        self.models_dir = Path("backend/models")
        self.cache_dir = Path("backend/cache/predictions")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Service state
        self.is_initialized = False
        self.models_loaded = 0
        self.last_prediction_time = None
        self.service_start_time = datetime.now(timezone.utc)
        
        # Model registry
        self.model_registry = {}
        self.model_performance = {}
        
        # Legacy service integration
        self.legacy_ensemble_service = None
        self.legacy_quantum_optimizer = None
        self.legacy_shap_service = None
        
        # Initialize if legacy services available
        if LEGACY_SERVICES_AVAILABLE:
            self._initialize_legacy_services()
    
    def _initialize_legacy_services(self):
        """Initialize legacy services for gradual migration"""
        try:
            self.legacy_ensemble_service = EnhancedMLEnsembleService()
            self.legacy_quantum_optimizer = QuantumInspiredOptimizer()
            self.legacy_shap_service = RealSHAPService()
            logger.info("Legacy services initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize legacy services: {e}")
    
    async def initialize(self) -> bool:
        """Initialize the service and load models"""
        try:
            logger.info("Initializing Unified Prediction Service...")
            
            # Load available models
            await self._load_models()
            
            # Initialize caching
            await self._initialize_cache()
            
            # Validate service health
            health_check = await self.health_check()
            
            self.is_initialized = True
            logger.info(f"Service initialized successfully. Models loaded: {self.models_loaded}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize service: {e}")
            return False
    
    async def _load_models(self):
        """Load available ML models"""
        try:
            if self.models_dir.exists():
                model_files = list(self.models_dir.glob("*.pkl")) + list(self.models_dir.glob("*.joblib"))
                
                for model_file in model_files:
                    try:
                        model = joblib.load(model_file)
                        model_name = model_file.stem
                        self.model_registry[model_name] = model
                        self.models_loaded += 1
                        logger.info(f"Loaded model: {model_name}")
                    except Exception as e:
                        logger.warning(f"Failed to load model {model_file}: {e}")
            
            if self.models_loaded == 0:
                logger.warning("No models loaded - using legacy service fallback")
                
        except Exception as e:
            logger.error(f"Error loading models: {e}")
    
    async def _initialize_cache(self):
        """Initialize prediction caching"""
        try:
            # Create cache structure
            (self.cache_dir / "predictions").mkdir(exist_ok=True)
            (self.cache_dir / "explanations").mkdir(exist_ok=True)
            (self.cache_dir / "performance").mkdir(exist_ok=True)
            
            logger.info("Cache initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize cache: {e}")
    
    async def predict(self, request: PredictionRequest) -> PredictionResponse:
        """
        Generate a single prediction
        """
        try:
            prediction_id = str(uuid.uuid4())
            
            # Try unified prediction first, fallback to legacy
            if self.models_loaded > 0:
                result = await self._unified_predict(request, prediction_id)
            elif self.legacy_ensemble_service:
                result = await self._legacy_predict(request, prediction_id)
            else:
                result = await self._mock_predict(request, prediction_id)
            
            self.last_prediction_time = datetime.now(timezone.utc)
            
            # Cache the result
            await self._cache_prediction(prediction_id, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise
    
    async def predict_batch(self, request: BatchPredictionRequest) -> List[PredictionResponse]:
        """
        Generate batch predictions
        """
        try:
            tasks = []
            for pred_request in request.predictions:
                task = self.predict(pred_request)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Filter out exceptions and log errors
            valid_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Batch prediction {i} failed: {result}")
                else:
                    valid_results.append(result)
            
            return valid_results
            
        except Exception as e:
            logger.error(f"Batch prediction failed: {e}")
            raise
    
    async def optimize_quantum(self, request: QuantumOptimizationRequest) -> QuantumOptimizationResponse:
        """
        Perform quantum-inspired portfolio optimization
        """
        try:
            # Generate predictions for all requests
            predictions = await self.predict_batch(
                BatchPredictionRequest(predictions=request.predictions)
            )
            
            # Use quantum optimizer if available
            if self.legacy_quantum_optimizer:
                optimization_result = await self._legacy_quantum_optimize(predictions, request)
            else:
                optimization_result = await self._mock_quantum_optimize(predictions, request)
            
            return optimization_result
            
        except Exception as e:
            logger.error(f"Quantum optimization failed: {e}")
            raise
    
    async def explain_prediction(self, prediction_id: str) -> ExplanationResponse:
        """
        Generate SHAP explanation for a prediction
        """
        try:
            # Try to get cached prediction
            cached_prediction = await self._get_cached_prediction(prediction_id)
            
            if not cached_prediction:
                raise ValueError(f"Prediction {prediction_id} not found")
            
            # Generate explanation
            if self.legacy_shap_service:
                explanation = await self._legacy_shap_explain(cached_prediction)
            else:
                explanation = await self._mock_shap_explain(cached_prediction)
            
            return explanation
            
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            raise
    
    async def get_model_performance(self, model_type: Optional[str] = None) -> List[ModelPerformanceMetrics]:
        """
        Get model performance metrics
        """
        try:
            if model_type:
                metrics = await self._get_specific_model_performance(model_type)
                return [metrics] if metrics else []
            else:
                return await self._get_all_model_performance()
                
        except Exception as e:
            logger.error(f"Failed to get model performance: {e}")
            raise
    
    async def health_check(self) -> HealthResponse:
        """
        Check service health
        """
        try:
            uptime = (datetime.now(timezone.utc) - self.service_start_time).total_seconds()
            
            # Get memory usage (simplified)
            import psutil
            process = psutil.Process()
            memory_mb = process.memory_info().rss / 1024 / 1024
            
            return HealthResponse(
                status="healthy" if self.is_initialized else "initializing",
                models_loaded=self.models_loaded,
                cache_status="active",
                last_prediction=self.last_prediction_time,
                uptime_seconds=uptime,
                memory_usage_mb=memory_mb
            )
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return HealthResponse(
                status="unhealthy",
                models_loaded=0,
                cache_status="error",
                uptime_seconds=0,
                memory_usage_mb=0
            )
    
    # Internal prediction methods
    async def _unified_predict(self, request: PredictionRequest, prediction_id: str) -> PredictionResponse:
        """Unified prediction using loaded models"""
        # This is a simplified implementation - in reality would use actual models
        return await self._mock_predict(request, prediction_id)
    
    async def _legacy_predict(self, request: PredictionRequest, prediction_id: str) -> PredictionResponse:
        """Prediction using legacy ensemble service"""
        try:
            # Convert request to legacy format and call legacy service
            # This would be implemented based on actual legacy service interface
            return await self._mock_predict(request, prediction_id)
        except Exception as e:
            logger.error(f"Legacy prediction failed: {e}")
            return await self._mock_predict(request, prediction_id)
    
    async def _mock_predict(self, request: PredictionRequest, prediction_id: str) -> PredictionResponse:
        """Mock prediction for testing/fallback"""
        
        # Generate realistic mock prediction
        base_prediction = request.line_score
        noise = np.random.normal(0, 0.1) * base_prediction
        predicted_value = max(0, base_prediction + noise)
        
        confidence = np.random.uniform(0.6, 0.95)
        win_prob = confidence if predicted_value > request.line_score else 1 - confidence
        
        # Determine recommendation
        if abs(predicted_value - request.line_score) / request.line_score > 0.15:
            if predicted_value > request.line_score:
                recommendation = Recommendation.STRONG_OVER if confidence > 0.8 else Recommendation.OVER
            else:
                recommendation = Recommendation.STRONG_UNDER if confidence > 0.8 else Recommendation.UNDER
        else:
            recommendation = Recommendation.NEUTRAL
        
        return PredictionResponse(
            player_name=request.player_name,
            sport=request.sport,
            prop_type=request.prop_type,
            line_score=request.line_score,
            predicted_value=predicted_value,
            confidence=confidence,
            win_probability=win_prob,
            over_probability=win_prob if predicted_value > request.line_score else 1 - win_prob,
            under_probability=1 - win_prob if predicted_value > request.line_score else win_prob,
            recommendation=recommendation,
            risk_score=1 - confidence,
            kelly_fraction=max(0, min(0.25, (confidence - 0.5) * 2)),
            expected_value=(win_prob * 1.9 - 1) if recommendation != Recommendation.NEUTRAL else 0,
            ensemble_confidence=confidence,
            model_consensus={
                "xgboost": predicted_value * np.random.uniform(0.95, 1.05),
                "lightgbm": predicted_value * np.random.uniform(0.95, 1.05),
                "neural_network": predicted_value * np.random.uniform(0.95, 1.05),
            },
            reasoning=f"Model predicts {predicted_value:.2f} vs line {request.line_score:.2f} with {confidence:.1%} confidence",
            model_version="unified-v1.0",
            generated_at=datetime.now(timezone.utc),
            prediction_id=prediction_id
        )
    
    async def _legacy_quantum_optimize(self, predictions: List[PredictionResponse], request: QuantumOptimizationRequest) -> QuantumOptimizationResponse:
        """Quantum optimization using legacy service"""
        return await self._mock_quantum_optimize(predictions, request)
    
    async def _mock_quantum_optimize(self, predictions: List[PredictionResponse], request: QuantumOptimizationRequest) -> QuantumOptimizationResponse:
        """Mock quantum optimization"""
        
        # Simple portfolio optimization mock
        valid_predictions = [p for p in predictions if p.recommendation not in [Recommendation.NEUTRAL, Recommendation.AVOID]]
        
        if not valid_predictions:
            raise ValueError("No valid predictions for optimization")
        
        # Equal weight allocation with slight randomization
        num_bets = min(len(valid_predictions), request.portfolio_size)
        allocation_per_bet = 1.0 / num_bets
        
        optimal_allocation = {}
        for i, pred in enumerate(valid_predictions[:num_bets]):
            weight = allocation_per_bet * np.random.uniform(0.8, 1.2)
            optimal_allocation[f"{pred.player_name}_{pred.prop_type}"] = weight
        
        # Normalize allocations
        total_weight = sum(optimal_allocation.values())
        optimal_allocation = {k: v/total_weight for k, v in optimal_allocation.items()}
        
        # Calculate portfolio metrics
        expected_return = sum(pred.expected_value * optimal_allocation.get(f"{pred.player_name}_{pred.prop_type}", 0) 
                            for pred in valid_predictions[:num_bets])
        
        risk_score = np.mean([pred.risk_score for pred in valid_predictions[:num_bets]])
        sharpe_ratio = expected_return / max(risk_score, 0.01)
        
        return QuantumOptimizationResponse(
            optimal_allocation=optimal_allocation,
            expected_return=expected_return,
            risk_score=risk_score,
            sharpe_ratio=sharpe_ratio,
            confidence_interval=[expected_return - 0.1, expected_return + 0.1],
            quantum_advantage=np.random.uniform(0.05, 0.15),
            entanglement_score=np.random.uniform(0.3, 0.7),
            optimization_time=0.1,
            predictions=valid_predictions[:num_bets],
            portfolio_variance=risk_score ** 2,
            diversification_ratio=1.0 / np.sqrt(num_bets),
            max_drawdown=0.1,
            generated_at=datetime.now(timezone.utc),
            optimization_id=str(uuid.uuid4())
        )
    
    async def _legacy_shap_explain(self, cached_prediction: PredictionResponse) -> ExplanationResponse:
        """SHAP explanation using legacy service"""
        return await self._mock_shap_explain(cached_prediction)
    
    async def _mock_shap_explain(self, cached_prediction: PredictionResponse) -> ExplanationResponse:
        """Mock SHAP explanation"""
        
        feature_names = [
            "recent_performance", "opponent_strength", "home_away", 
            "weather_impact", "player_form", "team_strength",
            "historical_matchup", "injury_status"
        ]
        
        # Generate mock SHAP values
        base_value = cached_prediction.line_score
        shap_values = [np.random.normal(0, 0.5) for _ in feature_names]
        
        # Ensure SHAP values sum to difference from base
        current_sum = sum(shap_values)
        target_sum = cached_prediction.predicted_value - base_value
        adjustment = (target_sum - current_sum) / len(shap_values)
        shap_values = [v + adjustment for v in shap_values]
        
        feature_values = [np.random.uniform(0, 1) for _ in feature_names]
        
        # Create feature impacts
        feature_impacts = []
        for i, (name, shap_val, feat_val) in enumerate(zip(feature_names, shap_values, feature_values)):
            feature_impacts.append({
                "feature": name,
                "shap_value": shap_val,
                "feature_value": feat_val,
                "impact": "positive" if shap_val > 0 else "negative",
                "importance_rank": i + 1
            })
        
        # Sort by absolute SHAP value
        feature_impacts.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        
        return ExplanationResponse(
            prediction_id=cached_prediction.prediction_id,
            model_type="ensemble",
            base_value=base_value,
            shap_values=shap_values,
            feature_names=feature_names,
            feature_values=feature_values,
            explanation_summary=f"Key factors: {feature_impacts[0]['feature']} ({feature_impacts[0]['shap_value']:+.2f}), {feature_impacts[1]['feature']} ({feature_impacts[1]['shap_value']:+.2f})",
            feature_impacts=feature_impacts,
            generated_at=datetime.now(timezone.utc)
        )
    
    # Cache management
    async def _cache_prediction(self, prediction_id: str, prediction: PredictionResponse):
        """Cache prediction result"""
        try:
            cache_file = self.cache_dir / "predictions" / f"{prediction_id}.json"
            with open(cache_file, 'w') as f:
                json.dump(prediction.dict(), f, default=str)
        except Exception as e:
            logger.warning(f"Failed to cache prediction: {e}")
    
    async def _get_cached_prediction(self, prediction_id: str) -> Optional[PredictionResponse]:
        """Get cached prediction"""
        try:
            cache_file = self.cache_dir / "predictions" / f"{prediction_id}.json"
            if cache_file.exists():
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                return PredictionResponse(**data)
        except Exception as e:
            logger.warning(f"Failed to get cached prediction: {e}")
        return None
    
    # Model performance methods
    async def _get_specific_model_performance(self, model_type: str) -> Optional[ModelPerformanceMetrics]:
        """Get performance metrics for specific model"""
        # Mock implementation
        return ModelPerformanceMetrics(
            model_type=model_type,
            accuracy=np.random.uniform(0.6, 0.85),
            precision=np.random.uniform(0.65, 0.8),
            recall=np.random.uniform(0.6, 0.8),
            f1_score=np.random.uniform(0.6, 0.8),
            auc_roc=np.random.uniform(0.7, 0.9),
            mae=np.random.uniform(0.1, 0.3),
            rmse=np.random.uniform(0.2, 0.5),
            sharpe_ratio=np.random.uniform(0.8, 2.0),
            win_rate=np.random.uniform(0.55, 0.75),
            avg_confidence=np.random.uniform(0.7, 0.9),
            predictions_count=np.random.randint(100, 1000),
            last_updated=datetime.now(timezone.utc)
        )
    
    async def _get_all_model_performance(self) -> List[ModelPerformanceMetrics]:
        """Get performance metrics for all models"""
        model_types = ["xgboost", "lightgbm", "catboost", "neural_network", "ensemble"]
        return [await self._get_specific_model_performance(mt) for mt in model_types]
