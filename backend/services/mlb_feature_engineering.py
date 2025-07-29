from typing import Any, Dict

import numpy as np

from backend.feature_engineering import FeatureEngineering


class MLBFeatureEngineering(FeatureEngineering):
    def __init__(self):
        super().__init__()

    def extract_mlb_features(self, data: Dict[str, Any]) -> np.ndarray:
        """
        Extract MLB-specific features from raw data dict.
        Example features: player stats, team stats, ballpark, handedness, weather, etc.
        """
        features = []
        # Player stats
        for stat in ["avg", "hr", "rbi", "obp", "slg", "ops", "sb", "so", "bb"]:
            features.append(data.get(stat, 0.0))
        # Team stats
        for stat in ["team_runs", "team_hits", "team_era", "team_whip"]:
            features.append(data.get(stat, 0.0))
        # Contextual features
        features.append(data.get("ballpark_factor", 1.0))
        features.append(data.get("handedness", 0))  # 0=R, 1=L
        features.append(data.get("weather_temp", 70.0))
        features.append(data.get("weather_wind", 0.0))
        features.append(data.get("game_time_hour", 19))
        return np.array(features).reshape(1, -1)

    def preprocess_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        mlb_features = self.extract_mlb_features(data)
        scaled_features = self._scale_features(mlb_features)
        selected_features = self._select_features(scaled_features)
        polynomial_features = self.create_polynomial_features(selected_features)
        # Optionally add generic/statistical features
        return {
            "features": polynomial_features,
            "anomaly_scores": self.detect_anomalies(polynomial_features),
        }
