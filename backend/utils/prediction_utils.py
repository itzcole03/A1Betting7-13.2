"""Shared prediction utilities for confidence, uncertainty, feature compatibility, and correlation.
"""

from typing import Dict, List, Tuple

import numpy as np


def calculate_confidence(model, X: np.ndarray, model_type: str) -> float:
    """Estimate prediction confidence based on model type."""
    try:
        if model_type == "random_forest" and hasattr(model, "estimators_"):
            preds = np.array([tree.predict(X)[0] for tree in model.estimators_])
            var = np.var(preds)
            return float(max(0.1, 1.0 - min(var, 1.0)))
        elif model_type in ["xgboost", "lightgbm"]:
            # default proxy
            return 0.8
        else:
            return 0.7
    except Exception:  # pylint: disable=broad-exception-caught
        return 0.5


def calculate_uncertainty(
    pred_interval: Tuple[float, float], prediction_conf: float
) -> Dict[str, float]:
    """Return uncertainty metrics: std_error and confidence."""
    lower, upper = pred_interval
    std_err = (upper - lower) / 4.0
    return {"std_error": std_err, "confidence": prediction_conf}


def feature_compatibility(expected: List[str], provided: List[str]) -> float:
    """Compute compatibility ratio between expected and provided features."""
    if not expected:
        return 1.0
    overlap = len(set(expected) & set(provided))
    return float(overlap) / len(expected)


def model_correlation(cv1: List[float], cv2: List[float]) -> float:
    """Compute correlation between two CV score lists."""
    corr = 0.0
    try:
        if len(cv1) > 1 and len(cv2) > 1:
            n = min(len(cv1), len(cv2))
            arr1 = np.array(cv1[:n], dtype=float)
            arr2 = np.array(cv2[:n], dtype=float)
            corr = float(np.corrcoef(arr1, arr2)[0, 1])
    except Exception:  # pylint: disable=broad-exception-caught
        corr = 0.0
    return max(0.0, min(1.0, corr))
