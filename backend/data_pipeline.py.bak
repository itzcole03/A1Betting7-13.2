"""Enhanced Real-time Data Pipeline
Manages data ingestion from multiple sources with caching, rate limiting, and error handling
"""

import asyncio
import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional
from urllib.parse import urljoin

import aiohttp

from backend.config import config_manager
from backend.middleware.caching import TTLCache

logger = logging.getLogger(__name__)


class DataSourceType(str, Enum):
    """Types of data sources"""

    SPORTRADAR = "sportradar"
    ODDS_API = "odds_api"
    PRIZEPICKS = "prizepicks"
    ESPN = "espn"
    YAHOO = "yahoo"


class DataStatus(str, Enum):
    """Data fetch status"""

    SUCCESS = "success"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    TIMEOUT = "timeout"
    CACHED = "cached"


@dataclass
class DataRequest:
    """Data request configuration"""

    source: DataSourceType
    endpoint: str
    params: Dict[str, Any] = field(default_factory=dict)
    headers: Dict[str, str] = field(default_factory=dict)
    timeout: int = 30
    retry_count: int = 3
    cache_ttl: int = 300
    priority: int = 1


@dataclass
class DataResponse:
    """Standardized data response"""

    source: DataSourceType
    data: Any
    status: DataStatus
    timestamp: datetime
    latency: float
    cache_hit: bool = False
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class RateLimiter:
    """Rate limiting for API calls"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: List[float] = []
        self.lock = asyncio.Lock()

    async def acquire(self) -> bool:
        """Acquire rate limit token"""
        async with self.lock:
            now = time.time()
            # Remove requests older than 1 minute
            self.requests = [
                req_time for req_time in self.requests if now - req_time < 60
            ]

            if len(self.requests) >= self.requests_per_minute:
                return False

            self.requests.append(now)
            return True

    async def wait_for_slot(self) -> None:
        """Wait until a rate limit slot is available"""
        while not await self.acquire():
            await asyncio.sleep(1)


class DataSourceConnector:
    """Base class for data source connectors"""

    def __init__(
        self, source_type: DataSourceType, base_url: str, api_key: Optional[str] = None
    ):
        self.source_type = source_type
        self.base_url = base_url
        self.api_key = api_key
        self.rate_limiter = RateLimiter()
        self.session: Optional[aiohttp.ClientSession] = None
        self.connection_pool_size = 10

    async def initialize(self):
        """Initialize HTTP session"""
        connector = aiohttp.TCPConnector(
            limit=self.connection_pool_size,
            ttl_dns_cache=300,
            use_dns_cache=True,
        )

        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(
            connector=connector, timeout=timeout, headers=self._get_default_headers()
        )

        logger.info("Initialized connector for {self.source_type}")

    async def close(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()

    def _get_default_headers(self) -> Dict[str, str]:
        """Get default headers for requests"""
        headers = {"User-Agent": "A1Betting/1.0", "Accept": "application/json"}

        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        return headers

    async def fetch_data(self, request: DataRequest) -> DataResponse:
        """Fetch data from the source"""
        if not self.session:
            await self.initialize()

        start_time = time.time()

        try:
            # Wait for rate limit
            await self.rate_limiter.wait_for_slot()

            # Build URL
            url = urljoin(self.base_url, request.endpoint)

            # Merge headers
            headers = {**self._get_default_headers(), **request.headers}

            # Make request with retries
            for attempt in range(request.retry_count + 1):
                try:
                    async with self.session.get(
                        url,
                        params=request.params,
                        headers=headers,
                        timeout=aiohttp.ClientTimeout(total=request.timeout),
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            latency = time.time() - start_time

                            return DataResponse(
                                source=self.source_type,
                                data=data,
                                status=DataStatus.SUCCESS,
                                timestamp=datetime.now(timezone.utc),
                                latency=latency,
                                metadata={
                                    "status_code": response.status,
                                    "response_size": len(str(data)),
                                    "attempt": attempt + 1,
                                },
                            )

                        elif response.status == 429:
                            # Rate limited
                            await asyncio.sleep(2**attempt)
                            continue

                        else:
                            error_text = await response.text()
                            raise aiohttp.ClientResponseError(
                                request_info=response.request_info,
                                history=response.history,
                                status=response.status,
                                message=error_text,
                            )

                except asyncio.TimeoutError:
                    if attempt < request.retry_count:
                        await asyncio.sleep(2**attempt)
                        continue
                    else:
                        raise

                except aiohttp.ClientError as e:
                    if attempt < request.retry_count:
                        await asyncio.sleep(2**attempt)
                        continue
                    else:
                        raise e

            # If we get here, all retries failed
            raise Exception("All retry attempts failed")

        except asyncio.TimeoutError:
            return DataResponse(
                source=self.source_type,
                data=None,
                status=DataStatus.TIMEOUT,
                timestamp=datetime.now(timezone.utc),
                latency=time.time() - start_time,
                error="Request timeout",
            )

        except Exception as e:  # pylint: disable=broad-exception-caught
            return DataResponse(
                source=self.source_type,
                data=None,
                status=DataStatus.ERROR,
                timestamp=datetime.now(timezone.utc),
                latency=time.time() - start_time,
                error=str(e),
            )


class SportradarConnector(DataSourceConnector):
    """Sportradar API connector"""

    def __init__(self, api_key: str):
        super().__init__(
            DataSourceType.SPORTRADAR, "https://api.sportradar.us/", api_key
        )
        self.rate_limiter = RateLimiter(requests_per_minute=30)  # Sportradar limits


class OddsAPIConnector(DataSourceConnector):
    """The Odds API connector"""

    def __init__(self, api_key: str):
        super().__init__(
            DataSourceType.ODDS_API, "https://api.the-odds-api.com/", api_key
        )
        self.rate_limiter = RateLimiter(requests_per_minute=60)


class PrizePicksConnector(DataSourceConnector):
    """PrizePicks API connector"""

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            DataSourceType.PRIZEPICKS, "https://api.prizepicks.com/", api_key
        )
        self.rate_limiter = RateLimiter(requests_per_minute=100)


class DataPipeline:
    """Main data pipeline orchestrator"""

    def __init__(self):
        self.config = config_manager
        self.cache = TTLCache(ttl=3600)
        self.connectors: Dict[DataSourceType, DataSourceConnector] = {}
        self.pipeline_stats = {
            "requests_total": 0,
            "requests_successful": 0,
            "requests_failed": 0,
            "cache_hits": 0,
            "average_latency": 0.0,
        }
        self.data_callbacks: Dict[DataSourceType, List[Callable]] = {}
        self._initialize_connectors()

    def _initialize_connectors(self):
        """Initialize data source connectors"""
        api_config = self.config.get_external_api_config()

        if api_config["sportradar"]:
            self.connectors[DataSourceType.SPORTRADAR] = SportradarConnector(
                api_config["sportradar"]
            )

        if api_config["odds_api"]:
            self.connectors[DataSourceType.ODDS_API] = OddsAPIConnector(
                api_config["odds_api"]
            )

        # PrizePicks doesn't always require API key
        self.connectors[DataSourceType.PRIZEPICKS] = PrizePicksConnector(
            api_config.get("prizepicks")
        )

        logger.info("Initialized {len(self.connectors)} data connectors")

    async def initialize(self):
        """Initialize all connectors"""
        for connector in self.connectors.values():
            await connector.initialize()

    async def shutdown(self):
        """Shutdown all connectors"""
        for connector in self.connectors.values():
            await connector.close()

    def register_callback(
        self, source: DataSourceType, callback: Callable[[DataResponse], None]
    ):
        """Register callback for data updates"""
        if source not in self.data_callbacks:
            self.data_callbacks[source] = []
        self.data_callbacks[source].append(callback)

    async def fetch_data(self, request: DataRequest) -> DataResponse:
        """Fetch data with caching and error handling"""
        # Check cache first
        cache_key = self._generate_cache_key(request)
        cached_data = self.cache[cache_key] if cache_key in self.cache else None

        if cached_data:
            self.pipeline_stats["cache_hits"] += 1
            return DataResponse(
                source=request.source,
                data=cached_data,
                status=DataStatus.CACHED,
                timestamp=datetime.now(timezone.utc),
                latency=0.0,
                cache_hit=True,
            )

        # Get connector
        connector = self.connectors.get(request.source)
        if not connector:
            return DataResponse(
                source=request.source,
                data=None,
                status=DataStatus.ERROR,
                timestamp=datetime.now(timezone.utc),
                latency=0.0,
                error=f"No connector for source {request.source}",
            )

        # Fetch data
        response = await connector.fetch_data(request)

        # Update stats
        self.pipeline_stats["requests_total"] += 1
        if response.status == DataStatus.SUCCESS:
            self.pipeline_stats["requests_successful"] += 1
            # Cache successful responses
            self.cache[cache_key] = response.data
        else:
            self.pipeline_stats["requests_failed"] += 1

        # Update average latency
        total_requests = self.pipeline_stats["requests_total"]
        current_avg = self.pipeline_stats["average_latency"]
        self.pipeline_stats["average_latency"] = (
            current_avg * (total_requests - 1) + response.latency
        ) / total_requests

        # Call registered callbacks
        callbacks = self.data_callbacks.get(request.source, [])
        for callback in callbacks:
            try:
                callback(response)
            except Exception as e:  # pylint: disable=broad-exception-caught
                logger.error("Error in data callback: {e!s}")

        return response

    async def fetch_multiple(self, requests: List[DataRequest]) -> List[DataResponse]:
        """Fetch data from multiple sources concurrently"""
        tasks = [self.fetch_data(request) for request in requests]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Convert exceptions to error responses
        results = []
        for i, response in enumerate(responses):
            if isinstance(response, Exception):
                results.append(
                    DataResponse(
                        source=requests[i].source,
                        data=None,
                        status=DataStatus.ERROR,
                        timestamp=datetime.now(timezone.utc),
                        latency=0.0,
                        error=str(response),
                    )
                )
            else:
                results.append(response)

        return results

    def _generate_cache_key(self, request: DataRequest) -> str:
        """Generate cache key for request"""
        import hashlib

        key_data = {
            "source": request.source,
            "endpoint": request.endpoint,
            "params": sorted(request.params.items()) if request.params else [],
        }

        key_string = json.dumps(key_data, sort_keys=True)
        return hashlib.md5(key_string.encode()).hexdigest()

    async def get_live_games(self, sport: str = "basketball") -> List[DataResponse]:
        """Get live games from multiple sources. Supports 'basketball' and 'mlb'."""
        requests = []

        # Map sport to endpoints
        sport_endpoints = {
            "basketball": {
                "sportradar": "nba/trial/v8/en/games/live.json",
                "odds": "v4/sports/basketball_nba/odds",
            },
            "mlb": {
                "sportradar": "mlb/trial/v7/en/games/live.json",
                "odds": "v4/sports/baseball_mlb/odds",
            },
        }
        endpoints = sport_endpoints.get(sport.lower())
        if not endpoints:
            raise ValueError(f"Unsupported sport: {sport}")

        # Sportradar live games
        if DataSourceType.SPORTRADAR in self.connectors:
            requests.append(
                DataRequest(
                    source=DataSourceType.SPORTRADAR,
                    endpoint=endpoints["sportradar"],
                    cache_ttl=60,  # Cache for 1 minute for live data
                )
            )

        # The Odds API live odds
        if DataSourceType.ODDS_API in self.connectors:
            requests.append(
                DataRequest(
                    source=DataSourceType.ODDS_API,
                    endpoint=endpoints["odds"],
                    params={"regions": "us", "markets": "h2h,spreads,totals"},
                    cache_ttl=120,
                )
            )

        return await self.fetch_multiple(requests)

    async def get_player_props(self, sport: str = "basketball") -> List[DataResponse]:
        """Get player props from multiple sources. Supports 'basketball' and 'mlb'."""
        requests = []

        # Map sport to PrizePicks league_id
        league_ids = {
            "basketball": 7,  # NBA
            "mlb": 2,  # MLB (commonly 2, verify with PrizePicks API)
        }
        league_id = league_ids.get(sport.lower())
        if league_id is None:
            raise ValueError(f"Unsupported sport: {sport}")

        # PrizePicks props
        if DataSourceType.PRIZEPICKS in self.connectors:
            requests.append(
                DataRequest(
                    source=DataSourceType.PRIZEPICKS,
                    endpoint="projections",
                    params={"league_id": league_id},
                    cache_ttl=300,
                )
            )

        return await self.fetch_multiple(requests)

    async def get_pipeline_health(self) -> Dict[str, Any]:
        """Get pipeline health status"""
        health_status = {
            "status": "healthy",
            "connectors": {},
            "stats": self.pipeline_stats,
            "cache": {
                "size": len(self.cache.cache),
                "hit_rate": (
                    self.pipeline_stats["cache_hits"]
                    / max(self.pipeline_stats["requests_total"], 1)
                )
                * 100,
            },
        }

        # Check individual connectors
        for source, connector in self.connectors.items():
            try:
                # Simple health check - create a minimal request
                test_request = DataRequest(
                    source=source, endpoint="health", timeout=5, retry_count=0
                )

                start_time = time.time()
                # Don't actually make the request, just check if connector is ready
                if connector.session and not connector.session.closed:
                    health_status["connectors"][source.value] = {
                        "status": "healthy",
                        "response_time": time.time() - start_time,
                    }
                else:
                    health_status["connectors"][source.value] = {
                        "status": "degraded",
                        "error": "Session not initialized",
                    }

            except Exception as e:  # pylint: disable=broad-exception-caught
                health_status["connectors"][source.value] = {
                    "status": "unhealthy",
                    "error": str(e),
                }
                health_status["status"] = "degraded"

        return health_status


# Global data pipeline instance
data_pipeline = DataPipeline()
