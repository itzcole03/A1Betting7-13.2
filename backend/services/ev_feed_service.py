"""
+EV Feed Service

Background service that generates materialized +EV snapshots every 60 seconds.
Includes opportunity detection, EV calculation, and Redis caching.
"""

"""
Spec Reference:
See docs/ev_feed_persistence_spec.md for planned persistence & WebSocket design.
(No persistence logic implemented yet; this file remains in-memory only.)
"""

import asyncio
import json
import logging
import random
import time
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple


def _safe_dump(obj):
    """Return a dict-like serialization for Pydantic v2/v1 models with fallbacks."""
    try:
        if hasattr(obj, "model_dump") and callable(getattr(obj, "model_dump")):
            return obj.model_dump()
    except Exception:
        pass
    try:
        if hasattr(obj, "dict") and callable(getattr(obj, "dict")):
            return obj.dict()
    except Exception:
        pass
    return getattr(obj, "__dict__", obj)


import redis.asyncio as redis

from backend.models.ev_models import (
    EVFeedResponse,
    EVFeedStats,
    EVOpportunity,
    EVTier,
    MarketType,
    SportType,
    calculate_expected_value,
)

try:
    from backend.services.unified_cache_service import UnifiedCacheService, get_cache
except ImportError:  # pragma: no cover - cache optional in some environments
    UnifiedCacheService = None  # type: ignore[assignment]
    get_cache = None
from backend.services.unified_data_fetcher import unified_data_fetcher

try:
    from backend.services.mlb_stats_api_client import MLBStatsAPIClient
except Exception:  # pragma: no cover - optional dependency
    MLBStatsAPIClient = None  # type: ignore[assignment]

logger = logging.getLogger("ev_feed_service")

_cache_instance: Optional[Any] = None
_cache_lock = asyncio.Lock()


async def _get_cache() -> Optional[Any]:
    global _cache_instance

    if get_cache is None:
        return None

    if _cache_instance is None:
        async with _cache_lock:
            if _cache_instance is None:
                try:
                    _cache_instance = await get_cache()
                except Exception as exc:  # pragma: no cover - defensive guard
                    logger.debug("EV feed cache unavailable: %s", exc)
                    return None
    return _cache_instance


async def _cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    cache = await _get_cache()
    if cache is None:
        return False

    try:
        await cache.set(key, value, ttl=ttl)
        return True
    except Exception as exc:  # pragma: no cover - cache backend failure
        logger.debug("EV feed cache write failed for %s: %s", key, exc)
        return False


async def _cache_get(key: str, default: Any = None) -> Any:
    cache = await _get_cache()
    if cache is None:
        return default

    try:
        return await cache.get(key, default)
    except Exception as exc:  # pragma: no cover - cache backend failure
        logger.debug("EV feed cache read failed for %s: %s", key, exc)
        return default


class EVFeedService:
    """Service for generating and managing +EV opportunity feeds.

    Summary of new in-memory feed features (non-breaking):
    - Ring buffer (max 500) for most recent opportunities before any persistence layer.
    - asyncio.Lock ensures atomic add + dedupe + prune operations.
    - Dedup window 5 minutes keyed by player|market|source_book|market_odds|our_fair_odds.
    - Counters surfaced via /api/ev/feed/meta (added later in this PR).
    - edge_tier: lightweight classification (micro/solid/strong/elite) derived from ev_percent.
    """

    def __init__(self):
        # Lifecycle
        self.redis_client = None
        self.background_task = None
        self.is_running = False
        self.last_generation_time = None
        self.generation_count = 0
        self._initialized = False

        # Core config
        self.REDIS_KEY = "ev:feed"
        self.STATS_KEY = "ev:feed:stats"
        self.SNAPSHOT_KEY_PREFIX = "ev:snapshots:"
        self.SNAPSHOT_MAX_PER_OPP = 50
        self.SLOPE_WINDOW = 5
        self.PREDICTION_HORIZON_MIN = 5
        self.GENERATION_INTERVAL = 60
        self.MIN_EV_THRESHOLD = 3.0
        self.MAX_OPPORTUNITIES = 1000

        self.sportsbooks = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "PointsBet"]

        # Ring buffer + dedupe
        self.MAX_RING_CAPACITY = 500
        self._ring = []  # List[Dict[str, Any]]
        self._ring_lock = asyncio.Lock()
        # Public alias for clarity with new requirements
        self._lock = self._ring_lock
        self._dedup_index = {}  # Dict[str, Tuple[float, int]]
        self.DEDUP_WINDOW_SECONDS = 300
        self.total_added = 0
        self.total_deduped = 0
        self.total_replaced = 0
        self.last_prune_at = None  # float timestamp
        self.last_added_at = None  # float timestamp
        self.max_edge = 0.0
        self._initialize_lock = asyncio.Lock()
        self._generation_lock = asyncio.Lock()
        self.mlb_stats_client = None

        if MLBStatsAPIClient is not None:
            try:
                self.mlb_stats_client = MLBStatsAPIClient()
                logger.info("EVFeedService initialized MLBStatsAPIClient integration")
            except Exception as init_error:  # pragma: no cover - initialization guard
                logger.warning(
                    "EVFeedService could not initialize MLBStatsAPIClient; using mock MLB data (%s)",
                    init_error,
                )

    @staticmethod
    def classify_edge(edge_pct: float) -> str:
        """Classify edge percentage into micro/solid/strong/elite."""
        try:
            v = float(edge_pct)
        except Exception:
            return "unknown"
        if v > 5:
            return "elite"
        if v >= 3:
            return "strong"
        if v >= 1.5:
            return "solid"
        if v >= 0:
            return "micro"
        return "unknown"

    # ------------- Ring Buffer Operations -------------
    async def add_feed_entry(self, opp: "EVOpportunity") -> Dict[str, Any]:  # type: ignore
        """Add an EV opportunity with dedupe & replacement semantics.

        Dedupe logic (5 min window):
        - Key: player|market|source_book|line? (embedded in market string) | market_odds
          (using our_fair_odds removed from key to allow replacement evaluation on edge changes)
        - If existing within window and abs(ev% delta) < 0.15 => count as deduped (skip insert)
        - If existing and new ev% strictly greater => replace existing (count total_replaced)
        - Else append new entry
        Returns dictionary representing stored or existing entry with flags:
          { deduped: bool, replaced: bool }
        """
        # asyncio.Lock objects are bound to the event loop they were created in.
        # In test environments the service instance may be created during import
        # on a different loop; attempting to 'async with self._lock' can raise
        # a RuntimeError. To be resilient, attempt to use the configured lock
        # and recreate it in the current loop if that fails.
        try:
            async with self._lock:
                _need_recreate = False
        except RuntimeError:
            # Replace with a lock bound to the current event loop
            self._lock = asyncio.Lock()

        try:
            now_ts = time.time()
            ev_pct = float(getattr(opp, "ev_percent", 0.0))
            # Update max_edge
            if ev_pct > self.max_edge:
                self.max_edge = ev_pct
            opp_dict = _safe_dump(opp)
            # ensure updated_at is serialized to isoformat if present
            try:
                if opp_dict.get("updated_at"):
                    opp_dict["updated_at"] = opp_dict["updated_at"].isoformat()
            except Exception:
                pass
            opp_dict["edge_tier"] = self.classify_edge(ev_pct)
            opp_dict["added_epoch"] = now_ts
            # Dedup key (without our_fair_odds so replacements considered)
            key = f"{opp.player}|{opp.market}|{opp.source_book}|{opp.market_odds}"
            existing = self._dedup_index.get(key)
            result = {"deduped": False, "replaced": False}
            if existing:
                ts, idx = existing
                within_window = (now_ts - ts) <= self.DEDUP_WINDOW_SECONDS
                if within_window and 0 <= idx < len(self._ring):
                    current_ev = float(self._ring[idx].get("ev_percent", 0.0))
                    if abs(current_ev - ev_pct) < 0.15:
                        # Duplicate (ignore)
                        self.total_deduped += 1
                        logger.debug(
                            "ev_feed:dedupe_skip",
                            extra={
                                "key": key,
                                "edge": current_ev,
                                "new_edge": ev_pct,
                            },
                        )
                        result["deduped"] = True
                        return {**self._ring[idx], **result}
                    if ev_pct > current_ev:
                        # Replacement (improved edge)
                        self._ring[idx].update(opp_dict)
                        self._dedup_index[key] = (now_ts, idx)
                        self.total_replaced += 1
                        logger.debug(
                            "ev_feed:replaced",
                            extra={
                                "key": key,
                                "old_edge": current_ev,
                                "new_edge": ev_pct,
                                "tier": opp_dict.get("edge_tier"),
                            },
                        )
                        result["replaced"] = True
                        self.last_added_at = now_ts
                        return {**self._ring[idx], **result}
                # Stale or out of window -> treat as new append
            # Append new
            self._ring.append(opp_dict)
            self._dedup_index[key] = (now_ts, len(self._ring) - 1)
            self.total_added += 1
            logger.debug(
                "ev_feed:add",
                extra={
                    "key": key,
                    "edge": ev_pct,
                    "tier": opp_dict.get("edge_tier"),
                    "size": len(self._ring),
                },
            )
            self.last_added_at = now_ts
            # Prune if capacity exceeded
            if len(self._ring) > self.MAX_RING_CAPACITY:
                overflow = len(self._ring) - self.MAX_RING_CAPACITY
                if overflow > 0:
                    self._ring = self._ring[overflow:]
                    new_index = {}
                    for idx, item in enumerate(self._ring):
                        key2 = f"{item.get('player')}|{item.get('market')}|{item.get('source_book')}|{item.get('market_odds')}"
                        new_index[key2] = (now_ts, idx)
                    self._dedup_index = new_index
                    self.last_prune_at = now_ts
                    logger.debug(
                        "ev_feed:prune",
                        extra={
                            "removed": overflow,
                            "size": len(self._ring),
                        },
                    )
            return {**opp_dict, **result}
        except Exception as e:  # pragma: no cover - defensive
            logger.debug(f"add_feed_entry failed (non-fatal): {e}")
            return {"error": str(e)}

    def get_meta(self) -> Dict[str, Any]:
        """Return lightweight meta counters for observability."""
        return {
            "total_added": self.total_added,
            "total_deduped": self.total_deduped,
            "total_replaced": getattr(self, "total_replaced", 0),
            "current_size": len(self._ring),
            "max_capacity": self.MAX_RING_CAPACITY,
            "last_added_at": self.last_added_at,
            "last_prune_at": self.last_prune_at,
            "max_edge": self.max_edge,
        }

    async def initialize(self):
        """Initialize the service and Redis connection"""
        if self._initialized:
            return
        try:
            self.redis_client = redis.from_url(
                "redis://localhost:6379", decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("EVFeedService initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize EVFeedService: {e}")
            # Fallback to unified cache service
            self.redis_client = None
        finally:
            self._initialized = True

    async def ensure_initialized(self):
        if self._initialized:
            return
        async with self._initialize_lock:
            if not self._initialized:
                await self.initialize()

    async def _generate_and_cache_opportunities(self) -> List[EVOpportunity]:
        """Generate a fresh batch of opportunities and persist them in cache."""
        async with self._generation_lock:
            opportunities = await self._generate_ev_opportunities()
            await self._store_opportunities(opportunities)
            self.last_generation_time = datetime.now(timezone.utc)
            self.generation_count += 1
            return opportunities

    async def start_background_task(self):
        """Start the background task for generating +EV feeds"""
        if self.is_running:
            logger.warning("Background task already running")
            return

        self.is_running = True
        self.background_task = asyncio.create_task(self._background_feed_generator())
        logger.info("Started +EV feed background task")

    async def stop_background_task(self):
        """Stop the background task"""
        if self.background_task:
            self.background_task.cancel()
            try:
                await self.background_task
            except asyncio.CancelledError:
                pass
        self.is_running = False
        logger.info("Stopped +EV feed background task")

    async def _background_feed_generator(self):
        """Background task that generates +EV feeds every 60 seconds"""
        logger.info("Starting +EV feed generation loop")

        while self.is_running:
            try:
                start_time = time.time()

                # Generate new +EV opportunities
                opportunities = await self._generate_ev_opportunities()

                # Store in Redis/cache
                await self._store_opportunities(opportunities)

                # Update statistics
                generation_time = int((time.time() - start_time) * 1000)
                await self._update_stats(opportunities, generation_time)

                self.last_generation_time = datetime.now(timezone.utc)
                self.generation_count += 1

                logger.info(
                    f"Generated {len(opportunities)} +EV opportunities in {generation_time}ms"
                )

                # Wait for next generation cycle
                await asyncio.sleep(self.GENERATION_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in +EV feed generation: {e}")
                await asyncio.sleep(30)  # Wait 30s before retry on error

    async def _generate_ev_opportunities(self) -> List[EVOpportunity]:
        """Generate +EV opportunities from available data sources"""
        opportunities = []

        try:
            # Fetch current props from various sources
            mlb_props = await self._fetch_mlb_props()
            nba_props = await self._fetch_nba_props()
            nfl_props = await self._fetch_nfl_props()

            # Process each sport's props
            opportunities.extend(
                await self._process_sport_props(mlb_props, SportType.MLB)
            )
            opportunities.extend(
                await self._process_sport_props(nba_props, SportType.NBA)
            )
            opportunities.extend(
                await self._process_sport_props(nfl_props, SportType.NFL)
            )

            # Filter for positive EV only
            positive_ev_opportunities = [
                opp for opp in opportunities if opp.ev_percent >= self.MIN_EV_THRESHOLD
            ]

            # Sort by EV percentage (highest first)
            positive_ev_opportunities.sort(key=lambda x: x.ev_percent, reverse=True)

            # Limit to max opportunities
            return positive_ev_opportunities[: self.MAX_OPPORTUNITIES]

        except Exception as e:
            logger.error(f"Error generating +EV opportunities: {e}")
            return []

    async def _fetch_mlb_props(self) -> List[Dict]:
        """Fetch MLB props from data sources"""
        if self.mlb_stats_client is None:
            try:
                return self._generate_mock_props(SportType.MLB, 20)
            except Exception as mock_error:
                logger.error(f"Error generating mock MLB props: {mock_error}")
                return []

        try:
            raw_props = await self.mlb_stats_client.generate_player_props_data()
            normalized: List[Dict[str, Any]] = []
            for prop in raw_props or []:
                try:
                    normalized_prop = self._normalize_mlb_prop(prop)
                    if normalized_prop:
                        normalized.append(normalized_prop)
                except Exception as normalize_error:
                    logger.debug(
                        "Skipping MLB prop in EV feed due to normalization error: %s",
                        normalize_error,
                    )

            if normalized:
                return normalized

            logger.debug(
                "MLB stats client returned no props; falling back to mock data"
            )
            return self._generate_mock_props(SportType.MLB, 20)
        except Exception as stats_error:
            logger.warning(
                "MLB stats fetch failed for EV feed; using mock data (%s)",
                stats_error,
            )
            return self._generate_mock_props(SportType.MLB, 20)

    async def _fetch_nba_props(self) -> List[Dict]:
        """Fetch NBA props from data sources"""
        try:
            # Mock NBA props for demo
            return self._generate_mock_props(SportType.NBA, 15)
        except Exception as e:
            logger.error(f"Error fetching NBA props: {e}")
            return []

    async def _fetch_nfl_props(self) -> List[Dict]:
        """Fetch NFL props from data sources"""
        try:
            # Mock NFL props for demo
            return self._generate_mock_props(SportType.NFL, 10)
        except Exception as e:
            logger.error(f"Error fetching NFL props: {e}")
            return []

    def _generate_mock_props(self, sport: SportType, count: int) -> List[Dict]:
        """Generate mock props for demonstration"""
        import random

        players = {
            SportType.MLB: [
                "Aaron Judge",
                "Mookie Betts",
                "Ronald Acuña Jr.",
                "Mike Trout",
                "Francisco Lindor",
            ],
            SportType.NBA: [
                "LeBron James",
                "Stephen Curry",
                "Giannis Antetokounmpo",
                "Luka Dončić",
                "Jayson Tatum",
            ],
            SportType.NFL: [
                "Josh Allen",
                "Patrick Mahomes",
                "Lamar Jackson",
                "Travis Kelce",
                "Tyreek Hill",
            ],
        }

        markets = {
            SportType.MLB: ["Hits", "RBIs", "Home Runs", "Strikeouts", "Total Bases"],
            SportType.NBA: [
                "Points",
                "Rebounds",
                "Assists",
                "Three-Pointers",
                "Steals",
            ],
            SportType.NFL: [
                "Passing Yards",
                "Rushing Yards",
                "Touchdowns",
                "Receptions",
                "Receiving Yards",
            ],
        }

        props = []
        for i in range(count):
            player = random.choice(players[sport])
            market = random.choice(markets[sport])
            line = random.uniform(0.5, 50.5)

            props.append(
                {
                    "player": player,
                    "market": f"{market} Over {line:.1f}",
                    "market_type": "player_props",
                    "line": line,
                    "game_info": f"Team A @ Team B",
                    "odds_data": {
                        sbook: random.randint(-150, 150) for sbook in self.sportsbooks
                    },
                }
            )

        return props

    async def _process_sport_props(
        self, props: List[Dict], sport: SportType
    ) -> List[EVOpportunity]:
        """Process props for a specific sport and detect +EV opportunities"""
        opportunities = []

        for prop in props:
            try:
                # Calculate fair odds (mock calculation for demo)
                fair_odds = await self._calculate_fair_odds(prop, sport)

                # Check each sportsbook for +EV opportunities
                odds_data = prop.get("odds_data", {})
                for sportsbook, market_odds in odds_data.items():
                    if market_odds and fair_odds:
                        # Calculate EV
                        ev_result = calculate_expected_value(market_odds, fair_odds)

                        if (
                            ev_result.is_positive
                            and ev_result.ev_percent >= self.MIN_EV_THRESHOLD
                        ):
                            opportunity = EVOpportunity(
                                id=f"{sport}_{prop.get('player', 'unknown')}_{sportsbook}_{int(time.time())}",
                                player=prop.get("player", "Unknown Player"),
                                market=prop.get("market", "Unknown Market"),
                                sport=sport,
                                market_type=MarketType.PLAYER_PROPS,
                                our_fair_odds=fair_odds,
                                market_odds=market_odds,
                                ev_percent=round(ev_result.ev_percent, 2),
                                source_book=sportsbook,
                                game_info=prop.get("game_info", "Unknown Game"),
                                confidence_score=random.uniform(0.7, 0.95),
                                volume_indicator="Medium",
                                line_movement="Stable",
                                predicted_ev_next_5m=None,
                                edge_tier=self.classify_edge(ev_result.ev_percent),
                            )
                            opportunities.append(opportunity)

            except Exception as e:
                logger.error(f"Error processing prop: {e}")
                continue

        return opportunities

    async def _calculate_fair_odds(self, prop: Dict, sport: SportType) -> float:
        """Calculate fair odds for a prop (mock implementation)"""
        model_prob = prop.get("model_probability")
        if sport == SportType.MLB and model_prob is not None:
            try:
                probability = self._clamp_probability(float(model_prob))
                return float(self._probability_to_american(probability))
            except Exception as prob_error:
                logger.debug(
                    "Falling back to stochastic fair odds for MLB prop due to probability error: %s",
                    prob_error,
                )

        # Mock fair odds calculation for other sports / fallback
        base_odds = random.choice([-110, -105, -115, -120, 100, 105, 110])
        variance = random.uniform(-20, 30)
        fair_odds = base_odds + variance

        return round(fair_odds, 1)

    def _normalize_mlb_prop(self, prop: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalize MLB Stats API prop into EV feed friendly payload."""

        player_name = prop.get("player_name") or prop.get("player")
        stat_type = prop.get("stat_type") or prop.get("market")
        line_value = prop.get("line") or prop.get("line_score")

        if player_name is None or stat_type is None or line_value is None:
            return None

        try:
            stat_display = str(stat_type).replace("_", " ").title()
            line_float = float(line_value)
        except (TypeError, ValueError) as parse_error:
            raise ValueError(
                f"Invalid MLB prop line value: {line_value}"
            ) from parse_error

        market = (
            f"{stat_display} Over {line_float:.1f}"
            if line_float % 1
            else f"{stat_display} Over {int(line_float)}"
        )

        odds_data: Dict[str, int] = {}
        for bookmaker in prop.get("bookmakers", []) or []:
            name = bookmaker.get("name") or "Sportsbook"
            odds = bookmaker.get("odds")
            if odds is None:
                continue
            try:
                odds_data[name] = int(round(float(odds)))
            except (TypeError, ValueError):
                continue

        if not odds_data and prop.get("odds") is not None:
            try:
                odds_data["Season Benchmark"] = int(round(float(prop["odds"])))
            except (TypeError, ValueError):
                pass

        if not odds_data:
            return None

        model_probability = prop.get("ai_probability")
        if model_probability is not None:
            model_probability = self._clamp_probability(
                float(model_probability) / 100.0
            )

        implied_probability = prop.get("implied_probability")
        if implied_probability is not None:
            implied_probability = self._clamp_probability(
                float(implied_probability) / 100.0
            )

        game_info = (
            prop.get("matchup")
            or f"{prop.get('team_name', 'MLB')} vs {prop.get('opponent', 'Opponent')}"
        )

        normalized = {
            "player": player_name,
            "market": market,
            "market_type": MarketType.PLAYER_PROPS.value,
            "line": line_float,
            "game_info": game_info,
            "odds_data": odds_data,
            "model_probability": model_probability,
            "implied_probability": implied_probability,
            "edge_pct": prop.get("edge"),
            "provider": prop.get("provider_id", "mlb_stats_api"),
            "team": prop.get("team_name"),
            "opponent": prop.get("opponent"),
            "start_time": prop.get("start_time"),
        }

        return normalized

    @staticmethod
    def _clamp_probability(value: float) -> float:
        return max(0.01, min(0.99, value))

    @staticmethod
    def _probability_to_american(probability: float) -> int:
        probability = EVFeedService._clamp_probability(probability)
        if probability >= 0.5:
            odds = -((probability / (1 - probability)) * 100)
        else:
            odds = ((1 - probability) / probability) * 100
        return int(round(odds))

    async def _store_opportunities(self, opportunities: List[EVOpportunity]):
        """Store opportunities in Redis/cache"""
        try:
            # Convert to JSON-serializable format
            opportunities_data = []
            for opp in opportunities:
                opp_dict = _safe_dump(opp)
                try:
                    if opp_dict.get("updated_at"):
                        opp_dict["updated_at"] = opp_dict["updated_at"].isoformat()
                except Exception:
                    pass
                # Supplemental edge classification (non-breaking optional field)
                opp_dict["edge_tier"] = self.classify_edge(
                    opp_dict.get("ev_percent", 0)
                )
                opportunities_data.append(opp_dict)

                # Insert into ring buffer (best-effort; failure does not block)
                try:
                    await self.add_feed_entry(opp)
                except Exception as _e:  # pragma: no cover - defensive
                    logger.debug(f"ring buffer add skipped: {_e}")

            # Also record EV snapshots per stable key for forecasting
            try:
                for opp in opportunities:
                    await self.record_ev_snapshot(opp)
            except Exception as e:
                logger.debug(f"Snapshot recording failed (non-fatal): {e}")

            # Store in Redis if available
            if self.redis_client:
                await self.redis_client.set(
                    self.REDIS_KEY,
                    json.dumps(opportunities_data),
                    ex=300,  # 5 minute expiry
                )
            else:
                # Fallback to unified cache service
                await _cache_set(self.REDIS_KEY, opportunities_data, ttl=300)

            try:
                logger.debug(
                    "ev_feed:batch_summary",
                    extra={
                        "added": self.total_added,
                        "deduped": self.total_deduped,
                        "replaced": self.total_replaced,
                        "size": len(self._ring),
                        "batch_count": len(opportunities_data),
                    },
                )
            except Exception:
                # Fallback minimal log if structured logging fails
                logger.debug(
                    f"ev_feed:batch_summary added={self.total_added} deduped={self.total_deduped} replaced={self.total_replaced} size={len(self._ring)} batch={len(opportunities_data)}"
                )

            if opportunities_data:
                # Record an effective generation timestamp so downstream calls avoid forced refresh.
                self.last_generation_time = datetime.now(timezone.utc)

        except Exception as e:
            logger.error(f"Error storing opportunities: {e}")

    async def _update_stats(
        self, opportunities: List[EVOpportunity], generation_time_ms: int
    ):
        """Update feed statistics"""
        try:
            # Calculate statistics
            by_sport = {}
            by_tier = {}
            total_ev = 0

            for opp in opportunities:
                # Count by sport
                sport_key = opp.sport.value
                by_sport[sport_key] = by_sport.get(sport_key, 0) + 1

                # Count by tier
                tier_key = opp.ev_tier.value
                by_tier[tier_key] = by_tier.get(tier_key, 0) + 1

                # Sum EV for average
                total_ev += opp.ev_percent

            avg_ev = total_ev / len(opportunities) if opportunities else 0
            max_edge = (
                max((opp.ev_percent for opp in opportunities), default=0)
                if opportunities
                else 0
            )

            stats = EVFeedStats(
                total_opportunities=len(opportunities),
                by_sport=by_sport,
                by_tier=by_tier,
                avg_ev_percent=round(avg_ev, 2),
                last_generation_time=datetime.now(timezone.utc),
                generation_duration_ms=generation_time_ms,
                max_edge=round(max_edge, 2),
            )

            # Store stats
            stats_data = _safe_dump(stats)
            try:
                if stats_data.get("last_generation_time"):
                    stats_data["last_generation_time"] = stats_data[
                        "last_generation_time"
                    ].isoformat()
            except Exception:
                pass

            if self.redis_client:
                await self.redis_client.set(
                    self.STATS_KEY, json.dumps(stats_data), ex=300
                )
            else:
                await _cache_set(self.STATS_KEY, stats_data, ttl=300)

        except Exception as e:
            logger.error(f"Error updating stats: {e}")

    async def get_opportunities(
        self,
        min_ev: float = 3.0,
        sport: SportType = SportType.ALL,
        market_type: Optional[MarketType] = None,
        source_book: Optional[str] = None,
        limit: int = 100,
    ) -> EVFeedResponse:
        """Get filtered +EV opportunities from cache"""
        await self.ensure_initialized()
        try:
            # Retrieve from cache
            if self.redis_client:
                cache_data = await self.redis_client.get(self.REDIS_KEY)
                if cache_data:
                    opportunities_data = json.loads(cache_data)
                else:
                    opportunities_data = []
            else:
                opportunities_data = await _cache_get(self.REDIS_KEY, [])

            opportunities: List[EVOpportunity] = []
            used_ring_fallback = False

            if opportunities_data:
                for opp_data in opportunities_data:
                    try:
                        opp_data["updated_at"] = datetime.fromisoformat(
                            opp_data["updated_at"]
                        )
                        opportunities.append(EVOpportunity(**opp_data))
                    except Exception as e:
                        logger.error(f"Error parsing opportunity: {e}")
                        continue
            elif self._ring:
                for ring_item in self._ring:
                    try:
                        ring_data = dict(ring_item)
                        if isinstance(ring_data.get("updated_at"), str):
                            ring_data["updated_at"] = datetime.fromisoformat(
                                ring_data["updated_at"]
                            )
                        opportunities.append(EVOpportunity(**ring_data))
                    except Exception as e:
                        logger.error(f"Error parsing ring opportunity: {e}")
                        continue
                used_ring_fallback = bool(opportunities)

            should_refresh = False
            if not opportunities:
                should_refresh = True
            elif not used_ring_fallback:
                if self.last_generation_time is None:
                    should_refresh = True
                else:
                    is_stale = (
                        datetime.now(timezone.utc) - self.last_generation_time
                    ) >= timedelta(seconds=self.GENERATION_INTERVAL * 3)
                    should_refresh = is_stale and not self.is_running

            if should_refresh:
                fresh_opportunities = await self._generate_and_cache_opportunities()
                if fresh_opportunities:
                    opportunities = fresh_opportunities
                # If no fresh opportunities were generated, fall back to existing list

            # Apply filters
            filtered_opportunities = self._apply_filters(
                opportunities, min_ev, sport, market_type, source_book
            )

            # Fallback classification: guarantee edge_tier present
            for opp in filtered_opportunities:
                try:
                    if not getattr(opp, "edge_tier", None):
                        # classify from ev_percent and assign directly
                        setattr(
                            opp,
                            "edge_tier",
                            self.classify_edge(getattr(opp, "ev_percent", 0.0)),
                        )
                except Exception:  # pragma: no cover - defensive
                    pass

            # Apply limit after enrichment
            limited_opportunities = filtered_opportunities[:limit]

            # Calculate cache age
            cache_age = 0
            if self.last_generation_time:
                cache_age = int(
                    (
                        datetime.now(timezone.utc) - self.last_generation_time
                    ).total_seconds()
                )

            # Build response
            return EVFeedResponse(
                opportunities=limited_opportunities,
                total_count=len(filtered_opportunities),
                filters_applied={
                    "min_ev": min_ev,
                    "sport": sport.value,
                    "market_type": market_type.value if market_type else None,
                    "source_book": source_book,
                    "limit": limit,
                },
                last_updated=self.last_generation_time or datetime.now(timezone.utc),
                cache_age_seconds=cache_age,
            )

        except Exception as e:
            logger.error(f"Error getting opportunities: {e}")
            return EVFeedResponse(
                opportunities=[],
                total_count=0,
                filters_applied={},
                last_updated=datetime.now(timezone.utc),
                cache_age_seconds=0,
            )

    def _apply_filters(
        self,
        opportunities: List[EVOpportunity],
        min_ev: float,
        sport: SportType,
        market_type: Optional[MarketType],
        source_book: Optional[str],
    ) -> List[EVOpportunity]:
        """Apply filters to opportunities list"""
        filtered = opportunities

        # Filter by minimum EV
        filtered = [opp for opp in filtered if opp.ev_percent >= min_ev]

        # Filter by sport
        if sport != SportType.ALL:
            filtered = [opp for opp in filtered if opp.sport == sport]

        # Filter by market type
        if market_type:
            filtered = [opp for opp in filtered if opp.market_type == market_type]

        # Filter by source book
        if source_book:
            filtered = [opp for opp in filtered if opp.source_book == source_book]

        return filtered

    async def get_stats(self) -> Optional[EVFeedStats]:
        """Get feed statistics"""
        try:
            if self.redis_client:
                stats_data = await self.redis_client.get(self.STATS_KEY)
                if stats_data:
                    stats_dict = json.loads(stats_data)
                    last_generated = stats_dict.get("last_generation_time")
                    if isinstance(last_generated, str):
                        stats_dict["last_generation_time"] = datetime.fromisoformat(
                            last_generated
                        )
                    return EVFeedStats(**stats_dict)
            else:
                stats_data = await _cache_get(self.STATS_KEY)
                if stats_data:
                    stats_dict = dict(stats_data)
                    last_generated = stats_dict.get("last_generation_time")
                    if isinstance(last_generated, str):
                        stats_dict["last_generation_time"] = datetime.fromisoformat(
                            last_generated
                        )
                    return EVFeedStats(**stats_dict)

            return None
        except Exception as e:
            logger.error(f"Error getting feed stats: {e}")
            return None

    # --------- EV Forecasting (Snapshots + Slope) ---------
    def compute_snapshot_key(self, opp: EVOpportunity) -> str:
        """Compute a stable snapshot key for an opportunity independent of transient id."""
        # Use sport|player|normalized_stat|book as identity; avoid spaces for key safety
        norm_market = self._normalize_market_key(opp.market)
        components = [opp.sport.value, opp.player, norm_market, opp.source_book]
        safe = "|".join(c.replace("|", "/").strip() for c in components)
        return f"{self.SNAPSHOT_KEY_PREFIX}{safe}"

    def _normalize_market_key(self, market: str) -> str:
        """Normalize market string to a stable stat key (drop line values and direction).
        Examples:
          'Points Over 20.5' -> 'Points'
          'Rebounds Under 8.5' -> 'Rebounds'
        Fallbacks to original on parsing failure.
        """
        try:
            m = market or ""
            # Remove directional + line pieces
            for token in [" Over ", " Under "]:
                if token in m:
                    return m.split(token)[0].strip()
            return m.strip()
        except Exception:
            return market

    async def record_ev_snapshot(
        self, opp: EVOpportunity, timestamp: Optional[float] = None
    ):
        """Append an EV snapshot for the given opportunity.
        Stores up to SNAPSHOT_MAX_PER_OPP most recent points.
        """
        try:
            ts = timestamp or time.time()
            key = self.compute_snapshot_key(opp)
            entry = {"ts": ts, "ev": float(opp.ev_percent)}

            if self.redis_client:
                # Store snapshots as a JSON array at the key for simplicity
                raw = await self.redis_client.get(key)
                arr = []
                if raw:
                    try:
                        arr = json.loads(raw)
                    except Exception:
                        arr = []
                if not isinstance(arr, list):
                    arr = []
                arr.append(entry)
                if len(arr) > self.SNAPSHOT_MAX_PER_OPP:
                    arr = arr[-self.SNAPSHOT_MAX_PER_OPP :]
                await self.redis_client.set(key, json.dumps(arr), ex=60 * 60)
            else:
                # Fallback: use unified cache as list emulation
                data = await _cache_get(key, [])
                if not isinstance(data, list):
                    data = []
                data.append(entry)
                if len(data) > self.SNAPSHOT_MAX_PER_OPP:
                    data = data[-self.SNAPSHOT_MAX_PER_OPP :]
                await _cache_set(key, data, ttl=3600)
        except Exception as e:
            logger.debug(f"Failed to record EV snapshot: {e}")

    async def get_ev_snapshots(
        self, opp: EVOpportunity, last_n: Optional[int] = None
    ) -> list:
        """Retrieve recent EV snapshots for an opportunity."""
        key = self.compute_snapshot_key(opp)
        try:
            if self.redis_client:
                raw = await self.redis_client.get(key)
                points = []
                if raw:
                    try:
                        data = json.loads(raw)
                        if isinstance(data, list):
                            points = data[-(last_n or self.SLOPE_WINDOW) :]
                    except Exception:
                        points = []
            else:
                data = await _cache_get(key, [])
                points = (
                    data[-(last_n or self.SLOPE_WINDOW) :]
                    if isinstance(data, list)
                    else []
                )

            # sort by timestamp ascending
            points.sort(key=lambda p: p.get("ts", 0))
            return points
        except Exception as e:
            logger.debug(f"Failed to load EV snapshots: {e}")
            return []

    def _compute_slope_per_min(self, points: list) -> float:
        """Compute EV% slope per minute using simple linear regression over points = [{ts, ev}]."""
        if not points or len(points) < 2:
            return 0.0
        # Normalize time to minutes relative to first point for numerical stability
        t0 = points[0]["ts"]
        xs = [(p["ts"] - t0) / 60.0 for p in points]
        ys = [float(p["ev"]) for p in points]

        n = float(len(xs))
        sum_x = sum(xs)
        sum_y = sum(ys)
        sum_xx = sum(x * x for x in xs)
        sum_xy = sum(x * y for x, y in zip(xs, ys))
        denom = n * sum_xx - sum_x * sum_x
        if denom == 0:
            return 0.0
        slope = (n * sum_xy - sum_x * sum_y) / denom
        return float(slope)

    async def compute_forecasts(self, min_ev: float = 2.0, limit: int = 100) -> list:
        """Compute forecast items for current feed opportunities with positive slope."""
        try:
            feed = await self.get_opportunities(
                min_ev=min_ev, sport=SportType.ALL, limit=1000
            )
            items = []
            for opp in feed.opportunities:
                snaps = await self.get_ev_snapshots(opp, last_n=self.SLOPE_WINDOW)
                # Ensure current point is included
                if not snaps or (
                    snaps and abs(snaps[-1].get("ev", 0) - float(opp.ev_percent)) > 1e-6
                ):
                    # Use opp.updated_at as timestamp if recent; fallback to now
                    ts = (
                        opp.updated_at.timestamp()
                        if isinstance(opp.updated_at, datetime)
                        else time.time()
                    )
                    snaps = (snaps + [{"ts": ts, "ev": float(opp.ev_percent)}])[
                        -self.SLOPE_WINDOW :
                    ]

                slope = self._compute_slope_per_min(snaps)
                if slope <= 0:
                    continue

                predicted = float(opp.ev_percent) + slope * self.PREDICTION_HORIZON_MIN
                items.append(
                    {
                        "key": self.compute_snapshot_key(opp),
                        "player": opp.player,
                        "market": opp.market,
                        "sport": opp.sport.value,
                        "source_book": opp.source_book,
                        "current_ev": float(opp.ev_percent),
                        "slope_per_min": slope,
                        "predictedEvNext5m": round(predicted, 2),
                        "num_snapshots": len(snaps),
                        "last_updated": (
                            opp.updated_at.isoformat()
                            if isinstance(opp.updated_at, datetime)
                            else None
                        ),
                    }
                )

            # Sort by predicted advantage descending
            items.sort(
                key=lambda x: x.get("predictedEvNext5m", 0) - x.get("current_ev", 0),
                reverse=True,
            )
            return items[:limit]
        except Exception as e:
            logger.error(f"Forecast computation failed: {e}")
            return []


# Global service instance
ev_feed_service = EVFeedService()
