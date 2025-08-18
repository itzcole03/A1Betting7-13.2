"""
MLB-Specific Models - Statistical models for MLB prop predictions

Section 2: MLB-Specific Modeling Adaptations
- Extended baseline model factory with prop-type distribution mapping  
- MLB-specific edge detection logic
- Prop type distributions: Poisson for strikeouts, Binomial for hits, etc.
"""

import hashlib
import logging
import math
from typing import Dict, Any

try:
    from .model_registry import BaseStatModel
    from .historical_stats_provider import historical_stats_provider
except ImportError:
    # For standalone testing, create simple stubs
    from abc import ABC, abstractmethod
    
    class BaseStatModel(ABC):
        """Abstract base class for statistical models"""
        @abstractmethod
        async def predict(self, *, player_id: int, prop_type: str, context: dict) -> dict:
            pass
    
    class HistoricalStatsProvider:
        async def get_player_stat_history(self, player_id: int, prop_type: str, lookback_games: int):
            # Mock data for testing
            if prop_type == "HITS":
                return [1, 2, 0, 3, 1]  # Sample hit counts
            elif prop_type == "STRIKEOUTS_PITCHER":
                return [6, 8, 4, 7, 9]  # Sample strikeout counts
            else:
                return [2.5, 3.1, 1.8, 4.2, 2.9]  # Sample continuous stats
    
    historical_stats_provider = HistoricalStatsProvider()

logger = logging.getLogger(__name__)


class BinomialModel(BaseStatModel):
    """
    Binomial model for binary outcome statistics (HITS, HOME_RUNS with success probability)
    
    Perfect for MLB props where we have discrete trials with binary outcomes:
    - At-bats resulting in hits
    - Plate appearances resulting in home runs
    - Innings pitched with strikeouts
    """
    
    def __init__(self):
        self.name = "mlb_binomial"
        self.version = "v1"
        self.model_type = "BINOMIAL"
        self.hyperparams = {
            "lookback_games": 7,  # Week of games for MLB
            "min_probability": 0.001,  # Minimum success probability
            "max_probability": 0.999   # Maximum success probability
        }
    
    async def predict(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        context: dict
    ) -> dict:
        """
        Predict using Binomial distribution for binary outcome stats.
        
        Args:
            player_id: Player identifier
            prop_type: Prop type (HITS, HOME_RUNS, etc.)
            context: Additional context data (at_bats, plate_appearances, etc.)
            
        Returns:
            dict: Prediction with mean, variance, distribution_family, etc.
        """
        try:
            # Get historical stats
            lookback_games = self.hyperparams.get("lookback_games", 7)
            historical_stats = await historical_stats_provider.get_player_stat_history(
                player_id=player_id,
                prop_type=prop_type,
                lookback_games=lookback_games
            )
            
            if not historical_stats:
                logger.warning(f"No historical stats for player {player_id}, prop {prop_type}")
                return self._default_prediction(prop_type, context)
            
            # Get number of trials (at-bats, plate appearances, etc.)
            trials_context_key = self._get_trials_context_key(prop_type)
            n_trials = context.get(trials_context_key, self._get_default_trials(prop_type))
            
            # Calculate success probability from historical data
            total_successes = sum(historical_stats)
            total_opportunities = len(historical_stats) * n_trials  # Approximate
            
            success_prob = total_successes / total_opportunities if total_opportunities > 0 else 0.0
            
            # Apply probability bounds
            success_prob = max(self.hyperparams.get("min_probability", 0.001), success_prob)
            success_prob = min(self.hyperparams.get("max_probability", 0.999), success_prob)
            
            # For Binomial distribution: mean = n*p, variance = n*p*(1-p)
            mean = n_trials * success_prob
            variance = n_trials * success_prob * (1 - success_prob)
            
            # Compute feature hash
            features_used = {
                "success_probability": success_prob,
                "n_trials": n_trials,
                "lookback_games": lookback_games,
                "total_successes": total_successes,
                "total_opportunities": total_opportunities
            }
            features_hash = self._compute_features_hash(features_used)
            
            prediction = {
                "mean": mean,
                "variance": variance,
                "distribution_family": "BINOMIAL",
                "sample_size": len(historical_stats),
                "features_used": features_used,
                "features_hash": features_hash,
                "binomial_params": {
                    "n": n_trials,
                    "p": success_prob
                }
            }
            
            logger.debug(f"Binomial prediction for player {player_id}, {prop_type}: {prediction}")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in Binomial prediction: {e}")
            return self._default_prediction(prop_type, context)
    
    def _get_trials_context_key(self, prop_type: str) -> str:
        """Get the context key for number of trials based on prop type"""
        trials_mapping = {
            "HITS": "at_bats",
            "HOME_RUNS": "at_bats", 
            "TOTAL_BASES": "at_bats",
            "RUNS": "plate_appearances",
            "RBI": "at_bats"
        }
        return trials_mapping.get(prop_type.upper(), "at_bats")
    
    def _get_default_trials(self, prop_type: str) -> int:
        """Get default number of trials if not provided in context"""
        default_trials = {
            "HITS": 4,        # Average at-bats per game
            "HOME_RUNS": 4,   # Average at-bats per game
            "TOTAL_BASES": 4, # Average at-bats per game
            "RUNS": 4,        # Average plate appearances per game
            "RBI": 4          # Average at-bats per game
        }
        return default_trials.get(prop_type.upper(), 4)
    
    def _default_prediction(self, prop_type: str, context: dict) -> dict:
        """Default prediction when data is unavailable"""
        # Default success probabilities for different MLB prop types
        default_probs = {
            "HITS": 0.250,      # .250 batting average
            "HOME_RUNS": 0.035, # 3.5% home run rate
            "TOTAL_BASES": 0.450, # Total bases per at-bat
            "RUNS": 0.125,      # 12.5% runs per PA
            "RBI": 0.125        # 12.5% RBI per at-bat
        }
        
        n_trials = self._get_default_trials(prop_type)
        success_prob = default_probs.get(prop_type.upper(), 0.200)
        
        mean = n_trials * success_prob
        variance = n_trials * success_prob * (1 - success_prob)
        
        return {
            "mean": mean,
            "variance": variance,
            "distribution_family": "BINOMIAL",
            "sample_size": 0,
            "features_used": {"default": True, "default_prob": success_prob, "n_trials": n_trials},
            "features_hash": self._compute_features_hash({"default": True, "prop_type": prop_type}),
            "binomial_params": {
                "n": n_trials,
                "p": success_prob
            }
        }
    
    def _compute_features_hash(self, features: Dict[str, Any]) -> str:
        """Compute SHA256 hash of features"""
        sorted_features = sorted(features.items())
        features_str = str(sorted_features)
        return hashlib.sha256(features_str.encode()).hexdigest()


class MLBPoissonModel(BaseStatModel):
    """
    Poisson model specifically for MLB counting statistics
    
    Enhanced for MLB-specific patterns:
    - Strikeouts for pitchers (per inning/game)
    - Walks for hitters/pitchers
    - Stolen bases
    """
    
    def __init__(self):
        self.name = "mlb_poisson"
        self.version = "v1"
        self.model_type = "POISSON"
        self.hyperparams = {
            "lookback_games": 7,  # Week of games for MLB
            "min_lambda": 0.01,
            "season_adjustment_factor": 1.0  # For seasonal trends
        }
    
    async def predict(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        context: dict
    ) -> dict:
        """
        Predict using Poisson distribution for MLB counting stats.
        
        Args:
            player_id: Player identifier
            prop_type: Prop type (STRIKEOUTS_PITCHER, WALKS, etc.)
            context: Additional context data
            
        Returns:
            dict: Prediction with mean, variance, distribution_family, etc.
        """
        try:
            # Get historical stats
            lookback_games = self.hyperparams.get("lookback_games", 7)
            historical_stats = await historical_stats_provider.get_player_stat_history(
                player_id=player_id,
                prop_type=prop_type,
                lookback_games=lookback_games
            )
            
            if not historical_stats:
                logger.warning(f"No historical stats for player {player_id}, prop {prop_type}")
                return self._default_prediction(prop_type)
            
            # Calculate Poisson parameter (lambda) with MLB-specific adjustments
            historical_mean = sum(historical_stats) / len(historical_stats)
            
            # Apply seasonal adjustment factor
            season_factor = self.hyperparams.get("season_adjustment_factor", 1.0)
            adjusted_mean = historical_mean * season_factor
            
            lambda_param = max(self.hyperparams.get("min_lambda", 0.01), adjusted_mean)
            
            # For Poisson distribution: variance = mean
            variance = lambda_param
            
            # Compute feature hash
            features_used = {
                "historical_mean": historical_mean,
                "adjusted_mean": adjusted_mean,
                "lookback_games": lookback_games,
                "lambda": lambda_param,
                "season_adjustment_factor": season_factor
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
            
            logger.debug(f"MLB Poisson prediction for player {player_id}, {prop_type}: {prediction}")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in MLB Poisson prediction: {e}")
            return self._default_prediction(prop_type)
    
    def _default_prediction(self, prop_type: str) -> dict:
        """Default prediction when data is unavailable"""
        # Default lambdas for different MLB prop types
        default_lambdas = {
            "STRIKEOUTS_PITCHER": 6.5,  # Average strikeouts per start
            "WALKS": 2.8,               # Average walks per game
            "STOLEN_BASES": 0.3,        # Average stolen bases per game
            "OUTS_RECORDED": 18.0       # Average outs for starting pitcher (6 innings)
        }
        
        lambda_param = default_lambdas.get(prop_type.upper(), 3.0)
        
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
        sorted_features = sorted(features.items())
        features_str = str(sorted_features)
        return hashlib.sha256(features_str.encode()).hexdigest()


class MLBNormalModel(BaseStatModel):
    """
    Normal distribution model for continuous MLB statistics
    
    Enhanced for MLB-specific patterns:
    - Pitcher innings pitched (with fractional values)
    - Team totals (runs, hits)
    """
    
    def __init__(self):
        self.name = "mlb_normal"
        self.version = "v1"
        self.model_type = "NORMAL"
        self.hyperparams = {
            "lookback_games": 7,
            "min_variance": 0.1,  # Minimum variance floor
            "innings_fraction_adjustment": True  # Handle .1, .2 fractional innings
        }
    
    async def predict(
        self, 
        *, 
        player_id: int, 
        prop_type: str, 
        context: dict
    ) -> dict:
        """
        Predict using Normal distribution for continuous MLB stats.
        
        Args:
            player_id: Player identifier
            prop_type: Prop type (INNINGS_PITCHED, etc.)
            context: Additional context data
            
        Returns:
            dict: Prediction with mean, variance, distribution_family, etc.
        """
        try:
            # Get historical stats
            lookback_games = self.hyperparams.get("lookback_games", 7)
            historical_stats = await historical_stats_provider.get_player_stat_history(
                player_id=player_id,
                prop_type=prop_type,
                lookback_games=lookback_games
            )
            
            if not historical_stats:
                logger.warning(f"No historical stats for player {player_id}, prop {prop_type}")
                return self._default_prediction(prop_type)
            
            # Calculate mean and variance with MLB-specific handling
            n = len(historical_stats)
            
            # Handle fractional innings if needed
            if (prop_type.upper() == "INNINGS_PITCHED" and 
                self.hyperparams.get("innings_fraction_adjustment", True)):
                # Convert fractional innings to decimal (5.1 innings = 5.33)
                processed_stats = [self._convert_fractional_innings(stat) for stat in historical_stats]
            else:
                processed_stats = historical_stats
            
            mean = sum(processed_stats) / n
            
            if n > 1:
                # Sample variance
                variance = sum((x - mean) ** 2 for x in processed_stats) / (n - 1)
            else:
                # Single sample - use MLB-specific heuristic variance
                variance = (mean * 0.25) ** 2  # 25% coefficient of variation for MLB
            
            # Apply minimum variance floor
            min_variance = self.hyperparams.get("min_variance", 0.1)
            variance = max(variance, min_variance)
            
            # Compute feature hash
            features_used = {
                "historical_mean": mean,
                "historical_variance": variance,
                "lookback_games": lookback_games,
                "sample_size": n,
                "fractional_innings_converted": prop_type.upper() == "INNINGS_PITCHED"
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
            
            logger.debug(f"MLB Normal prediction for player {player_id}, {prop_type}: {prediction}")
            return prediction
            
        except Exception as e:
            logger.error(f"Error in MLB Normal prediction: {e}")
            return self._default_prediction(prop_type)
    
    def _convert_fractional_innings(self, innings_value: float) -> float:
        """
        Convert fractional innings to decimal representation.
        
        Example: 5.1 innings (5 and 1/3) = 5.333...
                 5.2 innings (5 and 2/3) = 5.666...
        """
        whole_innings = int(innings_value)
        fractional_part = innings_value - whole_innings
        
        if fractional_part == 0.1:  # 1 out = 1/3 inning
            return whole_innings + (1/3)
        elif fractional_part == 0.2:  # 2 outs = 2/3 inning
            return whole_innings + (2/3)
        else:
            return innings_value  # Already in correct format
    
    def _default_prediction(self, prop_type: str) -> dict:
        """Default prediction when data is unavailable"""
        # Default means and standard deviations for MLB prop types
        defaults = {
            "INNINGS_PITCHED": {"mean": 5.5, "std": 1.5},  # 5.5 innings average start
            "ERA": {"mean": 4.20, "std": 1.2},             # League average ERA
            "WHIP": {"mean": 1.35, "std": 0.25},           # League average WHIP
        }
        
        default = defaults.get(prop_type.upper(), {"mean": 3.0, "std": 1.5})
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
        sorted_features = sorted(features.items())
        features_str = str(sorted_features)
        return hashlib.sha256(features_str.encode()).hexdigest()


# MLB Model factory for creating instances
def create_mlb_model(model_type: str) -> BaseStatModel:
    """
    Create an MLB-specific model instance by type.
    
    Args:
        model_type: Type of model to create
        
    Returns:
        BaseStatModel: Model instance
        
    Raises:
        ValueError: If model type is not supported
    """
    model_type = model_type.upper()
    
    if model_type == "BINOMIAL":
        return BinomialModel()
    elif model_type == "MLB_POISSON":
        return MLBPoissonModel()
    elif model_type == "MLB_NORMAL":
        return MLBNormalModel()
    else:
        raise ValueError(f"Unsupported MLB model type: {model_type}")


# MLB-specific prop type model mappings
MLB_PROP_TYPE_MODEL_MAPPING = {
    # Binary outcome stats -> Binomial
    "HITS": "BINOMIAL",
    "HOME_RUNS": "BINOMIAL", 
    "TOTAL_BASES": "BINOMIAL",
    "RUNS": "BINOMIAL",
    "RBI": "BINOMIAL",
    
    # Counting stats -> MLB Poisson (with seasonal adjustments)
    "STRIKEOUTS_PITCHER": "MLB_POISSON",
    "WALKS": "MLB_POISSON",
    "STOLEN_BASES": "MLB_POISSON",
    "OUTS_RECORDED": "MLB_POISSON",
    
    # Continuous stats -> MLB Normal (with fractional handling)
    "INNINGS_PITCHED": "MLB_NORMAL",
    "ERA": "MLB_NORMAL",
    "WHIP": "MLB_NORMAL",
}


def get_mlb_model_for_prop_type(prop_type: str) -> BaseStatModel:
    """
    Get the appropriate MLB model for a given prop type.
    
    Args:
        prop_type: The prop type to get a model for
        
    Returns:
        BaseStatModel: Appropriate model instance
    """
    model_type = MLB_PROP_TYPE_MODEL_MAPPING.get(prop_type.upper(), "MLB_POISSON")
    return create_mlb_model(model_type)


def validate_mlb_edge_detection_criteria(prop_type: str, model_prediction: dict, market_line: float) -> dict:
    """
    MLB-specific edge detection logic with sport-specific criteria.
    
    Args:
        prop_type: Type of prop being evaluated
        model_prediction: Model prediction with mean, variance, etc.
        market_line: Market line/threshold
        
    Returns:
        dict: Edge analysis with MLB-specific logic
    """
    try:
        pred_mean = model_prediction.get("mean", 0)
        pred_variance = model_prediction.get("variance", 0)
        distribution_family = model_prediction.get("distribution_family", "NORMAL")
        
        # Calculate standard edge metrics
        edge_raw = pred_mean - market_line
        edge_percentage = (edge_raw / market_line * 100) if market_line > 0 else 0
        
        # MLB-specific edge criteria adjustments
        if prop_type.upper() in ["HITS", "HOME_RUNS", "RBI", "RUNS"]:
            # Binary outcome props: higher confidence threshold for half-integer lines
            if abs(market_line - round(market_line)) == 0.5:  # Half-integer line (1.5, 2.5, etc.)
                confidence_threshold = 0.65  # Higher threshold for half-lines
            else:
                confidence_threshold = 0.60  # Standard threshold for integer lines
                
        elif prop_type.upper() in ["STRIKEOUTS_PITCHER", "WALKS", "OUTS_RECORDED"]:
            # Counting stats: different thresholds based on typical ranges
            if market_line < 3:  # Low count props (walks, stolen bases)
                confidence_threshold = 0.70  # Higher threshold due to lower base rates
            else:  # Higher count props (strikeouts, outs)
                confidence_threshold = 0.62  # Standard threshold
                
        else:  # Continuous props (innings, ERA, WHIP)
            confidence_threshold = 0.58  # Lower threshold for continuous variables
        
        # Calculate confidence based on distribution
        if distribution_family == "BINOMIAL":
            # For binomial, calculate exact probability
            n_trials = model_prediction.get("binomial_params", {}).get("n", 4)
            success_prob = model_prediction.get("binomial_params", {}).get("p", 0.25)
            
            # Calculate P(X > market_line) for over bets
            try:
                from scipy.stats import binom
                prob_over = 1 - binom.cdf(int(market_line), n_trials, success_prob)
            except ImportError:
                # Fallback: Normal approximation to binomial
                mean = n_trials * success_prob
                variance = n_trials * success_prob * (1 - success_prob)
                std_dev = math.sqrt(variance)
                z_score = (market_line - mean) / std_dev if std_dev > 0 else 0
                prob_over = 0.5 * (1 + math.erf(-z_score / math.sqrt(2))) if z_score != 0 else 0.5
            
            confidence = prob_over
            
        elif distribution_family in ["POISSON", "MLB_POISSON"]:
            # For Poisson, calculate exact probability
            lambda_param = pred_mean
            
            try:
                from scipy.stats import poisson
                prob_over = 1 - poisson.cdf(int(market_line), lambda_param)
            except ImportError:
                # Fallback: Normal approximation to Poisson for lambda > 10
                if lambda_param > 10:
                    std_dev = math.sqrt(lambda_param)
                    z_score = (market_line - lambda_param) / std_dev
                    prob_over = 0.5 * (1 + math.erf(-z_score / math.sqrt(2))) if z_score != 0 else 0.5
                else:
                    # Simple approximation for small lambda
                    prob_over = max(0, min(1, (lambda_param - market_line) / lambda_param + 0.5))
            
            confidence = prob_over
            
        else:  # Normal or MLB_NORMAL
            # For normal, use standard confidence interval
            std_dev = math.sqrt(pred_variance)
            z_score = edge_raw / std_dev if std_dev > 0 else 0
            
            # Convert z-score to confidence using error function (no scipy needed)
            try:
                from scipy.stats import norm
                confidence = norm.cdf(z_score) if edge_raw > 0 else (1 - norm.cdf(-z_score))
            except ImportError:
                # Fallback: Use error function approximation
                confidence = 0.5 * (1 + math.erf(z_score / math.sqrt(2))) if z_score != 0 else 0.5
        
        # Determine if edge meets criteria
        has_edge = confidence > confidence_threshold and abs(edge_raw) > 0.1
        
        # MLB-specific edge strength classification
        if confidence > 0.80:
            edge_strength = "STRONG"
        elif confidence > 0.70:
            edge_strength = "MODERATE"  
        elif confidence > 0.60:
            edge_strength = "WEAK"
        else:
            edge_strength = "NO_EDGE"
        
        return {
            "has_edge": has_edge,
            "edge_strength": edge_strength,
            "confidence": confidence,
            "confidence_threshold": confidence_threshold,
            "edge_raw": edge_raw,
            "edge_percentage": edge_percentage,
            "distribution_family": distribution_family,
            "mlb_specific_adjustments": {
                "half_integer_line": abs(market_line - round(market_line)) == 0.5,
                "prop_category": _classify_mlb_prop_category(prop_type),
                "confidence_adjustment_applied": True
            }
        }
        
    except Exception as e:
        logger.error(f"Error in MLB edge detection: {e}")
        return {
            "has_edge": False,
            "edge_strength": "ERROR", 
            "confidence": 0.0,
            "error": str(e)
        }


def _classify_mlb_prop_category(prop_type: str) -> str:
    """Classify MLB prop into category for edge detection logic"""
    prop_upper = prop_type.upper()
    
    if prop_upper in ["HITS", "HOME_RUNS", "RBI", "RUNS"]:
        return "BINARY_OUTCOME"
    elif prop_upper in ["STRIKEOUTS_PITCHER", "WALKS", "OUTS_RECORDED", "STOLEN_BASES"]:
        return "COUNTING_STAT"
    elif prop_upper in ["INNINGS_PITCHED", "ERA", "WHIP"]:
        return "CONTINUOUS_STAT"
    else:
        return "UNKNOWN"