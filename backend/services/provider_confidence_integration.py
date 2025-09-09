"""
Provider Confidence Scoring Integration

Integrates sophisticated confidence scoring algorithm from enhanced provider statistics
with existing ProviderResilienceManager circuit breaker logic for real-time provider
assessment and enhanced decision making in odds aggregation pipeline.

Key Features:
- Real-time confidence scoring (0-1) integrated with circuit breaker states
- Enhanced provider selection based on confidence + circuit state
- Automated fallback to secondary providers when confidence drops
- Circuit breaker decisions enhanced with confidence thresholds
- Performance-based provider ranking for optimal data source selection
"""

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import statistics

from .provider_resilience_manager import (
    ProviderResilienceManager, 
    ProviderMetrics, 
    CircuitBreakerState,
    ProviderState
)
from .enhanced_provider_statistics import (
    EnhancedProviderStatisticsManager,
    EnhancedProviderMetrics
)


class ConfidenceLevel(Enum):
    """Provider confidence levels for decision making"""
    EXCELLENT = "excellent"  # 0.8-1.0
    GOOD = "good"           # 0.6-0.8  
    FAIR = "fair"           # 0.4-0.6
    POOR = "poor"           # 0.2-0.4
    CRITICAL = "critical"   # 0.0-0.2


@dataclass
class ProviderConfidenceScore:
    """Comprehensive provider confidence assessment"""
    provider_id: str
    confidence_score: float  # 0-1 
    confidence_level: ConfidenceLevel
    circuit_state: CircuitBreakerState
    provider_state: ProviderState
    
    # Detailed scoring breakdown
    success_rate_score: float
    latency_score: float
    freshness_score: float
    reliability_score: float
    consistency_score: float
    
    # Circuit breaker influence
    circuit_penalty: float  # 0-1, applied when circuit open/half-open
    
    # Final adjusted score
    adjusted_confidence: float  # confidence_score * (1 - circuit_penalty)
    
    # Provider selection priority
    selection_priority: int  # 1=highest, higher numbers = lower priority
    
    # Metadata
    last_updated: float = field(default_factory=time.time)
    requires_fallback: bool = False
    fallback_reason: Optional[str] = None


@dataclass
class ProviderSelectionResult:
    """Result of provider selection process"""
    primary_provider: Optional[ProviderConfidenceScore]
    fallback_providers: List[ProviderConfidenceScore]
    selection_reason: str
    total_providers_evaluated: int
    confidence_threshold_used: float


class ProviderConfidenceIntegration:
    """
    Integrates enhanced confidence scoring with circuit breaker logic
    for intelligent provider selection and fallback management.
    """
    
    def __init__(self):
        self.logger = logging.getLogger("provider_confidence_integration")
        
        # Initialize component managers
        self.resilience_manager = ProviderResilienceManager()
        self.statistics_manager = EnhancedProviderStatisticsManager()
        
        # Confidence thresholds for decision making
        self.confidence_thresholds = {
            "primary_provider_min": 0.7,      # Minimum for primary selection
            "fallback_trigger": 0.5,          # Trigger fallback below this
            "circuit_breaker_enhance": 0.3,   # Enhance circuit decisions below this
            "emergency_fallback": 0.2         # Emergency fallback threshold
        }
        
        # Circuit breaker penalties
        self.circuit_penalties = {
            CircuitBreakerState.CLOSED: 0.0,      # No penalty when healthy
            CircuitBreakerState.HALF_OPEN: 0.3,   # 30% penalty during testing
            CircuitBreakerState.OPEN: 0.8         # 80% penalty when failed
        }
        
        # Provider selection weights  
        self.selection_weights = {
            "confidence_score": 0.5,        # Base confidence score
            "circuit_state_factor": 0.3,    # Circuit breaker state influence
            "recent_performance": 0.2       # Recent performance trend
        }
        
        # Internal state
        self.provider_confidence_cache: Dict[str, ProviderConfidenceScore] = {}
        self.cache_ttl_sec = 30  # Cache confidence scores for 30 seconds
        self.selection_history: List[ProviderSelectionResult] = []
        
        self.logger.info("Provider confidence integration initialized with enhanced scoring")
    
    async def get_provider_confidence_score(self, provider_id: str) -> ProviderConfidenceScore:
        """
        Get comprehensive confidence score for a provider combining
        enhanced statistics with circuit breaker state.
        """
        # Check cache first
        if provider_id in self.provider_confidence_cache:
            cached = self.provider_confidence_cache[provider_id]
            if time.time() - cached.last_updated < self.cache_ttl_sec:
                return cached
        
        try:
            # Get enhanced statistics
            enhanced_metrics = self.statistics_manager.provider_metrics.get(provider_id)
            if not enhanced_metrics:
                # Create default metrics if provider not tracked yet
                enhanced_metrics = EnhancedProviderMetrics(provider_id)
            
            # Get circuit breaker state from resilience manager
            resilience_metrics = self.resilience_manager.provider_metrics.get(
                provider_id, 
                ProviderMetrics()
            )
            
            # Calculate comprehensive confidence score
            confidence_score = enhanced_metrics.get_comprehensive_confidence_score()
            
            # Extract detailed scoring components
            recent_success_score = enhanced_metrics.window_5m.success_rate
            
            # Latency scoring
            p95_latency = enhanced_metrics.window_5m.get_latency_percentiles()["p95"]
            if p95_latency <= 100:
                latency_score = 1.0
            elif p95_latency <= 500:
                latency_score = 1.0 - ((p95_latency - 100) / 400) * 0.3
            else:
                latency_score = max(0.1, 0.7 - ((p95_latency - 500) / 1000) * 0.6)
            
            freshness_score = enhanced_metrics.data_freshness_score
            reliability_score = enhanced_metrics.historical_uptime_score
            consistency_score = enhanced_metrics.consistency_score
            
            # Apply circuit breaker penalty
            circuit_penalty = self.circuit_penalties.get(
                resilience_metrics.circuit_state, 
                0.5  # Default penalty for unknown state
            )
            
            # Calculate adjusted confidence
            adjusted_confidence = confidence_score * (1 - circuit_penalty)
            
            # Determine confidence level
            confidence_level = self._get_confidence_level(adjusted_confidence)
            
            # Determine if fallback is required
            requires_fallback = adjusted_confidence < self.confidence_thresholds["fallback_trigger"]
            fallback_reason = None
            if requires_fallback:
                if resilience_metrics.circuit_state == CircuitBreakerState.OPEN:
                    fallback_reason = "Circuit breaker open"
                elif adjusted_confidence < self.confidence_thresholds["emergency_fallback"]:
                    fallback_reason = "Emergency fallback - critical confidence"
                else:
                    fallback_reason = "Confidence below fallback threshold"
            
            # Calculate selection priority (1 = highest priority)
            selection_priority = self._calculate_selection_priority(
                adjusted_confidence, 
                resilience_metrics.circuit_state
            )
            
            # Create confidence score object
            confidence_result = ProviderConfidenceScore(
                provider_id=provider_id,
                confidence_score=confidence_score,
                confidence_level=confidence_level,
                circuit_state=resilience_metrics.circuit_state,
                provider_state=resilience_metrics.current_state,
                success_rate_score=recent_success_score,
                latency_score=latency_score,
                freshness_score=freshness_score,
                reliability_score=reliability_score,
                consistency_score=consistency_score,
                circuit_penalty=circuit_penalty,
                adjusted_confidence=adjusted_confidence,
                selection_priority=selection_priority,
                requires_fallback=requires_fallback,
                fallback_reason=fallback_reason
            )
            
            # Cache the result
            self.provider_confidence_cache[provider_id] = confidence_result
            
            self.logger.debug(
                f"Calculated confidence for {provider_id}: "
                f"base={confidence_score:.3f}, adjusted={adjusted_confidence:.3f}, "
                f"level={confidence_level.value}, circuit={resilience_metrics.circuit_state.value}"
            )
            
            return confidence_result
            
        except Exception as e:
            self.logger.error(f"Error calculating confidence for {provider_id}: {e}")
            # Return minimal confidence score on error
            return ProviderConfidenceScore(
                provider_id=provider_id,
                confidence_score=0.1,
                confidence_level=ConfidenceLevel.CRITICAL,
                circuit_state=CircuitBreakerState.OPEN,
                provider_state=ProviderState.DEGRADED,
                success_rate_score=0.0,
                latency_score=0.0,
                freshness_score=0.0,
                reliability_score=0.0,
                consistency_score=0.0,
                circuit_penalty=0.9,
                adjusted_confidence=0.01,
                selection_priority=999,
                requires_fallback=True,
                fallback_reason="Error calculating confidence"
            )
    
    async def select_optimal_provider(
        self, 
        available_providers: List[str],
        confidence_threshold: Optional[float] = None
    ) -> ProviderSelectionResult:
        """
        Select optimal provider based on confidence scores and circuit states.
        Returns primary provider and ordered fallback list.
        """
        if confidence_threshold is None:
            confidence_threshold = self.confidence_thresholds["primary_provider_min"]
        
        # Get confidence scores for all providers
        provider_scores = []
        for provider_id in available_providers:
            score = await self.get_provider_confidence_score(provider_id)
            provider_scores.append(score)
        
        # Sort by selection priority (lower number = higher priority)
        provider_scores.sort(key=lambda x: x.selection_priority)
        
        # Find primary provider (first that meets threshold and doesn't require fallback)
        primary_provider = None
        for score in provider_scores:
            if (score.adjusted_confidence >= confidence_threshold and 
                not score.requires_fallback):
                primary_provider = score
                break
        
        # If no provider meets primary threshold, select best available
        if not primary_provider and provider_scores:
            primary_provider = provider_scores[0]
            self.logger.warning(
                f"No provider meets confidence threshold {confidence_threshold}, "
                f"selecting best available: {primary_provider.provider_id} "
                f"(confidence: {primary_provider.adjusted_confidence:.3f})"
            )
        
        # Create fallback list (all other providers in priority order)
        fallback_providers = [
            score for score in provider_scores 
            if score != primary_provider
        ]
        
        # Determine selection reason
        if not primary_provider:
            selection_reason = "No providers available"
        elif primary_provider.adjusted_confidence >= confidence_threshold:
            selection_reason = f"Primary provider meets confidence threshold ({confidence_threshold})"
        else:
            selection_reason = f"Best available provider (below threshold {confidence_threshold})"
        
        result = ProviderSelectionResult(
            primary_provider=primary_provider,
            fallback_providers=fallback_providers,
            selection_reason=selection_reason,
            total_providers_evaluated=len(available_providers),
            confidence_threshold_used=confidence_threshold
        )
        
        # Store in selection history
        self.selection_history.append(result)
        if len(self.selection_history) > 100:  # Keep last 100 selections
            self.selection_history.pop(0)
        
        self.logger.info(
            f"Selected provider: {primary_provider.provider_id if primary_provider else 'None'}, "
            f"fallbacks: {len(fallback_providers)}, reason: {selection_reason}"
        )
        
        return result
    
    async def should_trigger_circuit_breaker(
        self, 
        provider_id: str, 
        error_type: Optional[str] = None
    ) -> bool:
        """
        Enhanced circuit breaker decision using confidence scoring.
        Triggers circuit breaker faster for providers with low confidence.
        """
        confidence_score = await self.get_provider_confidence_score(provider_id)
        
        # Get standard circuit breaker recommendation
        resilience_metrics = self.resilience_manager.provider_metrics.get(
            provider_id, 
            ProviderMetrics()
        )
        
        # Enhanced circuit breaker logic
        if confidence_score.adjusted_confidence < self.confidence_thresholds["circuit_breaker_enhance"]:
            # Lower threshold for circuit breaker when confidence is low
            if resilience_metrics.consecutive_failures >= 2:  # Normally 5
                self.logger.warning(
                    f"Triggering circuit breaker for {provider_id} with low confidence "
                    f"({confidence_score.adjusted_confidence:.3f}) after {resilience_metrics.consecutive_failures} failures"
                )
                return True
        
        # Use standard circuit breaker logic for high confidence providers
        return resilience_metrics.consecutive_failures >= 5
    
    async def get_provider_rankings(self) -> List[Tuple[str, float, ConfidenceLevel]]:
        """
        Get all tracked providers ranked by confidence score.
        Returns list of (provider_id, confidence_score, confidence_level) tuples.
        """
        all_providers = set()
        all_providers.update(self.statistics_manager.provider_metrics.keys())
        all_providers.update(self.resilience_manager.provider_metrics.keys())
        
        rankings = []
        for provider_id in all_providers:
            confidence_score = await self.get_provider_confidence_score(provider_id)
            rankings.append((
                provider_id, 
                confidence_score.adjusted_confidence,
                confidence_score.confidence_level
            ))
        
        # Sort by confidence score (highest first)
        rankings.sort(key=lambda x: x[1], reverse=True)
        return rankings
    
    def _get_confidence_level(self, confidence_score: float) -> ConfidenceLevel:
        """Convert confidence score to confidence level enum"""
        if confidence_score >= 0.8:
            return ConfidenceLevel.EXCELLENT
        elif confidence_score >= 0.6:
            return ConfidenceLevel.GOOD
        elif confidence_score >= 0.4:
            return ConfidenceLevel.FAIR
        elif confidence_score >= 0.2:
            return ConfidenceLevel.POOR
        else:
            return ConfidenceLevel.CRITICAL
    
    def _calculate_selection_priority(
        self, 
        adjusted_confidence: float, 
        circuit_state: CircuitBreakerState
    ) -> int:
        """
        Calculate provider selection priority (1 = highest priority).
        Lower numbers indicate higher priority.
        """
        base_priority = int((1.0 - adjusted_confidence) * 100)  # 0-100 based on confidence
        
        # Circuit state penalties
        circuit_penalty = {
            CircuitBreakerState.CLOSED: 0,
            CircuitBreakerState.HALF_OPEN: 50,
            CircuitBreakerState.OPEN: 200
        }.get(circuit_state, 100)
        
        return max(1, base_priority + circuit_penalty)
    
    async def update_provider_confidence_on_request(
        self, 
        provider_id: str, 
        success: bool, 
        latency_ms: float,
        response_data: Optional[Any] = None
    ):
        """
        Update provider confidence based on request outcome.
        This should be called after each provider request.
        """
        # Update both systems
        await self.statistics_manager.record_provider_request(
            provider_id, success, latency_ms, response_data
        )
        
        # Update resilience manager provider metrics directly
        if provider_id in self.resilience_manager.provider_metrics:
            metrics = self.resilience_manager.provider_metrics[provider_id]
            if success:
                metrics.successful_requests += 1
                metrics.last_success_time = time.time()
            else:
                metrics.failed_requests += 1
                metrics.consecutive_failures += 1
                metrics.last_failure_time = time.time()
            metrics.total_requests += 1
        
        # Invalidate cache for this provider
        if provider_id in self.provider_confidence_cache:
            del self.provider_confidence_cache[provider_id]
        
        self.logger.debug(
            f"Updated confidence for {provider_id}: success={success}, latency={latency_ms}ms"
        )
    
    def get_integration_status(self) -> Dict[str, Any]:
        """Get status of the confidence integration system"""
        return {
            "system": "Provider Confidence Integration",
            "status": "active",
            "cached_providers": len(self.provider_confidence_cache),
            "selection_history_count": len(self.selection_history),
            "confidence_thresholds": self.confidence_thresholds,
            "circuit_penalties": {k.value: v for k, v in self.circuit_penalties.items()},
            "last_selection": (
                self.selection_history[-1].primary_provider.provider_id 
                if self.selection_history and self.selection_history[-1].primary_provider 
                else None
            )
        }


# Global instance
_provider_confidence_integration = None

def get_provider_confidence_integration() -> ProviderConfidenceIntegration:
    """Get global provider confidence integration instance"""
    global _provider_confidence_integration
    if _provider_confidence_integration is None:
        _provider_confidence_integration = ProviderConfidenceIntegration()
    return _provider_confidence_integration