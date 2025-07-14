"""Enhanced Model Inference Service
Containerized ML model serving with ensemble predictions, model versioning, and performance tracking
"""

import asyncio
import json
import logging
import random
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

logger = logging.getLogger(__name__)

# Optional imports with fallbacks
try:
    import joblib
except ImportError:
    logger.critical(
        "joblib is not installed, which is required for loading ML models. Please install it."
    )
    joblib = None

try:
    import numpy as np

    # Silence the unused import warning by using it
    _ = np
except ImportError:
    logger.warning("numpy not available, using Python fallbacks")
    np = None


from pydantic import BaseSettings


class ModelServiceConfig(BaseSettings):
    model_path: str = "models/"
    model_update_interval: int = 300
    model_service_host: str = "0.0.0.0"
    model_service_port: int = 8002
    model_service_workers: int = 2

    class Config:
        env_file = ".env"


try:
    from config import config_manager
except ImportError:
    logger.warning("config_manager not available, using Pydantic BaseSettings")
    config_manager = ModelServiceConfig()

try:
    from database import ModelPerformance, PredictionModel, db_manager
except ImportError:
    logger.warning("database modules not available, using mock implementations")
    ModelPerformance = None
    PredictionModel = None
    db_manager = None

try:
    from feature_engineering import FeatureEngineering
except ImportError:
    logger.warning("feature_engineering not available, using mock implementation")

    class MockFeatureEngineering:
        def prepare_features(self, *_args: Any, **_kwargs: Any) -> Dict[str, Any]:
            return {}

    FeatureEngineering = MockFeatureEngineering


@dataclass
class ModelMetadata:
    """Model metadata and configuration"""

    name: str
    version: str
    model_type: str  # xgboost, lightgbm, random_forest, neural_net
    file_path: str
    features: List[str]
    target: str
    training_date: datetime
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    weight: float = 1.0
    is_active: bool = True
    preprocessing_config: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PredictionRequest:
    """Request for model prediction"""

    event_id: str
    features: Dict[str, Union[float, int]]
    model_names: Optional[List[str]] = None
    require_explanations: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ModelPrediction:
    """Individual model prediction result"""

    model_name: str
    model_version: str
    predicted_value: float
    confidence: float
    feature_importance: Dict[str, float] = field(default_factory=dict)
    shap_values: Dict[str, float] = field(default_factory=dict)
    processing_time: float = 0.0
    model_metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EnsemblePrediction:
    """Ensemble prediction result"""

    event_id: str
    final_prediction: float
    ensemble_confidence: float
    model_predictions: List[ModelPrediction]
    feature_engineering_stats: Dict[str, Any] = field(default_factory=dict)
    processing_time: float = 0.0
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class ModelLoader:
    """Model loading and caching utility"""

    def __init__(self, models_directory: str):
        self.models_directory = Path(models_directory)
        self.loaded_models: Dict[str, Any] = {}
        self.model_metadata: Dict[str, ModelMetadata] = {}
        self.executor = ThreadPoolExecutor(max_workers=4)

    async def load_model(self, metadata: ModelMetadata) -> bool:
        """Load a model into memory"""
        try:
            if not joblib:
                logger.error("Cannot load models because joblib is not installed.")
                return False

            model_path = self.models_directory / metadata.file_path

            if not model_path.exists():
                logger.error(f"Model file not found: {model_path}")
                return False

            # Load model in thread pool to avoid blocking
            loop = asyncio.get_event_loop()

            if metadata.model_type in ["xgboost", "lightgbm", "random_forest"]:
                model = await loop.run_in_executor(
                    self.executor, joblib.load, str(model_path)
                )
            elif metadata.model_type == "neural_net":
                # For neural networks, using pickle is insecure.
                # A framework-specific safe loading mechanism should be used.
                logger.critical(
                    f"Refusing to load neural network model '{metadata.name}' from a pickle file due to security risks. "
                    f"Please save and load this model using a secure, framework-native format "
                    f"(e.g., model.save() and tf.keras.models.load_model() for Keras, "
                    f"or torch.save(model.state_dict(), ...) and model.load_state_dict() for PyTorch)."
                )
                return False
            else:
                raise ValueError(f"Unsupported model type: {metadata.model_type}")

            self.loaded_models[metadata.name] = model
            self.model_metadata[metadata.name] = metadata

            logger.info(f"Loaded model {metadata.name} v{metadata.version}")
            return True

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error loading model %s: %s", metadata.name, e)
            return False

    async def unload_model(self, model_name: str):
        """Unload a model from memory"""
        if model_name in self.loaded_models:
            del self.loaded_models[model_name]
            del self.model_metadata[model_name]
            logger.info("Unloaded model {model_name}")

    def get_model(self, model_name: str) -> Optional[Any]:
        """Get loaded model"""
        return self.loaded_models.get(model_name)

    def get_metadata(self, model_name: str) -> Optional[ModelMetadata]:
        """Get model metadata"""
        return self.model_metadata.get(model_name)

    def list_loaded_models(self) -> List[str]:
        """List all loaded models"""
        return list(self.loaded_models.keys())


class ModelInferenceEngine:
    """Core model inference engine"""

    def __init__(self, model_loader: ModelLoader):
        self.model_loader = model_loader
        self.feature_engineer = FeatureEngineering()
        self.inference_stats: Dict[str, Any] = {
            "total_predictions": 0,
            "successful_predictions": 0,
            "failed_predictions": 0,
            "average_latency": 0.0,
            "model_usage": {},
        }

    async def predict_single_model(
        self,
        model_name: str,
        features: Dict[str, Union[float, int]],
        require_explanations: bool = False,
    ) -> Optional[ModelPrediction]:
        """Make prediction with a single model"""
        start_time = time.time()

        try:
            model = self.model_loader.get_model(model_name)
            metadata = self.model_loader.get_metadata(model_name)

            if not model or not metadata:
                logger.error("Model {model_name} not loaded")
                return None

            # Prepare features
            feature_array = self._prepare_features(features, metadata.features)
            if feature_array is None:
                return None

            # Make prediction
            loop = asyncio.get_event_loop()
            prediction = await loop.run_in_executor(
                self.model_loader.executor,
                self._predict_with_model,
                model,
                feature_array,
                metadata.model_type,
            )

            # Calculate confidence (model-specific logic)
            confidence = self._calculate_confidence(
                model, feature_array, metadata.model_type
            )

            # Feature importance and SHAP values (if requested)
            feature_importance = {}
            shap_values = {}

            if require_explanations:
                feature_importance = await self._get_feature_importance(
                    model, metadata, features
                )
                shap_values = await self._get_shap_values(
                    model, feature_array, metadata, features
                )

            processing_time = time.time() - start_time

            # Update stats
            model_usage = self.inference_stats["model_usage"]
            model_usage[model_name] = model_usage.get(model_name, 0) + 1

            return ModelPrediction(
                model_name=model_name,
                model_version=metadata.version,
                predicted_value=float(prediction),
                confidence=confidence,
                feature_importance=feature_importance,
                shap_values=shap_values,
                processing_time=processing_time,
                model_metadata={
                    "model_type": metadata.model_type,
                    "weight": metadata.weight,
                },
            )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error in single model prediction for %s: %s", model_name, e)
            return None

    async def predict_ensemble(self, request: PredictionRequest) -> EnsemblePrediction:
        """Make ensemble prediction using multiple models"""
        start_time = time.time()

        try:
            # Determine which models to use
            model_names = request.model_names or self.model_loader.list_loaded_models()
            active_models = [
                name
                for name in model_names
                if self.model_loader.get_metadata(name)
                and getattr(self.model_loader.get_metadata(name), "is_active", True)
            ]

            if not active_models:
                raise ValueError("No active models available for prediction")

            # Feature engineering
            fe_start = time.time()
            engineered_features = self.feature_engineer.preprocess_features(
                request.features
            )
            fe_time = time.time() - fe_start

            # Make predictions with all models concurrently
            prediction_tasks = [
                self.predict_single_model(
                    model_name,
                    engineered_features.get("features", request.features),
                    request.require_explanations,
                )
                for model_name in active_models
            ]

            model_predictions = await asyncio.gather(*prediction_tasks)

            # Filter out failed predictions
            successful_predictions = [p for p in model_predictions if p is not None]

            if not successful_predictions:
                raise ValueError("All model predictions failed")

            # Calculate ensemble prediction
            final_prediction, ensemble_confidence = self._calculate_ensemble_result(
                successful_predictions
            )

            processing_time = time.time() - start_time

            # Update stats
            self.inference_stats["total_predictions"] += 1
            self.inference_stats["successful_predictions"] += 1

            # Update average latency
            total_preds = self.inference_stats["total_predictions"]
            current_avg = self.inference_stats["average_latency"]
            self.inference_stats["average_latency"] = (
                current_avg * (total_preds - 1) + processing_time
            ) / total_preds

            return EnsemblePrediction(
                event_id=request.event_id,
                final_prediction=final_prediction,
                ensemble_confidence=ensemble_confidence,
                model_predictions=successful_predictions,
                feature_engineering_stats={
                    "processing_time": fe_time,
                    "features_count": len(engineered_features.get("features", {})),
                    "anomaly_detected": bool(engineered_features.get("anomaly_scores")),
                },
                processing_time=processing_time,
            )

        except Exception as e:  # pylint: disable=broad-exception-caught
            self.inference_stats["failed_predictions"] += 1
            logger.error("Error in ensemble prediction: %s", e)
            raise

    def _prepare_features(
        self, features: Dict[str, Union[float, int]], expected_features: List[str]
    ) -> Optional[List[float]]:
        """Prepare features for model input"""
        try:
            # Ensure all required features are present
            feature_vector = []
            for feature_name in expected_features:
                if feature_name in features:
                    feature_vector.append(float(features[feature_name]))
                else:
                    logger.warning("Missing feature: %s", feature_name)
                    feature_vector.append(0.0)

            return feature_vector

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error preparing features: %s", e)
            return None

    def _predict_with_model(
        self, model: Any, features: List[float], model_type: str
    ) -> float:
        """Make prediction with specific model type"""
        if model_type in ["xgboost", "lightgbm", "random_forest"]:
            prediction = model.predict(features)[0]
        elif model_type == "neural_net":
            prediction = model.predict(features)[0][0]  # Assuming single output
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

        return float(prediction)

    def _calculate_confidence(
        self, model: Any, features: List[float], model_type: str
    ) -> float:
        """Calculate prediction confidence"""
        try:
            if model_type == "random_forest":
                # Use prediction variance across trees with pure Python
                predictions = [
                    tree.predict(features)[0]
                    for tree in getattr(model, "estimators_", [])
                ]
                if predictions:
                    mean_pred = sum(predictions) / len(predictions)
                    variance = sum((p - mean_pred) ** 2 for p in predictions) / len(
                        predictions
                    )
                    confidence = max(0.1, 1.0 - min(variance, 1.0))
                else:
                    confidence = 0.7
            elif model_type in ["xgboost", "lightgbm"]:
                # Use feature importance as proxy for confidence
                confidence = 0.8  # Default confidence
            else:
                confidence = 0.7  # Default confidence

            return float(confidence)

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Error calculating confidence: %s", e)
            return 0.5

    async def _get_feature_importance(
        self,
        model: Any,
        metadata: ModelMetadata,
        _features: Dict[str, Union[float, int]],  # Prefixed with _ to indicate unused
    ) -> Dict[str, float]:
        """Get feature importance from model"""
        try:
            if hasattr(model, "feature_importances_"):
                importance_scores = model.feature_importances_
                return {
                    feature_name: float(score)
                    for feature_name, score in zip(metadata.features, importance_scores)
                }
            else:
                return {}
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Error getting feature importance: %s", e)
            return {}

    async def _get_shap_values(
        self,
        _model: Any,  # Prefixed with _ to indicate unused
        _features: List[float],  # Prefixed with _ to indicate unused
        metadata: ModelMetadata,
        _feature_dict: Dict[
            str, Union[float, int]
        ],  # Prefixed with _ to indicate unused
    ) -> Dict[str, float]:
        """Get SHAP values for prediction explanation"""
        try:
            # This would require SHAP library integration
            # For now, return mock SHAP values
            return {
                feature_name: float(random.uniform(-1, 1))
                for feature_name in metadata.features
            }
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.warning("Error getting SHAP values: %s", e)
            return {}

    def _calculate_ensemble_result(
        self, predictions: List[ModelPrediction]
    ) -> Tuple[float, float]:
        """Calculate final ensemble prediction and confidence"""
        if not predictions:
            raise ValueError("No predictions to ensemble")

        # Weighted average based on model weights and confidence
        total_weight = 0.0
        weighted_sum = 0.0
        confidence_sum = 0.0

        for pred in predictions:
            weight = pred.model_metadata.get("weight", 1.0) * pred.confidence
            weighted_sum += pred.predicted_value * weight
            total_weight += weight
            confidence_sum += pred.confidence

        if total_weight == 0:
            # Fallback to simple average
            final_prediction = sum(p.predicted_value for p in predictions) / len(
                predictions
            )
            ensemble_confidence = sum(p.confidence for p in predictions) / len(
                predictions
            )
        else:
            final_prediction = weighted_sum / total_weight
            ensemble_confidence = confidence_sum / len(predictions)

        return float(final_prediction), float(ensemble_confidence)


class ModelService:
    """Main model service with health monitoring and persistence"""

    def __init__(self):
        self.config = config_manager
        # If config_manager is a Pydantic settings, use its attributes directly
        model_path = getattr(self.config, "model_path", "models/")
        self.model_loader = ModelLoader(model_path)
        self.inference_engine = ModelInferenceEngine(self.model_loader)
        self._initialized = False

    async def initialize(self):
        """Initialize model service"""
        if self._initialized:
            return

        try:
            # Load default models
            await self._load_default_models()

            # Start background tasks
            asyncio.create_task(self._model_update_task())
            asyncio.create_task(self._performance_monitoring_task())

            self._initialized = True
            logger.info("Model service initialized successfully")

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Failed to initialize model service: %s", e)
            raise

    async def predict(self, request: PredictionRequest) -> EnsemblePrediction:
        """Make prediction and store result"""
        if not self._initialized:
            await self.initialize()

        # Make prediction
        prediction = await self.inference_engine.predict_ensemble(request)

        # Store prediction in database
        await self._store_prediction(request, prediction)

        return prediction

    async def get_model_health(self) -> Dict[str, Any]:
        """Get model service health status"""
        loaded_models = self.model_loader.list_loaded_models()

        health_status = {
            "status": "healthy" if loaded_models else "unhealthy",
            "loaded_models": len(loaded_models),
            "models": {},
            "inference_stats": self.inference_engine.inference_stats,
            "system_resources": await self._get_system_resources(),
        }

        # Check individual model health
        for model_name in loaded_models:
            metadata = self.model_loader.get_metadata(model_name)
            if metadata:
                health_status["models"][model_name] = {
                    "version": metadata.version,
                    "model_type": metadata.model_type,
                    "is_active": metadata.is_active,
                    "weight": metadata.weight,
                    "last_used": self.inference_engine.inference_stats[
                        "model_usage"
                    ].get(model_name, 0),
                }

        return health_status

    async def reload_model(self, model_name: str) -> bool:
        """Reload a specific model"""
        try:
            # Unload existing model
            await self.model_loader.unload_model(model_name)

            # Find and reload model
            model_configs = await self._discover_models()
            for config in model_configs:
                if config.name == model_name:
                    return await self.model_loader.load_model(config)

            logger.error("Model configuration not found: {model_name}")
            return False

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error reloading model %s: %s", model_name, e)
            return False

    async def _load_default_models(self):
        """Load default models on startup"""
        model_configs = await self._discover_models()

        for config in model_configs:
            if config.is_active:
                success = await self.model_loader.load_model(config)
                if not success:
                    logger.warning("Failed to load model: {config.name}")

    async def _discover_models(self) -> List[ModelMetadata]:
        """Discover available models from filesystem"""
        models_dir = Path(
            getattr(self.config, "config", {}).get("model_path", "models/")
        )
        model_configs = []

        if not models_dir.exists():
            logger.warning("Models directory not found: {models_dir}")
            return []

        # Look for model configuration files
        for config_file in models_dir.glob("**/model_config.json"):
            try:
                with open(config_file, encoding="utf-8") as f:
                    config_data = json.load(f)

                metadata = ModelMetadata(
                    name=config_data["name"],
                    version=config_data["version"],
                    model_type=config_data["model_type"],
                    file_path=config_data["file_path"],
                    features=config_data["features"],
                    target=config_data["target"],
                    training_date=datetime.fromisoformat(config_data["training_date"]),
                    performance_metrics=config_data.get("performance_metrics", {}),
                    weight=config_data.get("weight", 1.0),
                    is_active=config_data.get("is_active", True),
                    preprocessing_config=config_data.get("preprocessing_config", {}),
                )

                model_configs.append(metadata)

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Error loading model config %s: %s", config_file, e)
                continue

        return model_configs

    async def _store_prediction(
        self, request: PredictionRequest, prediction: EnsemblePrediction
    ):
        """Store prediction in database"""
        try:
            async with db_manager.get_session() as session:
                for model_pred in prediction.model_predictions:
                    db_prediction = PredictionModel(
                        event_id=request.event_id,
                        model_name=model_pred.model_name,
                        prediction_type=request.metadata.get(
                            "prediction_type", "unknown"
                        ),
                        predicted_value=model_pred.predicted_value,
                        confidence=model_pred.confidence,
                        features=request.features,
                        shap_values=model_pred.shap_values,
                    )
                    session.add(db_prediction)

                await session.commit()

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error storing prediction: %s", e)

    async def _model_update_task(self):
        """Background task to check for model updates"""
        while True:
            try:
                await asyncio.sleep(
                    getattr(self.config, "config", {}).get("model_update_interval", 300)
                )

                # Check for new or updated models
                current_models = set(self.model_loader.list_loaded_models())
                available_models = await self._discover_models()
                available_names = set(config.name for config in available_models)

                # Load new models
                new_models = available_names - current_models
                for model_name in new_models:
                    config = next(c for c in available_models if c.name == model_name)
                    if config.is_active:
                        await self.model_loader.load_model(config)

                # Unload removed models
                removed_models = current_models - available_names
                for model_name in removed_models:
                    await self.model_loader.unload_model(model_name)

                if new_models or removed_models:
                    logger.info(
                        "Model update: +%s, -%s", len(new_models), len(removed_models)
                    )

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Error in model update task: %s", e)

    async def _performance_monitoring_task(self):
        """Background task to monitor and log performance"""
        while True:
            try:
                await asyncio.sleep(300)  # Every 5 minutes

                # Log performance metrics
                stats = self.inference_engine.inference_stats
                logger.info("Model performance: {stats}")

                # Store performance metrics in database
                async with db_manager.get_session() as session:
                    for model_name, usage_count in stats["model_usage"].items():
                        performance = ModelPerformance(
                            model_name=model_name,
                            metric_name="usage_count",
                            metric_value=float(usage_count),
                            period_start=datetime.now(timezone.utc)
                            - timedelta(minutes=5),
                            period_end=datetime.now(timezone.utc),
                            sample_size=usage_count,
                        )
                        session.add(performance)

                    await session.commit()

            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Error in performance monitoring: %s", e)

    async def _get_system_resources(self) -> Dict[str, Any]:
        """Get system resource usage"""
        try:
            import psutil
        except ImportError:
            psutil = None

        return {
            "cpu_percent": psutil.cpu_percent() if psutil else 0.0,
            "memory_percent": psutil.virtual_memory().percent if psutil else 0.0,
            "disk_usage": psutil.disk_usage("/").percent if psutil else 0.0,
        }

    async def analyze_prop(self, prop_attributes: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a PrizePicks prop using ML models and feature engineering"""
        try:
            if not self._initialized:
                await self.initialize()

            # Extract relevant features from prop attributes
            features = {
                "line_score": float(prop_attributes.get("line_score", 0)),
                "stat_type_encoded": self._encode_stat_type(
                    prop_attributes.get("stat_type", "")
                ),
                "odds_type_encoded": self._encode_odds_type(
                    prop_attributes.get("odds_type", "standard")
                ),
                "start_time_hour": self._extract_start_hour(
                    prop_attributes.get("start_time", "")
                ),
                "line_difficulty": self._calculate_line_difficulty(prop_attributes),
            }

            # Create prediction request
            request = PredictionRequest(
                event_id=f"prop_{prop_attributes.get('id', 'unknown')}",
                features=features,
                require_explanations=True,
            )

            # Get ensemble prediction
            prediction = await self.predict(request)

            # Calculate confidence based on model consensus
            confidence = min(95.0, max(60.0, prediction.ensemble_confidence * 100))

            # Calculate edge using model prediction vs market line
            edge = self._calculate_prop_edge(
                prediction.final_prediction, features["line_score"]
            )

            # Model consensus rating
            consensus = self._determine_consensus(prediction.model_predictions)

            return {
                "confidence": confidence,
                "edge": edge,
                "projection": prediction.final_prediction,
                "quality_score": self._calculate_quality_score(prediction),
                "consensus": consensus,
                "model_count": len(prediction.model_predictions),
                "feature_importance": self._get_top_features(prediction),
            }

        except (ValueError, TypeError) as e:
            logger.error("Error analyzing prop: %s", e)
            # Return intelligent defaults based on statistical analysis
            return await self._fallback_prop_analysis(prop_attributes)

    def _encode_stat_type(self, stat_type: str) -> float:
        """Encode stat type to numerical value based on predictability"""
        stat_encoding = {
            "points": 0.85,
            "rebounds": 0.75,
            "assists": 0.8,
            "three_pointers_made": 0.7,
            "blocks": 0.65,
            "steals": 0.65,
            "turnovers": 0.7,
            "field_goals_made": 0.75,
            "free_throws_made": 0.8,
        }
        return stat_encoding.get(stat_type.lower(), 0.7)

    def _encode_odds_type(self, odds_type: str) -> float:
        """Encode odds type to numerical value"""
        return 1.0 if odds_type == "standard" else 0.8

    def _extract_start_hour(self, start_time: str) -> float:
        """Extract hour from start time for game timing analysis"""
        try:
            # Import datetime for time parsing
            if start_time:
                # Use datetime already imported at module level
                dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                return float(dt.hour)
        except (ValueError, ImportError):
            pass
        return 19.0  # Default to 7 PM

    def _calculate_line_difficulty(self, attributes: Dict[str, Any]) -> float:
        """Calculate line difficulty score"""
        line_score = attributes.get("line_score", 0)
        stat_type = attributes.get("stat_type", "").lower()

        # Standard ranges for different stat types
        standard_ranges = {
            "points": (15, 35),
            "rebounds": (5, 15),
            "assists": (3, 12),
            "three_pointers_made": (1, 5),
            "blocks": (0, 3),
            "steals": (0, 3),
        }

        if stat_type in standard_ranges:
            min_val, max_val = standard_ranges[stat_type]
            if min_val <= line_score <= max_val:
                return 0.8  # Standard difficulty
            else:
                return 0.5  # Higher difficulty for unusual lines

        return 0.7  # Default difficulty

    def _calculate_prop_edge(
        self, model_prediction: float, market_line: float
    ) -> float:
        """Calculate betting edge based on model vs market"""
        if market_line == 0:
            return 0.0

        edge = (model_prediction - market_line) / market_line
        return round(max(-0.15, min(0.15, edge)), 3)  # Cap edge at ±15%

    def _determine_consensus(self, model_predictions: List[ModelPrediction]) -> str:
        """Determine model consensus strength"""
        if len(model_predictions) < 2:
            return "insufficient"

        confidences = [p.confidence for p in model_predictions]
        avg_confidence = sum(confidences) / len(confidences)
        # Calculate standard deviation using pure Python
        if len(confidences) > 1:
            mean_conf = sum(confidences) / len(confidences)
            confidence_std = (
                sum((x - mean_conf) ** 2 for x in confidences) / len(confidences)
            ) ** 0.5
        else:
            confidence_std = 0.0

        if avg_confidence > 0.8 and confidence_std < 0.1:
            return "strong"
        elif avg_confidence > 0.7 and confidence_std < 0.15:
            return "medium"
        else:
            return "weak"

    def _calculate_quality_score(self, prediction: EnsemblePrediction) -> float:
        """Calculate overall quality score for the prediction"""
        base_score = prediction.ensemble_confidence
        model_count_bonus = min(0.1, len(prediction.model_predictions) * 0.02)
        return min(1.0, base_score + model_count_bonus)

    def _get_top_features(self, prediction: EnsemblePrediction) -> Dict[str, float]:
        """Get top feature importance from model predictions"""
        all_features: Dict[str, float] = {}
        for model_pred in prediction.model_predictions:
            for feature, importance in model_pred.feature_importance.items():
                all_features[feature] = all_features.get(feature, 0) + importance

        # Return top 3 features
        sorted_features = sorted(all_features.items(), key=lambda x: x[1], reverse=True)
        return dict(sorted_features[:3])

    async def _fallback_prop_analysis(
        self, prop_attributes: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Intelligent fallback analysis when ML models fail"""
        line_score = prop_attributes.get("line_score", 0)
        stat_type = prop_attributes.get("stat_type", "").lower()

        # Statistical confidence based on stat type reliability
        stat_reliability = {
            "points": 0.85,
            "rebounds": 0.75,
            "assists": 0.8,
            "three_pointers_made": 0.7,
            "blocks": 0.65,
            "steals": 0.65,
        }

        base_confidence = 70 + (stat_reliability.get(stat_type, 0.7) * 20)

        # Adjust for line difficulty
        if stat_type == "points" and 15 <= line_score <= 35:
            base_confidence += 5
        elif line_score < 5 or line_score > 50:
            base_confidence -= 10

        return {
            "confidence": min(95.0, max(60.0, base_confidence)),
            "edge": 0.0,  # Neutral edge for fallback
            "projection": line_score,  # Use line as projection
            "quality_score": 0.6,  # Lower quality for fallback
            "consensus": "fallback",
            "model_count": 0,
            "feature_importance": {
                "stat_type": 0.4,
                "line_score": 0.3,
                "market_timing": 0.3,
            },
        }


# Global model service instance
model_service = ModelService()

if __name__ == "__main__":
    # Get configuration from config_manager (Pydantic settings)
    host = getattr(config_manager, "model_service_host", "0.0.0.0")
    port = getattr(config_manager, "model_service_port", 8002)
    workers = getattr(config_manager, "model_service_workers", 2)

    # Create FastAPI app
    app = FastAPI(title="A1Betting Model Service")

    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # Create and initialize model service
    model_service = ModelService()

    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await model_service.initialize()
        yield

    app.router.lifespan_context = lifespan

    @app.get("/health")
    async def health_check():
        return await model_service.get_model_health()

    @app.post("/predict")
    async def predict(request: PredictionRequest):
        return await model_service.predict(request)

    @app.post("/analyze-prop")
    async def analyze_prop(prop_attributes: Dict[str, Any]):
        return await model_service.analyze_prop(prop_attributes)

    # Run the server
    uvicorn.run(
        app, host=host, port=port, workers=workers, log_level="info", reload=True
    )
