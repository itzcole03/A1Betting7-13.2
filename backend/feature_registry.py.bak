# Copied and adapted from Newfolder (example structure)
from typing import Any, Dict


class FeatureRegistry:
    def __init__(self):
        self.registry: Dict[str, Any] = {}

    def register_feature(self, name: str, config: Dict[str, Any]):
        self.registry[name] = config

    def get_feature(self, name: str) -> Dict[str, Any]:
        return self.registry.get(name, {})

    def list_features(self):
        return list(self.registry.keys())

    def remove_feature(self, name: str):
        if name in self.registry:
            del self.registry[name]
