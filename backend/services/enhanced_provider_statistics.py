"""
Enhanced Provider Statistics with Rolling Window Analytics

This module extends the existing ProviderResilienceManager with sophisticated
rolling window statistics tracking for detailed provider performance monitoring.

Key Features:
- Rolling window latency percentiles (p50, p95, p99) 
- Multi-timeframe success rates (1m, 5m, 15m, 1h)
- Request volume tracking with time-based analytics
- Enhanced provider confidence scoring 0-1 algorithm
- Real-time performance degradation detection
"""

import time
import asyncio
import logging
from collections import deque, defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any, Deque
from enum import Enum
import statistics
import math


@dataclass
class TimeWindowStats:
    """Statistics for a specific time window"""
    window_size_sec: int
    success_count: int = 0
    total_count: int = 0
    latency_samples: Deque[Tuple[float, float]] = field(
        default_factory=lambda: deque(maxlen=1000)
    )
    request_timestamps: Deque[float] = field(default_factory=deque)
    request_outcomes: Deque[bool] = field(default_factory=deque)
    
    def add_request(self, success: bool, latency_ms: float, timestamp: float):
        """Add request to window statistics"""
        self.total_count += 1
        if success:
            self.success_count += 1

        self.latency_samples.append((timestamp, latency_ms))
        self.request_timestamps.append(timestamp)
        self.request_outcomes.append(success)
        
        # Clean old data beyond window
        self._clean_old_data(timestamp)
    
    def _clean_old_data(self, current_time: float):
        """Remove data outside the time window"""
        cutoff_time = current_time - self.window_size_sec
        
        # Clean request timestamps and adjust counts
        while self.request_timestamps and self.request_timestamps[0] < cutoff_time:
            self.request_timestamps.popleft()
            if self.request_outcomes:
                self.request_outcomes.popleft()

        # Clean latency samples aligned to cutoff
        while self.latency_samples and self.latency_samples[0][0] < cutoff_time:
            self.latency_samples.popleft()

        # Normalize counters after cleanup to ensure consistency
        self.total_count = len(self.request_timestamps)
        self.success_count = sum(1 for outcome in self.request_outcomes if outcome)
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate for this window"""
        if self.total_count <= 0:
            return 1.0
        return max(0.0, min(1.0, self.success_count / self.total_count))
    
    @property
    def request_rate_per_min(self) -> float:
        """Calculate requests per minute for this window"""
        if not self.request_timestamps:
            return 0.0
        
        window_duration_min = self.window_size_sec / 60.0
        return len(self.request_timestamps) / window_duration_min
    
    def _normalize_fraction(self, fraction: float) -> float:
        return min(1.0, max(0.0, fraction))

    def _collect_latency_samples(self) -> List[float]:
        return [latency for _, latency in self.latency_samples]

    def _collect_recent_latency_samples(self, fraction: float) -> List[float]:
        if not self.latency_samples:
            return []

        fraction = self._normalize_fraction(fraction)
        if fraction == 0.0:
            return []

        latest_timestamp = self.latency_samples[-1][0]
        cutoff = latest_timestamp - (self.window_size_sec * fraction)
        return [latency for ts, latency in self.latency_samples if ts >= cutoff]

    def _nearest_rank(self, sorted_samples: List[float], percentile: float) -> float:
        if not sorted_samples:
            return 0.0

        index = max(0, min(len(sorted_samples) - 1, math.ceil(percentile * len(sorted_samples)) - 1))
        return sorted_samples[index]

    def _calculate_percentiles(self, samples: List[float]) -> Dict[str, float]:
        if not samples:
            return {"p50": 0.0, "p95": 0.0, "p99": 0.0}

        sorted_samples = sorted(samples)
        return {
            "p50": self._nearest_rank(sorted_samples, 0.50),
            "p95": self._nearest_rank(sorted_samples, 0.95),
            "p99": self._nearest_rank(sorted_samples, 0.99),
        }

    def get_latency_percentiles(self) -> Dict[str, float]:
        """Calculate latency percentiles"""
        return self._calculate_percentiles(self._collect_latency_samples())

    def get_recent_latency_percentiles(self, fraction: float = 0.25) -> Dict[str, float]:
        """Calculate latency percentiles for the most recent slice of the window"""
        return self._calculate_percentiles(self._collect_recent_latency_samples(fraction))

    def get_recent_latency_percentile(self, percentile: float, fraction: float = 0.25) -> float:
        samples = self._collect_recent_latency_samples(fraction)
        if not samples:
            samples = self._collect_latency_samples()
        if not samples:
            return 0.0
        return self._nearest_rank(sorted(samples), percentile)

    def get_recent_success_rate(self, fraction: float = 0.25) -> float:
        """Success rate over the most recent portion of the window"""
        if not self.request_timestamps:
            return 1.0

        fraction = self._normalize_fraction(fraction)
        if fraction == 0.0:
            return 1.0

        cutoff = self.request_timestamps[-1] - (self.window_size_sec * fraction)
        timestamps = list(self.request_timestamps)
        outcomes = list(self.request_outcomes)

        successes = 0
        total = 0

        for ts, outcome in zip(reversed(timestamps), reversed(outcomes)):
            if ts < cutoff:
                break
            total += 1
            if outcome:
                successes += 1

        if total == 0:
            return 1.0

        return successes / total


@dataclass
class EnhancedProviderMetrics:
    """Enhanced provider metrics with rolling window analytics"""
    provider_id: str
    
    # Multi-timeframe windows
    window_1m: TimeWindowStats = field(default_factory=lambda: TimeWindowStats(60))      # 1 minute
    window_5m: TimeWindowStats = field(default_factory=lambda: TimeWindowStats(300))     # 5 minutes  
    window_15m: TimeWindowStats = field(default_factory=lambda: TimeWindowStats(900))    # 15 minutes
    window_1h: TimeWindowStats = field(default_factory=lambda: TimeWindowStats(3600))    # 1 hour
    
    # Overall statistics
    total_requests_all_time: int = 0
    total_successes_all_time: int = 0
    first_request_time: Optional[float] = None
    last_request_time: Optional[float] = None
    
    # Data freshness tracking
    last_data_update: Optional[float] = None
    data_staleness_threshold_sec: float = 300  # 5 minutes
    
    # Historical reliability score components  
    historical_uptime_score: float = 1.0      # 0-1 based on historical availability
    consistency_score: float = 1.0            # 0-1 based on latency consistency
    error_pattern_score: float = 1.0          # 0-1 based on error patterns
    
    # Trend detection
    latency_trend: str = "stable"              # "improving", "degrading", "stable"
    success_rate_trend: str = "stable"         # "improving", "degrading", "stable"
    
    def record_request(self, success: bool, latency_ms: float, timestamp: Optional[float] = None):
        """Record request across all time windows"""
        if timestamp is None:
            timestamp = time.time()
        
        # Update overall stats
        self.total_requests_all_time += 1
        if success:
            self.total_successes_all_time += 1
        
        if self.first_request_time is None:
            self.first_request_time = timestamp
        self.last_request_time = timestamp
        self.last_data_update = timestamp
        
        # Update all time windows
        self.window_1m.add_request(success, latency_ms, timestamp)
        self.window_5m.add_request(success, latency_ms, timestamp)
        self.window_15m.add_request(success, latency_ms, timestamp)
        self.window_1h.add_request(success, latency_ms, timestamp)
        
        # Update trend analysis
        self._update_trend_analysis()
    
    def _update_trend_analysis(self):
        """Update trend analysis based on recent performance"""
        # Compare recent (most recent quarter of 1m window) vs 5m success rates
        recent_success_rate = self.window_1m.get_recent_success_rate(fraction=0.25)
        baseline_success_rate = self.window_5m.success_rate
        
        if recent_success_rate > baseline_success_rate + 0.05:  # 5% improvement
            self.success_rate_trend = "improving"
        elif recent_success_rate < baseline_success_rate - 0.05:  # 5% degradation
            self.success_rate_trend = "degrading" 
        else:
            self.success_rate_trend = "stable"
        
        # Compare recent vs baseline latency for trend detection
        recent_latency = self.window_1m.get_recent_latency_percentile(0.95, fraction=0.25)
        baseline_latency = self.window_5m.get_latency_percentiles()["p95"]
        
        if recent_latency < baseline_latency * 0.9:  # 10% improvement
            self.latency_trend = "improving"
        elif recent_latency > baseline_latency * 1.1:  # 10% degradation
            self.latency_trend = "degrading"
        else:
            self.latency_trend = "stable"
    
    @property
    def data_freshness_score(self) -> float:
        """Calculate data freshness score 0-1"""
        if self.last_data_update is None:
            return 0.0
        
        age_sec = time.time() - self.last_data_update
        if age_sec <= self.data_staleness_threshold_sec:
            return 1.0
        else:
            # Exponential decay after threshold
            decay_factor = math.exp(-(age_sec - self.data_staleness_threshold_sec) / self.data_staleness_threshold_sec)
            return max(0.0, decay_factor)
    
    @property
    def overall_success_rate(self) -> float:
        """Calculate overall success rate across all time"""
        return (self.total_successes_all_time / self.total_requests_all_time) if self.total_requests_all_time > 0 else 1.0
    
    def get_comprehensive_confidence_score(self) -> float:
        """
        Calculate comprehensive provider confidence score 0-1
        
        Factors:
        - Recent success rate (40% weight)
        - Latency performance (25% weight) 
        - Data freshness (15% weight)
        - Historical reliability (10% weight)
        - Consistency and error patterns (10% weight)
        """
        # Recent performance (40% weight)
        recent_success_weight = 0.4
        recent_success_score = self.window_5m.success_rate
        
        # Latency performance (25% weight) - lower latency = higher score
        latency_weight = 0.25
        p95_latency = self.window_5m.get_latency_percentiles()["p95"]
        # Convert latency to score: excellent <100ms, good <500ms, poor >1000ms
        if p95_latency <= 100:
            latency_score = 1.0
        elif p95_latency <= 500:
            latency_score = 1.0 - ((p95_latency - 100) / 400) * 0.3  # 0.7-1.0 range
        elif p95_latency <= 1000:
            latency_score = 0.7 - ((p95_latency - 500) / 500) * 0.4  # 0.3-0.7 range
        else:
            latency_score = max(0.1, 0.3 - ((p95_latency - 1000) / 1000) * 0.2)  # 0.1-0.3 range
        
        # Data freshness (15% weight)
        freshness_weight = 0.15
        freshness_score = self.data_freshness_score
        
        # Historical reliability (10% weight)
        historical_weight = 0.10
        historical_score = (self.historical_uptime_score + self.overall_success_rate) / 2
        
        # Consistency and error patterns (10% weight)
        consistency_weight = 0.10
        consistency_score = (self.consistency_score + self.error_pattern_score) / 2
        
        # Calculate weighted average
        confidence_score = (
            recent_success_score * recent_success_weight +
            latency_score * latency_weight +
            freshness_score * freshness_weight +
            historical_score * historical_weight +
            consistency_score * consistency_weight
        )
        
        return max(0.0, min(1.0, confidence_score))
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get comprehensive performance summary"""
        now = time.time()
        uptime_sec = (now - self.first_request_time) if self.first_request_time else 0
        
        return {
            "provider_id": self.provider_id,
            "confidence_score": self.get_comprehensive_confidence_score(),
            "data_freshness_score": self.data_freshness_score,
            "overall_success_rate": self.overall_success_rate,
            "uptime_hours": uptime_sec / 3600,
            
            # Multi-timeframe success rates
            "success_rates": {
                "1m": self.window_1m.success_rate,
                "5m": self.window_5m.success_rate,
                "15m": self.window_15m.success_rate,
                "1h": self.window_1h.success_rate,
            },
            
            # Multi-timeframe latency percentiles
            "latency_percentiles": {
                "1m": self.window_1m.get_latency_percentiles(),
                "5m": self.window_5m.get_latency_percentiles(),
                "15m": self.window_15m.get_latency_percentiles(),
                "1h": self.window_1h.get_latency_percentiles(),
            },
            
            # Request volume analytics
            "request_rates_per_min": {
                "1m": self.window_1m.request_rate_per_min,
                "5m": self.window_5m.request_rate_per_min,
                "15m": self.window_15m.request_rate_per_min,
                "1h": self.window_1h.request_rate_per_min,
            },
            
            # Trend analysis
            "trends": {
                "success_rate_trend": self.success_rate_trend,
                "latency_trend": self.latency_trend,
            },
            
            # Overall statistics
            "total_requests": self.total_requests_all_time,
            "total_successes": self.total_successes_all_time,
            "last_request_age_sec": (now - self.last_request_time) if self.last_request_time else None,
        }


class EnhancedProviderStatisticsManager:
    """
    Manager for enhanced provider statistics with rolling window analytics.
    
    Integrates with existing ProviderResilienceManager to provide detailed
    multi-timeframe performance monitoring and sophisticated confidence scoring.
    """
    
    def __init__(self):
        self.logger = logging.getLogger("enhanced_provider_statistics")
        self.provider_metrics: Dict[str, EnhancedProviderMetrics] = {}
        self.metrics_lock = asyncio.Lock()
        
        # Background cleanup task
        self._cleanup_task: Optional[asyncio.Task] = None
        self._cleanup_interval_sec = 300  # 5 minutes
        
    async def start_background_tasks(self):
        """Start background maintenance tasks"""
        try:
            loop = asyncio.get_running_loop()
            self._cleanup_task = loop.create_task(self._cleanup_worker())
            
            self.logger.info("Enhanced provider statistics manager started", extra={
                "category": "enhanced_provider_stats",
                "action": "start",
                "cleanup_interval_sec": self._cleanup_interval_sec,
            })
        except RuntimeError:
            self.logger.info("Enhanced provider statistics manager initialized - background tasks will start on first use")
    
    async def record_provider_request(self, provider_id: str, success: bool, 
                                    latency_ms: float, timestamp: Optional[float] = None) -> None:
        """Record provider request with enhanced analytics"""
        async with self.metrics_lock:
            if provider_id not in self.provider_metrics:
                self.provider_metrics[provider_id] = EnhancedProviderMetrics(provider_id=provider_id)
            
            self.provider_metrics[provider_id].record_request(success, latency_ms, timestamp)
        
        self.logger.debug("Enhanced provider request recorded", extra={
            "category": "enhanced_provider_stats",
            "action": "record_request",
            "provider_id": provider_id,
            "success": success,
            "latency_ms": latency_ms,
            "confidence_score": self.provider_metrics[provider_id].get_comprehensive_confidence_score(),
        })
    
    async def get_provider_statistics(self, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive provider statistics"""
        async with self.metrics_lock:
            if provider_id not in self.provider_metrics:
                return None
            
            return self.provider_metrics[provider_id].get_performance_summary()
    
    async def get_all_provider_statistics(self) -> Dict[str, Dict[str, Any]]:
        """Get statistics for all providers"""
        async with self.metrics_lock:
            return {
                provider_id: metrics.get_performance_summary()
                for provider_id, metrics in self.provider_metrics.items()
            }
    
    async def get_provider_confidence_scores(self) -> Dict[str, float]:
        """Get confidence scores for all providers"""
        async with self.metrics_lock:
            return {
                provider_id: metrics.get_comprehensive_confidence_score()
                for provider_id, metrics in self.provider_metrics.items()
            }
    
    async def get_top_providers_by_confidence(self, limit: int = 5) -> List[Tuple[str, float]]:
        """Get top providers ranked by confidence score"""
        confidence_scores = await self.get_provider_confidence_scores()
        
        sorted_providers = sorted(
            confidence_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return sorted_providers[:limit]
    
    async def detect_performance_degradation(self, threshold: float = 0.1) -> List[Dict[str, Any]]:
        """Detect providers with recent performance degradation"""
        degraded_providers = []
        
        async with self.metrics_lock:
            for provider_id, metrics in self.provider_metrics.items():
                summary = metrics.get_performance_summary()
                
                # Check for degradation indicators
                success_rate_1m = summary["success_rates"]["1m"]
                success_rate_5m = summary["success_rates"]["5m"]
                recent_success_rate = metrics.window_1m.get_recent_success_rate(fraction=0.25)
                success_drop = success_rate_5m - min(success_rate_1m, recent_success_rate)

                if success_drop > threshold:
                    degraded_providers.append({
                        "provider_id": provider_id,
                        "degradation_type": "success_rate",
                        "current_success_rate_1m": success_rate_1m,
                        "recent_success_rate": recent_success_rate,
                        "baseline_success_rate_5m": success_rate_5m,
                        "degradation_amount": success_drop,
                        "confidence_score": summary["confidence_score"],
                    })
                
                # Check for latency degradation
                latency_1m_p95 = summary["latency_percentiles"]["1m"]["p95"]
                recent_latency_p95 = metrics.window_1m.get_recent_latency_percentile(0.95, fraction=0.25)
                latency_5m_p95 = summary["latency_percentiles"]["5m"]["p95"]
                effective_latency = max(latency_1m_p95, recent_latency_p95)
                
                if latency_5m_p95 > 0 and (effective_latency / latency_5m_p95) > (1 + threshold):
                    degraded_providers.append({
                        "provider_id": provider_id,
                        "degradation_type": "latency",
                        "current_latency_1m_p95": latency_1m_p95,
                        "recent_latency_p95": recent_latency_p95,
                        "baseline_latency_5m_p95": latency_5m_p95,
                        "degradation_ratio": effective_latency / latency_5m_p95,
                        "confidence_score": summary["confidence_score"],
                    })
        
        return degraded_providers
    
    async def get_system_health_summary(self) -> Dict[str, Any]:
        """Get overall system health summary"""
        all_stats = await self.get_all_provider_statistics()
        
        if not all_stats:
            return {
                "total_providers": 0,
                "healthy_providers": 0,
                "degraded_providers": 0,
                "average_confidence": 0.0,
                "system_health_score": 0.0,
            }
        
        # Analyze provider health
        confidence_scores = [stats["confidence_score"] for stats in all_stats.values()]
        healthy_providers = sum(1 for score in confidence_scores if score >= 0.8)
        degraded_providers = sum(1 for score in confidence_scores if score < 0.6)
        
        average_confidence = sum(confidence_scores) / len(confidence_scores)
        
        # Calculate system health score (0-1)
        system_health_score = (
            (healthy_providers / len(all_stats)) * 0.6 +  # 60% weight on healthy providers
            average_confidence * 0.4                       # 40% weight on average confidence
        )
        
        return {
            "total_providers": len(all_stats),
            "healthy_providers": healthy_providers,
            "degraded_providers": degraded_providers,
            "average_confidence": average_confidence,
            "system_health_score": system_health_score,
            "confidence_distribution": {
                "excellent_0.9_plus": sum(1 for score in confidence_scores if score >= 0.9),
                "good_0.8_to_0.9": sum(1 for score in confidence_scores if 0.8 <= score < 0.9),
                "fair_0.6_to_0.8": sum(1 for score in confidence_scores if 0.6 <= score < 0.8),
                "poor_below_0.6": sum(1 for score in confidence_scores if score < 0.6),
            },
        }
    
    async def _cleanup_worker(self):
        """Background worker to clean up old data"""
        while True:
            try:
                await asyncio.sleep(self._cleanup_interval_sec)
                
                # Clean up old data from time windows (already handled by TimeWindowStats)
                # This is a placeholder for additional cleanup logic if needed
                
                self.logger.debug("Enhanced provider statistics cleanup completed", extra={
                    "category": "enhanced_provider_stats",
                    "action": "cleanup",
                    "total_providers": len(self.provider_metrics),
                })
                
            except Exception as e:
                self.logger.error("Enhanced provider statistics cleanup error", extra={
                    "category": "enhanced_provider_stats",
                    "action": "cleanup_error",
                    "error": str(e),
                })
                await asyncio.sleep(60)  # Back off on error
    
    async def close(self):
        """Clean shutdown"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
        
        self.logger.info("Enhanced provider statistics manager shut down")


# Global instance
enhanced_provider_statistics_manager = EnhancedProviderStatisticsManager()