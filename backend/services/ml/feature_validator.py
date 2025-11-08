# Copied and adapted from Newfolder (example structure)
from typing import Any, Dict


class FeatureValidator:
    def __init__(self):
        pass

    def validate(self, features: Dict[str, Any]) -> bool:
        # Add validation logic as needed
        return all(v is not None for v in features.values())
