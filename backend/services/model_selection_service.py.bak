"""
Model Selection Feature Flag Integration
Provides intelligent model selection based on feature flags, A/B testing, and performance metrics
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

from backend.feature_flags import FeatureFlags, UserContext
from backend.services.model_registry_service import get_model_registry_service, ModelStatus
from backend.services.unified_logging import unified_logging
from backend.services.unified_cache_service import unified_cache_service


logger = logging.getLogger("model_selection")


@dataclass
class ModelSelectionCriteria:
    """Criteria for model selection"""
    sport: str
    user_context: UserContext
    performance_threshold: float = 0.8  # Minimum success rate
    max_latency_ms: float = 2000.0  # Maximum acceptable latency
    prefer_stable: bool = True  # Prefer stable models over canary
    enable_ab_testing: bool = True  # Allow A/B testing
    fallback_enabled: bool = True  # Enable fallback to backup models


@dataclass
class ModelSelectionResult:
    """Result of model selection process"""
    selected_model_id: str
    model_name: str
    model_version: str
    model_status: str
    selection_reason: str
    confidence_score: float
    feature_flag_used: Optional[str] = None
    ab_test_group: Optional[str] = None
    fallback_used: bool = False
    alternative_models: List[str] = field(default_factory=list)


class ModelSelectionService:
    """Intelligent model selection service with feature flag integration"""
    
    def __init__(self):
        self.registry = get_model_registry_service()
        self.feature_flags = FeatureFlags.get_instance()
        
        # Model selection cache
        self._selection_cache: Dict[str, Tuple[ModelSelectionResult, datetime]] = {}
        self._cache_ttl = timedelta(minutes=5)  # Cache selections for 5 minutes
        
        # Initialize default model selection features
        self._initialize_default_features()
    
    def _initialize_default_features(self):
        """Initialize default feature flags for model selection"""
        try:
            from backend.feature_flags import Feature
            
            # Feature for enabling canary model testing
            canary_feature = Feature(
                id="model_canary_testing",
                name="Model Canary Testing",
                description="Enable canary model deployment for A/B testing",
                enabled=True,
                rollout_percentage=20.0,  # 20% of users get canary models
                dependencies=[],
                tags=["model_selection", "ab_testing", "canary"],
                metadata={
                    "created_by": "model_selection_service",
                    "purpose": "gradual_rollout"
                }
            )
            
            # Feature for performance-based model selection
            performance_feature = Feature(
                id="performance_based_selection",
                name="Performance-Based Model Selection",
                description="Use performance metrics for intelligent model selection",
                enabled=True,
                rollout_percentage=100.0,  # Everyone gets performance-based selection
                dependencies=[],
                tags=["model_selection", "performance", "optimization"],
                metadata={
                    "created_by": "model_selection_service",
                    "performance_weight": 0.7,
                    "latency_weight": 0.3
                }
            )
            
            # Feature for fallback model selection
            fallback_feature = Feature(
                id="model_fallback_system",
                name="Model Fallback System",
                description="Automatic fallback to backup models on failure",
                enabled=True,
                rollout_percentage=100.0,
                dependencies=[],
                tags=["model_selection", "fallback", "reliability"],
                metadata={
                    "created_by": "model_selection_service",
                    "fallback_chain_length": 3
                }
            )
            
            # Register features
            try:
                self.feature_flags.register_feature(canary_feature)
                logger.info("✅ Registered canary testing feature flag")
            except ValueError:
                pass  # Feature already exists
            
            try:
                self.feature_flags.register_feature(performance_feature)
                logger.info("✅ Registered performance-based selection feature flag")
            except ValueError:
                pass  # Feature already exists
            
            try:
                self.feature_flags.register_feature(fallback_feature)
                logger.info("✅ Registered model fallback feature flag")
            except ValueError:
                pass  # Feature already exists
                
        except Exception as e:
            logger.warning(f"Could not initialize default features: {e}")
    
    async def select_best_model(self, criteria: ModelSelectionCriteria) -> ModelSelectionResult:
        """Select the best model based on criteria and feature flags"""
        # Check cache first
        cache_key = self._generate_cache_key(criteria)
        cached_result = await self._get_cached_selection(cache_key)
        if cached_result:
            logger.info(f"Using cached model selection for {criteria.sport}")
            return cached_result
        
        try:
            # Get candidate models
            candidate_models = self._get_candidate_models(criteria.sport)
            
            if not candidate_models:
                raise ValueError(f"No models available for sport {criteria.sport}")
            
            # Apply feature flag filtering
            filtered_models = await self._apply_feature_flag_filtering(candidate_models, criteria)
            
            # Apply performance filtering
            performance_models = await self._apply_performance_filtering(filtered_models, criteria)
            
            # Select best model using scoring algorithm
            selected_model, selection_reason, confidence = await self._score_and_select_model(
                performance_models, criteria
            )
            
            # Create result
            result = ModelSelectionResult(
                selected_model_id=selected_model.model_id,
                model_name=selected_model.name,
                model_version=selected_model.version,
                model_status=selected_model.status.value,
                selection_reason=selection_reason,
                confidence_score=confidence,
                alternative_models=[m.model_id for m in performance_models if m.model_id != selected_model.model_id]
            )
            
            # Check if this was an A/B test selection
            if selected_model.status == ModelStatus.CANARY:
                result.ab_test_group = "canary"
                result.feature_flag_used = "model_canary_testing"
            elif selected_model.status == ModelStatus.STABLE:
                result.ab_test_group = "stable"
            
            # Cache the result
            await self._cache_selection(cache_key, result)
            
            logger.info(f"Selected model {result.selected_model_id} for {criteria.sport} (reason: {selection_reason})")
            
            return result
            
        except Exception as e:
            logger.error(f"Model selection failed: {e}")
            
            # Try fallback selection if enabled
            if criteria.fallback_enabled:
                return await self._fallback_selection(criteria, str(e))
            else:
                raise
    
    def _get_candidate_models(self, sport: str) -> List[Any]:
        """Get candidate models for a sport"""
        # Get all models for the sport that are not retired
        models = self.registry.list_models(sport=sport)
        return [m for m in models if m.status != ModelStatus.RETIRED]
    
    async def _apply_feature_flag_filtering(self, models: List[Any], criteria: ModelSelectionCriteria) -> List[Any]:
        """Filter models based on feature flags"""
        if not criteria.enable_ab_testing:
            # Only return stable models if A/B testing is disabled
            return [m for m in models if m.status == ModelStatus.STABLE]
        
        # Check if user is eligible for canary testing
        canary_enabled = self.feature_flags.is_feature_enabled("model_canary_testing", criteria.user_context)
        
        if canary_enabled:
            # User can get canary models - return all active models
            return [m for m in models if m.status in [ModelStatus.STABLE, ModelStatus.CANARY]]
        else:
            # User only gets stable models
            return [m for m in models if m.status == ModelStatus.STABLE]
    
    async def _apply_performance_filtering(self, models: List[Any], criteria: ModelSelectionCriteria) -> List[Any]:
        """Filter models based on performance criteria"""
        performance_based = self.feature_flags.is_feature_enabled(
            "performance_based_selection", 
            criteria.user_context
        )
        
        if not performance_based:
            # Return models as-is if performance-based selection is disabled
            return models
        
        filtered_models = []
        
        for model in models:
            # Get performance metrics
            metrics = self.registry.get_performance_metrics(model.model_id)
            
            if not metrics or metrics.total_inferences < 10:
                # Include models with insufficient data (benefit of doubt)
                filtered_models.append(model)
                continue
            
            # Calculate success rate
            success_rate = metrics.successful_inferences / metrics.total_inferences
            
            # Calculate average latency
            avg_latency = (
                metrics.total_inference_time_ms / metrics.successful_inferences
                if metrics.successful_inferences > 0 else float('inf')
            )
            
            # Apply performance thresholds
            if success_rate >= criteria.performance_threshold and avg_latency <= criteria.max_latency_ms:
                filtered_models.append(model)
        
        return filtered_models
    
    async def _score_and_select_model(self, models: List[Any], criteria: ModelSelectionCriteria) -> Tuple[Any, str, float]:
        """Score models and select the best one"""
        if len(models) == 1:
            return models[0], "only_available_model", 1.0
        
        scores = {}
        
        for model in models:
            score = 0.0
            metrics = self.registry.get_performance_metrics(model.model_id)
            
            # Base score from status
            if model.status == ModelStatus.STABLE:
                score += 0.3
            elif model.status == ModelStatus.CANARY:
                score += 0.2
            
            # Performance score
            if metrics and metrics.total_inferences >= 10:
                success_rate = metrics.successful_inferences / metrics.total_inferences
                score += success_rate * 0.4
                
                # Latency score (inverse - lower latency is better)
                avg_latency = metrics.total_inference_time_ms / metrics.successful_inferences
                latency_score = max(0, 1 - (avg_latency / criteria.max_latency_ms))
                score += latency_score * 0.3
            else:
                # Give new models a moderate score
                score += 0.3
            
            scores[model.model_id] = score
        
        # Select model with highest score
        best_model_id = max(scores.keys(), key=lambda k: scores[k])
        best_model = next(m for m in models if m.model_id == best_model_id)
        best_score = scores[best_model_id]
        
        # Determine selection reason
        reason = "highest_performance_score"
        if best_model.status == ModelStatus.CANARY:
            reason = "canary_ab_testing"
        elif len([m for m in models if m.status == ModelStatus.STABLE]) == 1:
            reason = "only_stable_model"
        
        return best_model, reason, best_score
    
    async def _fallback_selection(self, criteria: ModelSelectionCriteria, error: str) -> ModelSelectionResult:
        """Fallback model selection when primary selection fails"""
        logger.warning(f"Using fallback model selection due to error: {error}")
        
        # Get any stable model for the sport
        stable_models = self.registry.list_models(sport=criteria.sport, status=ModelStatus.STABLE)
        
        if stable_models:
            fallback_model = stable_models[0]  # Use first stable model
            
            return ModelSelectionResult(
                selected_model_id=fallback_model.model_id,
                model_name=fallback_model.name,
                model_version=fallback_model.version,
                model_status=fallback_model.status.value,
                selection_reason=f"fallback_selection_due_to_error",
                confidence_score=0.5,  # Lower confidence for fallback
                fallback_used=True
            )
        else:
            # No stable models available - try any model
            any_models = self.registry.list_models(sport=criteria.sport)
            active_models = [m for m in any_models if m.status != ModelStatus.RETIRED]
            
            if active_models:
                fallback_model = active_models[0]
                
                return ModelSelectionResult(
                    selected_model_id=fallback_model.model_id,
                    model_name=fallback_model.name,
                    model_version=fallback_model.version,
                    model_status=fallback_model.status.value,
                    selection_reason=f"emergency_fallback_selection",
                    confidence_score=0.3,  # Very low confidence for emergency fallback
                    fallback_used=True
                )
            else:
                raise ValueError(f"No models available for fallback selection in sport {criteria.sport}")
    
    def _generate_cache_key(self, criteria: ModelSelectionCriteria) -> str:
        """Generate cache key for model selection"""
        return f"model_selection:{criteria.sport}:{criteria.user_context.user_id}:{criteria.prefer_stable}"
    
    async def _get_cached_selection(self, cache_key: str) -> Optional[ModelSelectionResult]:
        """Get cached model selection if still valid"""
        if cache_key in self._selection_cache:
            result, timestamp = self._selection_cache[cache_key]
            if datetime.utcnow() - timestamp < self._cache_ttl:
                return result
            else:
                # Remove expired cache entry
                del self._selection_cache[cache_key]
        return None
    
    async def _cache_selection(self, cache_key: str, result: ModelSelectionResult):
        """Cache model selection result"""
        self._selection_cache[cache_key] = (result, datetime.utcnow())
        
        # Clean up old cache entries periodically
        if len(self._selection_cache) > 1000:
            await self._cleanup_cache()
    
    async def _cleanup_cache(self):
        """Clean up expired cache entries"""
        cutoff_time = datetime.utcnow() - self._cache_ttl
        expired_keys = [
            key for key, (_, timestamp) in self._selection_cache.items()
            if timestamp < cutoff_time
        ]
        
        for key in expired_keys:
            del self._selection_cache[key]
        
        logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
    
    async def get_model_selection_stats(self, sport: Optional[str] = None, days: int = 7) -> Dict[str, Any]:
        """Get model selection statistics for analysis"""
        try:
            models = self.registry.list_models(sport=sport) if sport else self.registry.list_models()
            
            # Count models by status
            status_counts = {}
            for model in models:
                status = model.status.value if hasattr(model.status, 'value') else str(model.status)
                status_counts[status] = status_counts.get(status, 0) + 1
            
            # Get performance summary
            total_inferences = 0
            total_success = 0
            total_failures = 0
            
            for model in models:
                metrics = self.registry.get_performance_metrics(model.model_id)
                if metrics:
                    total_inferences += metrics.total_inferences
                    total_success += metrics.successful_inferences
                    total_failures += metrics.failed_inferences
            
            overall_success_rate = (total_success / total_inferences * 100) if total_inferences > 0 else 0
            
            return {
                "sport": sport or "all",
                "period_days": days,
                "model_counts": status_counts,
                "total_models": len(models),
                "performance_summary": {
                    "total_inferences": total_inferences,
                    "successful_inferences": total_success,
                    "failed_inferences": total_failures,
                    "overall_success_rate": round(overall_success_rate, 2)
                },
                "feature_flags": {
                    "canary_testing_enabled": True,
                    "performance_based_selection_enabled": True,
                    "fallback_system_enabled": True
                },
                "cache_stats": {
                    "cached_selections": len(self._selection_cache),
                    "cache_ttl_minutes": self._cache_ttl.total_seconds() / 60
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get model selection stats: {e}")
            return {"error": str(e)}
    
    def create_user_context(self, user_id: str, user_groups: Optional[List[str]] = None, attributes: Optional[Dict[str, Any]] = None) -> UserContext:
        """Helper method to create user context for model selection"""
        return UserContext(
            user_id=user_id,
            user_groups=user_groups or [],
            attributes=attributes or {}
        )


# Global singleton instance
_model_selection_service = None


def get_model_selection_service() -> ModelSelectionService:
    """Get global model selection service instance"""
    global _model_selection_service
    if _model_selection_service is None:
        _model_selection_service = ModelSelectionService()
    return _model_selection_service