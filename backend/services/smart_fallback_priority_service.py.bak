"""
Smart Fallback Priority Service

Implements intelligent fallback logic for stale primary data sources using 
confidence scores and circuit breaker states to automatically select the 
best available provider.

Key Features:
- Provider priority ordering based on confidence scores
- Automatic fallback when primary sources become stale
- Circuit breaker integration for provider health awareness
- Real-time provider selection with performance tracking
- Intelligent refresh strategies based on data freshness
- Comprehensive fallback analytics and monitoring
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union, Callable, cast

from .provider_confidence_integration import (
    ProviderConfidenceIntegration, 
    ProviderSelectionResult,
    ConfidenceLevel
)
from .provider_resilience_manager import ProviderResilienceManager, ProviderState, CircuitBreakerState
# Enhanced statistics manager will be accessed through confidence integration
# from .enhanced_provider_statistics_manager import EnhancedProviderStatisticsManager


class FallbackReason(Enum):
    """Reasons for triggering fallback"""
    STALE_DATA = "stale_data"
    PRIMARY_FAILED = "primary_failed"
    CIRCUIT_BREAKER_OPEN = "circuit_breaker_open"
    LOW_CONFIDENCE = "low_confidence"
    TIMEOUT = "timeout"
    MANUAL_OVERRIDE = "manual_override"


class FallbackStrategy(Enum):
    """Different fallback strategies"""
    BEST_AVAILABLE = "best_available"  # Select highest confidence provider
    ROUND_ROBIN = "round_robin"        # Cycle through healthy providers
    WEIGHTED_SELECTION = "weighted_selection"  # Probability-based on confidence
    MANUAL_ORDER = "manual_order"      # Follow manually specified order


@dataclass
class FallbackConfiguration:
    """Configuration for fallback behavior"""
    max_staleness_seconds: int = 300  # 5 minutes
    min_confidence_threshold: float = 0.3  # Minimum acceptable confidence
    max_fallback_attempts: int = 3
    fallback_timeout_seconds: int = 30
    strategy: FallbackStrategy = FallbackStrategy.BEST_AVAILABLE
    primary_provider_priority_boost: float = 0.1  # Boost for primary when healthy
    enable_circuit_breaker_fallback: bool = True
    enable_performance_fallback: bool = True
    manual_provider_order: Optional[List[str]] = None


@dataclass
class FallbackEvent:
    """Record of a fallback event"""
    timestamp: float
    original_provider: str
    fallback_provider: str
    reason: FallbackReason
    confidence_score: float
    latency_ms: float
    success: bool
    error_message: Optional[str] = None


@dataclass
class ProviderPriority:
    """Provider priority information"""
    provider_id: str
    priority_score: float
    confidence_score: float
    is_primary: bool
    circuit_state: CircuitBreakerState
    last_successful_request: float
    estimated_latency_ms: float
    staleness_seconds: float


class SmartFallbackPriorityService:
    """
    Service for intelligent provider fallback and priority management.
    
    Uses confidence scoring and circuit breaker states to automatically
    select the best available provider when primary sources fail or
    become stale.
    """
    
    def __init__(self, config: Optional[FallbackConfiguration] = None):
        self.config = config or FallbackConfiguration()
        self.logger = logging.getLogger("smart_fallback")
        
        # Initialize dependency services
        self.confidence_integration = ProviderConfidenceIntegration()
        self.resilience_manager = ProviderResilienceManager()
        # Statistics accessed through confidence integration
        # self.statistics_manager = EnhancedProviderStatisticsManager()
        
        # Fallback tracking
        self.fallback_history: List[FallbackEvent] = []
        self.active_fallbacks: Dict[str, str] = {}  # context -> provider_id
        self.primary_providers: Dict[str, str] = {}  # context -> primary_provider_id
        
        # Performance tracking
        self.fallback_performance = {
            "total_fallbacks": 0,
            "successful_fallbacks": 0,
            "failed_fallbacks": 0,
            "average_fallback_latency_ms": 0.0,
            "fallback_rate_per_hour": 0.0,
            "most_reliable_fallback": None
        }
        
        # Caching for provider priorities
        self.priority_cache: Dict[str, Tuple[List[ProviderPriority], float]] = {}
        self.priority_cache_ttl = 60  # 1 minute cache

        # Strategy state trackers
        self.round_robin_counters: Dict[str, int] = {}
        
        self.logger.info("Smart Fallback Priority Service initialized")
    
    async def set_primary_provider(self, context: str, provider_id: str) -> None:
        """Set the primary provider for a given context"""
        self.primary_providers[context] = provider_id
        self.logger.info(f"Set primary provider for {context}: {provider_id}")
    
    async def get_provider_priorities(
        self,
        context: str,
        available_providers: List[str],
        force_refresh: bool = False,
    ) -> List[ProviderPriority]:
        """
        Get provider priorities for fallback decision making.

        Returns providers ordered by priority (highest first).
        """
        cache_key = f"{context}:{':'.join(sorted(available_providers))}"
        current_time = time.time()

        # Check cache unless force refresh
        if not force_refresh and cache_key in self.priority_cache:
            priorities, cached_time = self.priority_cache[cache_key]
            if current_time - cached_time < self.priority_cache_ttl:
                return priorities
        
        priorities = []
        primary_provider = self.primary_providers.get(context)
        
        for provider_id in available_providers:
            try:
                # Get confidence score
                confidence_score = await self.confidence_integration.get_provider_confidence_score(provider_id)
                
                # Get circuit breaker state
                resilience_metrics = self.resilience_manager.provider_metrics.get(provider_id)
                circuit_state = resilience_metrics.circuit_state if resilience_metrics else CircuitBreakerState.CLOSED
                
                # Get enhanced statistics through confidence integration
                enhanced_metrics = self.confidence_integration.statistics_manager.provider_metrics.get(provider_id)
                last_successful = 0.0
                if enhanced_metrics:
                    last_epoch = self._to_epoch_seconds(getattr(enhanced_metrics, "last_request_time", None))
                    if last_epoch is not None:
                        last_successful = last_epoch
                
                # Calculate representative latency with fallbacks for different percentile providers.
                estimated_latency = self._resolve_latency_ms(enhanced_metrics)
                
                # Calculate staleness with null check
                staleness = self._calculate_staleness_seconds(enhanced_metrics, current_time)
                
                # Calculate priority score
                priority_score = self._calculate_priority_score(
                    confidence_score.adjusted_confidence,
                    circuit_state,
                    provider_id == primary_provider,
                    staleness
                )
                
                priorities.append(ProviderPriority(
                    provider_id=provider_id,
                    priority_score=priority_score,
                    confidence_score=confidence_score.adjusted_confidence,
                    is_primary=provider_id == primary_provider,
                    circuit_state=circuit_state,
                    last_successful_request=last_successful,
                    estimated_latency_ms=estimated_latency,
                    staleness_seconds=staleness
                ))
                
            except Exception as e:
                self.logger.error(f"Error calculating priority for {provider_id}: {e}")
                # Add with low priority as fallback
                priorities.append(ProviderPriority(
                    provider_id=provider_id,
                    priority_score=0.1,
                    confidence_score=0.1,
                    is_primary=provider_id == primary_provider,
                    circuit_state=CircuitBreakerState.OPEN,
                    last_successful_request=0,
                    estimated_latency_ms=5000,
                    staleness_seconds=float('inf')
                ))
        
        if (
            self.config.strategy == FallbackStrategy.MANUAL_ORDER
            and self.config.manual_provider_order
        ):
            manual_rank = {
                provider_id: idx
                for idx, provider_id in enumerate(self.config.manual_provider_order)
            }
            priorities.sort(
                key=lambda p: manual_rank.get(p.provider_id, len(manual_rank))
            )
        else:
            priorities.sort(key=lambda p: p.priority_score, reverse=True)
        
        # Cache the result
        self.priority_cache[cache_key] = (priorities, current_time)
        
        return priorities
    
    def _calculate_priority_score(
        self, 
        confidence_score: float, 
        circuit_state: CircuitBreakerState,
        is_primary: bool, 
        staleness_seconds: float
    ) -> float:
        """Calculate priority score for provider selection"""
        base_score = confidence_score
        
        # Primary provider boost when healthy
        if is_primary and circuit_state == CircuitBreakerState.CLOSED:
            base_score += self.config.primary_provider_priority_boost
        
        # Penalize stale data
        if staleness_seconds > self.config.max_staleness_seconds:
            staleness_penalty = min(0.5, staleness_seconds / (2 * self.config.max_staleness_seconds))
            base_score *= (1 - staleness_penalty)
        
        # Circuit breaker penalties
        if circuit_state == CircuitBreakerState.OPEN:
            base_score *= 0.2  # 80% penalty for open circuit
        elif circuit_state == CircuitBreakerState.HALF_OPEN:
            base_score *= 0.6  # 40% penalty for half-open circuit
        
        return max(0.0, min(1.0, base_score))
    
    async def select_optimal_provider(
        self, 
        context: str, 
        available_providers: List[str],
        current_provider: Optional[str] = None
    ) -> Tuple[str, Optional[FallbackReason]]:
        """
        Select the optimal provider based on current conditions.
        
        Returns the selected provider ID and reason for selection/fallback.
        """
        if not available_providers:
            raise ValueError("No providers available for selection")
        
        priorities = await self.get_provider_priorities(context, available_providers)
        primary_provider = self.primary_providers.get(context)
        
        # Check if current provider needs fallback
        fallback_reason = None
        if current_provider:
            current_priority = next((p for p in priorities if p.provider_id == current_provider), None)
            if current_priority:
                fallback_reason = self._should_trigger_fallback(current_priority)
        elif primary_provider:
            # Check if primary provider needs fallback even when no current provider is specified
            primary_priority = next((p for p in priorities if p.provider_id == primary_provider), None)
            if primary_priority:
                fallback_reason = self._should_trigger_fallback(primary_priority)
        
        # Select provider based on strategy
        if self.config.strategy == FallbackStrategy.BEST_AVAILABLE:
            selected_provider = priorities[0].provider_id
        elif self.config.strategy == FallbackStrategy.MANUAL_ORDER and self.config.manual_provider_order:
            # Use manual order for selection
            for provider_id in self.config.manual_provider_order:
                if provider_id in available_providers:
                    selected_provider = provider_id
                    break
            else:
                # Fallback to best available if manual order fails
                selected_provider = priorities[0].provider_id
        elif self.config.strategy == FallbackStrategy.ROUND_ROBIN:
            counter = self.round_robin_counters.get(context, 0)
            selected_provider = priorities[counter % len(priorities)].provider_id
            self.round_robin_counters[context] = (counter + 1) % len(priorities)
        else:
            # Default to best available
            selected_provider = priorities[0].provider_id
        
        # Determine the reason
        if not fallback_reason:
            if current_provider and selected_provider != current_provider:
                fallback_reason = FallbackReason.LOW_CONFIDENCE
            elif not current_provider and selected_provider != primary_provider:
                fallback_reason = FallbackReason.PRIMARY_FAILED
        
        # Record fallback event if applicable
        if fallback_reason and (current_provider or primary_provider):
            original_provider = current_provider or primary_provider
            if original_provider and original_provider != selected_provider:
                event = FallbackEvent(
                    timestamp=time.time(),
                    original_provider=original_provider,
                    fallback_provider=selected_provider,
                    reason=fallback_reason,
                    confidence_score=await self._get_provider_confidence(selected_provider),
                    latency_ms=0.0,  # Not applicable for selection
                    success=True
                )
                self._record_fallback_success(event)
        
        return selected_provider, fallback_reason
    
    def _should_trigger_fallback(self, provider_priority: ProviderPriority) -> Optional[FallbackReason]:
        """Check if fallback should be triggered for the given provider"""
        
        # Check circuit breaker state
        if self.config.enable_circuit_breaker_fallback and provider_priority.circuit_state == CircuitBreakerState.OPEN:
            return FallbackReason.CIRCUIT_BREAKER_OPEN
        
        # Check confidence threshold
        if provider_priority.confidence_score < self.config.min_confidence_threshold:
            return FallbackReason.LOW_CONFIDENCE
        
        # Check data staleness
        if provider_priority.staleness_seconds > self.config.max_staleness_seconds:
            return FallbackReason.STALE_DATA
        
        return None
    
    async def execute_with_fallback(
        self,
        context: str,
        operation: Callable,
        available_providers: List[str],
        current_provider: Optional[str] = None,
        operation_args: Optional[Dict[str, Any]] = None
    ) -> Tuple[Any, str, List[FallbackEvent]]:
        """
        Execute an operation with automatic fallback on failure.
        
        Returns: (result, selected_provider, fallback_events)
        """
        # Allow positional arguments in legacy order (context, providers, operation).
        if isinstance(operation, list) and callable(available_providers):
            operation, available_providers = available_providers, operation

        operation = cast(Callable, operation)
        available_providers = list(available_providers)

        operation_args = operation_args or {}
        fallback_events = []
        attempts = 0

        # Get initial provider
        selected_provider, fallback_reason = await self.select_optimal_provider(
            context, available_providers, current_provider
        )
        
        while attempts < self.config.max_fallback_attempts:
            start_time = time.time()
            
            try:
                # Execute operation with selected provider
                result = await asyncio.wait_for(
                    operation(selected_provider, **operation_args),
                    timeout=self.config.fallback_timeout_seconds
                )
                
                latency_ms = (time.time() - start_time) * 1000
                
                # Record successful operation
                if fallback_reason:
                    event = FallbackEvent(
                        timestamp=start_time,
                        original_provider=current_provider or "unknown",
                        fallback_provider=selected_provider,
                        reason=fallback_reason,
                        confidence_score=await self._get_provider_confidence(selected_provider),
                        latency_ms=latency_ms,
                        success=True
                    )
                    fallback_events.append(event)
                    self._record_fallback_success(event)
                
                return result, selected_provider, fallback_events
                
            except asyncio.TimeoutError:
                latency_ms = self.config.fallback_timeout_seconds * 1000
                error_message = f"Operation timeout after {self.config.fallback_timeout_seconds}s"
                fallback_reason = FallbackReason.TIMEOUT
                
            except Exception as e:
                latency_ms = (time.time() - start_time) * 1000
                error_message = str(e)
                fallback_reason = FallbackReason.PRIMARY_FAILED
            
            # Record failed attempt
            event = FallbackEvent(
                timestamp=start_time,
                original_provider=current_provider or "unknown",
                fallback_provider=selected_provider,
                reason=fallback_reason,
                confidence_score=await self._get_provider_confidence(selected_provider),
                latency_ms=latency_ms,
                success=False,
                error_message=error_message
            )
            fallback_events.append(event)
            self._record_fallback_failure(event)
            
            attempts += 1
            
            # Try next best provider
            if attempts < self.config.max_fallback_attempts:
                priorities = await self.get_provider_priorities(context, available_providers, force_refresh=True)
                # Remove failed providers from consideration
                failed_providers = {event.fallback_provider for event in fallback_events if not event.success}
                remaining_priorities = [p for p in priorities if p.provider_id not in failed_providers]
                
                if remaining_priorities:
                    selected_provider = remaining_priorities[0].provider_id
                    current_provider = selected_provider
                else:
                    break
        
        # All attempts failed
        raise Exception(f"All fallback attempts failed for context '{context}'. Events: {fallback_events}")
    
    async def _get_provider_confidence(self, provider_id: str) -> float:
        """Get confidence score for a provider"""
        try:
            confidence_score = await self.confidence_integration.get_provider_confidence_score(provider_id)
            return confidence_score.adjusted_confidence
        except Exception:
            return 0.0
    
    def _record_fallback_success(self, event: FallbackEvent) -> None:
        """Record a successful fallback event"""
        self.fallback_history.append(event)
        self.performance_tracking_fallback_success(event)
        
        self.logger.info(
            f"Fallback success: {event.original_provider} -> {event.fallback_provider} "
            f"(reason: {event.reason.value}, latency: {event.latency_ms:.1f}ms)"
        )
    
    def _record_fallback_failure(self, event: FallbackEvent) -> None:
        """Record a failed fallback event"""
        self.fallback_history.append(event)
        self.performance_tracking_fallback_failure(event)
        
        self.logger.warning(
            f"Fallback failure: {event.original_provider} -> {event.fallback_provider} "
            f"(reason: {event.reason.value}, error: {event.error_message})"
        )
    
    def performance_tracking_fallback_success(self, event: FallbackEvent) -> None:
        """Update performance tracking for successful fallback"""
        self.fallback_performance["total_fallbacks"] += 1
        self.fallback_performance["successful_fallbacks"] += 1
        
        # Update average latency
        total_successful = self.fallback_performance["successful_fallbacks"]
        current_avg = self.fallback_performance["average_fallback_latency_ms"]
        self.fallback_performance["average_fallback_latency_ms"] = (
            (current_avg * (total_successful - 1) + event.latency_ms) / total_successful
        )
    
    def performance_tracking_fallback_failure(self, event: FallbackEvent) -> None:
        """Update performance tracking for failed fallback"""
        self.fallback_performance["total_fallbacks"] += 1
        self.fallback_performance["failed_fallbacks"] += 1
    
    def get_fallback_analytics(self) -> Dict[str, Any]:
        """Get comprehensive fallback analytics"""
        recent_events = [e for e in self.fallback_history if time.time() - e.timestamp < 3600]  # Last hour
        
        analytics = {
            "performance": self.fallback_performance.copy(),
            "recent_hour": {
                "total_fallbacks": len(recent_events),
                "success_rate": len([e for e in recent_events if e.success]) / max(len(recent_events), 1) * 100,
                "most_common_reason": self._get_most_common_reason(recent_events),
                "average_latency_ms": sum(e.latency_ms for e in recent_events) / max(len(recent_events), 1)
            },
            "provider_reliability": self._calculate_provider_reliability(),
            "active_fallbacks": len(self.active_fallbacks),
            "cache_hit_rate": self._calculate_cache_hit_rate()
        }

        performance = analytics["performance"]
        performance.setdefault(
            "average_fallback_time_ms",
            performance.get("average_fallback_latency_ms", 0.0),
        )
        
        return analytics
    
    def _get_most_common_reason(self, events: List[FallbackEvent]) -> str:
        """Get the most common fallback reason from events"""
        if not events:
            return "none"
        
        reason_counts = {}
        for event in events:
            reason = event.reason.value
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
        
        return max(reason_counts, key=lambda k: reason_counts[k])
    
    def _calculate_provider_reliability(self) -> Dict[str, float]:
        """Calculate reliability score for each provider based on fallback history"""
        provider_stats = {}
        
        for event in self.fallback_history[-1000:]:  # Last 1000 events
            provider = event.fallback_provider
            if provider not in provider_stats:
                provider_stats[provider] = {"success": 0, "total": 0}
            
            provider_stats[provider]["total"] += 1
            if event.success:
                provider_stats[provider]["success"] += 1
        
        return {
            provider: stats["success"] / stats["total"] 
            for provider, stats in provider_stats.items() 
            if stats["total"] > 0
        }
    
    def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate for priority calculations"""
        # Simple cache hit rate based on cache size
        cache_size = len(self.priority_cache)
        max_cache_size = 100  # Assumed max cache size
        
        return min(cache_size / max_cache_size * 100, 100.0)
    
    async def cleanup_old_data(self, max_age_hours: int = 24) -> None:
        """Clean up old fallback events and cache entries"""
        cutoff_time = time.time() - (max_age_hours * 3600)
        
        # Clean fallback history
        self.fallback_history = [
            event for event in self.fallback_history 
            if event.timestamp > cutoff_time
        ]
        
        # Clean priority cache
        expired_keys = [
            key for key, (_, timestamp) in self.priority_cache.items()
            if timestamp < cutoff_time
        ]
        for key in expired_keys:
            del self.priority_cache[key]
        
        self.logger.info(f"Cleaned up fallback data older than {max_age_hours} hours")

    @staticmethod
    def _to_epoch_seconds(value: Optional[Union[float, int, datetime]]) -> Optional[float]:
        """Normalize supported timestamp representations to epoch seconds."""
        if value is None:
            return None
        if isinstance(value, (float, int)):
            return float(value)
        if isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            return value.timestamp()
        return None

    def _calculate_staleness_seconds(self, metrics: Optional[Any], current_time: float) -> float:
        """Resolve the freshest available timestamp and derive staleness."""
        if not metrics:
            return float("inf")

        candidates: List[float] = []
        for attr in ("last_data_update", "last_request_time", "last_success_time"):
            epoch = self._to_epoch_seconds(getattr(metrics, attr, None))
            if epoch is not None:
                candidates.append(epoch)

        if not candidates:
            return float("inf")

        oldest = min(candidates)
        return max(0.0, current_time - oldest)

    def _resolve_latency_ms(self, metrics: Optional[Any]) -> float:
        """Derive a representative latency from whichever percentile source is available."""
        if not metrics:
            return 100.0

        percentiles = None
        try:
            percentiles = metrics.get_latency_percentiles()
        except AttributeError:
            percentiles = None

        value = self._extract_latency_value(percentiles)
        if value is not None:
            return value

        window = getattr(metrics, "window_5m", None)
        if window and getattr(window, "total_count", 0) > 0:
            window_percentiles = window.get_latency_percentiles()
            value = self._extract_latency_value(window_percentiles)
            if value is not None:
                return value

        return 100.0

    @staticmethod
    def _extract_latency_value(percentiles: Optional[Any]) -> Optional[float]:
        """Normalize percentile outputs (tuple/dict) to a single float if possible."""
        if percentiles is None:
            return None
        if isinstance(percentiles, dict):
            for key in ("p50", "median"):
                if key in percentiles:
                    try:
                        return float(percentiles[key])
                    except (TypeError, ValueError):
                        return None
            # Fallback to first value in dict order
            try:
                first_value = next(iter(percentiles.values()))
                return float(first_value)
            except (StopIteration, TypeError, ValueError):
                return None
        if isinstance(percentiles, (list, tuple)):
            try:
                if len(percentiles) >= 2:
                    return float(percentiles[1])
                if percentiles:
                    return float(percentiles[0])
            except (TypeError, ValueError):
                return None
        if isinstance(percentiles, (int, float)):
            return float(percentiles)
        return None


# Global instance
_smart_fallback_service: Optional[SmartFallbackPriorityService] = None

def get_smart_fallback_service(config: Optional[FallbackConfiguration] = None) -> SmartFallbackPriorityService:
    """Get or create the global smart fallback service instance"""
    global _smart_fallback_service
    if _smart_fallback_service is None:
        _smart_fallback_service = SmartFallbackPriorityService(config)
    return _smart_fallback_service