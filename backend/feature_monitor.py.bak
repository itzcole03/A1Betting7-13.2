# Copied and adapted from Newfolder (example structure)
from datetime import datetime, timezone
from typing import Any, Dict


class FeatureMonitor:
    def __init__(self):
        self.metrics = []

    def record(self, features: Dict[str, Any], processing_time: float):
        metric = {
            "timestamp": datetime.now(timezone.utc),
            "feature_count": len(features),
            "processing_time": processing_time,
        }
        self.metrics.append(metric)

    def get_metrics(self):
        return self.metrics
