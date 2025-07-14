# Copied and adapted from Newfolder backend/FinalPredictionEngine/feature_engineering.py
from typing import Any, Dict, List, Tuple

import numpy as np
from scipy import stats
from sklearn.covariance import EllipticEnvelope
from sklearn.ensemble import IsolationForest
from sklearn.feature_selection import SelectKBest, f_regression
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller


class FeatureEngineering:
    def __init__(self):
        self.feature_scalers = {}
        self.feature_selector = SelectKBest(score_func=f_regression, k=10)
        self.poly = PolynomialFeatures(degree=2)
        self.isolation_forest = IsolationForest(contamination=0.1)
        self.lof = LocalOutlierFactor(n_neighbors=20, contamination=0.1)
        self.elliptic_envelope = EllipticEnvelope(contamination=0.1)
        self.time_series_features = {}

    def preprocess_features(self, data: Dict[str, Any]) -> Dict[str, Any]:
        features = self._extract_features(data)
        scaled_features = self._scale_features(features)
        selected_features = self._select_features(scaled_features)
        polynomial_features = self.create_polynomial_features(selected_features)
        time_series_features = self.extract_time_series_features(data)
        statistical_features = self.extract_statistical_features(data)

        combined_features = np.hstack(
            (polynomial_features, time_series_features, statistical_features)
        )

        return {
            "features": combined_features,
            "anomaly_scores": self.detect_anomalies(combined_features),
            "time_series_analysis": self.analyze_time_series(data),
        }

    def validate_features(self, data: Dict[str, Any]) -> bool:
        # Implement common validation logic
        return True

    def calculate_model_weights(
        self, predictions: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        weights = {}
        total_accuracy = sum(pred["performance"]["accuracy"] for pred in predictions)
        for pred in predictions:
            weights[pred["modelName"]] = (
                pred["performance"]["accuracy"] / total_accuracy
            )
        return weights

    def combine_features(self, predictions: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Implement feature combination logic
        return {}

    def calculate_ensemble_confidence(
        self, predictions: List[Dict[str, Any]], weights: Dict[str, float]
    ) -> float:
        return sum(
            pred["confidence"] * weights[pred["modelName"]] for pred in predictions
        )

    def calculate_optimal_stake(
        self, prediction: Dict[str, Any], risk_profile: Dict[str, Any]
    ) -> float:
        # Implement optimal stake calculation logic
        return 0.0

    def select_features(self, features: np.ndarray, target: np.ndarray) -> np.ndarray:
        return self.feature_selector.fit_transform(features, target)

    def extract_time_series_features(self, data: Dict[str, Any]) -> np.ndarray:
        features = []
        for key, value in data.items():
            if isinstance(value, list) and len(value) > 1:
                # Calculate time series features
                features.extend(
                    [
                        np.mean(value),
                        np.std(value),
                        stats.skew(value),
                        stats.kurtosis(value),
                        self._calculate_trend(value),
                        self._calculate_seasonality(value),
                    ]
                )
        return np.array(features).reshape(1, -1)

    def extract_statistical_features(self, data: Dict[str, Any]) -> np.ndarray:
        features = []
        for key, value in data.items():
            if isinstance(value, (list, np.ndarray)):
                features.extend(
                    [
                        np.percentile(value, 25),
                        np.percentile(value, 75),
                        np.max(value),
                        np.min(value),
                        np.median(value),
                    ]
                )
        return np.array(features).reshape(1, -1)

    def analyze_time_series(self, data: Dict[str, Any]) -> Dict[str, Any]:
        analysis = {}
        for key, value in data.items():
            if isinstance(value, list) and len(value) > 1:
                try:
                    # Perform stationarity test
                    adf_result = adfuller(value)
                    # Perform seasonal decomposition
                    decomposition = seasonal_decompose(
                        value, period=min(len(value) // 2, 12)
                    )
                    analysis[key] = {
                        "stationary": adf_result[1] < 0.05,
                        "trend": decomposition.trend.tolist(),
                        "seasonal": decomposition.seasonal.tolist(),
                        "residual": decomposition.resid.tolist(),
                    }
                except:
                    continue
        return analysis

    def _calculate_trend(self, series: List[float]) -> float:
        x = np.arange(len(series))
        slope, _, _, _, _ = stats.linregress(x, series)
        return slope

    def _calculate_seasonality(self, series: List[float]) -> float:
        if len(series) < 4:
            return 0.0
        try:
            decomposition = seasonal_decompose(series, period=min(len(series) // 2, 12))
            return np.std(decomposition.seasonal)
        except:
            return 0.0

    def create_polynomial_features(self, features: np.ndarray) -> np.ndarray:
        return self.poly.fit_transform(features)

    def detect_anomalies(self, features: np.ndarray) -> np.ndarray:
        isolation_forest_scores = self.isolation_forest.fit_predict(features)
        lof_scores = self.lof.fit_predict(features)
        elliptic_envelope_scores = self.elliptic_envelope.fit_predict(features)
        return np.vstack(
            (isolation_forest_scores, lof_scores, elliptic_envelope_scores)
        )

    def augment_data(
        self, features: np.ndarray, target: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        augmented_features = np.vstack(
            (features, features + np.random.normal(0, 0.1, features.shape))
        )
        augmented_target = np.vstack((target, target))
        return augmented_features, augmented_target

    def _extract_features(self, data: Dict[str, Any]) -> np.ndarray:
        features = []
        for key, value in data.items():
            if isinstance(value, (int, float)):
                features.append(value)
        return np.array(features).reshape(1, -1)

    def _scale_features(self, features: np.ndarray) -> np.ndarray:
        if not self.feature_scalers:
            self.feature_scalers = StandardScaler()
            return self.feature_scalers.fit_transform(features)
        return self.feature_scalers.transform(features)

    def _select_features(self, features: np.ndarray) -> np.ndarray:
        return self.feature_selector.fit_transform(features, np.zeros(len(features)))

    def aggregate_shap_values(
        self, shap_values_list: List[Dict[str, float]]
    ) -> Dict[str, float]:
        """Aggregate SHAP values from multiple models using weighted averaging.

        Args:
        ----
            shap_values_list: List of SHAP value dictionaries from different models

        Returns:
        -------
            Dict of aggregated SHAP values

        """
        if not shap_values_list:
            return {}

        # Get all unique feature names
        all_features = set()
        for shap_dict in shap_values_list:
            all_features.update(shap_dict.keys())

        # Calculate weighted average for each feature
        aggregated_shap = {}
        len(shap_values_list)

        for feature in all_features:
            feature_values = [
                shap_dict.get(feature, 0.0) for shap_dict in shap_values_list
            ]
            aggregated_shap[feature] = np.mean(feature_values)

        return aggregated_shap

    def generate_explanation(
        self, final_value: float, confidence: float, shap_values: Dict[str, float]
    ) -> str:
        """Generate human-readable explanation for the prediction.

        Args:
        ----
            final_value: The final prediction value
            confidence: The ensemble confidence score
            shap_values: The aggregated SHAP values

        Returns:
        -------
            Human-readable explanation string

        """
        # Sort features by absolute SHAP value importance
        sorted_features = sorted(
            shap_values.items(), key=lambda x: abs(x[1]), reverse=True
        )
        top_features = sorted_features[:3]  # Top 3 most important features

        explanation_parts = [
            f"Prediction: {final_value:.3f} (Confidence: {confidence:.1%})"
        ]

        if top_features:
            explanation_parts.append("Key factors:")
            for feature, value in top_features:
                impact = "positive" if value > 0 else "negative"
                explanation_parts.append(f"• {feature}: {impact} impact ({value:.3f})")

        # Add confidence interpretation
        if confidence > 0.8:
            explanation_parts.append(
                "High confidence prediction based on strong model agreement."
            )
        elif confidence > 0.6:
            explanation_parts.append(
                "Moderate confidence with some model disagreement."
            )
        else:
            explanation_parts.append(
                "Low confidence - consider additional data or analysis."
            )

        return " ".join(explanation_parts)
