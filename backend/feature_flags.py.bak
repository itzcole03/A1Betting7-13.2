# feature_flags.py
"""Feature Flags and Experiment Management for UltimateSportsBettingApp
Migrated and adapted from Newfolder/src/core/FeatureFlags.ts
"""
import hashlib
from threading import Lock
from typing import Any, Dict, List, Optional

# --- Interfaces ---


class Feature:
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        enabled: bool,
        rollout_percentage: float,
        dependencies: List[str],
        tags: List[str],
        metadata: Dict[str, Any],
    ):
        self.id = id
        self.name = name
        self.description = description
        self.enabled = enabled
        self.rollout_percentage = rollout_percentage
        self.dependencies = dependencies
        self.tags = tags
        self.metadata = metadata


class ExperimentVariant:
    def __init__(self, id: str, name: str, weight: float):
        self.id = id
        self.name = name
        self.weight = weight


class Experiment:
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        status: str,
        variants: List[ExperimentVariant],
        audience: Dict[str, Any],
        start_date: float,
        end_date: Optional[float],
        metadata: Dict[str, Any],
    ):
        self.id = id
        self.name = name
        self.description = description
        self.status = status
        self.variants = variants
        self.audience = audience
        self.start_date = start_date
        self.end_date = end_date
        self.metadata = metadata


class UserContext:
    def __init__(
        self, user_id: str, user_groups: List[str], attributes: Dict[str, Any]
    ):
        self.user_id = user_id
        self.user_groups = user_groups
        self.attributes = attributes


# --- Singleton FeatureFlags ---


class FeatureFlags:
    _instance = None
    _lock = Lock()

    def __init__(self):
        self.features: Dict[str, Feature] = {}
        self.experiments: Dict[str, Experiment] = {}
        self.user_assignments: Dict[str, Dict[str, str]] = {}

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = FeatureFlags()
            return cls._instance

    def initialize(self, config: Dict[str, Any]):
        # config: { 'features': [...], 'experiments': [...] }
        for f in config.get("features", []):
            self.features[f["id"]] = Feature(**f)
        for e in config.get("experiments", []):
            variants = [ExperimentVariant(**v) for v in e["variants"]]
            self.experiments[e["id"]] = Experiment(
                id=e["id"],
                name=e["name"],
                description=e["description"],
                status=e["status"],
                variants=variants,
                audience=e["audience"],
                start_date=e["startDate"],
                end_date=e.get("endDate"),
                metadata=e["metadata"],
            )

    def is_feature_enabled(self, feature_id: str, context: UserContext) -> bool:
        feature = self.features.get(feature_id)
        if not feature or not feature.enabled:
            return False
        if not self._are_dependencies_satisfied(feature, context):
            return False
        if not self._is_user_in_rollout(context.user_id, feature.rollout_percentage):
            return False
        return True

    def get_experiment_variant(
        self, experiment_id: str, context: UserContext
    ) -> Optional[str]:
        experiment = self.experiments.get(experiment_id)
        if not experiment or experiment.status != "active":
            return None
        if not self._is_user_in_audience(context, experiment.audience):
            return None
        user_assignments = self.user_assignments.get(context.user_id, {})
        if experiment_id in user_assignments:
            return user_assignments[experiment_id]
        variant = self._assign_variant(experiment, context)
        if variant:
            self.user_assignments.setdefault(context.user_id, {})[
                experiment_id
            ] = variant.id
            return variant.id
        return None

    def _are_dependencies_satisfied(
        self, feature: Feature, context: UserContext
    ) -> bool:
        return all(
            self.is_feature_enabled(dep_id, context) for dep_id in feature.dependencies
        )

    def _is_user_in_rollout(self, user_id: str, percentage: float) -> bool:
        h = int(hashlib.sha256(user_id.encode()).hexdigest(), 16)
        normalized = (h % (10**8)) / (10**8)
        return normalized <= percentage / 100.0

    def _is_user_in_audience(
        self, context: UserContext, audience: Dict[str, Any]
    ) -> bool:
        if not self._is_user_in_rollout(
            context.user_id, audience.get("percentage", 100)
        ):
            return False
        filters = audience.get("filters", {})
        for k, v in filters.items():
            if context.attributes.get(k) != v:
                return False
        return True

    def _assign_variant(
        self, experiment: Experiment, context: UserContext
    ) -> Optional[ExperimentVariant]:
        total_weight = sum(v.weight for v in experiment.variants)
        h = int(
            hashlib.sha256(f"{context.user_id}:{experiment.id}".encode()).hexdigest(),
            16,
        )
        normalized = (h % (10**8)) / (10**8) * total_weight
        cumulative = 0
        for variant in experiment.variants:
            cumulative += variant.weight
            if normalized <= cumulative:
                return variant
        return None

    def register_feature(self, feature: Feature):
        if feature.id in self.features:
            raise ValueError(f"Feature {feature.id} already exists")
        self.features[feature.id] = feature

    def update_feature(self, feature_id: str, updates: Dict[str, Any]):
        feature = self.features.get(feature_id)
        if not feature:
            raise ValueError(f"Feature {feature_id} not found")
        for k, v in updates.items():
            setattr(feature, k, v)

    def register_experiment(self, experiment: Experiment):
        if experiment.id in self.experiments:
            raise ValueError(f"Experiment {experiment.id} already exists")
        self.experiments[experiment.id] = experiment

    def update_experiment(self, experiment_id: str, updates: Dict[str, Any]):
        experiment = self.experiments.get(experiment_id)
        if not experiment:
            raise ValueError(f"Experiment {experiment_id} not found")
        for k, v in updates.items():
            setattr(experiment, k, v)

    def get_all_features(self) -> List[Feature]:
        return list(self.features.values())

    def get_all_experiments(self) -> List[Experiment]:
        return list(self.experiments.values())

    def get_user_assignments(self, user_id: str) -> Dict[str, str]:
        return self.user_assignments.get(user_id, {})

    def clear_user_assignments(self, user_id: str):
        self.user_assignments.pop(user_id, None)
