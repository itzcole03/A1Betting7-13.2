"""
Baseline Models - Simple statistical models for NBA prop predictions
"""

import hashlib
import logging
import math
from typing import Dict, Any

from .model_registry import BaseStatModel
from .historical_stats_provider import historical_stats_provider

logger = logging.getLogger(__name__)


class PoissonLikeModel(BaseStatModel):
    """
    Poisson-like model for counting statistics (ASSISTS, REBOUNDS, STEALS, etc.)
    """
    
    def __init__(self):
        self.name = "baseline_poisson"
        self.version = "v1"
        self.model_type = "POISSON"
        self.hyperparams = {
            "lookback_games": 5,
            "min_lambda": 0.01
        }
    
    async def predict(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        context: dict
    ) -> dict:
        """
        Predict using Poisson distribution for counting stats.
        
        Args:
            player_id: Player identifier
            prop_type: Prop type (ASSISTS, REBOUNDS, etc.)
            context: Additional context data
            
        Returns:
            dict: Prediction with mean, variance, distribution_family, etc.
        """
        try:
            # Get historical stats
            lookback_games = self.hyperparams.get("lookback_games", 5)
            historical_stats = await historical_stats_provider.get_player_stat_history(
                player_id=player_id,
                prop_type=prop_type,
                lookback_games=lookback_games
            )
            
            if not historical_stats:
                logger.warning(f"No historical stats for player {player_id}, prop {prop_type}")
                return self._default_prediction(prop_type)
            
            # Calculate Poisson parameter (lambda)
            historical_mean = sum(historical_stats) / len(historical_stats)
            lambda_param = max(self.hyperparams.get("min_lambda", 0.01), historical_mean)
            
            # For Poisson distribution: variance = mean
            variance = lambda_param
            
            # Compute feature hash
            features_used = {
                "historical_mean": historical_mean,
                "lookback_games": lookback_games,
                "lambda": lambda_param
            }
            features_hash = self._compute_features_hash(features_used)
            
            prediction = {
                "mean": lambda_param,
                "variance": variance,
                "distribution_family": "POISSON",
                "sample_size": len(historical_stats),
                "features_used": features_used,
                "features_hash": features_hash
            }
            
            logger.debug(f"Poisson prediction for player {player_id}, {prop_type}: {prediction}")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in Poisson prediction: {e}")
            return self._default_prediction(prop_type)
    
    def _default_prediction(self, prop_type: str) -> dict:
        """Default prediction when data is unavailable"""
        # Default lambdas for different prop types
        default_lambdas = {
            "ASSISTS": 4.0,
            "REBOUNDS": 6.0,
            "STEALS": 1.0,
            "BLOCKS": 0.8,
            "TURNOVERS": 2.5,
            "THREE_POINTERS_MADE": 1.5
        }
        
        lambda_param = default_lambdas.get(prop_type.upper(), 2.0)
        
        return {
            "mean": lambda_param,
            "variance": lambda_param,  # Poisson property
            "distribution_family": "POISSON",
            "sample_size": 0,
            "features_used": {"default": True, "default_lambda": lambda_param},
            "features_hash": self._compute_features_hash({"default": True, "prop_type": prop_type})
        }
    
    def _compute_features_hash(self, features: Dict[str, Any]) -> str:
        """Compute SHA256 hash of features"""
        # Sort features for consistent hashing
        sorted_features = sorted(features.items())
        features_str = str(sorted_features)
        return hashlib.sha256(features_str.encode()).hexdigest()


class NormalModel(BaseStatModel):
    """
    Normal distribution model for continuous statistics (POINTS, MINUTES, etc.)
    """
    
    def __init__(self):
        self.name = "baseline_normal"
        self.version = "v1"
        self.model_type = "NORMAL"
        self.hyperparams = {
            "lookback_games": 5,
            "min_variance": 0.25  # Minimum variance floor
        }
    
    async def predict(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        context: dict
    ) -> dict:
        """
        Predict using Normal distribution for continuous stats.
        
        Args:
            player_id: Player identifier
            prop_type: Prop type (POINTS, MINUTES, etc.)
            context: Additional context data
            
        Returns:
            dict: Prediction with mean, variance, distribution_family, etc.
        """
        try:
            # Get historical stats
            lookback_games = self.hyperparams.get("lookback_games", 5)
            historical_stats = await historical_stats_provider.get_player_stat_history(
                player_id=player_id,
                prop_type=prop_type,
                lookback_games=lookback_games
            )
            
            if not historical_stats:
                logger.warning(f"No historical stats for player {player_id}, prop {prop_type}")
                return self._default_prediction(prop_type)
            
            # Calculate mean and variance
            n = len(historical_stats)
            mean = sum(historical_stats) / n
            
            if n > 1:
                # Sample variance
                variance = sum((x - mean) ** 2 for x in historical_stats) / (n - 1)
            else:
                # Single sample - use heuristic variance
                variance = (mean * 0.3) ** 2  # 30% coefficient of variation
            
            # Apply minimum variance floor
            min_variance = self.hyperparams.get("min_variance", 0.25)
            variance = max(variance, min_variance)
            
            # Compute feature hash
            features_used = {
                "historical_mean": mean,
                "historical_variance": variance,
                "lookback_games": lookback_games,
                "sample_size": n
            }
            features_hash = self._compute_features_hash(features_used)
            
            prediction = {
                "mean": mean,
                "variance": variance,
                "distribution_family": "NORMAL",
                "sample_size": n,
                "features_used": features_used,
                "features_hash": features_hash
            }
            
            logger.debug(f"Normal prediction for player {player_id}, {prop_type}: {prediction}")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in Normal prediction: {e}")
            return self._default_prediction(prop_type)
    
    def _default_prediction(self, prop_type: str) -> dict:
        """Default prediction when data is unavailable"""
        # Default means and standard deviations for different prop types
        defaults = {
            "POINTS": {"mean": 12.0, "std": 6.0},
            "MINUTES": {"mean": 25.0, "std": 8.0},
            "FIELD_GOALS_MADE": {"mean": 5.0, "std": 2.5},
            "FREE_THROWS_MADE": {"mean": 3.0, "std": 2.0},
        }
        
        default = defaults.get(prop_type.upper(), {"mean": 8.0, "std": 4.0})
        variance = default["std"] ** 2
        
        return {
            "mean": default["mean"],
            "variance": variance,
            "distribution_family": "NORMAL",
            "sample_size": 0,
            "features_used": {"default": True, "default_mean": default["mean"], "default_std": default["std"]},
            "features_hash": self._compute_features_hash({"default": True, "prop_type": prop_type})
        }
    
    def _compute_features_hash(self, features: Dict[str, Any]) -> str:
        """Compute SHA256 hash of features"""
        # Sort features for consistent hashing
        sorted_features = sorted(features.items())
        features_str = str(sorted_features)
        return hashlib.sha256(features_str.encode()).hexdigest()


class NegativeBinomialModel(BaseStatModel):
    """
    Negative Binomial model for overdispersed count data (stub implementation)
    """
    
    def __init__(self):
        self.name = "baseline_negative_binomial"
        self.version = "v1"
        self.model_type = "NEG_BINOMIAL"
        self.hyperparams = {
            "lookback_games": 5,
            "overdispersion_k": 2.0  # Default overdispersion parameter
        }
    
    async def predict(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        context: dict
    ) -> dict:
        """
        Predict using Negative Binomial distribution for overdispersed counts.
        
        TODO: Implement proper overdispersion estimation
        
        Args:
            player_id: Player identifier
            prop_type: Prop type
            context: Additional context data
            
        Returns:
            dict: Prediction with mean, variance, distribution_family, etc.
        """
        try:
            # Get historical stats
            lookback_games = self.hyperparams.get("lookback_games", 5)
            historical_stats = await historical_stats_provider.get_player_stat_history(
                player_id=player_id,
                prop_type=prop_type,
                lookback_games=lookback_games
            )
            
            if not historical_stats:
                logger.warning(f"No historical stats for player {player_id}, prop {prop_type}")
                return self._default_prediction(prop_type)
            
            # Calculate mean
            mean = sum(historical_stats) / len(historical_stats)
            
            # TODO: Implement proper overdispersion estimation
            # For now, use simple heuristic: variance = mean + mean^2 / k
            k = self.hyperparams.get("overdispersion_k", 2.0)
            variance = mean + (mean ** 2) / k
            
            # Compute feature hash
            features_used = {
                "historical_mean": mean,
                "overdispersion_k": k,
                "lookback_games": lookback_games,
                "sample_size": len(historical_stats)
            }
            features_hash = self._compute_features_hash(features_used)
            
            prediction = {
                "mean": mean,
                "variance": variance,
                "distribution_family": "NEG_BINOMIAL",
                "sample_size": len(historical_stats),
                "features_used": features_used,
                "features_hash": features_hash
            }
            
            logger.debug(f"Negative Binomial prediction for player {player_id}, {prop_type}: {prediction}")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in Negative Binomial prediction: {e}")
            return self._default_prediction(prop_type)
    
    def _default_prediction(self, prop_type: str) -> dict:
        """Default prediction when data is unavailable"""
        # Use Poisson-like defaults but with overdispersion
        default_means = {
            "ASSISTS": 4.0,
            "REBOUNDS": 6.0,
            "STEALS": 1.0,
            "BLOCKS": 0.8,
            "TURNOVERS": 2.5,
        }
        
        mean = default_means.get(prop_type.upper(), 2.0)
        k = self.hyperparams.get("overdispersion_k", 2.0)
        variance = mean + (mean ** 2) / k
        
        return {
            "mean": mean,
            "variance": variance,
            "distribution_family": "NEG_BINOMIAL",
            "sample_size": 0,
            "features_used": {"default": True, "default_mean": mean, "overdispersion_k": k},
            "features_hash": self._compute_features_hash({"default": True, "prop_type": prop_type})
        }
    
    def _compute_features_hash(self, features: Dict[str, Any]) -> str:
        """Compute SHA256 hash of features"""
        # Sort features for consistent hashing
        sorted_features = sorted(features.items())
        features_str = str(sorted_features)
        return hashlib.sha256(features_str.encode()).hexdigest()


# Model factory for creating instances
def create_baseline_model(model_type: str, sport: str = "NBA") -> BaseStatModel:
    """
    Create a baseline model instance by type and sport.
    
    Args:
        model_type: Type of model to create
        sport: Sport context ("NBA", "MLB")
        
    Returns:
        BaseStatModel: Model instance
        
    Raises:
        ValueError: If model type is not supported
    """
    model_type = model_type.upper()
    sport = sport.upper()
    
    # For MLB, try MLB-specific models first
    if sport == "MLB":
        try:
            from .mlb_models import create_mlb_model
            return create_mlb_model(model_type)
        except (ImportError, ValueError):
            # Fallback to general models with MLB-aware parameters
            pass
    
    # General models for NBA and fallback for MLB
    if model_type == "POISSON":
        return PoissonLikeModel()
    elif model_type == "NORMAL":
        return NormalModel()
    elif model_type == "NEG_BINOMIAL":
        return NegativeBinomialModel()
    else:
        raise ValueError(f"Unsupported model type: {model_type}")


# Recommended models for different prop types (multi-sport)
PROP_TYPE_MODEL_MAPPING = {
    # NBA Counting stats -> Poisson
    "ASSISTS": "POISSON",
    "REBOUNDS": "POISSON", 
    "STEALS": "POISSON",
    "BLOCKS": "POISSON",
    "TURNOVERS": "POISSON",
    "THREE_POINTERS_MADE": "POISSON",
    
    # NBA Continuous stats -> Normal
    "POINTS": "NORMAL",
    "MINUTES": "NORMAL",
    "FIELD_GOALS_MADE": "NORMAL",
    "FREE_THROWS_MADE": "NORMAL",
    
    # Potentially overdispersed -> Negative Binomial (experimental)
    # Can be enabled later for specific use cases
}


# MLB-aware prop type model mappings
def get_model_for_prop_type(prop_type: str, sport: str = "NBA") -> BaseStatModel:
    """
    Get the appropriate model for a given prop type and sport.
    
    Args:
        prop_type: The prop type to get a model for
        sport: Sport context ("NBA", "MLB")
        
    Returns:
        BaseStatModel: Appropriate model instance
    """
    sport = sport.upper()
    prop_type = prop_type.upper()
    
    if sport == "MLB":
        # Use MLB-specific mappings
        try:
            from .mlb_models import MLB_PROP_TYPE_MODEL_MAPPING, get_mlb_model_for_prop_type
            return get_mlb_model_for_prop_type(prop_type)
        except ImportError:
            # Fallback to NBA mappings if MLB models not available
            pass
    
    # NBA or fallback mappings
    model_type = PROP_TYPE_MODEL_MAPPING.get(prop_type, "NORMAL")
    return create_baseline_model(model_type, sport)