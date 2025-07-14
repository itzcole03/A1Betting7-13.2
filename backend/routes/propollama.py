"""PropOllama endpoints for advanced sports betting analysis."""

import asyncio
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator

from backend.utils.circuit_breaker import CircuitBreaker
from backend.utils.llm_engine import llm_engine
from backend.utils.rate_limiter import RateLimiter

router = APIRouter()

# Rate limiting configuration
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 30
rate_limiter = RateLimiter(RATE_LIMIT_WINDOW, RATE_LIMIT_MAX_REQUESTS)

# Response cache configuration
CACHE_TTL = 300  # 5 minutes
response_cache: Dict[str, Dict] = {}
cache_timestamps: Dict[str, float] = {}


class BetAnalysisRequest(BaseModel):
    """Request model for bet analysis"""

    player_name: str = Field(..., min_length=2, max_length=100)
    stat_type: str = Field(..., min_length=2, max_length=50)
    line: float = Field(..., gt=0)
    odds: str = Field(..., pattern=r"^[+-]?[0-9]+$")
    context: Optional[Dict] = Field(default=None)

    @field_validator("player_name")
    @classmethod
    def validate_player_name(cls, v: str) -> str:
        """Validate player name"""
        if not v.replace(" ", "").isalnum():
            raise ValueError(
                "Player name must contain only letters, numbers, and spaces"
            )
        return v.strip()

    @field_validator("stat_type")
    @classmethod
    def validate_stat_type(cls, v: str) -> str:
        """Validate stat type"""
        valid_stats = {
            "points",
            "rebounds",
            "assists",
            "threes",
            "blocks",
            "steals",
            "runs",
            "hits",
            "strikeouts",
            "bases",
            "rbis",
            "goals",
            "saves",
            "shots",
            "passes",
            "tackles",
        }
        if v.lower() not in valid_stats:
            raise ValueError(
                f"Invalid stat type. Must be one of: {', '.join(valid_stats)}"
            )
        return v.lower()

    @field_validator("odds")
    @classmethod
    def validate_odds(cls, v: str) -> str:
        """Validate odds format"""
        try:
            odds = int(v)
            if abs(odds) < 100:
                raise ValueError("Odds must be at least ±100")
            return v
        except ValueError:
            raise ValueError("Odds must be a valid integer (e.g., +150, -110)")


class BetAnalysisResponse(BaseModel):
    """Response model for bet analysis"""

    analysis: str
    confidence: float = Field(..., ge=0, le=1)
    recommendation: str
    key_factors: List[str]
    processing_time: float
    cached: bool = False


async def check_rate_limit(request: Request) -> None:
    """Check rate limit for the request"""
    client_ip = request.client.host
    if not await rate_limiter.check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "reset_in": await rate_limiter.time_until_reset(client_ip),
                "limit": RATE_LIMIT_MAX_REQUESTS,
                "window": RATE_LIMIT_WINDOW,
            },
        )


def get_cache_key(request: BetAnalysisRequest) -> str:
    """Generate cache key for request"""
    return f"{request.player_name}:{request.stat_type}:{request.line}:{request.odds}"


def is_cache_valid(cache_key: str) -> bool:
    """Check if cached response is still valid"""
    return (
        cache_key in cache_timestamps
        and time.time() - cache_timestamps[cache_key] < CACHE_TTL
    )


@router.post("/best-bets-unified", response_model=BetAnalysisResponse)
async def analyze_bet_unified(
    request: BetAnalysisRequest,
    req: Request,
    rate_limit: None = Depends(check_rate_limit),
) -> Dict:
    """Analyze a bet with enhanced validation, caching, and fallback"""
    start_time = time.time()
    cache_key = get_cache_key(request)
    try:
        # Check cache first
        if is_cache_valid(cache_key):
            cached_response = response_cache[cache_key]
            cached_response["processing_time"] = time.time() - start_time
            cached_response["cached"] = True
            return cached_response

        # Ensure LLM engine is ready
        if not await llm_engine.ensure_initialized():
            raise HTTPException(status_code=503, detail="LLM engine not ready")

        # Try LLM analysis with circuit breaker
        try:
            analysis = await llm_engine.analyze_prop_bet(
                player_name=request.player_name,
                stat_type=request.stat_type,
                line=request.line,
                odds=request.odds,
                context_data=request.context,
            )
        except RuntimeError as cb_exc:
            # Circuit breaker open: fallback to cache or default
            if is_cache_valid(cache_key):
                cached_response = response_cache[cache_key]
                cached_response["processing_time"] = time.time() - start_time
                cached_response["cached"] = True
                cached_response["fallback_reason"] = "circuit_breaker_open"
                return cached_response
            else:
                return {
                    "analysis": "Service temporarily unavailable (circuit breaker open)",
                    "confidence": 0.0,
                    "recommendation": "No recommendation",
                    "key_factors": ["No analysis available"],
                    "processing_time": time.time() - start_time,
                    "cached": False,
                    "fallback_reason": "circuit_breaker_open",
                }
        except Exception as e:
            # LLM call failed: fallback to cache or default
            if is_cache_valid(cache_key):
                cached_response = response_cache[cache_key]
                cached_response["processing_time"] = time.time() - start_time
                cached_response["cached"] = True
                cached_response["fallback_reason"] = "llm_error"
                return cached_response
            else:
                return {
                    "analysis": f"Analysis failed: {str(e)}",
                    "confidence": 0.0,
                    "recommendation": "No recommendation",
                    "key_factors": ["No analysis available"],
                    "processing_time": time.time() - start_time,
                    "cached": False,
                    "fallback_reason": "llm_error",
                }

        # Extract confidence and key factors
        confidence = 0.0
        key_factors = []
        recommendation = ""

        # Parse the analysis
        lines = analysis.split("\n")
        for line in lines:
            line = line.strip()
            if "Confidence level:" in line:
                try:
                    conf_level = int(line.split(":")[1].strip().split("/")[0])
                    confidence = conf_level / 10.0
                except (ValueError, IndexError):
                    confidence = 0.5
            elif line.startswith("- "):
                key_factors.append(line[2:])
            elif "Recommendation:" in line:
                recommendation = line.split(":")[1].strip()

        if not recommendation:
            recommendation = "No clear recommendation available"

        if not key_factors:
            key_factors = ["Analysis available but no key factors extracted"]

        # Prepare response
        response = {
            "analysis": analysis,
            "confidence": confidence,
            "recommendation": recommendation,
            "key_factors": key_factors,
            "processing_time": time.time() - start_time,
            "cached": False,
        }

        # Cache the response
        response_cache[cache_key] = response.copy()
        cache_timestamps[cache_key] = time.time()

        return response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Analysis failed",
                "message": str(e),
                "request_id": str(int(time.time())),
                "player": request.player_name,
                "stat": request.stat_type,
            },
        )


@router.get("/cache/stats")
async def get_cache_stats() -> Dict:
    """Get cache statistics"""
    current_time = time.time()
    return {
        "total_entries": len(response_cache),
        "valid_entries": sum(
            1 for ts in cache_timestamps.values() if current_time - ts < CACHE_TTL
        ),
        "cache_hit_rate": rate_limiter.get_cache_hit_rate(),
        "oldest_entry": min(cache_timestamps.values()) if cache_timestamps else None,
        "newest_entry": max(cache_timestamps.values()) if cache_timestamps else None,
    }


@router.post("/cache/clear")
async def clear_cache() -> Dict:
    """Clear the response cache"""
    response_cache.clear()
    cache_timestamps.clear()
    return {"status": "Cache cleared successfully"}


# Cleanup task for expired cache entries
async def cleanup_expired_cache():
    """Periodically clean up expired cache entries"""
    while True:
        current_time = time.time()
        expired_keys = [
            key
            for key, timestamp in cache_timestamps.items()
            if current_time - timestamp >= CACHE_TTL
        ]
        for key in expired_keys:
            del response_cache[key]
            del cache_timestamps[key]
        await asyncio.sleep(60)  # Run every minute


# Cleanup task will be started when the router is included
