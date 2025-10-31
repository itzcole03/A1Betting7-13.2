"""
StatProjectionModels: Advanced ML Models for Baseball Projections

This module implements sophisticated ensemble modeling for predicting traditional
baseball statistics using advanced Statcast metrics and engineered features.
"""

import asyncio
import json
import logging
import pickle
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import lightgbm as lgb
import numpy as np
import pandas as pd
import xgboost as xgb

# ML Libraries
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.feature_selection import RFE, SelectKBest, f_regression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit, cross_val_score
from sklearn.preprocessing import RobustScaler, StandardScaler

# Neural Networks
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset

    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False
    logging.warning("PyTorch not available. Neural network models will be disabled.")

# Local imports
from .advanced_feature_engine import AdvancedFeatureEngine, FeatureConfig
from .statcast_data_pipeline import StatcastDataPipeline

logger = logging.getLogger("stat_projection_models")


@dataclass
class ModelConfig:
    """Configuration for ML models"""

    # Model selection
    enable_xgboost: bool = True
    enable_lightgbm: bool = True
    enable_random_forest: bool = True
    enable_neural_network: bool = True

    # Ensemble settings
    ensemble_method: str = "weighted_average"  # weighted_average, stacking, voting
    validation_splits: int = 5
    test_size_ratio: float = 0.2

    # Model hyperparameters
    xgb_params: Dict[str, Any] = field(
        default_factory=lambda: {
            "n_estimators": 500,
            "max_depth": 8,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
        }
    )

    lgb_params: Dict[str, Any] = field(
        default_factory=lambda: {
            "n_estimators": 500,
            "max_depth": 8,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "verbose": -1,
        }
    )

    rf_params: Dict[str, Any] = field(
        default_factory=lambda: {
            "n_estimators": 300,
            "max_depth": 12,
            "min_samples_split": 5,
            "min_samples_leaf": 2,
            "random_state": 42,
            "n_jobs": -1,
        }
    )

    # Feature selection
    feature_selection_method: str = "rfe"  # rfe, selectkbest, mutual_info
    max_features: int = 50

    # Training settings
    early_stopping_rounds: int = 50
    min_samples_for_training: int = 100

    # Performance thresholds
    min_r2_score: float = 0.3
    max_mae_threshold: float = 2.0


@dataclass
class ModelMetrics:
    """Metrics for model evaluation"""

    r2_score: float
    mae: float
    rmse: float
    mape: float  # Mean Absolute Percentage Error
    feature_importance: Dict[str, float]
    cv_scores: List[float]
    train_time: float
    prediction_time: float


@dataclass
class ProjectionResult:
    """Result from a statistical projection"""

    player_id: str
    player_name: str
    stat_type: str
    projected_value: float
    confidence_interval: Tuple[float, float]
    confidence_score: float
    contributing_factors: Dict[str, float]
    model_consensus: Dict[str, float]  # Individual model predictions
    last_updated: datetime
    games_projected: int = 162  # Full season default


class BaseballNeuralNet(nn.Module):
    """Neural network for baseball stat prediction"""

    def __init__(self, input_size: int, hidden_sizes: List[int] = [128, 64, 32]):
        super(BaseballNeuralNet, self).__init__()

        layers = []
        prev_size = input_size

        for hidden_size in hidden_sizes:
            layers.extend(
                [
                    nn.Linear(prev_size, hidden_size),
                    nn.ReLU(),
                    nn.Dropout(0.2),
                    nn.BatchNorm1d(hidden_size),
                ]
            )
            prev_size = hidden_size

        # Output layer
        layers.append(nn.Linear(prev_size, 1))

        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)


class StatProjectionModels:
    """
    Comprehensive ML system for projecting traditional baseball statistics
    using advanced Statcast metrics and engineered features.
    """

    def __init__(self, config: Optional[ModelConfig] = None):
        self.config = config or ModelConfig()
        self.feature_engine = AdvancedFeatureEngine()
        self.data_pipeline = StatcastDataPipeline()

        # Model storage
        self.models: Dict[str, Dict[str, Any]] = {}
        self.scalers: Dict[str, StandardScaler] = {}
        self.feature_selectors: Dict[str, Any] = {}
        self.model_metrics: Dict[str, ModelMetrics] = {}

        # Target statistics we can project
        self.target_stats = [
            "pitcher_strikeouts",
            "total_bases",
            "home_runs",
            "hits_runs_rbis",
            "hits_allowed",
            "stolen_bases",
            "walks_allowed",
            "singles",
            "pitching_outs",
            "walks",
            "hits",
            "earned_runs_allowed",
            "rbis",
            "runs",
            "hitter_strikeouts",
        ]

        logger.info(
            f"🤖 StatProjectionModels initialized for {len(self.target_stats)} statistics"
        )

    async def train_models_for_stat(
        self,
        training_data: pd.DataFrame,
        target_stat: str,
        hyperparameter_tuning: bool = False,
    ) -> Dict[str, ModelMetrics]:
        """
        Train ensemble of models for a specific statistic
        """
        logger.info(f"🏋️ Training models for {target_stat}")

        if target_stat not in self.target_stats:
            raise ValueError(f"Unsupported target stat: {target_stat}")

        # Feature engineering
        engineered_data = self.feature_engine.engineer_features_for_stat(
            training_data, target_stat
        )

        # Prepare training data
        X, y = self._prepare_training_data(engineered_data, target_stat)

        if len(X) < self.config.min_samples_for_training:
            raise ValueError(f"Insufficient training data: {len(X)} samples")

        # Feature selection
        X_selected = self._select_features(X, y, target_stat)

        # Train individual models
        trained_models = {}
        model_metrics = {}

        if self.config.enable_xgboost:
            xgb_model, xgb_metrics = await self._train_xgboost(
                X_selected, y, target_stat, hyperparameter_tuning
            )
            trained_models["xgboost"] = xgb_model
            model_metrics["xgboost"] = xgb_metrics

        if self.config.enable_lightgbm:
            lgb_model, lgb_metrics = await self._train_lightgbm(
                X_selected, y, target_stat, hyperparameter_tuning
            )
            trained_models["lightgbm"] = lgb_model
            model_metrics["lightgbm"] = lgb_metrics

        if self.config.enable_random_forest:
            rf_model, rf_metrics = await self._train_random_forest(
                X_selected, y, target_stat, hyperparameter_tuning
            )
            trained_models["random_forest"] = rf_model
            model_metrics["random_forest"] = rf_metrics

        if self.config.enable_neural_network and PYTORCH_AVAILABLE:
            nn_model, nn_metrics = await self._train_neural_network(
                X_selected, y, target_stat
            )
            trained_models["neural_network"] = nn_model
            model_metrics["neural_network"] = nn_metrics

        # Store models and metrics
        self.models[target_stat] = trained_models
        self.model_metrics[target_stat] = model_metrics

        # Train ensemble if multiple models available
        if len(trained_models) > 1:
            ensemble_weights = self._calculate_ensemble_weights(model_metrics)
            self.models[target_stat]["ensemble_weights"] = ensemble_weights

        logger.info(
            f"✅ Training complete for {target_stat}. Models: {list(trained_models.keys())}"
        )
        return model_metrics

    async def predict_stat(
        self, player_data: pd.DataFrame, target_stat: str, games_to_project: int = 162
    ) -> List[ProjectionResult]:
        """
        Generate predictions for players for a specific statistic
        """
        if target_stat not in self.models:
            raise ValueError(f"No trained models available for {target_stat}")

        logger.info(
            f"🔮 Generating {target_stat} predictions for {len(player_data)} players"
        )

        # Feature engineering
        engineered_data = self.feature_engine.engineer_features_for_stat(
            player_data, target_stat, include_time_series=False
        )

        # Prepare prediction data
        X = self._prepare_prediction_data(engineered_data, target_stat)

        # Get predictions from all available models
        model_predictions = {}
        confidence_scores = {}

        trained_models = self.models[target_stat]

        for model_name, model in trained_models.items():
            if model_name == "ensemble_weights":
                continue

            try:
                pred, confidence = await self._predict_with_model(
                    model, X, model_name, target_stat
                )
                model_predictions[model_name] = pred
                confidence_scores[model_name] = confidence
            except Exception as e:
                logger.warning(f"Prediction failed for {model_name}: {e}")

        # Ensemble predictions
        ensemble_predictions = self._ensemble_predict(
            model_predictions, trained_models.get("ensemble_weights", {})
        )

        # Create projection results
        results = []
        for i, row in engineered_data.iterrows():
            # Scale predictions based on games to project
            game_factor = games_to_project / 162
            projected_value = ensemble_predictions[i] * game_factor

            # Calculate confidence interval
            pred_std = np.std([pred[i] for pred in model_predictions.values()])
            confidence_interval = (
                projected_value - 1.96 * pred_std * game_factor,
                projected_value + 1.96 * pred_std * game_factor,
            )

            # Overall confidence score
            confidence_score = (
                np.mean(list(confidence_scores.values())) if confidence_scores else 0.5
            )

            # Contributing factors (feature importance)
            contributing_factors = self._calculate_contributing_factors(
                row, target_stat, model_predictions
            )

            result = ProjectionResult(
                player_id=str(row.get("player_id", f"player_{i}")),
                player_name=str(row.get("player_name", f"Player {i}")),
                stat_type=target_stat,
                projected_value=projected_value,
                confidence_interval=confidence_interval,
                confidence_score=confidence_score,
                contributing_factors=contributing_factors,
                model_consensus={
                    name: pred[i] * game_factor
                    for name, pred in model_predictions.items()
                },
                last_updated=datetime.now(),
                games_projected=games_to_project,
            )

            results.append(result)

        logger.info(f"✅ Generated {len(results)} projections for {target_stat}")
        return results

    async def batch_predict_all_stats(
        self, player_data: pd.DataFrame, games_to_project: int = 162
    ) -> Dict[str, List[ProjectionResult]]:
        """
        Generate predictions for all available statistics
        """
        logger.info(
            f"🎯 Generating projections for all {len(self.models)} trained statistics"
        )

        all_predictions = {}

        for target_stat in self.models.keys():
            try:
                predictions = await self.predict_stat(
                    player_data, target_stat, games_to_project
                )
                all_predictions[target_stat] = predictions
            except Exception as e:
                logger.error(f"Failed to predict {target_stat}: {e}")
                all_predictions[target_stat] = []

        logger.info(
            f"✅ Batch prediction complete for {len(all_predictions)} statistics"
        )
        return all_predictions

    def get_model_performance(
        self, target_stat: str
    ) -> Optional[Dict[str, ModelMetrics]]:
        """Get performance metrics for models of a specific statistic"""
        return self.model_metrics.get(target_stat)

    def save_models(self, filepath: str) -> None:
        """Save trained models to disk"""
        logger.info(f"💾 Saving models to {filepath}")

        save_data = {
            "models": self.models,
            "scalers": self.scalers,
            "feature_selectors": self.feature_selectors,
            "model_metrics": self.model_metrics,
            "config": self.config,
            "target_stats": self.target_stats,
            "saved_at": datetime.now().isoformat(),
        }

        with open(filepath, "wb") as f:
            pickle.dump(save_data, f)

        logger.info("✅ Models saved successfully")

    def load_models(self, filepath: str) -> None:
        """Load trained models from disk"""
        logger.info(f"📂 Loading models from {filepath}")

        with open(filepath, "rb") as f:
            save_data = pickle.load(f)

        self.models = save_data["models"]
        self.scalers = save_data["scalers"]
        self.feature_selectors = save_data["feature_selectors"]
        self.model_metrics = save_data["model_metrics"]
        self.target_stats = save_data["target_stats"]

        logger.info(f"✅ Loaded models for {len(self.models)} statistics")

    # Private helper methods
    def _prepare_training_data(
        self, data: pd.DataFrame, target_stat: str
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare features and target for training"""
        # Exclude non-feature columns
        exclude_cols = [
            "player_id",
            "player_name",
            "game_date",
            "team",
            "opponent",
            target_stat,  # Target column
        ]

        feature_cols = [col for col in data.columns if col not in exclude_cols]

        # Handle missing target values
        valid_rows = data[target_stat].notna()

        X = data.loc[valid_rows, feature_cols].fillna(0)
        y = data.loc[valid_rows, target_stat]

        logger.info(
            f"Training data prepared: {X.shape[0]} samples, {X.shape[1]} features"
        )
        return X, y

    def _prepare_prediction_data(
        self, data: pd.DataFrame, target_stat: str
    ) -> pd.DataFrame:
        """Prepare features for prediction"""
        exclude_cols = ["player_id", "player_name", "game_date", "team", "opponent"]

        feature_cols = [col for col in data.columns if col not in exclude_cols]
        X = data[feature_cols].fillna(0)

        return X

    def _select_features(
        self, X: pd.DataFrame, y: pd.Series, target_stat: str
    ) -> pd.DataFrame:
        """Select most important features for the target statistic"""
        if self.config.feature_selection_method == "rfe":
            # Recursive Feature Elimination
            estimator = RandomForestRegressor(n_estimators=50, random_state=42)
            selector = RFE(estimator, n_features_to_select=self.config.max_features)
        elif self.config.feature_selection_method == "selectkbest":
            # Select K Best features
            selector = SelectKBest(f_regression, k=self.config.max_features)
        else:
            # No feature selection
            return X

        X_selected = selector.fit_transform(X, y)
        selected_features = X.columns[selector.support_]

        # Store selector for later use
        self.feature_selectors[target_stat] = {
            "selector": selector,
            "selected_features": selected_features.tolist(),
        }

        logger.info(
            f"Feature selection: {len(selected_features)} features selected from {X.shape[1]}"
        )
        return pd.DataFrame(X_selected, columns=selected_features, index=X.index)

    async def _train_xgboost(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        target_stat: str,
        hyperparameter_tuning: bool,
    ) -> Tuple[xgb.XGBRegressor, ModelMetrics]:
        """Train XGBoost model"""
        start_time = datetime.now()

        if hyperparameter_tuning:
            # Hyperparameter tuning
            param_grid = {
                "n_estimators": [300, 500, 700],
                "max_depth": [6, 8, 10],
                "learning_rate": [0.05, 0.1, 0.15],
                "subsample": [0.8, 0.9],
                "colsample_bytree": [0.8, 0.9],
            }

            model = xgb.XGBRegressor(random_state=42)
            grid_search = GridSearchCV(
                model, param_grid, cv=3, scoring="neg_mean_absolute_error", n_jobs=-1
            )
            grid_search.fit(X, y)
            best_model = grid_search.best_estimator_
        else:
            best_model = xgb.XGBRegressor(**self.config.xgb_params)
            best_model.fit(X, y)

        train_time = (datetime.now() - start_time).total_seconds()

        # Calculate metrics
        metrics = self._calculate_metrics(best_model, X, y, train_time, "XGBoost")

        logger.info(
            f"XGBoost trained: R² = {metrics.r2_score:.3f}, MAE = {metrics.mae:.3f}"
        )
        return best_model, metrics

    async def _train_lightgbm(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        target_stat: str,
        hyperparameter_tuning: bool,
    ) -> Tuple[lgb.LGBMRegressor, ModelMetrics]:
        """Train LightGBM model"""
        start_time = datetime.now()

        if hyperparameter_tuning:
            param_grid = {
                "n_estimators": [300, 500, 700],
                "max_depth": [6, 8, 10],
                "learning_rate": [0.05, 0.1, 0.15],
                "subsample": [0.8, 0.9],
                "colsample_bytree": [0.8, 0.9],
            }

            model = lgb.LGBMRegressor(random_state=42, verbose=-1)
            grid_search = GridSearchCV(
                model, param_grid, cv=3, scoring="neg_mean_absolute_error", n_jobs=-1
            )
            grid_search.fit(X, y)
            best_model = grid_search.best_estimator_
        else:
            best_model = lgb.LGBMRegressor(**self.config.lgb_params)
            best_model.fit(X, y)

        train_time = (datetime.now() - start_time).total_seconds()

        # Calculate metrics
        metrics = self._calculate_metrics(best_model, X, y, train_time, "LightGBM")

        logger.info(
            f"LightGBM trained: R² = {metrics.r2_score:.3f}, MAE = {metrics.mae:.3f}"
        )
        return best_model, metrics

    async def _train_random_forest(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        target_stat: str,
        hyperparameter_tuning: bool,
    ) -> Tuple[RandomForestRegressor, ModelMetrics]:
        """Train Random Forest model"""
        start_time = datetime.now()

        if hyperparameter_tuning:
            param_grid = {
                "n_estimators": [200, 300, 400],
                "max_depth": [10, 12, 15],
                "min_samples_split": [2, 5, 10],
                "min_samples_leaf": [1, 2, 4],
            }

            model = RandomForestRegressor(random_state=42, n_jobs=-1)
            grid_search = GridSearchCV(
                model, param_grid, cv=3, scoring="neg_mean_absolute_error", n_jobs=-1
            )
            grid_search.fit(X, y)
            best_model = grid_search.best_estimator_
        else:
            best_model = RandomForestRegressor(**self.config.rf_params)
            best_model.fit(X, y)

        train_time = (datetime.now() - start_time).total_seconds()

        # Calculate metrics
        metrics = self._calculate_metrics(best_model, X, y, train_time, "Random Forest")

        logger.info(
            f"Random Forest trained: R² = {metrics.r2_score:.3f}, MAE = {metrics.mae:.3f}"
        )
        return best_model, metrics

    async def _train_neural_network(
        self, X: pd.DataFrame, y: pd.Series, target_stat: str
    ) -> Tuple[BaseballNeuralNet, ModelMetrics]:
        """Train Neural Network model"""
        if not PYTORCH_AVAILABLE:
            raise RuntimeError("PyTorch not available for neural network training")

        start_time = datetime.now()

        # Prepare data for PyTorch
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Store scaler
        self.scalers[f"{target_stat}_nn"] = scaler

        # Convert to tensors
        X_tensor = torch.FloatTensor(X_scaled)
        y_tensor = torch.FloatTensor(y.values).reshape(-1, 1)

        # Create dataset and dataloader
        dataset = TensorDataset(X_tensor, y_tensor)
        dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

        # Initialize model
        model = BaseballNeuralNet(input_size=X.shape[1])
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)

        # Training loop
        model.train()
        for epoch in range(100):
            total_loss = 0
            for batch_X, batch_y in dataloader:
                optimizer.zero_grad()
                outputs = model(batch_X)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if epoch % 20 == 0:
                avg_loss = total_loss / len(dataloader)
                logger.debug(f"Epoch {epoch}, Loss: {avg_loss:.4f}")

        train_time = (datetime.now() - start_time).total_seconds()

        # Calculate metrics
        model.eval()
        with torch.no_grad():
            predictions = model(X_tensor).numpy().flatten()

        metrics = ModelMetrics(
            r2_score=r2_score(y, predictions),
            mae=mean_absolute_error(y, predictions),
            rmse=np.sqrt(mean_squared_error(y, predictions)),
            mape=np.mean(np.abs((y - predictions) / y)) * 100,
            feature_importance={},  # Neural networks don't have traditional feature importance
            cv_scores=[],
            train_time=train_time,
            prediction_time=0.0,
        )

        logger.info(
            f"Neural Network trained: R² = {metrics.r2_score:.3f}, MAE = {metrics.mae:.3f}"
        )
        return model, metrics

    def _calculate_metrics(
        self,
        model: Any,
        X: pd.DataFrame,
        y: pd.Series,
        train_time: float,
        model_name: str,
    ) -> ModelMetrics:
        """Calculate comprehensive metrics for a trained model"""
        # Cross-validation scores
        cv_scores = cross_val_score(
            model,
            X,
            y,
            cv=self.config.validation_splits,
            scoring="neg_mean_absolute_error",
        )

        # Predictions for metrics
        start_pred_time = datetime.now()
        predictions = model.predict(X)
        prediction_time = (datetime.now() - start_pred_time).total_seconds()

        # Feature importance
        feature_importance = {}
        if hasattr(model, "feature_importances_"):
            feature_importance = dict(zip(X.columns, model.feature_importances_))
        elif hasattr(model, "coef_"):
            feature_importance = dict(zip(X.columns, np.abs(model.coef_)))

        return ModelMetrics(
            r2_score=r2_score(y, predictions),
            mae=mean_absolute_error(y, predictions),
            rmse=np.sqrt(mean_squared_error(y, predictions)),
            mape=np.mean(np.abs((y - predictions) / (y + 1e-6))) * 100,
            feature_importance=feature_importance,
            cv_scores=(-cv_scores).tolist(),  # Convert negative MAE back to positive
            train_time=train_time,
            prediction_time=prediction_time,
        )

    async def _predict_with_model(
        self, model: Any, X: pd.DataFrame, model_name: str, target_stat: str
    ) -> Tuple[np.ndarray, float]:
        """Generate predictions with a single model"""
        if model_name == "neural_network" and PYTORCH_AVAILABLE:
            # Neural network prediction
            scaler = self.scalers.get(f"{target_stat}_nn")
            if scaler:
                X_scaled = scaler.transform(X)
                X_tensor = torch.FloatTensor(X_scaled)
                model.eval()
                with torch.no_grad():
                    predictions = model(X_tensor).numpy().flatten()
            else:
                predictions = np.zeros(len(X))

            confidence = 0.7  # Default confidence for NN
        else:
            # Scikit-learn style models
            predictions = model.predict(X)

            # Calculate confidence based on model metrics
            if target_stat in self.model_metrics:
                model_metrics = self.model_metrics[target_stat].get(model_name)
                if model_metrics:
                    confidence = max(0.1, min(0.95, model_metrics.r2_score))
                else:
                    confidence = 0.5
            else:
                confidence = 0.5

        return predictions, confidence

    def _ensemble_predict(
        self,
        model_predictions: Dict[str, np.ndarray],
        ensemble_weights: Dict[str, float],
    ) -> np.ndarray:
        """Combine predictions from multiple models"""
        if not model_predictions:
            return np.array([])

        if len(model_predictions) == 1:
            return list(model_predictions.values())[0]

        # Calculate weighted average
        total_weight = 0
        ensemble_pred = np.zeros_like(list(model_predictions.values())[0])

        for model_name, predictions in model_predictions.items():
            weight = ensemble_weights.get(model_name, 1.0)
            ensemble_pred += weight * predictions
            total_weight += weight

        if total_weight > 0:
            ensemble_pred /= total_weight

        return ensemble_pred

    def _calculate_ensemble_weights(
        self, model_metrics: Dict[str, ModelMetrics]
    ) -> Dict[str, float]:
        """Calculate ensemble weights based on model performance"""
        weights = {}

        for model_name, metrics in model_metrics.items():
            # Weight based on R² score and inverse of MAE
            r2_weight = max(0.1, metrics.r2_score)
            mae_weight = 1.0 / (1.0 + metrics.mae)

            weights[model_name] = r2_weight * mae_weight

        # Normalize weights
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v / total_weight for k, v in weights.items()}

        return weights

    def _calculate_contributing_factors(
        self,
        player_row: pd.Series,
        target_stat: str,
        model_predictions: Dict[str, np.ndarray],
    ) -> Dict[str, float]:
        """Calculate which factors contribute most to the prediction"""
        # Use feature importance from the best performing model
        if target_stat in self.model_metrics:
            best_model = max(
                self.model_metrics[target_stat].items(), key=lambda x: x[1].r2_score
            )[0]

            feature_importance = self.model_metrics[target_stat][
                best_model
            ].feature_importance

            # Get top contributing features
            sorted_features = sorted(
                feature_importance.items(), key=lambda x: x[1], reverse=True
            )[:10]

            return dict(sorted_features)

        return {}


# Example usage
if __name__ == "__main__":
    # Example model training and prediction
    projection_models = StatProjectionModels()

    # Mock training data
    training_data = pd.DataFrame(
        {
            "player_id": range(100),
            "avg_exit_velocity": np.random.normal(90, 5, 100),
            "avg_launch_angle": np.random.normal(15, 8, 100),
            "barrel_rate": np.random.uniform(0.05, 0.15, 100),
            "home_runs": np.random.poisson(25, 100),  # Target variable
            "game_date": pd.date_range("2024-01-01", periods=100),
            "player_name": [f"Player {i}" for i in range(100)],
        }
    )

    # Train models
    asyncio.run(projection_models.train_models_for_stat(training_data, "home_runs"))

    # Generate predictions
    prediction_data = training_data.iloc[:10].copy()
    results = asyncio.run(projection_models.predict_stat(prediction_data, "home_runs"))

    for result in results[:3]:
        print(
            f"{result.player_name}: {result.projected_value:.1f} HR "
            f"(Confidence: {result.confidence_score:.2f})"
        )
