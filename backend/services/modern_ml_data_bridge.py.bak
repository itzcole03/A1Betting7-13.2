"""
Modern ML Real Data Bridge

This service bridges modern ML components with existing real data infrastructure,
specifically optimized for advanced ML feature engineering and real-time processing.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import pandas as pd
import torch

# Import modern ML components
from .automated_feature_engineering import AdvancedFeatureEngineering

# Import existing real data clients
from .baseball_savant_client import BaseballSavantClient
from .mlb_provider_client import MLBProviderClient
from .modern_ml_service import ModernMLService

logger = logging.getLogger(__name__)


class ModernMLDataBridge:
    """
    Advanced data bridge connecting modern ML pipeline to real data sources

    Optimized for:
    - High-performance feature engineering
    - Real-time data processing
    - ML-specific data transformations
    - Seamless integration with existing infrastructure
    """

    def __init__(self):
        # Initialize existing data clients
        self.baseball_savant = BaseballSavantClient()
        self.mlb_provider = MLBProviderClient()

        # Initialize modern ML components
        self.feature_engineer = AdvancedFeatureEngineering()

        # Performance optimizations
        self.feature_cache = {}
        self.cache_ttl = 300  # 5 minutes
        self.batch_size = 32

        logger.info("Modern ML Data Bridge initialized")

    async def get_ml_ready_features(
        self, player_name: str, prop_type: str, context: Dict[str, Any] = None
    ) -> torch.Tensor:
        """
        Get ML-ready features as PyTorch tensors

        Returns features optimized for modern ML models (Transformers, GNNs)
        """
        cache_key = f"ml_features_{player_name}_{prop_type}_{hash(str(context))}"

        # Check cache
        if cache_key in self.feature_cache:
            cached_tensor, timestamp = self.feature_cache[cache_key]
            if (datetime.now() - timestamp).total_seconds() < self.cache_ttl:
                return cached_tensor

        try:
            # Get raw features from real data
            raw_features = await self._fetch_comprehensive_features(
                player_name, prop_type, context
            )

            # Convert to ML-ready tensor
            feature_tensor = self._convert_to_tensor(raw_features)

            # Cache the tensor
            self.feature_cache[cache_key] = (feature_tensor, datetime.now())

            return feature_tensor

        except Exception as e:
            logger.error(f"Error generating ML features for {player_name}: {e}")
            return self._get_fallback_tensor()

    async def _fetch_comprehensive_features(
        self, player_name: str, prop_type: str, context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Fetch comprehensive features from all available real data sources"""
        features = {}

        try:
            # Baseball Savant - Advanced metrics
            if hasattr(self.baseball_savant, "get_comprehensive_player_metrics"):
                statcast_data = (
                    await self.baseball_savant.get_comprehensive_player_metrics(
                        player_name
                    )
                )
                features.update(self._process_statcast_features(statcast_data))
        except Exception as e:
            logger.warning(f"Statcast data fetch failed: {e}")

        try:
            # MLB Provider - Traditional stats
            if hasattr(self.mlb_provider, "get_recent_player_performance"):
                provider_data = await self.mlb_provider.get_recent_player_performance(
                    player_name
                )
                features.update(self._process_provider_features(provider_data))
        except Exception as e:
            logger.warning(f"Provider data fetch failed: {e}")

        # Add context features
        features.update(self._process_context_features(context or {}))

        # Add derived ML features
        features.update(self._generate_derived_features(features, prop_type))

        return features

    def _process_statcast_features(
        self, statcast_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process Statcast data into ML features"""
        features = {}

        # Direct numerical features
        numerical_fields = [
            "exit_velocity",
            "launch_angle",
            "spin_rate",
            "release_speed",
            "hard_hit_rate",
            "barrel_rate",
            "xba",
            "xslg",
            "xwoba",
        ]

        for field in numerical_fields:
            if field in statcast_data:
                value = statcast_data[field]
                if isinstance(value, (int, float)) and not np.isnan(value):
                    features[f"statcast_{field}"] = float(value)
                else:
                    features[f"statcast_{field}"] = 0.0

        # Composite features
        exit_velocity = features.get("statcast_exit_velocity", 0)
        launch_angle = features.get("statcast_launch_angle", 0)

        if exit_velocity > 0 and launch_angle > 0:
            features["statcast_contact_quality"] = exit_velocity * np.cos(
                np.radians(launch_angle)
            )

        return features

    def _process_provider_features(
        self, provider_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process provider data into ML features"""
        features = {}

        # Traditional stats
        stat_fields = ["avg", "obp", "slg", "ops", "runs", "hits", "rbi", "hr", "sb"]

        for field in stat_fields:
            if field in provider_data:
                value = provider_data[field]
                if isinstance(value, (int, float)) and not np.isnan(value):
                    features[f"traditional_{field}"] = float(value)
                else:
                    features[f"traditional_{field}"] = 0.0

        return features

    def _process_context_features(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process context information into ML features"""
        features = {}

        # Venue features
        if "venue" in context:
            venue = context["venue"].lower()
            features["venue_home"] = 1.0 if venue == "home" else 0.0
            features["venue_away"] = 1.0 if venue == "away" else 0.0
        else:
            features["venue_home"] = 0.5
            features["venue_away"] = 0.5

        # Opponent strength (placeholder - could be enhanced with real data)
        features["opponent_strength"] = context.get("opponent_strength", 0.5)

        # Weather features (if available)
        weather = context.get("weather", {})
        features["weather_temp"] = weather.get("temperature", 70.0)
        features["weather_wind"] = weather.get("wind_speed", 5.0)
        features["weather_humidity"] = weather.get("humidity", 50.0)

        return features

    def _generate_derived_features(
        self, features: Dict[str, Any], prop_type: str
    ) -> Dict[str, Any]:
        """Generate derived features for ML models"""
        derived = {}

        # Prop-type specific features
        derived["prop_type_encoded"] = self._encode_prop_type(prop_type)

        # Interaction features
        if "statcast_exit_velocity" in features and "statcast_launch_angle" in features:
            derived["velocity_angle_interaction"] = (
                features["statcast_exit_velocity"] * features["statcast_launch_angle"]
            )

        # Temporal features
        now = datetime.now()
        derived["hour_of_day"] = now.hour / 24.0
        derived["day_of_week"] = now.weekday() / 7.0
        derived["month"] = now.month / 12.0

        # Performance ratios
        if "traditional_hits" in features and "traditional_avg" in features:
            if features["traditional_avg"] > 0:
                derived["hits_to_avg_ratio"] = (
                    features["traditional_hits"] / features["traditional_avg"]
                )
            else:
                derived["hits_to_avg_ratio"] = 0.0

        return derived

    def _encode_prop_type(self, prop_type: str) -> float:
        """Encode prop type as numerical feature"""
        prop_encoding = {
            "hits": 0.1,
            "runs": 0.2,
            "rbi": 0.3,
            "strikeouts": 0.4,
            "home_runs": 0.5,
            "stolen_bases": 0.6,
            "walks": 0.7,
            "total_bases": 0.8,
        }
        return prop_encoding.get(prop_type.lower(), 0.0)

    def _convert_to_tensor(self, features: Dict[str, Any]) -> torch.Tensor:
        """Convert feature dictionary to PyTorch tensor"""
        try:
            # Define expected feature order for consistent tensor shape
            feature_order = [
                # Statcast features
                "statcast_exit_velocity",
                "statcast_launch_angle",
                "statcast_spin_rate",
                "statcast_hard_hit_rate",
                "statcast_barrel_rate",
                "statcast_xba",
                "statcast_contact_quality",
                # Traditional features
                "traditional_avg",
                "traditional_obp",
                "traditional_slg",
                "traditional_ops",
                "traditional_runs",
                "traditional_hits",
                "traditional_rbi",
                # Context features
                "venue_home",
                "venue_away",
                "opponent_strength",
                "weather_temp",
                "weather_wind",
                "weather_humidity",
                # Derived features
                "prop_type_encoded",
                "velocity_angle_interaction",
                "hour_of_day",
                "day_of_week",
                "month",
                "hits_to_avg_ratio",
            ]

            # Extract values in consistent order
            values = []
            for feature_name in feature_order:
                value = features.get(feature_name, 0.0)
                if isinstance(value, (int, float)) and not np.isnan(value):
                    values.append(float(value))
                else:
                    values.append(0.0)

            # Convert to tensor
            tensor = torch.tensor(values, dtype=torch.float32)

            # Ensure minimum size for ML models
            if len(tensor) < 32:
                padding = torch.zeros(32 - len(tensor))
                tensor = torch.cat([tensor, padding])

            return tensor

        except Exception as e:
            logger.error(f"Error converting features to tensor: {e}")
            return self._get_fallback_tensor()

    def _get_fallback_tensor(self) -> torch.Tensor:
        """Generate fallback tensor when feature extraction fails"""
        # Return a tensor with reasonable default values
        return torch.zeros(32, dtype=torch.float32)

    async def get_batch_ml_features(
        self, requests: List[Dict[str, Any]]
    ) -> torch.Tensor:
        """Get ML features for multiple requests as a batched tensor"""
        if not requests:
            return torch.empty(0, 32)

        # Process requests in parallel
        tasks = [
            self.get_ml_ready_features(
                req.get("player_name", ""),
                req.get("prop_type", ""),
                req.get("context", {}),
            )
            for req in requests
        ]

        feature_tensors = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions and create batch tensor
        valid_tensors = []
        for i, tensor in enumerate(feature_tensors):
            if isinstance(tensor, Exception):
                logger.warning(f"Feature extraction failed for request {i}: {tensor}")
                valid_tensors.append(self._get_fallback_tensor())
            else:
                valid_tensors.append(tensor)

        # Stack into batch tensor
        batch_tensor = torch.stack(valid_tensors)
        return batch_tensor

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        current_time = datetime.now()
        valid_entries = 0

        for _, (_, timestamp) in self.feature_cache.items():
            if (current_time - timestamp).total_seconds() < self.cache_ttl:
                valid_entries += 1

        return {
            "total_entries": len(self.feature_cache),
            "valid_entries": valid_entries,
            "cache_ttl_seconds": self.cache_ttl,
            "hit_rate": "calculated_on_access",
        }

    def clear_cache(self):
        """Clear the feature cache"""
        self.feature_cache.clear()
        logger.info("ML feature cache cleared")


class DistributedFeatureProcessor:
    """Distributed processing for feature engineering using Ray (if available)"""

    def __init__(self):
        self.ray_available = False
        try:
            import ray

            if not ray.is_initialized():
                ray.init(ignore_reinit_error=True)
            self.ray_available = True
            logger.info("Ray initialized for distributed processing")
        except ImportError:
            logger.warning("Ray not available. Using sequential processing.")

    async def process_distributed_features(
        self, requests: List[Dict[str, Any]]
    ) -> List[torch.Tensor]:
        """Process features using distributed computing if available"""
        if not self.ray_available or len(requests) < 10:
            # Use local processing for small batches
            bridge = ModernMLDataBridge()
            return await bridge.get_batch_ml_features(requests)

        try:
            import ray

            # Create remote function
            @ray.remote
            def process_feature_batch(batch_requests):
                import asyncio

                bridge = ModernMLDataBridge()
                return asyncio.run(bridge.get_batch_ml_features(batch_requests))

            # Split requests into chunks for distributed processing
            chunk_size = max(1, len(requests) // ray.cluster_resources().get("CPU", 1))
            chunks = [
                requests[i : i + chunk_size]
                for i in range(0, len(requests), chunk_size)
            ]

            # Process chunks in parallel
            futures = [process_feature_batch.remote(chunk) for chunk in chunks]
            results = await asyncio.gather(*ray.get(futures))

            # Combine results
            combined_tensor = torch.cat(results, dim=0)
            return combined_tensor

        except Exception as e:
            logger.error(
                f"Distributed processing failed: {e}. Falling back to local processing."
            )
            bridge = ModernMLDataBridge()
            return await bridge.get_batch_ml_features(requests)

    def get_today_games(self) -> List[Dict[str, Any]]:
        """Get today's MLB games from the real data pipeline"""
        try:
            # Use existing mlb_extras endpoint for live game data
            import requests

            response = requests.get("http://localhost:8000/mlb/todays-games")
            if response.status_code == 200:
                data = response.json()
                games = data.get("games", [])
                logger.info(f"Successfully fetched {len(games)} games for today")
                return games
            else:
                logger.warning(
                    f"Failed to fetch today's games: HTTP {response.status_code}"
                )
                return []
        except Exception as e:
            logger.error(f"Error fetching today's games: {e}")
            return []

    def get_live_game_features(self, game_id: int) -> Dict[str, Any]:
        """Get real-time features for a specific game"""
        try:
            import requests

            # Fetch live game stats
            response = requests.get(
                f"http://localhost:8000/mlb/live-game-stats/{game_id}"
            )
            if response.status_code == 200:
                return response.json()
            return {}
        except Exception as e:
            logger.error(f"Error fetching live game features for {game_id}: {e}")
            return {}


# Global instances
ml_data_bridge = ModernMLDataBridge()
distributed_processor = DistributedFeatureProcessor()

logger.info("Modern ML Data Bridge initialized")
logger.info("Connected to existing real data infrastructure")
