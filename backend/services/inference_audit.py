"""
PR9: Inference Audit Service

Provides in-memory audit storage with ring buffer, aggregation capabilities,
and thread-safe access for inference observability. Enhanced with file persistence.
"""

import asyncio
import os
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Deque
from threading import Lock

from backend.utils.log_context import get_contextual_logger

# Import file audit store for persistence
try:
    from backend.services.file_audit_store import get_file_audit_store
    FILE_AUDIT_AVAILABLE = True
    _get_file_audit_store = get_file_audit_store  # Alias to avoid type issues
except ImportError:
    FILE_AUDIT_AVAILABLE = False
    _get_file_audit_store = None

logger = get_contextual_logger(__name__)


@dataclass
class InferenceAuditEntry:
    """Single inference audit entry with all captured metadata."""
    request_id: str
    timestamp: float
    model_version: str
    feature_hash: str
    latency_ms: float
    prediction: float
    confidence: float
    shadow_version: Optional[str] = None
    shadow_prediction: Optional[float] = None
    shadow_diff: Optional[float] = None
    shadow_latency_ms: Optional[float] = None
    status: str = "success"  # success|error
    

@dataclass
class InferenceAuditSummary:
    """Aggregated audit summary with drift and calibration metrics."""
    rolling_count: int
    avg_latency_ms: float
    shadow_avg_diff: Optional[float]
    prediction_mean: float
    confidence_histogram: Dict[str, int]
    shadow_enabled: bool
    active_model: str
    shadow_model: Optional[str]
    success_rate: float
    error_count: int


class InferenceAuditService:
    """
    Thread-safe in-memory audit service for inference observability.
    
    Provides ring buffer storage, aggregation, and summary statistics
    for monitoring model performance and drift detection.
    """

    def __init__(self):
        self._initialize_configuration()
        self._initialize_storage()
        
        # Initialize file audit store if available
        self.file_store = None
        self._initialize_file_persistence()
        
    def _initialize_configuration(self) -> None:
        """Initialize audit configuration from environment variables."""
        self.audit_capacity = int(os.getenv("A1_INFERENCE_AUDIT_CAP", "1000"))
        
        logger.info(
            "Inference audit service initialized",
            extra={"audit_capacity": self.audit_capacity}
        )

    def _initialize_storage(self) -> None:
        """Initialize thread-safe storage structures."""
        # Ring buffer for audit entries
        self.audit_buffer: Deque[InferenceAuditEntry] = deque(maxlen=self.audit_capacity)
        
        # Thread safety lock
        self._lock = Lock()
        
        # Performance tracking
        self._last_summary_time = 0.0
        self._cached_summary: Optional[InferenceAuditSummary] = None

    def _initialize_file_persistence(self) -> None:
        """Initialize file audit store for persistence if available."""
        if FILE_AUDIT_AVAILABLE and os.getenv("A1_ENABLE_FILE_AUDIT", "true").lower() == "true":
            try:
                if _get_file_audit_store:
                    self.file_store = _get_file_audit_store()
                    logger.info("File audit persistence enabled")
                else:
                    self.file_store = None
            except Exception as e:
                logger.warning(f"Failed to initialize file audit store: {e}")
                self.file_store = None
        else:
            logger.info("File audit persistence disabled")
            self.file_store = None

    def record_inference(self, inference_result) -> None:
        """
        Record an inference result in the audit buffer and file store.
        
        Args:
            inference_result: PredictionResult or compatible object with inference data
        """
        entry = InferenceAuditEntry(
            request_id=inference_result.request_id,
            timestamp=time.time(),
            model_version=inference_result.model_version,
            feature_hash=inference_result.feature_hash,
            latency_ms=inference_result.latency_ms,
            prediction=inference_result.prediction,
            confidence=inference_result.confidence,
            shadow_version=inference_result.shadow_version,
            shadow_prediction=inference_result.shadow_prediction,
            shadow_diff=inference_result.shadow_diff,
            shadow_latency_ms=inference_result.shadow_latency_ms,
            status=inference_result.status
        )

        with self._lock:
            self.audit_buffer.append(entry)
            # Clear cached summary when new data arrives
            self._cached_summary = None

        # Record to file store if available (outside lock to avoid blocking)
        if self.file_store:
            try:
                self.file_store.record_inference(inference_result)
            except Exception as e:
                logger.warning(
                    f"Failed to record inference to file store: {e}",
                    extra={"request_id": inference_result.request_id}
                )

        logger.debug(
            "Inference recorded in audit",
            extra={
                "request_id": entry.request_id,
                "model_version": entry.model_version,
                "prediction": entry.prediction,
                "latency_ms": entry.latency_ms,
                "buffer_size": len(self.audit_buffer)
            }
        )

    def get_recent_inferences(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get recent inference audit entries.
        
        Args:
            limit: Maximum number of entries to return
            
        Returns:
            List of recent audit entries as dictionaries
        """
        with self._lock:
            recent_entries = list(self.audit_buffer)[-limit:]

        # Convert to dictionaries for JSON serialization
        result = []
        for entry in reversed(recent_entries):  # Most recent first
            result.append({
                "request_id": entry.request_id,
                "timestamp": entry.timestamp,
                "model_version": entry.model_version,
                "feature_hash": entry.feature_hash,
                "latency_ms": entry.latency_ms,
                "prediction": entry.prediction,
                "confidence": entry.confidence,
                "shadow_version": entry.shadow_version,
                "shadow_prediction": entry.shadow_prediction,
                "shadow_diff": entry.shadow_diff,
                "shadow_latency_ms": entry.shadow_latency_ms,
                "status": entry.status
            })

        logger.debug(
            f"Retrieved {len(result)} recent inferences",
            extra={"requested_limit": limit, "actual_count": len(result)}
        )

        return result

    def get_audit_summary(self) -> InferenceAuditSummary:
        """
        Get aggregated audit summary with drift and calibration metrics.
        
        Returns:
            InferenceAuditSummary with aggregated statistics
        """
        current_time = time.time()
        
        # Use cached summary if recent (within 30 seconds)
        if (self._cached_summary is not None and 
            current_time - self._last_summary_time < 30):
            return self._cached_summary

        with self._lock:
            entries = list(self.audit_buffer)

        if not entries:
            return InferenceAuditSummary(
                rolling_count=0,
                avg_latency_ms=0.0,
                shadow_avg_diff=None,
                prediction_mean=0.0,
                confidence_histogram={},
                shadow_enabled=False,
                active_model="none",
                shadow_model=None,
                success_rate=1.0,
                error_count=0
            )

        # Calculate aggregated metrics
        rolling_count = len(entries)
        successful_entries = [e for e in entries if e.status == "success"]
        error_count = rolling_count - len(successful_entries)
        success_rate = len(successful_entries) / rolling_count if rolling_count > 0 else 1.0

        # Latency metrics
        latencies = [e.latency_ms for e in successful_entries]
        avg_latency_ms = sum(latencies) / len(latencies) if latencies else 0.0

        # Prediction metrics
        predictions = [e.prediction for e in successful_entries]
        prediction_mean = sum(predictions) / len(predictions) if predictions else 0.0

        # Shadow metrics
        shadow_diffs = [e.shadow_diff for e in successful_entries if e.shadow_diff is not None]
        shadow_avg_diff = sum(shadow_diffs) / len(shadow_diffs) if shadow_diffs else None
        shadow_enabled = any(e.shadow_version is not None for e in entries)

        # Confidence histogram (binned)
        confidence_histogram = self._compute_confidence_histogram(successful_entries)

        # Model versions
        active_model = entries[-1].model_version if entries else "none"
        shadow_models = [e.shadow_version for e in entries if e.shadow_version is not None]
        shadow_model = shadow_models[-1] if shadow_models else None

        summary = InferenceAuditSummary(
            rolling_count=rolling_count,
            avg_latency_ms=avg_latency_ms,
            shadow_avg_diff=shadow_avg_diff,
            prediction_mean=prediction_mean,
            confidence_histogram=confidence_histogram,
            shadow_enabled=shadow_enabled,
            active_model=active_model,
            shadow_model=shadow_model,
            success_rate=success_rate,
            error_count=error_count
        )

        # Cache the summary
        self._cached_summary = summary
        self._last_summary_time = current_time

        logger.debug(
            "Audit summary computed",
            extra={
                "rolling_count": rolling_count,
                "avg_latency_ms": avg_latency_ms,
                "shadow_avg_diff": shadow_avg_diff,
                "success_rate": success_rate
            }
        )

        return summary

    def _compute_confidence_histogram(self, entries: List[InferenceAuditEntry]) -> Dict[str, int]:
        """
        Compute confidence distribution histogram with bins.
        
        Args:
            entries: List of successful inference entries
            
        Returns:
            Dictionary with confidence bins and counts
        """
        bins = {
            "0.0-0.2": 0,
            "0.2-0.4": 0,
            "0.4-0.6": 0,
            "0.6-0.8": 0,
            "0.8-1.0": 0
        }

        for entry in entries:
            confidence = entry.confidence
            if confidence < 0.2:
                bins["0.0-0.2"] += 1
            elif confidence < 0.4:
                bins["0.2-0.4"] += 1
            elif confidence < 0.6:
                bins["0.4-0.6"] += 1
            elif confidence < 0.8:
                bins["0.6-0.8"] += 1
            else:
                bins["0.8-1.0"] += 1

        return bins

    def get_buffer_status(self) -> Dict[str, Any]:
        """
        Get buffer status and health information.
        
        Returns:
            Dictionary with buffer statistics
        """
        with self._lock:
            buffer_size = len(self.audit_buffer)

        return {
            "buffer_size": buffer_size,
            "buffer_capacity": self.audit_capacity,
            "buffer_utilization": buffer_size / self.audit_capacity if self.audit_capacity > 0 else 0,
            "is_full": buffer_size >= self.audit_capacity,
            "cache_valid": self._cached_summary is not None,
            "last_summary_age_seconds": time.time() - self._last_summary_time
        }

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check of the audit service.
        
        Returns:
            Health check results
        """
        try:
            status = self.get_buffer_status()
            summary = self.get_audit_summary()
            
            return {
                "status": "healthy",
                "buffer_status": status,
                "recent_activity": {
                    "rolling_count": summary.rolling_count,
                    "avg_latency_ms": summary.avg_latency_ms,
                    "success_rate": summary.success_rate
                }
            }
        except Exception as e:
            logger.error(f"Audit service health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Global inference audit service instance
_inference_audit = InferenceAuditService()


def get_inference_audit() -> InferenceAuditService:
    """
    Get the global inference audit service instance.
    
    Returns:
        InferenceAuditService singleton instance
    """
    return _inference_audit