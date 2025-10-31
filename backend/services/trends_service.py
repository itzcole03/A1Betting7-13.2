import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from ..models.trends_models import (
    MarketTypeFilter,
    SportFilter,
    TrendCacheStatus,
    TrendLeaderboardEntry,
    TrendLeaderboardFilters,
    TrendLeaderboardResponse,
    TrendMetric,
    TrendStatsSummary,
)

logger = logging.getLogger(__name__)


def _safe_dump(obj):
    """Safely serialize Pydantic models across v1/v2.

    Preference order:
      - model_dump() (pydantic v2)
      - dict() (pydantic v1)
      - __dict__ fallback
    Returns the raw dict or the object unchanged if none available.
    """
    try:
        if hasattr(obj, "model_dump"):
            return obj.model_dump()
        if hasattr(obj, "dict") and callable(getattr(obj, "dict")):
            return obj.dict()
        if hasattr(obj, "__dict__"):
            return obj.__dict__
    except Exception:
        # Be conservative: if serialization fails, return the original object
        # Tests expect a dict-ish structure in most call sites; callers should
        # handle non-dict gracefully.
        return obj
    return obj


class TrendsService:
    """Service for computing and caching trends leaderboard metrics"""

    def __init__(self):
        self._cache: Dict[str, Any] = {}
        self._cache_timestamps: Dict[str, datetime] = {}
        self._cache_ttl = timedelta(minutes=5)  # 5-minute cache
        self._computation_lock = asyncio.Lock()

    def _get_cache_key(self, filters: TrendLeaderboardFilters) -> str:
        """Generate cache key from filters"""
        return f"trends_{filters.metric}_{filters.sport}_{filters.market_type}_{filters.min_samples}_{filters.period_days}"

    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self._cache_timestamps:
            return False
        # Be tolerant of legacy naive timestamps: treat naive datetimes as UTC.
        ts = self._cache_timestamps[cache_key]
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        age = datetime.now(timezone.utc) - ts
        return age < self._cache_ttl

    async def get_trends_leaderboard(
        self, filters: TrendLeaderboardFilters
    ) -> TrendLeaderboardResponse:
        """Get trends leaderboard with caching"""
        cache_key = self._get_cache_key(filters)

        # Check cache first
        if self._is_cache_valid(cache_key):
            logger.info(f"Returning cached trends data for {cache_key}")
            cached_data = self._cache[cache_key]
            # Expose cache_timestamp as a timezone-aware UTC datetime.
            ts = self._cache_timestamps[cache_key]
            cached_data["cache_timestamp"] = (
                ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
            )
            return TrendLeaderboardResponse(**cached_data)

        # Compute fresh data with lock to prevent duplicate computation
        async with self._computation_lock:
            # Double-check cache after acquiring lock
            if self._is_cache_valid(cache_key):
                cached_data = self._cache[cache_key]
                ts = self._cache_timestamps[cache_key]
                cached_data["cache_timestamp"] = (
                    ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
                )
                return TrendLeaderboardResponse(**cached_data)

            logger.info(f"Computing fresh trends data for {cache_key}")
            # Record timezone-aware UTC timestamp for cache entries. We keep
            # compatibility with older naive timestamps by treating them as UTC
            # when reading (see _is_cache_valid).
            start_time = datetime.now(timezone.utc)

            # Compute the leaderboard
            leaderboard_data = await self._compute_leaderboard(filters)

            computation_time = datetime.now(timezone.utc) - start_time
            logger.info(
                f"Trends computation took {computation_time.total_seconds():.2f}s"
            )

            # Cache the results
            response_data = {
                "data": leaderboard_data,
                "filters": _safe_dump(filters),
                "total_entries": len(leaderboard_data),
                "metadata": {
                    "computation_time_ms": int(computation_time.total_seconds() * 1000),
                    "computed_at": start_time.isoformat(),
                },
            }

            self._cache[cache_key] = response_data
            # store timezone-aware timestamp
            self._cache_timestamps[cache_key] = start_time

            # Store timezone-aware timestamp internally and expose an aware
            # UTC datetime on the response.
            self._cache[cache_key] = response_data
            self._cache_timestamps[cache_key] = start_time
            response_data["cache_timestamp"] = start_time
            return TrendLeaderboardResponse(**response_data)

    async def _compute_leaderboard(
        self, filters: TrendLeaderboardFilters
    ) -> List[TrendLeaderboardEntry]:
        """Compute leaderboard data from raw prop data"""
        # This would typically query your database
        # For now, I'll generate realistic sample data

        sample_data = await self._generate_sample_leaderboard_data(filters)

        # Sort by the selected metric
        metric_field = filters.metric.value
        sample_data.sort(key=lambda x: getattr(x, metric_field), reverse=True)

        # Add ranks
        for i, entry in enumerate(sample_data[: filters.limit]):
            entry.rank = i + 1

        return sample_data[: filters.limit]

    async def _generate_sample_leaderboard_data(
        self, filters: TrendLeaderboardFilters
    ) -> List[TrendLeaderboardEntry]:
        """Generate realistic sample data for demonstration"""
        import random

        # Sample players by sport
        players_by_sport = {
            "MLB": [
                ("Aaron Judge", "NYY"),
                ("Mookie Betts", "LAD"),
                ("Vladimir Guerrero Jr.", "TOR"),
                ("Ronald Acuña Jr.", "ATL"),
                ("Mike Trout", "LAA"),
                ("Manny Machado", "SD"),
                ("Juan Soto", "WSN"),
                ("Freddie Freeman", "LAD"),
                ("Jose Altuve", "HOU"),
                ("Fernando Tatis Jr.", "SD"),
                ("Bryce Harper", "PHI"),
                ("Rafael Devers", "BOS"),
            ],
            "NBA": [
                ("LeBron James", "LAL"),
                ("Stephen Curry", "GSW"),
                ("Kevin Durant", "PHX"),
                ("Giannis Antetokounmpo", "MIL"),
                ("Luka Dončić", "DAL"),
                ("Jayson Tatum", "BOS"),
                ("Joel Embiid", "PHI"),
                ("Nikola Jokić", "DEN"),
                ("Jimmy Butler", "MIA"),
                ("Damian Lillard", "POR"),
                ("Kawhi Leonard", "LAC"),
                ("James Harden", "PHI"),
            ],
            "NFL": [
                ("Josh Allen", "BUF"),
                ("Patrick Mahomes", "KC"),
                ("Lamar Jackson", "BAL"),
                ("Aaron Rodgers", "GB"),
                ("Tom Brady", "TB"),
                ("Justin Herbert", "LAC"),
                ("Dak Prescott", "DAL"),
                ("Russell Wilson", "DEN"),
                ("Kyler Murray", "ARI"),
                ("Joe Burrow", "CIN"),
                ("Matt Stafford", "LAR"),
                ("Derek Carr", "LV"),
            ],
            "NHL": [
                ("Connor McDavid", "EDM"),
                ("Leon Draisaitl", "EDM"),
                ("Nathan MacKinnon", "COL"),
                ("Sidney Crosby", "PIT"),
                ("Alexander Ovechkin", "WSH"),
                ("David Pastrnak", "BOS"),
                ("Artemi Panarin", "NYR"),
                ("Jonathan Huberdeau", "FLA"),
                ("Erik Karlsson", "SJ"),
                ("Cale Makar", "COL"),
                ("Victor Hedman", "TB"),
                ("Auston Matthews", "TOR"),
            ],
        }

        entries = []
        sports_to_use = (
            [filters.sport.value]
            if filters.sport != SportFilter.ALL
            else ["MLB", "NBA", "NFL", "NHL"]
        )

        for sport in sports_to_use:
            if sport == "ALL":
                continue

            players = players_by_sport.get(sport, [])

            for player_name, team in players:
                # Generate realistic metrics based on the sport and player
                base_hit_rate = random.uniform(0.45, 0.75)
                base_ev = random.uniform(-5.0, 15.0)
                base_confidence_rate = random.uniform(0.25, 0.85)

                # Add some correlation between metrics
                if base_hit_rate > 0.65:
                    base_ev += random.uniform(2.0, 8.0)
                    base_confidence_rate += random.uniform(0.1, 0.3)

                total_props = random.randint(filters.min_samples, 50)
                arbitrage_count = random.randint(0, min(5, total_props // 3))

                entry = TrendLeaderboardEntry(
                    player_id=f"{sport}_{player_name.replace(' ', '_').lower()}",
                    player_name=player_name,
                    team=team,
                    sport=sport,
                    market_type="player_props",
                    over_hit_rate=round(base_hit_rate, 3),
                    avg_ev=round(base_ev, 2),
                    arbitrage_count=arbitrage_count,
                    high_confidence_rate=round(min(base_confidence_rate, 1.0), 3),
                    total_props=total_props,
                    sample_period_days=filters.period_days,
                    # record last_updated as timezone-aware UTC
                    last_updated=datetime.now(timezone.utc),
                )

                # Apply min_samples filter
                if entry.total_props >= filters.min_samples:
                    entries.append(entry)

        return entries

    async def get_trends_summary(self) -> TrendStatsSummary:
        """Get summary statistics for trends data"""
        # This would typically aggregate from your database
        return TrendStatsSummary(
            total_players=156,
            total_props_analyzed=12450,
            sports_covered=["MLB", "NBA", "NFL", "NHL"],
            date_range={
                "start_date": (
                    datetime.now(timezone.utc) - timedelta(days=30)
                ).isoformat(),
                "end_date": datetime.now(timezone.utc).isoformat(),
            },
            top_performers={},
            cache_status={
                "entries_cached": len(self._cache),
                "last_refresh": (
                    max(self._cache_timestamps.values()).isoformat()
                    if self._cache_timestamps
                    else None
                ),
            },
        )

    def get_cache_status(self) -> TrendCacheStatus:
        """Get current cache status"""
        if not self._cache_timestamps:
            now = datetime.now(timezone.utc)
            return TrendCacheStatus(
                last_computed=now,
                next_refresh=now + self._cache_ttl,
                cache_hit_rate=0.0,
                entries_cached=0,
                computation_time_ms=0,
            )

        # Normalize all timestamps to timezone-aware UTC for comparison
        def _ensure_aware(ts: datetime) -> datetime:
            return ts if ts.tzinfo is not None else ts.replace(tzinfo=timezone.utc)

        last_computed = max(_ensure_aware(ts) for ts in self._cache_timestamps.values())
        return TrendCacheStatus(
            last_computed=last_computed,
            next_refresh=last_computed + self._cache_ttl,
            cache_hit_rate=0.85,  # Would track this in production
            entries_cached=len(self._cache),
            computation_time_ms=250,  # Would track this in production
        )

    async def clear_cache(self) -> bool:
        """Clear the trends cache"""
        try:
            self._cache.clear()
            self._cache_timestamps.clear()
            logger.info("Trends cache cleared successfully")
            return True
        except Exception as e:
            logger.error(f"Error clearing trends cache: {e}")
            return False


# Global service instance
trends_service = TrendsService()
