"""
Unified Data Pipeline - A1Betting7-13.2
Consolidates enterprise_data_pipeline.py and data_pipeline.py into optimized architecture.
Combines enterprise validation with simplified efficiency patterns.
"""

import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

import httpx
import numpy as np
import pandas as pd
import redis.asyncio as redis
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from backend.config import config_manager
from backend.middleware.caching import TTLCache

logger = logging.getLogger("propollama.unified_pipeline")

Base = declarative_base()


class DataSourceType(Enum):
    """Unified data source types"""

    PRIZEPICKS = "prizepicks"
    SPORTRADAR = "sportradar"
    ODDS_API = "odds_api"
    ESPN = "espn"
    YAHOO = "yahoo"
    MLB_STATS = "mlb_stats"
    BASEBALL_SAVANT = "baseball_savant"
    SPORTSBOOK = "sportsbook"
    PLAYER_STATS = "player_stats"
    INJURY_REPORTS = "injury_reports"
    WEATHER = "weather"
    LINE_MOVEMENT = "line_movement"
    SHARP_MONEY = "sharp_money"
    PUBLIC_BETTING = "public_betting"


class DataQuality(Enum):
    """Data quality assessment levels"""

    EXCELLENT = "excellent"  # 95-100% confidence
    GOOD = "good"  # 80-95% confidence
    FAIR = "fair"  # 60-80% confidence
    POOR = "poor"  # 40-60% confidence
    INVALID = "invalid"  # <40% confidence


class DataStatus(Enum):
    """Processing status enumeration"""

    SUCCESS = "success"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    TIMEOUT = "timeout"
    CACHED = "cached"
    STALE = "stale"
    PENDING = "pending"


@dataclass
class DataPoint:
    """Standardized data point with validation"""

    source: str
    source_type: DataSourceType
    data_id: str
    timestamp: datetime
    data: Dict[str, Any]
    quality: DataQuality = DataQuality.GOOD
    confidence: float = 0.8
    freshness_score: float = 1.0
    validation_errors: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    cache_ttl: int = 300
    priority: int = 1


@dataclass
class BatchRequest:
    """Batch processing request"""

    requests: List["DataRequest"]
    batch_id: str
    priority: int = 1
    max_parallel: int = 10
    timeout: int = 30


@dataclass
class DataRequest:
    """Enhanced data request with enterprise features"""

    source: DataSourceType
    endpoint: str
    params: Dict[str, Any] = field(default_factory=dict)
    headers: Dict[str, str] = field(default_factory=dict)
    timeout: int = 30
    retry_count: int = 3
    cache_ttl: int = 300
    priority: int = 1
    validation_rules: List["DataValidationRule"] = field(default_factory=list)

    def cache_key(self) -> str:
        """Generate cache key for request"""
        key_data = {
            "source": self.source.value,
            "endpoint": self.endpoint,
            "params": sorted(self.params.items()) if self.params else [],
        }
        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()


@dataclass
class DataValidationRule:
    """Validation rule for data quality"""

    field_name: str
    rule_type: str  # "required", "type", "range", "pattern", "custom"
    parameters: Dict[str, Any]
    error_message: str
    severity: str = "error"  # "error", "warning", "info"


@dataclass
class PipelineMetrics:
    """Unified pipeline performance metrics"""

    source: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    cache_hits: int = 0
    avg_response_time: float = 0.0
    error_rate: float = 0.0
    cache_hit_rate: float = 0.0
    last_update: Optional[datetime] = None
    data_quality_score: float = 0.0
    throughput_per_minute: float = 0.0


class OptimizedRateLimiter:
    """Enhanced rate limiter with sliding window"""

    def __init__(self, requests_per_minute: int = 60, burst_allowance: int = 10):
        self.requests_per_minute = requests_per_minute
        self.burst_allowance = burst_allowance
        self.requests: deque = deque()
        self.lock = asyncio.Lock()

    async def acquire(self, priority: int = 1) -> bool:
        """Acquire rate limit token with priority support"""
        async with self.lock:
            now = time.time()
            # Clean old requests (sliding window)
            while self.requests and now - self.requests[0] > 60:
                self.requests.popleft()

            # Check if we can make request
            if len(self.requests) < self.requests_per_minute:
                self.requests.append(now)
                return True

            # Allow burst for high priority requests
            if priority > 5 and len(self.requests) < (
                self.requests_per_minute + self.burst_allowance
            ):
                self.requests.append(now)
                return True

            return False

    async def wait_for_slot(self, priority: int = 1) -> None:
        """Wait for available slot with priority"""
        while not await self.acquire(priority):
            # High priority requests wait less
            wait_time = 1.0 if priority <= 5 else 0.5
            await asyncio.sleep(wait_time)


class DataValidator:
    """Comprehensive data validation engine"""

    def __init__(self):
        self.rules_cache = {}

    def validate_data(
        self, data: Any, rules: List[DataValidationRule]
    ) -> Tuple[DataQuality, List[str], float]:
        """Validate data against rules and return quality assessment"""
        if not rules:
            return DataQuality.GOOD, [], 0.8

        errors = []
        warnings = []

        for rule in rules:
            try:
                result = self._apply_rule(data, rule)
                if not result["valid"]:
                    if rule.severity == "error":
                        errors.append(f"{rule.field_name}: {rule.error_message}")
                    elif rule.severity == "warning":
                        warnings.append(f"{rule.field_name}: {rule.error_message}")
            except Exception as e:
                errors.append(f"{rule.field_name}: Validation error - {str(e)}")

        # Calculate quality score
        total_rules = len(rules)
        error_weight = len(errors) * 2  # Errors weigh more
        warning_weight = len(warnings) * 1

        if total_rules == 0:
            quality_score = 0.8
        else:
            quality_score = max(
                0.0, 1.0 - (error_weight + warning_weight) / (total_rules * 2)
            )

        # Map score to quality enum
        if quality_score >= 0.95:
            quality = DataQuality.EXCELLENT
        elif quality_score >= 0.8:
            quality = DataQuality.GOOD
        elif quality_score >= 0.6:
            quality = DataQuality.FAIR
        elif quality_score >= 0.4:
            quality = DataQuality.POOR
        else:
            quality = DataQuality.INVALID

        return quality, errors + warnings, quality_score

    def _apply_rule(self, data: Any, rule: DataValidationRule) -> Dict[str, Any]:
        """Apply single validation rule"""
        field_value = self._get_field_value(data, rule.field_name)

        if rule.rule_type == "required":
            return {"valid": field_value is not None}
        elif rule.rule_type == "type":
            expected_type = rule.parameters.get("type")
            return {"valid": isinstance(field_value, expected_type)}
        elif rule.rule_type == "range":
            min_val = rule.parameters.get("min")
            max_val = rule.parameters.get("max")
            if field_value is None:
                return {"valid": False}
            return {
                "valid": (min_val is None or field_value >= min_val)
                and (max_val is None or field_value <= max_val)
            }
        elif rule.rule_type == "pattern":
            import re

            pattern = rule.parameters.get("pattern")
            if field_value is None:
                return {"valid": False}
            return {"valid": bool(re.match(pattern, str(field_value)))}
        else:
            return {"valid": True}  # Unknown rule type passes

    def _get_field_value(self, data: Any, field_path: str) -> Any:
        """Get nested field value using dot notation"""
        try:
            value = data
            for field in field_path.split("."):
                if isinstance(value, dict):
                    value = value.get(field)
                else:
                    value = getattr(value, field, None)
            return value
        except:
            return None


class RedisConnectionPool:
    """Optimized Redis connection pool"""

    def __init__(self, redis_url: str = None, max_connections: int = 20):
        self.redis_url = redis_url or config_manager.get(
            "REDIS_URL", "redis://localhost:6379/0"
        )
        self.max_connections = max_connections
        self._pool = None

    async def get_pool(self) -> redis.ConnectionPool:
        """Get or create connection pool"""
        if self._pool is None:
            self._pool = redis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=self.max_connections,
                retry_on_timeout=True,
            )
        return self._pool

    @asynccontextmanager
    async def get_redis(self):
        """Get Redis client with connection pooling"""
        pool = await self.get_pool()
        client = redis.Redis(connection_pool=pool)
        try:
            yield client
        finally:
            await client.close()

    @asynccontextmanager
    async def get_pipeline(self):
        """Get Redis pipeline for batch operations"""
        async with self.get_redis() as client:
            pipeline = client.pipeline()
            try:
                yield pipeline
            finally:
                pass  # Pipeline cleanup handled by context


class UnifiedDataPipeline:
    """Main unified data pipeline class"""

    def __init__(self):
        self.rate_limiters = {}  # Per-source rate limiters
        self.validator = DataValidator()
        self.redis_pool = RedisConnectionPool()
        self.metrics = defaultdict(PipelineMetrics)
        self.cache = TTLCache(maxsize=10000, default_ttl=300)
        self.session_pool = {}  # HTTP session pool
        self.processing_queue = asyncio.Queue(maxsize=1000)
        self.batch_processor = None

    async def initialize(self):
        """Initialize pipeline components"""
        logger.info("Initializing Unified Data Pipeline...")

        # Initialize rate limiters for each source
        for source in DataSourceType:
            # Different rate limits based on source
            if source in [DataSourceType.SPORTRADAR, DataSourceType.MLB_STATS]:
                rpm = 120  # Higher limits for premium sources
            elif source in [DataSourceType.BASEBALL_SAVANT]:
                rpm = 60  # Medium limits
            else:
                rpm = 30  # Conservative limits for other sources
            self.rate_limiters[source] = OptimizedRateLimiter(rpm, burst_allowance=10)

        # Initialize HTTP session pool
        self.session_pool = {
            source: httpx.AsyncClient(
                timeout=httpx.Timeout(30.0),
                limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
            )
            for source in DataSourceType
        }

        # Start batch processor
        self.batch_processor = asyncio.create_task(self._batch_processor())

        logger.info("Unified Data Pipeline initialized successfully")

    async def cleanup(self):
        """Cleanup pipeline resources"""
        logger.info("Cleaning up Unified Data Pipeline...")

        # Cancel batch processor
        if self.batch_processor:
            self.batch_processor.cancel()
            try:
                await self.batch_processor
            except asyncio.CancelledError:
                pass

        # Close HTTP sessions
        for session in self.session_pool.values():
            await session.aclose()

        # Close Redis connections handled by context managers
        logger.info("Unified Data Pipeline cleanup complete")

    async def fetch_data(self, request: DataRequest) -> DataPoint:
        """Fetch single data point with full validation and caching"""
        start_time = time.time()
        source_metrics = self.metrics[request.source.value]
        source_metrics.total_requests += 1

        try:
            # Check cache first
            cache_key = request.cache_key()
            cached_data = await self._get_cached_data(cache_key)
            if cached_data:
                source_metrics.cache_hits += 1
                source_metrics.cache_hit_rate = (
                    source_metrics.cache_hits / source_metrics.total_requests
                )
                return cached_data

            # Rate limiting
            rate_limiter = self.rate_limiters[request.source]
            await rate_limiter.wait_for_slot(request.priority)

            # Fetch data
            response_data = await self._fetch_from_source(request)

            # Validate data
            quality, errors, confidence = self.validator.validate_data(
                response_data, request.validation_rules
            )

            # Create data point
            data_point = DataPoint(
                source=request.source.value,
                source_type=request.source,
                data_id=cache_key,
                timestamp=datetime.now(timezone.utc),
                data=response_data,
                quality=quality,
                confidence=confidence,
                validation_errors=errors,
                cache_ttl=request.cache_ttl,
            )

            # Cache if quality is acceptable
            if quality not in [DataQuality.INVALID, DataQuality.POOR]:
                await self._cache_data(cache_key, data_point)

            # Update metrics
            processing_time = time.time() - start_time
            source_metrics.successful_requests += 1
            source_metrics.avg_response_time = (
                source_metrics.avg_response_time
                * (source_metrics.successful_requests - 1)
                + processing_time
            ) / source_metrics.successful_requests
            source_metrics.data_quality_score = confidence
            source_metrics.last_update = datetime.now(timezone.utc)

            return data_point

        except Exception as e:
            # Handle errors
            source_metrics.failed_requests += 1
            source_metrics.error_rate = (
                source_metrics.failed_requests / source_metrics.total_requests
            )

            logger.error(f"Data fetch failed for {request.source.value}: {str(e)}")

            # Return error data point
            return DataPoint(
                source=request.source.value,
                source_type=request.source,
                data_id=request.cache_key(),
                timestamp=datetime.now(timezone.utc),
                data={},
                quality=DataQuality.INVALID,
                confidence=0.0,
                validation_errors=[f"Fetch error: {str(e)}"],
            )

    async def fetch_batch(
        self, requests: List[DataRequest], max_parallel: int = 10
    ) -> List[DataPoint]:
        """Fetch multiple data points in parallel with controlled concurrency"""
        if not requests:
            return []

        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(max_parallel)

        async def fetch_with_semaphore(request: DataRequest) -> DataPoint:
            async with semaphore:
                return await self.fetch_data(request)

        # Execute all requests in parallel
        tasks = [fetch_with_semaphore(req) for req in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions and convert to DataPoints
        data_points = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Batch request {i} failed: {str(result)}")
                # Create error data point
                error_point = DataPoint(
                    source=requests[i].source.value,
                    source_type=requests[i].source,
                    data_id=requests[i].cache_key(),
                    timestamp=datetime.now(timezone.utc),
                    data={},
                    quality=DataQuality.INVALID,
                    confidence=0.0,
                    validation_errors=[f"Batch error: {str(result)}"],
                )
                data_points.append(error_point)
            else:
                data_points.append(result)

        return data_points

    async def _fetch_from_source(self, request: DataRequest) -> Dict[str, Any]:
        """Fetch data from specific source"""
        session = self.session_pool[request.source]

        try:
            response = await session.get(
                request.endpoint,
                params=request.params,
                headers=request.headers,
                timeout=request.timeout,
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Source fetch error for {request.source.value}: {str(e)}")
            raise

    async def _get_cached_data(self, cache_key: str) -> Optional[DataPoint]:
        """Get data from cache with Redis fallback"""
        # Check memory cache first
        if cache_key in self.cache:
            return self.cache[cache_key]

        # Check Redis cache
        try:
            async with self.redis_pool.get_redis() as redis_client:
                cached_json = await redis_client.get(f"pipeline:{cache_key}")
                if cached_json:
                    cached_dict = json.loads(cached_json)
                    # Reconstruct DataPoint
                    data_point = DataPoint(**cached_dict)
                    # Update memory cache
                    self.cache[cache_key] = data_point
                    return data_point
        except Exception as e:
            logger.warning(f"Redis cache read error: {str(e)}")

        return None

    async def _cache_data(self, cache_key: str, data_point: DataPoint):
        """Cache data in both memory and Redis"""
        # Cache in memory
        self.cache[cache_key] = data_point

        # Cache in Redis for persistence
        try:
            async with self.redis_pool.get_redis() as redis_client:
                data_dict = asdict(data_point)
                # Convert datetime to ISO string for JSON serialization
                data_dict["timestamp"] = data_point.timestamp.isoformat()
                cached_json = json.dumps(data_dict, default=str)
                await redis_client.setex(
                    f"pipeline:{cache_key}", data_point.cache_ttl, cached_json
                )
        except Exception as e:
            logger.warning(f"Redis cache write error: {str(e)}")

    async def _batch_processor(self):
        """Background batch processor for queued requests"""
        while True:
            try:
                # Wait for batch requests
                batch_requests = []
                timeout = 0.1  # 100ms batch window

                try:
                    # Get first request
                    first_request = await asyncio.wait_for(
                        self.processing_queue.get(), timeout=1.0
                    )
                    batch_requests.append(first_request)

                    # Collect additional requests within batch window
                    start_time = time.time()
                    while (time.time() - start_time) < timeout and len(
                        batch_requests
                    ) < 50:
                        try:
                            additional_request = await asyncio.wait_for(
                                self.processing_queue.get(), timeout=timeout
                            )
                            batch_requests.append(additional_request)
                        except asyncio.TimeoutError:
                            break

                    # Process batch
                    if batch_requests:
                        await self.fetch_batch(batch_requests)

                except asyncio.TimeoutError:
                    # No requests to process
                    continue

            except Exception as e:
                logger.error(f"Batch processor error: {str(e)}")
                await asyncio.sleep(1)

    def get_metrics(self) -> Dict[str, PipelineMetrics]:
        """Get current pipeline metrics"""
        return dict(self.metrics)

    async def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check"""
        health_status = {
            "pipeline_status": "healthy",
            "redis_connection": False,
            "source_metrics": {},
            "cache_stats": {
                "memory_cache_size": len(self.cache),
                "memory_cache_hit_rate": 0.0,
            },
            "processing_queue_size": self.processing_queue.qsize(),
            "batch_processor_running": self.batch_processor
            and not self.batch_processor.done(),
        }

        # Test Redis connection
        try:
            async with self.redis_pool.get_redis() as redis_client:
                await redis_client.ping()
                health_status["redis_connection"] = True
        except Exception as e:
            health_status["redis_connection"] = False
            health_status["redis_error"] = str(e)

        # Add source metrics
        for source, metrics in self.metrics.items():
            health_status["source_metrics"][source] = {
                "total_requests": metrics.total_requests,
                "error_rate": metrics.error_rate,
                "cache_hit_rate": metrics.cache_hit_rate,
                "avg_response_time": metrics.avg_response_time,
                "data_quality_score": metrics.data_quality_score,
            }

        return health_status


# Global pipeline instance
unified_pipeline = UnifiedDataPipeline()


# Convenience functions for backward compatibility
async def fetch_data_unified(
    source: DataSourceType, endpoint: str, params: Dict[str, Any] = None, **kwargs
) -> DataPoint:
    """Convenience function for single data fetch"""
    request = DataRequest(
        source=source, endpoint=endpoint, params=params or {}, **kwargs
    )
    return await unified_pipeline.fetch_data(request)


async def fetch_batch_unified(requests: List[DataRequest]) -> List[DataPoint]:
    """Convenience function for batch fetch"""
    return await unified_pipeline.fetch_batch(requests)
