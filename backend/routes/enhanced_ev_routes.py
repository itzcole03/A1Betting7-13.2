"""
Enhanced EV Routes - API endpoints for hardened EV engine functionality

Provides endpoints for:
- Enhanced EV calculations with caching and metrics
- Batch EV processing with optimization
- Feature flag management
- Metrics and performance monitoring
- EV distribution analysis and summary
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
from datetime import datetime

from backend.services.enhanced_ev_engine import enhanced_ev_engine, FeatureFlag, EVDistribution

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class EnhancedEVRequest(BaseModel):
    """Request model for enhanced EV calculation"""
    fair_odds: float = Field(..., gt=1.0, description="Our fair odds assessment (decimal format)")
    market_odds: float = Field(..., gt=1.0, description="Market offered odds (decimal format)")
    stakes: float = Field(1.0, gt=0, description="Betting stakes amount")


class BatchEVRequest(BaseModel):
    """Request model for batch EV processing"""
    opportunities: List[Dict[str, Any]] = Field(..., description="List of betting opportunities")
    use_optimization: bool = Field(True, description="Enable batch optimization")


class FeatureFlagRequest(BaseModel):
    """Request model for feature flag management"""
    flag: str = Field(..., description="Feature flag name")
    enabled: bool = Field(..., description="Enable/disable flag")


class EVResponse(BaseModel):
    """Response model for EV calculations"""
    success: bool
    data: Dict[str, Any]
    error: Optional[str] = None
    timestamp: str


# API Endpoints

@router.post("/enhanced/calculate", response_model=EVResponse)
async def calculate_enhanced_ev(request: EnhancedEVRequest):
    """
    Calculate enhanced EV with caching, metrics, and advanced validation
    
    Returns:
        - Enhanced EV percentage with tier classification
        - Cache hit status and performance metrics
        - Advanced analysis data (if precision mode enabled)
        - Validation results and error handling
    """
    try:
        result = await enhanced_ev_engine.compute_ev_enhanced(
            our_fair_odds=request.fair_odds,
            market_odds=request.market_odds,
            stakes=request.stakes
        )
        
        return EVResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Enhanced EV calculation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"EV calculation failed: {str(e)}"
        )


@router.post("/enhanced/batch", response_model=EVResponse)
async def batch_calculate_ev(request: BatchEVRequest):
    """
    Process multiple EV calculations with batch optimization
    
    Features:
        - Concurrent processing for improved performance
        - Batch caching and optimization
        - Error handling for individual opportunities
        - Comprehensive metrics collection
    """
    if not request.opportunities:
        raise HTTPException(status_code=400, detail="No opportunities provided")
    
    try:
        
        # Enable/disable batch optimization based on request
        original_flag = enhanced_ev_engine.is_feature_enabled(FeatureFlag.ENABLE_BATCH_OPTIMIZATION)
        enhanced_ev_engine.set_feature_flag(FeatureFlag.ENABLE_BATCH_OPTIMIZATION, request.use_optimization)
        
        try:
            results = await enhanced_ev_engine.batch_compute_ev(request.opportunities)
            
            return EVResponse(
                success=True,
                data={
                    "opportunities": results,
                    "total_processed": len(results),
                    "optimization_enabled": request.use_optimization,
                    "batch_summary": {
                        "successful": len([r for r in results if "error" not in r]),
                        "errors": len([r for r in results if "error" in r]),
                        "positive_ev": len([r for r in results if r.get("ev_percent", 0) > 0])
                    }
                },
                timestamp=datetime.now().isoformat()
            )
            
        finally:
            # Restore original flag setting
            enhanced_ev_engine.set_feature_flag(FeatureFlag.ENABLE_BATCH_OPTIMIZATION, original_flag)
            
    except Exception as e:
        logger.error(f"Batch EV calculation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch EV calculation failed: {str(e)}"
        )


@router.get("/metrics", response_model=EVResponse)
async def get_ev_metrics():
    """
    Get comprehensive EV engine metrics and performance data
    
    Returns:
        - Cache hit rates and performance statistics
        - Error rates and validation metrics
        - Tier distribution and calculation times
        - Feature flag status
    """
    try:
        metrics = enhanced_ev_engine.get_metrics_summary()
        
        return EVResponse(
            success=True,
            data=metrics,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Metrics retrieval error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve metrics: {str(e)}"
        )


@router.get("/enhanced/metrics/rolling", response_model=EVResponse)
async def get_rolling_metrics(window_minutes: int = Query(15, ge=1, le=60, description="Time window in minutes (1-60)")):
    """
    Get rolling window metrics for real-time dashboard monitoring
    
    Returns:
        - Calculations, errors, and cache hits per minute
        - Rolling error rates and cache hit rates
        - Real-time performance indicators
        - Configurable time window (1-60 minutes)
    """
    try:
        rolling_metrics = enhanced_ev_engine.metrics.get_rolling_metrics(window_minutes)
        
        return EVResponse(
            success=True,
            data={
                "rolling_window": rolling_metrics,
                "performance_status": {
                    "status": "healthy" if rolling_metrics["error_rate"] < 0.05 else "degraded",
                    "load_level": "high" if rolling_metrics["calculations_per_minute"] > 10 else "moderate" if rolling_metrics["calculations_per_minute"] > 2 else "low",
                    "cache_efficiency": "excellent" if rolling_metrics["cache_hit_rate"] > 0.8 else "good" if rolling_metrics["cache_hit_rate"] > 0.5 else "poor"
                },
                "alerts": {
                    "high_error_rate": rolling_metrics["error_rate"] > 0.1,
                    "low_cache_hit_rate": rolling_metrics["cache_hit_rate"] < 0.3 and rolling_metrics["calculations_total"] > 10,
                    "high_load": rolling_metrics["calculations_per_minute"] > 20
                }
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Rolling metrics retrieval error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve rolling metrics: {str(e)}"
        )


@router.get("/distribution", response_model=EVResponse)
async def get_ev_distribution():
    """
    Get comprehensive EV distribution analysis and summary statistics
    
    Returns:
        - Sample size and statistical measures (mean, median, std dev)
        - Percentile analysis (p10, p25, p50, p75, p90, p95, p99)
        - Tier distribution breakdown
        - Positive EV ratio and high-value opportunities
    """
    try:
        distribution = enhanced_ev_engine.get_ev_distribution_summary()
        
        return EVResponse(
            success=True,
            data={
                "distribution_analysis": {
                    "sample_size": distribution.sample_size,
                    "statistical_measures": {
                        "mean_ev": distribution.mean_ev,
                        "median_ev": distribution.median_ev,
                        "std_dev": distribution.std_dev,
                        "min_ev": distribution.min_ev,
                        "max_ev": distribution.max_ev
                    },
                    "percentiles": distribution.percentiles,
                    "tier_distribution": distribution.tier_distribution,
                    "opportunity_metrics": {
                        "positive_ev_ratio": distribution.positive_ev_ratio,
                        "high_ev_opportunities": distribution.high_ev_opportunities,
                        "total_opportunities": distribution.sample_size
                    }
                },
                "analysis_metadata": {
                    "timestamp": datetime.now().isoformat(),
                    "data_quality": "high" if distribution.sample_size > 100 else "moderate" if distribution.sample_size > 20 else "low"
                }
            },
            timestamp=datetime.now().isoformat()
        )
        
    except ValueError as e:
        logger.warning(f"Distribution analysis error: {e}")
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Distribution analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze distribution: {str(e)}"
        )


@router.post("/feature-flags", response_model=EVResponse)
async def manage_feature_flag(request: FeatureFlagRequest):
    """
    Enable/disable feature flags for A/B testing and configuration
    
    Available flags:
        - enable_caching: Intelligent caching with TTL
        - enable_metrics: Comprehensive metrics collection
        - enable_batch_optimization: Batch processing optimization
        - enable_precision_mode: Advanced precision and validation
        - enable_distribution_analysis: EV distribution tracking
        - enable_advanced_validation: Enhanced input validation
    """
    try:
        # Validate flag name
        flag_map = {
            "enable_caching": FeatureFlag.ENABLE_CACHING,
            "enable_metrics": FeatureFlag.ENABLE_METRICS,
            "enable_batch_optimization": FeatureFlag.ENABLE_BATCH_OPTIMIZATION,
            "enable_precision_mode": FeatureFlag.ENABLE_PRECISION_MODE,
            "enable_distribution_analysis": FeatureFlag.ENABLE_DISTRIBUTION_ANALYSIS,
            "enable_advanced_validation": FeatureFlag.ENABLE_ADVANCED_VALIDATION
        }
        
        if request.flag not in flag_map:
            available_flags = list(flag_map.keys())
            raise HTTPException(
                status_code=400,
                detail=f"Invalid flag '{request.flag}'. Available flags: {available_flags}"
            )
        
        # Update feature flag
        flag_enum = flag_map[request.flag]
        enhanced_ev_engine.set_feature_flag(flag_enum, request.enabled)
        
        # Get updated feature flag status
        current_flags = {
            flag.value: enhanced_ev_engine.is_feature_enabled(flag)
            for flag in FeatureFlag
        }
        
        return EVResponse(
            success=True,
            data={
                "updated_flag": request.flag,
                "new_status": request.enabled,
                "all_flags": current_flags
            },
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Feature flag management error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to manage feature flag: {str(e)}"
        )


@router.get("/feature-flags", response_model=EVResponse)
async def get_feature_flags():
    """Get current status of all feature flags"""
    try:
        current_flags = {
            flag.value: enhanced_ev_engine.is_feature_enabled(flag)
            for flag in FeatureFlag
        }
        
        return EVResponse(
            success=True,
            data={
                "feature_flags": current_flags,
                "flag_descriptions": {
                    "enable_caching": "Intelligent caching with TTL and invalidation",
                    "enable_metrics": "Comprehensive metrics and performance tracking",
                    "enable_batch_optimization": "Batch processing with concurrent optimization",
                    "enable_precision_mode": "Advanced precision analysis and edge confidence",
                    "enable_distribution_analysis": "EV distribution tracking and analysis",
                    "enable_advanced_validation": "Enhanced input validation with detailed errors"
                }
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Feature flags retrieval error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve feature flags: {str(e)}"
        )


@router.post("/cache/invalidate", response_model=EVResponse)
async def invalidate_cache(
    pattern: Optional[str] = Query(None, description="Pattern to match cache keys (optional)")
):
    """
    Invalidate cache entries
    
    Args:
        pattern: Optional pattern to match specific cache keys
                If not provided, all cache entries will be invalidated
    """
    try:
        enhanced_ev_engine.invalidate_cache(pattern)
        
        return EVResponse(
            success=True,
            data={
                "message": f"Cache invalidated" + (f" for pattern '{pattern}'" if pattern else " (all entries)"),
                "cache_size_after": len(enhanced_ev_engine.cache),
                "pattern_used": pattern
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to invalidate cache: {str(e)}"
        )


@router.post("/metrics/reset", response_model=EVResponse)
async def reset_metrics():
    """
    Reset all metrics and distribution data
    
    Warning: This will clear all historical performance data
    """
    try:
        enhanced_ev_engine.reset_metrics()
        
        return EVResponse(
            success=True,
            data={
                "message": "Metrics and distribution data reset successfully",
                "reset_timestamp": datetime.now().isoformat()
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Metrics reset error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset metrics: {str(e)}"
        )


@router.get("/enhanced/health", response_model=EVResponse)
async def ev_engine_health():
    """
    Health check endpoint for enhanced EV engine
    
    Returns:
        - Engine status and feature flag states
        - Cache health and metrics status
        - System readiness indicators
    """
    try:
        # Get basic metrics for health assessment
        metrics = enhanced_ev_engine.get_metrics_summary()
        
        # Determine health status
        health_status = "healthy"
        health_issues = []
        
        # Check for high error rates
        if metrics.get("error_rate", 0) > 0.1:  # >10% error rate
            health_status = "degraded"
            health_issues.append(f"High error rate: {metrics['error_rate']:.2%}")
        
        # Check cache performance
        if metrics.get("cache_hit_rate", 0) < 0.5 and metrics.get("total_calculations", 0) > 100:
            health_status = "degraded"
            health_issues.append(f"Low cache hit rate: {metrics['cache_hit_rate']:.2%}")
        
        return EVResponse(
            success=True,
            data={
                "status": health_status,
                "issues": health_issues,
                "engine_info": {
                    "total_calculations": metrics.get("total_calculations", 0),
                    "cache_size": metrics.get("cache_size", 0),
                    "features_enabled": sum(1 for enabled in enhanced_ev_engine.feature_flags.values() if enabled),
                    "features_total": len(enhanced_ev_engine.feature_flags)
                },
                "uptime_info": {
                    "cache_entries": len(enhanced_ev_engine.cache),
                    "distribution_samples": len(enhanced_ev_engine.ev_samples),
                    "tier_samples": len(enhanced_ev_engine.tier_samples)
                }
            },
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return EVResponse(
            success=False,
            data={"status": "unhealthy"},
            error=str(e),
            timestamp=datetime.now().isoformat()
        )