"""
MLB Stats API Client - Free, Official MLB Data Integration

This module replaces the failing external APIs (SportRadar, TheOdds) with the official,
free MLB Stats API. It provides real MLB data for player statistics, team information,
and game data while maintaining compatibility with the existing application structure.

Author: AI Assistant
Date: 2025
Purpose: Restore real data functionality using free MLB Stats API
"""

import asyncio
import json
import logging
import math
import os
import statistics
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx
import redis.asyncio as redis
import statsapi

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")


class MLBStatsAPIClient:
    """
    Client for integrating with the official MLB Stats API.

    This client replaces external APIs and provides:
    - Player statistics and information
    - Team data and standings
    - Game schedules and results
    - Real-time MLB data
    - Compatible data structures for the existing frontend
    """

    def __init__(self):
        self.cache_ttl = 300  # 5 minutes cache
        self.long_cache_ttl = 3600  # 1 hour for stable data like teams
        self._redis = None

    class _InMemoryRedis:
        """Minimal in-memory drop-in replacement for redis client."""

        def __init__(self):
            self._store: Dict[str, Tuple[Any, Optional[float]]] = {}

        async def get(self, key: str) -> Optional[str]:
            entry = self._store.get(key)
            if not entry:
                return None
            value, expire_at = entry
            if expire_at is not None and expire_at < time.time():
                self._store.pop(key, None)
                return None
            return value

        async def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
            expire_at = time.time() + ex if ex else None
            self._store[key] = (value, expire_at)

    async def _get_redis(self):
        """Get Redis connection for caching, falling back to in-memory store when unavailable."""
        if self._redis is not None:
            return self._redis

        if REDIS_URL:
            try:
                client = redis.from_url(REDIS_URL)
                try:
                    await client.ping()
                    self._redis = client
                    return self._redis
                except Exception as ping_error:
                    logger.warning(
                        "Redis ping failed (%s); falling back to in-memory cache",
                        ping_error,
                    )
            except Exception as conn_error:
                logger.warning(
                    "Redis unavailable (%s); falling back to in-memory cache",
                    conn_error,
                )
        else:
            logger.info("REDIS_URL not set; using in-memory cache")

        self._redis = self._InMemoryRedis()
        return self._redis

    # ---------- Internal helpers for deterministic prop construction ----------

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        """Best-effort float conversion that tolerates MLB Stats API string formats."""

        if value is None:
            return default

        if isinstance(value, (int, float)):
            return float(value)

        try:
            string_val = str(value).strip()
            if string_val in {"", "-", "--"}:
                return default
            if string_val.endswith("%"):
                return float(string_val.rstrip("%")) / 100.0
            if string_val.startswith("."):
                return float(f"0{string_val}")
            return float(string_val)
        except (TypeError, ValueError):
            return default

    def _safe_int(self, value: Any, default: int = 0) -> int:
        """Best-effort integer conversion with graceful fallbacks."""

        if value is None:
            return default

        if isinstance(value, int):
            return value

        try:
            string_val = str(value).strip()
            if string_val in {"", "-", "--"}:
                return default
            return int(float(string_val))
        except (TypeError, ValueError):
            return default

    def _clamp(self, value: float, lower: float, upper: float) -> float:
        return max(lower, min(upper, value))

    def _sigmoid_probability(self, diff: float, slope: float = 2.4) -> float:
        """Translate a differential metric into a probability percentage."""

        probability = 1.0 / (1.0 + math.exp(-diff * slope))
        return self._clamp(probability * 100.0, 5.0, 95.0)

    def _american_odds_from_probability(self, probability: float) -> int:
        """Convert probability expressed as decimal (0-1) into American odds."""

        prob = self._clamp(probability, 0.01, 0.99)
        if prob >= 0.5:
            odds = -((prob / (1 - prob)) * 100)
        else:
            odds = ((1 - prob) / prob) * 100
        return int(round(odds))

    def _extract_group_stat_block(self, stats_blob: Dict[str, Any], target_group: str) -> Dict[str, Any]:
        """Extract the stat dictionary for a given group (hitting/pitching)."""

        if not isinstance(stats_blob, dict):
            return {}

        stats_entries = stats_blob.get("stats") or []
        for entry in stats_entries:
            if not isinstance(entry, dict):
                continue
            group_info = entry.get("group") or {}
            if not isinstance(group_info, dict):
                group_info = {}
            group_name = str(
                group_info.get("displayName")
                or group_info.get("code")
                or ""
            ).lower()
            if target_group.lower() in group_name:
                stats_dict = entry.get("stats") or entry.get("stat") or {}
                if stats_dict:
                    return stats_dict

        splits_entries = stats_blob.get("splits") or []
        latest_stat: Dict[str, Any] = {}
        latest_season = -1
        for split in splits_entries:
            if not isinstance(split, dict):
                continue
            season_raw = split.get("season") or split.get("seasonId")
            season_val = -1
            if season_raw is not None:
                try:
                    season_val = int(season_raw)
                except (TypeError, ValueError):
                    season_val = -1
            stat_block = split.get("stat") or split.get("stats") or {}
            if not isinstance(stat_block, dict):
                continue
            if stat_block and season_val >= latest_season:
                latest_season = season_val
                latest_stat = stat_block

        return latest_stat

    def _summarize_season_stats(self, stats_blob: Dict[str, Any], position: str) -> Dict[str, Any]:
        """Summarise season totals needed for prop construction."""

        summary: Dict[str, Any] = {}
        if not isinstance(stats_blob, dict):
            return summary

        if position == "P":
            stat_block = self._extract_group_stat_block(stats_blob, "pitching")
            summary.update(
                {
                    "games_played": self._safe_int(stat_block.get("gamesPlayed")),
                    "games_started": self._safe_int(stat_block.get("gamesStarted")),
                    "strikeouts": self._safe_int(stat_block.get("strikeOuts")),
                    "walks": self._safe_int(stat_block.get("baseOnBalls")),
                    "hits_allowed": self._safe_int(stat_block.get("hits")),
                    "earned_runs": self._safe_int(stat_block.get("earnedRuns")),
                    "innings_pitched": self._safe_float(stat_block.get("inningsPitched")),
                }
            )
        else:
            stat_block = self._extract_group_stat_block(stats_blob, "hitting")
            summary.update(
                {
                    "games_played": self._safe_int(stat_block.get("gamesPlayed")),
                    "hits": self._safe_int(stat_block.get("hits")),
                    "home_runs": self._safe_int(stat_block.get("homeRuns")),
                    "rbis": self._safe_int(stat_block.get("rbi")),
                    "runs": self._safe_int(stat_block.get("runs")),
                    "stolen_bases": self._safe_int(stat_block.get("stolenBases")),
                    "avg": self._safe_float(stat_block.get("avg")),
                    "obp": self._safe_float(stat_block.get("obp")),
                    "slg": self._safe_float(stat_block.get("slg")),
                }
            )

        return summary

    def _extract_recent_samples(
        self,
        game_log: Dict[str, Any],
        stat_key: str,
        limit: int = 5,
    ) -> List[float]:
        """Extract recent stat samples from the MLB stats game log payload."""

        samples: List[float] = []
        if not isinstance(game_log, dict):
            return samples

        stats_entries = game_log.get("stats") or []
        for entry in stats_entries:
            if not isinstance(entry, dict):
                continue
            splits = entry.get("splits") or []
            for split in splits:
                if not isinstance(split, dict):
                    continue
                stat_data = split.get("stat") or split.get("stats") or {}
                if stat_key not in stat_data:
                    continue
                value = self._safe_float(stat_data.get(stat_key))
                samples.append(value)
                if len(samples) >= limit:
                    return samples

        return samples

    def _choose_line_value(
        self,
        stat_type: str,
        season_average: float,
        recent_average: float,
        position: str,
    ) -> float:
        """Determine a realistic betting line based on season and recent averages."""

        blended = (season_average * 0.4) + (recent_average * 0.6)

        if stat_type == "hits":
            if blended >= 1.35:
                return 1.5
            if blended >= 0.85:
                return 1.0
            return 0.5

        if stat_type in {"rbi", "runs"}:
            if blended >= 1.2:
                return 1.5
            if blended >= 0.8:
                return 1.0
            return 0.5

        if stat_type == "home_runs":
            return 0.5 if blended < 1.0 else 1.5

        if stat_type == "stolen_bases":
            return 0.5 if blended < 1.0 else 1.5

        if stat_type == "strikeouts":
            scale = 0.0
            if position == "P":
                scale = blended
            else:
                scale = blended
            if scale >= 8.5:
                return round(scale, 1)
            if scale >= 6.5:
                return 6.5
            if scale >= 5.5:
                return 5.5
            if scale >= 4.5:
                return 4.5
            return 3.5

        if stat_type in {"earned_runs", "walks", "hits_allowed"}:
            return max(0.5, round(blended, 1))

        return max(0.5, round(blended, 1))

    def _calculate_probability_profile(
        self,
        season_average: float,
        recent_average: float,
        line_value: float,
        stat_type: str,
    ) -> Tuple[float, float]:
        """Return (market_probability, ai_probability) based on season and recent performance."""

        slope_lookup = {
            "hits": 3.4,
            "rbi": 3.0,
            "runs": 3.0,
            "home_runs": 4.2,
            "stolen_bases": 3.8,
            "strikeouts": 2.4,
            "earned_runs": 2.0,
            "walks": 2.2,
            "hits_allowed": 2.0,
        }

        slope = slope_lookup.get(stat_type, 2.5)

        season_diff = season_average - line_value
        recent_diff = recent_average - line_value

        market_prob = self._sigmoid_probability(season_diff, slope)
        ai_prob = self._sigmoid_probability((season_diff * 0.35) + (recent_diff * 0.65), slope)
        return market_prob, ai_prob

    def _build_prop_payload(
        self,
        *,
        player: Dict[str, Any],
        stat_type: str,
        season_stats: Dict[str, Any],
        recent_samples: List[float],
        matchup: str,
        event: Dict[str, Any],
        team_name: str,
        opponent_name: str,
        position: str,
    ) -> Optional[Dict[str, Any]]:
        """Construct a prop dictionary using deterministic, data-driven logic."""

        totals_map = {
            "hits": season_stats.get("hits"),
            "rbi": season_stats.get("rbis"),
            "runs": season_stats.get("runs"),
            "home_runs": season_stats.get("home_runs"),
            "stolen_bases": season_stats.get("stolen_bases"),
            "strikeouts": season_stats.get("strikeouts"),
            "earned_runs": season_stats.get("earned_runs"),
            "walks": season_stats.get("walks"),
            "hits_allowed": season_stats.get("hits_allowed"),
        }

        total_value = totals_map.get(stat_type)
        games_played = max(season_stats.get("games_played", 0), 1)

        if total_value is None or games_played == 0:
            return None

        season_average = float(total_value) / games_played
        recent_average = (
            statistics.mean(recent_samples) if recent_samples else season_average
        )

        line_value = self._choose_line_value(
            stat_type, season_average, recent_average, position
        )

        market_prob, ai_prob = self._calculate_probability_profile(
            season_average, recent_average, line_value, stat_type
        )

        market_prob_dec = market_prob / 100.0
        ai_prob_dec = ai_prob / 100.0

        market_odds = self._american_odds_from_probability(market_prob_dec)
        ai_odds = self._american_odds_from_probability(ai_prob_dec)

        edge_pct = ai_prob - market_prob

        opening_line = self._choose_line_value(
            stat_type, season_average, season_average, position
        )
        line_change = round(line_value - opening_line, 2)

        movement_direction = "flat"
        if line_change > 0.05:
            movement_direction = "up"
        elif line_change < -0.05:
            movement_direction = "down"

        recent_form_values = recent_samples[:5]
        if not recent_form_values:
            recent_form_values = [season_average] * 5

        matchup_history = {
            "games": min(25, games_played),
            "average": round(season_average, 3),
            "hitRate": int(self._clamp(ai_prob, 5.0, 95.0)),
        }

        bookmakers = [
            {
                "name": "Season Benchmark",
                "odds": market_odds,
                "line": line_value,
            },
            {
                "name": "Recent Form Model",
                "odds": ai_odds,
                "line": line_value,
            },
        ]

        sharp_money = "heavy" if edge_pct >= 7.5 else ("moderate" if edge_pct >= 3 else "light")

        tags = [stat_type.replace("_", " ").title(), "Real MLB Data"]
        if edge_pct >= 6:
            tags.append("Recent Hot Streak")
        elif edge_pct <= -3:
            tags.append("Market Lean")

        normalized_ai = self._normalize_confidence(ai_prob)
        return {
            "event_id": event.get("game_id") or f"mlb_{player.get('id')}_{stat_type}",
            "event_name": event.get("event_name"),
            "start_time": event.get("start_time"),
            "player_name": player.get("fullName") or player.get("player_name"),
            "player_id": player.get("id"),
            "team_name": team_name,
            "stat_type": stat_type,
            "line": round(line_value, 2),
            "line_score": round(line_value, 2),
            "confidence": round(normalized_ai, 2),
            "ai_probability": round(normalized_ai, 2),
            "implied_probability": round(market_prob, 2),
            "odds": market_odds,
            "provider_id": "mlb_stats_api",
            "matchup": matchup,
            "position": player.get("positionCode"),
            "venue": event.get("venue"),
            "game_status": event.get("status", "Scheduled"),
            "recent_form_values": [round(v, 3) for v in recent_form_values],
            "season_average": round(season_average, 3),
            "recent_average": round(recent_average, 3),
            "market_probability": round(market_prob, 2),
            "bookmakers": bookmakers,
            "edge": round(edge_pct, 2),
            "line_movement": {
                "open": opening_line,
                "current": line_value,
                "direction": movement_direction,
            },
            "volume": max(150, games_played * 4),
            "matchup_history": matchup_history,
            "sharp_money": sharp_money,
            "tags": tags,
            "opponent": opponent_name,
            "alert": edge_pct >= 8,
            "alert_severity": "high" if edge_pct >= 10 else ("medium" if edge_pct >= 6 else None),
        }

    def _normalize_confidence(self, confidence: float) -> float:
        """
        Optionally normalize/scaling low confidence values to improve UX visibility.

        Controlled via environment variable MLB_CONFIDENCE_NORMALIZATION. When enabled,
        this performs a conservative floor-and-scale: values below 25 are gently lifted
        using a soft-step mapping so that very low model scores (e.g. 15) become more
        visible (e.g. ~25-30) while preserving relative ordering.
        """

        try:
            if os.getenv("MLB_CONFIDENCE_NORMALIZATION", "false").lower() not in {"1", "true", "yes"}:
                return confidence
        except Exception:
            return confidence

        # Defensive clamping
        c = float(confidence)
        c = self._clamp(c, 0.0, 100.0)

        # If confidence is already reasonable, don't change much
        if c >= 35.0:
            return round(c, 2)

        # Gentle piecewise lift: below 10 -> +12; 10-20 -> +8; 20-30 -> +5; 30-35 -> +2
        if c < 10.0:
            c = c + 12.0
        elif c < 20.0:
            c = c + 8.0
        elif c < 30.0:
            c = c + 5.0
        else:
            c = c + 2.0

        return round(self._clamp(c, 0.0, 100.0), 2)

    def _derive_props_for_player(
        self,
        *,
        player: Dict[str, Any],
        stat_types: List[str],
        stats_blob: Dict[str, Any],
        game_log: Dict[str, Any],
        matchup: str,
        event: Dict[str, Any],
        team_name: str,
        opponent_name: str,
    ) -> List[Dict[str, Any]]:
        """Build prop payloads for a single player deterministically."""

        position = player.get("positionCode", "")
        season_stats = self._summarize_season_stats(stats_blob, position)
        if not season_stats:
            return []

        props: List[Dict[str, Any]] = []
        for stat_type in stat_types:
            if stat_type in {"strikeouts", "earned_runs", "walks", "hits_allowed"} and position != "P":
                continue

            stat_key_map = {
                "hits": "hits",
                "rbi": "rbi",
                "runs": "runs",
                "home_runs": "homeRuns",
                "stolen_bases": "stolenBases",
                "strikeouts": "strikeOuts",
                "earned_runs": "earnedRuns",
                "walks": "baseOnBalls",
                "hits_allowed": "hits",
            }
            sample_key = stat_key_map.get(stat_type)
            recent_samples = []
            if sample_key:
                recent_samples = self._extract_recent_samples(game_log, sample_key)

            prop_payload = self._build_prop_payload(
                player=player,
                stat_type=stat_type,
                season_stats=season_stats,
                recent_samples=recent_samples,
                matchup=matchup,
                event=event,
                team_name=team_name,
                opponent_name=opponent_name,
                position=position,
            )

            if prop_payload:
                props.append(prop_payload)

        return props

    async def get_mlb_teams(self) -> List[Dict[str, Any]]:
        """
        Get all MLB teams with their information.

        Returns:
            List of team dictionaries with id, name, abbreviation, etc.
        """
        redis_conn = await self._get_redis()
        cache_key = "mlb:teams:all"
        cached = await redis_conn.get(cache_key)

        if cached:
            logger.info("Returning cached MLB teams data")
            return json.loads(cached)

        try:
            # Get all MLB teams (sport ID 1 = Major League Baseball)
            teams_data = statsapi.get("teams", {"sportId": 1}) or {}
            teams = []

            for team in teams_data.get("teams", []):
                teams.append(
                    {
                        "id": team.get("id"),
                        "name": team.get("name"),
                        "teamName": team.get("teamName"),
                        "abbreviation": team.get("abbreviation"),
                        "shortName": team.get("shortName"),
                        "locationName": team.get("locationName"),
                        "division": team.get("division", {}).get("name"),
                        "league": team.get("league", {}).get("name"),
                        "venue": team.get("venue", {}).get("name"),
                        "active": team.get("active", True),
                    }
                )

            # Cache for 1 hour (teams don't change often)
            await redis_conn.set(cache_key, json.dumps(teams), ex=self.long_cache_ttl)
            logger.info(f"Retrieved and cached {len(teams)} MLB teams")
            return teams

        except Exception as e:
            logger.error(f"Error fetching MLB teams: {e}")
            return []

    async def get_player_stats(
        self, player_id: int, stat_type: str = "season"
    ) -> Dict[str, Any]:
        """
        Get player statistics from MLB Stats API.

        Args:
            player_id: MLB player ID
            stat_type: Type of stats ('season', 'career', 'gameLog')

        Returns:
            Dictionary containing player statistics
        """
        redis_conn = await self._get_redis()
        cache_key = f"mlb:player_stats:{player_id}:{stat_type}"
        cached = await redis_conn.get(cache_key)

        if cached:
            return json.loads(cached)

        try:
            # Get player stats using the MLB Stats API
            player_stats = statsapi.player_stat_data(
                player_id, group="[hitting,pitching,fielding]", type=stat_type
            )

            if player_stats:
                await redis_conn.set(
                    cache_key, json.dumps(player_stats), ex=self.cache_ttl
                )
                logger.info(f"Retrieved stats for player {player_id}")
                return player_stats
            else:
                logger.warning(f"No stats found for player {player_id}")
                return {}

        except Exception as e:
            logger.error(f"Error fetching player stats for {player_id}: {e}")
            return {}

    async def get_todays_games(self) -> List[Dict[str, Any]]:
        """Return normalized upcoming MLB games for the current day (UTC)."""

        redis_conn = await self._get_redis()
        today = datetime.now(timezone.utc).date().isoformat()
        cache_key = f"mlb:games:{today}"
        cached = await redis_conn.get(cache_key)

        if cached:
            logger.info("Returning cached upcoming MLB games")
            return json.loads(cached)

        try:
            games = await self._fetch_upcoming_games()
            await redis_conn.set(cache_key, json.dumps(games), ex=self.cache_ttl)
            logger.info("Retrieved %s actionable MLB games for %s", len(games), today)
            return games
        except Exception as exc:  # pragma: no cover - defensive
            logger.error("Error fetching today's MLB games: %s", exc)
            return []

    async def _fetch_upcoming_games(self) -> List[Dict[str, Any]]:
        """Fetch and normalize upcoming MLB games from the Stats API."""

        today = datetime.now(timezone.utc).date()
        schedule = self._fetch_schedule_for_date(today)

        games = [
            self._normalize_schedule_game(game)
            for game in schedule
            if self._is_actionable_game(game)
        ]

        if not games:
            # When no actionable games today, peek at tomorrow to keep dashboard populated
            tomorrow = today + timedelta(days=1)
            secondary = self._fetch_schedule_for_date(tomorrow)
            games = [
                self._normalize_schedule_game(game)
                for game in secondary
                if self._is_actionable_game(game)
            ]

        games.sort(key=lambda g: g.get("start_time") or "")
        return games

    def _fetch_schedule_for_date(self, date_obj: date) -> List[Dict[str, Any]]:
        """Fetch schedule data while tolerating StatsAPI date format quirks."""

        iso_date = date_obj.isoformat()
        mmddyy = date_obj.strftime("%m/%d/%Y")

        schedule = statsapi.schedule(date=iso_date)
        if schedule:
            return schedule

        schedule = statsapi.schedule(date=mmddyy)
        if schedule:
            return schedule

        return statsapi.schedule(start_date=mmddyy, end_date=mmddyy)

    def _parse_game_pk(self, game_id: Any) -> Optional[int]:
        """Best-effort conversion of arbitrary game identifiers into StatsAPI gamePk ints."""

        if game_id is None:
            return None

        try:
            candidate = str(game_id).split("_")[-1]
            return int(candidate)
        except (TypeError, ValueError):
            return None

    async def get_live_game_snapshot(self, game_id: str) -> Optional[Dict[str, Any]]:
        """Return normalized live game information for the given game identifier."""

        game_pk = self._parse_game_pk(game_id)
        if game_pk is None:
            return None

        redis_conn = await self._get_redis()
        cache_key = f"mlb:live_stats:{game_pk}"
        cached = await redis_conn.get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                pass

        try:
            boxscore = await asyncio.to_thread(statsapi.boxscore_data, game_pk)
        except Exception as exc:  # pragma: no cover - defensive around upstream issues
            logger.error("Failed to fetch box score for game %s: %s", game_pk, exc)
            return None

        if not isinstance(boxscore, dict):
            return None

        try:
            linescore = await asyncio.to_thread(statsapi.linescore, game_pk)
        except Exception:
            linescore = None

        if not isinstance(linescore, dict):
            linescore = {}

        try:
            game_meta = await asyncio.to_thread(statsapi.get, "game", {"gamePk": game_pk})
        except Exception:
            game_meta = {}

        teams_meta = ((game_meta or {}).get("gameData") or {}).get("teams", {})
        status_meta = ((game_meta or {}).get("gameData") or {}).get("status", {})
        datetime_meta = ((game_meta or {}).get("gameData") or {}).get("datetime", {})
        venue_meta = ((game_meta or {}).get("gameData") or {}).get("venue", {})

        def build_team(side: str) -> Dict[str, Any]:
            meta = teams_meta.get(side, {})
            ls_team = ((linescore or {}).get("teams") or {}).get(side, {})
            batting = (((boxscore.get("teams") or {}).get(side) or {}).get("teamStats") or {}).get("batting", {})

            return {
                "name": meta.get("name") or meta.get("teamName") or meta.get("locationName"),
                "abbreviation": meta.get("abbreviation") or meta.get("teamCode"),
                "score": ls_team.get("runs") or batting.get("runs", 0),
                "hits": ls_team.get("hits") or batting.get("hits", 0),
                "errors": ls_team.get("errors") or 0,
            }

        linescore_state = linescore if isinstance(linescore, dict) else {}
        current_inning = linescore_state.get("currentInning") or 0
        inning_state = linescore_state.get("inningState") or ("Preview" if current_inning == 0 else "In Progress")
        is_top = linescore_state.get("isTopInning")

        payload = {
            "status": status_meta.get("detailedState") or status_meta.get("abstractGameState") or "Scheduled",
            "game_id": str(game_id),
            "teams": {
                "away": build_team("away"),
                "home": build_team("home"),
            },
            "game_state": {
                "status": status_meta.get("abstractGameState") or "Scheduled",
                "inning": current_inning,
                "inning_state": inning_state,
                "inning_half": "Top" if is_top else ("Bottom" if is_top is not None else ""),
            },
            "venue": venue_meta.get("name"),
            "datetime": datetime_meta.get("dateTime"),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        await redis_conn.set(cache_key, json.dumps(payload), ex=45)
        return payload

    async def get_play_by_play(self, game_id: str) -> Optional[Dict[str, Any]]:
        """Return a normalized play-by-play feed for the specified game."""

        game_pk = self._parse_game_pk(game_id)
        if game_pk is None:
            return None

        redis_conn = await self._get_redis()
        cache_key = f"mlb:pbp:{game_pk}"
        cached = await redis_conn.get(cache_key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                pass

        try:
            pbp_raw = await asyncio.to_thread(statsapi.get, "game_playByPlay", {"gamePk": game_pk})
        except Exception as exc:  # pragma: no cover - defensive against upstream instability
            logger.error("Failed to fetch play-by-play for game %s: %s", game_pk, exc)
            return None

        all_plays = (pbp_raw or {}).get("allPlays") or []
        events: List[Dict[str, Any]] = []
        for play in all_plays:
            about = play.get("about") or {}
            result = play.get("result") or {}
            events.append(
                {
                    "inning": about.get("inning"),
                    "inning_half": (about.get("halfInning") or "").capitalize(),
                    "description": result.get("description") or result.get("event"),
                    "timestamp": about.get("startTime") or about.get("endTime"),
                    "away_score": about.get("awayScore"),
                    "home_score": about.get("homeScore"),
                }
            )

        payload = {
            "status": (pbp_raw or {}).get("gameData", {}).get("status", {}).get("abstractGameState", "Scheduled"),
            "game_id": str(game_id),
            "events": events,
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        await redis_conn.set(cache_key, json.dumps(payload), ex=45)
        return payload

    def _normalize_schedule_game(self, game: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Stats API schedule payload into a normalized game dictionary."""

        start_iso = self._parse_start_time(
            game.get("game_datetime"),
            game.get("game_date"),
            game.get("game_time"),
            game.get("ampm"),
        )

        probable_pitchers = {
            "home": game.get("home_probable_pitcher") or game.get("home_probable_pitcher_id"),
            "away": game.get("away_probable_pitcher") or game.get("away_probable_pitcher_id"),
        }

        game_id_raw = game.get("game_id") or game.get("game_pk")
        home_team = game.get("home_name")
        away_team = game.get("away_name")
        matchup = f"{away_team} @ {home_team}" if away_team and home_team else None

        # Maintain legacy field names expected by the frontend while also providing
        # richer metadata for consumers that use the newer naming.
        normalized = {
            "game_id": str(game_id_raw) if game_id_raw is not None else None,
            "start_time": start_iso,
            "game_date": game.get("game_date") or (start_iso[:10] if start_iso else None),
            "status": game.get("status"),
            "home_team": home_team,
            "away_team": away_team,
            "home_id": game.get("home_id"),
            "away_id": game.get("away_id"),
            "venue": game.get("venue_name"),
            "game_type": game.get("game_type"),
            "doubleheader": game.get("doubleheader"),
            "series": game.get("series_description"),
            "probable_pitchers": probable_pitchers,
            "matchup": matchup,
            "sport": "MLB",
        }

        # Legacy aliases retained for downstream compatibility.
        normalized["home"] = home_team
        normalized["away"] = away_team
        normalized["event_name"] = matchup or "MLB Game"
        normalized["time"] = start_iso

        return normalized

    def _parse_start_time(
        self,
        game_datetime: Optional[str],
        game_date: Optional[str],
        game_time: Optional[str],
        ampm: Optional[str],
    ) -> Optional[str]:
        """Parse schedule timestamps into ISO-8601 strings."""

        if game_datetime:
            try:
                # statsapi already provides ISO-like strings; ensure timezone awareness
                dt = datetime.fromisoformat(game_datetime.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt.isoformat()
            except ValueError:
                pass

        if game_date and game_time:
            try:
                date_str = f"{game_date} {game_time} {ampm or ''}".strip()
                # statsapi formats e.g. '07/15/2025' for date and '7:05' for time
                dt = datetime.strptime(date_str, "%m/%d/%Y %I:%M %p")
                return dt.replace(tzinfo=timezone.utc).isoformat()
            except ValueError:
                for fmt in ("%Y-%m-%d %I:%M %p", "%Y-%m-%d %H:%M"):
                    try:
                        dt = datetime.strptime(f"{game_date} {game_time}", fmt)
                        return dt.replace(tzinfo=timezone.utc).isoformat()
                    except ValueError:
                        continue

        return None

    def _is_actionable_game(self, game: Dict[str, Any]) -> bool:
        """Determine if a schedule entry represents an actionable (upcoming) game."""

        status = (game.get("status") or "").lower()
        excluded_statuses = {
            "final",
            "completed",
            "completed early",
            "postponed",
            "suspended",
            "cancelled",
        }

        if status in excluded_statuses:
            return False

        # Games without required team identifiers are not actionable for prop generation
        if not game.get("home_id") or not game.get("away_id"):
            return False

        return True

    async def search_players(
        self, query: str, active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Search for players by name.

        Args:
            query: Player name or partial name to search for
            active_only: Whether to return only active players

        Returns:
            List of matching players
        """
        redis_conn = await self._get_redis()
        cache_key = f"mlb:player_search:{query}:{active_only}"
        cached = await redis_conn.get(cache_key)

        if cached:
            return json.loads(cached)

        try:
            # Use MLB Stats API to search for players
            players = statsapi.lookup_player(query)

            if isinstance(players, dict):
                players = [players]  # Single result
            elif not isinstance(players, list):
                players = []

            # Filter active players if requested
            if active_only:
                players = [p for p in players if p.get("active", False)]

            # Format player data
            formatted_players = []
            for player in players:
                formatted_players.append(
                    {
                        "id": player.get("id"),
                        "fullName": player.get("fullName"),
                        "firstName": player.get("firstName"),
                        "lastName": player.get("lastName"),
                        "primaryNumber": player.get("primaryNumber"),
                        "currentTeam": player.get("currentTeam", {}).get("name"),
                        "currentTeamId": player.get("currentTeam", {}).get("id"),
                        "position": player.get("primaryPosition", {}).get("name"),
                        "positionCode": player.get("primaryPosition", {}).get("code"),
                        "active": player.get("active"),
                        "mlbDebutDate": player.get("mlbDebutDate"),
                        "birthDate": player.get("birthDate"),
                        "height": player.get("height"),
                        "weight": player.get("weight"),
                        "batSide": player.get("batSide", {}).get("description"),
                        "pitchHand": player.get("pitchHand", {}).get("description"),
                    }
                )

            # Cache for 1 hour
            await redis_conn.set(
                cache_key, json.dumps(formatted_players), ex=self.long_cache_ttl
            )
            logger.info(f"Found {len(formatted_players)} players for query '{query}'")
            return formatted_players

        except Exception as e:
            logger.error(f"Error searching for players with query '{query}': {e}")
            return []

    async def get_team_roster(self, team_id: int) -> List[Dict[str, Any]]:
        """
        Get the current roster for a team.

        Args:
            team_id: MLB team ID

        Returns:
            List of players on the team roster
        """
        redis_conn = await self._get_redis()
        cache_key = f"mlb:roster:{team_id}"
        cached = await redis_conn.get(cache_key)

        if cached:
            return json.loads(cached)

        try:
            # Use the correct statsapi.get method to get roster data
            roster_data = statsapi.get("team_roster", {"teamId": team_id})
            players = []

            if roster_data and "roster" in roster_data:
                for player_entry in roster_data.get("roster", []) or []:
                    person = player_entry.get("person", {})
                    position = player_entry.get("position", {})

                    players.append(
                        {
                            "id": person.get("id"),
                            "fullName": person.get("fullName"),
                            "firstName": person.get("firstName"),
                            "lastName": person.get("lastName"),
                            "jerseyNumber": player_entry.get("jerseyNumber"),
                            "position": position.get("name"),
                            "positionCode": position.get("code"),
                            "positionType": position.get("type"),
                            "status": player_entry.get("status", {}).get(
                                "description", "Active"
                            ),
                        }
                    )

            # Cache for 30 minutes
            await redis_conn.set(cache_key, json.dumps(players), ex=1800)
            logger.info(f"Retrieved roster for team {team_id}: {len(players)} players")
            return players

        except Exception as e:
            logger.error(f"Error fetching roster for team {team_id}: {e}")
            # Try alternative method with formatted roster text parsing
            try:
                roster_text = statsapi.roster(team_id)
                players = self._parse_roster_text(roster_text)
                if players:
                    await redis_conn.set(cache_key, json.dumps(players), ex=1800)
                    logger.info(
                        f"Retrieved roster for team {team_id} via text parsing: {len(players)} players"
                    )
                    return players
            except Exception as e2:
                logger.error(
                    f"Error with fallback roster method for team {team_id}: {e2}"
                )

            return []

    def _parse_roster_text(self, roster_text: str) -> List[Dict[str, Any]]:
        """
        Parse formatted roster text into structured data.

        Args:
            roster_text: Formatted roster string from statsapi.roster()

        Returns:
            List of player dictionaries
        """
        players = []
        try:
            lines = roster_text.strip().split("\n")
            for line in lines:
                if line.strip():
                    # Format: "#23  CF  Aaron Altherr"
                    parts = line.split()
                    if len(parts) >= 3:
                        jersey_num = (
                            parts[0].replace("#", "")
                            if parts[0].startswith("#")
                            else ""
                        )
                        position = parts[1] if len(parts) > 1 else ""
                        name = " ".join(parts[2:]) if len(parts) > 2 else ""

                        players.append(
                            {
                                "id": None,  # Not available in text format
                                "fullName": name,
                                "firstName": name.split()[0] if name else "",
                                "lastName": (
                                    " ".join(name.split()[1:])
                                    if len(name.split()) > 1
                                    else ""
                                ),
                                "jerseyNumber": jersey_num,
                                "position": position,
                                "positionCode": position,
                                "positionType": (
                                    "Pitcher" if position == "P" else "Position Player"
                                ),
                                "status": "Active",
                            }
                        )
        except Exception as e:
            logger.error(f"Error parsing roster text: {e}")

        return players

    async def get_player_game_log(
        self, player_id: int, season: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get game-by-game statistics for a player.

        Args:
            player_id: MLB player ID
            season: Season year (defaults to current year)

        Returns:
            List of game statistics
        """
        if season is None:
            season = str(datetime.now().year)

        redis_conn = await self._get_redis()
        cache_key = f"mlb:player_gamelog:{player_id}:{season}"
        cached = await redis_conn.get(cache_key)

        if cached:
            return json.loads(cached)

        try:
            # Get player game log
            game_log = statsapi.player_stat_data(
                player_id, group="hitting,pitching", type="gameLog"
            )
            if isinstance(game_log, dict):
                # statsapi returns dict keyed by stat group; normalize to list
                game_log = list(game_log.values())

            if game_log is None:
                game_log = []

            if game_log:
                # Cache for 10 minutes
                await redis_conn.set(cache_key, json.dumps(game_log), ex=600)
                logger.info(
                    f"Retrieved game log for player {player_id}, season {season}"
                )
                return game_log
            else:
                return []

        except Exception as e:
            logger.error(f"Error fetching game log for player {player_id}: {e}")
            return []

    async def generate_player_props_data(self) -> List[Dict[str, Any]]:
        """
        Generate realistic player props data using MLB Stats API.

        This method creates betting-style prop data using real MLB players and statistics,
        replacing the failing external betting APIs with real MLB data.

        Returns:
            List of player prop dictionaries compatible with the existing frontend
        """
        redis_conn = await self._get_redis()
        cache_key = "mlb:generated_props"
        cached = await redis_conn.get(cache_key)

        if cached:
            logger.info("Returning cached generated player props")
            return json.loads(cached)

        try:
            # Get today's games to focus on active players
            games = await self.get_todays_games()

            if not games:
                # If no games today, get recent games
                yesterday = datetime.now(timezone.utc).date() - timedelta(days=1)
                games = [
                    self._normalize_schedule_game(game)
                    for game in statsapi.schedule(date=yesterday.isoformat())
                    if game.get("home_id") and game.get("away_id")
                ]

            props: List[Dict[str, Any]] = []
            processed_players: set[int] = set()

            for game in games[:5]:
                home_team_id = game.get("home_id")
                away_team_id = game.get("away_id")

                if not home_team_id or not away_team_id:
                    continue

                matchup = game.get("matchup") or f"{game.get('away_team', 'Away')} @ {game.get('home_team', 'Home')}"
                event_id_raw = game.get("game_id") or game.get("game_pk")
                event_meta = {
                    "game_id": str(event_id_raw)
                    if event_id_raw is not None
                    else f"game_{home_team_id}_{away_team_id}",
                    "event_name": matchup,
                    "start_time": game.get("start_time") or datetime.now(timezone.utc).isoformat(),
                    "status": game.get("status", "Scheduled"),
                    "venue": game.get("venue", "Unknown Venue"),
                }

                home_roster = await self.get_team_roster(home_team_id)
                away_roster = await self.get_team_roster(away_team_id)

                team_definitions = [
                    (
                        home_team_id,
                        home_roster,
                        game.get("home_team", "Home"),
                        game.get("away_team", "Away"),
                    ),
                    (
                        away_team_id,
                        away_roster,
                        game.get("away_team", "Away"),
                        game.get("home_team", "Home"),
                    ),
                ]

                for team_id, roster, team_name, opponent_name in team_definitions:
                    if not roster:
                        continue

                    for player in roster[:4]:
                        player_id = player.get("id")
                        if not player_id or player_id in processed_players:
                            continue

                        processed_players.add(player_id)

                        stats_blob = await self.get_player_stats(player_id)
                        game_log = await self.get_player_game_log(player_id)

                        position = player.get("positionCode", "")
                        if position == "P":
                            stat_types = ["strikeouts", "earned_runs", "hits_allowed"]
                        else:
                            stat_types = ["hits", "rbi", "runs", "home_runs"]

                        if isinstance(game_log, dict):
                            normalized_game_log = game_log
                        elif isinstance(game_log, list):
                            normalized_game_log = {"stats": [{"splits": game_log}]}
                        else:
                            normalized_game_log = {"stats": [{"splits": []}]}

                        player_props = self._derive_props_for_player(
                            player=player,
                            stat_types=stat_types,
                            stats_blob=stats_blob,
                            game_log=normalized_game_log,
                            matchup=matchup,
                            event=event_meta,
                            team_name=team_name,
                            opponent_name=opponent_name,
                        )

                        if player_props:
                            props.extend(player_props[:2])  # Keep dataset concise

            if len(props) < 8:
                # Supplement with top-profile players to maintain dashboard density
                supplemental_names = [
                    "Mike Trout",
                    "Aaron Judge",
                    "Mookie Betts",
                    "Juan Soto",
                ]
                for name in supplemental_names:
                    if len(props) >= 12:
                        break
                    extras = await self._add_popular_player_props(
                        name,
                        processed_players,
                        matchup_label=name,
                    )
                    props.extend(extras)

            await redis_conn.set(cache_key, json.dumps(props), ex=self.cache_ttl)
            logger.info(f"Generated {len(props)} player props using MLB Stats API")
            return props

        except Exception as e:
            logger.error(f"Error generating player props data: {e}")
            return []

    def _get_team_name_by_id(self, team_id: int, games: List[Dict]) -> str:
        """Get team name from games data."""
        for game in games:
            if game.get("home_id") == team_id:
                return game.get("home_team", "Unknown")
            elif game.get("away_id") == team_id:
                return game.get("away_team", "Unknown")
        return "Unknown Team"

    async def _add_popular_player_props(
        self,
        player_name: str,
        processed_players: set[int],
        matchup_label: str,
    ) -> List[Dict[str, Any]]:
        """Supplement dataset with marquee players using the same deterministic pipeline."""

        props: List[Dict[str, Any]] = []
        try:
            players = await self.search_players(player_name)
            if not players:
                return props

            player = players[0]
            player_id = player.get("id")

            if not player_id or player_id in processed_players:
                return props

            processed_players.add(player_id)

            stats_blob = await self.get_player_stats(player_id)
            game_log = await self.get_player_game_log(player_id)
            if isinstance(game_log, dict):
                normalized_game_log = game_log
            elif isinstance(game_log, list):
                normalized_game_log = {"stats": [{"splits": game_log}]}
            else:
                normalized_game_log = {"stats": [{"splits": []}]}

            position = player.get("positionCode", "")
            if position == "P":
                stat_types = ["strikeouts", "earned_runs"]
            else:
                stat_types = ["hits", "rbi"]

            team_name = player.get("currentTeam", "MLB")
            opponent_name = "Opponent"
            event_meta = {
                "game_id": f"popular_{player_id}",
                "event_name": f"{matchup_label} Spotlight",
                "start_time": datetime.now().isoformat(),
                "status": "Scheduled",
                "venue": "MLB Stadium",
            }

            props = self._derive_props_for_player(
                player=player,
                stat_types=stat_types,
                stats_blob=stats_blob,
                game_log=normalized_game_log,
                matchup=f"{team_name} Showcase",
                event=event_meta,
                team_name=team_name,
                opponent_name=opponent_name,
            )

            return props[:2]

        except Exception as e:
            logger.error(f"Error adding popular player {player_name}: {e}")
            return props
