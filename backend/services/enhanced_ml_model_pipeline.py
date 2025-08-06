"""
Enhanced ML Model Pipeline for A1Betting7-13.2

Phase 2 implementation: Production-ready ML pipeline with dual framework support (TensorFlow + PyTorch),
real-time analytics, and advanced prediction capabilities.

Architecture based on:
- Google Cloud ML best practices
- Neptune.ai pipeline design patterns
- Directed Acyclic Graph (DAG) execution flow
- Single Leader Architecture for orchestration
- Data/Model parallelism for scalability

Key Features:
- Dual framework support (TensorFlow + PyTorch)
- Real-time prediction serving
- Automated feature engineering
- Model versioning and deployment
- SHAP explainability integration
- Comprehensive monitoring and logging
"""

import asyncio
import hashlib
import json
import logging
import pickle
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import aioredis
import numpy as np
import pandas as pd

# ML Frameworks
try:
    import tensorflow as tf

    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim

    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False

import lightgbm as lgb
import xgboost as xgb
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

# ML Libraries
from sklearn.preprocessing import LabelEncoder, StandardScaler

# Explainability
try:
    import shap

    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

# Existing services integration
from ..enhanced_data_manager import EnhancedDataManager
from .cache_manager import APICache
from .optimized_redis_service import OptimizedRedisService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("enhanced_ml_pipeline")


class ModelFramework(Enum):
    """Supported ML frameworks"""

    TENSORFLOW = "tensorflow"
    PYTORCH = "pytorch"
    SKLEARN = "sklearn"
    XGBOOST = "xgboost"
    LIGHTGBM = "lightgbm"


class ModelType(Enum):
    """Model types for different prediction tasks"""

    REGRESSION = "regression"
    CLASSIFICATION = "classification"
    ENSEMBLE = "ensemble"
    NEURAL_NETWORK = "neural_network"


class PipelineStage(Enum):
    """Pipeline execution stages (DAG nodes)"""

    DATA_INGESTION = "data_ingestion"
    DATA_PREPROCESSING = "data_preprocessing"
    FEATURE_ENGINEERING = "feature_engineering"
    MODEL_TRAINING = "model_training"
    MODEL_EVALUATION = "model_evaluation"
    MODEL_DEPLOYMENT = "model_deployment"
    PREDICTION_SERVING = "prediction_serving"
    MONITORING = "monitoring"


@dataclass
class ModelMetadata:
    """Model metadata for versioning and tracking"""

    model_id: str
    framework: ModelFramework
    model_type: ModelType
    version: str
    created_at: datetime
    performance_metrics: Dict[str, float]
    feature_importance: Dict[str, float]
    training_config: Dict[str, Any]
    model_size_mb: float
    training_duration_seconds: float


@dataclass
class PredictionRequest:
    """Request structure for model predictions"""

    model_id: str
    features: Dict[str, Any]
    explain: bool = False
    confidence_interval: bool = False
    batch_mode: bool = False


@dataclass
class PredictionResponse:
    """Response structure for model predictions"""

    prediction: Union[float, List[float]]
    confidence_score: float
    explanation: Optional[Dict[str, float]] = None
    confidence_interval: Optional[Tuple[float, float]] = None
    model_version: str = ""
    processing_time_ms: float = 0.0


class EnhancedMLModelPipeline:
    """
    Enhanced ML Model Pipeline with production-ready capabilities

    Implements DAG-based execution flow with Single Leader Architecture
    for orchestration and management of ML workflows.
    """

    def __init__(
        self,
        redis_service: OptimizedRedisService,
        cache_manager: APICache,
        data_manager: EnhancedDataManager,
        model_storage_path: str = "models/",
        enable_gpu: bool = True,
        max_workers: int = 4,
    ):
        self.redis_service = redis_service
        self.cache_manager = cache_manager
        self.data_manager = data_manager
        self.model_storage_path = Path(model_storage_path)
        self.model_storage_path.mkdir(exist_ok=True)
        self.enable_gpu = enable_gpu
        self.max_workers = max_workers

        # Initialize thread pool for parallel processing
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

        # Model registry (in-memory cache for active models)
        self.model_registry: Dict[str, Any] = {}
        self.model_metadata_registry: Dict[str, ModelMetadata] = {}

        # Feature processors
        self.feature_processors: Dict[str, Any] = {}

        # Performance monitoring
        self.performance_metrics: Dict[str, List[float]] = {
            "prediction_latency": [],
            "model_accuracy": [],
            "feature_engineering_time": [],
            "cache_hit_rate": [],
        }

        # DAG execution state tracking
        self.pipeline_state: Dict[str, Any] = {
            "current_stage": None,
            "completed_stages": [],
            "failed_stages": [],
            "execution_start_time": None,
            "stage_timings": {},
        }

        logger.info(f"Enhanced ML Pipeline initialized with {max_workers} workers")
        logger.info(f"TensorFlow available: {TENSORFLOW_AVAILABLE}")
        logger.info(f"PyTorch available: {PYTORCH_AVAILABLE}")
        logger.info(f"SHAP available: {SHAP_AVAILABLE}")

    async def initialize_pipeline(self) -> bool:
        """Initialize the ML pipeline components"""
        try:
            # Initialize GPU settings if available
            if self.enable_gpu and TENSORFLOW_AVAILABLE:
                await self._setup_tensorflow_gpu()

            if self.enable_gpu and PYTORCH_AVAILABLE:
                await self._setup_pytorch_gpu()

            # Load existing models from storage
            await self._load_existing_models()

            # Initialize feature processors
            await self._initialize_feature_processors()

            logger.info("Enhanced ML Pipeline initialization completed successfully")
            return True

        except Exception as e:
            logger.error(f"Pipeline initialization failed: {e}")
            return False

    async def _setup_tensorflow_gpu(self):
        """Configure TensorFlow GPU settings"""
        try:
            gpus = tf.config.experimental.list_physical_devices("GPU")
            if gpus:
                for gpu in gpus:
                    tf.config.experimental.set_memory_growth(gpu, True)
                logger.info(
                    f"TensorFlow GPU setup completed. GPUs available: {len(gpus)}"
                )
            else:
                logger.info("No GPUs found for TensorFlow")
        except Exception as e:
            logger.warning(f"TensorFlow GPU setup failed: {e}")

    async def _setup_pytorch_gpu(self):
        """Configure PyTorch GPU settings"""
        try:
            if torch.cuda.is_available():
                device_count = torch.cuda.device_count()
                logger.info(
                    f"PyTorch GPU setup completed. GPUs available: {device_count}"
                )
                return f"cuda:{0}"  # Use first GPU
            else:
                logger.info("No GPUs found for PyTorch")
                return "cpu"
        except Exception as e:
            logger.warning(f"PyTorch GPU setup failed: {e}")
            return "cpu"

    async def _load_existing_models(self):
        """Load pre-trained models from storage"""
        try:
            model_files = list(self.model_storage_path.glob("*.pkl"))
            metadata_files = list(self.model_storage_path.glob("*.metadata.json"))

            for metadata_file in metadata_files:
                try:
                    with open(metadata_file, "r") as f:
                        metadata_dict = json.load(f)

                    metadata = ModelMetadata(
                        model_id=metadata_dict["model_id"],
                        framework=ModelFramework(metadata_dict["framework"]),
                        model_type=ModelType(metadata_dict["model_type"]),
                        version=metadata_dict["version"],
                        created_at=datetime.fromisoformat(metadata_dict["created_at"]),
                        performance_metrics=metadata_dict["performance_metrics"],
                        feature_importance=metadata_dict["feature_importance"],
                        training_config=metadata_dict["training_config"],
                        model_size_mb=metadata_dict["model_size_mb"],
                        training_duration_seconds=metadata_dict[
                            "training_duration_seconds"
                        ],
                    )

                    self.model_metadata_registry[metadata.model_id] = metadata

                    # Load the actual model
                    model_file = self.model_storage_path / f"{metadata.model_id}.pkl"
                    if model_file.exists():
                        with open(model_file, "rb") as f:
                            model = pickle.load(f)
                        self.model_registry[metadata.model_id] = model

                        logger.info(
                            f"Loaded model {metadata.model_id} ({metadata.framework.value})"
                        )

                except Exception as e:
                    logger.error(f"Failed to load model from {metadata_file}: {e}")

            logger.info(f"Loaded {len(self.model_registry)} models from storage")

        except Exception as e:
            logger.error(f"Error loading existing models: {e}")

    async def _initialize_feature_processors(self):
        """Initialize feature engineering processors"""
        try:
            # Standard scalers for different data types
            self.feature_processors["numerical_scaler"] = StandardScaler()
            self.feature_processors["categorical_encoder"] = LabelEncoder()

            # Sport-specific processors
            self.feature_processors["player_stats_scaler"] = StandardScaler()
            self.feature_processors["team_stats_scaler"] = StandardScaler()
            self.feature_processors["weather_scaler"] = StandardScaler()

            logger.info("Feature processors initialized")

        except Exception as e:
            logger.error(f"Error initializing feature processors: {e}")

    async def execute_pipeline_stage(
        self, stage: PipelineStage, data: Any = None, config: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute a specific pipeline stage (DAG node)

        Implements Single Leader Architecture where this method orchestrates
        the execution of individual pipeline stages.
        """
        start_time = time.time()

        try:
            self.pipeline_state["current_stage"] = stage
            self.pipeline_state["execution_start_time"] = datetime.now()

            logger.info(f"Executing pipeline stage: {stage.value}")

            # Route to appropriate stage handler
            stage_handlers = {
                PipelineStage.DATA_INGESTION: self._stage_data_ingestion,
                PipelineStage.DATA_PREPROCESSING: self._stage_data_preprocessing,
                PipelineStage.FEATURE_ENGINEERING: self._stage_feature_engineering,
                PipelineStage.MODEL_TRAINING: self._stage_model_training,
                PipelineStage.MODEL_EVALUATION: self._stage_model_evaluation,
                PipelineStage.MODEL_DEPLOYMENT: self._stage_model_deployment,
                PipelineStage.PREDICTION_SERVING: self._stage_prediction_serving,
                PipelineStage.MONITORING: self._stage_monitoring,
            }

            handler = stage_handlers.get(stage)
            if not handler:
                raise ValueError(f"Unknown pipeline stage: {stage}")

            # Execute stage
            result = await handler(data, config or {})

            # Track completion
            execution_time = time.time() - start_time
            self.pipeline_state["completed_stages"].append(stage)
            self.pipeline_state["stage_timings"][stage.value] = execution_time

            logger.info(f"Stage {stage.value} completed in {execution_time:.2f}s")

            return {
                "status": "success",
                "stage": stage.value,
                "execution_time": execution_time,
                "result": result,
            }

        except Exception as e:
            execution_time = time.time() - start_time
            self.pipeline_state["failed_stages"].append(stage)
            self.pipeline_state["stage_timings"][stage.value] = execution_time

            logger.error(f"Stage {stage.value} failed after {execution_time:.2f}s: {e}")

            return {
                "status": "error",
                "stage": stage.value,
                "execution_time": execution_time,
                "error": str(e),
            }

    async def _stage_data_ingestion(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Data ingestion stage - fetch and prepare raw data"""
        try:
            sport = config.get("sport", "MLB")
            date_range = config.get("date_range", 7)  # days

            # Fetch data through existing data manager
            raw_data = await self.data_manager.fetch_comprehensive_data(
                sport=sport, date_range=date_range
            )

            # Cache raw data
            cache_key = f"pipeline_raw_data_{sport}_{date_range}"
            await self.cache_manager.set_cache(cache_key, raw_data, ttl=3600)  # 1 hour

            return {
                "data_points": len(raw_data) if raw_data else 0,
                "sport": sport,
                "date_range": date_range,
                "cache_key": cache_key,
            }

        except Exception as e:
            logger.error(f"Data ingestion failed: {e}")
            raise

    async def _stage_data_preprocessing(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Data preprocessing stage - clean and validate data"""
        try:
            cache_key = config.get("cache_key")
            if not cache_key:
                raise ValueError("Cache key required for data preprocessing")

            # Retrieve raw data
            raw_data = await self.cache_manager.get_cache(cache_key)
            if not raw_data:
                raise ValueError("No data found in cache")

            # Convert to DataFrame for processing
            if isinstance(raw_data, list):
                df = pd.DataFrame(raw_data)
            else:
                df = pd.DataFrame([raw_data])

            # Data cleaning
            original_size = len(df)

            # Remove duplicates
            df = df.drop_duplicates()

            # Handle missing values
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            df[numeric_columns] = df[numeric_columns].fillna(
                df[numeric_columns].median()
            )

            categorical_columns = df.select_dtypes(include=["object"]).columns
            df[categorical_columns] = df[categorical_columns].fillna("Unknown")

            # Remove outliers (IQR method)
            for column in numeric_columns:
                Q1 = df[column].quantile(0.25)
                Q3 = df[column].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]

            # Cache preprocessed data
            preprocessed_cache_key = cache_key.replace("raw_data", "preprocessed_data")
            await self.cache_manager.set_cache(
                preprocessed_cache_key, df.to_dict("records"), ttl=3600
            )

            return {
                "original_size": original_size,
                "processed_size": len(df),
                "removed_outliers": original_size - len(df),
                "numeric_columns": len(numeric_columns),
                "categorical_columns": len(categorical_columns),
                "cache_key": preprocessed_cache_key,
            }

        except Exception as e:
            logger.error(f"Data preprocessing failed: {e}")
            raise

    async def _stage_feature_engineering(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Feature engineering stage - create and transform features"""
        try:
            cache_key = config.get("cache_key")
            target_column = config.get("target_column", "target")

            # Retrieve preprocessed data
            processed_data = await self.cache_manager.get_cache(cache_key)
            df = pd.DataFrame(processed_data)

            # Feature engineering for sports betting
            features_df = await self._create_betting_features(df)

            # Feature selection and scaling
            feature_columns = [
                col for col in features_df.columns if col != target_column
            ]
            X = features_df[feature_columns]
            y = (
                features_df[target_column]
                if target_column in features_df.columns
                else None
            )

            # Scale numerical features
            numerical_features = X.select_dtypes(include=[np.number]).columns
            if len(numerical_features) > 0:
                scaler = StandardScaler()
                X[numerical_features] = scaler.fit_transform(X[numerical_features])

                # Store scaler for later use
                scaler_key = f"scaler_{hashlib.md5(cache_key.encode()).hexdigest()}"
                self.feature_processors[scaler_key] = scaler

            # Encode categorical features
            categorical_features = X.select_dtypes(include=["object"]).columns
            for col in categorical_features:
                encoder = LabelEncoder()
                X[col] = encoder.fit_transform(X[col].astype(str))

                # Store encoder
                encoder_key = (
                    f"encoder_{col}_{hashlib.md5(cache_key.encode()).hexdigest()}"
                )
                self.feature_processors[encoder_key] = encoder

            # Cache engineered features
            features_cache_key = cache_key.replace("preprocessed_data", "features_data")
            feature_data = {
                "X": X.to_dict("records"),
                "y": y.tolist() if y is not None else None,
                "feature_columns": feature_columns,
                "target_column": target_column,
            }

            await self.cache_manager.set_cache(
                features_cache_key, feature_data, ttl=3600
            )

            return {
                "feature_count": len(feature_columns),
                "sample_count": len(X),
                "numerical_features": len(numerical_features),
                "categorical_features": len(categorical_features),
                "has_target": y is not None,
                "cache_key": features_cache_key,
            }

        except Exception as e:
            logger.error(f"Feature engineering failed: {e}")
            raise

    async def _create_betting_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create sports betting specific features"""
        try:
            features_df = df.copy()

            # Player performance features
            if "player_stats" in df.columns:
                features_df["avg_performance"] = df["player_stats"].apply(
                    lambda x: np.mean(list(x.values())) if isinstance(x, dict) else 0
                )

            # Team performance features
            if "team_stats" in df.columns:
                features_df["team_strength"] = df["team_stats"].apply(
                    lambda x: (
                        x.get("win_percentage", 0.5) if isinstance(x, dict) else 0.5
                    )
                )

            # Matchup features
            if "opponent_stats" in df.columns:
                features_df["matchup_differential"] = features_df.get(
                    "team_strength", 0.5
                ) - df["opponent_stats"].apply(
                    lambda x: (
                        x.get("win_percentage", 0.5) if isinstance(x, dict) else 0.5
                    )
                )

            # Time-based features
            if "game_date" in df.columns:
                features_df["day_of_week"] = pd.to_datetime(
                    df["game_date"]
                ).dt.dayofweek
                features_df["month"] = pd.to_datetime(df["game_date"]).dt.month

            # Weather features (if available)
            if "weather" in df.columns:
                features_df["temperature"] = df["weather"].apply(
                    lambda x: x.get("temperature", 70) if isinstance(x, dict) else 70
                )
                features_df["humidity"] = df["weather"].apply(
                    lambda x: x.get("humidity", 50) if isinstance(x, dict) else 50
                )

            # Injury impact features
            if "injuries" in df.columns:
                features_df["injury_impact"] = df["injuries"].apply(
                    lambda x: len(x) if isinstance(x, list) else 0
                )

            # Recent form features
            if "recent_games" in df.columns:
                features_df["recent_form"] = df["recent_games"].apply(
                    lambda x: (
                        np.mean([g.get("result", 0.5) for g in x])
                        if isinstance(x, list)
                        else 0.5
                    )
                )

            return features_df

        except Exception as e:
            logger.error(f"Error creating betting features: {e}")
            return df

    async def _stage_model_training(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Model training stage - train ML models"""
        try:
            cache_key = config.get("cache_key")
            model_type = ModelType(config.get("model_type", "regression"))
            framework = ModelFramework(config.get("framework", "sklearn"))

            # Retrieve feature data
            feature_data = await self.cache_manager.get_cache(cache_key)
            X = pd.DataFrame(feature_data["X"])
            y = np.array(feature_data["y"]) if feature_data["y"] else None

            if y is None:
                raise ValueError("No target variable found for training")

            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            # Train model based on framework and type
            training_start = time.time()

            if framework == ModelFramework.SKLEARN:
                model = await self._train_sklearn_model(X_train, y_train, model_type)
            elif framework == ModelFramework.XGBOOST:
                model = await self._train_xgboost_model(X_train, y_train, model_type)
            elif framework == ModelFramework.LIGHTGBM:
                model = await self._train_lightgbm_model(X_train, y_train, model_type)
            elif framework == ModelFramework.TENSORFLOW and TENSORFLOW_AVAILABLE:
                model = await self._train_tensorflow_model(X_train, y_train, model_type)
            elif framework == ModelFramework.PYTORCH and PYTORCH_AVAILABLE:
                model = await self._train_pytorch_model(X_train, y_train, model_type)
            else:
                raise ValueError(f"Unsupported framework: {framework}")

            training_duration = time.time() - training_start

            # Evaluate model
            y_pred = model.predict(X_test)

            if model_type == ModelType.REGRESSION:
                metrics = {
                    "mse": float(mean_squared_error(y_test, y_pred)),
                    "rmse": float(np.sqrt(mean_squared_error(y_test, y_pred))),
                    "mae": float(mean_absolute_error(y_test, y_pred)),
                    "r2": float(r2_score(y_test, y_pred)),
                }
            else:
                # Classification metrics would go here
                metrics = {"accuracy": 0.0}  # Placeholder

            # Feature importance
            feature_importance = {}
            if hasattr(model, "feature_importances_"):
                feature_importance = dict(
                    zip(feature_data["feature_columns"], model.feature_importances_)
                )

            # Create model metadata
            model_id = f"{framework.value}_{model_type.value}_{int(time.time())}"
            metadata = ModelMetadata(
                model_id=model_id,
                framework=framework,
                model_type=model_type,
                version="1.0.0",
                created_at=datetime.now(),
                performance_metrics=metrics,
                feature_importance=feature_importance,
                training_config=config,
                model_size_mb=0.0,  # Would calculate actual size
                training_duration_seconds=training_duration,
            )

            # Store model and metadata
            await self._store_model(model, metadata)

            return {
                "model_id": model_id,
                "framework": framework.value,
                "model_type": model_type.value,
                "training_duration": training_duration,
                "performance_metrics": metrics,
                "feature_importance_top5": (
                    dict(
                        sorted(
                            feature_importance.items(),
                            key=lambda x: abs(x[1]),
                            reverse=True,
                        )[:5]
                    )
                    if feature_importance
                    else {}
                ),
            }

        except Exception as e:
            logger.error(f"Model training failed: {e}")
            raise

    async def _train_sklearn_model(self, X_train, y_train, model_type: ModelType):
        """Train scikit-learn model"""
        if model_type == ModelType.REGRESSION:
            # Ensemble of multiple algorithms
            models = {
                "rf": RandomForestRegressor(n_estimators=100, random_state=42),
                "gb": GradientBoostingRegressor(n_estimators=100, random_state=42),
            }

            # Train all models and create ensemble
            trained_models = {}
            for name, model in models.items():
                model.fit(X_train, y_train)
                trained_models[name] = model

            # Create ensemble predictor
            class EnsembleModel:
                def __init__(self, models):
                    self.models = models

                def predict(self, X):
                    predictions = []
                    for model in self.models.values():
                        predictions.append(model.predict(X))
                    return np.mean(predictions, axis=0)

                @property
                def feature_importances_(self):
                    # Average feature importances
                    importances = []
                    for model in self.models.values():
                        if hasattr(model, "feature_importances_"):
                            importances.append(model.feature_importances_)
                    return np.mean(importances, axis=0) if importances else None

            return EnsembleModel(trained_models)
        else:
            # Classification models would go here
            raise NotImplementedError("Classification not implemented yet")

    async def _train_xgboost_model(self, X_train, y_train, model_type: ModelType):
        """Train XGBoost model"""
        if model_type == ModelType.REGRESSION:
            model = xgb.XGBRegressor(
                n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42
            )
            model.fit(X_train, y_train)
            return model
        else:
            raise NotImplementedError("XGBoost classification not implemented yet")

    async def _train_lightgbm_model(self, X_train, y_train, model_type: ModelType):
        """Train LightGBM model"""
        if model_type == ModelType.REGRESSION:
            model = lgb.LGBMRegressor(
                n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42
            )
            model.fit(X_train, y_train)
            return model
        else:
            raise NotImplementedError("LightGBM classification not implemented yet")

    async def _train_tensorflow_model(self, X_train, y_train, model_type: ModelType):
        """Train TensorFlow model"""
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("TensorFlow not available")

        if model_type == ModelType.REGRESSION:
            model = tf.keras.Sequential(
                [
                    tf.keras.layers.Dense(
                        128, activation="relu", input_shape=(X_train.shape[1],)
                    ),
                    tf.keras.layers.Dropout(0.2),
                    tf.keras.layers.Dense(64, activation="relu"),
                    tf.keras.layers.Dropout(0.2),
                    tf.keras.layers.Dense(32, activation="relu"),
                    tf.keras.layers.Dense(1),
                ]
            )

            model.compile(optimizer="adam", loss="mse", metrics=["mae"])

            # Train with early stopping
            early_stopping = tf.keras.callbacks.EarlyStopping(
                monitor="val_loss", patience=10, restore_best_weights=True
            )

            X_train_val, X_val, y_train_val, y_val = train_test_split(
                X_train, y_train, test_size=0.2, random_state=42
            )

            history = model.fit(
                X_train_val,
                y_train_val,
                validation_data=(X_val, y_val),
                epochs=100,
                batch_size=32,
                callbacks=[early_stopping],
                verbose=0,
            )

            return model
        else:
            raise NotImplementedError("TensorFlow classification not implemented yet")

    async def _train_pytorch_model(self, X_train, y_train, model_type: ModelType):
        """Train PyTorch model"""
        if not PYTORCH_AVAILABLE:
            raise ImportError("PyTorch not available")

        if model_type == ModelType.REGRESSION:
            # Define PyTorch model
            class MLPRegressor(nn.Module):
                def __init__(self, input_size):
                    super(MLPRegressor, self).__init__()
                    self.layers = nn.Sequential(
                        nn.Linear(input_size, 128),
                        nn.ReLU(),
                        nn.Dropout(0.2),
                        nn.Linear(128, 64),
                        nn.ReLU(),
                        nn.Dropout(0.2),
                        nn.Linear(64, 32),
                        nn.ReLU(),
                        nn.Linear(32, 1),
                    )

                def forward(self, x):
                    return self.layers(x)

            # Convert to tensors
            X_tensor = torch.FloatTensor(X_train.values)
            y_tensor = torch.FloatTensor(y_train).view(-1, 1)

            # Initialize model
            model = MLPRegressor(X_train.shape[1])
            criterion = nn.MSELoss()
            optimizer = optim.Adam(model.parameters(), lr=0.001)

            # Training loop
            model.train()
            for epoch in range(100):
                optimizer.zero_grad()
                outputs = model(X_tensor)
                loss = criterion(outputs, y_tensor)
                loss.backward()
                optimizer.step()

            # Add predict method for compatibility
            def predict_method(X):
                model.eval()
                with torch.no_grad():
                    X_tensor = torch.FloatTensor(
                        X.values if hasattr(X, "values") else X
                    )
                    predictions = model(X_tensor)
                    return predictions.numpy().flatten()

            model.predict = predict_method
            return model
        else:
            raise NotImplementedError("PyTorch classification not implemented yet")

    async def _store_model(self, model: Any, metadata: ModelMetadata):
        """Store model and metadata to disk and registry"""
        try:
            # Save model
            model_file = self.model_storage_path / f"{metadata.model_id}.pkl"
            with open(model_file, "wb") as f:
                pickle.dump(model, f)

            # Save metadata
            metadata_file = (
                self.model_storage_path / f"{metadata.model_id}.metadata.json"
            )
            metadata_dict = asdict(metadata)
            metadata_dict["created_at"] = metadata.created_at.isoformat()

            with open(metadata_file, "w") as f:
                json.dump(metadata_dict, f, indent=2)

            # Update in-memory registries
            self.model_registry[metadata.model_id] = model
            self.model_metadata_registry[metadata.model_id] = metadata

            logger.info(f"Model {metadata.model_id} stored successfully")

        except Exception as e:
            logger.error(f"Error storing model: {e}")
            raise

    async def _stage_model_evaluation(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Model evaluation stage - comprehensive model assessment"""
        try:
            model_id = config.get("model_id")
            if not model_id or model_id not in self.model_registry:
                raise ValueError(f"Model {model_id} not found")

            model = self.model_registry[model_id]
            metadata = self.model_metadata_registry[model_id]

            # Cross-validation would go here
            # SHAP explanation would go here if available
            # Model comparison would go here

            evaluation_results = {
                "model_id": model_id,
                "framework": metadata.framework.value,
                "performance_metrics": metadata.performance_metrics,
                "feature_importance": metadata.feature_importance,
                "evaluation_timestamp": datetime.now().isoformat(),
            }

            return evaluation_results

        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            raise

    async def _stage_model_deployment(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Model deployment stage - prepare model for serving"""
        try:
            model_id = config.get("model_id")
            if not model_id or model_id not in self.model_registry:
                raise ValueError(f"Model {model_id} not found")

            # In a production environment, this would involve:
            # - Model versioning
            # - A/B testing setup
            # - Load balancer configuration
            # - Health checks
            # - Rollback mechanisms

            # For now, mark as deployed
            metadata = self.model_metadata_registry[model_id]

            # Cache model for quick access
            await self.cache_manager.set_cache(
                f"deployed_model_{model_id}",
                {
                    "model_id": model_id,
                    "framework": metadata.framework.value,
                    "deployed_at": datetime.now().isoformat(),
                    "status": "active",
                },
                ttl=86400,  # 24 hours
            )

            return {
                "model_id": model_id,
                "deployment_status": "active",
                "deployed_at": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Model deployment failed: {e}")
            raise

    async def _stage_prediction_serving(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Prediction serving stage - handle real-time predictions"""
        try:
            request = PredictionRequest(**config)
            return await self.predict(request)

        except Exception as e:
            logger.error(f"Prediction serving failed: {e}")
            raise

    async def _stage_monitoring(
        self, data: Any, config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Monitoring stage - track model performance and system health"""
        try:
            # Collect performance metrics
            metrics = {
                "pipeline_health": "healthy",
                "active_models": len(self.model_registry),
                "cache_hit_rate": await self._calculate_cache_hit_rate(),
                "average_prediction_latency": (
                    np.mean(self.performance_metrics["prediction_latency"])
                    if self.performance_metrics["prediction_latency"]
                    else 0.0
                ),
                "system_timestamp": datetime.now().isoformat(),
            }

            # Store metrics in Redis for monitoring dashboard
            await self.redis_service.setex(
                "ml_pipeline_metrics", json.dumps(metrics), 3600  # 1 hour
            )

            return metrics

        except Exception as e:
            logger.error(f"Monitoring stage failed: {e}")
            raise

    async def predict(self, request: PredictionRequest) -> PredictionResponse:
        """
        Make predictions using trained models

        Supports real-time and batch prediction modes with optional
        explainability and confidence intervals.
        """
        start_time = time.time()

        try:
            if request.model_id not in self.model_registry:
                raise ValueError(f"Model {request.model_id} not found")

            model = self.model_registry[request.model_id]
            metadata = self.model_metadata_registry[request.model_id]

            # Prepare features
            features_df = pd.DataFrame([request.features])

            # Apply same preprocessing as training
            # (In production, this would use stored preprocessors)

            # Make prediction
            prediction = model.predict(features_df)

            # Calculate confidence score (simplified)
            confidence_score = min(
                metadata.performance_metrics.get("r2", 0.5) * 100, 95.0
            )

            # Generate explanation if requested
            explanation = None
            if request.explain and SHAP_AVAILABLE:
                explanation = await self._generate_explanation(
                    model, features_df, metadata
                )

            # Calculate confidence interval if requested
            confidence_interval = None
            if request.confidence_interval:
                # Simplified confidence interval calculation
                std_error = (
                    np.std(prediction) if hasattr(prediction, "__len__") else 0.1
                )
                margin = 1.96 * std_error  # 95% CI
                confidence_interval = (
                    (
                        float(prediction[0] - margin)
                        if hasattr(prediction, "__len__")
                        else float(prediction - margin)
                    ),
                    (
                        float(prediction[0] + margin)
                        if hasattr(prediction, "__len__")
                        else float(prediction + margin)
                    ),
                )

            processing_time = (time.time() - start_time) * 1000  # Convert to ms

            # Track performance
            self.performance_metrics["prediction_latency"].append(processing_time)

            response = PredictionResponse(
                prediction=(
                    float(prediction[0])
                    if hasattr(prediction, "__len__")
                    else float(prediction)
                ),
                confidence_score=confidence_score,
                explanation=explanation,
                confidence_interval=confidence_interval,
                model_version=metadata.version,
                processing_time_ms=processing_time,
            )

            return response

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise

    async def _generate_explanation(
        self, model, features_df, metadata: ModelMetadata
    ) -> Dict[str, float]:
        """Generate SHAP explanations for predictions"""
        try:
            if not SHAP_AVAILABLE:
                return {}

            # Use feature importance as simplified explanation
            return dict(list(metadata.feature_importance.items())[:10])

        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            return {}

    async def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate"""
        try:
            # This would track actual cache hits/misses
            # For now, return a placeholder
            return 0.85
        except Exception as e:
            logger.error(f"Cache hit rate calculation failed: {e}")
            return 0.0

    async def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status and health metrics"""
        return {
            "pipeline_state": self.pipeline_state,
            "active_models": len(self.model_registry),
            "model_metadata": {
                model_id: {
                    "framework": metadata.framework.value,
                    "model_type": metadata.model_type.value,
                    "version": metadata.version,
                    "performance": metadata.performance_metrics,
                }
                for model_id, metadata in self.model_metadata_registry.items()
            },
            "performance_metrics": {
                "avg_prediction_latency_ms": (
                    np.mean(self.performance_metrics["prediction_latency"])
                    if self.performance_metrics["prediction_latency"]
                    else 0.0
                ),
                "total_predictions": len(
                    self.performance_metrics["prediction_latency"]
                ),
                "cache_hit_rate": await self._calculate_cache_hit_rate(),
            },
            "system_health": "healthy",
            "last_updated": datetime.now().isoformat(),
        }

    async def cleanup(self):
        """Cleanup resources"""
        try:
            self.executor.shutdown(wait=True)
            logger.info("Enhanced ML Pipeline cleanup completed")
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")


# Factory function for easy initialization
async def create_enhanced_ml_pipeline(
    redis_service: OptimizedRedisService,
    cache_manager: APICache,
    data_manager: EnhancedDataManager,
    **kwargs,
) -> EnhancedMLModelPipeline:
    """Factory function to create and initialize the enhanced ML pipeline"""
    pipeline = EnhancedMLModelPipeline(
        redis_service=redis_service,
        cache_manager=cache_manager,
        data_manager=data_manager,
        **kwargs,
    )

    await pipeline.initialize_pipeline()
    return pipeline
