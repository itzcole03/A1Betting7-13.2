# Copied and adapted from Newfolder (example structure)
import time
from typing import Any, Dict


class FeatureCache:
    def __init__(self, ttl: int = 3600):
        self.cache: Dict[str, Any] = {}
        self.expiry: Dict[str, float] = {}
        self.ttl = ttl

    def set(self, key: str, value: Any):
        self.cache[key] = value
        self.expiry[key] = time.time() + self.ttl

    def get(self, key: str) -> Any:
        if key in self.cache and time.time() < self.expiry[key]:
            return self.cache[key]
        self.cache.pop(key, None)
        self.expiry.pop(key, None)
        return None

    def clear(self):
        self.cache.clear()
        self.expiry.clear()
