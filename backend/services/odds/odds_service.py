"""Odds normalization and aggregation service."""

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel

class OddsFormat(Enum):
    """Supported odds formats"""

    AMERICAN = "american"
    DECIMAL = "decimal"
    FRACTIONAL = "fractional"


class SportsBook(Enum):
    """Supported sportsbooks"""

    SPORTRADAR = "sportradar"
    THEODDS = "theodds"
    FANDUEL = "fanduel"
    DRAFTKINGS = "draftkings"
    BETMGM = "betmgm"
    CAESARS = "caesars"
    BARSTOOL = "barstool"
    POINTSBET = "pointsbet"
    INTERNAL = "internal"


@dataclass
class AggregatedOdds:
    """Unified structure for aggregated odds from multiple sources"""

    sportsbook: str
    line: float
    odds: int  # American format
    last_seen: datetime
    market_type: str = "playerprops"
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sportsbook": self.sportsbook,
            "line": self.line,
            "odds": self.odds,
            "last_seen": self.last_seen.isoformat(),
            "market_type": self.market_type,
            "confidence": self.confidence,
        }


class OddsNormalizer:
    """Normalize odds from multiple sources into unified format"""

    @staticmethod
    def american_to_decimal(american_odds: int) -> float:
        """Convert American odds to decimal format"""
        if american_odds > 0:
            return (american_odds / 100) + 1
        else:
            return (100 / abs(american_odds)) + 1

    @staticmethod
    def decimal_to_american(decimal_odds: float) -> int:
        """Convert decimal odds to American format"""
        if decimal_odds >= 2.0:
            return int((decimal_odds - 1) * 100)
        else:
            return int(-100 / (decimal_odds - 1))

    @staticmethod
    def normalize_sportsbook_name(raw_name: str) -> str:
        """Normalize sportsbook names to consistent format"""
        name_mapping = {
            "draftkings": "DraftKings",
            "fanduel": "FanDuel",
            "betmgm": "BetMGM",
            "caesars": "Caesars",
            "barstool": "Barstool",
            "pointsbet": "PointsBet",
            "sportradar": "SportRadar",
            "theodds": "TheOdds",
            "internal": "Internal",
        }
        return name_mapping.get(raw_name.lower(), raw_name)

    def normalize_odds_data(
        self, raw_data: Dict[str, Any], source: str
    ) -> List[AggregatedOdds]:
        """Normalize raw odds data from various sources"""
        normalized_odds = []

        try:
            if source == "sportradar":
                normalized_odds.extend(self._normalize_sportradar(raw_data))
            elif source == "theodds":
                normalized_odds.extend(self._normalize_theodds(raw_data))
            elif source == "internal":
                normalized_odds.extend(self._normalize_internal(raw_data))
            else:
                logging.warning(f"Unknown odds source: {source}")

        except Exception as e:
            logging.error(f"Error normalizing {source} odds: {e}")

        return normalized_odds

    def _normalize_sportradar(self, data: Dict[str, Any]) -> List[AggregatedOdds]:
        """Normalize SportRadar odds format"""
        odds_list = []

        # SportRadar specific parsing logic
        markets = data.get("markets", [])
        for market in markets:
            outcomes = market.get("outcomes", [])
            for outcome in outcomes:
                odds_list.append(
                    AggregatedOdds(
                        sportsbook="SportRadar",
                        line=float(outcome.get("line", 0)),
                        odds=int(outcome.get("odds", 0)),
                        last_seen=datetime.now(timezone.utc),
                        market_type=market.get("type", "playerprops"),
                        confidence=0.9,  # SportRadar is highly reliable
                    )
                )

        return odds_list

    def _normalize_theodds(self, data: Dict[str, Any]) -> List[AggregatedOdds]:
        """Normalize TheOdds API format"""
        odds_list = []

        # TheOdds API specific parsing logic
        bookmakers = data.get("bookmakers", [])
        for bookmaker in bookmakers:
            markets = bookmaker.get("markets", [])
            for market in markets:
                outcomes = market.get("outcomes", [])
                for outcome in outcomes:
                    odds_list.append(
                        AggregatedOdds(
                            sportsbook=self.normalize_sportsbook_name(
                                bookmaker.get("title", "Unknown")
                            ),
                            line=float(outcome.get("point", 0)),
                            odds=int(outcome.get("price", 0)),
                            last_seen=datetime.now(timezone.utc),
                            market_type=market.get("key", "playerprops"),
                            confidence=0.8,  # TheOdds is reliable but secondary
                        )
                    )

        return odds_list

    def _normalize_internal(self, data: Dict[str, Any]) -> List[AggregatedOdds]:
        """Normalize internal fallback data format"""
        odds_list = []

        # Internal data is already in our format
        if "odds" in data:
            odds_list.append(
                AggregatedOdds(
                    sportsbook="Internal",
                    line=float(data.get("line", 0)),
                    odds=int(data.get("odds", 0)),
                    last_seen=datetime.now(timezone.utc),
                    market_type=data.get("market_type", "playerprops"),
                    confidence=0.6,  # Internal data is less reliable
                )
            )

        return odds_list


class OddsAggregationService:
    """Service for aggregating odds from multiple sources with caching"""

    def __init__(self):
        self.normalizer = OddsNormalizer()
        self.redis_client = None
        self.http_client = None
        self._initialize_clients()

    def _initialize_clients(self):
        """Initialize Redis and HTTP clients"""
        if REDIS_AVAILABLE:
            try:
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
            except Exception as e:
                logging.warning(f"Redis initialization failed: {e}")

        if HTTPX_AVAILABLE:
            self.http_client = httpx.AsyncClient(timeout=10.0)

    async def close(self):
        """Clean up clients"""
        if self.redis_client:
            await self.redis_client.close()
        if self.http_client:
            await self.http_client.aclose()

    def _get_cache_key(self, sport: str, player: str, market: str) -> str:
        """Generate Redis cache key for odds data"""
        return f"odds:{sport}:{player}:{market}"

    async def _get_cached_odds(self, cache_key: str) -> Optional[List[Dict[str, Any]]]:
        """Retrieve cached odds from Redis"""
        if not self.redis_client:
            return None

        try:
            cached_data = await self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logging.warning(f"Redis get error: {e}")

        return None

    async def _cache_odds(
        self, cache_key: str, odds_data: List[Dict[str, Any]], ttl: int = 60
    ):
        """Cache odds data in Redis with TTL"""
        if not self.redis_client:
            return

        try:
            await self.redis_client.setex(cache_key, ttl, json.dumps(odds_data))
        except Exception as e:
            logging.warning(f"Redis set error: {e}")

    async def _fetch_sportradar_odds(
        self, sport: str, player: str, market: str
    ) -> List[AggregatedOdds]:
        """Fetch odds from SportRadar API"""
        if not self.http_client:
            return []

        try:
            api_key = os.getenv("SPORTRADAR_API_KEY")
            if not api_key:
                return []

            url = f"https://api.sportradar.com/v1/{sport.lower()}/odds"
            headers = {"Authorization": f"Bearer {api_key}"}
            params = {"player": player, "market": market}

            response = await self.http_client.get(url, headers=headers, params=params)
            response.raise_for_status()

            data = response.json()
            return self.normalizer.normalize_odds_data(data, "sportradar")

        except Exception as e:
            logging.error(f"SportRadar API error: {e}")
            return []

    async def _fetch_theodds_odds(
        self, sport: str, player: str, market: str
    ) -> List[AggregatedOdds]:
        """Fetch odds from TheOdds API"""
        if not self.http_client:
            return []

        try:
            api_key = os.getenv("THEODDS_API_KEY")
            if not api_key:
                return []

            # Map sport to TheOdds format
            sport_mapping = {
                "MLB": "baseball_mlb",
                "NBA": "basketball_nba",
                "NFL": "americanfootball_nfl",
                "NHL": "icehockey_nhl",
            }

            theodds_sport = sport_mapping.get(sport, sport.lower())
            url = f"https://api.the-odds-api.com/v4/sports/{theodds_sport}/odds"
            headers = {"Authorization": f"Bearer {api_key}"}
            params = {"markets": "player_props", "oddsFormat": "american"}

            response = await self.http_client.get(url, headers=headers, params=params)
            response.raise_for_status()

            data = response.json()
            return self.normalizer.normalize_odds_data(data, "theodds")

        except Exception as e:
            logging.error(f"TheOdds API error: {e}")
            return []

    def _generate_fallback_odds(
        self, sport: str, player: str, market: str
    ) -> List[AggregatedOdds]:
        """Generate fallback odds when external APIs fail"""
        return [
            AggregatedOdds(
                sportsbook="Internal",
                line=25.5,  # Example line
                odds=-110,  # Standard juice
                last_seen=datetime.now(timezone.utc),
                market_type=market,
                confidence=0.5,
            )
        ]

    async def aggregate_odds(
        self, sport: str, player: str, market: str
    ) -> List[AggregatedOdds]:
        """Aggregate odds from multiple sources with caching"""
        cache_key = self._get_cache_key(sport, player, market)

        # Try cache first
        cached_odds = await self._get_cached_odds(cache_key)
        if cached_odds:
            return [AggregatedOdds(**odds) for odds in cached_odds]

        # Fetch from multiple sources concurrently
        odds_sources = await asyncio.gather(
            self._fetch_sportradar_odds(sport, player, market),
            self._fetch_theodds_odds(sport, player, market),
            return_exceptions=True,
        )

        # Combine results
        all_odds = []
        for source_odds in odds_sources:
            if isinstance(source_odds, list):
                all_odds.extend(source_odds)

        # Add fallback if no odds found
        if not all_odds:
            all_odds = self._generate_fallback_odds(sport, player, market)

        # Cache results
        odds_dicts = [odds.to_dict() for odds in all_odds]
        await self._cache_odds(cache_key, odds_dicts, ttl=60)

        return all_odds

    def detect_best_odds(self, odds_list: List[AggregatedOdds]) -> Dict[str, Any]:
        """Detect best line, odds, and spreads for PropOpportunity analysis"""
        if not odds_list:
            return {
                "bestLine": None,
                "bestOdds": None,
                "bestBookmaker": None,
                "lineSpread": 0.0,
                "oddsSpread": 0,
                "numBookmakers": 0,
            }

        # Find best odds (highest value)
        best_odds = max(odds_list, key=lambda x: x.odds)

        # Calculate spreads
        lines = [odds.line for odds in odds_list]
        odds_values = [odds.odds for odds in odds_list]

        line_spread = max(lines) - min(lines) if lines else 0.0
        odds_spread = max(odds_values) - min(odds_values) if odds_values else 0

        return {
            "bestLine": best_odds.line,
            "bestOdds": best_odds.odds,
            "bestBookmaker": best_odds.sportsbook,
            "lineSpread": line_spread,
            "oddsSpread": odds_spread,
            "numBookmakers": len(set(odds.sportsbook for odds in odds_list)),
        }


# Global odds aggregation service instance
odds_aggregation_service = OddsAggregationService()

# Place fallback endpoint after app = FastAPI(...)
app = FastAPI(
    title="A1Betting API",
    description="Complete backend integration for A1Betting frontend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# --- API /api/prizepicks/props fallback for legacy test compatibility ---
