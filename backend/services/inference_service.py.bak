"""
PR9: Inference Service Wrapper

Provides model inference capabilities with timing, shadow mode execution,
and integration with the audit system for observability.
"""

import asyncio
import hashlib
import json
import time
import uuid
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

from backend.utils.log_context import get_contextual_logger
from backend.utils.trace_utils import trace_span, add_span_tag, add_span_log
from backend.services.model_registry import get_model_registry
from backend.services.inference_audit import get_inference_audit

logger = get_contextual_logger(__name__)


@dataclass
class PredictionResult:
    """Result from model inference including metadata and timing."""
    prediction: float
    confidence: float
    model_version: str
    request_id: str
    latency_ms: float
    feature_hash: str
    shadow_prediction: Optional[float] = None
    shadow_confidence: Optional[float] = None
    shadow_version: Optional[str] = None
    shadow_diff: Optional[float] = None
    shadow_latency_ms: Optional[float] = None
    status: str = "success"


class InferenceService:
    """
    Service for running model inference with observability and shadow mode support.
    """

    def __init__(self):
        self.model_registry = get_model_registry()
        self.audit_service = get_inference_audit()
        
        # Initialize loaded models cache
        self._loaded_models: Dict[str, Dict[str, Any]] = {}

    def _compute_feature_hash(self, features: Dict[str, Any]) -> str:
        """
        Compute deterministic hash of feature dictionary.
        
        Args:
            features: Feature dictionary to hash
            
        Returns:
            SHA256 hash of canonicalized features
        """
        # Canonicalize features for deterministic hashing
        canonical_json = json.dumps(features, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()[:16]

    def _get_or_load_model(self, version: str) -> Dict[str, Any]:
        """
        Get model from cache or load it.
        
        Args:
            version: Model version to load
            
        Returns:
            Model stub dictionary
        """
        if version not in self._loaded_models:
            try:
                self._loaded_models[version] = self.model_registry.load_model(version)
                logger.info(
                    f"Model cached: {version}",
                    extra={"model_version": version, "cache_size": len(self._loaded_models)}
                )
            except Exception as e:
                logger.error(
                    f"Failed to load model {version}",
                    extra={"model_version": version, "error": str(e)}
                )
                raise

        return self._loaded_models[version]

    def _run_model_inference(self, model: Dict[str, Any], features: Dict[str, Any]) -> Tuple[float, float]:
        """
        Run actual model inference (stub implementation).
        
        Args:
            model: Model stub dictionary
            features: Input features
            
        Returns:
            Tuple of (prediction, confidence)
        """
        # Stub implementation - simulate inference with deterministic output
        feature_sum = sum(v for v in features.values() if isinstance(v, (int, float)))
        
        # Simple mock prediction logic
        prediction = min(max(0.3 + (feature_sum % 100) / 150.0, 0.0), 1.0)
        confidence = min(max(0.6 + (feature_sum % 50) / 100.0, 0.5), 0.95)
        
        # Add small delay to simulate processing
        time.sleep(0.001)  # 1ms simulation
        
        return prediction, confidence

    async def run_inference(self, model_version: str, features: Dict[str, Any]) -> PredictionResult:
        """
        Run model inference with full observability and shadow mode support.
        
        Args:
            model_version: Model version to use for inference
            features: Input features dictionary
            
        Returns:
            PredictionResult with prediction, timing, and shadow data
            
        Raises:
            ValueError: If model version is not available
        """
        request_id = str(uuid.uuid4())
        feature_hash = self._compute_feature_hash(features)
        
        logger.info(
            "Starting model inference",
            extra={
                "request_id": request_id,
                "model_version": model_version,
                "feature_hash": feature_hash,
                "feature_count": len(features)
            }
        )

        # Primary model inference with tracing
        start_time = time.time()  # Initialize timing before try block
        with trace_span(
            "model_inference",
            service_name="inference",
            operation_name="primary_prediction"
        ) as span_id:
            add_span_tag(span_id, "model_version", model_version)
            add_span_tag(span_id, "feature_hash", feature_hash)
            add_span_tag(span_id, "request_id", request_id)
            
            try:
                # Load primary model
                primary_model = self._get_or_load_model(model_version)
                
                # Run primary inference
                prediction, confidence = self._run_model_inference(primary_model, features)
                primary_latency_ms = (time.time() - start_time) * 1000
                
                add_span_tag(span_id, "prediction", prediction)
                add_span_tag(span_id, "confidence", confidence)
                add_span_tag(span_id, "latency_ms", primary_latency_ms)
                add_span_log(span_id, f"Primary inference completed", "info")
                
                result = PredictionResult(
                    prediction=prediction,
                    confidence=confidence,
                    model_version=model_version,
                    request_id=request_id,
                    latency_ms=primary_latency_ms,
                    feature_hash=feature_hash,
                    status="success"
                )

                # Shadow model inference if enabled
                if self.model_registry.is_shadow_mode_enabled():
                    shadow_result = await self._run_shadow_inference(
                        features, feature_hash, request_id
                    )
                    if shadow_result:
                        with trace_span(
                            "diff_classification",
                            service_name="inference",
                            operation_name="shadow_comparison"
                        ) as diff_span_id:
                            result.shadow_prediction = shadow_result["prediction"]
                            result.shadow_confidence = shadow_result["confidence"]
                            result.shadow_version = shadow_result["version"]
                            result.shadow_latency_ms = shadow_result["latency_ms"]
                            result.shadow_diff = abs(prediction - shadow_result["prediction"])
                            
                            # Classify the difference magnitude
                            if result.shadow_diff < 0.05:
                                diff_class = "minimal"
                            elif result.shadow_diff < 0.15:
                                diff_class = "moderate"
                            else:
                                diff_class = "significant"
                            
                            add_span_tag(diff_span_id, "primary_prediction", prediction)
                            add_span_tag(diff_span_id, "shadow_prediction", shadow_result["prediction"])
                            add_span_tag(diff_span_id, "shadow_diff", result.shadow_diff)
                            add_span_tag(diff_span_id, "diff_classification", diff_class)
                            add_span_log(diff_span_id, f"Shadow diff classified as {diff_class}", "info")

                # Record in audit system with outcome ingestion span
                with trace_span(
                    "outcome_ingestion",
                    service_name="audit",
                    operation_name="record_inference"
                ) as ingest_span_id:
                    add_span_tag(ingest_span_id, "request_id", request_id)
                    add_span_tag(ingest_span_id, "model_version", model_version)
                    add_span_tag(ingest_span_id, "has_shadow", result.shadow_version is not None)
                    
                    self.audit_service.record_inference(result)
                    
                    add_span_log(ingest_span_id, "Inference outcome recorded in audit", "info")

                logger.info(
                    "Model inference completed",
                    extra={
                        "request_id": request_id,
                        "prediction": prediction,
                        "confidence": confidence,
                        "latency_ms": primary_latency_ms,
                        "shadow_enabled": result.shadow_version is not None,
                        "shadow_diff": result.shadow_diff
                    }
                )

                return result

            except Exception as e:
                add_span_tag(span_id, "error", str(e))
                add_span_log(span_id, f"Primary inference failed: {str(e)}", "error")
                
                # Record error in audit
                error_result = PredictionResult(
                    prediction=0.0,
                    confidence=0.0,
                    model_version=model_version,
                    request_id=request_id,
                    latency_ms=(time.time() - start_time) * 1000,
                    feature_hash=feature_hash,
                    status="error"
                )
                self.audit_service.record_inference(error_result)
                
                logger.error(
                    "Model inference failed",
                    extra={
                        "request_id": request_id,
                        "model_version": model_version,
                        "error": str(e)
                    }
                )
                
                raise

    async def _run_shadow_inference(
        self, 
        features: Dict[str, Any], 
        feature_hash: str, 
        request_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Run shadow model inference in parallel/sequential mode.
        
        Args:
            features: Input features
            feature_hash: Precomputed feature hash
            request_id: Request correlation ID
            
        Returns:
            Shadow inference result dictionary or None if failed
        """
        shadow_version = self.model_registry.get_shadow_model_version()
        if not shadow_version:
            return None

        with trace_span(
            "shadow_inference",
            service_name="inference",
            operation_name="shadow_prediction"
        ) as shadow_span_id:
            add_span_tag(shadow_span_id, "shadow_version", shadow_version)
            add_span_tag(shadow_span_id, "feature_hash", feature_hash)
            add_span_tag(shadow_span_id, "request_id", request_id)
            
            try:
                start_time = time.time()
                
                # Load shadow model
                shadow_model = self._get_or_load_model(shadow_version)
                
                # Run shadow inference
                shadow_prediction, shadow_confidence = self._run_model_inference(
                    shadow_model, features
                )
                shadow_latency_ms = (time.time() - start_time) * 1000

                add_span_tag(shadow_span_id, "prediction", shadow_prediction)
                add_span_tag(shadow_span_id, "confidence", shadow_confidence)
                add_span_tag(shadow_span_id, "latency_ms", shadow_latency_ms)
                add_span_log(shadow_span_id, "Shadow inference completed", "info")

                logger.info(
                    "Shadow inference completed",
                    extra={
                        "request_id": request_id,
                        "shadow_version": shadow_version,
                        "shadow_prediction": shadow_prediction,
                        "shadow_confidence": shadow_confidence,
                        "shadow_latency_ms": shadow_latency_ms
                    }
                )

                return {
                    "prediction": shadow_prediction,
                    "confidence": shadow_confidence,
                    "version": shadow_version,
                    "latency_ms": shadow_latency_ms
                }

            except Exception as e:
                add_span_tag(shadow_span_id, "error", str(e))
                add_span_log(shadow_span_id, f"Shadow inference failed: {str(e)}", "error")
                
                logger.warning(
                    "Shadow inference failed, continuing with primary only",
                    extra={
                        "request_id": request_id,
                        "shadow_version": shadow_version,
                        "error": str(e)
                    }
                )
                
                return None


# Global inference service instance
_inference_service = InferenceService()


def get_inference_service() -> InferenceService:
    """
    Get the global inference service instance.
    
    Returns:
        InferenceService singleton instance
    """
    return _inference_service


# Convenience function for running inference
async def run_inference(model_version: str, features: Dict[str, Any]) -> PredictionResult:
    """
    Run model inference with observability.
    
    Args:
        model_version: Model version to use
        features: Input features dictionary
        
    Returns:
        PredictionResult with prediction and metadata
    """
    return await _inference_service.run_inference(model_version, features)