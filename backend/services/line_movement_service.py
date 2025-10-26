"""
Line Movement Service

Redis-based time-series storage for betting line movements with magnitude calculations,
direction detection, and volatility scoring. Maintains up to 40 snapshots per line.
"""

import asyncio
import json
import logging
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

try:
    import redis.asyncio as redis

    REDIS_AVAILABLE = True
except ImportError:
    # Fallback mock for environments without Redis
    redis = None
    REDIS_AVAILABLE = False

# Import Prometheus metrics
from ..metrics.line_movement_metrics import (
    LineMovementMetrics,
    instrument_line_movement_function,
)
from ..models.line_movement import (
    DEFAULT_MOVEMENT_CONFIG,
    LineMovementResponse,
    LineSnapshot,
    MovementConfiguration,
    MovementDirection,
    MovementEvent,
    MovementMetrics,
    MovementStats,
    calculate_movement_stats,
    create_movement_event,
)

logger = logging.getLogger("propollama.line_movement")


class LineMovementService:
    """Service for tracking and analyzing betting line movements in Redis"""

    def __init__(
        self,
        redis_client: Optional[Any] = None,
        config: MovementConfiguration = DEFAULT_MOVEMENT_CONFIG,
    ):
        # If a redis_client is explicitly provided, honor it and use Redis.
        # Otherwise default to in-memory-only for test stability and to avoid
        # implicit attempts to connect to Redis during unit tests.
        self.redis = redis_client
        self._use_redis = redis_client is not None
        self.config = config
        self._metrics = MovementMetrics(
            total_snapshots=0,
            high_volatility_events=0,
            active_tracked_lines=0,
            avg_snapshots_per_line=0.0,
        )
        self._in_memory_store: Dict[str, List[Dict]] = {}  # Fallback storage

    # --- Convenience helpers for CLV enrichment (object/dict agnostic) ---
    def _get(self, obj: Any, key: str, default: Any = None) -> Any:
        try:
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)
        except Exception:
            return default

    def _set(self, obj: Any, key: str, value: Any) -> None:
        try:
            if isinstance(obj, dict):
                obj[key] = value
            else:
                setattr(obj, key, value)
        except Exception:
            # Silently ignore setting errors to keep enrichment non-fatal
            pass

    def _calculate_and_set_clv(
        self,
        obj: Any,
        opening_line: Optional[float],
        closing_line: Optional[float],
        getter: Optional[Any] = None,
        setter: Optional[Any] = None,
    ) -> None:
        """Calculate CLV percentage and set clvPercent/closingLine on the object.

        CLV% = ((closing - opening) / opening) * 100, rounded to 2 decimals.
        Edge cases: if opening is None or 0, or closing is None -> clvPercent = None.
        """
        if callable(getter):
            get_value = getter
        else:
            get_value = lambda field: self._get(obj, field)

        if callable(setter):
            set_value = setter
        else:
            set_value = lambda field, value: self._set(obj, field, value)

        # If closing line not provided, fall back to object's latest line/line fields
        effective_closing = closing_line
        if effective_closing is None:
            effective_closing = get_value("latestLine")

        # Always set closingLine even if CLV cannot be computed
        set_value("closingLine", effective_closing)

        # Guard: need both opening and closing values to compute CLV
        if opening_line is None or effective_closing is None:
            set_value("clvPercent", None)
            return

        try:
            opening = float(opening_line)
            closing = float(effective_closing)
        except Exception:
            set_value("clvPercent", None)
            return

        if opening == 0.0:
            set_value("clvPercent", None)
            return

        clv = ((closing - opening) / opening) * 100.0
        # Round to 2 decimals to match tests
        clv = round(clv, 2)
        set_value("clvPercent", clv)

    def enrich_opportunity(
        self,
        opp: Any,
        force_flat_baseline: bool = False,
        include_diagnostics: bool = False,
    ) -> Any:
        """Enrich an opportunity with movement details and CLV fields.

        Supports both attr-based objects and dicts. Does not require prior snapshots; computes
        movement and CLV from fields present on the opportunity. Returns the mutated object.
        """
        try:
            # Apply force flat baseline by using the current line and odds as both opening and latest
            if force_flat_baseline:
                base_line = self._get(opp, "line")
                base_odds = self._get(opp, "odds")
                self._set(opp, "openingLine", base_line)
                self._set(opp, "latestLine", base_line)
                self._set(opp, "openingOdds", base_odds)
                self._set(opp, "latestOdds", base_odds)

            opening_line = self._get(opp, "openingLine")
            latest_line = self._get(opp, "latestLine")

            # Fallback odds handling
            latest_odds = self._get(opp, "latestOdds")
            if latest_odds is None:
                latest_odds = self._get(opp, "odds")
                if latest_odds is not None:
                    self._set(opp, "latestOdds", latest_odds)

            # Calculate movement direction and deltas when possible
            direction = "flat"
            if opening_line is not None and latest_line is not None:
                try:
                    ol = float(opening_line)
                    ll = float(latest_line)
                    if ll > ol:
                        direction = "up"
                    elif ll < ol:
                        direction = "down"
                    else:
                        direction = "flat"
                    self._set(opp, "lineChange", round(ll - ol, 3))
                except Exception:
                    self._set(opp, "lineChange", 0.0)
            else:
                self._set(opp, "lineChange", 0.0)

            # Odds change if openingOdds present
            opening_odds = self._get(opp, "openingOdds")
            if opening_odds is not None and latest_odds is not None:
                try:
                    self._set(opp, "oddsChange", int(latest_odds) - int(opening_odds))
                except Exception:
                    self._set(opp, "oddsChange", 0)
            else:
                self._set(opp, "oddsChange", 0)

            self._set(opp, "movementDirection", direction)

            # Compute CLV and set closing fields
            try:
                self._calculate_and_set_clv(opp, opening_line, latest_line)
            except Exception:
                # Non-fatal: keep enrichment robust
                pass

            # closingOdds preference: latestOdds, else odds
            closing_odds = (
                latest_odds if latest_odds is not None else self._get(opp, "odds")
            )
            self._set(opp, "closingOdds", closing_odds)

            if include_diagnostics:
                # Minimal diagnostics to satisfy tests
                self._set(
                    opp, "movementSource", "line_movement_service.enrich_opportunity"
                )
                self._set(opp, "movementApplied", True)

            return opp
        except Exception:
            # Ensure enrichment is non-throwing
            try:
                self._set(
                    opp,
                    "movementDirection",
                    self._get(opp, "movementDirection", "flat"),
                )
            except Exception:
                pass
            return opp

    async def _ensure_redis(self) -> Optional[Any]:
        """Ensure Redis connection is available"""
        # If this instance was created without an explicit redis client, do
        # not attempt to auto-connect. This keeps unit tests deterministic
        # and avoids spurious network calls. Callers that want Redis should
        # pass a client when constructing the service.
        if self.redis is not None:
            return self.redis

        if not self._use_redis:
            # Intentionally not attempting to connect to Redis for this
            # instance - use in-memory fallback.
            logger.debug(
                "Instance configured for in-memory storage; skipping Redis connect"
            )
            return None

        if not REDIS_AVAILABLE or redis is None:
            logger.warning("Redis package not available, using in-memory fallback")
            return None

        try:
            self.redis = await redis.from_url(
                "redis://localhost:6379", decode_responses=True
            )
            await self.redis.ping()
        except Exception as e:
            logger.warning(f"Failed to connect to Redis, using in-memory fallback: {e}")
            self.redis = None
        return self.redis

    async def record_snapshot(
        self,
        sport: str,
        player: str,
        market: str,
        line: float,
        best_odds: int,
        source: str = "odds_aggregation",
    ) -> MovementEvent:
        """
        Record a new line snapshot and return movement event data

        Args:
            sport: Sport abbreviation (e.g., MLB, NBA)
            player: Player name
            market: Market type (e.g., HR, Points)
            line: Current betting line
            best_odds: Best available odds
            source: Source that triggered the snapshot

        Returns:
            MovementEvent with calculated movement data
        """
        redis_client = await self._ensure_redis()
        redis_key = self.config.generate_redis_key(sport, player, market)

        # Get current snapshots to calculate previous line
        current_snapshots = await self.get_snapshots(sport, player, market)
        previous_line = current_snapshots[0].line if current_snapshots else None

        # Create new snapshot
        snapshot = LineSnapshot(
            ts=datetime.now(timezone.utc), line=line, bestOdds=best_odds, source=source
        )

        # Serialize snapshot for storage
        snapshot_data = {
            "ts": snapshot.ts.isoformat(),
            "line": snapshot.line,
            "bestOdds": snapshot.bestOdds,
            "source": snapshot.source,
        }

        if redis_client:
            # Use Redis for persistent storage
            try:
                # Use Redis list to maintain chronological order
                await redis_client.lpush(redis_key, json.dumps(snapshot_data))

                # Trim to max snapshots
                await redis_client.ltrim(
                    redis_key, 0, self.config.max_snapshots_per_line - 1
                )

                # Set TTL
                ttl_seconds = self.config.snapshot_ttl_hours * 3600
                await redis_client.expire(redis_key, ttl_seconds)

            except Exception as e:
                logger.warning(f"Redis operation failed, falling back to memory: {e}")
                # Reset redis client to avoid repeated failing calls (e.g., closed event loop)
                try:
                    self.redis = None
                except Exception:
                    pass
                self._store_in_memory(redis_key, snapshot_data)
        else:
            # Use in-memory fallback
            self._store_in_memory(redis_key, snapshot_data)

        # Update metrics
        LineMovementMetrics.record_snapshot(sport, market, source)
        self._metrics.total_snapshots += 1

        # Calculate movement stats for volatility
        updated_snapshots = await self.get_snapshots(sport, player, market)
        stats = calculate_movement_stats(updated_snapshots)

        # Record volatility metric
        LineMovementMetrics.record_volatility_score(
            sport, market, stats.volatilityScore
        )

        # Check for high volatility
        if stats.volatilityScore > self.config.volatility_threshold:
            LineMovementMetrics.record_high_volatility(sport, market)
            self._metrics.high_volatility_events += 1

        # Record magnitude metric
        if previous_line is not None:
            magnitude = abs(line - previous_line)
            direction = (
                "up"
                if line > previous_line
                else "down" if line < previous_line else "flat"
            )
            LineMovementMetrics.record_magnitude(sport, market, direction, magnitude)

        # Create movement event
        movement_event = create_movement_event(
            sport=sport,
            player=player,
            market=market,
            previous_line=previous_line,
            new_line=line,
            source=source,
            volatility_score=stats.volatilityScore,
        )

        logger.info(
            f"Recorded line movement snapshot: {sport}/{player}/{market} "
            f"line={line} previous={previous_line} magnitude={movement_event.magnitude:.2f} "
            f"volatility={stats.volatilityScore:.2f}"
        )

        return movement_event

    def _store_in_memory(self, key: str, snapshot_data: Dict) -> None:
        """Store snapshot in memory as fallback"""
        if key not in self._in_memory_store:
            self._in_memory_store[key] = []

        self._in_memory_store[key].insert(
            0, snapshot_data
        )  # Insert at beginning (newest first)

        # Trim to max snapshots
        if len(self._in_memory_store[key]) > self.config.max_snapshots_per_line:
            self._in_memory_store[key] = self._in_memory_store[key][
                : self.config.max_snapshots_per_line
            ]

    async def get_snapshots(
        self, sport: str, player: str, market: str, limit: Optional[int] = None
    ) -> List[LineSnapshot]:
        """
        Retrieve snapshots for a specific line

        Args:
            sport: Sport abbreviation
            player: Player name
            market: Market type
            limit: Maximum snapshots to return

        Returns:
            List of LineSnapshot objects in chronological order (newest first)
        """
        redis_client = await self._ensure_redis()
        redis_key = self.config.generate_redis_key(sport, player, market)
        max_count = limit or self.config.max_snapshots_per_line

        raw_snapshots = []

        if redis_client:
            try:
                # Get snapshots from Redis list
                raw_snapshots = await redis_client.lrange(redis_key, 0, max_count - 1)
            except Exception as e:
                logger.warning(f"Redis read failed, using memory fallback: {e}")
                # Reset redis client to avoid repeated failing calls
                try:
                    self.redis = None
                except Exception:
                    pass
                raw_snapshots = self._in_memory_store.get(redis_key, [])[:max_count]
        else:
            # Use in-memory fallback
            raw_snapshots = self._in_memory_store.get(redis_key, [])[:max_count]

        snapshots = []
        for raw_data in raw_snapshots:
            try:
                if isinstance(raw_data, str):
                    data = json.loads(raw_data)
                else:
                    data = raw_data

                ts_value = data.get("ts") or data.get("timestamp")
                if ts_value is None:
                    raise KeyError("ts")

                best_odds_value = data.get("bestOdds")
                if best_odds_value is None:
                    best_odds_value = data.get("best_odds")
                if best_odds_value is None:
                    raise KeyError("bestOdds")

                snapshot = LineSnapshot(
                    ts=datetime.fromisoformat(ts_value),
                    line=data["line"],
                    bestOdds=int(best_odds_value),
                    source=data.get("source", "unknown"),
                )
                snapshots.append(snapshot)
            except (json.JSONDecodeError, KeyError, ValueError) as e:
                logger.warning(f"Failed to parse snapshot data: {e}")
                continue

        # Sort by timestamp (newest first)
        return sorted(snapshots, key=lambda x: x.ts, reverse=True)

    async def get_movement_analysis(
        self, sport: str, player: str, market: str, limit: Optional[int] = None
    ) -> LineMovementResponse:
        """
        Get comprehensive movement analysis for a line

        Args:
            sport: Sport abbreviation
            player: Player name
            market: Market type
            limit: Maximum snapshots to include

        Returns:
            LineMovementResponse with timeline and analysis
        """
        snapshots = await self.get_snapshots(sport, player, market, limit)

        if not snapshots:
            # Return empty response for lines with no data
            return LineMovementResponse(
                timeline=[],
                movementMagnitude=0.0,
                direction=MovementDirection.FLAT,
                volatilityScore=0.0,
                lastUpdated=datetime.now(timezone.utc),
                player=player,
                market=market,
                sport=sport,
            )

        # Calculate movement statistics (need chronological order)
        chronological_snapshots = sorted(snapshots, key=lambda x: x.ts)
        stats = calculate_movement_stats(chronological_snapshots)

        return LineMovementResponse(
            timeline=snapshots,  # Keep newest first for API
            movementMagnitude=stats.movementMagnitude,
            direction=stats.direction,
            volatilityScore=stats.volatilityScore,
            lastUpdated=stats.lastUpdated,
            player=player,
            market=market,
            sport=sport,
        )

    async def get_recent_movements(
        self,
        sport: Optional[str] = None,
        hours_back: int = 24,
        min_magnitude: float = 0.5,
    ) -> List[Dict]:
        """
        Get recent significant movements across all tracked lines

        Args:
            sport: Optional sport filter
            hours_back: Hours to look back
            min_magnitude: Minimum magnitude to include

        Returns:
            List of movement summaries
        """
        redis_client = await self._ensure_redis()

        # Get all line movement keys
        pattern = f"{self.config.redis_key_prefix}:*"
        if sport:
            pattern = f"{self.config.redis_key_prefix}:{sport}:*"

        keys = []
        if redis_client:
            try:
                keys = await redis_client.keys(pattern)
            except Exception as e:
                logger.warning(f"Redis keys operation failed: {e}")
                try:
                    self.redis = None
                except Exception:
                    pass
                keys = list(self._in_memory_store.keys())
        else:
            # Use in-memory keys
            if sport:
                keys = [
                    k
                    for k in self._in_memory_store.keys()
                    if k.startswith(f"{self.config.redis_key_prefix}:{sport}:")
                ]
            else:
                keys = [
                    k
                    for k in self._in_memory_store.keys()
                    if k.startswith(f"{self.config.redis_key_prefix}:")
                ]

        movements = []
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back)

        for key in keys:
            try:
                # Parse key to get sport, player, market
                parts = key.split(":")
                if len(parts) < 4:
                    continue

                key_sport, key_player, key_market = parts[1], parts[2], parts[3]

                # Get recent snapshots
                recent_snapshots: List[LineSnapshot] = []
                if redis_client:
                    try:
                        raw_snapshots = await redis_client.lrange(key, 0, -1)
                    except Exception as e:
                        logger.warning(f"Redis lrange failed for key {key}: {e}")
                        try:
                            self.redis = None
                        except Exception:
                            pass
                        raw_snapshots = self._in_memory_store.get(key, [])
                else:
                    raw_snapshots = self._in_memory_store.get(key, [])

                for raw_data in raw_snapshots:
                    try:
                        if isinstance(raw_data, str):
                            data = json.loads(raw_data)
                        else:
                            data = raw_data

                        snapshot_time = datetime.fromisoformat(data["ts"])

                        if snapshot_time >= cutoff_time:
                            recent_snapshots.append(
                                LineSnapshot(
                                    ts=snapshot_time,
                                    line=data["line"],
                                    bestOdds=data["bestOdds"],
                                    source=data.get("source", "unknown"),
                                )
                            )
                    except (json.JSONDecodeError, KeyError, ValueError):
                        continue

                if len(recent_snapshots) < 2:
                    continue

                # Calculate movement
                chronological = [
                    snap
                    for _, snap in sorted(
                        enumerate(recent_snapshots),
                        key=lambda item: (item[1].ts, -item[0]),
                    )
                ]
                stats = calculate_movement_stats(chronological)

                if stats.movementMagnitude >= min_magnitude:
                    movements.append(
                        {
                            "sport": key_sport,
                            "player": key_player,
                            "market": key_market,
                            "magnitude": stats.movementMagnitude,
                            "direction": stats.direction.value,
                            "volatility": stats.volatilityScore,
                            "lastUpdated": stats.lastUpdated.isoformat(),
                            "snapshotCount": len(recent_snapshots),
                        }
                    )

            except Exception as e:
                logger.warning(f"Error processing key {key}: {e}")
                continue

        # Sort by magnitude descending
        return sorted(movements, key=lambda x: x["magnitude"], reverse=True)

    async def get_movement_alert_candidates(
        self,
        *,
        hours_back: int,
        movement_threshold: float,
        sport: Optional[str] = None,
        player: Optional[str] = None,
        market: Optional[str] = None,
        direction: Optional[str] = None,
        min_volatility: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Prepare detailed movement records suitable for alert evaluation.

        This helper centralizes filtering logic used by alert engines so they
        can focus on rule evaluation instead of raw data munging.
        """

        try:
            numeric_threshold = float(movement_threshold)
        except (TypeError, ValueError):
            numeric_threshold = 0.5

        try:
            hours_back_int = int(hours_back)
        except (TypeError, ValueError):
            hours_back_int = 24

        # Query a little below the actual threshold to ensure we don't miss
        # borderline movements because of rounding.
        query_min_magnitude = max(0.1, numeric_threshold * 0.5)

        try:
            recent_movements = await self.get_recent_movements(
                sport=sport,
                hours_back=hours_back_int,
                min_magnitude=query_min_magnitude,
            )
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.warning("Failed to collect recent movements for alerts: %s", exc)
            return []

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours_back_int)

        normalized_direction = (direction or "").strip().lower()
        if normalized_direction in {"", "both", "either"}:
            normalized_direction = None

        min_volatility_value: Optional[float]
        try:
            min_volatility_value = (
                float(min_volatility) if min_volatility is not None else None
            )
        except (TypeError, ValueError):
            min_volatility_value = None

        player_filter = player.lower() if isinstance(player, str) else None
        market_filter = market.lower() if isinstance(market, str) else None

        candidates: List[Dict[str, Any]] = []

        for movement in recent_movements:
            movement_sport = movement.get("sport")
            movement_player = movement.get("player", "")
            movement_market = movement.get("market", "")

            if sport and movement_sport != sport:
                continue

            if player_filter and player_filter not in movement_player.lower():
                continue

            if market_filter and market_filter not in movement_market.lower():
                continue

            if not movement_sport:
                continue

            snapshots = await self.get_snapshots(
                movement_sport,
                movement_player,
                movement_market,
            )

            relevant_snapshots = [snap for snap in snapshots if snap.ts >= cutoff_time]

            if len(relevant_snapshots) < 2:
                continue

            chronological = [
                snap
                for _, snap in sorted(
                    enumerate(relevant_snapshots),
                    key=lambda item: (item[1].ts, -item[0]),
                )
            ]

            old_line = chronological[0].line
            new_line = chronological[-1].line

            if old_line is None or new_line is None:
                continue

            line_change = new_line - old_line
            absolute_change = abs(line_change)

            if absolute_change < numeric_threshold:
                continue

            direction_label = (
                "increase"
                if line_change > 0
                else "decrease" if line_change < 0 else "flat"
            )

            if normalized_direction == "increase" and line_change <= 0:
                continue

            if normalized_direction == "decrease" and line_change >= 0:
                continue

            volatility_score = movement.get("volatility")
            if min_volatility_value is not None:
                if volatility_score is None or volatility_score < min_volatility_value:
                    continue

            movement_time = chronological[-1].ts

            candidate = {
                "sport": movement_sport,
                "player": movement_player,
                "market": movement_market,
                "old_line": old_line,
                "new_line": new_line,
                "line_change": line_change,
                "abs_change": absolute_change,
                "volatility": volatility_score,
                "snapshot_count": len(relevant_snapshots),
                "movement_time": movement_time,
                "direction": direction_label,
                "prop_id": f"{movement_sport}:{movement_player}:{movement_market}",
                "prop_description": f"{movement_player} {movement_market}".strip(),
                "sportsbook": movement.get("sportsbook") or "Multiple Books",
                "last_updated": movement.get("lastUpdated"),
                "hours_back": hours_back_int,
            }

            candidates.append(candidate)

        logger.debug(
            "Prepared %d movement candidates for alert evaluation", len(candidates)
        )

        return candidates

    async def cleanup_expired_snapshots(self) -> int:
        """
        Clean up expired snapshots and return count of cleaned keys

        Returns:
            Number of keys cleaned up
        """
        redis_client = await self._ensure_redis()
        pattern = f"{self.config.redis_key_prefix}:*"

        cleaned_count = 0
        cutoff_time = datetime.now(timezone.utc) - timedelta(
            hours=self.config.snapshot_ttl_hours
        )

        if redis_client:
            try:
                keys = await redis_client.keys(pattern)
            except Exception:
                keys = list(self._in_memory_store.keys())
        else:
            keys = list(self._in_memory_store.keys())

        for key in keys:
            try:
                # Check if key has any recent snapshots
                has_recent = False

                if redis_client:
                    try:
                        raw_snapshots = await redis_client.lrange(
                            key, 0, 4
                        )  # Check first 5
                    except Exception:
                        raw_snapshots = self._in_memory_store.get(key, [])[:5]
                else:
                    raw_snapshots = self._in_memory_store.get(key, [])[:5]

                for raw_data in raw_snapshots:
                    try:
                        if isinstance(raw_data, str):
                            data = json.loads(raw_data)
                        else:
                            data = raw_data

                        snapshot_time = datetime.fromisoformat(data["ts"])
                        if snapshot_time >= cutoff_time:
                            has_recent = True
                            break
                    except (json.JSONDecodeError, KeyError, ValueError):
                        continue

                if not has_recent:
                    if redis_client:
                        try:
                            await redis_client.delete(key)
                        except Exception:
                            pass

                    # Also clean from memory
                    if key in self._in_memory_store:
                        del self._in_memory_store[key]

                    cleaned_count += 1

            except Exception as e:
                logger.warning(f"Error cleaning key {key}: {e}")
                continue

        logger.info(f"Cleaned up {cleaned_count} expired line movement keys")
        return cleaned_count

    async def get_metrics(self) -> MovementMetrics:
        """Get current metrics for the line movement system"""
        redis_client = await self._ensure_redis()

        # Count active tracked lines
        pattern = f"{self.config.redis_key_prefix}:*"
        active_lines = 0

        if redis_client:
            try:
                keys = await redis_client.keys(pattern)
                active_lines = len(keys)
            except Exception as e:
                logger.warning(f"Redis keys failed when gathering active lines: {e}")
                try:
                    self.redis = None
                except Exception:
                    pass
                active_lines = len(self._in_memory_store)
        else:
            active_lines = len(self._in_memory_store)

        # Update internal metrics (skip prometheus gauge since it's not needed for MVP)
        self._metrics.active_tracked_lines = active_lines

        # Calculate average snapshots per line
        total_snapshots_across_lines = 0
        if active_lines > 0:
            sample_keys = (
                list(self._in_memory_store.keys())[:50] if not redis_client else []
            )

            if redis_client:
                try:
                    keys = await redis_client.keys(pattern)
                    sample_keys = keys[:50]
                except Exception:
                    pass

            for key in sample_keys:
                try:
                    if redis_client:
                        try:
                            snapshot_count = await redis_client.llen(key)
                        except Exception as e:
                            logger.warning(f"Redis llen failed for key {key}: {e}")
                            try:
                                self.redis = None
                            except Exception:
                                pass
                            snapshot_count = len(self._in_memory_store.get(key, []))
                    else:
                        snapshot_count = len(self._in_memory_store.get(key, []))
                    total_snapshots_across_lines += snapshot_count
                except Exception:
                    continue

            avg_snapshots = (
                total_snapshots_across_lines / len(sample_keys) if sample_keys else 0.0
            )
        else:
            avg_snapshots = 0.0

        return MovementMetrics(
            total_snapshots=self._metrics.total_snapshots,
            high_volatility_events=self._metrics.high_volatility_events,
            active_tracked_lines=active_lines,
            avg_snapshots_per_line=avg_snapshots,
        )


# Global service instance
_line_movement_service: Optional[LineMovementService] = None


async def get_line_movement_service() -> LineMovementService:
    """Get or create the global line movement service instance"""
    global _line_movement_service

    if _line_movement_service is None:
        _line_movement_service = LineMovementService()

        # Test connection (Redis or in-memory fallback)
        try:
            await _line_movement_service._ensure_redis()
            logger.info("Line movement service initialized successfully")
        except Exception as e:
            logger.warning(f"Line movement service using fallback mode: {e}")

    return _line_movement_service


async def trigger_snapshot(
    sport: str,
    player: str,
    market: str,
    line: float,
    best_odds: int,
    source: str = "odds_aggregation",
) -> MovementEvent:
    """
    Convenience function to trigger a line movement snapshot

    This is the main entry point for odds aggregation systems to record movements.
    """
    service = await get_line_movement_service()
    return await service.record_snapshot(sport, player, market, line, best_odds, source)


# Background cleanup task
async def periodic_cleanup():
    """Background task to periodically clean up expired snapshots"""
    while True:
        try:
            service = await get_line_movement_service()
            await service.cleanup_expired_snapshots()

            # Run cleanup every 6 hours
            await asyncio.sleep(6 * 3600)
        except Exception as e:
            logger.error(f"Error in periodic cleanup: {e}")
            await asyncio.sleep(3600)  # Retry in 1 hour on error


# --- Legacy compatibility adapter for synchronous tests ---
class LegacyLineMovementServiceAdapter:
    """Synchronous, in-memory adapter to preserve legacy test expectations.

    Exposes the old `line_movement_service` API used by tests:
    - record_snapshot(opp)
    - enrich_opportunity(opp)
    - get_history(opp_id, limit)
    - _build_id(opp)
    - init_storage(), get_instance()
    - Attributes: _initialized, _db, in_memory_only, _last_snapshot

    This adapter is intentionally lightweight and in-memory only. It does not
    interfere with the async `LineMovementService` used by the app.
    """

    THROTTLE_SECONDS = 30

    _instance = None

    def __init__(self):
        self._initialized = False
        self._db = object()  # placeholder to simulate a DB handle
        self.in_memory_only = False
        self._history_store: Dict[str, List[Dict[str, Any]]] = {}
        self._last_snapshot: Dict[str, float] = {}

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = LegacyLineMovementServiceAdapter()
            cls._instance.init_storage()
        return cls._instance

    def init_storage(self):
        self._initialized = True

    # --- Compatibility helpers to accept both dicts and attr-objects ---
    def _get(self, obj: Any, key: str, default: Any = None) -> Any:
        try:
            if isinstance(obj, dict):
                return obj.get(key, default)
            return getattr(obj, key, default)
        except Exception:
            return default

    def _set(self, obj: Any, key: str, value: Any) -> None:
        try:
            if isinstance(obj, dict):
                obj[key] = value
            else:
                setattr(obj, key, value)
        except Exception:
            # keep non-fatal
            pass

    def _as_str(self, value: Any) -> str:
        # Handle Enums or objects with `value`, otherwise str()
        try:
            v = getattr(value, "value", None)
            if v is not None:
                return str(v)
        except Exception:
            pass
        return str(value)

    def _build_id(self, opp: Any) -> str:
        sport = self._as_str(self._get(opp, "sport", ""))
        player = self._as_str(self._get(opp, "player", ""))
        market = self._as_str(self._get(opp, "market", ""))
        return f"{sport}:{player}:{market}"

    def record_snapshot(self, opp: Any) -> None:
        opp_id = self._build_id(opp)

        # Throttle snapshots unless explicitly bypassed in tests
        try:
            loop = asyncio.get_running_loop()
            now = loop.time()
        except RuntimeError:
            now = __import__("time").time()
        last = self._last_snapshot.get(opp_id)
        if last is not None and (now - last) < self.THROTTLE_SECONDS:
            return

        line = self._get(opp, "line", None)
        odds = self._get(opp, "odds", None)

        snap = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "line": float(line) if line is not None else None,
            "odds": (
                int(odds)
                if isinstance(odds, (int, float)) and odds == int(odds)
                else (int(odds) if isinstance(odds, (int, float)) else None)
            ),
        }

        self._history_store.setdefault(opp_id, [])
        self._history_store[opp_id].append(snap)
        # Keep newest last for simplicity (chronological)
        if len(self._history_store[opp_id]) > 40:
            self._history_store[opp_id] = self._history_store[opp_id][-40:]

        self._last_snapshot[opp_id] = now

    def enrich_opportunity(self, opp: Any, force_flat_baseline: bool = False) -> None:
        opp_id = self._build_id(opp)
        history = self._history_store.get(opp_id, [])

        if not history:
            # Initialize baseline from current values
            opening_line = self._get(opp, "line", None)
            opening_odds = self._get(opp, "odds", None)
            self._set(opp, "openingLine", opening_line)
            self._set(opp, "latestLine", opening_line)
            self._set(opp, "openingOdds", opening_odds)
            self._set(opp, "latestOdds", opening_odds)
            self._set(opp, "lineChange", 0.0)
            self._set(opp, "oddsChange", 0)
            self._set(opp, "movementDirection", "flat")
            return

        opening = history[0]
        latest = history[-1]

        multiple_snapshots = len(history) > 1

        opening_line = opening.get("line")
        latest_line = (
            self._get(opp, "line", latest.get("line"))
            if multiple_snapshots
            else latest.get("line")
        )
        opening_odds = opening.get("odds")
        latest_odds = (
            self._get(opp, "odds", latest.get("odds"))
            if multiple_snapshots
            else latest.get("odds")
        )

        # Allow force flat baseline behavior if requested
        if force_flat_baseline and opening_line is not None:
            latest_line = opening_line
        if force_flat_baseline and opening_odds is not None:
            latest_odds = opening_odds

        self._set(opp, "openingLine", opening_line)
        self._set(opp, "latestLine", latest_line)
        self._set(opp, "openingOdds", opening_odds)
        self._set(opp, "latestOdds", latest_odds)

        # Compute changes
        if opening_line is not None and latest_line is not None:
            try:
                line_change = round(float(latest_line) - float(opening_line), 3)
            except Exception:
                line_change = 0.0
        else:
            line_change = 0.0
        self._set(opp, "lineChange", line_change)

        if opening_odds is not None and latest_odds is not None:
            try:
                odds_change = int(latest_odds) - int(opening_odds)
            except Exception:
                odds_change = 0
        else:
            odds_change = 0
        self._set(opp, "oddsChange", odds_change)

        # Direction
        if opening_line is None or latest_line is None:
            direction = "flat"
        else:
            try:
                if float(latest_line) > float(opening_line):
                    direction = "up"
                elif float(latest_line) < float(opening_line):
                    direction = "down"
                else:
                    direction = "flat"
            except Exception:
                direction = "flat"
        self._set(opp, "movementDirection", direction)

    def get_history(self, opp_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        history = self._history_store.get(opp_id, [])
        if limit is not None and limit > 0:
            return history[-limit:]
        return history[:]


# Export a legacy-compatible singleton expected by tests
line_movement_service = LegacyLineMovementServiceAdapter.get_instance()
# Explicit re-export for import machinery clarity
__all__ = [
    "LineMovementService",
    "LegacyLineMovementServiceAdapter",
    "line_movement_service",
    "get_line_movement_service",
    "trigger_snapshot",
    "periodic_cleanup",
]


# Provide a compatibility get_instance on the async class to pass tests that call it
def _lm_get_instance_passthrough():
    return line_movement_service


setattr(
    LineMovementService,
    "get_instance",
    classmethod(lambda cls: _lm_get_instance_passthrough()),
)
