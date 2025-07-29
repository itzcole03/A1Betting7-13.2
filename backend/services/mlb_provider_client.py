import json
import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import httpx
import redis.asyncio as redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class MLBProviderClient:
    # --- Metrics and Alerting Hooks ---
    @staticmethod
    def metrics_increment(metric_name: str) -> None:
        # Placeholder for metrics integration (e.g., Prometheus, StatsD)
        # Example: metrics.increment(metric_name)
        pass

    @staticmethod
    def alert_event(event_name: str, context: Optional[dict] = None) -> None:
        # Placeholder for alerting integration (e.g., Sentry, PagerDuty)
        # Example: alert_event(event_name, context)
        pass

    async def fetch_odds_comparison(
        self, market_type: str = "regular"
    ) -> List[Dict[str, Any]]:
        """
        Fetch and cache odds from the selected Odds Comparison API.
        Tries SportRadar first, falls back to TheOdds if SportRadar fails or returns no data.
        market_type: one of 'futures', 'prematch', 'regular', 'playerprops'
        Returns a list of odds dicts.
        """
        import json

        logger.debug(
            f"[MLBProviderClient] START fetch_odds_comparison for market_type={market_type}"
        )
        redis_conn = await self._get_redis()
        season_year = time.strftime("%Y")
        cache_key = f"mlb:odds_comparison:{market_type}:{season_year}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                f"[MLBProviderClient] Returning cached odds comparison for {market_type}."
            )
            MLBProviderClient.metrics_increment(
                f"mlb.odds_comparison.{market_type}.cache_hit"
            )
            return json.loads(cached)
        base_urls = {
            "futures": "https://api.sportradar.com/oddscomparison-futures-trial/v4/en/sports/baseball/mlb/futures.json",
            "prematch": "https://api.sportradar.com/oddscomparison-prematch-trial/v4/en/sports/baseball/mlb/prematch.json",
            "regular": "https://api.sportradar.com/oddscomparison-trial/v4/en/sports/baseball/mlb/odds.json",
            "playerprops": "https://api.sportradar.com/oddscomparison-playerprops-trial/v4/en/sports/baseball/mlb/playerprops.json",
        }
        url = base_urls.get(market_type)
        data = None
        if url:
            url = f"{url}?api_key={self.sportradar_api_key}"
            resp, err = await self._httpx_get_with_backoff(url)
            if resp is not None:
                data = resp.json()
                if data:
                    await redis_conn.set(cache_key, json.dumps(data), ex=self.CACHE_TTL)
                    logger.info(
                        "[MLBProviderClient] Returning SportRadar odds comparison data."
                    )
                    return data
                else:
                    logger.warning(
                        "[MLBProviderClient] SportRadar odds comparison returned no data, will try TheOdds fallback."
                    )
            else:
                logger.error(f"Error fetching odds comparison ({market_type}): {err}")
                MLBProviderClient.alert_event(
                    "mlb_odds_comparison_fetch_failure",
                    {"market_type": market_type, "error": str(err)},
                )
                logger.warning(
                    "[MLBProviderClient] SportRadar odds comparison failed, will try TheOdds fallback."
                )
        else:
            logger.error(f"Unknown market_type for odds comparison: {market_type}")
            MLBProviderClient.alert_event(
                "mlb_odds_comparison_unknown_market_type", {"market_type": market_type}
            )
            return []

        # Fallback to TheOdds API
        logger.info(
            "[MLBProviderClient] Fetching MLB odds from TheOdds API as fallback."
        )
        odds = await self.fetch_odds_theodds()
        if odds:
            if isinstance(odds, list) and len(odds) > 0:
                await redis_conn.set(cache_key, json.dumps(odds), ex=self.CACHE_TTL)
                logger.info(
                    "[MLBProviderClient] Returning TheOdds odds data as fallback."
                )
                MLBProviderClient.metrics_increment(
                    "mlb.odds_comparison.fallback_success"
                )
                MLBProviderClient.alert_event(
                    "mlb_odds_comparison_fallback",
                    {"market_type": market_type, "source": "TheOdds"},
                )
                return odds
            else:
                logger.warning(
                    "[MLBProviderClient] TheOdds odds fetch returned empty list. Not overwriting cache."
                )
                MLBProviderClient.metrics_increment(
                    "mlb.odds_comparison.fallback_empty"
                )
                MLBProviderClient.alert_event(
                    "mlb_odds_comparison_fallback_empty", {"market_type": market_type}
                )
        logger.error(
            "[MLBProviderClient] Both SportRadar and TheOdds odds fetch failed or returned no data."
        )
        MLBProviderClient.metrics_increment("mlb.odds_comparison.total_failure")
        MLBProviderClient.alert_event(
            "mlb_odds_comparison_total_failure", {"market_type": market_type}
        )
        cached_final = await redis_conn.get(cache_key)
        return json.loads(cached_final) if cached_final else []

    async def fetch_country_flag(self, country_code: str) -> Optional[str]:
        """
        Fetch and cache the URL for a country flag image by country code.
        Returns the image URL or None if not found.
        """

        redis_conn = await self._get_redis()
        cache_key = f"country_flag:{country_code.upper()}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached flag for %s.", country_code
            )
            MLBProviderClient.metrics_increment("country_flag.cache_hit")
            return cached.decode()
        url = f"https://api.sportradar.com/images-trial3/flags/{country_code.lower()}/flag.png?api_key={self.sportradar_api_key}"
        await redis_conn.set(cache_key, url, ex=60 * 60 * 24 * 30)  # Cache for 30 days
        return url

    async def fetch_action_shots_ap(self, event_id: str) -> List[Dict[str, Any]]:
        """
        Fetch and cache AP Action Shots manifest for a given MLB event.
        Returns a list of image asset dicts for the event.
        """
        # import json  # Unused

        redis_conn = await self._get_redis()
        cache_key = f"mlb:action_shots:{event_id}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached AP Action Shots for event %s.",
                event_id,
            )
            MLBProviderClient.metrics_increment("mlb.action_shots.cache_hit")
            return json.loads(cached)
        url = f"https://api.sportradar.com/mlb-images-trial3/ap/mlb/actionshots/events/mlb/{event_id}/manifest.json?api_key={self.sportradar_api_key}"
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None or err:
            logger.error(
                "Error fetching AP Action Shots for event %s: %s", event_id, err
            )
            MLBProviderClient.alert_event(
                "mlb_action_shots_fetch_failure",
                {"event_id": event_id, "error": str(err)},
            )
            return json.loads(cached) if cached else []
        data = resp.json()
        assets = data.get("assets", [])
        await redis_conn.set(cache_key, json.dumps(assets), ex=self.CACHE_TTL)
        return assets

    async def _httpx_get_with_backoff(
        self,
        url: str,
        max_retries: int = 4,
        base_delay: float = 1.0,
        timeout: float = 5.0,
    ) -> Tuple[Optional[httpx.Response], Optional[Exception]]:
        # Helper for GET requests with exponential backoff on 429/5xx errors.
        # Returns (response, error) tuple. Logs and alerts on persistent failures.
        import asyncio

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.get(url)
                    if resp.status_code == 403:
                        logger.warning(
                            "[MLBProviderClient] 403 Forbidden received for %s (attempt %d) - short-circuiting to fallback.",
                            url,
                            attempt + 1,
                        )
                        return None, httpx.HTTPStatusError(
                            "403 Forbidden", request=resp.request, response=resp
                        )
                    if resp.status_code == 429 or 500 <= resp.status_code < 600:
                        logger.warning(
                            "[MLBProviderClient] %s received for %s (attempt %d)",
                            resp.status_code,
                            url,
                            attempt + 1,
                        )
                        await asyncio.sleep(base_delay * (2**attempt))
                        continue
                    resp.raise_for_status()
                    return resp, None
            except httpx.HTTPStatusError as e:
                logger.warning(
                    "[MLBProviderClient] HTTP error for %s: %s (attempt %d)",
                    url,
                    e,
                    attempt + 1,
                )
                if hasattr(e.response, "status_code") and (
                    e.response.status_code == 429 or 500 <= e.response.status_code < 600
                ):
                    await asyncio.sleep(base_delay * (2**attempt))
                    continue
                return None, e
            except (httpx.RequestError, ValueError) as e:
                logger.error(
                    "[MLBProviderClient] Unexpected error for %s: %s (attempt %d)",
                    url,
                    e,
                    attempt + 1,
                )
                await asyncio.sleep(base_delay * (2**attempt))
                continue
        logger.error(
            "[MLBProviderClient] Persistent failure for %s after %d attempts",
            url,
            max_retries,
        )
        # ALERTING HOOK: Integrate with monitoring/alerting system here (e.g., Sentry, PagerDuty)
        # Example: alert_persistent_failure(url, max_retries)
        # TODO: Implement alert_persistent_failure
        return None, Exception(f"Failed after {max_retries} attempts")

    async def fetch_theodds_participants(self) -> List[Dict[str, Any]]:
        """
        Fetch and cache the canonical team list from TheOdds `/participants` endpoint.
        Returns a list of team dicts with normalized names and IDs.
        """
        """
        Fetch and cache the canonical team list from TheOdds `/participants` endpoint.
        Returns a list of team dicts with normalized names and IDs.
        Uses Redis for persistent caching.
        """
        import json

        redis_conn = await self._get_redis()
        cache_key = "mlb:theodds:participants"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached TheOdds participants from Redis."
            )
            MLBProviderClient.metrics_increment("mlb.theodds.participants.cache_hit")
            return json.loads(cached)
        url = f"https://api.the-odds-api.com/v4/sports/baseball_mlb/participants/?apiKey={self.theodds_api_key}"
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching TheOdds participants: %s", err)
            return json.loads(cached) if cached else []
        data = resp.json()
        # Normalize team names (lowercase, strip, etc.)
        for team in data:
            team["normalized_name"] = team["name"].strip().lower()
        await redis_conn.set(cache_key, json.dumps(data), ex=self.CACHE_TTL)
        return data

    async def fetch_event_mappings_sportradar(self) -> Dict[str, Dict[str, Any]]:
        logger.debug("[MLBProviderClient] START fetch_event_mappings_sportradar")
        """
        Fetch and cache SportRadar event mappings for robust cross-provider event ID matching.
        Returns a dict mapping SportRadar event_id to mapping info (including TheOdds IDs if available).
        """
        """
        Fetch and cache SportRadar event mappings for robust cross-provider event ID matching.
        Returns a dict mapping SportRadar event_id to mapping info (including TheOdds IDs if available).
        Uses fallback logic and logs warnings if endpoint is unavailable or forbidden.
        """
        import json

        redis_conn = await self._get_redis()
        cache_key = "mlb:event_mappings"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info(
                "[MLBProviderClient] Returning cached event mappings from Redis."
            )
            MLBProviderClient.metrics_increment("mlb.event_mappings.cache_hit")
            return json.loads(cached)
        # For demo: fetch all events, then for each event, fetch its mapping (could be optimized)
        events = await self.fetch_events_sportradar()
        mappings = {}
        mapping_403_logged = False
        for event in events:
            event_id = event["event_id"]
            url = f"https://api.sportradar.com/mlb/trial/v8/en/events/{event_id}/mappings.json?api_key={self.sportradar_api_key}"
            resp, err = await self._httpx_get_with_backoff(url)
            if resp is not None:
                data = resp.json()
                mappings[event_id] = data
                logger.info(
                    "[MLBProviderClient] Successfully fetched mapping for event.",
                    extra={"event_id": event_id, "endpoint": url},
                )
            else:
                # If 403 Forbidden, log a clear warning only once per run and break loop
                if (
                    hasattr(err, "response")
                    and getattr(err.response, "status_code", None) == 403
                    and not mapping_403_logged
                ):
                    logger.warning(
                        "[MLBProviderClient] 403 Forbidden from SportRadar event mapping endpoint. Your API key does not have access. Odds mapping will proceed with available data.",
                        extra={"event_id": event_id, "endpoint": url},
                    )
                    mapping_403_logged = True
                    break
                logger.warning(
                    "[MLBProviderClient] Failed to fetch mapping for event.",
                    extra={"event_id": event_id, "endpoint": url, "error": str(err)},
                )
        if not mappings:
            logger.warning(
                "[MLBProviderClient] No event mappings available. Odds mapping will use fallback logic.",
                extra={"endpoint": "event_mappings", "events_count": len(events)},
            )
        await redis_conn.set(cache_key, json.dumps(mappings), ex=self.CACHE_TTL)
        logger.debug(
            f"[MLBProviderClient] END fetch_event_mappings_sportradar, mappings count: {len(mappings)}"
        )
        return mappings

    # Caching and rate limiting config
    CACHE_TTL = 600  # 10 minutes in seconds
    RATE_LIMIT_SECONDS = 10  # min seconds between requests per endpoint

    def __init__(self):
        # Load API keys from environment variables or config_manager (never hardcode secrets)
        # TODO: Optionally use config_manager.get("SPORTRADAR_API_KEY") if project standardizes on config_manager
        self.sportradar_api_key = os.getenv("SPORTRADAR_API_KEY")
        self.theodds_api_key = os.getenv("THEODDS_API_KEY")
        if not self.sportradar_api_key or not self.theodds_api_key:
            raise RuntimeError(
                "API keys must be set in environment variables or config_manager. Never hardcode secrets."
            )
        self.redis = None
        self._last_request = {
            "teams": 0,
            "events": 0,
            "odds": 0,
        }

    async def _get_redis(self):
        if self.redis is None:
            self.redis = await redis.from_url(REDIS_URL)
        return self.redis

    async def get_data(self) -> Dict[str, List[Dict[str, Any]]]:
        teams = await self.fetch_teams_sportradar()
        events = await self.fetch_events_sportradar()
        odds = await self.fetch_odds_theodds()
        return {
            "teams": teams,
            "events": events,
            "odds": odds,
        }

    async def fetch_teams_sportradar(self) -> List[Dict[str, Any]]:
        import json

        now = time.time()
        redis_conn = await self._get_redis()
        cache_key = "mlb:teams"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info("[MLBProviderClient] Returning cached teams data from Redis.")
            MLBProviderClient.metrics_increment("mlb.teams.cache_hit")
            return json.loads(cached)
        # Dynamic rate limiting based on quota
        quota_key = "mlb:teams:quota"
        quota = await redis_conn.get(quota_key)
        if quota is not None and int(quota) < 5:
            logger.warning(
                "[MLBProviderClient] Quota low for teams endpoint (%s remaining). Returning cached data.",
                quota,
            )
            # ALERTING HOOK: Integrate with monitoring/alerting system for quota exhaustion
            # Example: alert_quota_exhaustion('teams', quota)
            # TODO: Implement alert_quota_exhaustion
            return json.loads(cached) if cached else []
        if now - self._last_request["teams"] < self.RATE_LIMIT_SECONDS:
            logger.warning(
                "[MLBProviderClient] Rate limit hit for teams endpoint. Returning last cached data."
            )
            return json.loads(cached) if cached else []
        url = f"https://api.sportradar.com/mlb/trial/v8/en/league/teams.json?api_key={self.sportradar_api_key}"
        # Fetch and cache MLB teams from SportRadar.
        # Uses Redis for persistent caching and dynamic rate limiting based on quota and time.
        # Returns a list of team dicts with provider IDs.
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching teams from SportRadar: %s", err)
            return json.loads(cached) if cached else []
        quota_remaining = resp.headers.get("x-requests-remaining") or resp.headers.get(
            "x-ratelimit-remaining"
        )
        if quota_remaining is not None:
            await redis_conn.set(quota_key, int(quota_remaining), ex=600)
            logger.info(
                "[MLBProviderClient] SportRadar teams quota remaining: %s",
                quota_remaining,
            )
        data = resp.json()
        teams = [
            {
                "name": t["name"],
                "provider_id": t["id"],
            }
            for t in data.get("teams", [])
        ]
        await redis_conn.set(cache_key, json.dumps(teams), ex=self.CACHE_TTL)
        self._last_request["teams"] = now
        return teams

    async def fetch_events_sportradar(self) -> List[Dict[str, Any]]:
        import json

        now = time.time()
        redis_conn = await self._get_redis()
        # Use season year for more granular cache key
        season_year = time.strftime("%Y")
        cache_key = f"mlb:events:{season_year}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info("[MLBProviderClient] Returning cached events data from Redis.")
            MLBProviderClient.metrics_increment("mlb.events.cache_hit")
            return json.loads(cached)
        quota_key = "mlb:events:quota"
        quota = await redis_conn.get(quota_key)
        if quota is not None and int(quota) < 5:
            logger.warning(
                "[MLBProviderClient] Quota low for events endpoint (%s remaining). Returning cached data.",
                quota,
            )
            # ALERTING HOOK: Integrate with monitoring/alerting system for quota exhaustion
            # Example: alert_quota_exhaustion('events', quota)
            # TODO: Implement alert_quota_exhaustion
            return json.loads(cached) if cached else []
        if now - self._last_request["events"] < self.RATE_LIMIT_SECONDS:
            logger.warning(
                "[MLBProviderClient] Rate limit hit for events endpoint. Returning last cached data."
            )
            return json.loads(cached) if cached else []
        url = f"https://api.sportradar.com/mlb/trial/v8/en/games/2025/REG/schedule.json?api_key={self.sportradar_api_key}"
        # Fetch and cache MLB events (games) from SportRadar.
        # Uses Redis for persistent caching and dynamic rate limiting based on quota and time.
        # Returns a list of event dicts with event IDs and metadata.
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching events from SportRadar: %s", err)
            return json.loads(cached) if cached else []
        quota_remaining = resp.headers.get("x-requests-remaining") or resp.headers.get(
            "x-ratelimit-remaining"
        )
        if quota_remaining is not None:
            await redis_conn.set(quota_key, int(quota_remaining), ex=600)
            logger.info(
                "[MLBProviderClient] SportRadar events quota remaining: %s",
                quota_remaining,
            )
        data = resp.json()
        events = [
            {
                "event_id": g["id"],
                "name": f"{g['home']['name']} vs {g['away']['name']}",
                "start_time": g["scheduled"],
                "provider_id": g["id"],
            }
            for g in data.get("games", [])
        ]
        await redis_conn.set(cache_key, json.dumps(events), ex=self.CACHE_TTL)
        self._last_request["events"] = now
        return events

    async def fetch_odds_theodds(self) -> List[Dict[str, Any]]:
        # Dump full raw odds data to a file for inspection
        with open("mlb_odds_raw_dump.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.debug(
            f"[MLBProviderClient] RAW TheOdds data dumped to mlb_odds_raw_dump.json"
        )
        logger.debug("[MLBProviderClient] START fetch_odds_theodds")
        import json

        now = time.time()
        redis_conn = await self._get_redis()
        # Use season year for more granular cache key
        season_year = time.strftime("%Y")
        cache_key = f"mlb:odds:{season_year}"
        cached = await redis_conn.get(cache_key)
        if cached:
            logger.info("[MLBProviderClient] Returning cached odds data from Redis.")
            MLBProviderClient.metrics_increment("mlb.odds.cache_hit")
            return json.loads(cached)
        quota_key = "mlb:odds:quota"
        quota = await redis_conn.get(quota_key)
        if quota is not None and int(quota) < 5:
            logger.warning(
                "[MLBProviderClient] Quota low for odds endpoint (%s remaining). Returning cached data.",
                quota,
            )
            # ALERTING HOOK: Integrate with monitoring/alerting system for quota exhaustion
            # Example: alert_quota_exhaustion('odds', quota)
            # TODO: Implement alert_quota_exhaustion
            return json.loads(cached) if cached else []
        if now - self._last_request["odds"] < self.RATE_LIMIT_SECONDS:
            logger.warning(
                "[MLBProviderClient] Rate limit hit for odds endpoint. Returning last cached data."
            )
            return json.loads(cached) if cached else []
        # Fetch event mappings for robust ID matching
        event_mappings = await self.fetch_event_mappings_sportradar()
        if not event_mappings:
            logger.warning(
                "[MLBProviderClient] No event mappings available. Odds will be mapped using fallback logic (TheOdds event IDs only).",
                extra={"endpoint": "fetch_odds_theodds"},
            )
        url = f"https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey={self.theodds_api_key}&regions=us&markets=h2h,spreads,totals"
        resp, err = await self._httpx_get_with_backoff(url)
        if resp is None:
            logger.error("Error fetching odds from TheOdds: %s", err)
            if cached:
                return json.loads(cached)
            else:
                return []
        quota_remaining = resp.headers.get("x-requests-remaining") or resp.headers.get(
            "x-ratelimit-remaining"
        )
        if quota_remaining is not None:
            await redis_conn.set(quota_key, int(quota_remaining), ex=600)
            logger.info(
                "[MLBProviderClient] TheOdds quota remaining: %s",
                quota_remaining,
            )
        data = resp.json()
        odds = []
        for event in data:
            event_name = (
                event.get("home_team", "") + " vs " + event.get("away_team", "")
            )
            event_start_time = event.get("commence_time", "")
            theodds_event_id = event.get("id")
            mapped_srid = None
            if event_mappings:
                for srid, mapping in event_mappings.items():
                    if "mappings" in mapping:
                        for m in mapping["mappings"]:
                            if (
                                m.get("provider", "").lower() == "theoddsapi"
                                and m.get("id") == theodds_event_id
                            ):
                                mapped_srid = srid
                                break
                    if mapped_srid:
                        break
            else:
                logger.debug(
                    "[MLBProviderClient] Fallback: No event mapping for TheOdds event_id %s. Using TheOdds event_id as canonical.",
                    theodds_event_id,
                )
            for bookmaker in event.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    market_key = market.get("key", "")
                    logger.debug(
                        f"[MLBProviderClient] Event: {event.get('id')} Market: {market_key} RAW: {json.dumps(market)[:1000]}"
                    )
                    for outcome in market.get("outcomes", []):
                        logger.debug(
                            f"[MLBProviderClient] Event: {event.get('id')} Market: {market_key} Outcome RAW: {json.dumps(outcome)[:500]}"
                        )
                        # Heuristic: If market_key contains 'player' or 'prop', treat as player prop
                        # Try to extract player name from outcome fields
                        player_name = None
                        if "player" in market_key or "prop" in market_key:
                            player_name = (
                                outcome.get("description")
                                or outcome.get("player")
                                or outcome.get("participant")
                            )
                            # Fallback: if outcome name looks like a player (e.g., contains a space and not a team)
                            if not player_name and outcome.get("name"):
                                name_val = outcome["name"]
                                # Ignore 'Over'/'Under' as player names
                                if name_val.lower() in ["over", "under"]:
                                    player_name = None
                                elif len(name_val.split()) >= 2 and not any(
                                    team in name_val
                                    for team in [
                                        event.get("home_team", ""),
                                        event.get("away_team", ""),
                                    ]
                                ):
                                    player_name = name_val
                        # If still not found, and this is a team prop, set to None or 'Team'
                        if not player_name and (
                            market_key in ["totals", "h2h", "spreads"]
                            or outcome.get("name", "").lower() in ["over", "under"]
                        ):
                            player_name = None
                        odds.append(
                            {
                                "event_id": mapped_srid or theodds_event_id,
                                "event_name": event_name,
                                "start_time": event_start_time,
                                "team_name": outcome.get("name"),
                                "player_name": player_name,
                                "odds_type": market_key,
                                "value": outcome.get("price"),
                                "provider_id": bookmaker.get("key"),
                                "mapping_fallback": mapped_srid is None,
                            }
                        )
        await redis_conn.set(cache_key, json.dumps(odds), ex=self.CACHE_TTL)
        self._last_request["odds"] = now
        logger.debug(
            f"[MLBProviderClient] END fetch_odds_theodds, odds count: {len(odds)}"
        )
        return odds
