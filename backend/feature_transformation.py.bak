# Copied and adapted from Newfolder (example structure)
from typing import Any, Dict


class FeatureTransformer:
    def __init__(self):
        pass

    def transform(self, features: Dict[str, Any]) -> Dict[str, Any]:
        # Example: normalize all numeric features
        transformed = {}
        for k, v in features.items():
            if isinstance(v, (int, float)):
                transformed[k] = float(v) / 100.0  # Example normalization
            else:
                transformed[k] = v
        return transformed
