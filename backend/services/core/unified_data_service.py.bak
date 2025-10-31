"""
Unified Data Service - Consolidates all data-related services
Replaces: real_data_service.py, optimized_data_service.py, real_data_integration.py,
         data_validation_integration.py, enhanced_data_validation_integration.py,
         optimized_data_validation_orchestrator.py
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Union, Callable, Type
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from abc import ABC, abstractmethod
from enum import Enum
import aiohttp
import json
from contextlib import asynccontextmanager
import time
from functools import wraps

from .unified_cache_service import UnifiedCacheService, CacheLevel, cache_decorator

logger = logging.getLogger(__name__)

class DataSourceType(Enum):
    """Data source types"""
    ESPN = "espn"
    SPORTSRADAR = "sportsradar"
    BASEBALL_SAVANT = "baseball_savant"
    NBA_API = "nba_api"
    NFL_API = "nfl_api"
    NHL_API = "nhl_api"
    PRIZEPICKS = "prizepicks"
    DRAFTKINGS = "draftkings"
    FANDUEL = "fanduel"
    CAESARS = "caesars"
    BETMGM = "betmgm"
    ODDS_API = "odds_api"

class DataQuality(Enum):
    """Data quality levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INVALID = "invalid"

@dataclass
class DataSourceConfig:
    """Configuration for a data source"""
    source_type: DataSourceType
    base_url: str
    api_key: Optional[str] = None
    rate_limit: int = 100  # requests per minute
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: float = 1.0
    headers: Dict[str, str] = field(default_factory=dict)
    enabled: bool = True
    priority: int = 1  # Lower number = higher priority

@dataclass
class DataValidationRule:
    """Data validation rule"""
    field: str
    rule_type: str  # required, type, range, regex, custom
    rule_value: Any
    error_message: str
    severity: str = "error"  # error, warning, info

@dataclass
class DataValidationResult:
    """Result of data validation"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    quality_score: float
    quality_level: DataQuality
    validation_time: datetime

@dataclass
class DataMetrics:
    """Data source metrics"""
    source_type: DataSourceType
    requests_count: int = 0
    success_count: int = 0
    error_count: int = 0
    avg_response_time: float = 0.0
    last_success: Optional[datetime] = None
    last_error: Optional[datetime] = None
    rate_limit_hits: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    
    @property
    def success_rate(self) -> float:
        if self.requests_count == 0:
            return 0.0
        return self.success_count / self.requests_count
    
    @property
    def error_rate(self) -> float:
        if self.requests_count == 0:
            return 0.0
        return self.error_count / self.requests_count

class RateLimiter:
    """Rate limiter for API calls"""
    def __init__(self, max_requests: int, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []
    
    async def acquire(self) -> bool:
        """Acquire rate limit token"""
        now = time.time()
        
        # Remove old requests outside time window
        self.requests = [req_time for req_time in self.requests 
                        if now - req_time < self.time_window]
        
        if len(self.requests) >= self.max_requests:
            return False
        
        self.requests.append(now)
        return True
    
    async def wait_if_needed(self):
        """Wait if rate limit would be exceeded"""
        while not await self.acquire():
            await asyncio.sleep(0.1)

class CircuitBreaker:
    """Circuit breaker for data source resilience"""
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open
    
    def can_execute(self) -> bool:
        """Check if execution is allowed"""
        if self.state == "closed":
            return True
        elif self.state == "open":
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = "half_open"
                return True
            return False
        else:  # half_open
            return True
    
    def record_success(self):
        """Record successful execution"""
        self.failure_count = 0
        self.state = "closed"
    
    def record_failure(self):
        """Record failed execution"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"

class DataSourceAdapter(ABC):
    """Abstract base class for data source adapters"""
    
    def __init__(self, config: DataSourceConfig):
        self.config = config
        self.rate_limiter = RateLimiter(config.rate_limit)
        self.circuit_breaker = CircuitBreaker()
        self.metrics = DataMetrics(source_type=config.source_type)
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def initialize(self):
        """Initialize the adapter"""
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        self.session = aiohttp.ClientSession(
            headers=self.config.headers,
            timeout=timeout
        )
    
    async def close(self):
        """Close the adapter"""
        if self.session:
            await self.session.close()
    
    @abstractmethod
    async def fetch_data(self, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Fetch data from the source"""
        pass
    
    @abstractmethod
    def validate_response(self, data: Dict[str, Any]) -> DataValidationResult:
        """Validate response data"""
        pass
    
    async def get_with_retry(self, url: str, **kwargs) -> Dict[str, Any]:
        """Get data with retry logic"""
        if not self.circuit_breaker.can_execute():
            raise Exception(f"Circuit breaker open for {self.config.source_type}")
        
        await self.rate_limiter.wait_if_needed()
        
        for attempt in range(self.config.retry_attempts):
            try:
                start_time = time.time()
                self.metrics.requests_count += 1
                
                async with self.session.get(url, **kwargs) as response:
                    response_time = time.time() - start_time
                    self._update_response_time(response_time)
                    
                    response.raise_for_status()
                    data = await response.json()
                    
                    self.metrics.success_count += 1
                    self.metrics.last_success = datetime.now()
                    self.circuit_breaker.record_success()
                    
                    return data
                    
            except Exception as e:
                self.metrics.error_count += 1
                self.metrics.last_error = datetime.now()
                
                if attempt == self.config.retry_attempts - 1:
                    self.circuit_breaker.record_failure()
                    raise e
                
                await asyncio.sleep(self.config.retry_delay * (2 ** attempt))
        
        raise Exception(f"Failed after {self.config.retry_attempts} attempts")
    
    def _update_response_time(self, response_time: float):
        """Update average response time"""
        if self.metrics.avg_response_time == 0:
            self.metrics.avg_response_time = response_time
        else:
            # Exponential moving average
            self.metrics.avg_response_time = (
                0.9 * self.metrics.avg_response_time + 
                0.1 * response_time
            )

class ESPNAdapter(DataSourceAdapter):
    """ESPN API adapter"""
    
    async def fetch_data(self, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.config.base_url}/{endpoint}"
        return await self.get_with_retry(url, params=kwargs)
    
    def validate_response(self, data: Dict[str, Any]) -> DataValidationResult:
        errors = []
        warnings = []
        
        # Basic ESPN response validation
        if not isinstance(data, dict):
            errors.append("Response is not a dictionary")
            return DataValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings,
                quality_score=0.0,
                quality_level=DataQuality.INVALID,
                validation_time=datetime.now()
            )
        
        # Check for common ESPN fields
        if 'events' in data or 'athletes' in data or 'teams' in data:
            quality_score = 0.9
        else:
            warnings.append("Missing expected ESPN data structure")
            quality_score = 0.6
        
        return DataValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            quality_score=quality_score,
            quality_level=DataQuality.HIGH if quality_score > 0.8 else DataQuality.MEDIUM,
            validation_time=datetime.now()
        )

class SportsRadarAdapter(DataSourceAdapter):
    """SportsRadar API adapter"""
    
    async def fetch_data(self, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.config.base_url}/{endpoint}"
        params = kwargs.copy()
        if self.config.api_key:
            params['api_key'] = self.config.api_key
        return await self.get_with_retry(url, params=params)
    
    def validate_response(self, data: Dict[str, Any]) -> DataValidationResult:
        errors = []
        warnings = []
        
        if not isinstance(data, dict):
            errors.append("Response is not a dictionary")
            return DataValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings,
                quality_score=0.0,
                quality_level=DataQuality.INVALID,
                validation_time=datetime.now()
            )
        
        # SportsRadar specific validation
        quality_score = 0.8
        if 'id' in data and 'status' in data:
            quality_score = 0.9
        
        return DataValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            quality_score=quality_score,
            quality_level=DataQuality.HIGH if quality_score > 0.8 else DataQuality.MEDIUM,
            validation_time=datetime.now()
        )

class PrizePicksAdapter(DataSourceAdapter):
    """PrizePicks API adapter"""
    
    async def fetch_data(self, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.config.base_url}/{endpoint}"
        return await self.get_with_retry(url, params=kwargs)
    
    def validate_response(self, data: Dict[str, Any]) -> DataValidationResult:
        errors = []
        warnings = []
        
        if not isinstance(data, dict):
            errors.append("Response is not a dictionary")
            return DataValidationResult(
                is_valid=False,
                errors=errors,
                warnings=warnings,
                quality_score=0.0,
                quality_level=DataQuality.INVALID,
                validation_time=datetime.now()
            )
        
        # PrizePicks specific validation
        quality_score = 0.7
        if 'data' in data and isinstance(data['data'], list):
            quality_score = 0.9
            if any('line_score' in item for item in data['data']):
                quality_score = 0.95
        
        return DataValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            quality_score=quality_score,
            quality_level=DataQuality.HIGH if quality_score > 0.8 else DataQuality.MEDIUM,
            validation_time=datetime.now()
        )

class DataValidator:
    """Generic data validator"""
    
    def __init__(self, rules: List[DataValidationRule]):
        self.rules = rules
    
    def validate(self, data: Dict[str, Any]) -> DataValidationResult:
        """Validate data against rules"""
        errors = []
        warnings = []
        quality_score = 1.0
        
        for rule in self.rules:
            try:
                result = self._apply_rule(data, rule)
                if not result:
                    if rule.severity == "error":
                        errors.append(rule.error_message)
                        quality_score -= 0.2
                    elif rule.severity == "warning":
                        warnings.append(rule.error_message)
                        quality_score -= 0.1
            except Exception as e:
                errors.append(f"Validation rule error: {e}")
                quality_score -= 0.1
        
        quality_score = max(0.0, min(1.0, quality_score))
        quality_level = self._get_quality_level(quality_score)
        
        return DataValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            quality_score=quality_score,
            quality_level=quality_level,
            validation_time=datetime.now()
        )
    
    def _apply_rule(self, data: Dict[str, Any], rule: DataValidationRule) -> bool:
        """Apply a single validation rule"""
        field_value = data.get(rule.field)
        
        if rule.rule_type == "required":
            return field_value is not None
        elif rule.rule_type == "type":
            if field_value is None:
                return True  # Type checking only applies to non-None values
            expected_type = rule.rule_value
            return isinstance(field_value, expected_type)
        elif rule.rule_type == "range":
            if field_value is None:
                return True
            min_val, max_val = rule.rule_value
            return min_val <= field_value <= max_val
        elif rule.rule_type == "regex":
            if field_value is None:
                return True
            import re
            pattern = rule.rule_value
            return re.match(pattern, str(field_value)) is not None
        elif rule.rule_type == "custom":
            if field_value is None:
                return True
            custom_func = rule.rule_value
            return custom_func(field_value)
        
        return True
    
    def _get_quality_level(self, score: float) -> DataQuality:
        """Convert quality score to quality level"""
        if score >= 0.9:
            return DataQuality.HIGH
        elif score >= 0.7:
            return DataQuality.MEDIUM
        elif score >= 0.4:
            return DataQuality.LOW
        else:
            return DataQuality.INVALID

class UnifiedDataService:
    """
    Unified data service that consolidates all data-related functionality.
    Provides data fetching, validation, caching, and aggregation.
    """
    
    def __init__(self, cache_service: Optional[UnifiedCacheService] = None):
        self.cache_service = cache_service
        self.adapters: Dict[DataSourceType, DataSourceAdapter] = {}
        self.validators: Dict[str, DataValidator] = {}
        self.configs: Dict[DataSourceType, DataSourceConfig] = {}
        self.fallback_order: List[DataSourceType] = []
        
    async def initialize(self):
        """Initialize the data service"""
        if self.cache_service is None:
            from .unified_cache_service import get_cache
            self.cache_service = await get_cache()
        
        # Initialize all adapters
        for adapter in self.adapters.values():
            await adapter.initialize()
        
        logger.info("Unified Data Service initialized")
    
    async def close(self):
        """Close the data service"""
        for adapter in self.adapters.values():
            await adapter.close()
    
    def register_data_source(self, config: DataSourceConfig, 
                           adapter_class: Type[DataSourceAdapter] = None):
        """Register a data source"""
        self.configs[config.source_type] = config
        
        if adapter_class is None:
            # Use built-in adapters
            adapter_class = self._get_default_adapter(config.source_type)
        
        adapter = adapter_class(config)
        self.adapters[config.source_type] = adapter
        
        # Update fallback order based on priority
        self.fallback_order = sorted(
            [source for source, cfg in self.configs.items() if cfg.enabled],
            key=lambda x: self.configs[x].priority
        )
    
    def register_validator(self, name: str, validator: DataValidator):
        """Register a data validator"""
        self.validators[name] = validator
    
    @cache_decorator(ttl=300, level=CacheLevel.REDIS)  # Cache for 5 minutes
    async def fetch_data(self, 
                        source_type: DataSourceType,
                        endpoint: str,
                        use_fallback: bool = True,
                        validate: bool = True,
                        validator_name: Optional[str] = None,
                        **kwargs) -> Dict[str, Any]:
        """Fetch data from a specific source with fallback support"""
        
        # Try primary source
        try:
            adapter = self.adapters.get(source_type)
            if adapter and adapter.config.enabled:
                data = await adapter.fetch_data(endpoint, **kwargs)
                
                # Validate if requested
                if validate:
                    validation_result = await self._validate_data(
                        data, source_type, validator_name
                    )
                    if not validation_result.is_valid:
                        logger.warning(
                            f"Data validation failed for {source_type}: "
                            f"{validation_result.errors}"
                        )
                        if validation_result.quality_level == DataQuality.INVALID:
                            raise Exception("Data quality too low")
                
                # Update cache hit metrics
                adapter.metrics.cache_hits += 1
                return data
                
        except Exception as e:
            logger.error(f"Failed to fetch from {source_type}: {e}")
            
            # Try fallback sources if enabled
            if use_fallback:
                for fallback_source in self.fallback_order:
                    if fallback_source == source_type:
                        continue
                    
                    try:
                        fallback_adapter = self.adapters.get(fallback_source)
                        if fallback_adapter and fallback_adapter.config.enabled:
                            logger.info(f"Trying fallback source: {fallback_source}")
                            data = await fallback_adapter.fetch_data(endpoint, **kwargs)
                            
                            if validate:
                                validation_result = await self._validate_data(
                                    data, fallback_source, validator_name
                                )
                                if validation_result.is_valid:
                                    return data
                            else:
                                return data
                                
                    except Exception as fallback_error:
                        logger.error(f"Fallback {fallback_source} failed: {fallback_error}")
                        continue
            
            raise Exception(f"All data sources failed for endpoint: {endpoint}")
    
    async def fetch_aggregated_data(self, 
                                   sources: List[DataSourceType],
                                   endpoint: str,
                                   aggregation_func: Callable = None,
                                   **kwargs) -> Dict[str, Any]:
        """Fetch data from multiple sources and aggregate"""
        results = {}
        
        # Fetch from all sources concurrently
        tasks = []
        for source in sources:
            if source in self.adapters:
                task = asyncio.create_task(
                    self.fetch_data(source, endpoint, use_fallback=False, **kwargs)
                )
                tasks.append((source, task))
        
        # Collect results
        for source, task in tasks:
            try:
                data = await task
                results[source.value] = data
            except Exception as e:
                logger.error(f"Failed to fetch from {source}: {e}")
                results[source.value] = None
        
        # Apply aggregation function if provided
        if aggregation_func:
            return aggregation_func(results)
        
        return results
    
    async def get_metrics(self) -> Dict[str, Any]:
        """Get metrics for all data sources"""
        metrics = {}
        
        for source_type, adapter in self.adapters.items():
            metrics[source_type.value] = {
                "requests_count": adapter.metrics.requests_count,
                "success_count": adapter.metrics.success_count,
                "error_count": adapter.metrics.error_count,
                "success_rate": adapter.metrics.success_rate,
                "error_rate": adapter.metrics.error_rate,
                "avg_response_time": adapter.metrics.avg_response_time,
                "last_success": adapter.metrics.last_success.isoformat() if adapter.metrics.last_success else None,
                "last_error": adapter.metrics.last_error.isoformat() if adapter.metrics.last_error else None,
                "cache_hits": adapter.metrics.cache_hits,
                "cache_misses": adapter.metrics.cache_misses,
                "circuit_breaker_state": adapter.circuit_breaker.state
            }
        
        return metrics
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on all data sources"""
        health_status = {}
        
        for source_type, adapter in self.adapters.items():
            try:
                # Try a simple request
                start_time = time.time()
                await adapter.fetch_data("health", timeout=5)
                response_time = time.time() - start_time
                
                health_status[source_type.value] = {
                    "status": "healthy",
                    "response_time": response_time,
                    "circuit_breaker": adapter.circuit_breaker.state,
                    "last_check": datetime.now().isoformat()
                }
                
            except Exception as e:
                health_status[source_type.value] = {
                    "status": "unhealthy",
                    "error": str(e),
                    "circuit_breaker": adapter.circuit_breaker.state,
                    "last_check": datetime.now().isoformat()
                }
        
        return health_status
    
    async def _validate_data(self, 
                           data: Dict[str, Any], 
                           source_type: DataSourceType,
                           validator_name: Optional[str] = None) -> DataValidationResult:
        """Validate data using adapter or custom validator"""
        
        # Use custom validator if specified
        if validator_name and validator_name in self.validators:
            return self.validators[validator_name].validate(data)
        
        # Use adapter's built-in validation
        adapter = self.adapters.get(source_type)
        if adapter:
            return adapter.validate_response(data)
        
        # Default validation (just check if it's a dict)
        if isinstance(data, dict):
            return DataValidationResult(
                is_valid=True,
                errors=[],
                warnings=[],
                quality_score=0.5,
                quality_level=DataQuality.MEDIUM,
                validation_time=datetime.now()
            )
        else:
            return DataValidationResult(
                is_valid=False,
                errors=["Data is not a dictionary"],
                warnings=[],
                quality_score=0.0,
                quality_level=DataQuality.INVALID,
                validation_time=datetime.now()
            )
    
    def _get_default_adapter(self, source_type: DataSourceType) -> Type[DataSourceAdapter]:
        """Get default adapter class for source type"""
        adapter_map = {
            DataSourceType.ESPN: ESPNAdapter,
            DataSourceType.SPORTSRADAR: SportsRadarAdapter,
            DataSourceType.PRIZEPICKS: PrizePicksAdapter,
        }
        
        return adapter_map.get(source_type, DataSourceAdapter)

# Global instance
_data_service: Optional[UnifiedDataService] = None

async def get_data_service() -> UnifiedDataService:
    """Get global data service instance"""
    global _data_service
    if _data_service is None:
        _data_service = UnifiedDataService()
        await _data_service.initialize()
    return _data_service

@asynccontextmanager
async def data_service_context(cache_service: Optional[UnifiedCacheService] = None):
    """Context manager for data service"""
    service = UnifiedDataService(cache_service)
    await service.initialize()
    try:
        yield service
    finally:
        await service.close()

# Convenience functions
async def fetch_data(source_type: DataSourceType, endpoint: str, **kwargs) -> Dict[str, Any]:
    service = await get_data_service()
    return await service.fetch_data(source_type, endpoint, **kwargs)

async def fetch_aggregated_data(sources: List[DataSourceType], endpoint: str, **kwargs) -> Dict[str, Any]:
    service = await get_data_service()
    return await service.fetch_aggregated_data(sources, endpoint, **kwargs)

def register_data_source(config: DataSourceConfig, adapter_class: Type[DataSourceAdapter] = None):
    async def _register():
        service = await get_data_service()
        service.register_data_source(config, adapter_class)
    
    return asyncio.create_task(_register())
