"""
Integration layer connecting Enhanced Provider Statistics with existing ProviderResilienceManager.

This module ensures seamless integration between the sophisticated existing provider
resilience system and the new rolling window analytics, providing a unified interface
for all provider monitoring capabilities.
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from .provider_resilience_manager import provider_resilience_manager, ProviderState
from .enhanced_provider_statistics import enhanced_provider_statistics_manager


@dataclass
class UnifiedProviderHealth:
    """Unified provider health combining resilience and enhanced statistics"""
    provider_id: str
    
    # From ProviderResilienceManager
    consecutive_failures: int
    circuit_state: str
    provider_state: str
    can_retry: bool
    retry_after_sec: float
    
    # From Enhanced Statistics
    confidence_score: float
    success_rates: Dict[str, float]
    latency_percentiles: Dict[str, Dict[str, float]]
    request_rates_per_min: Dict[str, float]
    trends: Dict[str, str]
    data_freshness_score: float
    
    # Unified health assessment
    overall_health_status: str  # "excellent", "good", "degraded", "failing", "outage"
    is_recommended: bool
    priority_rank: int


class ProviderStatisticsIntegration:
    """
    Integration layer that combines ProviderResilienceManager with Enhanced Statistics.
    
    Provides unified provider monitoring combining:
    - Circuit breaker states and failure tracking (existing)
    - Rolling window analytics and confidence scoring (new)
    - Intelligent provider ranking and recommendation (unified)
    """
    
    def __init__(self):
        self.logger = logging.getLogger("provider_statistics_integration")
        self.resilience_manager = provider_resilience_manager
        self.stats_manager = enhanced_provider_statistics_manager
        
        # Provider priority configuration
        self.provider_priority_config = {
            "confidence_weight": 0.4,      # 40% weight on confidence score
            "circuit_state_weight": 0.3,   # 30% weight on circuit breaker state
            "latency_weight": 0.2,         # 20% weight on latency performance
            "trend_weight": 0.1,           # 10% weight on performance trends
        }
        
        self._integration_started = False
    
    async def start_integration(self):
        """Initialize the integration layer"""
        if not self._integration_started:
            # Start enhanced statistics background tasks
            await self.stats_manager.start_background_tasks()
            
            # Hook into resilience manager's request recording
            self._setup_request_forwarding()
            
            self._integration_started = True
            
            self.logger.info("Provider statistics integration started", extra={
                "category": "provider_integration",
                "action": "start",
                "priority_config": self.provider_priority_config,
            })
    
    def _setup_request_forwarding(self):
        """Setup automatic forwarding of requests to enhanced statistics"""
        # Note: In a real implementation, this would hook into the resilience manager's
        # record_provider_request method. For this demo, we'll provide a wrapper method.
        pass
    
    async def record_provider_request(self, provider_id: str, success: bool, 
                                    latency_ms: float, error: Optional[Exception] = None) -> None:
        """
        Unified request recording that updates both resilience manager and enhanced statistics.
        """
        # Ensure integration is started
        if not self._integration_started:
            await self.start_integration()
        
        # Record in resilience manager (existing functionality)
        await self.resilience_manager.record_provider_request(
            provider_id=provider_id,
            success=success,
            latency_ms=latency_ms,
            error=error
        )
        
        # Record in enhanced statistics (new functionality)
        await self.stats_manager.record_provider_request(
            provider_id=provider_id,
            success=success,
            latency_ms=latency_ms
        )
        
        self.logger.debug("Unified provider request recorded", extra={
            "category": "provider_integration",
            "action": "record_request",
            "provider_id": provider_id,
            "success": success,
            "latency_ms": latency_ms,
        })
    
    async def get_unified_provider_health(self, provider_id: str) -> Optional[UnifiedProviderHealth]:
        """Get comprehensive provider health combining all data sources"""
        # Get resilience manager state
        resilience_state = self.resilience_manager.get_provider_state(provider_id)
        if not resilience_state:
            return None
        
        # Get enhanced statistics
        enhanced_stats = await self.stats_manager.get_provider_statistics(provider_id)
        if not enhanced_stats:
            return None
        
        # Calculate unified health status
        health_status = self._calculate_unified_health_status(resilience_state, enhanced_stats)
        is_recommended = self._is_provider_recommended(resilience_state, enhanced_stats)
        priority_rank = await self._calculate_provider_priority(provider_id, resilience_state, enhanced_stats)
        
        return UnifiedProviderHealth(
            provider_id=provider_id,
            
            # Resilience manager data
            consecutive_failures=resilience_state["consecutive_failures"],
            circuit_state=resilience_state["circuit_state"],
            provider_state=resilience_state["provider_state"],
            can_retry=resilience_state["can_retry"],
            retry_after_sec=resilience_state.get("retry_after_sec", 0.0),
            
            # Enhanced statistics data
            confidence_score=enhanced_stats["confidence_score"],
            success_rates=enhanced_stats["success_rates"],
            latency_percentiles=enhanced_stats["latency_percentiles"],
            request_rates_per_min=enhanced_stats["request_rates_per_min"],
            trends=enhanced_stats["trends"],
            data_freshness_score=enhanced_stats["data_freshness_score"],
            
            # Unified assessment
            overall_health_status=health_status,
            is_recommended=is_recommended,
            priority_rank=priority_rank,
        )
    
    def _calculate_unified_health_status(self, resilience_state: Dict[str, Any], 
                                       enhanced_stats: Dict[str, Any]) -> str:
        """Calculate unified health status from both data sources"""
        circuit_state = resilience_state["circuit_state"]
        provider_state = resilience_state["provider_state"]
        confidence_score = enhanced_stats["confidence_score"]
        success_rate_5m = enhanced_stats["success_rates"]["5m"]
        
        # Circuit breaker takes priority for failure states
        if circuit_state == "open" or provider_state == "circuit_open":
            return "outage"
        elif provider_state == "failing":
            return "failing"
        elif provider_state == "degraded":
            return "degraded"
        
        # For healthy circuit states, use confidence score
        if confidence_score >= 0.9 and success_rate_5m >= 0.95:
            return "excellent"
        elif confidence_score >= 0.8 and success_rate_5m >= 0.90:
            return "good"
        elif confidence_score >= 0.6 and success_rate_5m >= 0.80:
            return "degraded"
        else:
            return "failing"
    
    def _is_provider_recommended(self, resilience_state: Dict[str, Any], 
                                enhanced_stats: Dict[str, Any]) -> bool:
        """Determine if provider is recommended for use"""
        # Not recommended if circuit is open or failing
        if (resilience_state["circuit_state"] == "open" or 
            resilience_state["provider_state"] in ["failing", "circuit_open"]):
            return False
        
        # Recommended if confidence is high and trends are good
        confidence_score = enhanced_stats["confidence_score"]
        success_rate_trend = enhanced_stats["trends"]["success_rate_trend"]
        latency_trend = enhanced_stats["trends"]["latency_trend"]
        
        return (confidence_score >= 0.7 and 
                success_rate_trend != "degrading" and 
                latency_trend != "degrading")
    
    async def _calculate_provider_priority(self, provider_id: str, resilience_state: Dict[str, Any], 
                                         enhanced_stats: Dict[str, Any]) -> int:
        """Calculate provider priority rank (lower number = higher priority)"""
        # Calculate weighted score
        score = 0.0
        
        # Confidence score (40% weight)
        confidence_score = enhanced_stats["confidence_score"]
        score += confidence_score * self.provider_priority_config["confidence_weight"]
        
        # Circuit state (30% weight)
        circuit_state_score = {
            "closed": 1.0,
            "half_open": 0.5,
            "open": 0.0
        }.get(resilience_state["circuit_state"], 0.0)
        score += circuit_state_score * self.provider_priority_config["circuit_state_weight"]
        
        # Latency performance (20% weight) - convert to 0-1 score
        p95_latency_5m = enhanced_stats["latency_percentiles"]["5m"]["p95"]
        if p95_latency_5m <= 100:
            latency_score = 1.0
        elif p95_latency_5m <= 500:
            latency_score = 1.0 - ((p95_latency_5m - 100) / 400) * 0.5
        else:
            latency_score = max(0.0, 0.5 - ((p95_latency_5m - 500) / 1000) * 0.5)
        score += latency_score * self.provider_priority_config["latency_weight"]
        
        # Trend analysis (10% weight)
        success_trend = enhanced_stats["trends"]["success_rate_trend"]
        latency_trend = enhanced_stats["trends"]["latency_trend"]
        
        trend_score = 0.5  # baseline
        if success_trend == "improving" and latency_trend == "improving":
            trend_score = 1.0
        elif success_trend == "improving" or latency_trend == "improving":
            trend_score = 0.75
        elif success_trend == "degrading" or latency_trend == "degrading":
            trend_score = 0.25
        elif success_trend == "degrading" and latency_trend == "degrading":
            trend_score = 0.0
        
        score += trend_score * self.provider_priority_config["trend_weight"]
        
        # Convert score to rank (higher score = lower rank number)
        # Use inverse ranking: rank = 100 - (score * 100)
        rank = max(1, int(100 - (score * 99)))
        
        return rank
    
    async def get_all_provider_health(self) -> List[UnifiedProviderHealth]:
        """Get health status for all providers, sorted by priority"""
        all_providers = set()
        
        # Get all providers from both systems
        resilience_system_status = self.resilience_manager.get_system_status()
        all_providers.update(resilience_system_status["providers"].keys())
        
        enhanced_stats = await self.stats_manager.get_all_provider_statistics()
        all_providers.update(enhanced_stats.keys())
        
        # Get unified health for each provider
        provider_health_list = []
        for provider_id in all_providers:
            health = await self.get_unified_provider_health(provider_id)
            if health:
                provider_health_list.append(health)
        
        # Sort by priority rank (lower rank = higher priority)
        provider_health_list.sort(key=lambda x: x.priority_rank)
        
        return provider_health_list
    
    async def get_recommended_providers(self, limit: int = 5) -> List[UnifiedProviderHealth]:
        """Get top recommended providers for use"""
        all_health = await self.get_all_provider_health()
        
        # Filter to recommended providers only
        recommended = [health for health in all_health if health.is_recommended]
        
        return recommended[:limit]
    
    async def detect_provider_issues(self) -> Dict[str, List[Dict[str, Any]]]:
        """Detect provider issues using combined data sources"""
        issues = {
            "circuit_breaker_issues": [],
            "performance_degradation": [],
            "stale_data": [],
            "trend_warnings": [],
        }
        
        all_health = await self.get_all_provider_health()
        
        for health in all_health:
            # Circuit breaker issues
            if health.circuit_state == "open":
                issues["circuit_breaker_issues"].append({
                    "provider_id": health.provider_id,
                    "issue": "circuit_breaker_open",
                    "consecutive_failures": health.consecutive_failures,
                    "retry_after_sec": health.retry_after_sec,
                })
            
            # Performance degradation
            if health.confidence_score < 0.6:
                issues["performance_degradation"].append({
                    "provider_id": health.provider_id,
                    "issue": "low_confidence_score",
                    "confidence_score": health.confidence_score,
                    "success_rate_5m": health.success_rates["5m"],
                })
            
            # Stale data
            if health.data_freshness_score < 0.5:
                issues["stale_data"].append({
                    "provider_id": health.provider_id,
                    "issue": "stale_data",
                    "freshness_score": health.data_freshness_score,
                })
            
            # Trend warnings
            if health.trends["success_rate_trend"] == "degrading" or health.trends["latency_trend"] == "degrading":
                issues["trend_warnings"].append({
                    "provider_id": health.provider_id,
                    "issue": "degrading_trends",
                    "success_rate_trend": health.trends["success_rate_trend"],
                    "latency_trend": health.trends["latency_trend"],
                })
        
        return issues
    
    async def get_system_health_dashboard(self) -> Dict[str, Any]:
        """Get comprehensive system health dashboard"""
        resilience_status = self.resilience_manager.get_system_status()
        enhanced_health = await self.stats_manager.get_system_health_summary()
        all_provider_health = await self.get_all_provider_health()
        recommended_providers = await self.get_recommended_providers()
        issues = await self.detect_provider_issues()
        
        return {
            "system_overview": {
                "total_providers": len(all_provider_health),
                "recommended_providers": len(recommended_providers),
                "system_health_score": enhanced_health["system_health_score"],
                "average_confidence": enhanced_health["average_confidence"],
            },
            
            "provider_distribution": {
                "excellent": len([p for p in all_provider_health if p.overall_health_status == "excellent"]),
                "good": len([p for p in all_provider_health if p.overall_health_status == "good"]),
                "degraded": len([p for p in all_provider_health if p.overall_health_status == "degraded"]),
                "failing": len([p for p in all_provider_health if p.overall_health_status == "failing"]),
                "outage": len([p for p in all_provider_health if p.overall_health_status == "outage"]),
            },
            
            "top_providers": [
                {
                    "provider_id": p.provider_id,
                    "confidence_score": p.confidence_score,
                    "health_status": p.overall_health_status,
                    "priority_rank": p.priority_rank,
                }
                for p in recommended_providers[:5]
            ],
            
            "system_issues": {
                "total_issues": sum(len(issue_list) for issue_list in issues.values()),
                "by_category": {category: len(issue_list) for category, issue_list in issues.items()},
                "details": issues,
            },
            
            "performance_metrics": {
                "resilience_manager": {
                    "active_micro_batches": resilience_status["active_micro_batches"],
                    "computational_mode": resilience_status["computational_controller"]["current_mode"],
                    "queue_depth": resilience_status["computational_controller"]["pending_queue_depth"],
                },
                "enhanced_statistics": enhanced_health,
            },
        }


# Global instance
provider_statistics_integration = ProviderStatisticsIntegration()