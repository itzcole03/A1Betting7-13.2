import asyncio
from typing import Dict, Any, List, Optional


class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, Dict[str, Any]] = {}

    async def register(self, model_name: str, version: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        key = f"{model_name}:{version}"
        self._models[key] = {"name": model_name, "version": version, "metadata": metadata or {}}
        await asyncio.sleep(0)
        return self._models[key]

    async def list_models(self) -> List[Dict[str, Any]]:
        await asyncio.sleep(0)
        return list(self._models.values())

    async def get_model(self, model_name: str, version: str) -> Optional[Dict[str, Any]]:
        await asyncio.sleep(0)
        return self._models.get(f"{model_name}:{version}")


_registry = ModelRegistry()


def get_registry() -> ModelRegistry:
    return _registry
"""Minimal ModelRegistry shim for tests.

Provides a simple in-memory registry and factory accessor used by tests
to avoid import-time failures during pytest collection.
"""

from typing import Dict, Any


class ModelRegistry:
    def __init__(self):
        self._models: Dict[str, Any] = {}

    def register(self, name: str, model: Any) -> None:
        self._models[name] = model

    def get(self, name: str) -> Any:
        return self._models.get(name)


_GLOBAL_REGISTRY: ModelRegistry | None = None


def get_model_registry() -> ModelRegistry:
    global _GLOBAL_REGISTRY
    if _GLOBAL_REGISTRY is None:
        _GLOBAL_REGISTRY = ModelRegistry()
    return _GLOBAL_REGISTRY
"""
PR9: Model Registry Service

Manages model versions, provides active model configuration, and handles
model loading stubs for the inference observability system.
"""

import os
import logging
from typing import List, Dict, Any, Optional

from backend.utils.log_context import get_contextual_logger
from backend.utils.trace_utils import trace_span, add_span_tag

logger = get_contextual_logger(__name__)


class ModelRegistry:
    """
    Model registry for managing active and shadow model versions.
    Provides configuration and loading capabilities for the inference system.
    """

    def __init__(self):
        self._initialize_configuration()

    def _initialize_configuration(self) -> None:
        """Initialize model registry configuration from environment variables."""
        self.active_model_version = os.getenv("A1_ACTIVE_MODEL_VERSION", "default_model_v1")
        self.shadow_model_version = os.getenv("A1_SHADOW_MODEL_VERSION")  # Optional
        
        logger.info(
            "Model registry initialized",
            extra={
                "active_model": self.active_model_version,
                "shadow_model": self.shadow_model_version,
                "shadow_enabled": self.shadow_model_version is not None
            }
        )

    def get_active_model_version(self) -> str:
        """
        Get the currently active model version.
        
        Returns:
            Active model version identifier
        """
        return self.active_model_version

    def get_shadow_model_version(self) -> Optional[str]:
        """
        Get the shadow model version if configured.
        
        Returns:
            Shadow model version identifier or None if not configured
        """
        return self.shadow_model_version

    def is_shadow_mode_enabled(self) -> bool:
        """
        Check if shadow mode is enabled.
        Shadow mode requires a shadow model version different from active.
        
        Returns:
            True if shadow mode is enabled, False otherwise
        """
        return (
            self.shadow_model_version is not None 
            and self.shadow_model_version != self.active_model_version
        )

    def load_model(self, version: str) -> Dict[str, Any]:
        """
        Load a model stub by version.
        
        Note: This is a stub implementation for PR9. In a real system,
        this would load actual model artifacts, weights, and configuration.
        
        Args:
            version: Model version identifier to load
            
        Returns:
            Model stub dictionary with metadata
            
        Raises:
            ValueError: If model version is not available
        """
        with trace_span(
            "model_load", 
            service_name="model_registry", 
            operation_name="load_model"
        ) as span_id:
            add_span_tag(span_id, "model_version", version)
            
            available_versions = self.list_available_versions()
            add_span_tag(span_id, "available_versions_count", len(available_versions))
            
            if version not in available_versions:
                add_span_tag(span_id, "load_success", False)
                add_span_tag(span_id, "error_reason", "version_not_available")
                logger.error(
                    f"Model version not available: {version}",
                    extra={"requested_version": version, "available_versions": available_versions}
                )
                raise ValueError(f"Model version '{version}' not available")

            # Stub model implementation
            model_stub = {
                "version": version,
                "model_type": "sports_prediction",
                "framework": "stub_framework",
                "loaded_at": "stub_timestamp",
                "parameters": {
                    "input_features": 50,
                    "output_classes": 3,  # Over/Under/Push
                    "confidence_threshold": 0.7
                },
                "metadata": {
                    "training_date": "2024-01-01",
                    "performance_metrics": {
                        "accuracy": 0.85,
                        "precision": 0.82,
                        "recall": 0.88
                    }
                }
            }

            add_span_tag(span_id, "load_success", True)
            add_span_tag(span_id, "model_type", model_stub["model_type"])
            add_span_tag(span_id, "input_features", model_stub["parameters"]["input_features"])

            logger.info(
                f"Model loaded: {version}",
                extra={
                    "model_version": version,
                    "model_type": model_stub["model_type"],
                    "input_features": model_stub["parameters"]["input_features"]
                }
            )

            return model_stub

    def list_available_versions(self) -> List[str]:
        """
        List all available model versions.
        
        Returns:
            List of available model version identifiers
        """
        # Stub implementation - in real system this would query model storage
        available_versions = [
            "default_model_v1",
            "enhanced_model_v2",
            "shadow_test_v1",
            "experimental_v3"
        ]

        logger.debug(
            "Available model versions retrieved",
            extra={"available_versions": available_versions, "count": len(available_versions)}
        )

        return available_versions

    def get_model_metadata(self, version: str) -> Dict[str, Any]:
        """
        Get metadata for a specific model version.
        
        Args:
            version: Model version identifier
            
        Returns:
            Model metadata dictionary
            
        Raises:
            ValueError: If model version is not available
        """
        if version not in self.list_available_versions():
            raise ValueError(f"Model version '{version}' not available")

        # Stub metadata - in real system this would be stored separately
        metadata = {
            "version": version,
            "created_at": "2024-01-01T00:00:00Z",
            "performance_metrics": {
                "accuracy": 0.85,
                "precision": 0.82,
                "recall": 0.88,
                "f1_score": 0.85
            },
            "training_info": {
                "dataset_size": 100000,
                "training_duration": "2h 30m",
                "validation_split": 0.2
            },
            "feature_info": {
                "input_features": 50,
                "feature_types": ["numerical", "categorical"],
                "preprocessing": "standardized"
            }
        }

        return metadata


# Global model registry instance
_model_registry = ModelRegistry()


def get_model_registry() -> ModelRegistry:
    """
    Get the global model registry instance.
    
    Returns:
        ModelRegistry singleton instance
    """
    return _model_registry


# Convenience functions for common operations
def get_active_model_version() -> str:
    """Get the active model version."""
    return _model_registry.get_active_model_version()


def get_shadow_model_version() -> Optional[str]:
    """Get the shadow model version if configured."""
    return _model_registry.get_shadow_model_version()


def is_shadow_mode_enabled() -> bool:
    """Check if shadow mode is enabled."""
    return _model_registry.is_shadow_mode_enabled()


def load_model(version: str) -> Dict[str, Any]:
    """Load a model by version."""
    return _model_registry.load_model(version)


def list_available_versions() -> List[str]:
    """List all available model versions."""
    return _model_registry.list_available_versions()