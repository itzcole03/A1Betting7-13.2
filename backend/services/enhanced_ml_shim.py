"""Lightweight enhanced-ML shim for tests.

Provides deterministic, synchronous APIs that mimic the production ML service
enough for backend tests to run without heavy ML dependencies.
"""
from typing import Any, Dict, List, Optional
import random


class EnhancedMLShim:
    """Simple deterministic ML shim used in tests.

    Methods:
    - predict(features): returns a deterministic score and label
    - explain(features): returns a lightweight explanation dict
    - health(): returns service health info
    """

    def __init__(self, seed: int = 42):
        self.seed = seed
        random.seed(seed)

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Return a deterministic prediction for given features.

        The result shape is intentionally simple and stable for tests:
        {"score": float, "label": str, "raw": {...}}
        """
        # Use a stable hash-like mix to compute a pseudo-score
        s = sum((hash(k) ^ hash(str(v))) & 0xFFFF for k, v in features.items())
        score = ((s % 1000) / 1000.0) * 0.99 + 0.005
        label = "positive" if score >= 0.5 else "negative"

        return {"score": round(score, 4), "label": label, "raw": features}

    def explain(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Return a tiny explanation suitable for tests.

        Example: {"reason": "high_feature_x", "weights": {"x": 0.4}}
        """
        weights = {k: round(((hash(k) & 0xFF) / 255.0) - 0.5, 3) for k in features.keys()}
        top = sorted(weights.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        return {"reason": f"top_features: {[k for k,_ in top]}", "weights": weights}

    def health(self) -> Dict[str, Any]:
        return {"service": "enhanced-ml-shim", "status": "healthy", "seed": self.seed}


# Singleton instance used by route fallbacks
_enhanced_ml_shim: Optional[EnhancedMLShim] = None


def get_enhanced_ml_shim() -> EnhancedMLShim:
    global _enhanced_ml_shim
    if _enhanced_ml_shim is None:
        _enhanced_ml_shim = EnhancedMLShim()
    return _enhanced_ml_shim
