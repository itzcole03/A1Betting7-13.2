"""
NBA Provider Client (nba_api-first)

This module prefers the unofficial `nba_api` client (stats.nba.com) as the
primary source for NBA teams, players and games. It intentionally avoids
calling the `balldontlie` HTTP API because some developers do not have an
API key for that service.

If `nba_api` is not installed the client will return empty lists and fall
back to deterministic/mock behaviour elsewhere in the app.

The implementation below is intentionally conservative and small: it
provides the methods used by `propfinder_data_service` and avoids
complex transformation logic. It runs blocking `nba_api` calls in a
threadpool using `asyncio.to_thread` so the interface remains async.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, cast

logger = logging.getLogger(__name__)

# Try to import nba_api (optional)
try:
    from nba_api.stats.endpoints import commonteamroster, leaguegamefinder, scoreboardv2
    from nba_api.stats.static import players as nba_players
    from nba_api.stats.static import teams as nba_teams

    NBA_API_AVAILABLE = True
    logger.info("nba_api available: using nba_api as primary NBA data source")
except Exception:  # pragma: no cover - best-effort optional import
    NBA_API_AVAILABLE = False
    logger.warning("nba_api not available; NBAProviderClient will return empty results")


class NBAProviderClient:
    """Lightweight NBA provider using nba_api as primary source."""

    def __init__(self) -> None:
        self.nba_api_available = NBA_API_AVAILABLE

    @staticmethod
    def alert_event(event_name: str, details: dict):
        logger.warning("[ALERT] %s: %s", event_name, json.dumps(details))

    @staticmethod
    def metrics_increment(metric_name: str):
        logger.debug("[METRIC] %s", metric_name)

    async def fetch_teams(self) -> List[Dict[str, Any]]:
        """Return a list of teams. Uses nba_api when available."""
        if not self.nba_api_available:
            return []

        try:
            teams = await asyncio.to_thread(nba_teams.get_teams)
            # Normalize to a simple structure similar to balldontlie
            converted = []
            for t in teams:
                converted.append(
                    {
                        "id": t.get("id"),
                        "abbreviation": t.get("abbreviation"),
                        "city": t.get("city"),
                        "conference": t.get("conference", ""),
                        "division": t.get("division", ""),
                        "full_name": t.get("full_name"),
                        "name": t.get("nickname") or t.get("name"),
                    }
                )
            return converted
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Failed to fetch teams from nba_api: %s", exc)
            return []

    async def fetch_players(
        self, team_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Return a list of active players. Optionally filter by team_id.

        If team_id is provided, use the CommonTeamRoster endpoint which
        reliably returns the active roster for the team. Otherwise fall back
        to the static get_active_players helper.
        """
        if not self.nba_api_available:
            return []

        try:
            # If caller asked for a specific team's players, use CommonTeamRoster
            if team_id is not None:

                def _fetch_roster(tid: int):
                    roster = commonteamroster.CommonTeamRoster(team_id=tid)
                    frames = roster.get_data_frames()
                    if not frames:
                        return []
                    return frames[0].to_dict("records")

                records = await asyncio.to_thread(_fetch_roster, team_id)
                converted = []
                for r in records:
                    converted.append(
                        {
                            "id": r.get("PLAYER_ID"),
                            "first_name": "",
                            "last_name": "",
                            "full_name": r.get("PLAYER"),
                            "position": r.get("POSITION"),
                            "team": {"id": r.get("TeamID")},
                        }
                    )
                return converted

            # Fallback: list of active players (no team info reliably available here)
            players = await asyncio.to_thread(nba_players.get_active_players)
            converted = []
            for p in players:
                converted.append(
                    {
                        "id": p.get("id") or p.get("playerId"),
                        "first_name": p.get("first_name") or p.get("firstName") or "",
                        "last_name": p.get("last_name") or p.get("lastName") or "",
                        "full_name": p.get("full_name") or p.get("fullName") or "",
                        "position": p.get("position") or p.get("pos") or "",
                        "team": {},
                    }
                )
            return converted
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Failed to fetch players from nba_api: %s", exc)
            return []

    async def fetch_todays_games(self) -> List[Dict[str, Any]]:
        """Fetch games for today's date using nba_api's LeagueGameFinder.

        Returns a list with simplified game dicts: id, game_date, home_team_id,
        visitor_team_id, status.
        """
        # Delegate to the more general date-aware fetch implementation
        return await self.fetch_games_for_date(datetime.utcnow().strftime("%Y-%m-%d"))

    async def fetch_games_for_date(self, date_str: str) -> List[Dict[str, Any]]:
        """Fetch games for a specific ISO date (YYYY-MM-DD) using LeagueGameFinder.

        This helper is used to probe adjacent dates when today's schedule is empty
        (e.g., offseason). It returns the same simplified game dicts as
        ``fetch_todays_games``.
        """
        if not self.nba_api_available:
            return []

        # Add retries and backoff because stats.nba.com can be flaky / time out
        max_retries = int(os.getenv("PROPFINDER_NBA_MAX_RETRIES", "3"))
        base_delay = float(os.getenv("PROPFINDER_NBA_RETRY_DELAY", "1"))

        def _fetch(ds: str):
            finder = leaguegamefinder.LeagueGameFinder(
                date_from_nullable=ds, date_to_nullable=ds
            )
            dframes = finder.get_data_frames()
            if not dframes:
                return []
            df = dframes[0]
            return df.to_dict("records")

        last_exc: Optional[Exception] = None
        records = []
        for attempt in range(1, max_retries + 1):
            try:
                logger.debug(
                    "[NBAProviderClient] fetch_games_for_date attempt %d/%d for %s",
                    attempt,
                    max_retries,
                    date_str,
                )
                records = await asyncio.to_thread(_fetch, date_str)
                # If call succeeded but returned empty, we still treat it as success
                logger.debug(
                    "[NBAProviderClient] raw nba_api records for %s: %d",
                    date_str,
                    len(records) if records is not None else 0,
                )
                break
            except Exception as exc:  # pragma: no cover - defensive
                last_exc = exc
                logger.warning(
                    "Failed to fetch games from nba_api for %s (attempt %d/%d): %s",
                    date_str,
                    attempt,
                    max_retries,
                    exc,
                )
                # exponential backoff
                await asyncio.sleep(base_delay * (2 ** (attempt - 1)))

        # If leaguegamefinder returned nothing, try scoreboardv2 as a fallback
        if not records:
            try:
                logger.debug(
                    "[NBAProviderClient] leaguegamefinder returned no records for %s, trying scoreboardv2",
                    date_str,
                )
                sb = scoreboardv2.ScoreboardV2(game_date=date_str)
                sb_frames = sb.get_data_frames()
                if sb_frames:
                    # scoreboardv2 frames[0] contains basic game info
                    records = sb_frames[0].to_dict("records")
                    logger.debug(
                        "[NBAProviderClient] scoreboardv2 returned %d records for %s",
                        len(records),
                        date_str,
                    )
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("scoreboardv2 fallback failed for %s: %s", date_str, exc)

        if last_exc is not None and not records:
            logger.exception(
                "Failed to fetch games from nba_api for %s after %d attempts: %s",
                date_str,
                max_retries,
                last_exc,
            )
            return []

        converted = []
        for r in records:
            game_id = r.get("GAME_ID") or r.get("game_id")
            home_team_id = (
                r.get("HOME_TEAM_ID") or r.get("home_team_id") or r.get("TEAM_ID_HOME")
            )
            visitor_team_id = (
                r.get("VISITOR_TEAM_ID")
                or r.get("visitor_team_id")
                or r.get("TEAM_ID_VISITOR")
            )
            game_date = (
                r.get("GAME_DATE") or r.get("game_date") or r.get("GAME_DATE_EST")
            )
            status = (
                r.get("GAME_STATUS_TEXT")
                or r.get("game_status_text")
                or r.get("STATUS")
            )

            converted.append(
                {
                    "id": game_id,
                    "game_date": game_date,
                    "home_team_id": home_team_id,
                    "visitor_team_id": visitor_team_id,
                    "status": status,
                }
            )

        return converted

    async def generate_player_props(
        self, target_date: Optional[str] = None, lookahead_days: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Generate simple player props for games starting at `target_date`.

        Args:
            target_date: optional ISO date string (YYYY-MM-DD). If provided,
                the provider will start probing from that date. If omitted,
                probing starts from today (UTC).
            lookahead_days: optional number of days to look ahead (inclusive).
                If omitted, the function will consult the environment variable
                `PROPFINDER_NBA_LOOKAHEAD_DAYS` and fall back to 30 days.

        Behavior: search day-by-day from `target_date` (or today) up to
        `lookahead_days`. Return generated props for the first date that has
        NBA games. If no games are found in the window, return an empty list.
        """

        # Determine lookahead from arg -> env -> default
        try:
            default_lookahead = int(os.getenv("PROPFINDER_NBA_LOOKAHEAD_DAYS", "30"))
        except Exception:
            default_lookahead = 30

        lookahead = (
            lookahead_days if isinstance(lookahead_days, int) else default_lookahead
        )

        # Determine start date
        if target_date:
            try:
                # Validate format; if invalid, fall back to today
                start = datetime.fromisoformat(target_date)
            except Exception:
                start = datetime.utcnow()
        else:
            start = datetime.utcnow()

        games: List[Dict[str, Any]] = []
        # Search day-by-day up to lookahead (inclusive of start)
        for delta in range(0, max(0, int(lookahead)) + 1):
            probe_dt = (start + timedelta(days=delta)).strftime("%Y-%m-%d")
            games = await self.fetch_games_for_date(probe_dt)
            if games:
                logger.info(
                    "[NBAProviderClient] Found %d games for %s", len(games), probe_dt
                )
                break

        if not games:
            logger.info(
                "[NBAProviderClient] No games found in the next %d days (nba_api)",
                lookahead,
            )
            return []

        props: List[Dict[str, Any]] = []

        for g in games:
            home_id = g.get("home_team_id")
            away_id = g.get("visitor_team_id")

            # fetch a few players for each side (non-blocking calls run concurrently)
            home_players_task = asyncio.create_task(self.fetch_players(team_id=home_id))
            away_players_task = asyncio.create_task(self.fetch_players(team_id=away_id))

            home_players = await home_players_task
            away_players = await away_players_task

            # take up to 3 players per team to keep output small
            sample_home = home_players[:3] if home_players else []
            sample_away = away_players[:3] if away_players else []

            for p in sample_home + sample_away:
                player_id = p.get("id") or f"p_{p.get('full_name','unknown')}"
                player_name = (
                    p.get("full_name")
                    or f"{p.get('first_name','')} {p.get('last_name','')}".strip()
                )
                position = p.get("position") or ""

                # Simple deterministic projection by position (very rough)
                if position.startswith("G"):
                    projection = 18.0
                elif position.startswith("F"):
                    projection = 12.0
                elif position.startswith("C"):
                    projection = 10.0
                else:
                    projection = 12.0

                prop = {
                    "id": f"nba_{player_id}_points",
                    "player": player_name,
                    "player_id": player_id,
                    "team_id": p.get("team", {}).get("id"),
                    "market": "points",
                    "projection": projection,
                    "line": projection,  # line equal projection as placeholder
                    "source": "nba_api",
                    "game_id": g.get("id"),
                    "sport": "NBA",
                }
                props.append(prop)

        logger.info(
            "[NBAProviderClient] Generated %d NBA prop opportunities", len(props)
        )
        return props


# single shared client instance
nba_provider_client = NBAProviderClient()
