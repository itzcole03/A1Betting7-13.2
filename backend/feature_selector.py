# Copied and adapted from Newfolder (example structure)
from typing import Any, Dict, List


class FeatureSelector:
    def __init__(self, k: int = 10):
        self.k = k

    def select(self, features: Dict[str, Any], target: List[float]) -> Dict[str, Any]:
        # Dummy selection: select first k features
        selected = dict(list(features.items())[: self.k])
        return selected
