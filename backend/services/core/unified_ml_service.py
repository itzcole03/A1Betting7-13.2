"""
Unified ML Service - Optimized machine learning inference service
Phase 2: AI/ML Infrastructure Enhancement

Consolidates and optimizes:
- enhanced_ml_service.py
- modern_ml_service.py  
- advanced_ml_service.py
- model_service.py
- enhanced_model_service.py

Key optimizations:
- Model quantization and compilation
- Parallel inference processing
- Advanced caching strategies
- Real-time performance monitoring
- Dynamic ensemble weighting
"""

import asyncio
import logging
import time
import pickle
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Union, Tuple, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field, asdict
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from threading import Lock
import warnings
warnings.filterwarnings('ignore')

# ML Libraries
try:
    import torch
    import torch.nn as nn
    from torch.quantization import quantize_dynamic
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

from .unified_cache_service import UnifiedCacheService, CacheLevel, get_cache

logger = logging.getLogger(__name__)

class ModelType(Enum):
    """Supported model types"""
    XGBOOST = "xgboost"
    RANDOM_FOREST = "random_forest"
    GRADIENT_BOOSTING = "gradient_boosting"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"
    LSTM = "lstm"
    TRANSFORMER = "transformer"

class SportType(Enum):
    """Supported sports"""
    MLB = "mlb"
    NFL = "nfl"
    NBA = "nba"
    NHL = "nhl"

class OptimizationLevel(Enum):
    """Model optimization levels"""
    NONE = "none"
    BASIC = "basic"
    ADVANCED = "advanced"
    MAXIMUM = "maximum"

@dataclass
class ModelConfig:
    """Configuration for ML models"""
    model_type: ModelType
    sport: SportType
    version: str = "1.0.0"
    optimization_level: OptimizationLevel = OptimizationLevel.BASIC
    quantization_enabled: bool = True
    compilation_enabled: bool = True
    batch_size: int = 32
    max_memory_mb: int = 512
    cache_predictions: bool = True
    cache_ttl: int = 3600
    parallel_inference: bool = True
    max_workers: int = 4
    
@dataclass
class PredictionRequest:
    """Prediction request structure"""
    player_id: str
    features: Dict[str, Any]
    sport: SportType
    prop_type: str
    model_preferences: Optional[List[ModelType]] = None
    explain: bool = False
    confidence_required: bool = True
    
@dataclass
class PredictionResult:
    """Prediction result structure"""
    prediction: float
    confidence: float
    model_type: ModelType
    sport: SportType
    explanation: Optional[Dict[str, Any]] = None
    feature_importance: Optional[Dict[str, float]] = None
    ensemble_weights: Optional[Dict[str, float]] = None
    inference_time_ms: float = 0.0
    cache_hit: bool = False
    
@dataclass
class ModelMetrics:
    """Model performance metrics"""
    model_type: ModelType
    sport: SportType
    total_predictions: int = 0
    successful_predictions: int = 0
    failed_predictions: int = 0
    avg_inference_time: float = 0.0
    accuracy_score: float = 0.0
    mse: float = 0.0
    mae: float = 0.0
    r2: float = 0.0
    last_updated: datetime = field(default_factory=datetime.now)
    
    @property
    def success_rate(self) -> float:
        if self.total_predictions == 0:
            return 0.0
        return self.successful_predictions / self.total_predictions

class ModelCache:
    """Optimized model caching with memory management"""
    
    def __init__(self, max_memory_mb: int = 1024):
        self.max_memory_mb = max_memory_mb
        self.models: Dict[str, Any] = {}
        self.access_times: Dict[str, datetime] = {}
        self.memory_usage: Dict[str, float] = {}
        self.lock = Lock()
        
    def get_model(self, key: str) -> Optional[Any]:
        """Get model from cache"""
        with self.lock:
            if key in self.models:
                self.access_times[key] = datetime.now()
                return self.models[key]
            return None
    
    def set_model(self, key: str, model: Any, memory_mb: float):
        """Set model in cache with memory management"""
        with self.lock:
            # Check if we need to evict models
            while self._get_total_memory() + memory_mb > self.max_memory_mb:
                self._evict_lru_model()
            
            self.models[key] = model
            self.access_times[key] = datetime.now()
            self.memory_usage[key] = memory_mb
    
    def _get_total_memory(self) -> float:
        """Get total memory usage"""
        return sum(self.memory_usage.values())
    
    def _evict_lru_model(self):
        """Evict least recently used model"""
        if not self.access_times:
            return
            
        lru_key = min(self.access_times.keys(), key=lambda k: self.access_times[k])
        del self.models[lru_key]
        del self.access_times[lru_key]
        del self.memory_usage[lru_key]

class BaseModel:
    """Base class for ML models with optimization features"""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.model = None
        self.scaler = None
        self.feature_names = []
        self.is_trained = False
        self.is_optimized = False
        self.metrics = ModelMetrics(
            model_type=config.model_type,
            sport=config.sport
        )
        
    async def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]):
        """Train the model"""
        raise NotImplementedError
        
    async def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        raise NotImplementedError
        
    async def predict_with_confidence(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Make predictions with confidence scores"""
        predictions = await self.predict(X)
        # Default confidence calculation based on model variance
        confidences = np.full_like(predictions, 0.8)  # Default 80% confidence
        return predictions, confidences
        
    def optimize_model(self):
        """Optimize model for production inference"""
        if self.is_optimized:
            return
            
        start_time = time.time()
        
        try:
            if self.config.optimization_level == OptimizationLevel.NONE:
                return
                
            # Apply quantization if supported and enabled
            if (self.config.quantization_enabled and 
                TORCH_AVAILABLE and 
                hasattr(self.model, 'eval')):
                self._apply_quantization()
                
            # Apply compilation if supported and enabled  
            if (self.config.compilation_enabled and
                hasattr(self.model, 'eval')):
                self._apply_compilation()
                
            self.is_optimized = True
            optimization_time = time.time() - start_time
            logger.info(f"Model optimization completed in {optimization_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Model optimization failed: {e}")
            
    def _apply_quantization(self):
        """Apply dynamic quantization to reduce model size"""
        try:
            if hasattr(self.model, 'eval'):
                self.model.eval()
                quantized_model = quantize_dynamic(
                    self.model,
                    {nn.Linear},
                    dtype=torch.qint8
                )
                self.model = quantized_model
                logger.info("Dynamic quantization applied successfully")
        except Exception as e:
            logger.warning(f"Quantization failed: {e}")
            
    def _apply_compilation(self):
        """Apply TorchScript compilation for faster inference"""
        try:
            if hasattr(self.model, 'eval'):
                self.model.eval()
                # Use tracing for compilation
                dummy_input = torch.randn(1, len(self.feature_names))
                compiled_model = torch.jit.trace(self.model, dummy_input)
                self.model = compiled_model
                logger.info("TorchScript compilation applied successfully")
        except Exception as e:
            logger.warning(f"Compilation failed: {e}")

class XGBoostModel(BaseModel):
    """Optimized XGBoost model implementation"""
    
    async def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]):
        """Train XGBoost model with optimized parameters"""
        self.feature_names = feature_names
        
        # Optimized XGBoost parameters for production
        params = {
            'objective': 'reg:squarederror',
            'max_depth': 6,
            'learning_rate': 0.1,
            'n_estimators': 100,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'n_jobs': -1,  # Use all available cores
            'tree_method': 'hist',  # Faster training
            'enable_categorical': True
        }
        
        if XGBOOST_AVAILABLE:
            self.model = xgb.XGBRegressor(**params)
            self.model.fit(X, y)
            self.is_trained = True
        else:
            raise ImportError("XGBoost not available")
            
    async def predict(self, X: np.ndarray) -> np.ndarray:
        """Make optimized predictions"""
        if not self.is_trained:
            raise ValueError("Model not trained")
            
        # Use batch prediction for efficiency
        return self.model.predict(X)
        
    async def predict_with_confidence(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Predict with confidence using leaf predictions"""
        predictions = await self.predict(X)
        
        # Calculate confidence using leaf predictions variance
        try:
            # Get leaf predictions for uncertainty estimation
            leaf_preds = self.model.apply(X)
            # Calculate variance across trees as confidence proxy
            confidences = 1.0 / (1.0 + np.var(leaf_preds, axis=1))
            confidences = np.clip(confidences, 0.1, 0.95)
        except:
            # Fallback to default confidence
            confidences = np.full_like(predictions, 0.8)
            
        return predictions, confidences

class NeuralNetworkModel(BaseModel):
    """Optimized PyTorch neural network model"""
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
    async def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]):
        """Train neural network with optimization"""
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch not available")
            
        self.feature_names = feature_names
        input_size = X.shape[1]
        
        # Create optimized neural network architecture
        self.model = nn.Sequential(
            nn.Linear(input_size, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        ).to(self.device)
        
        # Standardize features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Convert to tensors
        X_tensor = torch.FloatTensor(X_scaled).to(self.device)
        y_tensor = torch.FloatTensor(y.reshape(-1, 1)).to(self.device)
        
        # Training with optimization
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        criterion = nn.MSELoss()
        
        self.model.train()
        for epoch in range(100):
            optimizer.zero_grad()
            outputs = self.model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            
        self.is_trained = True
        
        # Apply optimization after training
        self.optimize_model()
        
    async def predict(self, X: np.ndarray) -> np.ndarray:
        """Make optimized predictions"""
        if not self.is_trained:
            raise ValueError("Model not trained")
            
        self.model.eval()
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        X_tensor = torch.FloatTensor(X_scaled).to(self.device)
        
        with torch.no_grad():
            predictions = self.model(X_tensor)
            
        return predictions.cpu().numpy().flatten()

class EnsembleModel(BaseModel):
    """Advanced ensemble model with dynamic weighting"""
    
    def __init__(self, config: ModelConfig):
        super().__init__(config)
        self.base_models: List[BaseModel] = []
        self.model_weights: Dict[str, float] = {}
        self.performance_history: Dict[str, List[float]] = {}
        
    def add_model(self, model: BaseModel, weight: float = 1.0):
        """Add model to ensemble"""
        self.base_models.append(model)
        model_key = f"{model.config.model_type.value}_{len(self.base_models)}"
        self.model_weights[model_key] = weight
        self.performance_history[model_key] = []
        
    async def train(self, X: np.ndarray, y: np.ndarray, feature_names: List[str]):
        """Train all models in ensemble"""
        self.feature_names = feature_names
        
        # Train all base models in parallel
        tasks = []
        for model in self.base_models:
            task = asyncio.create_task(model.train(X, y, feature_names))
            tasks.append(task)
            
        await asyncio.gather(*tasks)
        self.is_trained = True
        
    async def predict(self, X: np.ndarray) -> np.ndarray:
        """Make ensemble predictions with dynamic weighting"""
        if not self.is_trained:
            raise ValueError("Ensemble not trained")
            
        # Get predictions from all models in parallel
        prediction_tasks = []
        for model in self.base_models:
            task = asyncio.create_task(model.predict(X))
            prediction_tasks.append(task)
            
        all_predictions = await asyncio.gather(*prediction_tasks)
        
        # Apply dynamic weighting
        weighted_predictions = np.zeros_like(all_predictions[0])
        total_weight = 0.0
        
        for i, (model_key, weight) in enumerate(self.model_weights.items()):
            # Adjust weight based on recent performance
            adjusted_weight = self._get_adjusted_weight(model_key, weight)
            weighted_predictions += adjusted_weight * all_predictions[i]
            total_weight += adjusted_weight
            
        return weighted_predictions / total_weight if total_weight > 0 else weighted_predictions
        
    async def predict_with_confidence(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Ensemble predictions with confidence from model agreement"""
        if not self.is_trained:
            raise ValueError("Ensemble not trained")
            
        # Get predictions and confidences from all models
        prediction_tasks = []
        confidence_tasks = []
        
        for model in self.base_models:
            pred_task = asyncio.create_task(model.predict(X))
            conf_task = asyncio.create_task(model.predict_with_confidence(X))
            prediction_tasks.append(pred_task)
            confidence_tasks.append(conf_task)
            
        all_predictions = await asyncio.gather(*prediction_tasks)
        all_confidences = await asyncio.gather(*confidence_tasks)
        
        # Calculate ensemble prediction
        ensemble_predictions = await self.predict(X)
        
        # Calculate confidence based on model agreement
        prediction_matrix = np.array(all_predictions)
        prediction_std = np.std(prediction_matrix, axis=0)
        
        # Higher agreement (lower std) = higher confidence
        max_std = np.max(prediction_std) if len(prediction_std) > 0 else 1.0
        confidences = 1.0 - (prediction_std / max_std)
        confidences = np.clip(confidences, 0.1, 0.95)
        
        return ensemble_predictions, confidences
        
    def _get_adjusted_weight(self, model_key: str, base_weight: float) -> float:
        """Get dynamically adjusted weight based on recent performance"""
        if model_key not in self.performance_history:
            return base_weight
            
        recent_performance = self.performance_history[model_key][-10:]  # Last 10 predictions
        if not recent_performance:
            return base_weight
            
        # Adjust weight based on recent accuracy
        avg_performance = np.mean(recent_performance)
        adjustment_factor = min(2.0, max(0.1, avg_performance / 0.8))  # Scale around 80% baseline
        
        return base_weight * adjustment_factor

class UnifiedMLService:
    """
    Unified ML service with advanced optimization and performance features.
    Provides model management, inference optimization, and real-time monitoring.
    """
    
    def __init__(self, cache_service: Optional[UnifiedCacheService] = None):
        self.cache_service = cache_service
        self.model_cache = ModelCache(max_memory_mb=2048)
        self.models: Dict[str, BaseModel] = {}
        self.executor = ThreadPoolExecutor(max_workers=8)
        self.process_executor = ProcessPoolExecutor(max_workers=4)
        self.metrics: Dict[str, ModelMetrics] = {}
        self.lock = asyncio.Lock()
        
    async def initialize(self):
        """Initialize the ML service"""
        if self.cache_service is None:
            self.cache_service = await get_cache()
            
        # Initialize default models for each sport
        await self._initialize_default_models()
        
        logger.info("Unified ML Service initialized with optimization features")
        
    async def close(self):
        """Close the ML service"""
        self.executor.shutdown(wait=True)
        self.process_executor.shutdown(wait=True)
        
    async def _initialize_default_models(self):
        """Initialize default optimized models for each sport"""
        sports = [SportType.MLB, SportType.NFL, SportType.NBA, SportType.NHL]
        
        for sport in sports:
            # Create ensemble model for each sport
            ensemble_config = ModelConfig(
                model_type=ModelType.ENSEMBLE,
                sport=sport,
                optimization_level=OptimizationLevel.ADVANCED,
                parallel_inference=True
            )
            
            ensemble = EnsembleModel(ensemble_config)
            
            # Add optimized base models to ensemble
            if XGBOOST_AVAILABLE:
                xgb_config = ModelConfig(
                    model_type=ModelType.XGBOOST,
                    sport=sport,
                    optimization_level=OptimizationLevel.BASIC
                )
                xgb_model = XGBoostModel(xgb_config)
                ensemble.add_model(xgb_model, weight=1.0)
                
            if TORCH_AVAILABLE:
                nn_config = ModelConfig(
                    model_type=ModelType.NEURAL_NETWORK,
                    sport=sport,
                    optimization_level=OptimizationLevel.ADVANCED
                )
                nn_model = NeuralNetworkModel(nn_config)
                ensemble.add_model(nn_model, weight=1.2)  # Slightly higher weight for NN
                
            model_key = f"{sport.value}_ensemble"
            self.models[model_key] = ensemble
            
            # Initialize metrics
            self.metrics[model_key] = ModelMetrics(
                model_type=ModelType.ENSEMBLE,
                sport=sport
            )
            
    async def predict(self, request: PredictionRequest) -> PredictionResult:
        """Make optimized prediction with caching and monitoring"""
        start_time = time.time()
        
        try:
            # Generate cache key
            cache_key = self._generate_cache_key(request)
            
            # Try cache first
            if self.cache_service and request.model_preferences != [ModelType.ENSEMBLE]:
                cached_result = await self.cache_service.get(cache_key)
                if cached_result:
                    cached_result['cache_hit'] = True
                    cached_result['inference_time_ms'] = (time.time() - start_time) * 1000
                    return PredictionResult(**cached_result)
            
            # Get appropriate model
            model = await self._get_model(request.sport, request.model_preferences)
            if not model:
                raise ValueError(f"No model available for sport: {request.sport}")
                
            # Prepare features
            feature_array = self._prepare_features(request.features, model.feature_names)
            
            # Make prediction with confidence
            if request.confidence_required:
                prediction, confidence = await model.predict_with_confidence(feature_array.reshape(1, -1))
                prediction = prediction[0]
                confidence = confidence[0]
            else:
                prediction = await model.predict(feature_array.reshape(1, -1))
                prediction = prediction[0]
                confidence = 0.8  # Default confidence
                
            # Generate explanation if requested
            explanation = None
            feature_importance = None
            if request.explain and SHAP_AVAILABLE:
                explanation, feature_importance = await self._generate_explanation(
                    model, feature_array, request.features
                )
                
            # Create result
            result = PredictionResult(
                prediction=float(prediction),
                confidence=float(confidence),
                model_type=model.config.model_type,
                sport=request.sport,
                explanation=explanation,
                feature_importance=feature_importance,
                inference_time_ms=(time.time() - start_time) * 1000,
                cache_hit=False
            )
            
            # Cache result
            if self.cache_service:
                await self.cache_service.set(
                    cache_key, 
                    asdict(result), 
                    ttl=3600,
                    level=CacheLevel.REDIS
                )
                
            # Update metrics
            await self._update_metrics(model, True, time.time() - start_time)
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            
            # Update metrics for failure
            model_key = f"{request.sport.value}_ensemble"
            if model_key in self.metrics:
                await self._update_metrics(self.models.get(model_key), False, time.time() - start_time)
                
            raise e
            
    async def predict_batch(self, requests: List[PredictionRequest]) -> List[PredictionResult]:
        """Make batch predictions with parallel processing"""
        if not requests:
            return []
            
        # Group requests by sport for optimal batching
        sport_groups = {}
        for i, request in enumerate(requests):
            sport = request.sport
            if sport not in sport_groups:
                sport_groups[sport] = []
            sport_groups[sport].append((i, request))
            
        # Process each sport group in parallel
        tasks = []
        for sport, grouped_requests in sport_groups.items():
            task = asyncio.create_task(
                self._process_sport_batch(sport, grouped_requests)
            )
            tasks.append(task)
            
        # Collect results
        all_results = await asyncio.gather(*tasks)
        
        # Merge and sort results by original order
        final_results = [None] * len(requests)
        for sport_results in all_results:
            for original_idx, result in sport_results:
                final_results[original_idx] = result
                
        return final_results
        
    async def _process_sport_batch(self, sport: SportType, 
                                 grouped_requests: List[Tuple[int, PredictionRequest]]) -> List[Tuple[int, PredictionResult]]:
        """Process batch of requests for a specific sport"""
        results = []
        
        # Get model for sport
        model = await self._get_model(sport)
        if not model:
            # Return error results
            for original_idx, request in grouped_requests:
                error_result = PredictionResult(
                    prediction=0.0,
                    confidence=0.0,
                    model_type=ModelType.ENSEMBLE,
                    sport=sport,
                    inference_time_ms=0.0
                )
                results.append((original_idx, error_result))
            return results
            
        # Prepare batch features
        batch_features = []
        for _, request in grouped_requests:
            feature_array = self._prepare_features(request.features, model.feature_names)
            batch_features.append(feature_array)
            
        batch_array = np.array(batch_features)
        
        # Make batch prediction
        start_time = time.time()
        predictions, confidences = await model.predict_with_confidence(batch_array)
        inference_time = (time.time() - start_time) * 1000
        
        # Create results
        for i, (original_idx, request) in enumerate(grouped_requests):
            result = PredictionResult(
                prediction=float(predictions[i]),
                confidence=float(confidences[i]),
                model_type=model.config.model_type,
                sport=sport,
                inference_time_ms=inference_time / len(grouped_requests)  # Distribute time
            )
            results.append((original_idx, result))
            
        return results
        
    async def train_model(self, sport: SportType, model_type: ModelType, 
                         training_data: Dict[str, Any]) -> bool:
        """Train or retrain a model"""
        try:
            # Create model config
            config = ModelConfig(
                model_type=model_type,
                sport=sport,
                optimization_level=OptimizationLevel.ADVANCED
            )
            
            # Create model instance
            if model_type == ModelType.XGBOOST:
                model = XGBoostModel(config)
            elif model_type == ModelType.NEURAL_NETWORK:
                model = NeuralNetworkModel(config)
            elif model_type == ModelType.ENSEMBLE:
                model = EnsembleModel(config)
                # Add base models to ensemble
                if XGBOOST_AVAILABLE:
                    xgb_model = XGBoostModel(ModelConfig(ModelType.XGBOOST, sport))
                    model.add_model(xgb_model)
                if TORCH_AVAILABLE:
                    nn_model = NeuralNetworkModel(ModelConfig(ModelType.NEURAL_NETWORK, sport))
                    model.add_model(nn_model)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
                
            # Extract training data
            X = np.array(training_data['features'])
            y = np.array(training_data['targets'])
            feature_names = training_data.get('feature_names', [f"feature_{i}" for i in range(X.shape[1])])
            
            # Train model
            await model.train(X, y, feature_names)
            
            # Store model
            model_key = f"{sport.value}_{model_type.value}"
            self.models[model_key] = model
            
            # Initialize metrics
            self.metrics[model_key] = ModelMetrics(
                model_type=model_type,
                sport=sport
            )
            
            logger.info(f"Model trained successfully: {model_key}")
            return True
            
        except Exception as e:
            logger.error(f"Model training failed: {e}")
            return False
            
    async def get_model_metrics(self, sport: Optional[SportType] = None) -> Dict[str, Any]:
        """Get performance metrics for models"""
        if sport:
            # Get metrics for specific sport
            sport_metrics = {}
            for key, metrics in self.metrics.items():
                if metrics.sport == sport:
                    sport_metrics[key] = asdict(metrics)
            return sport_metrics
        else:
            # Get all metrics
            all_metrics = {}
            for key, metrics in self.metrics.items():
                all_metrics[key] = asdict(metrics)
            return all_metrics
            
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on ML service"""
        health_status = {
            "service_status": "healthy",
            "models_loaded": len(self.models),
            "cache_status": "connected" if self.cache_service else "disconnected",
            "dependencies": {
                "torch": TORCH_AVAILABLE,
                "xgboost": XGBOOST_AVAILABLE,
                "sklearn": SKLEARN_AVAILABLE,
                "shap": SHAP_AVAILABLE
            },
            "memory_usage": {
                "model_cache_mb": self.model_cache._get_total_memory(),
                "max_cache_mb": self.model_cache.max_memory_mb
            },
            "last_check": datetime.now().isoformat()
        }
        
        # Test a simple prediction for each sport
        test_results = {}
        for sport in SportType:
            try:
                test_features = {f"test_feature_{i}": 0.5 for i in range(10)}
                test_request = PredictionRequest(
                    player_id="test_player",
                    features=test_features,
                    sport=sport,
                    prop_type="test_prop"
                )
                
                start_time = time.time()
                result = await self.predict(test_request)
                test_time = time.time() - start_time
                
                test_results[sport.value] = {
                    "status": "healthy",
                    "prediction": result.prediction,
                    "confidence": result.confidence,
                    "inference_time_ms": test_time * 1000
                }
                
            except Exception as e:
                test_results[sport.value] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                
        health_status["test_results"] = test_results
        return health_status
        
    async def _get_model(self, sport: SportType, 
                        model_preferences: Optional[List[ModelType]] = None) -> Optional[BaseModel]:
        """Get the best available model for a sport"""
        
        # If preferences specified, try those first
        if model_preferences:
            for model_type in model_preferences:
                model_key = f"{sport.value}_{model_type.value}"
                if model_key in self.models:
                    return self.models[model_key]
                    
        # Fall back to ensemble model
        ensemble_key = f"{sport.value}_ensemble"
        if ensemble_key in self.models:
            return self.models[ensemble_key]
            
        # Fall back to any available model for the sport
        for key, model in self.models.items():
            if model.config.sport == sport:
                return model
                
        return None
        
    def _prepare_features(self, features: Dict[str, Any], feature_names: List[str]) -> np.ndarray:
        """Prepare features for model input"""
        feature_array = np.zeros(len(feature_names))
        
        for i, name in enumerate(feature_names):
            if name in features:
                value = features[name]
                # Handle different types of values
                if isinstance(value, (int, float)):
                    feature_array[i] = float(value)
                elif isinstance(value, bool):
                    feature_array[i] = 1.0 if value else 0.0
                elif isinstance(value, str):
                    # Simple string hashing for categorical features
                    feature_array[i] = hash(value) % 1000 / 1000.0
                else:
                    feature_array[i] = 0.0
            else:
                feature_array[i] = 0.0  # Default value for missing features
                
        return feature_array
        
    def _generate_cache_key(self, request: PredictionRequest) -> str:
        """Generate cache key for prediction request"""
        key_data = {
            'player_id': request.player_id,
            'sport': request.sport.value,
            'prop_type': request.prop_type,
            'features': sorted(request.features.items()),
            'model_prefs': [m.value for m in (request.model_preferences or [])]
        }
        key_str = json.dumps(key_data, sort_keys=True)
        import hashlib
        return f"ml_prediction:{hashlib.md5(key_str.encode()).hexdigest()}"
        
    async def _generate_explanation(self, model: BaseModel, 
                                  features: np.ndarray, 
                                  feature_dict: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, float]]:
        """Generate SHAP explanation for prediction"""
        try:
            if not hasattr(model, 'model') or not SHAP_AVAILABLE:
                return {}, {}
                
            # Create SHAP explainer
            explainer = shap.Explainer(model.model)
            
            # Calculate SHAP values
            shap_values = explainer(features.reshape(1, -1))
            
            # Create explanation
            explanation = {
                "method": "SHAP",
                "base_value": float(explainer.expected_value),
                "shap_values": [float(v) for v in shap_values.values[0]]
            }
            
            # Create feature importance
            feature_importance = {}
            for i, name in enumerate(model.feature_names):
                if i < len(shap_values.values[0]):
                    feature_importance[name] = float(abs(shap_values.values[0][i]))
                    
            return explanation, feature_importance
            
        except Exception as e:
            logger.error(f"SHAP explanation failed: {e}")
            return {}, {}
            
    async def _update_metrics(self, model: Optional[BaseModel], 
                            success: bool, inference_time: float):
        """Update model performance metrics"""
        if not model:
            return
            
        model_key = f"{model.config.sport.value}_{model.config.model_type.value}"
        if model_key not in self.metrics:
            return
            
        metrics = self.metrics[model_key]
        metrics.total_predictions += 1
        
        if success:
            metrics.successful_predictions += 1
        else:
            metrics.failed_predictions += 1
            
        # Update average inference time (exponential moving average)
        if metrics.avg_inference_time == 0:
            metrics.avg_inference_time = inference_time
        else:
            metrics.avg_inference_time = (
                0.9 * metrics.avg_inference_time + 
                0.1 * inference_time
            )
            
        metrics.last_updated = datetime.now()

# Global instance
_ml_service: Optional[UnifiedMLService] = None

async def get_ml_service() -> UnifiedMLService:
    """Get global ML service instance"""
    global _ml_service
    if _ml_service is None:
        _ml_service = UnifiedMLService()
        await _ml_service.initialize()
    return _ml_service

# Convenience functions
async def predict(player_id: str, features: Dict[str, Any], 
                 sport: SportType, prop_type: str, **kwargs) -> PredictionResult:
    """Make a single prediction"""
    service = await get_ml_service()
    request = PredictionRequest(
        player_id=player_id,
        features=features,
        sport=sport,
        prop_type=prop_type,
        **kwargs
    )
    return await service.predict(request)

async def predict_batch(requests: List[PredictionRequest]) -> List[PredictionResult]:
    """Make batch predictions"""
    service = await get_ml_service()
    return await service.predict_batch(requests)

async def get_metrics(sport: Optional[SportType] = None) -> Dict[str, Any]:
    """Get ML service metrics"""
    service = await get_ml_service()
    return await service.get_model_metrics(sport)
