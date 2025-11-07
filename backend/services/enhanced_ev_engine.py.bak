"""
Enhanced Expected Value (EV) Engine with Hardening Features

Extends the base EV engine with:
- Intelligent caching with TTL and invalidation
- Comprehensive metrics collection
- Feature flag gating for A/B testing
- Performance monitoring and optimization
- Distribution analysis and summary statistics
"""

import asyncio
import logging
import time
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Union
from enum import Enum
import hashlib
import json
import statistics

from backend.services.ev_engine import ev_engine, EVTier, EVEngine
from backend.services.unified_logging import get_logger, log_performance


class FeatureFlag(Enum):
    """Feature flags for EV engine behavior"""
    ENABLE_CACHING = "enable_caching"
    ENABLE_METRICS = "enable_metrics"
    ENABLE_BATCH_OPTIMIZATION = "enable_batch_optimization"
    ENABLE_PRECISION_MODE = "enable_precision_mode"
    ENABLE_DISTRIBUTION_ANALYSIS = "enable_distribution_analysis"
    ENABLE_ADVANCED_VALIDATION = "enable_advanced_validation"


@dataclass
class EVMetrics:
    """Comprehensive metrics for EV calculations"""
    total_calculations: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    calculation_times: Optional[deque] = None
    ev_distribution: Optional[deque] = None
    tier_counts: Optional[Dict[str, int]] = None
    error_count: int = 0
    validation_failures: int = 0
    
    # Rolling window metrics (timestamped entries)
    rolling_calculations: Optional[deque] = None
    rolling_errors: Optional[deque] = None
    rolling_cache_hits: Optional[deque] = None
    
    def __post_init__(self):
        if self.calculation_times is None:
            self.calculation_times = deque(maxlen=1000)
        if self.ev_distribution is None:
            self.ev_distribution = deque(maxlen=1000)
        if self.tier_counts is None:
            self.tier_counts = defaultdict(int)
        if self.rolling_calculations is None:
            self.rolling_calculations = deque(maxlen=5000)  # 15 mins at ~5 req/sec
        if self.rolling_errors is None:
            self.rolling_errors = deque(maxlen=1000)
        if self.rolling_cache_hits is None:
            self.rolling_cache_hits = deque(maxlen=5000)
    
    def add_rolling_calculation(self, timestamp: Optional[float] = None):
        """Add a timestamped calculation to rolling window"""
        if timestamp is None:
            timestamp = time.time()
        if self.rolling_calculations is not None:
            self.rolling_calculations.append(timestamp)
    
    def add_rolling_error(self, timestamp: Optional[float] = None):
        """Add a timestamped error to rolling window"""
        if timestamp is None:
            timestamp = time.time()
        if self.rolling_errors is not None:
            self.rolling_errors.append(timestamp)
    
    def add_rolling_cache_hit(self, timestamp: Optional[float] = None):
        """Add a timestamped cache hit to rolling window"""
        if timestamp is None:
            timestamp = time.time()
        if self.rolling_cache_hits is not None:
            self.rolling_cache_hits.append(timestamp)
    
    def get_rolling_metrics(self, window_minutes: int = 15) -> Dict[str, Any]:
        """Get rolling window metrics for specified time period"""
        cutoff_time = time.time() - (window_minutes * 60)
        
        # Filter recent events
        recent_calculations = [t for t in (self.rolling_calculations or []) if t > cutoff_time]
        recent_errors = [t for t in (self.rolling_errors or []) if t > cutoff_time]
        recent_cache_hits = [t for t in (self.rolling_cache_hits or []) if t > cutoff_time]
        
        # Calculate rates (per minute)
        calculations_per_minute = len(recent_calculations) / window_minutes if window_minutes > 0 else 0
        errors_per_minute = len(recent_errors) / window_minutes if window_minutes > 0 else 0
        cache_hits_per_minute = len(recent_cache_hits) / window_minutes if window_minutes > 0 else 0
        
        # Calculate rolling error rate and cache hit rate
        rolling_error_rate = len(recent_errors) / len(recent_calculations) if recent_calculations else 0
        rolling_cache_hit_rate = len(recent_cache_hits) / len(recent_calculations) if recent_calculations else 0
        
        return {
            "window_minutes": window_minutes,
            "calculations_total": len(recent_calculations),
            "calculations_per_minute": round(calculations_per_minute, 2),
            "errors_total": len(recent_errors),
            "errors_per_minute": round(errors_per_minute, 2),
            "error_rate": round(rolling_error_rate, 4),
            "cache_hits_total": len(recent_cache_hits),
            "cache_hits_per_minute": round(cache_hits_per_minute, 2),
            "cache_hit_rate": round(rolling_cache_hit_rate, 4),
            "timestamp": datetime.now().isoformat()
        }


@dataclass
class CacheEntry:
    """Cache entry with TTL and metadata"""
    value: Any
    timestamp: float
    ttl: float
    access_count: int = 0
    last_access: Optional[float] = None
    
    def is_expired(self) -> bool:
        return time.time() - self.timestamp > self.ttl
    
    def mark_accessed(self):
        self.access_count += 1
        self.last_access = time.time()


@dataclass
class EVDistribution:
    """EV distribution analysis"""
    sample_size: int
    mean_ev: float
    median_ev: float
    std_dev: float
    min_ev: float
    max_ev: float
    percentiles: Dict[str, float]
    tier_distribution: Dict[str, int]
    positive_ev_ratio: float
    high_ev_opportunities: int


class EnhancedEVEngine:
    """Enhanced EV Engine with hardening features"""
    
    def __init__(self):
        self.logger = get_logger("enhanced_ev_engine")
        self.base_engine = ev_engine
        
        # Feature flags (default enabled for production hardening)
        self.feature_flags = {
            FeatureFlag.ENABLE_CACHING: True,
            FeatureFlag.ENABLE_METRICS: True,
            FeatureFlag.ENABLE_BATCH_OPTIMIZATION: True,
            FeatureFlag.ENABLE_PRECISION_MODE: True,
            FeatureFlag.ENABLE_DISTRIBUTION_ANALYSIS: True,
            FeatureFlag.ENABLE_ADVANCED_VALIDATION: True,
        }
        
        # Caching system
        self.cache: Dict[str, CacheEntry] = {}
        self.cache_ttl = 300  # 5 minutes default TTL
        self.max_cache_size = 10000
        
        # Metrics collection
        self.metrics = EVMetrics()
        self.metrics_lock = asyncio.Lock()
        
        # Distribution tracking
        self.ev_samples = deque(maxlen=10000)
        self.tier_samples = deque(maxlen=10000)
        
        self.logger.info("Enhanced EV Engine initialized with hardening features")
    
    def set_feature_flag(self, flag: FeatureFlag, enabled: bool):
        """Enable/disable feature flags for A/B testing"""
        self.feature_flags[flag] = enabled
        self.logger.info(f"Feature flag {flag.value} set to {enabled}")
    
    def is_feature_enabled(self, flag: FeatureFlag) -> bool:
        """Check if a feature flag is enabled"""
        return self.feature_flags.get(flag, False)
    
    def _generate_cache_key(self, fair_odds: float, market_odds: float, 
                          analysis_type: str = "basic") -> str:
        """Generate normalized cache key for EV calculation"""
        # Normalize values to improve cache hit rates
        normalized_fair = round(fair_odds, 4)  # 4 decimal precision
        normalized_market = round(market_odds, 4)
        
        # Create consistent key format
        key_data = f"{normalized_fair}:{normalized_market}:{analysis_type}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _generate_batch_cache_key(self, opportunities: List[Dict[str, Any]]) -> str:
        """Generate cache key for batch operations with sorted normalization"""
        # Normalize and sort opportunities for consistent cache keys
        normalized_ops = []
        for op in opportunities:
            try:
                # Handle potential malformed data gracefully
                fair_odds = op.get('fair_odds', 0)
                market_odds = op.get('market_odds', 0)
                
                # Convert to float with error handling
                if isinstance(fair_odds, str):
                    try:
                        fair_odds = float(fair_odds)
                    except (ValueError, TypeError):
                        fair_odds = 0.0
                        
                if isinstance(market_odds, str):
                    try:
                        market_odds = float(market_odds)
                    except (ValueError, TypeError):
                        market_odds = 0.0
                        
                normalized_op = {
                    'fair_odds': round(float(fair_odds), 4),
                    'market_odds': round(float(market_odds), 4),
                    'analysis_type': op.get('analysis_type', 'basic')
                }
                normalized_ops.append(normalized_op)
            except Exception as e:
                # Log the error but continue processing
                self.logger.warning("Malformed opportunity in batch cache key generation", 
                                  opportunity=str(op), error=str(e))
                # Add a default entry for malformed data
                normalized_ops.append({
                    'fair_odds': 0.0,
                    'market_odds': 0.0,
                    'analysis_type': 'error'
                })
        
        # Sort by fair_odds, then market_odds for consistent ordering
        normalized_ops.sort(key=lambda x: (x['fair_odds'], x['market_odds'], x['analysis_type']))
        
        # Generate consistent key from sorted, normalized data
        key_data = json.dumps(normalized_ops, sort_keys=True)
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _get_from_cache(self, cache_key: str) -> Optional[Any]:
        """Retrieve value from cache if valid"""
        if not self.is_feature_enabled(FeatureFlag.ENABLE_CACHING):
            return None
            
        entry = self.cache.get(cache_key)
        if entry is None:
            return None
            
        if entry.is_expired():
            del self.cache[cache_key]
            return None
            
        entry.mark_accessed()
        return entry.value
    
    def _set_cache(self, cache_key: str, value: Any, ttl: Optional[float] = None):
        """Store value in cache"""
        if not self.is_feature_enabled(FeatureFlag.ENABLE_CACHING):
            return
            
        # Evict expired entries if cache is at or near capacity
        if len(self.cache) >= self.max_cache_size:
            self._evict_cache_entries()
        
        effective_ttl = ttl or self.cache_ttl
        self.cache[cache_key] = CacheEntry(
            value=value,
            timestamp=time.time(),
            ttl=effective_ttl
        )
    
    def _evict_cache_entries(self):
        """Evict expired and least recently used cache entries"""
        current_time = time.time()
        
        # First, remove expired entries
        expired_keys = [
            key for key, entry in self.cache.items()
            if entry.is_expired()
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        # If still at/over limit, remove LRU entries
        if len(self.cache) >= self.max_cache_size:
            sorted_entries = sorted(
                self.cache.items(),
                key=lambda x: x[1].last_access or 0
            )
            
            # Remove oldest entries to get under limit
            entries_to_remove = len(self.cache) - (self.max_cache_size - 1)
            for key, _ in sorted_entries[:max(0, entries_to_remove)]:
                del self.cache[key]
    
    async def _update_metrics(self, calculation_time: float, ev_result: float, 
                            tier: EVTier, cache_hit: bool, error: bool = False):
        """Update performance and accuracy metrics"""
        if not self.is_feature_enabled(FeatureFlag.ENABLE_METRICS):
            return
            
        async with self.metrics_lock:
            self.metrics.total_calculations += 1
            
            # Add to rolling window metrics
            self.metrics.add_rolling_calculation()
            
            if cache_hit:
                self.metrics.cache_hits += 1
                self.metrics.add_rolling_cache_hit()
            else:
                self.metrics.cache_misses += 1
            
            if error:
                self.metrics.error_count += 1
                self.metrics.add_rolling_error()
                return
                
            if self.metrics.calculation_times is not None:
                self.metrics.calculation_times.append(calculation_time)
            if self.metrics.ev_distribution is not None:
                self.metrics.ev_distribution.append(ev_result)
            if self.metrics.tier_counts is not None:
                self.metrics.tier_counts[tier.value] += 1
            
            # Update distribution samples
            if self.is_feature_enabled(FeatureFlag.ENABLE_DISTRIBUTION_ANALYSIS):
                self.ev_samples.append(ev_result)
                self.tier_samples.append(tier.value)
    
    def _advanced_validation(self, fair_odds: float, market_odds: float) -> Tuple[bool, str]:
        """Advanced input validation with detailed error reporting"""
        if not self.is_feature_enabled(FeatureFlag.ENABLE_ADVANCED_VALIDATION):
            return True, ""
        
        # Basic validation
        if fair_odds is None or market_odds is None:
            return False, "Odds cannot be None"
            
        try:
            fair_odds = float(fair_odds)
            market_odds = float(market_odds)
        except (ValueError, TypeError):
            return False, "Odds must be numeric"
            
        # Range validation
        if fair_odds <= 1.0:
            return False, f"Fair odds ({fair_odds}) must be > 1.0"
            
        if market_odds <= 1.0:
            return False, f"Market odds ({market_odds}) must be > 1.0"
        
        # Reasonableness checks
        if fair_odds > 100:
            return False, f"Fair odds ({fair_odds}) seem unreasonably high"
            
        if market_odds > 100:
            return False, f"Market odds ({market_odds}) seem unreasonably high"
        
        # Precision mode checks
        if self.is_feature_enabled(FeatureFlag.ENABLE_PRECISION_MODE):
            # Check for extreme disparities
            ratio = max(fair_odds, market_odds) / min(fair_odds, market_odds)
            if ratio > 10:
                return False, f"Extreme odds disparity detected (ratio: {ratio:.2f})"
        
        return True, ""
    
    async def compute_ev_enhanced(self, our_fair_odds: float, market_odds: float,
                                stakes: float = 1.0) -> Dict[str, Any]:
        """Enhanced EV computation with caching and metrics"""
        start_time = time.time()
        cache_hit = False
        
        try:
            # Advanced validation
            is_valid, error_msg = self._advanced_validation(our_fair_odds, market_odds)
            if not is_valid:
                await self._update_metrics(0, 0, EVTier.NEGATIVE, False, error=True)
                self.metrics.validation_failures += 1
                return {
                    "ev_percent": 0.0,
                    "tier": EVTier.NEGATIVE.value,
                    "error": error_msg,
                    "cache_hit": False,
                    "calculation_time_ms": 0
                }
            
            # Check cache first
            cache_key = self._generate_cache_key(our_fair_odds, market_odds)
            cached_result = self._get_from_cache(cache_key)
            
            if cached_result is not None:
                cache_hit = True
                calculation_time = time.time() - start_time
                await self._update_metrics(
                    calculation_time * 1000, 
                    cached_result["ev_percent"], 
                    EVTier(cached_result["tier"]), 
                    cache_hit
                )
                
                return {
                    **cached_result,
                    "cache_hit": True,
                    "calculation_time_ms": calculation_time * 1000
                }
            
            # Compute EV using base engine
            ev_percent = self.base_engine.compute_ev(our_fair_odds, market_odds)
            tier = self.base_engine.classify_ev(ev_percent)
            
            # Additional analysis for precision mode
            analysis_data = {}
            if self.is_feature_enabled(FeatureFlag.ENABLE_PRECISION_MODE):
                our_implied_prob = self.base_engine.implied_probability(our_fair_odds)
                market_implied_prob = self.base_engine.implied_probability(market_odds)
                edge = our_implied_prob - market_implied_prob
                
                analysis_data = {
                    "our_implied_probability": round(our_implied_prob, 4),
                    "market_implied_probability": round(market_implied_prob, 4),
                    "probability_edge": round(edge, 4),
                    "edge_confidence": "high" if abs(edge) > 5 else "moderate" if abs(edge) > 2 else "low"
                }
            
            result = {
                "ev_percent": round(ev_percent, 4),
                "tier": tier.value,
                "our_fair_odds": our_fair_odds,
                "market_odds": market_odds,
                "stakes": stakes,
                "timestamp": datetime.now().isoformat(),
                "cache_hit": False,
                **analysis_data
            }
            
            # Cache the result
            self._set_cache(cache_key, result)
            
            # Update metrics
            calculation_time = time.time() - start_time
            await self._update_metrics(calculation_time * 1000, ev_percent, tier, cache_hit)
            
            result["calculation_time_ms"] = calculation_time * 1000
            
            return result
            
        except Exception as e:
            calculation_time = time.time() - start_time
            await self._update_metrics(calculation_time * 1000, 0, EVTier.NEGATIVE, cache_hit, error=True)
            
            self.logger.error(f"Enhanced EV computation error: {e}")
            return {
                "ev_percent": 0.0,
                "tier": EVTier.NEGATIVE.value,
                "error": str(e),
                "cache_hit": cache_hit,
                "calculation_time_ms": calculation_time * 1000
            }
    
    async def batch_compute_ev(self, opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Optimized batch EV computation with caching"""
        if not self.is_feature_enabled(FeatureFlag.ENABLE_BATCH_OPTIMIZATION):
            # Fall back to individual computations
            results = []
            for opp in opportunities:
                result = await self.compute_ev_enhanced(
                    opp.get("fair_odds", 2.0),
                    opp.get("market_odds", 2.0)
                )
                results.append({**opp, **result})
            return results
        
        # Check batch cache first
        batch_cache_key = self._generate_batch_cache_key(opportunities)
        if batch_cache_key in self.cache:
            cached_result = self.cache[batch_cache_key]
            if time.time() - cached_result.timestamp < self.cache_ttl:
                self.metrics.cache_hits += 1
                return cached_result.value
        
        # Batch optimization with concurrent processing
        start_time = time.time()
        
        async def process_opportunity(opp):
            try:
                result = await self.compute_ev_enhanced(
                    opp.get("fair_odds", 2.0),
                    opp.get("market_odds", 2.0)
                )
                return {**opp, **result}
            except Exception as e:
                self.logger.error(f"Batch EV error for opportunity {opp.get('id', 'unknown')}: {e}")
                return {**opp, "error": str(e)}
        
        # Process opportunities concurrently
        tasks = [process_opportunity(opp) for opp in opportunities]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and log them
        valid_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                self.logger.error(f"Batch processing exception for opportunity {i}: {result}")
                valid_results.append({**opportunities[i], "error": str(result)})
            else:
                valid_results.append(result)
        
        total_time = time.time() - start_time
        # Log performance metrics
        log_performance("batch_ev_computation", total_time * 1000, 
                       opportunities_count=len(opportunities),
                       cache_enabled=self.is_feature_enabled(FeatureFlag.ENABLE_CACHING))
        self.logger.info("Batch EV computation completed", 
                        opportunities_processed=len(opportunities),
                        total_time_ms=total_time * 1000,
                        avg_time_per_opportunity_ms=(total_time * 1000) / len(opportunities) if opportunities else 0,
                        cache_enabled=self.is_feature_enabled(FeatureFlag.ENABLE_CACHING),
                        valid_results=len([r for r in valid_results if "error" not in r]))
        
        # Cache the batch results
        self.cache[batch_cache_key] = CacheEntry(
            value=valid_results,
            timestamp=time.time(),
            ttl=self.cache_ttl
        )
        self.metrics.cache_misses += 1
        
        # Manage cache size
        if len(self.cache) >= self.max_cache_size:
            self._evict_cache_entries()
        
        return valid_results
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get comprehensive metrics summary"""
        if not self.is_feature_enabled(FeatureFlag.ENABLE_METRICS):
            return {"error": "Metrics collection disabled"}
        
        cache_hit_rate = 0
        if self.metrics.total_calculations > 0:
            cache_hit_rate = self.metrics.cache_hits / self.metrics.total_calculations
        
        avg_calculation_time = 0
        if self.metrics.calculation_times:
            avg_calculation_time = statistics.mean(self.metrics.calculation_times)
        
        tier_counts = dict(self.metrics.tier_counts) if self.metrics.tier_counts else {}
        
        return {
            "total_calculations": self.metrics.total_calculations,
            "cache_hits": self.metrics.cache_hits,
            "cache_misses": self.metrics.cache_misses,
            "cache_hit_rate": round(cache_hit_rate, 4),
            "cache_size": len(self.cache),
            "average_calculation_time_ms": round(avg_calculation_time, 4),
            "error_rate": round(self.metrics.error_count / max(1, self.metrics.total_calculations), 4),
            "validation_failure_rate": round(self.metrics.validation_failures / max(1, self.metrics.total_calculations), 4),
            "tier_distribution": tier_counts,
            "feature_flags": {flag.value: enabled for flag, enabled in self.feature_flags.items()},
            "timestamp": datetime.now().isoformat()
        }
    
    def get_ev_distribution_summary(self) -> EVDistribution:
        """Generate comprehensive EV distribution analysis"""
        if not self.is_feature_enabled(FeatureFlag.ENABLE_DISTRIBUTION_ANALYSIS):
            raise ValueError("Distribution analysis disabled")
        
        if not self.ev_samples:
            raise ValueError("No EV samples available for analysis")
        
        ev_data = list(self.ev_samples)
        tier_data = list(self.tier_samples)
        
        # Calculate statistics
        mean_ev = statistics.mean(ev_data)
        median_ev = statistics.median(ev_data)
        std_dev = statistics.stdev(ev_data) if len(ev_data) > 1 else 0
        min_ev = min(ev_data)
        max_ev = max(ev_data)
        
        # Calculate percentiles
        sorted_ev = sorted(ev_data)
        percentiles = {
            "p5": sorted_ev[int(len(sorted_ev) * 0.05)],
            "p10": sorted_ev[int(len(sorted_ev) * 0.1)],
            "p25": sorted_ev[int(len(sorted_ev) * 0.25)],
            "p50": median_ev,
            "p75": sorted_ev[int(len(sorted_ev) * 0.75)],
            "p90": sorted_ev[int(len(sorted_ev) * 0.9)],
            "p95": sorted_ev[int(len(sorted_ev) * 0.95)],
            "p99": sorted_ev[int(len(sorted_ev) * 0.99)]
        }
        
        # Tier distribution
        tier_counts = defaultdict(int)
        for tier in tier_data:
            tier_counts[tier] += 1
        
        # Calculate ratios
        positive_ev_count = sum(1 for ev in ev_data if ev > 0)
        positive_ev_ratio = positive_ev_count / len(ev_data)
        
        high_ev_count = tier_counts.get(EVTier.HIGH.value, 0)
        
        return EVDistribution(
            sample_size=len(ev_data),
            mean_ev=round(mean_ev, 4),
            median_ev=round(median_ev, 4),
            std_dev=round(std_dev, 4),
            min_ev=round(min_ev, 4),
            max_ev=round(max_ev, 4),
            percentiles={k: round(v, 4) for k, v in percentiles.items()},
            tier_distribution=dict(tier_counts),
            positive_ev_ratio=round(positive_ev_ratio, 4),
            high_ev_opportunities=high_ev_count
        )
    
    def invalidate_cache(self, pattern: Optional[str] = None):
        """Invalidate cache entries matching pattern or all entries"""
        if pattern is None:
            self.cache.clear()
            self.logger.info("All cache entries invalidated")
        else:
            keys_to_delete = [key for key in self.cache.keys() if pattern in key]
            for key in keys_to_delete:
                del self.cache[key]
            self.logger.info(f"Invalidated {len(keys_to_delete)} cache entries matching '{pattern}'")
    
    def reset_metrics(self):
        """Reset all metrics and distribution data"""
        self.metrics = EVMetrics()
        self.ev_samples.clear()
        self.tier_samples.clear()
        self.logger.info("Metrics and distribution data reset")


# Global enhanced EV engine instance
enhanced_ev_engine = EnhancedEVEngine()