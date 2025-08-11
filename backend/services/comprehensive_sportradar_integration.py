"""
Comprehensive SportRadar Multi-API Integration Service
Integrates all trial APIs: Odds Comparison, Images, Sports Data APIs
"""

import asyncio
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import aiohttp

from backend.config_manager import A1BettingConfig
from backend.services.enhanced_data_pipeline import enhanced_data_pipeline
from backend.utils.enhanced_logging import get_logger

logger = get_logger("comprehensive_sportradar")


class APIType(Enum):
    """SportRadar API types available"""

    ODDS_COMPARISON_FUTURES = "odds_comparison_futures"
    ODDS_COMPARISON_PREMATCH = "odds_comparison_prematch"
    ODDS_COMPARISON_PLAYER_PROPS = "odds_comparison_player_props"
    ODDS_COMPARISON_REGULAR = "odds_comparison_regular"
    GETTY_IMAGES = "getty_images"
    COLLEGE_PRESSBOX_NCAAFB = "college_pressbox_ncaafb"
    SPORTRADAR_IMAGES = "sportradar_images"
    ASSOCIATED_PRESS_IMAGES = "associated_press_images"
    TABLE_TENNIS = "table_tennis"
    MLB = "mlb"
    NBA = "nba"
    SOCCER = "soccer"
    MMA = "mma"
    NFL = "nfl"
    TENNIS = "tennis"
    NHL = "nhl"
    NASCAR = "nascar"
    WNBA = "wnba"
    NCAAFB = "ncaafb"


class DataCategory(Enum):
    """Data categories for different API endpoints"""

    ODDS = "odds"
    IMAGES = "images"
    SPORTS_DATA = "sports_data"
    LIVE_SCORES = "live_scores"
    SCHEDULES = "schedules"
    PLAYER_STATS = "player_stats"
    TEAM_STATS = "team_stats"
    FUTURES = "futures"
    PREMATCH = "prematch"
    PLAYER_PROPS = "player_props"


@dataclass
class SportRadarAPI:
    """SportRadar API configuration"""

    api_type: APIType
    base_url: str
    endpoints: Dict[str, str]
    quota_limit: int
    qps_limit: int
    trial_start: str
    trial_end: str
    packages: List[str]
    data_categories: List[DataCategory]
    cache_ttl: int = 300
    rate_limit: int = 60


class ComprehensiveSportRadarService:
    """
    Comprehensive SportRadar integration service supporting all trial APIs:
    - Odds Comparison APIs (Futures, Prematch, Player Props, Regular)
    - Image APIs (Getty, College PressBox, SportRadar, Associated Press)
    - Sports Data APIs (MLB, Soccer, MMA, NFL, Tennis, NHL, NASCAR, WNBA, NCAAFB, Table Tennis)
    """

    def __init__(self):
        self.config = A1BettingConfig()
        self.api_key = (
            getattr(self.config, "api_keys", None)
            and getattr(self.config.api_keys, "sportradar_api_key", None)
            or "SFvaMFGToGtrHBBEhROlT2keKedDtDVijvaDbiNz"
        )
        # Initialize all API configurations
        self.apis = self._initialize_all_apis()
        # Session management
        self.session = None  # type: Optional[aiohttp.ClientSession]
        self._session_timeout = aiohttp.ClientTimeout(total=30, connect=10)
        # Rate limiting tracking
        self.rate_limiters = {}  # type: Dict[APIType, Dict[str, Any]]
        self.quota_usage = {}  # type: Dict[APIType, int]
        # Background tasks
        self._monitoring_task = None  # type: Optional[asyncio.Task]
        # Data aggregation
        self.aggregated_data = {}  # type: Dict[str, Any]

    def _initialize_all_apis(self) -> Dict[APIType, SportRadarAPI]:
        """Initialize all SportRadar API configurations"""
        apis = {}

        # Odds Comparison APIs
        apis[APIType.ODDS_COMPARISON_FUTURES] = SportRadarAPI(
            api_type=APIType.ODDS_COMPARISON_FUTURES,
            base_url="https://api.sportradar.com/odds-comparison-futures/trial/v2/en",
            endpoints={
                "futures": "/sports/{sport}/competitions/{competition}/futures",
                "futures_markets": "/sports/{sport}/competitions/{competition}/futures/{event_id}/markets",
                "competitions": "/sports/{sport}/competitions",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["Odds Comparison Futures Base"],
            data_categories=[DataCategory.ODDS, DataCategory.FUTURES],
            cache_ttl=900,  # 15 minutes for futures
        )

        apis[APIType.ODDS_COMPARISON_PREMATCH] = SportRadarAPI(
            api_type=APIType.ODDS_COMPARISON_PREMATCH,
            base_url="https://api.sportradar.com/odds-comparison-prematch/trial/v2/en",
            endpoints={
                "prematch": "/sports/{sport}/competitions/{competition}/prematch",
                "prematch_markets": "/sports/{sport}/competitions/{competition}/prematch/{event_id}/markets",
                "bookmakers": "/bookmakers",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["Odds Comparison Prematch Base"],
            data_categories=[DataCategory.ODDS, DataCategory.PREMATCH],
            cache_ttl=300,  # 5 minutes for prematch
        )

        apis[APIType.ODDS_COMPARISON_PLAYER_PROPS] = SportRadarAPI(
            api_type=APIType.ODDS_COMPARISON_PLAYER_PROPS,
            base_url="https://api.sportradar.com/odds-comparison-player-props/trial/v2/en",
            endpoints={
                "player_props": "/sports/{sport}/competitions/{competition}/player_props",
                "player_markets": "/sports/{sport}/competitions/{competition}/player_props/{event_id}/markets",
                "players": "/sports/{sport}/competitions/{competition}/players",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["Odds Comparison Player Props Base"],
            data_categories=[DataCategory.ODDS, DataCategory.PLAYER_PROPS],
            cache_ttl=180,  # 3 minutes for player props
        )

        apis[APIType.ODDS_COMPARISON_REGULAR] = SportRadarAPI(
            api_type=APIType.ODDS_COMPARISON_REGULAR,
            base_url="https://api.sportradar.com/odds-comparison-regular/trial/v2/en",
            endpoints={
                "odds": "/sports/{sport}/competitions/{competition}/odds",
                "markets": "/sports/{sport}/competitions/{competition}/odds/{event_id}/markets",
                "live_odds": "/sports/{sport}/competitions/{competition}/live_odds",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["Odds Comparison Regular Base"],
            data_categories=[DataCategory.ODDS],
            cache_ttl=60,  # 1 minute for regular odds
        )

        # Image APIs
        apis[APIType.GETTY_IMAGES] = SportRadarAPI(
            api_type=APIType.GETTY_IMAGES,
            base_url="https://api.sportradar.com/getty-images/trial/v1/en",
            endpoints={
                "action_shots": "/sports/{sport}/competitions/{competition}/action_shots",
                "headshots": "/sports/{sport}/competitions/{competition}/headshots",
                "team_logos": "/sports/{sport}/competitions/{competition}/team_logos",
                "event_images": "/sports/{sport}/competitions/{competition}/events/{event_id}/images",
            },
            quota_limit=100,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=[
                "Getty Action Shots Argentina Superliga",
                "Getty Action Shots Badminton",
                "Getty Action Shots Beach Volleyball",
                "Getty Action Shots Belgian First Division",
                "Getty Action Shots Brasileiro Series A",
                "Getty Action Shots Cricket",
                "Getty Action Shots English Premier League",
                "Getty Action Shots Euro League Basketball",
                "Getty Action Shots Formula 1",
                "Getty Action Shots French Ligue 1",
                "Getty Action Shots German Bundesliga",
                "Getty Action Shots Handball",
                "Getty Premium Headshots NBA",
                "Getty Premium Headshots NFL",
                "Getty Premium Headshots NHL",
            ],
            data_categories=[DataCategory.IMAGES],
            cache_ttl=3600,  # 1 hour for images
        )

        apis[APIType.SPORTRADAR_IMAGES] = SportRadarAPI(
            api_type=APIType.SPORTRADAR_IMAGES,
            base_url="https://api.sportradar.com/sportradar-images/trial/v1/en",
            endpoints={
                "country_flags": "/images/country_flags",
                "team_logos": "/images/{sport}/teams/{team_id}/logos",
                "league_logos": "/images/{sport}/leagues/{league_id}/logos",
            },
            quota_limit=100,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["Sportradar Country Flags"],
            data_categories=[DataCategory.IMAGES],
            cache_ttl=7200,  # 2 hours for static images
        )

        # Sports Data APIs
        apis[APIType.MLB] = SportRadarAPI(
            api_type=APIType.MLB,
            base_url="https://api.sportradar.com/mlb/trial/v8/en",
            endpoints={
                "schedules": "/games/{year}/{season}/schedule.json",
                "live_scores": "/games/live.json",
                "player_profile": "/players/{player_id}/profile.json",
                "team_profile": "/teams/{team_id}/profile.json",
                "game_summary": "/games/{game_id}/summary.json",
                "league_hierarchy": "/league/hierarchy.json",
                "standings": "/seasons/{season}/{year}/standings.json",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["MLB Base"],
            data_categories=[
                DataCategory.SPORTS_DATA,
                DataCategory.LIVE_SCORES,
                DataCategory.SCHEDULES,
            ],
            cache_ttl=300,
        )

        apis[APIType.NFL] = SportRadarAPI(
            api_type=APIType.NFL,
            base_url="https://api.sportradar.com/nfl/official/trial/v7/en",
            endpoints={
                "schedules": "/games/{year}/{season}/schedule.json",
                "live_scores": "/games/live.json",
                "player_profile": "/players/{player_id}/profile.json",
                "team_profile": "/teams/{team_id}/profile.json",
                "game_summary": "/games/{game_id}/summary.json",
                "league_hierarchy": "/league/hierarchy.json",
                "standings": "/seasons/{season}/{year}/standings.json",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["NFL Base"],
            data_categories=[
                DataCategory.SPORTS_DATA,
                DataCategory.LIVE_SCORES,
                DataCategory.SCHEDULES,
            ],
            cache_ttl=300,
        )

        apis[APIType.NBA] = SportRadarAPI(
            api_type=APIType.NBA,
            base_url="https://api.sportradar.com/nba/trial/v8/en",
            endpoints={
                "schedules": "/games/{year}/{season}/schedule.json",
                "live_scores": "/games/live.json",
                "player_profile": "/players/{player_id}/profile.json",
                "team_profile": "/teams/{team_id}/profile.json",
                "game_summary": "/games/{game_id}/summary.json",
                "league_hierarchy": "/league/hierarchy.json",
                "standings": "/seasons/{season}/{year}/standings.json",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["NBA Base"],
            data_categories=[
                DataCategory.SPORTS_DATA,
                DataCategory.LIVE_SCORES,
                DataCategory.SCHEDULES,
            ],
            cache_ttl=300,
        )

        apis[APIType.NHL] = SportRadarAPI(
            api_type=APIType.NHL,
            base_url="https://api.sportradar.com/nhl/trial/v7/en",
            endpoints={
                "schedules": "/games/{year}/{season}/schedule.json",
                "live_scores": "/games/live.json",
                "player_profile": "/players/{player_id}/profile.json",
                "team_profile": "/teams/{team_id}/profile.json",
                "game_summary": "/games/{game_id}/summary.json",
                "league_hierarchy": "/league/hierarchy.json",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["NHL Base"],
            data_categories=[
                DataCategory.SPORTS_DATA,
                DataCategory.LIVE_SCORES,
                DataCategory.SCHEDULES,
            ],
            cache_ttl=300,
        )

        apis[APIType.SOCCER] = SportRadarAPI(
            api_type=APIType.SOCCER,
            base_url="https://api.sportradar.com/soccer/trial/v4/en",
            endpoints={
                "schedules": "/tournaments/{tournament_id}/schedule.json",
                "live_scores": "/matches/live.json",
                "player_profile": "/players/{player_id}/profile.json",
                "team_profile": "/teams/{team_id}/profile.json",
                "match_summary": "/matches/{match_id}/summary.json",
                "tournaments": "/tournaments.json",
                "standings": "/tournaments/{tournament_id}/standings.json",
            },
            quota_limit=1000,
            qps_limit=1,
            trial_start="08/11/2025",
            trial_end="09/10/2025",
            packages=["Soccer Base", "Soccer Extended Base"],
            data_categories=[
                DataCategory.SPORTS_DATA,
                DataCategory.LIVE_SCORES,
                DataCategory.SCHEDULES,
            ],
            cache_ttl=300,
        )

        # Add remaining sports APIs
        for sport, endpoints_map in [
            (
                APIType.TENNIS,
                {
                    "tournaments": "/tournaments.json",
                    "live_scores": "/matches/live.json",
                    "schedules": "/tournaments/{tournament_id}/schedule.json",
                    "player_profile": "/players/{player_id}/profile.json",
                },
            ),
            (
                APIType.MMA,
                {
                    "events": "/events.json",
                    "live_scores": "/events/live.json",
                    "fighter_profile": "/fighters/{fighter_id}/profile.json",
                    "event_summary": "/events/{event_id}/summary.json",
                },
            ),
            (
                APIType.NASCAR,
                {
                    "races": "/races/{year}/schedule.json",
                    "live_scores": "/races/live.json",
                    "driver_profile": "/drivers/{driver_id}/profile.json",
                    "race_summary": "/races/{race_id}/summary.json",
                },
            ),
            (
                APIType.WNBA,
                {
                    "schedules": "/games/{year}/{season}/schedule.json",
                    "live_scores": "/games/live.json",
                    "player_profile": "/players/{player_id}/profile.json",
                    "team_profile": "/teams/{team_id}/profile.json",
                },
            ),
            (
                APIType.NCAAFB,
                {
                    "schedules": "/games/{year}/{season}/schedule.json",
                    "live_scores": "/games/live.json",
                    "team_profile": "/teams/{team_id}/profile.json",
                    "game_summary": "/games/{game_id}/summary.json",
                },
            ),
            (
                APIType.TABLE_TENNIS,
                {
                    "tournaments": "/tournaments.json",
                    "live_scores": "/matches/live.json",
                    "player_profile": "/players/{player_id}/profile.json",
                    "match_summary": "/matches/{match_id}/summary.json",
                },
            ),
        ]:
            sport_name = sport.value.replace("_", "-")
            apis[sport] = SportRadarAPI(
                api_type=sport,
                base_url=f"https://api.sportradar.com/{sport_name}/trial/v4/en",
                endpoints=endpoints_map,
                quota_limit=1000,
                qps_limit=1,
                trial_start="08/11/2025",
                trial_end="09/10/2025",
                packages=[f"{sport.value.replace('_', ' ').title()} Base"],
                data_categories=[DataCategory.SPORTS_DATA, DataCategory.LIVE_SCORES],
                cache_ttl=300,
            )

        return apis

    async def initialize(self):
        """Initialize the comprehensive SportRadar service"""
        if not self.api_key:
            logger.warning(
                "⚠️ SportRadar API key not configured - service will use demo mode"
            )
            return False

        # Register with enhanced data pipeline
        enhanced_data_pipeline.register_data_source(
            "comprehensive_sportradar",
            failure_threshold=5,
            recovery_timeout=180,
            success_threshold=3,
        )

        # Create HTTP session
        connector = aiohttp.TCPConnector(
            limit=200,
            limit_per_host=50,
            keepalive_timeout=30,
            enable_cleanup_closed=True,
        )

        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=self._session_timeout,
            headers={
                "User-Agent": "A1Betting/1.0",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "X-Application": "A1Betting-SportRadar-Integration",
            },
        )

        # Initialize rate limiters
        for api_type, api_config in self.apis.items():
            self.rate_limiters[api_type] = {
                "requests": 0,
                "last_reset": time.time(),
                "limit": api_config.qps_limit,
            }
            self.quota_usage[api_type] = 0

        # Test connections
        try:
            await self._test_all_connections()
            logger.info("✅ Comprehensive SportRadar service initialized successfully")

            # Start monitoring
            self._monitoring_task = asyncio.create_task(self._monitor_usage())

            return True
        except Exception as e:
            logger.error(f"❌ SportRadar initialization failed: {e}")
            return False

    async def _test_all_connections(self):
        """Test connections to all available APIs"""
        test_results = {}

        # Test core sports APIs first
        priority_apis = [APIType.MLB, APIType.NFL, APIType.NBA, APIType.NHL]

        for api_type in priority_apis:
            try:
                if api_type == APIType.MLB:
                    await self.get_mlb_data("league_hierarchy")
                elif api_type == APIType.NFL:
                    await self.get_nfl_data("league_hierarchy")
                elif api_type == APIType.NBA:
                    await self.get_nba_data("league_hierarchy")
                elif api_type == APIType.NHL:
                    await self.get_nhl_data("league_hierarchy")
                test_results[api_type.value] = "✅ Connected"
                logger.info(f"✅ {api_type.value.upper()} API connection successful")
            except Exception as e:
                test_results[api_type.value] = f"❌ Failed: {str(e)}"
                logger.warning(f"⚠️ {api_type.value.upper()} API connection failed: {e}")

        return test_results

    async def _make_api_request(
        self, api_type: APIType, endpoint: str, **kwargs
    ) -> Dict[str, Any]:
        """Make authenticated API request with rate limiting"""
        if not self.api_key:
            raise RuntimeError("SportRadar API key not configured")

        api_config = self.apis[api_type]

        # Check rate limiting
        await self._check_rate_limit(api_type)

        # Build URL
        base_url = api_config.base_url
        endpoint_template = api_config.endpoints.get(endpoint)
        if not endpoint_template:
            raise ValueError(f"Endpoint '{endpoint}' not found for {api_type.value}")

        # Format endpoint with parameters
        try:
            formatted_endpoint = endpoint_template.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing parameter {e} for endpoint {endpoint}") from e

        full_url = f"{base_url}{formatted_endpoint}"

        # Add API key
        separator = "&" if "?" in full_url else "?"
        full_url = f"{full_url}{separator}api_key={self.api_key}"

        # Make request
        if not self.session:
            raise RuntimeError("HTTP session not initialized")
        async with self.session.get(full_url) as response:
            # Update quota usage
            self.quota_usage[api_type] += 1

            # Handle rate limiting
            if response.status == 429:
                retry_after = int(response.headers.get("Retry-After", 60))
                logger.warning(
                    f"⚠️ {api_type.value} rate limit hit, retry after {retry_after}s"
                )
                raise RuntimeError(f"Rate limit exceeded for {api_type.value}")

            # Handle authentication errors
            elif response.status == 401:
                logger.error(f"❌ {api_type.value} authentication failed")
                raise PermissionError(f"Invalid API key for {api_type.value}")

            # Handle successful response
            elif response.status == 200:
                data = await response.json()

                # Log quota information
                quota_remaining = response.headers.get("X-Requests-Remaining")
                if quota_remaining:
                    logger.debug(
                        f"📊 {api_type.value} quota remaining: {quota_remaining}"
                    )

                return data

            # Handle other errors
            else:
                error_text = await response.text()
                logger.error(
                    f"❌ {api_type.value} API error {response.status}: {error_text}"
                )
                raise RuntimeError(f"{api_type.value} API error: {response.status}")

    async def _check_rate_limit(self, api_type: APIType):
        """Check and enforce rate limiting"""
        rate_limiter = self.rate_limiters[api_type]
        current_time = time.time()

        # Reset counter if a minute has passed
        if current_time - rate_limiter["last_reset"] >= 60:
            rate_limiter["requests"] = 0
            rate_limiter["last_reset"] = current_time

        # Check if rate limit exceeded
        if rate_limiter["requests"] >= rate_limiter["limit"]:
            sleep_time = 60 - (current_time - rate_limiter["last_reset"])
            if sleep_time > 0:
                logger.warning(
                    f"⚠️ Rate limit reached for {api_type.value}, sleeping {sleep_time:.1f}s"
                )
                await asyncio.sleep(sleep_time)
                rate_limiter["requests"] = 0
                rate_limiter["last_reset"] = time.time()

        rate_limiter["requests"] += 1

    # Sports Data API Methods
    async def get_mlb_data(self, endpoint: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Get MLB data"""

        async def fetch_mlb():
            return await self._make_api_request(APIType.MLB, endpoint, **kwargs)

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"mlb_{endpoint}_{hash(str(kwargs))}",
            fetch_mlb,
            cache_ttl=self.apis[APIType.MLB].cache_ttl,
        )

    async def get_nfl_data(self, endpoint: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Get NFL data"""

        async def fetch_nfl():
            return await self._make_api_request(APIType.NFL, endpoint, **kwargs)

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"nfl_{endpoint}_{hash(str(kwargs))}",
            fetch_nfl,
            cache_ttl=self.apis[APIType.NFL].cache_ttl,
        )

    async def get_nba_data(self, endpoint: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Get NBA data"""

        async def fetch_nba():
            return await self._make_api_request(APIType.NBA, endpoint, **kwargs)

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"nba_{endpoint}_{hash(str(kwargs))}",
            fetch_nba,
            cache_ttl=self.apis[APIType.NBA].cache_ttl,
        )

    async def get_nhl_data(self, endpoint: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Get NHL data"""

        async def fetch_nhl():
            return await self._make_api_request(APIType.NHL, endpoint, **kwargs)

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"nhl_{endpoint}_{hash(str(kwargs))}",
            fetch_nhl,
            cache_ttl=self.apis[APIType.NHL].cache_ttl,
        )

    async def get_soccer_data(
        self, endpoint: str, **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Get Soccer data"""

        async def fetch_soccer():
            return await self._make_api_request(APIType.SOCCER, endpoint, **kwargs)

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"soccer_{endpoint}_{hash(str(kwargs))}",
            fetch_soccer,
            cache_ttl=self.apis[APIType.SOCCER].cache_ttl,
        )

    # Odds Comparison API Methods
    async def get_player_props_odds(
        self, sport: str, competition: str, **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Get player props odds"""

        async def fetch_props():
            return await self._make_api_request(
                APIType.ODDS_COMPARISON_PLAYER_PROPS,
                "player_props",
                sport=sport,
                competition=competition,
                **kwargs,
            )

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"player_props_{sport}_{competition}_{hash(str(kwargs))}",
            fetch_props,
            cache_ttl=self.apis[APIType.ODDS_COMPARISON_PLAYER_PROPS].cache_ttl,
        )

    async def get_prematch_odds(
        self, sport: str, competition: str, **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Get prematch odds"""

        async def fetch_prematch():
            return await self._make_api_request(
                APIType.ODDS_COMPARISON_PREMATCH,
                "prematch",
                sport=sport,
                competition=competition,
                **kwargs,
            )

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"prematch_{sport}_{competition}_{hash(str(kwargs))}",
            fetch_prematch,
            cache_ttl=self.apis[APIType.ODDS_COMPARISON_PREMATCH].cache_ttl,
        )

    async def get_futures_odds(
        self, sport: str, competition: str, **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Get futures odds"""

        async def fetch_futures():
            return await self._make_api_request(
                APIType.ODDS_COMPARISON_FUTURES,
                "futures",
                sport=sport,
                competition=competition,
                **kwargs,
            )

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"futures_{sport}_{competition}_{hash(str(kwargs))}",
            fetch_futures,
            cache_ttl=self.apis[APIType.ODDS_COMPARISON_FUTURES].cache_ttl,
        )

    # Image API Methods
    async def get_getty_images(
        self, sport: str, competition: str, image_type: str = "action_shots", **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Get Getty Images"""

        async def fetch_images():
            return await self._make_api_request(
                APIType.GETTY_IMAGES,
                image_type,
                sport=sport,
                competition=competition,
                **kwargs,
            )

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"getty_{image_type}_{sport}_{competition}",
            fetch_images,
            cache_ttl=self.apis[APIType.GETTY_IMAGES].cache_ttl,
        )

    async def get_sportradar_images(
        self, image_type: str = "country_flags", **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Get SportRadar images"""

        async def fetch_sr_images():
            return await self._make_api_request(
                APIType.SPORTRADAR_IMAGES, image_type, **kwargs
            )

        return await enhanced_data_pipeline.fetch_data_with_resilience(
            f"sportradar_images_{image_type}_{hash(str(kwargs))}",
            fetch_sr_images,
            cache_ttl=self.apis[APIType.SPORTRADAR_IMAGES].cache_ttl,
        )

    # Comprehensive Data Aggregation
    async def get_comprehensive_sports_data(
        self, sports: List[str] = None
    ) -> Dict[str, Any]:
        """Get comprehensive data across all available APIs"""
        if sports is None:
            sports = ["mlb", "nfl", "nba", "nhl", "soccer"]

        comprehensive_data = {
            "timestamp": datetime.now().isoformat(),
            "sports_data": {},
            "odds_data": {},
            "images": {},
            "metadata": {
                "apis_used": [],
                "quota_usage": self.quota_usage.copy(),
                "trial_status": self._get_trial_status(),
            },
        }

        # Prepare parallel requests
        requests = []

        for sport in sports:
            # Sports data requests
            if sport == "mlb":
                requests.extend(
                    [
                        (f"mlb_live", self.get_mlb_data, ("live_scores",), {}),
                        (
                            f"mlb_hierarchy",
                            self.get_mlb_data,
                            ("league_hierarchy",),
                            {},
                        ),
                    ]
                )
            elif sport == "nfl":
                requests.extend(
                    [
                        (f"nfl_live", self.get_nfl_data, ("live_scores",), {}),
                        (
                            f"nfl_hierarchy",
                            self.get_nfl_data,
                            ("league_hierarchy",),
                            {},
                        ),
                    ]
                )
            elif sport == "nba":
                requests.extend(
                    [
                        (f"nba_live", self.get_nba_data, ("live_scores",), {}),
                        (
                            f"nba_hierarchy",
                            self.get_nba_data,
                            ("league_hierarchy",),
                            {},
                        ),
                    ]
                )
            elif sport == "nhl":
                requests.extend(
                    [
                        (f"nhl_live", self.get_nhl_data, ("live_scores",), {}),
                        (
                            f"nhl_hierarchy",
                            self.get_nhl_data,
                            ("league_hierarchy",),
                            {},
                        ),
                    ]
                )
            elif sport == "soccer":
                requests.extend(
                    [
                        (f"soccer_live", self.get_soccer_data, ("live_scores",), {}),
                        (
                            f"soccer_tournaments",
                            self.get_soccer_data,
                            ("tournaments",),
                            {},
                        ),
                    ]
                )

            # Odds data requests
            competition = "premier_league" if sport == "soccer" else "regular_season"
            requests.extend(
                [
                    (
                        f"props_{sport}",
                        self.get_player_props_odds,
                        (sport, competition),
                        {},
                    ),
                    (
                        f"prematch_{sport}",
                        self.get_prematch_odds,
                        (sport, competition),
                        {},
                    ),
                    (
                        f"futures_{sport}",
                        self.get_futures_odds,
                        (sport, competition),
                        {},
                    ),
                ]
            )

        # Execute parallel requests
        results = await enhanced_data_pipeline.fetch_parallel_data(
            requests, max_failures=len(requests) // 3  # Allow up to 1/3 failures
        )

        # Organize results
        for key, data in results.items():
            if data is not None:
                if key.startswith(("mlb_", "nfl_", "nba_", "nhl_", "soccer_")):
                    sport_name = key.split("_")[0]
                    if sport_name not in comprehensive_data["sports_data"]:
                        comprehensive_data["sports_data"][sport_name] = {}
                    comprehensive_data["sports_data"][sport_name][key] = data
                elif key.startswith(("props_", "prematch_", "futures_")):
                    comprehensive_data["odds_data"][key] = data

        # Add images
        try:
            flags = await self.get_sportradar_images("country_flags")
            if flags:
                comprehensive_data["images"]["country_flags"] = flags
        except Exception as e:
            logger.warning(f"⚠️ Failed to get country flags: {e}")

        comprehensive_data["metadata"]["apis_used"] = list(
            set(
                [
                    api_type.value
                    for api_type in self.apis.keys()
                    if self.quota_usage.get(api_type, 0) > 0
                ]
            )
        )

        return comprehensive_data

    def _get_trial_status(self) -> Dict[str, Any]:
        """Get trial status for all APIs"""
        trial_status = {}

        for api_type, api_config in self.apis.items():
            trial_status[api_type.value] = {
                "quota_limit": api_config.quota_limit,
                "quota_used": self.quota_usage.get(api_type, 0),
                "quota_remaining": api_config.quota_limit
                - self.quota_usage.get(api_type, 0),
                "trial_end": api_config.trial_end,
                "packages": api_config.packages,
            }

        return trial_status

    async def _monitor_usage(self):
        """Monitor API usage and quota consumption"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes

                total_requests = sum(self.quota_usage.values())
                logger.info(
                    f"📊 SportRadar Usage Summary: {total_requests} total requests"
                )

                # Log quota status for each API
                for api_type, usage in self.quota_usage.items():
                    if usage > 0:
                        api_config = self.apis[api_type]
                        percentage = (usage / api_config.quota_limit) * 100
                        logger.info(
                            f"  {api_type.value}: {usage}/{api_config.quota_limit} ({percentage:.1f}%)"
                        )

            except Exception as e:
                logger.error(f"❌ Usage monitoring error: {e}")

    async def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        health = {
            "service": "comprehensive_sportradar",
            "status": "healthy",
            "api_key_configured": bool(self.api_key),
            "total_apis": len(self.apis),
            "quota_status": self._get_trial_status(),
            "session_active": bool(self.session and not self.session.closed),
            "monitoring_active": bool(
                self._monitoring_task and not self._monitoring_task.done()
            ),
        }

        # Check for any quota exhaustion
        exhausted_apis = [
            api_type.value
            for api_type, usage in self.quota_usage.items()
            if usage >= self.apis[api_type].quota_limit * 0.9  # 90% threshold
        ]

        if exhausted_apis:
            health["status"] = "degraded"
            health["quota_warnings"] = exhausted_apis

        return health

    async def close(self):
        """Cleanup service resources"""
        logger.info("🔄 Shutting down Comprehensive SportRadar service...")

        # Cancel monitoring task
        if self._monitoring_task and not self._monitoring_task.done():
            self._monitoring_task.cancel()
            try:
                await self._monitoring_task
            except asyncio.CancelledError:
                pass

        # Close HTTP session
        if self.session and not self.session.closed:
            await self.session.close()

        logger.info("✅ Comprehensive SportRadar service shutdown completed")


# Global instance
comprehensive_sportradar_service = ComprehensiveSportRadarService()
