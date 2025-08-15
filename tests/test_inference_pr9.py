"""
PR9: Backend Tests for Model Inference Observability

Tests covering primary inference, shadow mode, audit buffer, 
summary calculations, and feature hash determinism.
"""

import pytest
import asyncio
import json
import hashlib
from unittest.mock import patch, MagicMock

from backend.services.model_registry import ModelRegistry, get_model_registry
from backend.services.inference_service import InferenceService, PredictionResult
from backend.services.inference_audit import InferenceAuditService, InferenceAuditEntry


class TestModelRegistry:
    """Test model registry functionality."""
    
    def test_get_active_model_version_default(self):
        """Test that default active model version is returned."""
        with patch.dict('os.environ', {}, clear=True):
            registry = ModelRegistry()
            assert registry.get_active_model_version() == "default_model_v1"

    def test_get_active_model_version_from_env(self):
        """Test that active model version is read from environment."""
        with patch.dict('os.environ', {'A1_ACTIVE_MODEL_VERSION': 'custom_model_v2'}):
            registry = ModelRegistry()
            assert registry.get_active_model_version() == "custom_model_v2"

    def test_shadow_mode_disabled_by_default(self):
        """Test that shadow mode is disabled when no shadow model is configured."""
        with patch.dict('os.environ', {}, clear=True):
            registry = ModelRegistry()
            assert not registry.is_shadow_mode_enabled()
            assert registry.get_shadow_model_version() is None

    def test_shadow_mode_enabled_with_different_version(self):
        """Test that shadow mode is enabled when shadow version differs from active."""
        with patch.dict('os.environ', {
            'A1_ACTIVE_MODEL_VERSION': 'active_v1',
            'A1_SHADOW_MODEL_VERSION': 'shadow_v2'
        }):
            registry = ModelRegistry()
            assert registry.is_shadow_mode_enabled()
            assert registry.get_shadow_model_version() == "shadow_v2"

    def test_shadow_mode_disabled_with_same_version(self):
        """Test that shadow mode is disabled when shadow version equals active."""
        with patch.dict('os.environ', {
            'A1_ACTIVE_MODEL_VERSION': 'same_v1',
            'A1_SHADOW_MODEL_VERSION': 'same_v1'
        }):
            registry = ModelRegistry()
            assert not registry.is_shadow_mode_enabled()

    def test_list_available_versions(self):
        """Test that available versions are returned."""
        registry = ModelRegistry()
        versions = registry.list_available_versions()
        assert isinstance(versions, list)
        assert len(versions) > 0
        assert "default_model_v1" in versions

    def test_load_model_success(self):
        """Test successful model loading."""
        registry = ModelRegistry()
        model = registry.load_model("default_model_v1")
        
        assert isinstance(model, dict)
        assert model["version"] == "default_model_v1"
        assert "parameters" in model
        assert "metadata" in model

    def test_load_model_invalid_version(self):
        """Test that loading invalid model version raises error."""
        registry = ModelRegistry()
        with pytest.raises(ValueError, match="Model version 'invalid_version' not available"):
            registry.load_model("invalid_version")

    def test_get_model_metadata(self):
        """Test getting model metadata."""
        registry = ModelRegistry()
        metadata = registry.get_model_metadata("default_model_v1")
        
        assert isinstance(metadata, dict)
        assert metadata["version"] == "default_model_v1"
        assert "performance_metrics" in metadata


class TestInferenceAuditService:
    """Test inference audit service functionality."""
    
    def test_audit_service_initialization(self):
        """Test that audit service initializes correctly."""
        with patch.dict('os.environ', {'A1_INFERENCE_AUDIT_CAP': '500'}):
            service = InferenceAuditService()
            assert service.audit_capacity == 500

    def test_record_inference(self):
        """Test recording inference results."""
        service = InferenceAuditService()
        
        # Create mock inference result
        result = MagicMock()
        result.request_id = "test-request-123"
        result.model_version = "test_model_v1"
        result.feature_hash = "abc123"
        result.latency_ms = 50.0
        result.prediction = 0.75
        result.confidence = 0.85
        result.shadow_version = None
        result.shadow_prediction = None
        result.shadow_diff = None
        result.shadow_latency_ms = None
        result.status = "success"
        
        # Record inference
        service.record_inference(result)
        
        # Check that entry was recorded
        entries = service.get_recent_inferences(1)
        assert len(entries) == 1
        assert entries[0]["request_id"] == "test-request-123"
        assert entries[0]["model_version"] == "test_model_v1"

    def test_audit_buffer_ring_behavior(self):
        """Test that audit buffer behaves as ring buffer with capacity limit."""
        # Create service with small capacity
        with patch.dict('os.environ', {'A1_INFERENCE_AUDIT_CAP': '3'}):
            service = InferenceAuditService()
            
            # Add more entries than capacity
            for i in range(5):
                result = MagicMock()
                result.request_id = f"request-{i}"
                result.model_version = "test_model"
                result.feature_hash = "hash"
                result.latency_ms = 10.0
                result.prediction = 0.5
                result.confidence = 0.8
                result.shadow_version = None
                result.shadow_prediction = None  
                result.shadow_diff = None
                result.shadow_latency_ms = None
                result.status = "success"
                
                service.record_inference(result)
            
            # Should only keep last 3 entries
            entries = service.get_recent_inferences(10)
            assert len(entries) == 3
            assert entries[0]["request_id"] == "request-4"  # Most recent first
            assert entries[2]["request_id"] == "request-2"  # Oldest kept

    def test_get_audit_summary_empty(self):
        """Test audit summary with empty buffer."""
        service = InferenceAuditService()
        summary = service.get_audit_summary()
        
        assert summary.rolling_count == 0
        assert summary.avg_latency_ms == 0.0
        assert summary.shadow_avg_diff is None
        assert summary.success_rate == 1.0

    def test_get_audit_summary_with_data(self):
        """Test audit summary calculations."""
        service = InferenceAuditService()
        
        # Add test entries
        for i in range(3):
            result = MagicMock()
            result.request_id = f"request-{i}"
            result.model_version = "test_model"
            result.feature_hash = "hash"
            result.latency_ms = (i + 1) * 10.0  # 10, 20, 30 ms
            result.prediction = 0.5 + i * 0.1   # 0.5, 0.6, 0.7
            result.confidence = 0.8
            result.shadow_version = None
            result.shadow_prediction = None
            result.shadow_diff = None
            result.shadow_latency_ms = None
            result.status = "success"
            
            service.record_inference(result)
        
        summary = service.get_audit_summary()
        
        assert summary.rolling_count == 3
        assert summary.avg_latency_ms == 20.0  # (10 + 20 + 30) / 3
        assert abs(summary.prediction_mean - 0.6) < 0.001  # (0.5 + 0.6 + 0.7) / 3
        assert summary.success_rate == 1.0

    def test_confidence_histogram(self):
        """Test confidence distribution histogram calculation."""
        service = InferenceAuditService()
        
        # Add entries with different confidence levels
        confidence_values = [0.1, 0.3, 0.5, 0.7, 0.9]
        for i, conf in enumerate(confidence_values):
            result = MagicMock()
            result.request_id = f"request-{i}"
            result.model_version = "test_model"
            result.feature_hash = "hash"
            result.latency_ms = 10.0
            result.prediction = 0.5
            result.confidence = conf
            result.shadow_version = None
            result.shadow_prediction = None
            result.shadow_diff = None
            result.shadow_latency_ms = None
            result.status = "success"
            
            service.record_inference(result)
        
        summary = service.get_audit_summary()
        histogram = summary.confidence_histogram
        
        # Should have one entry in each bin
        assert histogram["0.0-0.2"] == 1  # 0.1
        assert histogram["0.2-0.4"] == 1  # 0.3
        assert histogram["0.4-0.6"] == 1  # 0.5
        assert histogram["0.6-0.8"] == 1  # 0.7
        assert histogram["0.8-1.0"] == 1  # 0.9

    def test_shadow_mode_metrics(self):
        """Test shadow mode metric calculations."""
        service = InferenceAuditService()
        
        # Add entries with shadow data
        shadow_diffs = [0.1, 0.2, 0.3]
        for i, diff in enumerate(shadow_diffs):
            result = MagicMock()
            result.request_id = f"request-{i}"
            result.model_version = "active_v1"
            result.feature_hash = "hash"
            result.latency_ms = 10.0
            result.prediction = 0.5
            result.confidence = 0.8
            result.shadow_version = "shadow_v1"
            result.shadow_prediction = 0.5 + diff
            result.shadow_diff = diff
            result.shadow_latency_ms = 12.0
            result.status = "success"
            
            service.record_inference(result)
        
        summary = service.get_audit_summary()
        
        assert summary.shadow_enabled == True
        assert summary.shadow_avg_diff is not None
        assert abs(summary.shadow_avg_diff - 0.2) < 0.001  # (0.1 + 0.2 + 0.3) / 3


class TestInferenceService:
    """Test inference service functionality."""
    
    @pytest.fixture
    def mock_registry(self):
        """Mock model registry for testing."""
        registry = MagicMock()
        registry.get_active_model_version.return_value = "test_model_v1"
        registry.get_shadow_model_version.return_value = None
        registry.is_shadow_mode_enabled.return_value = False
        registry.load_model.return_value = {
            "version": "test_model_v1",
            "model_type": "test"
        }
        return registry

    @pytest.fixture  
    def mock_audit(self):
        """Mock audit service for testing."""
        audit = MagicMock()
        return audit

    def test_feature_hash_determinism(self):
        """Test that feature hashing is deterministic and order-insensitive."""
        service = InferenceService()
        
        features1 = {"a": 1, "b": 2, "c": 3}
        features2 = {"c": 3, "a": 1, "b": 2}  # Different order
        features3 = {"a": 1, "b": 2, "c": 4}  # Different values
        
        hash1 = service._compute_feature_hash(features1)
        hash2 = service._compute_feature_hash(features2)
        hash3 = service._compute_feature_hash(features3)
        
        # Same features in different order should produce same hash
        assert hash1 == hash2
        
        # Different feature values should produce different hash
        assert hash1 != hash3

    def test_feature_hash_format(self):
        """Test that feature hash has expected format."""
        service = InferenceService()
        features = {"test": 123}
        
        feature_hash = service._compute_feature_hash(features)
        
        # Should be 16-character hex string (truncated SHA256)
        assert len(feature_hash) == 16
        assert all(c in '0123456789abcdef' for c in feature_hash)

    @pytest.mark.asyncio
    async def test_primary_inference_returns_prediction(self, mock_registry, mock_audit):
        """Test that primary inference returns valid prediction result."""
        with patch('backend.services.inference_service.get_model_registry', return_value=mock_registry), \
             patch('backend.services.inference_service.get_inference_audit', return_value=mock_audit):
            
            service = InferenceService()
            features = {"feature1": 1.0, "feature2": 2.0}
            
            result = await service.run_inference("test_model_v1", features)
            
            assert isinstance(result, PredictionResult)
            assert 0.0 <= result.prediction <= 1.0
            assert 0.0 <= result.confidence <= 1.0
            assert result.model_version == "test_model_v1"
            assert result.request_id is not None
            assert result.latency_ms > 0
            assert result.feature_hash is not None
            assert result.status == "success"
            
            # Should not have shadow data in single model mode
            assert result.shadow_version is None
            assert result.shadow_prediction is None
            assert result.shadow_diff is None

    @pytest.mark.asyncio
    async def test_shadow_inference_included_when_configured(self, mock_audit):
        """Test that shadow inference runs when shadow mode is enabled."""
        # Mock registry with shadow mode enabled
        mock_registry = MagicMock()
        mock_registry.get_active_model_version.return_value = "active_v1"
        mock_registry.get_shadow_model_version.return_value = "shadow_v2"
        mock_registry.is_shadow_mode_enabled.return_value = True
        mock_registry.load_model.side_effect = lambda v: {"version": v, "model_type": "test"}
        
        with patch('backend.services.inference_service.get_model_registry', return_value=mock_registry), \
             patch('backend.services.inference_service.get_inference_audit', return_value=mock_audit):
            
            service = InferenceService()
            features = {"feature1": 1.0, "feature2": 2.0}
            
            result = await service.run_inference("active_v1", features)
            
            # Should have shadow data
            assert result.shadow_version == "shadow_v2"
            assert result.shadow_prediction is not None
            assert result.shadow_diff is not None
            assert result.shadow_latency_ms is not None
            assert result.shadow_diff == abs(result.prediction - result.shadow_prediction)

    @pytest.mark.asyncio
    async def test_shadow_inference_failure_does_not_fail_primary(self, mock_audit):
        """Test that shadow inference failure doesn't affect primary inference."""
        # Mock registry with shadow mode
        mock_registry = MagicMock()
        mock_registry.get_active_model_version.return_value = "active_v1"
        mock_registry.get_shadow_model_version.return_value = "shadow_v2"
        mock_registry.is_shadow_mode_enabled.return_value = True
        
        # Make shadow model load fail
        def load_model_side_effect(version):
            if version == "shadow_v2":
                raise ValueError("Shadow model not found")
            return {"version": version, "model_type": "test"}
        
        mock_registry.load_model.side_effect = load_model_side_effect
        
        with patch('backend.services.inference_service.get_model_registry', return_value=mock_registry), \
             patch('backend.services.inference_service.get_inference_audit', return_value=mock_audit):
            
            service = InferenceService()
            features = {"feature1": 1.0}
            
            # Primary inference should still succeed
            result = await service.run_inference("active_v1", features)
            
            assert result.status == "success"
            assert result.prediction is not None
            
            # Shadow data should be None due to failure
            assert result.shadow_version is None
            assert result.shadow_prediction is None
            assert result.shadow_diff is None

    @pytest.mark.asyncio  
    async def test_audit_recording(self, mock_registry):
        """Test that inference results are recorded in audit system."""
        mock_audit = MagicMock()
        
        with patch('backend.services.inference_service.get_model_registry', return_value=mock_registry), \
             patch('backend.services.inference_service.get_inference_audit', return_value=mock_audit):
            
            service = InferenceService()
            features = {"feature1": 1.0}
            
            await service.run_inference("test_model_v1", features)
            
            # Verify audit service was called
            mock_audit.record_inference.assert_called_once()
            
            # Get the recorded result
            recorded_result = mock_audit.record_inference.call_args[0][0]
            assert recorded_result.model_version == "test_model_v1"
            assert recorded_result.status == "success"


class TestFeatureHashDeterminism:
    """Dedicated tests for feature hash determinism requirements."""
    
    def test_same_features_same_hash(self):
        """Test that identical feature dictionaries produce identical hashes."""
        features = {"feature_a": 1.5, "feature_b": "test", "feature_c": True}
        
        # Create hash multiple times
        hashes = []
        for _ in range(5):
            canonical_json = json.dumps(features, sort_keys=True, separators=(',', ':'))
            hash_value = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()[:16]
            hashes.append(hash_value)
        
        # All hashes should be identical
        assert len(set(hashes)) == 1

    def test_order_insensitive_hashing(self):
        """Test that feature order doesn't affect hash."""
        features1 = {"a": 1, "b": 2, "c": 3}
        features2 = {"c": 3, "b": 2, "a": 1}
        features3 = {"b": 2, "a": 1, "c": 3}
        
        hashes = []
        for features in [features1, features2, features3]:
            canonical_json = json.dumps(features, sort_keys=True, separators=(',', ':'))
            hash_value = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()[:16]
            hashes.append(hash_value)
        
        # All hashes should be identical despite different order
        assert len(set(hashes)) == 1

    def test_different_values_different_hash(self):
        """Test that different feature values produce different hashes."""
        features1 = {"feature": 1.0}
        features2 = {"feature": 2.0}
        
        canonical_json1 = json.dumps(features1, sort_keys=True, separators=(',', ':'))
        hash1 = hashlib.sha256(canonical_json1.encode('utf-8')).hexdigest()[:16]
        
        canonical_json2 = json.dumps(features2, sort_keys=True, separators=(',', ':'))
        hash2 = hashlib.sha256(canonical_json2.encode('utf-8')).hexdigest()[:16]
        
        assert hash1 != hash2

    def test_large_feature_set_hashing(self):
        """Test hashing with large feature sets."""
        # Create large feature dictionary
        large_features = {f"feature_{i}": i * 0.1 for i in range(1000)}
        
        canonical_json = json.dumps(large_features, sort_keys=True, separators=(',', ':'))
        hash_value = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()[:16]
        
        # Should produce valid 16-character hash
        assert len(hash_value) == 16
        assert all(c in '0123456789abcdef' for c in hash_value)